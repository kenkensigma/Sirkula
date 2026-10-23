import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sirkula: Radar Ampas Tahu & Pakan Ternak Segar",
  description: "Platform kliring ampas tahu segar dengan jaminan batas kesegaran 12 jam, radius 15 km, dan Rekening Bersama Escrow simulasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${poppins.className} ${poppins.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
