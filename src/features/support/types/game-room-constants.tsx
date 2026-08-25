import { FileText, Info, CircleAlert } from "lucide-react";

export const gameRoomFaqItems = [
  {
    value: "item-400",
    category: "Game Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">What does the Game Scoreboard feature provide?</p>
        <p className="text-sm text-slate-600">Families play games. The Game Scoreboard feature allows you to track scores and rankings for a number of popular games.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base font-semibold">In addition to tracking scores, there are leader boards, player stats and game history for each of the games.</p>
          <p className="text-sm ">Mexican Train, Acquire, Cricket (Darts) and Crokinole (for our California and our Canadian friends).</p>
          <ul className="list-disc ml-6 mt-2 text-sm">
            <li>It takes time to develop and perfect a game board. We will grow the game list over time.</li>
            <li>If there's a game we're missing, let us know by opening a support ticket and we'll take a look at adding it.</li>
          </ul>
          <p className="text-sm p-2">Shown below is an example of the Cricket dart game scoreboard. It uses a ledger entry format so the scores are automatically recorded.</p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-120 h-90 md:w-230 md:h-180"
              src="/images/support/faq-game-cricket-scoreboard.jpg"
              alt="Game Scoreboard"
            />
          </div>
          <div className="flex justify-left">
            <Info size={ 30 } className="inline-block mr-1" />
            <p className="text-sm p-2">Note the <i>Leaderboard</i>, <i>Player Stats</i>, and <i>Game History</i> sections to the right of the scoreboard.</p>

          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
  {
    value: "item-401",
    category: "Game Room",
    trigger: (
      <div>
        <p className="text-base font-semibold">I'm from Canada and I very much enjoy playing Crokinole. What does the Game Scoreboard feature provide?</p>
        <p className="text-sm text-slate-600">You happen to be in luck, eh? We have included Crokinole in our game list for our Canadian friends.</p>
      </div>
    ),
    content: (
      <div className="grid md:grid-cols-1 text-base">
        <span>
          <p className="text-base p-2">Starting a game involves selecting a supported game from the list, giving it a name, and click on the Start Game button.</p>
          <p className="text-base p-2">Or, if you save a partial game, select it from the list of saved games and then click on the Continue Game button.</p>
          <p className="text-sm p-2">Shown below is an example of the Crokinole game scoreboard. It uses a ledger entry format so the scores are automatically recorded.</p>
          <div className="flex justify-center pt-2 pb-2">
            <img className="aspect-auto object-cover w-150 h-90 md:w-230 md:h-190"
              src="/images/support/faq-game-crokinole.jpg"
              alt="Game Scoreboard"
            />
          </div>
          <ol className="list-decimal ml-6 mt-2 text-sm">
            <li>Select a new game or continue a previously saved game.</li>
            <li>From the Format selection, choose either <i>Singles</i> or <i>Doubles</i>. The game cannot be started until all of the players are chosen.</li>
            <p className="text-sm p-2">A cool feature of the Game Scoreboard is you can create guest players, if they aren't in the family.</p>
            <li>In each of the rounds, enter the number of points for each team or player.</li>
            <li>When the game is over, the scores are automatically recorded and can be viewed in the <i>Leaderboard</i>, <i>Player Stats</i>, and <i>Game History</i> sections.</li>
          </ol>
          <div className="flex justify-left">
            <CircleAlert size={ 30 } className="inline-block mr-1" />
            <p className="text-sm p-2">Be sure to <u>save the game</u> before exiting to ensure your scores are recorded.</p>
          </div>
        </span>
      </div>
    ),
    icon: FileText,
  },
];
