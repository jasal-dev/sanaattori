import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanaattori - Finnish Word Game",
  description: "A Wordle-style word game in Finnish",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
