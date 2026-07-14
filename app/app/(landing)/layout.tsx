import type { Metadata } from "next";
import { Albert_Sans, Source_Serif_4 } from "next/font/google";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Poysis — Your best thinking, on demand.",
  description:
    "Poysis turns your documents, videos, notes, and bookmarks into a living archive you can talk to — every answer grounded in your own knowledge.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${albertSans.variable} ${sourceSerif4.variable}`}>
      {children}
    </div>
  );
}
