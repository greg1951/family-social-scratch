import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Merienda } from "next/font/google";
import "@/app/globals.css";

const merienda = Merienda({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-merienda",
});

export default async function LoggedOutLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const session = await auth();
  if (!!session?.user?.id) {
    redirect("/my-account");
  }
  return (
    <html lang="en">
      <body className={ merienda.variable }>{ children }</body>
    </html>
    // <div>
    //   { children }
    // </div>
  )
}