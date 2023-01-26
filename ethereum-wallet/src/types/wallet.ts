import { SigningGroup, SendPaymentTxParams } from "@dfns/bik";
import { EthereumWallet } from "../ethereum-wallet";

export type TrxParams = SendPaymentTxParams & {
  from?: string;
};

export type EstimateGasParams = { to: string; value: string } & {
  gasPrice?: string;
  data?: string;
  from?: string;
};

export type RawTransaction = EstimateGasParams & {
  nonce?: number;
  gasLimit?: string;
  v?: string;
  r?: string;
  s?: string;
};

export type ContractAddresses = { [key: string]: string };

export type EthereumWalletConstructor = {
  new (signer: SigningGroup): EthereumWallet;
};

export type WalletConfig = {
  nodeUrl: string;
  chainId?: number;
};
