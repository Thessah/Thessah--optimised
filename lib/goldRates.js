const OUNCE_TO_GRAM = 31.1034768

async function fetchFromMetalPriceAPI() {
  const apiKey = process.env.METAL_PRICE_API_KEY || 'dde28869cb1e777033ac3e9e214353e5'
  try {
    const res = await fetch(
      `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=AED&currencies=XAU,XAG`,
      { cache: 'no-store' }
    )
    if (!res.ok) return null

    const contentType = res.headers.get('content-type')
    if (!contentType?.includes('application/json')) return null

    const data = await res.json()
    const xauRate = data?.rates?.XAU
    const xagRate = data?.rates?.XAG
    if (!xauRate || Number.isNaN(Number(xauRate))) return null

    const aedPerOunceGold = 1 / xauRate
    const perGram24K = aedPerOunceGold / OUNCE_TO_GRAM

    let perGramSilver = null
    if (xagRate && !Number.isNaN(Number(xagRate))) {
      const aedPerOunceSilver = 1 / xagRate
      perGramSilver = aedPerOunceSilver / OUNCE_TO_GRAM
    }

    return {
      perGram24K,
      perGram22K: perGram24K * (22 / 24),
      perGram21K: perGram24K * (21 / 24),
      perGram18K: perGram24K * (18 / 24),
      perGramSilver,
      source: 'metalpriceapi.com',
    }
  } catch (error) {
    console.error('[goldRates] fetch error:', error.message)
    return null
  }
}

export function formatGoldRate(value) {
  return Number(value).toFixed(2)
}

export async function getGoldRates() {
  const live = await fetchFromMetalPriceAPI()
  const now = new Date().toISOString()

  if (live) {
    return {
      success: true,
      rates: {
        perGram24K: live.perGram24K,
        perGram22K: live.perGram22K,
        perGram21K: live.perGram21K,
        perGram18K: live.perGram18K,
        perGramSilver: live.perGramSilver,
      },
      formatted: {
        perGram24K: formatGoldRate(live.perGram24K),
        perGram22K: formatGoldRate(live.perGram22K),
        perGram21K: formatGoldRate(live.perGram21K),
        perGram18K: formatGoldRate(live.perGram18K),
      },
      lastUpdated: now,
      source: live.source,
    }
  }

  const fallback24 = 275
  return {
    success: true,
    rates: {
      perGram24K: fallback24,
      perGram22K: fallback24 * (22 / 24),
      perGram21K: fallback24 * (21 / 24),
      perGram18K: fallback24 * (18 / 24),
      perGramSilver: 3,
    },
    formatted: {
      perGram24K: formatGoldRate(fallback24),
      perGram22K: formatGoldRate(fallback24 * (22 / 24)),
      perGram21K: formatGoldRate(fallback24 * (21 / 24)),
      perGram18K: formatGoldRate(fallback24 * (18 / 24)),
    },
    lastUpdated: now,
    source: 'fallback',
  }
}
