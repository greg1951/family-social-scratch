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
  {
    value: "item-20",
    category: "Living Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">Can you provide some guidelines on how to write a good blog for the family?</p>
        <p className="text-sm text-slate-600 pb-2">General guidelines are provided below.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Although you are sharing stories with family and friends, remember to keep it respectful and considerate.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li className="pt-2 pb-2">Write like you are talking over coffee. You don&apos;t need to explaining who &quot;Aunt Sarah&quot; or &quot;Pumpkin the dog&quot; are.</li>
            <li className="pt-2 pb-2">The blog title should be an attention grabber.</li>
            <li>Assume that kids may read your blogs, so be careful with language.</li>
            <li className="pt-2 pb-2">Clear relationship anecdotes with your spouse before publishing. Never vent marital stress publicly.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
