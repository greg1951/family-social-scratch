import { FileText, Heart } from "lucide-react";

export const musicSalonFaqItems = [
  {
    value: "item-10",
    category: "Music Salon",
    trigger: (
      <div>
        <p className="text-base font-semibold">What <i>music</i> sharing platforms are supported by the Music Room <i>Playlist</i> support?</p>
        <p className="text-xs text-slate-600">Presently only Spotify is supported but the Apple Music Store will be supported in the future.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-sm text-slate-600">We added Spotify support first because it has the largest market share of music sharing platforms. 
            However, the Apple Music Store will be added at some point in the future.</p>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-11",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">What Spotify account type will allow me to create a Music playlist?</p>
        <p className="text-xs text-slate-600">Any Spotify <b>premium</b> account will allow you to create a playlist.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-sm text-slate-600">Any of the Spotify <b>premium account types</b> will work. 
          The Spotify <u>free account</u> will not allow you to create a playlist. The songs in the playlist can be played individually but you cannot play the full playlist.</p>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-12",
    category: "Music Salon",
    trigger: (
      <div>
        <p className="text-base font-semibold">I have a Spotify account, but the Playlist buttons are <b>disabled</b>. What does that mean?</p>
        <p className="text-xs text-slate-600">Expand this entry to see a checklist for how to enable the Playlist buttons.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-base font-semibold">There may be one or more reasons; the list below may resolve why those buttons are not enabled.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>You must log in to Spotify <u>first</u> before logging into My Family Social. A Spotify access token will then be made available to my family social to enable the Spotify playback.</li>
            <li> The Spotify email login must be the same as the email address that you&apos;re using in My Family Social.</li>
          </ol>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-13",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">The playlist buttons are enabled, but when I click play, I&apos;m seeing an error <i>No active Spotify device found.</i> What does this mean?</p>
        <p className="text-xs text-slate-600">This is an easy one to resolve. Expand this entry to see how to Resolve this error.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-base font-semibold">There may be a couple of reasons why you&apos;re getting this error, but it&apos;s one of those listed below.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>The Spotify Playback feature requires that your Spotify be active. In Spotify, simply click play on any song and then stop it and then start the Music Room playlist again.</li>
            <li>The Spotify Playback Session timeout is good for one hour. It could be that all you need to do is just log back into Spotify to resolve this.</li>
          </ol>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-20",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">How do I add Music Lyrics for an Album I created in the Music Salon feature?</p>
        <p className="text-xs text-slate-600">Lyrics have a different twist that you won&apos;t find in the other features.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">The short answer is that Lyrics are associated with a <b>Song</b> and not an <b>Album</b>.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select <b>Add Music</b> at the top right of the Music Salon heading.</li>
            <li>If you look right above the Music Image section, you&apos;ll see the <b>Type</b> option defaults to <i>Song</i>.</li>
            <li>Add information relevant to your song and <b>Save the Song</b>.</li>
            <li>Once the song is safely saved, you can add lyrics to it by choosing the <b>Add Lyrics</b> button. </li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-190 h-65 md:w-200 md:h-80"
              src="/images/support/faq-edit-song-lyrics.jpg"
              alt="Music Lyrics"
            />
          </div>
          <p className="text-base font-semibold">As shown above, when adding the Lyrics:</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>If you paste in lyrics (which most likely you will do), be sure to add blank lines between the song verses.</li>
            <li>When you are about to save the song lyrics, change the status to <b>Published</b> if you are ready for others to see the Lyrics.</li>
            <li>Be sure to <b>Save the Lyrics</b>.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
