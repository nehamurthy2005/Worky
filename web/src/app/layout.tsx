import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoinWork — Blue-collar gig economy platform",
  description:
    "Connect with local gig jobs, earn KCoins, and get paid — KoinWork is built for India's blue-collar workforce.",
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
