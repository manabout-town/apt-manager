import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "APT 관리",
  description: "아파트 관리사무소 운영 시스템",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>
          <Sidebar />
          <main className="md:ml-64 min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
