# Overview

Create UI pages that will allow an admin to add and edit book tag categories and the associated tag details in each category.

# Background

## App Router

- The next.js app router path is created as "src/app/(support)/(logged-in)/(book)/add-book-tags"
- The page.tsx file there is a placeholder that needs to be updated to reference a new component that will be generated and should reside in the following directory: "src/features/support/components".
- The page also contains logic to ensure that only an admin has access to page, otherwise a warning logged and the user is returned to the main page.

## Database Schema
Three new tables have been created to replace the current tags selected for a book:
- `bookCategoryReference`: will contain rows for the book categories
- `bookCategoryTagReference`: will contain individual rows of tags associated with a row in the poemCategoryReference
- `bookCategoryTag`: junction table that contains intersection of book.id and bookCategoryTagReference.id.
- The tables have been created and pushed to the Neon platform.
- The previous book tag tables have been removed: bookTagReference, bookTag
 
# AI Request

The dialog to add or edit the book category should provide on a list that is grouped by the tag category, and below each category group would be the related entries from the bookCategoryTagReference table. 

- The main page list of book tag categories/tag names should follow the same layout as implemented in the add-poem-tags page. 
  - On each category there should be two buttons: One to Add a tag for the category and the other to edit the tag for the category.
  - In the add/edit dialog TipTab editor buttons should be provided for the tagJson content: B, I, U, Bullet and Number lists, link and unlink toolbar buttons.

