## Overview
In the Book and Poetry features there will be an additional capability of a book or poetry club. To handle this, there is new schema created to support it. This request will define various dialogs that will be provided to create a club which can be used for both book and poem discussions. 

## Club Schema
- The table schema definitions can be found in "src/components/db/schema/family-social-schema-tables.ts" file 
- There are two new schema tables: `club` and `club_session`
- The `club_session` is a child of the `club` table
- A `member` creates a `club` entity, gives it a name and the member is recorded as the clubFounder.

- A `club_session` is an instance of a club's discussion of a book or poem.
  - There are a `club_sesion` start and end dates
  - A member is assigned to a club_session to moderate the discussion
  - A `club_session` is tied to an instance of a selected `book` or `poem` 
    - A `discuss_thread` instance is created for the `club_session`.
    - The book or poem title becomes the discussTopic in the `discuss_thread`
    - The targetType and targetId columns in `discuss_thread` relate to the selected book or poem id.
    - The postMemberId column is the memberId who creates the `club_session`. 
    - The member who creates the club_session also sets the topicJson column content about the selected book or poem. 

## UI Requirements
There needs to be a common location where a club can be created. 
- A button to access the Club home page needs to be available in the Book and Poem home pages (in the heading, to the right of the "Back to Main Page" button).

- This button's text would be "Book & Poetry Clubs"

- In the app router, the home page to list and to create the a club will be in "src/app/(features)/(clubs)/add-club/page.tsx"
  - The page will provide a list of the club table entities.
  - There will be buttons to **add** and to **edit** a club.

- In the Book or Poetry home page the Discussion Threads now relates to a Club Session instance.
  - The title on the home page for "Discussion Threads" is now "Start Book Book Club Session" or "Start  Poetry Club Session".

  - The current "Add Discussion" button will now be "Add Book Club Session" or "Add Poetry Club Session". It will not be enabled if there are no club instances for the family. (They would need to first create one via the "Book & Poetry Clubs" button.

- When the member clicks on the Add Club Session button (if it's enabled) then the will be directed to a page where they can define the book or poetry club session and in the app router it will be located in "src/app/(features)/(clubs)/add-club-session/page.tsx". Use the "src/components/features/clubs" directory where the home page components and types can be located.

  - The select book or poem **id** and either "book" or "poem" will be carried over to this page as request parameters, where the book or poem title will be shown.
  - It is possible for there to be more than one book/poetry club in a family so the book/poetry club needs to be in a selectable list.
  - If the selected book or poem already has a club session defined then there is nothing to be added.
    - Only one book or poem `club_session` instance can be active at a time.
  - If there are no current club_session instances defined "targetType" of "poem" or "book" and "targetId" equal to the request id and "book" or "poem" request parameters.
  - Which ever member is creating the `club_session` becomes the moderator (moderatorId in table).
  - The moderator will be provided with a basic TipTap text area to define the topicJson column content in the `discuss_thread` entity.
    - H3, B, I, U, bullet and number lists toolbar buttons. 

- On the Book and Poetry home pages, change the "Filter with Discussion Threads" checkbox wording to "Filter Book Clubs" or "Filter Poetry Clubs". The filtering should still be looking at any associated books or poems for which there was a club_session created for books or poems at large.