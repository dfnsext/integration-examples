import Web3 from "web3";
const RLP = require("rlp");
import {
  EstimateGasParams,
  EthereumWalletConstructor,
  RawTransaction,
  TrxParams,
  WalletConfig,
} from "./types/wallet";
import { ec } from "elliptic";

import {
  TransactionsHistory,
  SigningGroup,
  WalletInterface,
  Signature,
  SendPaymentTxParams,
} from "@dfns/bik";
import {
  ERC20_ABI,
  FIGMENT_API_KEY,
  INFURA_API_KEY,
  MAINNET,
} from "./constants";
import { contractAddresses } from "./erc20-contract-addresses";

export class EthereumWallet implements WalletInterface {
  protected rlpOrder: string[];
  protected web3: Web3;
  protected signer: SigningGroup;
  protected publicKey: ec.KeyPair;
  private readonly chainId: number;

  constructor(
    private readonly nodeUrl?: string,
    chainId?: number,
    signer?: SigningGroup
  ) {
    this.web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl as string));
    this.rlpOrder = [
      "nonce",
      "gasPrice",
      "gasLimit",
      "to",
      "value",
      "data",
      "v",
      "r",
      "s",
    ];
    this.chainId = chainId as number;
    this.signer = signer as SigningGroup;
  }

  static ethereumConfig(): WalletConfig {
    const nodeUrl = MAINNET
      ? `url`
      : `url+apikey`;
    const chainId = MAINNET ? 1 : 4;
    return { nodeUrl, chainId };
  }

  static bscConfig(): WalletConfig {
    const nodeUrl = MAINNET
      ? `url+apikey`
      : "url+apikey";
    const chainId = MAINNET ? 56 : 97;
    return { nodeUrl, chainId };
  }

  static polygonConfig(): WalletConfig {
    const nodeUrl = MAINNET
      ? `url+apikey`
      : `url+apikey`;
    const chainId = MAINNET ? 137 : 80001;
    return { nodeUrl, chainId };
  }

  static withConfig({
    nodeUrl,
    chainId,
  }: WalletConfig): EthereumWalletConstructor {
    return EthereumWallet.bind(null, nodeUrl, chainId);
  }

  getTransactions(_: string[] = []): Promise<TransactionsHistory> {
    throw new Error("Method not implemented.");
  }

  async getBalance(assets: string[] = []): Promise<string> {
    let address = await this.getAddress();
    if (!assets || assets.length < 1 || assets[0].toLowerCase() !== "eth") {
      return this.web3.eth.getBalance(address);
    }
    const contractAddress = contractAddresses[assets[0].toLowerCase()];
    const contract = new this.web3.eth.Contract(ERC20_ABI, contractAddress);
    return contract.methods.balanceOf(address).call();
  }

  async getAddress(): Promise<string> {
    const compressed = await this.signer.getPublicKey();
    if (!compressed) {
      throw new Error("Could not retrieve public key");
    }

    this.publicKey = new ec("secp256k1").keyFromPublic(
      compressed.toString("hex"),
      "hex"
    );

    const uncompressedKey = this.publicKey.getPublic(false, "hex");
    const hash = Web3.utils.keccak256(`0x${uncompressedKey.slice(2)}`);
    return Web3.utils.toChecksumAddress(`0x${hash.substring(26)}`);
  }

  async sendPaymentTx({
    to,
    value,
    asset,
  }: SendPaymentTxParams): Promise<string> {
    let from = await this.getAddress();
    let trx = await this._buildTransaction({
      from,
      to,
      value,
      asset,
    });
    const trxHash = await this.buildTrxHash(trx);
    const signature = await this.signer.sign(Buffer.from(trxHash, "hex"));
    const rawTransaction = await this.buildSignedTrx(trx, signature);
    return new Promise((resolve, reject) => {
      this.web3.eth
        .sendSignedTransaction(rawTransaction)
        .once("transactionHash", (txHash) => resolve(txHash))
        .catch((e) => reject(e));
    });
  }

  _addTrxData(trx: EstimateGasParams, asset: string): void {
    const normalizedAsset = asset.toLowerCase();
    if (!Object.keys(contractAddresses).includes(normalizedAsset)) {
      return;
    }
    let contractAddress = contractAddresses[normalizedAsset];
    const contract = new this.web3.eth.Contract(ERC20_ABI, contractAddress);
    const value = this.web3.utils.hexToNumberString(trx.value as string);
    trx.data = contract.methods.transfer(trx.to, value).encodeABI();
    trx.value = this.web3.utils.toHex("0x0").replace(/^0x0+/, "0x");
    trx.to = contractAddress;
  }

  async _buildTransaction({
    from,
    to,
    value,
    asset,
  }: TrxParams): Promise<RawTransaction> {
    const trx = await this._buildTransferData({ from, value, to });
    this._addTrxData(trx, asset);
    let gasLimit = await this.estimateGas({ from, ...trx });
    return {
      ...trx,
      gasLimit,
    };
  }

  async estimateGas(trx: EstimateGasParams): Promise<string> {
    let gasLimit = await this.web3.eth.estimateGas(trx);
    return this.web3.utils.toHex(gasLimit).replace(/^0x0+/, "0x");
  }

  private async _buildTransferData({
    from,
    value,
    to,
  }: EstimateGasParams): Promise<RawTransaction> {
    const nonce = await this.getTransactionCount(from as string);
    const gasPrice = this.web3.utils
      .toHex(await this.getGasPrice())
      .replace(/^0x0+/, "0x");
    value = this.web3.utils.toWei(value as string, "ether");
    value = this.web3.utils.toHex(value).replace(/^0x0+/, "0x");
    const v = this.web3.utils.toHex(this.chainId);
    return { nonce, gasPrice, value, v, to };
  }

  async buildSignedTrx(unsignedTrx: RawTransaction, signature: Signature) {
    unsignedTrx.v = this.web3.utils.toHex(
      this.chainId * 2 + (35 + parseInt(signature.recid))
    );
    unsignedTrx.s = this.web3.utils.toHex(signature.s);
    unsignedTrx.r = this.web3.utils.toHex(signature.r);

    // @ts-ignore
    let input = this.rlpOrder.map((k) => unsignedTrx[k]);
    const tx = RLP.encode(input);
    return `0x${tx.toString("hex")}`;
  }

  async buildTrxHash(transaction: object) {
    // @ts-ignore
    const entries = this.rlpOrder.map((k) => transaction[k]);
    const unsignedTransaction = RLP.encode(entries).toString("hex");
    return this.web3.utils
      .keccak256(`0x${unsignedTransaction}`)
      .replace("0x", "");
  }

  async getTransactionCount(address: string) {
    return this.web3.eth.getTransactionCount(address);
  }

  async getGasPrice() {
    return this.web3.eth.getGasPrice();
  }
}
