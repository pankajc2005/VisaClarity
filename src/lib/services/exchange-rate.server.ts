import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ExchangeRatesRow = {
  base_currency: string;
  rates: Record<string, number>;
  last_updated_at: string;
  fetching_since: string | null;
};

// Major fallback rates to ensure high availability if all external API calls fail
const LOCAL_FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.5,
  CAD: 1.37,
  AUD: 1.51,
  SGD: 1.35,
  AED: 3.67,
  CNY: 7.25,
  JPY: 156.0,
  CHF: 0.89,
  NZD: 1.63,
  ZAR: 18.5,
  MXN: 17.8,
  BRL: 5.3,
};

// In-memory cache for mock test mode (BLOG_AGENT_LOCAL_TEST=1)
let mockCache: {
  rates: Record<string, number>;
  last_updated_at: string;
  fetching_since: string | null;
} | null = null;

const isMock = process.env.BLOG_AGENT_LOCAL_TEST === "1";

/**
 * Fetch latest exchange rates from exchangerate-api.com or open.er-api.com fallback.
 */
async function fetchLatestRates(apiKey?: string): Promise<Record<string, number>> {
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    : `https://open.er-api.com/v6/latest/USD`;

  console.log(
    `[exchange-rate] Fetching rates from: ${apiKey ? "Authenticated API" : "Open Access API"}`,
  );

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch exchange rates: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.result !== "success") {
    throw new Error(`Exchange Rate API returned error: ${data["error-type"] || "unknown"}`);
  }

  const rates = data.conversion_rates || data.rates;
  if (!rates || typeof rates !== "object") {
    throw new Error("Invalid exchange rates format in API response");
  }

  return rates as Record<string, number>;
}

/**
 * Ensures the USD row exists in the exchange_rates cache table.
 */
async function ensureRowExists(): Promise<void> {
  if (isMock) {
    if (!mockCache) {
      mockCache = {
        rates: LOCAL_FALLBACK_RATES,
        last_updated_at: new Date(0).toISOString(),
        fetching_since: null,
      };
    }
    return;
  }

  const { data: existing, error: selectErr } = await supabaseAdmin
    .from("exchange_rates" as any)
    .select("base_currency")
    .eq("base_currency", "USD")
    .maybeSingle();

  if (selectErr) {
    console.warn("[exchange-rate] Error checking if row exists:", selectErr.message);
  }

  if (!existing) {
    const { error: insertErr } = await supabaseAdmin.from("exchange_rates" as any).upsert(
      {
        base_currency: "USD",
        rates: LOCAL_FALLBACK_RATES,
        last_updated_at: new Date(0).toISOString(), // far past to force immediate update
        fetching_since: null,
      },
      { onConflict: "base_currency" },
    );

    if (insertErr) {
      console.warn("[exchange-rate] Failed to insert initial USD row:", insertErr.message);
    }
  }
}

