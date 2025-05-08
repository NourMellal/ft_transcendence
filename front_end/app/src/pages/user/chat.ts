import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';

export default class ChatPage extends HTMLElement {
  private isFriendsListOpen: boolean = false;

  render() {
    // Placeholder data for friends list
    const friends = [
      { id: 1, name: 'Alice', avatar: '/api/static/profile/default.jpg' },
      { id: 2, name: 'Bob', avatar: '/api/static/profile/default.jpg' },
      { id: 3, name: 'Charlie', avatar: '/api/static/profile/default.jpg' },
    ];

    // Placeholder data for chat messages
    const messages = [
      {
        sender: 'Alice',
        text: 'Hey, how are you?',
        time: '10:30 AM',
        isOwn: false,
      },
      {
        sender: 'You',
        text: "Hi Alice! I'm good, thanks. How about you?",
        time: '10:31 AM',
        isOwn: true,
      },
      {
        sender: 'Alice',
        text: 'Doing well! Ready for the match later?',
        time: '10:32 AM',
        isOwn: false,
      },
    ];

    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <div class="container mx-auto">
        <div
          class="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden"
        >
          <!-- Sidebar - Friends List -->
          <aside
            id="friendsList"
            class="fixed md:relative w-3/4 md:w-1/4 h-full border-r bg-card p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${this
              .isFriendsListOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'}"
            style="z-index: 20;"
          >
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-card-foreground">
                Friends
              </h2>
              <button
                class="md:hidden p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div class="flex-1 overflow-y-auto space-y-2">
              ${friends.map(
                (friend) => html`
                  <a
                    href="#"
                    class="flex items-center gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <img
                      src="${friend.avatar}"
                      alt="${friend.name}"
                      class="w-8 h-8 rounded-full object-cover"
                    />
                    <span class="text-sm font-medium text-foreground"
                      >${friend.name}</span
                    >
                  </a>
                `
              )}
            </div>
          </aside>

          <!-- Main Chat Area -->
          <main class="w-full md:w-3/4 flex flex-col bg-background">
            <!-- Chat Header -->
            <header class="flex items-center gap-4 border-b p-4 bg-card">
              <!-- Mobile Toggle Button -->
              <button id="friendsToggle" class="md:hidden ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h3 class="text-lg font-semibold text-card-foreground">
                Chat with Alice
              </h3>
            </header>

            <!-- Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              ${messages.map(
                (msg) => html`
                  <div
                    class="flex ${msg.isOwn ? 'justify-end' : 'justify-start'}"
                  >
                    <div class="max-w-xs lg:max-w-md">
                      <div
                        class="text-xs text-muted-foreground mb-1 ${msg.isOwn
                          ? 'text-right'
                          : 'text-left'}"
                      >
                        ${msg.sender} - ${msg.time}
                      </div>
                      <div
                        class="p-3 rounded-lg ${msg.isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'}"
                      >
                        <p class="text-sm">${msg.text}</p>
                      </div>
                    </div>
                  </div>
                `
              )}
            </div>

            <!-- Message Input -->
            <footer class="border-t p-4 bg-card">
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  class="input flex-1"
                />
                <button class="btn btn-primary">Send</button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    `);
    this.setup();
  }

  setup() {
    const friendsToggle = this.querySelector('#friendsToggle');
    const friendsList = this.querySelector('#friendsList');
    const closeButton = this.querySelector('#friendsList button');

    if (friendsToggle && friendsList) {
      friendsToggle.addEventListener('click', () => {
        this.isFriendsListOpen = true;
        friendsList.classList.remove('-translate-x-full');
        friendsList.classList.add('translate-x-0');
      });
    }

    if (closeButton && friendsList) {
      closeButton.addEventListener('click', () => {
        this.isFriendsListOpen = false;
        friendsList.classList.add('-translate-x-full');
        friendsList.classList.remove('translate-x-0');
      });
    }
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    // Clean up event listeners or other resources if needed
  }
}

customElements.define('chat-page', ChatPage);
