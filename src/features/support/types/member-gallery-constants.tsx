import { FileText } from "lucide-react";

export const memberGalleryFaqItems = [
  {
    value: "item-300",
    category: "Member Gallery",
    trigger: (
      <div>
        <p className="text-base font-semibold">How do I create an album of pictures that I can share with the family?</p>
        <p className="text-sm text-slate-600">The Member Gallery is a private workspace where you can upload and create picture albums. </p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Upload pictures to the Photo Workspace and then add them to an album in the album manager in the Album Manager.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Upload pictures from your device into the photo workspace. These pictures are not in an album just yet. They are unallocated. They will remain unallocated until they get added to an album.</li>
            <li> After uploading the pictures, you can then edit the pictures and add captions and descriptions to the pictures.</li>
            <li>A <u>landscape</u> or <u>portrait</u> badge will be shown on each of the images so that you know whether the images are portrait or landscape.</li>
          </ol>
          <p className="text-base font-semibold pt-2">Why is the portrait and landscape badge important?</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>If the order of the pictures isn&apos;t important, then how they appear when viewed by family members may be an important consideration.</li>
            <li>On tablet and desktop devices, more portrait images can be shown on a single row than landscape images.</li>
            <li>Here are the rules: PPPPPP or LPLP or LLL. What this is saying is that I can get more Portrait pictures on a single row than Landscape pictures.</li>
          </ol>
          <p className="text-base font-semibold pt-2">Add the uploaded pictures to a new album in the Album Manager.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>When the new album dialog opens, you can select the photos in My Unallocated Photos to be added to the album.</li>
            <li>When you select a photo to add to the album, you will have another opportunity to enter caption and summary information about the photo.</li>
            <li>Be sure to enter an album story for the album, as this will help to draw interest to your album by other family members.</li>
            <li>When you are ready to share the album with other family members, make sure to check the <b>Share with family members</b> check box.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
