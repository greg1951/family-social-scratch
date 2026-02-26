import "@/app/globals.css";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import notFoundImg from "@/public/images/page-under-construction.png";

;
export default function NotFound() {
  return (
    <main className="font-app grid grid-cols-1 gap-2 ">
      <div className="flex items-center bg-amber-200">
        <p className="text-center text-2xl md:text-3xl font-extrabold text-red-900 w-screen">
          Page Not Available
        </p>
        <div className="flex items-center align-middle p-3 w-screen bg-amber-300 rounded-2xl">
          <div className="md:h-[100] md:w-[100] h-[75] w-[75] p-2">
            <img src="images/page-under-construction.png" alt="Not Found" />
          </div>
          <div className="flex align-middle">
            <p className="font-extrabold text-green-900 text-xs md:text-base">
              Pardon the dust.<br></br><br></br>
              Family Social is under construction.<br></br><br></br>
              Use the browser Back to return to previous page.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}