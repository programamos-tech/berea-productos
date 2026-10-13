/** Ícono del sprite SVG que se monta al final de la landing (`#i-{id}`). */
export function Icon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className ? `icon ${className}` : "icon"} aria-hidden="true">
      <use href={`#i-${id}`} />
    </svg>
  );
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function IconSprite() {
  return (
    <svg className="sprite" aria-hidden="true">
      <symbol id="i-check" viewBox="0 0 24 24"><path {...stroke} d="M5 12.5l4.2 4.2L19 7.5" /></symbol>
      <symbol id="i-whatsapp" viewBox="0 0 24 24"><path {...stroke} d="M12 3.2a8.8 8.8 0 0 0-7.6 13.2L3.2 20.8l4.5-1.2A8.8 8.8 0 1 0 12 3.2z" /><path d="M9.2 7.6c-.3 0-.7.1-.9.5-.3.5-.6 1.1-.4 2 .4 1.6 1.6 3.3 3.2 4.5 1.4 1 2.6 1.3 3.4 1.2.6-.1 1.1-.5 1.3-1 .1-.3.1-.6-.1-.7l-1.7-.9c-.2-.1-.5 0-.6.2l-.5.6c-.1.2-.4.2-.6.1-.9-.4-1.8-1.3-2.3-2.2-.1-.2 0-.4.1-.6l.4-.5c.1-.2.2-.4.1-.6l-.7-1.8c-.1-.2-.3-.3-.5-.3z" fill="currentColor" /></symbol>
      <symbol id="i-chart" viewBox="0 0 24 24"><path {...stroke} d="M4 16l4.2-5 3.6 3 7.2-8M4 19h16" /></symbol>
      <symbol id="i-cash" viewBox="0 0 24 24"><rect {...stroke} x="2" y="6" width="20" height="12" rx="2" /><circle {...stroke} cx="12" cy="12" r="3" /></symbol>
      <symbol id="i-bag" viewBox="0 0 24 24"><path {...stroke} d="M6.5 8h11l-.8 11.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6.5 8zM9 8V7a3 3 0 0 1 6 0v1" /></symbol>
      <symbol id="i-receipt" viewBox="0 0 24 24"><path {...stroke} d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3zM9 8h6M9 12h6M9 16h4" /></symbol>
      <symbol id="i-boxes" viewBox="0 0 24 24"><path {...stroke} d="M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7 12 12l8.7-5M12 12v9" /></symbol>
      <symbol id="i-users" viewBox="0 0 24 24"><path {...stroke} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /><circle {...stroke} cx="9" cy="7" r="4" /></symbol>
      <symbol id="i-card" viewBox="0 0 24 24"><path {...stroke} d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" /></symbol>
      <symbol id="i-pin" viewBox="0 0 24 24"><path {...stroke} d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10z" /><circle cx="12" cy="11" r="1.7" fill="currentColor" /></symbol>
      <symbol id="i-bolt" viewBox="0 0 24 24"><path {...stroke} d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" /></symbol>
      <symbol id="i-home" viewBox="0 0 24 24"><path {...stroke} d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5z" /></symbol>
      <symbol id="i-gastos" viewBox="0 0 24 24"><path {...stroke} d="M4 6h16v12H4zM8 10h8M8 14h5" /></symbol>
      <symbol id="i-search" viewBox="0 0 24 24"><circle {...stroke} cx="11" cy="11" r="6.5" /><path {...stroke} d="M20 20l-4.2-4.2" /></symbol>
      <symbol id="i-gear" viewBox="0 0 24 24"><circle {...stroke} cx="12" cy="12" r="3" /><path {...stroke} d="M12 2.8v2.4M12 18.8v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.8 12h2.4M18.8 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" /></symbol>
      <symbol id="i-user" viewBox="0 0 24 24"><circle {...stroke} cx="12" cy="8" r="4" /><path {...stroke} d="M4 20v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" /></symbol>
      <symbol id="i-building" viewBox="0 0 24 24"><path {...stroke} d="M4 21V7l8-4 8 4v14M8 21v-5h8v5M8 9h.01M12 9h.01M16 9h.01M8 12h.01M12 12h.01M16 12h.01" /></symbol>
      <symbol id="i-list" viewBox="0 0 24 24"><path {...stroke} d="M4 11h16M4 7h10M4 15h8M18 15h2M18 11h2" /><circle {...stroke} cx="18" cy="7" r="2" /></symbol>
      <symbol id="i-dollar" viewBox="0 0 24 24"><circle {...stroke} cx="12" cy="12" r="9" /><path {...stroke} d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v12" /></symbol>
      <symbol id="i-wallet" viewBox="0 0 24 24"><path {...stroke} d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2M3 6v13a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3" /></symbol>
      <symbol id="i-swap" viewBox="0 0 24 24"><path {...stroke} d="M7 7h11M15 4l3 3-3 3M17 17H6M9 14l-3 3 3 3" /></symbol>
      <symbol id="i-trend" viewBox="0 0 24 24"><path {...stroke} d="M3 17l6-6 4 4 8-8M15 7h6v6" /></symbol>
      <symbol id="i-down" viewBox="0 0 24 24"><path {...stroke} d="M17 7 7 17M17 17H7V7" /></symbol>
      <symbol id="i-store" viewBox="0 0 24 24"><path {...stroke} d="M4 10v10h16V10M3 6.5 5 3h14l2 3.5V8a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V6.5zM10 20v-5h4v5" /></symbol>
      <symbol id="i-calendar" viewBox="0 0 24 24"><rect {...stroke} x="3" y="5" width="18" height="16" rx="2" /><path {...stroke} d="M3 10h18M8 3v4M16 3v4" /></symbol>
      <symbol id="i-download" viewBox="0 0 24 24"><path {...stroke} d="M12 4v11M8 11l4 4 4-4M5 20h14" /></symbol>
      <symbol id="i-refresh" viewBox="0 0 24 24"><path {...stroke} d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></symbol>
      <symbol id="i-chevron" viewBox="0 0 24 24"><path {...stroke} d="M6 9l6 6 6-6" /></symbol>
      <symbol id="i-external" viewBox="0 0 24 24"><path {...stroke} d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></symbol>
      <symbol id="i-info" viewBox="0 0 24 24"><circle {...stroke} cx="12" cy="12" r="9" /><path {...stroke} d="M12 11v5M12 8h.01" /></symbol>
      <symbol id="i-eye" viewBox="0 0 24 24"><path {...stroke} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle {...stroke} cx="12" cy="12" r="3" /></symbol>
      <symbol id="i-ban" viewBox="0 0 24 24"><circle {...stroke} cx="12" cy="12" r="9" /><path {...stroke} d="M5.7 5.7l12.6 12.6" /></symbol>
      <symbol id="i-layers" viewBox="0 0 24 24"><path {...stroke} d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" /></symbol>
      <symbol id="i-file" viewBox="0 0 24 24"><path {...stroke} d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5zM14 3v5h5M9 13h6M9 17h6" /></symbol>
      <symbol id="i-coins" viewBox="0 0 24 24"><path {...stroke} d="M11 15h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17M7 21l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.9l-4.2 3.9M2 16l6 6" /><circle {...stroke} cx="16" cy="6" r="3" /></symbol>
      <symbol id="i-globe" viewBox="0 0 24 24"><circle {...stroke} cx="12" cy="12" r="9" /><path {...stroke} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></symbol>
      <symbol id="i-plus" viewBox="0 0 24 24"><path {...stroke} d="M12 5v14M5 12h14" /></symbol>
      <symbol id="i-instagram" viewBox="0 0 24 24"><rect {...stroke} x="3.5" y="3.5" width="17" height="17" rx="5" /><circle {...stroke} cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" /></symbol>
      <symbol id="i-tiktok" viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.3 7.3 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.3-1.5z" /></symbol>
      <symbol id="i-linkedin" viewBox="0 0 24 24"><path fill="currentColor" d="M4.98 3.5a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2zM3.2 9h3.6v11.5H3.2V9zm5.9 0h3.4v1.6h.1c.5-.9 1.7-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.1V9z" /></symbol>
      <symbol id="i-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5H16l.5-3.2h-3V8.4c0-.9.3-1.6 1.6-1.6h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.5v3.2h2.7V21h3.3z" /></symbol>
    </svg>
  );
}
