import { FileText, CircleAlert } from "lucide-react";

export const theKitchenFaqItems = [
  {
    value: "item-70",
    category: "The Kitchen",
    trigger: (
      <div>
        <p className="text-base font-semibold">What are recipe templates and how do I use them?</p>
        <p className="text-xs text-slate-600">Here we will address how to create a recipe template.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Writing a recipe can be time consuming, but we think we've made it easier with our recipe templates.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select the <b>Manage Templates</b> button in the The Kitchen heading.</li>
            <li>By default the General Template will be shown. Selecting it will allow you to preview its content. However, you cannot edit this template.</li>
            <li>To create a new template, select the <b>Create Template</b> button.</li>
            <li>In all likelihood, you have your recipe written up nicely in a document or text editor. You can copy and paste it into the template.</li>
          </ol>
          <span className="flex justify-left pt-2 pb-2">
            <CircleAlert size={ 30 } className="inline-block mr-1" />
            <p className="text-base font-semibold pt-2 pb-2">Remember this is a template you want to use when adding recipes, not your actual recipe.</p>
          </span>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-180 h-95 md:w-220 md:h-110"
              src="/images/support/faq-foodies-edit-template.jpg"
              alt="Recipe Template"
            />
          </div>
          <p className="text-base font-semibold pt-2 pb-2">As shown above, when adding the Recipe Template:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Provide a name for the recipe template that bespeaks its content value.</li>
            <li>In the main template text area, paste in an example of one your recipes, or type away!</li>
            <p className="pt-2 pb-2">Now <u>genericize</u> the template details. Leave in a few minor details just to provide some intent in the template.</p>
            <li>Change the status from <b>Draft</b> to <b>Published</b>, if your ready to use the template.</li>
            <li>Be sure to <b>Create the Template</b>.</li>
          </ol>
          <p className="text-base font-semibold pt-2 pb-2">Notice in the list of templates that your template is editable, <u>by you, no one else!</u></p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-100 h-75 md:w-220 md:h-90"
              src="/images/support/faq-foodies-editable-new-template.jpg"
              alt="Recipe Template"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-80",
    category: "The Kitchen",
    trigger: (
      <div>
        <p className="text-base font-semibold">How best to add a recipe in the The Kitchen feature?</p>
        <p className="text-xs text-slate-600">Adding a recipe is easier with a template and following some of the suggestions here.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Ahead of creating your recipe, review the available templates and decide which one best fits your needs.</p>
          <p className="text-sm text-slate-600">If you have a recipe already written, you can paste it right in to the new recipe dialog.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select the <b>Add Recipe</b> button in the The Kitchen heading.</li>
            <p className="pt-2 pb-2"><u>Note:</u> Using a template is optional. If you don't use a template you have to jam the recipe content in manually.</p>
            <li>When you select a template, it will prefill the Recipe edit area below. Pick different template and see which template fits your needs.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-180 h-75 md:w-220 md:h-80"
              src="/images/support/faq-foodies-add-recipe-templates-list.jpg"
              alt="Recipe Templates list"
            />
          </div>
          <p className="text-base font-semibold pt-2 pb-2">Do you have a good picture of your delicious dish? Upload it to make your recipe more appealing!</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Click your mouse inside the <b>Choose File</b> field and a file dialog will appear.</li>
            <li>If you are happy with the image preview, select the <b>Upload Image</b> button.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-75 md:w-220 md:h-80"
              src="/images/support/faq-foodies-add-recipe-file-upload.jpg"
              alt="Recipe File Upload"
            />
          </div>
          <p className="text-base font-semibold pt-2 pb-2">Don't forget the Pro Tips section at the bottom of the recipe dialog!</p>
          <ul className="list-decimal ml-6 mt-2 text-sm">
            <li>If you have any time- or cost-saving tips, be sure to include them in the Pro Tips section.</li>
            <li>If you originally got the recipe from another source and then changed it, be sure to credit the original source in the Pro Tips section.</li>
          </ul>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-170 h-65 md:w-220 md:h-80"
              src="/images/support/faq-foodies-pro-tips.jpg"
              alt="Pro Tips"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
