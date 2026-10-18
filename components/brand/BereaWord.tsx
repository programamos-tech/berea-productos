import { Poppins } from "next/font/google";

const poppinsBlack = Poppins({
  weight: "800",
  subsets: ["latin"],
  display: "swap",
});

/** La B del logo, seguida de «erea», para que se lea Berea. */
export function BereaWord({ className }: { className?: string }) {
  const classes = ["berea-word", poppinsBlack.className, className].filter(Boolean).join(" ");
  return (
    <span className={classes} aria-label="Berea">
      <span className="berea-word-mark" aria-hidden />
      <span className="berea-word-rest" aria-hidden>
        erea
      </span>
    </span>
  );
}
