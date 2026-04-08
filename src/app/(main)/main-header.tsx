import NavBar from "@/components/common/nav-bar";
import { getSessionEmail } from "@/features/auth/services/auth-utils";
import HeaderImage from "@/components/common/header-img";
import MainDropMenu from "../../components/common/main-dropmenu";

export default async function MainHeader({ isLoggedIn, isFounder, firstName }: { isLoggedIn: boolean; isFounder: boolean; firstName: string }) {
  const session = await getSessionEmail();
  let email: string = "";
  if (session.found) {
    email = session.userEmail!;
  }

  return (
    <>
      <header className="font-app px-2 pt-2 md:px-4 md:pt-3">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[1.9rem] border border-white/65 bg-[linear-gradient(135deg,rgba(11,47,66,0.96),rgba(21,98,123,0.88)_56%,rgba(106,177,198,0.8))] p-3 text-white shadow-[0_24px_70px_-42px_rgba(8,34,50,0.95)] md:p-4">
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <nav className="rounded-[1.5rem] border border-white/30 bg-white/12 px-3 py-3 backdrop-blur md:px-4">
              <ul className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                <NavBar isLoggedIn={ isLoggedIn } href="/tv" src="/icons/tv.png" title="TV Junkies" />
                <NavBar isLoggedIn={ isLoggedIn } href="/movies" src="/icons/movies.png" title="Movie Maniacs" />
                <NavBar isLoggedIn={ isLoggedIn } href="/music" src="/icons/music.png" title="Music Lovers" />
                <NavBar isLoggedIn={ isLoggedIn } href="/books" src="/icons/book.png" title="Book Besties" />
                <NavBar isLoggedIn={ isLoggedIn } href="/poetry" src="/icons/poetry.png" title="Poetry Cafe" />
                <NavBar isLoggedIn={ isLoggedIn } href="/foodies" src="/icons/food.png" title="Family Foodies" />
                <NavBar isLoggedIn={ isLoggedIn } href="/games" src="/icons/games.png" title="Games Scoreboard" />
                <NavBar isLoggedIn={ isLoggedIn } href="/threads" src="/icons/family.png" title="Family Threads" />
                <MainDropMenu firstName={ firstName } email={ email } sessionFound={ session.found } isFounder={ isFounder } />
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <div className="p-1" />
    </>
  );
}