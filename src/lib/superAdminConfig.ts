// Bootstrap allow-list for super admins.
// On first login, if a user's email matches and they are not yet in the
// super_admins table, the bootstrap edge function will insert them.
// After bootstrap, the database is the source of truth.
export const SUPER_ADMIN_EMAILS: string[] = [
  "brownfoxit.net@gmail.com",
];

export const SUBSCRIPTION_RENEW_URL = "https://businessdeskpro.brownfoxit.com";