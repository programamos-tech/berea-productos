alter table public.tenants
  add constraint tenants_invoice_layout_valid
  check (
    coalesce(storefront_config->>'invoice_layout', 'ticket')
      in ('ticket', 'letter')
  );

comment on column public.tenants.storefront_config is
  'Configuración del catálogo y de la plataforma (checkout, diseño de factura).';
