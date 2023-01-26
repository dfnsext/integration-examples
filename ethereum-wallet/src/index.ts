import { createRouter } from "@dfns/bik";
import { createLambdaHandler } from "@dfns/cloud-library";
import { EthereumWallet } from "./ethereum-wallet";
import { registerRoutes } from "./router";

const ethCommonPrefix = `/mpc/networks/eth`;
const bscCommonPrefix = `/mpc/networks/bnb`;
const polygonCommonPrefix = `/mpc/networks/matic`;

const router = createRouter();

registerRoutes(
  router,
  ethCommonPrefix,
  EthereumWallet.withConfig(EthereumWallet.ethereumConfig())
);
registerRoutes(
  router,
  bscCommonPrefix,
  EthereumWallet.withConfig(EthereumWallet.bscConfig())
);
registerRoutes(
  router,
  polygonCommonPrefix,
  EthereumWallet.withConfig(EthereumWallet.polygonConfig())
);

export const handler = createLambdaHandler(router);
