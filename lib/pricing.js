// Pricing utilities for gold and stones

/**
 * Calculate per-gram price for a given karat based on 24K rate.
 * Gold per gram (K) = perGram24K * (K / 24)
 * @param {number} perGram24K - 24K gold price per gram
 * @param {number} karat - Purity in karats (e.g., 24, 22, 18)
 * @returns {number}
 */
export function goldPerGramFrom24K(perGram24K, karat) {
  const base = Number(perGram24K)
  const k = Number(karat)
  if (!base || !k) return 0
  return base * (k / 24)
}

/**
 * Calculate total gold price using 24K per gram rate.
 * Gold Price = (24K per gram) × (K / 24) × Weight (grams)
 * @param {number} perGram24K
 * @param {number} karat
 * @param {number} weightGrams
 * @returns {number}
 */
export function goldPrice(perGram24K, karat, weightGrams) {
  const perGram = goldPerGramFrom24K(perGram24K, karat)
  const w = Number(weightGrams)
  if (!perGram || !w) return 0
  return perGram * w
}

/**
 * Calculate stones total from per-carat rate.
 * Stones Total = pricePerCarat × caratWeight
 * @param {number} pricePerCarat
 * @param {number} caratWeight
 * @returns {number}
 */
export function stonesTotal(pricePerCarat, caratWeight) {
  const p = Number(pricePerCarat)
  const c = Number(caratWeight)
  if (!p || !c) return 0
  return p * c
}