/**
 * Retrieves cached exchange rates (relative to USD), triggering a background refresh
 * if expired (>24 hours) or missing, with pessimistic concurrency lock.
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  const apiKey = process.env.EXCHANGERATE_API_KEY || "";

  // 1. Ensure cache row exists
  await ensureRowExists();

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

  let acquiredLock = false;

  if (isMock) {
    // Mock Mode: Lock check using local state
    const needsRefresh = !mockCache || mockCache.last_updated_at < twentyFourHoursAgo;
    const isLocked =
      mockCache && mockCache.fetching_since && mockCache.fetching_since >= twoMinutesAgo;

    if (needsRefresh && !isLocked) {
      mockCache!.fetching_since = now.toISOString();
      acquiredLock = true;
    }
  } else {
    // Live Mode: Try to acquire the fetch lock in Postgres (atomic conditional update)
    const { data: lockResult, error: lockErr } = await supabaseAdmin
      .from("exchange_rates" as any)
      .update({ fetching_since: now.toISOString() })
      .eq("base_currency", "USD")
      .lt("last_updated_at", twentyFourHoursAgo)
      .or(`fetching_since.is.null,fetching_since.lt.${twoMinutesAgo}`)
      .select();

    if (lockErr) {
      console.warn("[exchange-rate] Lock acquisition query failed:", lockErr.message);
    }

    acquiredLock = lockResult && lockResult.length > 0;
  }

  if (acquiredLock) {
    try {
      const fetchedRates = await fetchLatestRates(apiKey);

      if (isMock) {
        mockCache = {
          rates: fetchedRates,
          last_updated_at: new Date().toISOString(),
          fetching_since: null,
        };
      } else {
        const { error: saveErr } = await supabaseAdmin
          .from("exchange_rates" as any)
          .update({
            rates: fetchedRates,
            last_updated_at: new Date().toISOString(),
            fetching_since: null,
          })
          .eq("base_currency", "USD");

        if (saveErr) {
          console.error("[exchange-rate] Failed to save fetched rates to DB:", saveErr.message);
          throw saveErr;
        }
      }

      console.log("[exchange-rate] Successfully updated cached exchange rates.");
      return fetchedRates;
    } catch (err) {
      console.error("[exchange-rate] Failed to refresh rates, releasing lock:", err);

      // Release the lock so other requests can attempt a refresh
      if (isMock) {
        if (mockCache) mockCache.fetching_since = null;
      } else {
        await supabaseAdmin
          .from("exchange_rates" as any)
          .update({ fetching_since: null })
          .eq("base_currency", "USD")
          .catch((e: Error) => console.error("[exchange-rate] Release lock failed:", e.message));
      }

      // Fallback: Try reading existing cache (even if expired)
      if (isMock) {
        if (mockCache && Object.keys(mockCache.rates).length > 0) {
          return mockCache.rates;
        }
      } else {
        const { data: fallbackRow } = await supabaseAdmin
          .from("exchange_rates" as any)
          .select("rates")
          .eq("base_currency", "USD")
          .maybeSingle();

        const cachedRates = (fallbackRow as any)?.rates;
        if (cachedRates && Object.keys(cachedRates).length > 0) {
          console.warn("[exchange-rate] Returning stale cached rates as fallback.");
          return cachedRates;
        }
      }

      console.warn("[exchange-rate] Returning hardcoded local fallback rates.");
      return LOCAL_FALLBACK_RATES;
    }
  }

  // 3. If lock not acquired, check if the existing rates are fresh.
  if (isMock) {
    if (mockCache && mockCache.rates && Object.keys(mockCache.rates).length > 0) {
      return mockCache.rates;
    }
  } else {
    const { data: currentCache } = await supabaseAdmin
      .from("exchange_rates" as any)
      .select("rates, last_updated_at, fetching_since")
      .eq("base_currency", "USD")
      .maybeSingle();

    const cache = currentCache as any;
    if (cache) {
      const isFresh =
        new Date(cache.last_updated_at).getTime() >= now.getTime() - 24 * 60 * 60 * 1000;

      if (isFresh && cache.rates && Object.keys(cache.rates).length > 0) {
        return cache.rates;
      }

      // Rates are expired but another worker is actively fetching (lock is held).
      // Poll/wait for the update to complete.
      if (cache.fetching_since) {
        console.log("[exchange-rate] Another worker is fetching rates. Polling...");
        for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const { data: pollCache } = await supabaseAdmin
            .from("exchange_rates" as any)
            .select("rates, last_updated_at, fetching_since")
            .eq("base_currency", "USD")
            .maybeSingle();

          const poll = pollCache as any;
          if (poll) {
            const pollFresh =
              new Date(poll.last_updated_at).getTime() >= now.getTime() - 24 * 60 * 60 * 1000;
            if (pollFresh && poll.rates && Object.keys(poll.rates).length > 0) {
              console.log("[exchange-rate] Fresh rates detected after polling.");
              return poll.rates;
            }
            if (!poll.fetching_since) {
              // Fetch finished/failed on the other side
              if (poll.rates && Object.keys(poll.rates).length > 0) {
                return poll.rates;
              }
              break;
            }
          }
        }
      }

      // If polling timed out or failed, fall back to existing expired cache
      if (cache.rates && Object.keys(cache.rates).length > 0) {
        console.warn("[exchange-rate] Polling timed out. Returning stale cached rates.");
        return cache.rates;
      }
    }
  }

  // Final fallback to hardcoded rates
  console.warn("[exchange-rate] Cache empty. Returning hardcoded local fallback rates.");
  return LOCAL_FALLBACK_RATES;
}

/**
 * Convert an amount from one currency to another using base USD rates.
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>,
): number {
  const fromCode = from.toUpperCase().trim();
  const toCode = to.toUpperCase().trim();

  if (fromCode === toCode) return amount;

  const fromRate = rates[fromCode] || LOCAL_FALLBACK_RATES[fromCode];
  const toRate = rates[toCode] || LOCAL_FALLBACK_RATES[toCode];

  if (!fromRate || !toRate) {
    console.warn(
      `[exchange-rate] Missing rate for conversion ${fromCode} -> ${toCode}. Using fallback 1.0.`,
    );
    return amount;
  }

  // Convert from currency A to USD, then from USD to currency B
  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
}

/**
 * Format a list of common exchange rates to inject into the LLM system prompt.
 * Restricts to the top ~40 global currencies to keep prompt context short and efficient.
 */
export function getConversionPromptContext(rates: Record<string, number>): string {
  const targetCurrencies = [
    "USD",
    "EUR",
    "GBP",
    "INR",
    "CAD",
    "AUD",
    "SGD",
    "NZD",
    "JPY",
    "CNY",
    "CHF",
    "ZAR",
    "MXN",
    "BRL",
    "AED",
    "SAR",
    "MYR",
    "THB",
    "IDR",
    "PHP",
    "KRW",
    "TRY",
    "SEK",
    "NOK",
    "DKK",
    "PLN",
    "HUF",
    "CZK",
    "ILS",
    "HKD",
    "TWD",
    "VND",
    "PKR",
    "EGP",
    "ARS",
    "CLP",
    "COP",
    "PEN",
    "UAH",
    "NGN",
  ];

  const filteredRates: Record<string, number> = {};
  for (const code of targetCurrencies) {
    if (rates[code] !== undefined) {
      // Round to 4 decimal places for prompt formatting efficiency
      filteredRates[code] = Math.round(rates[code] * 10000) / 10000;
    }
  }

  return `EXCHANGE RATES (Base USD):
Use these EXACT exchange rates for currency conversions (calculated as AmountB = AmountA * (RateB / RateA)):
${JSON.stringify(filteredRates, null, 2)}`;
}
