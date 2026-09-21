import { FileText } from "lucide-react";

export const livingRoomFaqItems = [
  {
    value: "item-10",
    category: "Living Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">Exactly what is the Living Room? It looks like a blog site.</p>
        <p className="text-sm text-slate-600 pb-2">Yes, what you see in the living room are blogs. 
          As explained below, there are blogs in the <u>Living Room</u> as well as in the <u>Member Blogs</u> space.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">In the <b>Living Room</b>, people share stories about the family.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li className="pt-2 pb-2">The living room contains family member blogs that have been shared with the family.</li>
            <li className="pt-2 pb-2">Blogs are only viewable in the <u>Living Room</u>. Blogs are written in the <u>Member Blogs</u> space and then shared.</li>
            <li>Every member has a <u>private</u> member space where they can keep their own blogs.</li>
            <p className="pt-2 pb-2 text-sm">That is the <b>My Blogs</b> button you see at the top of the page.</p>
            <li className="pt-2 pb-2">When a blog is <b>published</b> in the member blogs, it then becomes <u>publicly</u> visible in the Living Room.</li>
          </ul>
          <p className="text-base font-semibold">Some important things to know about the <b>Member Blogs</b> space:</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li className="pt-2 pb-2">The Member Blogs space is private. <u>Only the logged in member can access it.</u></li>
            <li>A member can keep their own private blogs, without ever sharing them. It can be your own private diary or journal site.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
