import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "أصنع نشاطي | استوديو الأنشطة التعليمية الذكية",
  description: "كل مهارة تستحق نشاطًا يناسبها — منصة المعلمات لإنتاج أنشطة مصورة وتفاعلية وأوراق عمل."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
