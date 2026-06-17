/** THESSAH store contact — used on ads posts & captions */
export const STORE_CONTACT = {
  name: 'THESSAH GOLD & JEWELLERY',
  phones: ['+971 58 837 5912', '+971 4 272 4515'],
  email: 'info@thessah.ae',
  website: 'www.thessah.ae',
  address: {
    line1: 'Hind Plaza 2, Shop No. 06',
    line2: 'Gold Souq Extension, Al Ras, Deira, Dubai',
    short: 'Gold Souq Extension, Al Ras, Deira, Dubai',
  },
}

export function phonesDisplay(separator = '  •  ') {
  return STORE_CONTACT.phones.join(separator)
}

export function contactHeaderLine() {
  return `${STORE_CONTACT.address.short}  •  ${phonesDisplay('  •  ')}`
}

export function fullAddressDisplay() {
  return `${STORE_CONTACT.address.line1}, ${STORE_CONTACT.address.line2}`
}
