export function getAllowedAdminEmails() {
  return [
    process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  ]
    .filter(Boolean)
    .map((email) => email.toLowerCase())
}

export function isStoreAdminEmail(email) {
  if (!email) return false
  const allowed = getAllowedAdminEmails()
  if (allowed.length === 0) {
    return email.toLowerCase() === 'thessahjewellery@gmail.com'
  }
  return allowed.includes(email.toLowerCase())
}
