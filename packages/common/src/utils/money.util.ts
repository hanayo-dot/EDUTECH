import Decimal from 'decimal.js';

// Configure Decimal precision for high-integrity monetary operations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Monetary utilities enforcing strict decimal arithmetic (zero floating-point math).
 */
export class MoneyUtil {
  /**
   * Parse input value to a validated Decimal instance.
   */
  static toDecimal(value: string | number | Decimal): Decimal {
    try {
      return new Decimal(value);
    } catch {
      throw new Error(`Invalid monetary amount: ${value}`);
    }
  }

  /**
   * Format a monetary value to standard two-decimal string format (e.g. "12500.00").
   */
  static format(value: string | number | Decimal): string {
    return this.toDecimal(value).toFixed(2);
  }

  /**
   * Adds multiple monetary amounts with exact decimal precision.
   */
  static add(...amounts: (string | number | Decimal)[]): Decimal {
    return amounts.reduce<Decimal>((acc, cur) => acc.plus(this.toDecimal(cur)), new Decimal(0));
  }

  /**
   * Subtracts subtrahend from minuend with exact decimal precision.
   */
  static subtract(minuend: string | number | Decimal, subtrahend: string | number | Decimal): Decimal {
    return this.toDecimal(minuend).minus(this.toDecimal(subtrahend));
  }

  /**
   * Multiplies an amount by a factor (e.g. tax rate or fee multiplier).
   */
  static multiply(amount: string | number | Decimal, factor: string | number | Decimal): Decimal {
    return this.toDecimal(amount).times(this.toDecimal(factor));
  }

  /**
   * Compare two monetary values:
   * Returns: -1 if a < b, 0 if a == b, 1 if a > b.
   */
  static compare(a: string | number | Decimal, b: string | number | Decimal): number {
    return this.toDecimal(a).comparedTo(this.toDecimal(b));
  }

  /**
   * Returns true if amount is strictly greater than zero.
   */
  static isPositive(amount: string | number | Decimal): boolean {
    return this.toDecimal(amount).isPositive() && !this.toDecimal(amount).isZero();
  }
}
