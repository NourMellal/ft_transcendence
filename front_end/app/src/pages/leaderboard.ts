import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';

const leaderboardData = [
  { rank: 1, name: 'Player One', wins: 25, losses: 5 },
  { rank: 2, name: 'Player Two', wins: 22, losses: 8 },
  { rank: 3, name: 'Player Three', wins: 20, losses: 10 },
  { rank: 4, name: 'Player Four', wins: 18, losses: 12 },
  { rank: 5, name: 'Player Five', wins: 15, losses: 15 },
  { rank: 6, name: 'Player Six', wins: 12, losses: 18 },
  { rank: 7, name: 'Player Seven', wins: 10, losses: 20 },
  { rank: 8, name: 'Player Eight', wins: 8, losses: 22 },
  { rank: 9, name: 'Player Nine', wins: 5, losses: 25 },
  { rank: 10, name: 'Player Ten', wins: 2, losses: 28 },
  { rank: 11, name: 'Player Eleven', wins: 1, losses: 29 },
  { rank: 12, name: 'Player Twelve', wins: 0, losses: 30 },
];

export default class LeaderboardPage extends HTMLElement {
  private currentPage: number = 1;
  private itemsPerPage: number = 10;
  private totalPages: number = 1;

  constructor() {
    super();
    this.totalPages = Math.ceil(leaderboardData.length / this.itemsPerPage);
  }

  render() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const paginatedData = leaderboardData.slice(startIndex, endIndex);
    const isFirstPage = this.currentPage === 1;
    const isLastPage = this.currentPage === this.totalPages;

    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <div class="container mt-16">
        <h1 class="text-3xl font-bold mb-6">Leaderboard</h1>
        ${leaderboardData.length === 0
          ? html`
              <div class="text-muted-foreground p-4 rounded-md border">No data available.</div>
            `
          : html`
              <div class="border rounded-lg overflow-hidden mb-4">
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
                    ${paginatedData.map(
                      (player) => html`
                        <tr class="border-b transition-colors hover:bg-muted/50">
                          <td class="p-4 align-middle font-medium">${player.rank}</td>
                          <td class="p-4 align-middle">${player.name}</td>
                          <td class="p-4 align-middle text-right">${player.wins}</td>
                          <td class="p-4 align-middle text-right">${player.losses}</td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
              ${this.totalPages > 1
                ? html`
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        id="prev-page"
                        class="btn btn-sm btn-outlined"
                        ${isFirstPage ? 'disabled' : ''}
                      >
                        Previous
                      </button>
                      <span class="text-sm text-muted-foreground">
                        Page ${this.currentPage} of ${this.totalPages}
                      </span>
                      <button
                        id="next-page"
                        class="btn btn-sm btn-outlined"
                        ${isLastPage ? 'disabled' : ''}
                      >
                        Next
                      </button>
                    </div>
                  `
                : ''}
            `}
      </div>
    `);
    this.setup();
  }

  setup() {
    const prevButton = this.querySelector('#prev-page');
    const nextButton = this.querySelector('#next-page');

    prevButton?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
    });

    nextButton?.addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.render();
      }
    });
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define('leaderboard-page', LeaderboardPage);
