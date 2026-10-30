import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
        className={`${montserrat.className} ${montserrat.variable} font-sans antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
