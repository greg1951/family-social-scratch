import { FileText } from "lucide-react";

export const livingRoomFaqItems = [
  {
    value: "item-10",
    category: "Living Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">Exactly what is the living room? it looks like a mish-mash of blogs.</p>
        <p className="text-sm text-slate-600">What do people do in the living room? They tell stories. They recount humorous things that have happened in the family, and those are the blogs that you see.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Yes, what you see in the living room are blogs. It&apos;s the My Family Social blogging feature.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>The Living Room provides a number of <b>sample blogs</b>. Adding a cover image to your blog makes it more engaging.</li>
            <li>Use the rich text editor to create an elegant write-up of the story that you want to relate your family.</li>
            <p className="pt-2 pb-2 text-xs">When you publish your blog, it then becomes viewable to the family. </p>
            <li>If you decide that you want to keep it private, don&apos;t publish it. You can still write and record your own blog entries but keep them private.</li>
            <p className="text-sm">Explore the Terms Page, there&apos;s a lot of good information to help you write better reviews.</p>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
