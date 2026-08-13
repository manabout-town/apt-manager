import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { SwRegister } from "@/components/SwRegister";

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
          <ToastProvider>
            <Sidebar />
            <main className="md:mr-60 min-h-screen">{children}</main>
            <SwRegister />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
