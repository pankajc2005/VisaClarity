import { describe, it, expect } from "bun:test";
import { getConversionPromptContext } from "./exchange-rate.server";

describe("getConversionPromptContext", () => {
  it("filters out non-target currencies", () => {
    const rates = {
      USD: 1,
      EUR: 0.85,
      UNKNOWN: 1.5,
    };
    const result = getConversionPromptContext(rates);

    expect(result).toContain('"USD": 1');
    expect(result).toContain('"EUR": 0.85');
    expect(result).not.toContain('"UNKNOWN"');
  });

  it("rounds rates to 4 decimal places", () => {
    const rates = {
      USD: 1,
      GBP: 0.7345678,
      INR: 82.12344,
      JPY: 110.12345,
    };
    const result = getConversionPromptContext(rates);

    expect(result).toContain('"GBP": 0.7346');
    expect(result).toContain('"INR": 82.1234');
    expect(result).toContain('"JPY": 110.1235'); // rounding .12345 to .1235
  });

  it("formats the output string correctly", () => {
    const rates = { USD: 1, CAD: 1.25 };
    const result = getConversionPromptContext(rates);

    expect(result).toStartWith("EXCHANGE RATES (Base USD):\nUse these EXACT exchange rates for currency conversions (calculated as AmountB = AmountA * (RateB / RateA)):");

    // The JSON output should be properly formatted
    const expectedJson = JSON.stringify({ USD: 1, CAD: 1.25 }, null, 2);
    expect(result).toContain(expectedJson);
  });

  it("handles empty rates object", () => {
    const rates = {};
    const result = getConversionPromptContext(rates);

    const expectedJson = JSON.stringify({}, null, 2);
    expect(result).toContain(expectedJson);
  });

  it("handles rates exactly matching target currencies", () => {
    const rates = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.75,
        INR: 82.5,
        CAD: 1.35,
        AUD: 1.5,
        SGD: 1.35,
        NZD: 1.6,
        JPY: 145.5,
        CNY: 7.2,
        CHF: 0.9,
        ZAR: 18.5,
        MXN: 17.5,
        BRL: 5.0,
        AED: 3.67,
        SAR: 3.75,
        MYR: 4.65,
        THB: 35.5,
        IDR: 15500.5,
        PHP: 56.5,
        KRW: 1350.5,
        TRY: 30.5,
        SEK: 10.5,
        NOK: 10.5,
        DKK: 6.8,
        PLN: 4.0,
        HUF: 350.5,
        CZK: 23.5,
        ILS: 3.7,
        HKD: 7.8,
        TWD: 31.5,
        VND: 24500.5,
        PKR: 280.5,
        EGP: 30.9,
        ARS: 850.5,
        CLP: 950.5,
        COP: 3950.5,
        PEN: 3.8,
        UAH: 38.5,
        NGN: 1150.5,
    };

    const result = getConversionPromptContext(rates);
    expect(result).toContain('"USD": 1');
    expect(result).toContain('"EUR": 0.85');
    // Ensure all 40 currencies are processed correctly.
    // Instead of exhaustive string matching, we check if the string representation contains all.
    for(const currency in rates) {
        expect(result).toContain(`"${currency}":`);
    }
  });
});
