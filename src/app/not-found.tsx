import "@/app/globals.css";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import notFoundImg from "@/public/images/page-under-construction.png";

;
export default function NotFound() {
  return (
    <main className="grid grid-cols-1 gap-5 font-app">
      <Card className="flex items-center shadow-2xl">
        <p className="text-center text-3xl font-extrabold text-red-900 w-[350]">
          Page Not Found!
        </p>
      </Card>
      <Card className="flex items-center shadow-2xl">
        <Image src={ notFoundImg } alt="Not Found" height={ 200 } width={ 200 } />
      </Card>
      <Card className="flex items-center shadow-2xl">
        <p className="text-center font-extrabold text-red-900 w-[600]">
          Pardon the dust, Family Social is under construction.<br></br>
          Use the browser <b>Back</b> to return to previous page.
        </p>
      </Card>
    </main>
  );
}