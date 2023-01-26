import { createRouter, registerRoutes, SigningGroup } from "@dfns/bik";
import { createLambdaHandler } from "@dfns/cloud-library";
import { CosmosWallet } from "./cosmos-wallet";
import { CosmosSigner } from "./cosmos-signer";

const router = createRouter();

class LambdaWalletCosmosWallet extends CosmosWallet {
  constructor(signingGroup: SigningGroup) {
    super(new CosmosSigner(signingGroup));
  }
}

registerRoutes(router, `/mpc/networks/atom`, LambdaWalletCosmosWallet);

export const handler = createLambdaHandler(router);
