export const MAINNET = !!JSON.parse(
  String(process.env.MAINNET || false).toLowerCase()
);
export const FIGMENT_API_KEY =
  process.env.FIGMENT_API_KEY || "apikey";
