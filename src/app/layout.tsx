import type { Metadata } from "next";
import { Montserrat, Tenor_Sans } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const tenorSans = Tenor_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tenor-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manager Elevator",
  description:
    "AI-powered continuous improvement platform for Black middle managers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${tenorSans.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
