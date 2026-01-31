import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dog Walk Tracker",
  description: "Track your dog's walk – route, pee & poo – and let the owner review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
