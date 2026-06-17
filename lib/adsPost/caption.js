import { STORE_CONTACT, phonesDisplay, fullAddressDisplay } from '@/lib/adsPost/storeContact'

export function formatPostDate(date = new Date()) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const slash = `${dd}/${mm}/${yyyy}`
  const short = `${dd}.${mm}.${yyyy}`
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const banner = `${weekday.toUpperCase()} ${slash}`
  const long = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return { short, slash, long, banner, weekday }
}

export function buildInstagramCaption({ formatted, dateLong, dateSlash }) {
  const { perGram24K, perGram22K, perGram21K, perGram18K } = formatted
  const dateLine = dateSlash || dateLong
  const phoneLines = STORE_CONTACT.phones.map((p) => `📞 ${p}`).join('\n')

  return `✨ THESSAH Daily Gold Rate Update — ${dateLine}

Live Dubai gold rates per gram (AED):
• 24K — ${perGram24K}
• 22K — ${perGram22K}
• 21K — ${perGram21K}
• 18K — ${perGram18K}

Indicative rates. Subject to market fluctuations.

📍 ${fullAddressDisplay()}
${phoneLines}
✉️ ${STORE_CONTACT.email}
🔗 ${STORE_CONTACT.website}

#Thessah #DubaiGold #GoldRateDubai #LuxuryJewelry #UAEGold #GoldSouq #24KGold #ThessahJewellery #DubaiLife #GoldMarket`
}
