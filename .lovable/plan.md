

## Fix: Reset super-admin password to `JustDemo121!!!`

### What's happening

The auth account `brownfoxit.net@gmail.com` already exists in the database (created earlier, email-confirmed), but its current password is not `JustDemo121!!!` — that's why login returns "Invalid login credentials". Public signup is disabled, so you can't re-register from the UI.

### The fix (one-time admin action)

Run a small one-shot script using the **service role key** (server-side only) to set the password on the existing user:

```ts
// supabase/functions/admin-bootstrap-password/index.ts (temporary, one-shot)
await admin.auth.admin.updateUserById(
  "4d757a75-a753-44cc-98ad-b67257a05554",
  { password: "JustDemo121!!!", email_confirm: true }
);
```

Then I'll:
1. Deploy this temporary edge function.
2. Invoke it once via curl to apply the password.
3. Also confirm a `super_admins` row exists for this user (insert it if not — bypasses needing to log in first to trigger the bootstrap function).
4. Confirm there's no `customer_subscriptions` row needed for super-admin (super-admins bypass the expiry gate).
5. Delete the temporary `admin-bootstrap-password` function so it can't be re-used.

### After the fix

You'll be able to log in at `/auth` with:
- Email: `brownfoxit.net@gmail.com`
- Password: `JustDemo121!!!`

You'll land on the dashboard, see the **Admin → Customers** sidebar item (super-admin only), and start creating customer accounts from there.

### Files touched

- **Created (temporary)**: `supabase/functions/admin-bootstrap-password/index.ts`
- **Deleted after use**: same file
- No frontend changes; no schema changes.

