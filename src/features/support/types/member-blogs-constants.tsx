import { FileText } from "lucide-react";

export const memberBlogsFaqItems = [
  {
    value: "item-10",
    category: "Member Blogs",
    trigger: (
      <div>
        <p className="text-base font-semibold">When I first access the <b>Member Blogs</b> page, the member blog page, is empty. Why is that?</p>
        <p className="text-sm text-slate-600">The <b>Member Blogs</b> are private to the signed-in member, so if you haven&apos;t written any blogs, it will be empty the first time.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold"> It is the <b>status</b> of the blog in the Member Blogs workspace that determines if it is visible in the living room.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>A status of <u>Published</u> will make the blog visible in the living room.</li>
            <li>A status of <u>Private</u> will keep the blog inside your member blog workspace without anyone in the family seeing it.</li>
            <li>Use the <u>Draft</u> status as a way of keeping your blog in a working state, until you either publish it or make it private.</li>
          </ul>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
