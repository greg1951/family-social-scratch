## Overview 
Provide the ability in the music playlist list to capture music media images automatically via the Spotify APIs after a playlist is created. The goal is to capture the media image **under the covers** so that the user doesn't have to provide one until after they've added the music playlist. 

## Analysis 

- Reference the `music_playlist_media` table inside the `family-social-schema-tables.ts` file. 
  - A new column `media_image_url` has been added to the table to persist the artist image value rerieved from Spotify. 
    - The artist value is input into the `media_artist` column 
  - The `use_image_url` table column is a boolean that indicates to not use the Spotify image for a playlist media entry.

## Spotify API 
- Provided below is the Spotify developer documentation for how to use their APIs:
  - https://developer.spotify.com/documentation/web-api/howtos/web-app-profile
 
- The Client ID and Client Secret used for the Spotify API are defined inside environment variables: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET

- It is the `GET /artistId` method (see Search for Item) that retrieves the artist image. To get the artist ID, it will be necessary to run the `GET /search` method that takes a `type` argument of "artist"

## Implementation 
The goal is to to show an image on each of the music playlist cards when a music playlist is viewed. To simplify the user experience the application should call the Spotify API to locate a good image for each of the entries in the playlist media cards.
 
- The current add music page for adding a playlist should include a `use spotify artist image` checkbox (updates `use_image_url` column) when they're adding a media playlist entry in their playlist that allows the artist image to be automatically retrieves and rendered for the entered nedia playlist being entered. 

- When a music playlist is being edited, there should be a small image shown for each of the media playlist entries that were defined previously when the playlist was created.   
  - In the event the member does not want to use the image that was located automatically by calling the Spotify API it could be not used, by also including the `Use Spotify artist image` checkbox. 