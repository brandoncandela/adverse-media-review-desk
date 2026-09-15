import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adverse Media Review Desk",
  description: "Compare identity evidence, triage adverse media hits, and document review decisions.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
