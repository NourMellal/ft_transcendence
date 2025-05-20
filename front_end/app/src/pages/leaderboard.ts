import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import { fetchAllRanks } from '~/api/leaderboard';
import type { LeaderBoardEntry } from '~/api/leaderboard';

export default class LeaderboardPage extends HTMLElement {
  private currentPage: number = 0; // Start page at 0
  private itemsPerPage: number = 10;
  private leaderboardEntries: LeaderBoardEntry[] = [];
  private isLoading: boolean = true;
  private errorMessage: string | null = null;
  private isLastPage: boolean = false;

  async loadLeaderboardData() {
    this.isLoading = true;
    this.errorMessage = null;
    this.render();

    try {
      const result = await fetchAllRanks(this.currentPage);
      if (result.success) {
        if (result.data.length === 0 && this.currentPage > 0) {
          this.currentPage = 0;
          this.loadLeaderboardData();
          return;
        }
        this.leaderboardEntries = result.data;
        this.isLastPage = result.data.length < this.itemsPerPage;
      } else {
        this.errorMessage = result.message || 'Failed to load leaderboard data.';
        this.leaderboardEntries = [];
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      this.errorMessage = 'An unexpected error occurred.';
      this.leaderboardEntries = []; // Clear old data on error
    } finally {
      this.isLoading = false;
      this.render(); // Re-render with data or error
    }
  }

  render() {
    const isFirstPage = this.currentPage === 0; // First page is 0

    this.replaceChildren(html`
      <div class="container mt-16">
        <h1 class="text-3xl font-bold mb-6">Leaderboard</h1>
        ${this.isLoading
          ? html`<div class="text-center p-4">Loading...</div>`
          : this.errorMessage
          ? html`<div class="text-red-500 p-4 rounded-md border border-red-500">
              ${this.errorMessage}
            </div>`
          : this.leaderboardEntries.length === 0 && this.currentPage === 0
          ? html`
              <div class="text-muted-foreground p-4 rounded-md border">No data available.</div>
            `
          : html`
              ${this.leaderboardEntries.length > 0
                ? html` <div class="border rounded-lg overflow-hidden mb-4">
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
                        ${this.leaderboardEntries.map(
                          (player) => html`
                            <tr class="border-b transition-colors hover:bg-muted/50">
                              <td class="p-4 align-middle font-medium">${player.rank}</td>
                              <td class="p-4 align-middle">${player.username}</td>
                              <td class="p-4 align-middle text-right">${player.wins}</td>
                              <td class="p-4 align-middle text-right">${player.losses}</td>
                            </tr>
                          `
                        )}
                      </tbody>
                    </table>
                  </div>`
                : html`
                    <div class="text-muted-foreground p-4 rounded-md border">
                      No further data available on this page.
                    </div>
                  `}
              <div class="flex items-center justify-end space-x-2 mt-4">
                <button
                  id="prev-page"
                  class="btn btn-sm btn-outlined"
                  ${isFirstPage ? 'disabled' : ''}
                >
                  Previous
                </button>
                <span class="text-sm text-muted-foreground"> Page ${this.currentPage + 1} </span>
                <button
                  id="next-page"
                  class="btn btn-sm btn-outlined"
                  ${this.isLastPage ? 'disabled' : ''}
                >
                  Next
                </button>
              </div>
            `}
      </div>
    `);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const prevButton = this.querySelector('#prev-page');
    const nextButton = this.querySelector('#next-page');

    prevButton?.addEventListener('click', () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.loadLeaderboardData();
      }
    });

    nextButton?.addEventListener('click', () => {
      if (!this.isLastPage) {
        this.currentPage++;
        this.loadLeaderboardData();
      }
    });
  }

  connectedCallback() {
    this.loadLeaderboardData();
  }
}

customElements.define('leaderboard-page', LeaderboardPage);
