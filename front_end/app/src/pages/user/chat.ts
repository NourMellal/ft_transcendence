import "~/components/navbar/navigation-bar"; // Ensure the navigation bar component is registered

class ChatPage extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    // Placeholder data for friends list
    const friends = [
      { id: 1, name: "Alice", avatar: "/api/static/profile/default.jpg" },
      { id: 2, name: "Bob", avatar: "/api/static/profile/default.jpg" },
      { id: 3, name: "Charlie", avatar: "/api/static/profile/default.jpg" },
    ];

    // Placeholder data for chat messages
    const messages = [
      {
        sender: "Alice",
        text: "Hey, how are you?",
        time: "10:30 AM",
        isOwn: false,
      },
      {
        sender: "You",
        text: "Hi Alice! I'm good, thanks. How about you?",
        time: "10:31 AM",
        isOwn: true,
      },
      {
        sender: "Alice",
        text: "Doing well! Ready for the match later?",
        time: "10:32 AM",
        isOwn: false,
      },
    ];

    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <div class="container mx-auto">
        <div class="flex h-[calc(100vh-10rem)] border rounded-lg overflow-hidden">
          <!-- Sidebar - Friends List -->
          <aside class="w-1/4 border-r bg-card p-4 flex flex-col">
            <h2 class="text-lg font-semibold mb-4 text-card-foreground">Friends</h2>
            <div class="flex-1 overflow-y-auto space-y-2">
              ${friends
                .map(
                  (friend) => /*html*/ `
                    <a href="#" class="flex items-center gap-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                      <img src="${friend.avatar}" alt="${friend.name}" class="w-8 h-8 rounded-full object-cover">
                      <span class="text-sm font-medium text-foreground">${friend.name}</span>
                    </a>
                  `
                )
                .join("")}
            </div>
          </aside>

          <!-- Main Chat Area -->
          <main class="w-3/4 flex flex-col bg-background">
            <!-- Chat Header -->
            <header class="border-b p-4 bg-card">
              <h3 class="text-lg font-semibold text-card-foreground">Chat with Alice</h3>
            </header>

            <!-- Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              ${messages
                .map(
                  (msg) => /*html*/ `
                    <div class="flex ${
                      msg.isOwn ? "justify-end" : "justify-start"
                    }">
                      <div class="max-w-xs lg:max-w-md">
                        <div class="text-xs text-muted-foreground mb-1 ${
                          msg.isOwn ? "text-right" : "text-left"
                        }">
                          ${msg.sender} - ${msg.time}
                        </div>
                        <div class="p-3 rounded-lg ${
                          msg.isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }">
                          <p class="text-sm">${msg.text}</p>
                        </div>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>

            <!-- Message Input -->
            <footer class="border-t p-4 bg-card">
              <div class="flex items-center gap-2">
                <input type="text" placeholder="Type your message..." class="input flex-1">
                <button class="btn btn-primary">Send</button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    `;
  }

  setup() {
    // Add event listeners or other setup logic here
    // e.g., handle clicking on friend links, sending messages
  }

  connectedCallback() {
    this.render();
    this.setup();
  }

  disconnectedCallback() {
    // Clean up event listeners or other resources if needed
  }
}

customElements.define("chat-page", ChatPage);
