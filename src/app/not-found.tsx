import "@/app/globals.css";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import notFoundImg from "@/public/images/page-under-construction.png";

;
export default function NotFound() {
  return (
    <main className="grid grid-cols-1 gap-2 font-app ">
      <div className="flex items-center">
        <p className="text-center text-2xl md:text-3xl font-extrabold text-red-900">
          Page Not Found!
        </p>
      </div>
      <div className="flex items-center align-middle p-3">
        {/* <div className="md:h-[75] md:w-[75] h-[50] w-[50] p-2"> */ }
        <div className="md:h-[75] md:w-[75] h-[50] w-[50] p-2">
          <img src="images/page-under-construction.png" alt="Not Found" />
        </div>
        <div className="flex align-middle">
          <p className="font-extrabold text-red-900 text-xs md:text-base">
            Pardon the dust, Family Social is under construction.<br></br>
            Use the browser <b>Back</b> to return to previous page.
          </p>
        </div>

      </div>
    </main>
  );
}