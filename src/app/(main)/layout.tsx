import type { Metadata } from "next";
import "@/app/globals.css";
// import { Merienda } from "next/font/google";

// const merienda = Merienda({
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "700", "900"],
//   variable: "--font-meridien",
// });

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
      <head>
        <style>
          @import url(&apos;https://fonts.googleapis.com/css2?family=Merienda:wght@300..900&display=swap&apos;);
        </style>
      </head>
      <body>{ children }</body>
    </html>
  );
}
