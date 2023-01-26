import {
  WalletInterface,
  SigningGroup,
  getAddress,
  getBalances,
  getTransactions,
  submitTransaction,
} from "@dfns/bik";
import {
  BodyParam,
  BusinessLogic,
  BusinessLogicMap,
  LambdaContext,
  TechnicalError,
  UserAuthDetails,
} from "@dfns/cloud-library";

const handleErrors =
  (handler: BusinessLogic) =>
  async (
    body?: BodyParam,
    query?: any,
    auth?: UserAuthDetails,
    lambdaContext?: LambdaContext
  ): Promise<any> => {
    try {
      // this needs to be await to make sure the exception gets evaluated in the try/catch
      const res = await handler(body, query, auth, lambdaContext);
      return res;
    } catch (error) {
      throw TechnicalError.genericError(400, (error as Error)?.message?.replace('Returned error: ', ''));
    }
  };

export function registerRoutes(
  businessLogicMap: BusinessLogicMap,
  prefix: string,
  walletImplementation: { new (signingGroup: SigningGroup): WalletInterface }
) {
  businessLogicMap.registerOperation(getAddress(walletImplementation), {
    http: ["GET", `${prefix}/wallets/:walletId/address`],
  });

  businessLogicMap.registerOperation(getBalances(walletImplementation), {
    http: ["GET", `${prefix}/wallets/:walletId/balances?:assets`],
  });

  businessLogicMap.registerOperation(getTransactions(walletImplementation), {
    http: ["GET", `${prefix}/wallets/:walletId/transactions?:assets`],
  });

  businessLogicMap.registerOperation(
    handleErrors(submitTransaction(walletImplementation)),
    {
      http: ["POST", `${prefix}/wallets/:walletId/transactions`],
    }
  );
}
