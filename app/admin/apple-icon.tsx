import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon del backoffice Berea Productos. */
export default function AdminAppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ED7464",
          borderRadius: 36,
          color: "#ffffff",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        bp
      </div>
    ),
    { ...size },
  );
}
