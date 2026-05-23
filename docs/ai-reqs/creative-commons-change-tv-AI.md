# General Requirements

I have to make a fairly dramatic change in the way that tv shows and movies (but not in this pass) are rendered in the scroll strips. 
I am trying to get past licensing issues on image uploads so I want to give them another option other than uploading an image.
On the Add Show or Edit Show dialogs provide two options, one of which they must elect: upload a show image or provide a show site URL. 

The first option is already support and we'll keep that option.
The second option entails the member providing a URL of the TV show or Movie, which is provided in a new field new field in the Add Show or Add Movie dialogs. 
If they elect to use this option then what I would like to do is to render the show title in place of where the image would be shown, with a black background and white text lettering.

Wrapped around the show text tile would be a link that when clicked would open a small-medium size modal dialog that references the show site URL. Clicking on the background would close this dialog. 

# Detailed Requirements

## Database changes
 - The showSiteUrl has been added to the show table. 
 - The movieSiteUrl has been added to the movie table.  
 - The movieCaption field in the movie table has been renamed to movieImageCredit. 
 - The showCaption in the show table has been renamed to showImageCredit.

- Showing Option 1 and Option 2 in the Add Show
  - A radio button to enable and disable the entry fields
  - The options should be side-by-side if possible. If not, then one above the other so it is clear that one or the other must be entered.
  
- If Option 1 then 
  - disable the show site URL fields
  - An image upload is required
  - The showSiteUrl field must contain the Creative Common attribution

- If Option 2 is selected
  - When entering the showSiteUrl only two domains are allowed:
    - https://www.imdb.com
    - https://www.youtube.com


--------------------------------

Where the showSiteUrl link is updated implement a choce of five different dark colors (as radio button) entitled "Background": Red, Black, Navy, Orange, Green.
Set that color in the showSiteUrl when rendered. 
The pointer when mousing over the showSiteUrl link must change to the hand, to indicate the presence of a link.

---------------------------------

- The following hex color codes should be saved in the showSiteBackground field in the show table:

Red: #FF292D 
Black: #000000
Navy: #007BA9
Orange: #FF9500
Green: #02C00C

- Create an exported constant for the color schemes in the support/types/constants.tsx file. 
  - This will allow me to tweek the colors in one place and have it reflected everywhere.