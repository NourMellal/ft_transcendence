import '~/components/navbar/navigation-bar';

import { userStore } from '~/app-state';
import { navigateTo } from '~/components/app-router';
import { html } from '~/lib/html';

export default class HomePage extends HTMLElement {
  render() {
    if (userStore.get()) {
      return navigateTo('/profile');
    }
    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <main class="min-h-screen bg-background">
        <section
          class="h-screen relative overflow-hidden bg-gradient-to-b from-background to-muted/50"
        >
          <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div class="container relative mx-auto px-4 py-24 md:py-32">
            <div class="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <div
                class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                <span class="relative flex h-2 w-2">
                  <span
                    class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
                  ></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Ready to Play
              </div>
              <h1 class="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
                Elevate Your <span class="text-primary">Ping Pong</span> Game
              </h1>
              <p class="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                Join our ping pong platform where skill meets competition. Experience smooth
                gameplay, climb the ranks, and connect with players worldwide.
              </p>
              <div class="flex flex-col items-center sm:flex-row gap-4 pt-4">
                <a href="/signin" class="btn btn-primary px-8 py-3 text-lg"> Start Playing </a>
                <a href="/leaderboard" class="btn btn-outlined px-8 py-3 text-lg">
                  View Rankings
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- Features Section -->
        <section class="py-24">
          <div class="container mx-auto px-4">
            <div class="text-center max-w-2xl mx-auto mb-16">
              <h2 class="text-3xl md:text-4xl font-bold mb-4 text-foreground">Key Features</h2>
              <p class="text-muted-foreground text-lg">
                Discover what makes our ping pong experience unique
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div
                class="group bg-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border/50"
              >
                <div
                  class="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-3 text-foreground">Smooth Gameplay</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Experience responsive and fluid gameplay with our optimized game engine and
                  intuitive controls.
                </p>
              </div>
              <div
                class="group bg-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border/50"
              >
                <div
                  class="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-3 text-foreground">Competitive Ranking</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Climb the global leaderboard with our sophisticated ELO rating system and seasonal
                  tournaments.
                </p>
              </div>
              <div
                class="group bg-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border/50"
              >
                <div
                  class="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-semibold mb-3 text-foreground">Social Features</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Connect with friends, join clubs, and participate in community events and
                  challenges.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Game Modes Section -->
        <section class="py-24 bg-muted/30">
          <div class="container mx-auto px-4">
            <div class="text-center max-w-2xl mx-auto mb-16">
              <h2 class="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Choose Your Game Mode
              </h2>
              <p class="text-muted-foreground text-lg">
                Select from our competitive and practice game modes
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div
                class="group bg-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border/50"
              >
                <div class="flex items-center gap-4 mb-6">
                  <div
                    class="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xl"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </div>
                  <h3 class="text-2xl font-semibold text-foreground">1v1 Match</h3>
                </div>
                <p class="text-muted-foreground mb-6 leading-relaxed">
                  Challenge other players in competitive 1v1 matches. Test your skills and climb the
                  leaderboard.
                </p>
                <a href="/quick-match" class="btn btn-primary w-full"> Play Now </a>
              </div>
              <div
                class="group bg-card p-8 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-border/50"
              >
                <div class="flex items-center gap-4 mb-6">
                  <div
                    class="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xl"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                      <path d="M12 9v4"></path>
                      <path d="M8 11h8"></path>
                    </svg>
                  </div>
                  <h3 class="text-2xl font-semibold text-foreground">Play vs AI</h3>
                </div>
                <p class="text-muted-foreground mb-6 leading-relaxed">
                  Practice against our AI opponent. Perfect for honing your skills and learning new
                  techniques.
                </p>
                <a href="/ai-match" class="btn btn-primary w-full"> Play Now </a>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA Section -->
        <section class="py-24">
          <div class="container mx-auto px-4">
            <div class="p-12 text-center max-w-4xl mx-auto">
              <h2 class="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Ready to Start Your Journey?
              </h2>
              <p class="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of players worldwide and experience the future of online ping pong.
              </p>
              <a href="/signup" class="btn btn-primary px-8 py-3 text-lg"> Create Your Account </a>
            </div>
          </div>
        </section>
      </main>
    `);
    this.setup();
  }

  setup() {
    //
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define('home-page', HomePage);
