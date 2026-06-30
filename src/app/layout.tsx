import type { Metadata, Viewport } from "next";
import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { Merienda } from "next/font/google";
import PwaRegister from "@/components/pwa/pwa-register";
import "@/app/globals.css";

const merienda = Merienda({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-app",
});

export const metadata: Metadata = {
  applicationName: "Family Social",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Family Social",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/images/family-social-logo-transparent.png",
    apple: "/images/family-social-logo-transparent.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#59cdf7",
};

export default async function LoggedOutLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const session = await auth();
  if (session?.user?.id) {
    // console.warn('LoggedOutLayout->session found but REDIRECT to /my-account has been REMOVED to prevent 307 loop...');
    //   redirect("/my-account");
  }
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com" rel="stylesheet"></link>
      </head>
      <body className={ merienda.variable }>
        <PwaRegister />
        <Toaster />
        { children }
      </body>
    </html>
    // <div>
    //   { children }
    // </div>
  )
}