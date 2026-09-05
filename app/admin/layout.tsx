import type { Metadata } from "next";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "Berea House",
    template: "%s · Berea House",
  },
  applicationName: "Berea House",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
