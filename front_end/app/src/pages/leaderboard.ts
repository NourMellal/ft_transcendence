const leaderboardData = [
  { rank: 1, name: "Player One", wins: 25, losses: 5 },
  { rank: 2, name: "Player Two", wins: 22, losses: 8 },
  { rank: 3, name: "Player Three", wins: 20, losses: 10 },
  { rank: 4, name: "Player Four", wins: 18, losses: 12 },
  { rank: 5, name: "Player Five", wins: 15, losses: 15 },
  { rank: 6, name: "Player Six", wins: 12, losses: 18 },
  { rank: 7, name: "Player Seven", wins: 10, losses: 20 },
  { rank: 8, name: "Player Eight", wins: 8, losses: 22 },
  { rank: 9, name: "Player Nine", wins: 5, losses: 25 },
  { rank: 10, name: "Player Ten", wins: 2, losses: 28 },
];

class LeaderboardPage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <div class="container py-10">
        <h1 class="text-3xl font-bold mb-6">Leaderboard</h1>
        <div class="border rounded-lg overflow-hidden">
          <table class="w-full caption-bottom text-sm">
            <thead class="[&_tr]:border-b">
              <tr class="border-b transition-colors hover:bg-muted/50">
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]"
                >
                  Rank
                </th>
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                >
                  Player
                </th>
                <th
                  class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                >
                  Wins
                </th>
                <th
                  class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                >
                  Losses
                </th>
              </tr>
            </thead>
            <tbody class="[&_tr:last-child]:border-0">
              ${leaderboardData
                .map(
                  (player) => /*html*/ `
                    <tr class="border-b transition-colors hover:bg-muted/50">
                      <td class="p-4 align-middle font-medium">
                        ${player.rank}
                      </td>
                      <td class="p-4 align-middle">${player.name}</td>
                      <td class="p-4 align-middle text-right">
                        ${player.wins}
                      </td>
                      <td class="p-4 align-middle text-right">
                        ${player.losses}
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  setup() {
    //
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define("leaderboard-page", LeaderboardPage);
