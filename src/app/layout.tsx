import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { redirect } from "next/navigation";
import { Merienda, Tangerine } from "next/font/google";
import "@/app/globals.css";

const merienda = Merienda({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-app",
});

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
      <body>
        <Toaster />
        { children }
      </body>
    </html>
    // <div>
    //   { children }
    // </div>
  )
}