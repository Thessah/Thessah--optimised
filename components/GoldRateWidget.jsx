'use client'

import { useEffect, useMemo, useState } from 'react'
import { goldPerGramFrom24K, stonesTotal } from '@/lib/pricing'

// A modern, self-contained live gold rate card with an inline calculator.
export default function GoldRateWidget({ weightGrams, purityKarat = 22, currency = 'AED', showCalculator = true }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rates, setRates] = useState(null)

  // Local calculator state (uses props as initial values)
  const [metal, setMetal] = useState('gold') // 'gold' | 'silver'
  const [purity, setPurity] = useState(purityKarat >= 24 ? 24 : 22)
  const [grams, setGrams] = useState(typeof weightGrams === 'number' || typeof weightGrams === 'string' ? String(weightGrams) : '')
  const [overrideRate, setOverrideRate] = useState('') // custom per-gram rate
  const [makingType, setMakingType] = useState('percent') // 'percent' | 'flat' | 'per-gram'
  const [makingValue, setMakingValue] = useState('')
  const [wastagePct, setWastagePct] = useState('')
  const [stoneCaratWeight, setStoneCaratWeight] = useState('')
  const [stonePricePerCarat, setStonePricePerCarat] = useState('')
  const [otherCharges, setOtherCharges] = useState('')
  const [taxPct, setTaxPct] = useState('5') // UAE VAT default 5%

  const loadRates = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/gold-rate', { cache: 'no-store' })
      const data = await res.json()
      if (!data?.success) throw new Error('Failed to load rates')
      setRates(data)
    } catch (e) {
      setError('Unable to fetch live rates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRates()
  }, [])

  const perGram = useMemo(() => {
    // If user provides override rate, always use it
    const custom = overrideRate !== '' ? Number(overrideRate) : null
    if (custom && !Number.isNaN(custom)) return custom

    if (metal === 'silver') {
      // Use live silver rate from API if available
      const apiSilver = rates?.rates?.perGramSilver
      return apiSilver || null
    }

    // Gold: derive from 24K when possible for consistent purity scaling
    const g24 = rates?.rates?.perGram24K
    const g22 = rates?.rates?.perGram22K
    const g18 = rates?.rates?.perGram18K
    
    if (g24) {
      return Math.round(goldPerGramFrom24K(g24, purity))
    }
    // Fallback to exact matches
    if (purity === 22 && g22) return g22
    if (purity === 18 && g18) return g18
    return null
  }, [rates, purity, metal, overrideRate])

  const estValue = useMemo(() => {
    if (!perGram) return null
    const g = grams !== '' ? Number(grams) : undefined
    if (!g || Number.isNaN(g)) return null
    // For gold we already applied purity into perGram; for silver apply purity (e.g., 999 or 925)
    if (metal === 'silver') {
      const silverFactor = purity >= 990 ? 1 : purity / 1000 // 999 ≈ 1, 925 = 0.925
      return perGram * g * silverFactor
    }
    return perGram * g
  }, [perGram, grams, metal, purity])

  const breakdown = useMemo(() => {
    if (!estValue) return null
    const base = estValue
    const wastage = wastagePct !== '' && !Number.isNaN(Number(wastagePct)) ? base * (Number(wastagePct) / 100) : 0
    let making = 0
    const mv = makingValue !== '' ? Number(makingValue) : NaN
    if (!Number.isNaN(mv)) {
      if (makingType === 'percent') making = base * (mv / 100)
      else if (makingType === 'per-gram') making = mv * (Number(grams) || 0)
      else making = mv // flat total
    }
    const stonesCalc = stonesTotal(Number(stonePricePerCarat) || 0, Number(stoneCaratWeight) || 0)
    const others = otherCharges !== '' && !Number.isNaN(Number(otherCharges)) ? Number(otherCharges) : 0
    const stones = stonesCalc + others
    const subTotal = base + wastage + making + stones
    const vat = taxPct !== '' && !Number.isNaN(Number(taxPct)) ? subTotal * (Number(taxPct) / 100) : 0
    const total = subTotal + vat
    return { base, wastage, making, stones, subTotal, vat, total, stonesCalc, others }
  }, [estValue, makingType, makingValue, wastagePct, stoneCaratWeight, stonePricePerCarat, otherCharges, taxPct, grams])

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border bg-white">
      
      <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-200 animate-pulse" />
          <span className="font-semibold">Live Gold Rate</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {!loading && rates?.lastUpdated && (
            <span className="text-white/90">Updated {new Date(rates.lastUpdated).toLocaleTimeString()}</span>
          )}
          <button
            onClick={loadRates}
            className="rounded-full bg-white/15 hover:bg-white/25 px-2 py-1 transition"
            title="Refresh"
            aria-label="Refresh rates"
          >
            ↻
          </button>
        </div>
      </div>

   
      <div className="p-4 md:p-5">
        {loading ? (
          <div className="text-sm text-gray-500">Fetching rates…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : (
          <div className="space-y-4">
          
                <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500 mb-0.5">24K per gram</div>
                <div className="text-lg font-semibold text-gray-900">{currency} {rates.rates.perGram24K?.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500 mb-0.5">22K per gram</div>
                <div className="text-lg font-semibold text-gray-900">{currency} {rates.rates.perGram22K?.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border bg-gray-50 p-3">
                <div className="text-[11px] text-gray-500 mb-0.5">18K per gram</div>
                <div className="text-lg font-semibold text-gray-900">{currency} {rates.rates.perGram18K?.toLocaleString()}</div>
              </div>
              {rates.rates.perGramSilver && (
                <div className="rounded-xl border bg-gray-50 p-3">
                  <div className="text-[11px] text-gray-500 mb-0.5">Silver per gram</div>
                  <div className="text-lg font-semibold text-gray-900">{currency} {rates.rates.perGramSilver?.toLocaleString()}</div>
                </div>
              )}
            </div>
                <p className="text-[11px] text-gray-500 mt-1">Formula: 24K/g × (K/24) × grams</p>

           
            {showCalculator && (
              <div className="rounded-xl border p-3 md:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Estimate Calculator</h3>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg border overflow-hidden">
                      {['gold','silver'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMetal(m)}
                          className={`px-3 py-1.5 text-sm capitalize ${metal===m? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                          aria-pressed={metal===m}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    {metal === 'gold' ? (
                      <div className="inline-flex rounded-lg border overflow-hidden">
                        {[24,22,18].map((k) => (
                          <button
                            key={k}
                            onClick={() => setPurity(k)}
                            className={`px-3 py-1.5 text-sm ${purity===k? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                          >
                            {k}K
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="inline-flex rounded-lg border overflow-hidden">
                        {[999,925].map((p) => (
                          <button
                            key={p}
                            onClick={() => setPurity(p)}
                            className={`px-3 py-1.5 text-sm ${purity===p? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Weight (grams)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={grams}
                      onChange={(e) => setGrams(e.target.value)}
                      placeholder="e.g. 7.250"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Per gram {metal === 'gold' ? `(${purity}K)` : `(purity ${purity})`}</label>
                    {(metal === 'silver' && !rates?.rates?.perGramSilver) || overrideRate !== '' ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={overrideRate}
                        onChange={(e) => setOverrideRate(e.target.value)}
                        placeholder={metal==='silver' ? 'Enter silver rate per gram' : 'Override gold rate per gram'}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    ) : (
                      <div className="h-[38px] flex items-center justify-between px-3 border rounded-lg bg-gray-50 text-sm">
                        <span className="text-gray-500">Rate</span>
                        <span className="font-semibold text-gray-900">{perGram ? `${currency} ${perGram.toLocaleString()}` : '—'}</span>
                      </div>
                    )}
                    {metal === 'gold' && overrideRate === '' && (
                      <button
                        type="button"
                        onClick={() => setOverrideRate(String(perGram || ''))}
                        className="mt-1 text-xs text-gray-600 underline hover:text-gray-900"
                      >
                        Override rate
                      </button>
                    )}
                    {metal === 'silver' && overrideRate === '' && rates?.rates?.perGramSilver && (
                      <button
                        type="button"
                        onClick={() => setOverrideRate(String(perGram || ''))}
                        className="mt-1 text-xs text-gray-600 underline hover:text-gray-900"
                      >
                        Override rate
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {[1, 5, 10, 20].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrams(String(g))}
                      className="px-3 py-1.5 text-xs border rounded-full hover:bg-gray-50"
                    >
                      {g}g
                    </button>
                  ))}
                </div>

                {/* Charges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Making charge type</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                      value={makingType}
                      onChange={(e) => setMakingType(e.target.value)}
                    >
                      <option value="percent">% of metal value</option>
                      <option value="per-gram">Per gram (flat)</option>
                      <option value="flat">Flat total</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Making charge value</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={makingValue}
                      onChange={(e) => setMakingValue(e.target.value)}
                      placeholder={makingType==='percent' ? 'e.g. 10 (%)' : makingType==='per-gram' ? 'e.g. 15 (per g)' : 'e.g. 100'}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Wastage (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={wastagePct}
                      onChange={(e) => setWastagePct(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stone weight (carats)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={stoneCaratWeight}
                      onChange={(e) => setStoneCaratWeight(e.target.value)}
                      placeholder="e.g. 1.50"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Stone price (per carat) — {currency}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={stonePricePerCarat}
                      onChange={(e) => setStonePricePerCarat(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Stone total = price per carat × carat weight</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Other charges ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">VAT / Tax (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={taxPct}
                      onChange={(e) => setTaxPct(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-amber-900/80">Metal value</div>
                    <div className="text-right font-semibold text-amber-900">{breakdown ? `${currency} ${breakdown.base.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</div>
                    <div className="text-amber-900/80">Wastage</div>
                    <div className="text-right font-semibold text-amber-900">{breakdown ? `${currency} ${breakdown.wastage.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</div>
                    <div className="text-amber-900/80">Making</div>
                    <div className="text-right font-semibold text-amber-900">{breakdown ? `${currency} ${breakdown.making.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</div>
                    <div className="text-amber-900/80">Stones + Other</div>
                    <div className="text-right font-semibold text-amber-900">{breakdown ? `${currency} ${breakdown.stones.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</div>
                    {breakdown && (
                      <div className="col-span-2 text-[11px] text-amber-900/70">
                        Stones detail: {currency} {Math.round(breakdown.stonesCalc).toLocaleString()} (carat × price) + Other {currency} {Math.round(breakdown.others).toLocaleString()}
                      </div>
                    )}
                    <div className="text-amber-900/80">Subtotal</div>
                    <div className="text-right font-semibold text-amber-900">{breakdown ? `${currency} ${breakdown.subTotal.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</div>
                    <div className="text-amber-900/80">VAT / Tax</div>
                    <div className="text-right font-semibold text-amber-900">{breakdown ? `${currency} ${breakdown.vat.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between">
                    <div className="text-sm font-semibold text-amber-900">Total</div>
                    <div className="text-2xl font-bold text-amber-900">{breakdown ? `${currency} ${breakdown.total.toLocaleString(undefined,{maximumFractionDigits:0})}` : '—'}</div>
                  </div>
                  <p className="text-[11px] text-amber-800/80 mt-1">Guidance only. Final price may vary based on store policies.</p>
                </div>
              </div>
            )}

            {rates?.disclaimer && (
              <p className="text-[11px] text-gray-500">{rates.disclaimer}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
