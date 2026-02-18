import "@/app/globals.css";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import notFoundImg from "@/public/images/page-under-construction.png";

;
export default function NotFound() {
  return (
    <main className="grid grid-cols-1 gap-5">
      <Card className="flex items-center shadow-2xl">
        <p className="text-center text-2xl font-extrabold decoration-amber-900 w-[350]">
          Page Not Found!
        </p>
      </Card>
      <Card className="flex items-center shadow-2xl">
        <Image src={ notFoundImg } alt="Not Found" height={ 200 } width={ 200 } />
      </Card>
      <Card className="flex items-center shadow-2xl">
        <p className="text-center font-extrabold decoration-amber-900 w-[500]">
          Pardon the dust, Family Social is under construction.
        </p>
      </Card>
    </main>
  );
}