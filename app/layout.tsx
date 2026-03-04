import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "OxyTerminal",
  description: "Personal Trading Terminal Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-mono">{children}</body>
    </html>
  );
}
