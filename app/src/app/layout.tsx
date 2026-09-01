import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/fraunces";
import "./globals.css";

import type { Metadata } from "next";

import { AmbientBackground } from "@/components/AmbientBackground";
import { IslandNav } from "@/components/IslandNav";

export const metadata: Metadata = {
  title: { default: "daisy", template: "%s · daisy" },
  description: "daisy — a dark-mode checklist planner + NeetCode 150 reference.",
  themeColor: "#0c100d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AmbientBackground />
        <IslandNav />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}