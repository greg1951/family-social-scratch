import { FileText } from "lucide-react";

export const discussionGroupsFaqItems = [
  {
    value: "item-35",
    category: "Discussion Groups",
    trigger: (
      <div>
        <p className="text-base font-semibold">Nearly all of the features have Discussion Threads. What are they and how do they work?</p>
        <p className="text-xs text-slate-600">Discussion Threads, unlike comments, provide a space for more in-depth conversations and interactions among the family members.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Discussion Threads provide a space for more in-depth conversations and interactions among family members.</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>A TV show or movie can have multiple discussion threads, depending on who wants to start one.</li>
            <li>The family member who starts a discussion becomes the moderator of the thread. (Don't worry, there's no moderation tasks to do!)</li>
            <li>When the moderator creates a discussion thread, they define a short caption which is a call to action for the discussion. </li>
            <li>The moderator should post their opinion about the show or movie and invite others to question that opinion. This will hopefully generate discussion?</li>
          </ul>
          <p className="text-base font-semibold pt-2 pb-2">Some of the basic mechanics of posting and replying are described below.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li><u>Greg</u> posted a seemingly contentious discussion topic, to which <u>George</u> promptly responded.</li>
            <li><u>George</u> further selected a <i>Thumbs Down</i> on <u>Greg's</u> post!</li>
            <li>After replying, <u>George</u> can return and edit his reply if needed.</li>
            <li>When editing a post or reply, the rich text editor provides formatting options like adding a link to <u>George</u>'s favorite Batman.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-120 h-95 md:w-220 md:h-180"
              src="/images/support/faq-discuss-post-reply.jpg"
              alt="Discussion Group Post Reply"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
