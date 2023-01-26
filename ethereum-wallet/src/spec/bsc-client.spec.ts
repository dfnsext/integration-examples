import Web3 from "web3";
import { SigningGroup } from "@dfns/bik";
import { EthereumWallet } from "../ethereum-wallet";
import { Ethereum } from "../ethereum-units";

// disable web3 warning logs
console.warn = jest.fn();

describe("bnbWallet", () => {
  jest.setTimeout(500000);
  let wallet: EthereumWallet;
  const externalWalletPrivKey =
    "";
  const externalWallet = "";
  let web3: any;

  beforeAll(async () => {
    const walletId =
      "";
    const auth = 'auth'
    const token = `Bearer ${auth}`;
    const signingGroup = await SigningGroup.builder()
      .setWalletId(walletId)
      .setToken(token)
      .setCoordinatorUrl("url")
      .build();

    const BnbWallet = EthereumWallet.withConfig(EthereumWallet.bscConfig());
    wallet = new BnbWallet(signingGroup);
    web3 = new Web3(
      new Web3.providers.HttpProvider(EthereumWallet.bscConfig().nodeUrl)
    );
  });

  it("balance should be zero ", async () => {
    expect(await wallet.getBalance()).toEqual("0");
  });

  it("send amount from external to our wallet and check balance", async () => {
    const address = await wallet.getAddress();
    const createTransaction = await web3.eth.accounts.signTransaction(
      {
        from: externalWallet,
        to: address,
        value: web3.utils.toWei("0.01", "ether"),
        gas: "22000",
      },
      externalWalletPrivKey
    );
    const createReceipt = await web3.eth.sendSignedTransaction(
      createTransaction.rawTransaction
    );
    expect(createReceipt).toBeTruthy();
    expect(await wallet.getBalance()).toEqual(
      new Ethereum("0.01").toString(Ethereum.UNIT.WEI)
    );
  });

  const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  it("should send amount from our wallet to external wallet and check balance", async () => {
    const tx = await wallet.sendPaymentTx({
      to: externalWallet,
      value: "0.005",
      asset: "bsc",
    });
    expect(tx).toBeTruthy();

    let receipt;
    while (!receipt) {
      receipt = await web3.eth.getTransactionReceipt(tx);
      await sleep(1000);
    }

    expect(Number(await wallet.getBalance())).toBeGreaterThan(
      new Ethereum("0.004").toNumber(Ethereum.UNIT.WEI)
    );
  });
});
