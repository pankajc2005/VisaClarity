import { expect, test, describe, spyOn } from "bun:test";
import { convertCurrency } from "./exchange-rate.server";

describe("convertCurrency", () => {
  const mockRates = {
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.75,
    JPY: 110.0,
  };

  test("converts same currency", () => {
    expect(convertCurrency(100, "USD", "USD", mockRates)).toBe(100);
    expect(convertCurrency(100, "EUR", "EUR", mockRates)).toBe(100);
  });

  test("converts USD to another currency", () => {
    // 100 USD to EUR = 100 / 1.0 * 0.85 = 85
    expect(convertCurrency(100, "USD", "EUR", mockRates)).toBe(85);
  });

  test("converts from another currency to USD", () => {
    // 85 EUR to USD = 85 / 0.85 * 1.0 = 100
    expect(convertCurrency(85, "EUR", "USD", mockRates)).toBe(100);
  });

  test("converts between two non-USD currencies", () => {
    // 100 EUR to GBP
    // 100 / 0.85 USD = 117.647... USD
    // 117.647... USD * 0.75 GBP = 88.235... GBP
    const result = convertCurrency(100, "EUR", "GBP", mockRates);
    expect(result).toBeCloseTo(88.235, 3);
  });

  test("handles lowercase currency codes", () => {
    expect(convertCurrency(100, "usd", "eur", mockRates)).toBe(85);
  });

  test("handles whitespace in currency codes", () => {
    expect(convertCurrency(100, " USD ", " EUR ", mockRates)).toBe(85);
  });

  test("uses fallback rates if missing from provided rates", () => {
    // INR is missing from mockRates, so it should use LOCAL_FALLBACK_RATES (which has INR: 83.5)
    const result = convertCurrency(1, "USD", "INR", mockRates);
    expect(result).toBe(83.5);
  });

  test("returns original amount if rate is missing from both provided and fallback rates", () => {
    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});

    const result = convertCurrency(100, "USD", "XYZ", mockRates);

    expect(result).toBe(100);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[exchange-rate] Missing rate for conversion USD -> XYZ. Using fallback 1.0.",
    );

    consoleSpy.mockRestore();
  });
});
