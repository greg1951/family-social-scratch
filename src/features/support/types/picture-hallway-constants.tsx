import { FileText } from "lucide-react";

export const pictureHallwayFaqItems = [
  {
    value: "item-10",
    category: "Picture Hallway",
    trigger: (
      <div>
        <p className="text-base font-semibold">I'm in the Family Photo Gallery but I don&apos;t see any way to upload pictures. How do I do this?</p>
        <p className="text-sm text-slate-600">The Family Photo Gallery is designed for viewing shared albums. To upload pictures, go to <b>My Gallery</b>.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">The following describes the Family Gallery:</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>This gallery is only for <u>viewing</u> pictures in albums that have been shared by family members.</li>
            <li>Individual pictures are not shared. They must be inside an album containing one or more pictures.</li>
            <li>The pictures inside that album will be rendered in the Family Gallery when the album is selected.</li>
          </ul>
          <p className="text-base font-semibold pt-2">The following describes the Member Gallery:</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>It is a <u>private workspace</u> that is provided for each of the members in a family.</li>
            <li>Only the member has access to his or her&apos;s member&apos;s gallery.</li>
            <li>When a member shares an album in the Member Gallery it will appear in the Family Gallery.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
