# BOOK BACKGROUND

- There are six poem tables (book, book_comment, book_term, book_tag_reference, book_tag, book_like) defined in the "src/components/db/schema/family-social-schema-tables.ts" file. 
- Database queries for book and book_term have been written and reside in the "src/components/db/sql/queries-book-besties.ts" file.
- The book schema is nearly identical to the poem schema, except that the poem schema has a poem_verse table and there is no counterpart for that in the book schema.

- The "src/app/(features)/(book)/book/page.tsx" file references a "book" object that contains an array of book table rows. The member details are also retrieved and passed to the "BookHomePage. 
- The "BookHomePage" component placeholder resides in "src/features/book/components/book-home-page.tsx" file.
- There is currently no data in the book table. 
- The "bookTermsPage" component placeholder resides in the "src/features/book/components/book-terms-home-page.tsx" file.

# OBJECTIVE

- The purpose of this request is to generate React and TipTap code for the "BookHomePage" as described below. 
- The "BookHomePage" is nearly identical functionally as what was implemented in the "PoetryHomePage" that resides in "src/features/poetry/components/poetry-home-page.tsx".  
- Pay close attention to the PoetryHomePage as stated above, functionally the Book Besties feature is nearly identical.

------------------------------------

When adding or editing a book, the submitter should be able to pick 1-3 tags from different book categories. 
- Currently in the book_tag_reference table there is a "tag_type" column that contains one of two values: "category" and "qualifier".
- Currently there are four rows in the table containing "category" in the "tag_type" column. 
- Associated with each category are rows with "qualifier" tag_types. 
- How are they related is via the seq_no on each row. The "category" entries have an seq_no of 10, 30, 90.
- I need a dropdown selection for each category and in the selection list their associated qualifiers. 
- How are the qualifiers associated with the category?
  - The category seq_no 10 pertains to Fiction.
  - The category seq_no 30 pertains to Non-Fiction.
  - The category seq_no 90 pertains to Other.

I would like to replace the current checkbox selection at the bottom of the Add or Edit Book form with three dropdown lists, one for each category. Each dropdown list should contain the associated qualifiers for that category. The user should be able to select 1-3 tags from these dropdown lists when adding or editing a book.
- As was done in the Poetry Tag Selection, allow 1-3 tags to be selected from any other the selection lists.
- Within each selection list, also include the category as a non-selectable header to provide context for the qualifiers. For example, in the Fiction dropdown, the first item would be "Fiction" (non-selectable), followed by the associated qualifiers that are selectable.

