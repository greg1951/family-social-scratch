import { FileText } from "lucide-react";

export const mailBoxFaqItems = [
  {
    value: "item-200",
    category: "Mail Box",
    trigger: (
      <div>
        <p className="text-base font-semibold">Why should I use Mail Box? I can simply text someone!</p>
        <p className="text-sm text-slate-600">We're not trying to replace texting, but Mail Box offers a more organized and private way to communicate within your family.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Listed below are some reasons to use Mail Box.</p>
          <p className="text-sm">All of the reasons listed below have one thing in common: they help you stay connected with your family in a more organized and private way.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>You're planning a family event around a certain date and want to know who can make it</li>
            <li>You've just shared some exciting news and want to see everyone's reactions</li>
            <li>You have a question or need advice from your family</li>
            <li>You want to share a special moment or achievement with your family</li>
            <li>You have some pictures you'd like your family to see</li>
            <li>You want to send a private message to a family member and don't want to text or email it</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-95 md:w-210 md:h-130"
              src="/images/support/faq-threads-pics.jpg"
              alt="Mail Box Pictures"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
