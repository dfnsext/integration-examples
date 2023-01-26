import Decimal from "decimal.js";

const wei = new Decimal(10).toPower(18);
const gwei = new Decimal(10).toPower(9);

function invalidNumber(number: string) {
  return typeof number === "undefined" || Number.isNaN(number);
}

const UNIT = {
  WEI: "wei",
  GWEI: "gwei",
};

export class Ethereum {
  private readonly amount: Decimal;
  public static UNIT = UNIT;
  constructor(amount: number | string | Decimal = 0) {
    this.amount = new Decimal(amount);
  }

  static fromWei(amount: string) {
    if (invalidNumber(amount)) {
      throw new Error("Invalid amount");
    }

    const converted = new Decimal(amount).dividedBy(wei);
    return new Ethereum(converted);
  }

  static fromGwei(amount: string) {
    if (invalidNumber(amount)) {
      throw new Error("Invalid amount");
    }

    const converted = new Decimal(amount).dividedBy(gwei);
    return new Ethereum(converted);
  }

  toNumber(unit: string): number {
    const amount = unit ? this.toUnit(unit) : this.amount;
    return amount.toNumber();
  }

  toString(unit?: string, format?: string): string {
    const amount = unit ? this.toUnit(unit) : this.amount;

    if (!format) {
      return amount.toString();
    }

    switch (format) {
      case "hex":
        return amount.toHex();
      default:
        throw new Error("Invalid format");
    }
  }

  toUnit(unit?: string): Decimal {
    switch (unit) {
      case UNIT.WEI:
        return this.amount.times(wei);
      case UNIT.GWEI:
        return this.amount.times(gwei);
      default:
        throw new Error("Invalid unit");
    }
  }
}
