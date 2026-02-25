import { auth } from "@/auth";
import { Toaster } from "@/components/ui/sonner";
import { redirect } from "next/navigation";
import { Merienda } from "next/font/google";
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
      <body className={ merienda.variable }>
        <Toaster />
        { children }
      </body>
    </html>
    // <div>
    //   { children }
    // </div>
  )
}