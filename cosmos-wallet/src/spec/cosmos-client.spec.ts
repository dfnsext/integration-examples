import { SigningGroup } from "@dfns/bik";
import axios from "axios";

import { CosmosWallet } from "../cosmos-wallet";
import { SigningStargateClient } from "@cosmjs/stargate";
import { CosmosSigner } from "../cosmos-signer";

describe("cosmos", () => {
  jest.setTimeout(70000);
  let wallet: CosmosWallet;
  let externalBalance: string;
  let clientExternal: SigningStargateClient;
  const externalWalletAddress = "address-xyz";

  beforeAll(async () => {
    const walletId =
      "walletId";
    const auth =
      "";
    const token = `Bearer ${auth}`;
    const signer = await SigningGroup.builder()
      .setWalletId(walletId)
      .setToken(token)
      .setCoordinatorUrl("url")
      .build();

    wallet = new CosmosWallet(new CosmosSigner(signer));
  });

  it("creates cosmos address", async () => {
    const address = await wallet.getAddress();
    expect(address).toBeDefined();
    expect(await wallet.getAddress()).toEqual(address);
  });

  it("balance should be zero", async () => {
    expect(await wallet.getOneBalance("ucosm")).toEqual("0 ucosm");
  });

  it("get all balances should be zero", async () => {
    expect(await wallet.getAllBalances()).toEqual([]);
  });

  it("balance should equal getOneBalance", async () => {
    expect(await wallet.getBalance()).toEqual(
      await wallet.getOneBalance("ucosm")
    );
  });

  it("send amount from faucet to our wallet and check balance", async () => {
    const address = await wallet.getAddress();
    const res = await axios.post("url", {
      address,
    });
    expect(res).toBeDefined();
    expect(res.status).toEqual(200);
    expect(await wallet.getOneBalance("uphoton")).toEqual("100000000 uphoton");
  });

  it("should send amount from our wallet to external wallet and check balance", async () => {
    const tx = await wallet.sendPaymentTx({
      to: externalWalletAddress,
      value: "2000",
      asset: "atom",
    });
    expect(tx).toBeDefined();
    expect(+externalBalance + 8000).toEqual(
      (await clientExternal.getBalance(externalWalletAddress, "ucosm")).amount
    );
    expect(await wallet.getOneBalance("ucosm")).toEqual("0 ucosm");
  });
});
