import { ContractAddresses } from "./types/wallet";
import { MAINNET } from "./constants";

const contractAddressesMainnet = {
  dai: "address", // decimals: 18
  usdt: "address", // decimals: 6
  usdc: "address", // decimals: 6
  jeur: "address", // decimals: 18
  jchf: "address", // decimals: 18
  jgbp: "address", // decimals: 18
  wbtc: "address", // decimals: 8
  "1inch": "address",
  aave: "address",
  bat: "address",
  comp: "address",
  link: "address",
  mkr: "address",
  sushi: "address",
  uni: "address",
} as ContractAddresses;

const contractAddressTesnet = {
  link: "address",
  tb2y: "address",
  eura: "address",
  dfns: "address",
} as ContractAddresses;

export const contractAddresses = MAINNET
  ? contractAddressesMainnet
  : contractAddressTesnet;
