import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanaattori - Finnish Word Games",
  description: "Collection of Finnish word games",
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
