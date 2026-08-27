import { FileText, Heart } from "lucide-react";

export const musicSalonFaqItems = [
  {
    value: "item-1",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">What <i>music</i> sharing platforms are supported by the Music Room <i>Playlist</i> support?</p>
        <p className="text-xs text-slate-600">Presently Spotify is supported but the Apple Music Store will be added in the future.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-sm text-slate-600 pb-2">We added Spotify support first because it has the largest market share of music sharing platforms. 
            However, the Apple Music Store will be added at some point in the future.</p>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-2",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">I have Spotify, but I don&apos;t see the playlist play buttons on a Spotify playlist that someone else in the family created.</p>
        <p className="text-xs text-slate-600">Update your account member Preferred Music Player setting.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-sm text-slate-600">In the member account settings, open the Settings tab and then check Spotify as your preferred music player.</p>

      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-3",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">Is a playlist on My Family Social also a playlist on Spotify?</p>
        <p className="text-xs text-slate-600">No. They are separate playlists. We only play them on Spotify.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-sm text-slate-600">A playlist on My Family Social is not automatically a playlist on Spotify. The playlists are separate, and actions on one platform do not affect the other.</p>

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
          The Spotify <u>free account</u> will not allow you to create a playlist. However, the songs in the playlist can be played individually; you simply would not be able to play the full playlist.</p>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-12",
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
            <li>We have found that opening Spotify first and logging in, and then the My Family Social app generally works best.</li>
            <li>The Spotify App is open, but no device is active. Make sure you have an active Spotify device selected.</li>
            <li>The Spotify Playback Session timeout is good for one hour. It could be that all you need to do is just log back into Spotify to resolve this.</li>
            <li>Should the above steps not work, delete the browser history for the last 24 hours which is generally good enough. Then repeat the above steps again.</li>
          </ol>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-14",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">I have multiple Spotify accounts on different devices. When I run it on another device, it seems to be running on the another device. How do I stop this?</p>
        <p className="text-xs text-slate-600">This is actually an amazing feature of Spotify, and it&apos;s easily resolved. Expand the section below.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-base font-semibold">This behavior is not controlled by My Family Social playlist. You need to control it within Spotify.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>One way to do this is to log out of Spotify on the other device.</li>
            <li>However, the easiest solution would be to simply select the device you want to play it on in Spotify.</li>
          </ol>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-15",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">When I first start a playlist, playback is not starting immediately. Why is this?</p>
        <p className="text-xs text-slate-600">Simply switch to the Spotify client playback, and it should start right away.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-base font-semibold">This behavior is not controlled by My Family Social playlist.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Starting the Spotify web player will sometimes do this. Again, switching to the Spotify web player client should force it to play it right away.</li>
            <li>Rather than starting Spotify web player, consider just starting the default Spotify URL.</li>
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
