
The user wants a flow where:
1. Landing page (separate Lovable project) handles Mercado Pago checkout
2. After payment success, landing page calls dashboard's Supabase to create user
3. Random password is auto-generated and emailed to buyer
4. Buyer logs into dashboard with that password
5. On first login, popup forces password change

Let me check what exists:
- `signup-purchase` edge function already exists and creates user + admin role + subscription
- It currently accepts a known password — needs to generate one and email it
- No email infrastructure set up yet (no auth-email-hook, no transactional emails)
- No `must_change_password` flag in DB
- No first-login popup in dashboard

Let me explore a few things to be precise.
