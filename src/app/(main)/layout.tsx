import type { Metadata } from "next";
import "@/app/globals.css";
import { Merienda } from "next/font/google";

const merienda = Merienda({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merienda",
});

export const metadata: Metadata = {
  title: "Family Social",
  description: "Share with your family in one place",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={ merienda.variable }>{ children }</body>
    </html>
  );
}
