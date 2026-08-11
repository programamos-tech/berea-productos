-- Cotización / pre-factura POS (sin cobro ni descuento de stock hasta facturar).
alter type public.order_status add value if not exists 'quotation';

comment on type public.order_status is
  'pending|paid|failed|cancelled|quotation — quotation = cotización POS sin stock ni cobro';
