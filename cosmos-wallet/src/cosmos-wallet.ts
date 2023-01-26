import { SendPaymentTxParams, WalletInterface, TransactionsHistory } from "@dfns/bik";
import { SigningStargateClient } from "@cosmjs/stargate";
import { Coin } from "@cosmjs/stargate/build/codec/cosmos/base/v1beta1/coin";
import { CosmosSigner } from "./cosmos-signer";
import { FIGMENT_API_KEY, MAINNET } from "./config";

export class CosmosWallet implements WalletInterface {
  private client: SigningStargateClient;
  private readonly rpcEndpoint: string;

  constructor(private readonly signer: CosmosSigner) {
    this.signer = signer;
    this.rpcEndpoint = MAINNET
      ? `url1`
      : "url2";
  }

  async init() {
    if (this.client) return;
    this.client = await SigningStargateClient.connectWithSigner(
      this.rpcEndpoint,
      this.signer
    );
  }

  async getAddress(): Promise<string> {
    return this.signer.getAddress();
  }

  async getBalance(): Promise<string> {
    await this.init();
    return this.getOneBalance("ucosm");
  }

  async getOneBalance(denom: string): Promise<string> {
    await this.init();
    const balance = await this.client.getBalance(
      await this.getAddress(),
      denom
    );
    return balance.amount + " " + balance.denom;
  }

  async getAllBalances(): Promise<readonly Coin[]> {
    let address = await this.getAddress();
    return this.client.getAllBalances(address);
  }

  async getTransactions(): Promise<TransactionsHistory> {
    await this.init();
    throw new Error("Method not implemented.");
  }

  async sendPaymentTx({ to, value }: SendPaymentTxParams): Promise<string> {
    await this.init();

    const from = await this.getAddress();
    const memo = "";
    const res = await this.client.sendTokens(
      from,
      to,
    [{
          denom: "uphoton",
          amount: value || "0",
      }],
      memo
    );
    return res.transactionHash;
  }
}
