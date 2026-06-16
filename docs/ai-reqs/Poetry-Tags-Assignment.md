### AI Requirements

The current tag selection lists in the Add and Edit Poem dialog will be replaced with a series of checkboxes based on poetry categories and associated tags. 

SCHEMA CHANGES

Three new tables have been created to replace the current tags selected for a poem:

- `poemCategoryReference`: Contain rows for the poem categories
- `poemCategoryTagReference`: Contain individual rows of tags associated with a row in the poemCategoryReference
- `poemCategoryTag`: junction table that contains intersection of poem.id and poemCategoryTagReference.id.
- The tables have been created and pushed to the Neon platform.

The previous tables used for assigning tags to the poem are to be disregarded as they are deprecated and there only for reference: `poemTagReference` and `poemTag`

UI CREATED

- An admin is able to create entries into the new table via the UI implemented in "src/app/(support)/(logged-in)/(poetry)/add-poem-tags". This functionality was used to create entries in the three new poemCategory tables.
- The form rendered by this page can be used as a pattern for the UI Changes listed below.

UI CHANGES 

The add/edit poem will replace the current tag selection lists with a checkbox selection form that is modeled somewhat like what was implemented for the add-poem-tags functionlity

- A sample JPG of the screen for the add-poem-tags can be found in "C:\Users\gregh\projects\family-social-prototype-images\Prototyping\add-poem-tags-page.jpg". 
- Each tag listed below each of the categories should be a checkbox on the tagName where the member posting a new poem or editing his own post, can select one or more tags from the lists. 
- At least one tag must be checked before the poem add/edit can be submitted.
- In the add-poem-tags JPG example, there is also a textarea containing tagJson (which is TipTap content) that provides a long description of the tagName. This will be rendered differently in add/edit tag selection:
  - The tagJson is read-only, not editable.
  - The tagJson will be in an accordion so it is contracted for all tags and does not appear on the initial display. Contracting the tagJson text will conserve space on the form.
- There will be no add, edit, or delete buttons on this tag selection form. The only changes allowed are to check/uncheck a tag or expand/contract the tagJson textarea.