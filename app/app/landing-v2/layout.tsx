import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Syne } from "next/font/google";
import "./landing-v2.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Poysis — Memory Infrastructure",
  description:
    "Poysis turns scattered knowledge into navigable territory. Connect your knowledge. Use it wherever you work.",
};

export default function LandingV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`lv2-root ${dmSans.variable} ${jetbrains.variable} ${syne.variable} relative min-h-screen w-full`}
    >
      {children}
    </div>
  );
}
