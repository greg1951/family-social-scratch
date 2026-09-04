import { FileText } from "lucide-react";

export const musicSalonFaqItems = [
  {
    value: "item-1",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">What can be posted in the Music Room?</p>
        <p className="text-xs text-slate-600">There are three types of posts in the music room:
- Albums
- Songs
- Playlists</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">The goal in the Music Room is to let members share their favorite music, be it an album, a song, or a playlist.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Create an <b>Album</b> when you have a favorite artist who has produced a record that you really enjoy and want to let everybody know about it.</li>
            <li>Create a <b>Song</b> when you have a particular track on a record that you really enjoy and perhaps want to publish the lyrics for.</li>
            <li>Create a <b>Playlist</b> if you have a supported music player and want to share your playlist tracks with the family.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-2",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">How do I add Music Lyrics for an Album I created in the Music Salon feature?</p>
        <p className="text-xs text-slate-600">Lyrics are associated with the <u>song</u> music type and not the <u>album</u> music type</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Create a <b>Song</b> review.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select <b>Add Music</b> in the Music Room heading area.</li>
            <li>If you look right above the Music Image section, you&apos;ll see the <b>Type</b> option defaults to <i>Song</i>.</li>
            <li>Add information relevant to the song, as well as the album and the artist name.</li>
            <li>Be sure to use the <b>Auto-Find Image</b> feature to <i>auto-magically</i> find an image for your song review, as this makes for a more attractive music post.</li>
          </ol>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-3",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">When I&apos;m adding a music review, I see this checkbox called &quot;Auto-Find Album Image&quot;. What is that used for?</p>
        <p className="text-xs text-slate-600">The Auto-Find Album Image feature helps you quickly find an album image for your music review.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">Create a <b>Song</b> review.</p>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select <b>Add Music</b> in the Music Room heading area.</li>
            <li>If you look right above the Music Image section, you&apos;ll see the <b>Type</b> option defaults to <i>Song</i>.</li>
            <li>Add information relevant to the song, as well as the album and the artist name.</li>
            <li>By entering the album name where the song is contained, you can use the <b>Auto-Find Image</b> feature to <i>auto-magically</i> find an image for your song review, so you don&apos;t have to upload one manually.</li>
          </ol>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-130 h-65 md:w-200 md:h-80"
              src="/images/support/faq-music-auto-find.jpg"
              alt="Music image find"
            />
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-10",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">What <i>music</i> sharing platforms are supported by the Music Room <i>Playlist</i> support?</p>
        <p className="text-xs text-slate-600">Presently <b>Spotify</b> is supported but the Apple Music Store may be added in the future.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-sm text-slate-600 pb-2">We added Spotify support first because it has the largest market share of music sharing platforms. 
            However, the Apple Music Store may be added at some point in the future.</p>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-11",
    category: "Music Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">I have Spotify, but the playlist play buttons on a Spotify playlist <u>are not enabled</u>.</p>
        <p className="text-xs text-slate-600">Update your account member profile <i>Music Player</i> setting.</p>
      </div>
    ),
    content: (
      <div>
          <p className="text-sm text-slate-600">In the member account settings, open the <b>My Settings</b> tab and then check <i>Spotify</i> as your preferred music player.</p>

      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-12",
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
    value: "item-13",
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
    value: "item-14",
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
    value: "item-15",
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
    value: "item-16",
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
];
