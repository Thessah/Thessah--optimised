import { STORE_CONTACT, phonesDisplay, fullAddressDisplay } from './storeContact.js'

/** Default brief pre-filled in the AI design form */
export function buildDefaultAiBrief() {
  return `Create a premium Instagram/Facebook daily gold rate post for THESSAH Gold & Jewellery.

Match the layout, colors, and style of the uploaded reference image as closely as possible.

Must include:
- THESSAH logo and brand name
- "DAILY GOLD RATE UPDATE" (or similar header)
- Today's date
- Live gold rates per gram (AED): 24K, 22K, 21K, 18K
- Gold bar icon for 24K, ring for 22K, necklace for 21K, bangle for 18K
- Footer: "Visit THESSAH Today"

Contact details:
- ${phonesDisplay(' | ')}
- ${STORE_CONTACT.email} | ${STORE_CONTACT.website}
- ${fullAddressDisplay()}

Size: 1080×1350 portrait (4:5). Ultra realistic, luxury Dubai gold souq quality.`
}

export function buildGeminiPrompt({ customDetails, formatted, dateBanner, dateSlash, hasReference }) {
  const rateBlock = formatted
    ? `
Live gold rates to display exactly (AED per gram):
- 24K — ${formatted.perGram24K}
- 22K — ${formatted.perGram22K}
- 21K — ${formatted.perGram21K}
- 18K — ${formatted.perGram18K}
Date: ${dateBanner || dateSlash}`
    : ''

  const referenceNote = hasReference
    ? 'Use the attached reference image as the primary design template. Copy its layout, color palette, typography style, borders, and composition. Adapt it for THESSAH branding and the rates below.'
    : 'Create a luxury Dubai gold jewellery daily rate post with navy/gold or cream/gold premium styling.'

  return `${referenceNote}

${customDetails?.trim() || buildDefaultAiBrief()}
${rateBlock}

Output one complete finished social media poster image ready to publish. Portrait 4:5 aspect ratio. All text must be sharp and readable. Professional UAE gold market advertisement quality.`
}
