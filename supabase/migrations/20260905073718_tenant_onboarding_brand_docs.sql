-- Tenant onboarding: logo storage convention (no new bucket).
-- Logos live in existing public bucket `product-images` at:
--   tenants/{tenant_id}/logo.{ext}
-- DB path stored in tenants.brand.logo_path as:
--   product-images/tenants/{tenant_id}/logo.{ext}
--
-- Who may onboard (app-level, not RLS):
--   Admin session + profiles.job_role = 'owner'
--   OR email listed in env BEREA_PLATFORM_ADMIN_EMAILS
-- Aleya owners act as Berea operators for v1.

comment on column public.tenants.brand is
  'Invoice/tirilla overrides: trade_name, legal_name, tax_nit, tax_regime, phone, email, whatsapp, address, city, logo_path (product-images/tenants/… or /public), optional bank{holder,tax_id,account}. Empty → app env defaults (Aleya).';
