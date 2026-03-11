import type { Metadata } from "next";
import { Graduate, Josefin_Sans } from "next/font/google";
import "./globals.css";

const graduate = Graduate({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-graduate",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-josefin",
});

export const metadata: Metadata = {
  title: "Grace Mountain | Daily Notes & Attendance",
  description: "Daily notes and attendance tracking for Grace Mountain providers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${graduate.variable} ${josefinSans.variable}`}>
      <body className="antialiased min-h-screen bg-[#f8f7f5]">
        {children}
      </body>
    </html>
  );
}
