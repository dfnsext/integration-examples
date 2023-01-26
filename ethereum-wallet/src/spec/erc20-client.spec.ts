import { SigningGroup } from "@dfns/bik";
import { Ethereum } from "../ethereum-units";
import Web3 from "web3";
import { EthereumWallet } from "../ethereum-wallet";
import { ERC20_ABI } from "../constants";

// disable web3 warning logs
console.warn = jest.fn();

describe("erc20Wallet", () => {
  jest.setTimeout(80000);

  let signingGroup: SigningGroup;
  let wallet: EthereumWallet;
  let externalBalance: string;

  // Dfns test wallet with the ERC-20 DFNS tokens
  // Mnemonic: broom cluster skirt medal melt cage photo mushroom accuse ritual cotton dwarf
  // Private Key:0xfd9ae397efd5f8af7457fe1945d5b620db69983024b33b0fd250439e8aab609f
  // Public key:0x032eaadd6e69aae84443e7fe404cdef08a29558134dd110c92f564958b9071036e
  // address:0xA7CF18d4edd5ae6B569c17c97F47CA1A0D44Ba48

  const externalWalletPrivKey =
    "fd9ae397efd5f8af7457fe1945d5b620db69983024b33b0fd250439e8aab609f";

  const externalWallet = "0xA7CF18d4edd5ae6B569c17c97F47CA1A0D44Ba48";
  const contractAddress = "0x6584d12Fa281131739C8eAC1ab6bEC9feECb9fF0";
  let web3: any;

  const getBalance = (externalWallet: string): Promise<string> =>
    new Promise((resolve, reject) => {
      web3.eth.getBalance(externalWallet, function (err: any, result: any) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log(web3.utils.fromWei(result, "ether") + " ETH");
          resolve(web3.utils.fromWei(result, "ether"));
        }
      });
    });

  beforeAll(async () => {
    const walletId =
      "walletId-abc";
    const auth =
      "auth-xyz";
    const token = `Bearer ${auth}`;
    const signingGroup = await SigningGroup.builder()
      .setWalletId(walletId)
      .setToken(token)
      .setCoordinatorUrl("url")
      .build();

    const Wallet = EthereumWallet.withConfig(EthereumWallet.ethereumConfig());
    wallet = new Wallet(signingGroup);

    // init external wallet
    web3 = new Web3(
      new Web3.providers.HttpProvider(EthereumWallet.ethereumConfig().nodeUrl)
    );

    externalBalance = await getBalance(externalWallet);

    if (Number.parseFloat(externalBalance) < Number.parseFloat("5")) {
      throw new Error(
        "Insufficient funds in external wallet to perform all tests"
      );
    }
  });

  it("should have 0 DFNS tokens and 0 ETH", async () => {
    const address = await wallet.getAddress();
    console.log(address);
    let minABI = [
      // balanceOf
      {
        constant: true,
        inputs: [{ name: "_owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "balance", type: "uint256" }],
        type: "function",
      },
      // decimals
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function",
      },
    ];
    let contract = new web3.eth.Contract(minABI, contractAddress);
    expect(await contract.methods.balanceOf(address).call()).toEqual("0");
  });

  it("send amount from external to our wallet and check balance", async () => {
    const address = await wallet.getAddress();
    const contract = new web3.eth.Contract(ERC20_ABI, contractAddress);
    var count = await web3.eth.getTransactionCount(externalWallet);
    let rawTransaction = {
      from: externalWallet,
      nonce: "0x" + count.toString(16),
      gasPrice: "0x003B9ACA00",
      gasLimit: "0x250CA",
      to: contractAddress,
      value: "0x0",
      data: contract.methods
        .transfer(address, new Ethereum("1").toString(Ethereum.UNIT.WEI))
        .encodeABI(),
    };

    let privKey = Buffer.from(externalWalletPrivKey, "hex");
    // @ts-ignore
    let tx = new Transaction(rawTransaction, { chain: "rinkeby" });
    tx.sign(privKey);
    let serializedTx = tx.serialize();
    try {
      let receipt = await web3.eth.sendSignedTransaction(
        "0x" + serializedTx.toString("hex")
      );
      console.log(`Receipt info:  ${JSON.stringify(receipt, null, "\t")}`);
    } catch (error) {
      console.log("Problem with sending funds to the contract: ", error);
    }

    // Here we send ETH from the external wallet to the internal one
    const createTransaction = await web3.eth.accounts.signTransaction(
      {
        from: externalWallet,
        to: address,
        value: web3.utils.toWei("0.1", "ether"),
        gas: "90000",
      },
      externalWalletPrivKey
    );
    const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
    );
    // We wait for the network to confirm the transactions
    await new Promise((resolve) => setTimeout(resolve, 9000));

    // Token balance
    expect(
      await contract.methods.balanceOf(await wallet.getAddress()).call()
    ).toEqual("1000000000000000000");
  });

  it("should send amount from our wallet to external wallet and check balance", async () => {
    const to = "0x956fbb0c88b3c597D4afdBAB3e26939051Ff6725";
    const value = "1";
    const res = await wallet.sendPaymentTx({ to, value, asset: "dfns" });

    expect(res).toBeDefined();

    // Dirty way of waiting for the transaction we just sent to be taken into account
    await new Promise((resolve) => setTimeout(resolve, 18000));
    let contract = new web3.eth.Contract(ERC20_ABI, contractAddress);
    expect(
      await contract.methods.balanceOf(await wallet.getAddress()).call()
    ).toEqual("0");
  });
});
