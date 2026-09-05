import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Favicon del backoffice Berea House (teal + bh). La tienda usa `app/icon.svg` rosa. */
export default function AdminIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0197b2",
          borderRadius: 7,
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        bh
      </div>
    ),
    { ...size },
  );
}
