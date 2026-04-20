import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EZB Demand Planning Hosted",
  description: "Netlify + Firebase hosted shell for EZ Bombs demand planning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
