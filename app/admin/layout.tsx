import type { Metadata } from "next";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "Berea Productos",
    template: "%s · Berea Productos",
  },
  applicationName: "Berea Productos",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
