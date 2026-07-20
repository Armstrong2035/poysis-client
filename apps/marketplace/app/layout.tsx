import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { TopBar } from "@/components/marketplace/TopBar";

export const metadata: Metadata = {
  title: "Poysis — Talk to the people worth learning from",
  description: "Every notebook is a creator whose channel we've indexed in full — ask a question, get their answer, cited to the video.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: "var(--ground)" }}>
        <Suspense fallback={null}>
          <TopBar />
        </Suspense>
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>{children}</div>
      </body>
    </html>
  );
}
