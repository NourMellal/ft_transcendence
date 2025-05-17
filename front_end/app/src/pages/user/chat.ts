import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import {
  fetchUserChats,
  fetchChatMessages,
  sendChatMessage,
  createNewChat,
  Chat,
  ChatMessage,
} from '~/api/chat';
import { PlusIcon } from '~/icons';
import { showDialog } from '~/components/dialog';

export default class ChatPage extends HTMLElement {
  private isSidebarOpen = false;
  private chats: Chat[] = [];
  private messages: ChatMessage[] = [];
  private selectedChat: Chat | null = null;
  private newMessageText = '';

  connectedCallback() {
    this.loadChats();
    this.render();
  }

  async loadChats() {
    const res = await fetchUserChats();
    if (res.success) {
      this.chats = res.data;
      this.render();
    }
  }

  async selectChat(uid: string) {
    const chat = this.chats.find((c) => c.UID === uid) || null;
    this.selectedChat = chat;
    this.messages = [];
    this.render();
    if (chat) {
      const res = await fetchChatMessages(chat.UID, 0);
      if (res.success) {
        this.messages = res.data;
        this.render();
        this.scrollToBottom();
      }
    }
  }

  async sendMessage() {
    if (!this.selectedChat || !this.newMessageText.trim()) return;
    const fd = new FormData();
    fd.append('message', this.newMessageText.trim());
    const res = await sendChatMessage(this.selectedChat.UID, fd);
    if (res.success) {
      this.newMessageText = '';
      await this.selectChat(this.selectedChat.UID);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.render();
  }

  closeDialog() {
    const dialog = this.querySelector<HTMLDivElement>('#new-chat-dialog')!;
    const animation = dialog.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(0.9)' },
      ],
      {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => {
      dialog.classList.add('hidden', 'opacity-0');
      dialog.classList.remove('flex');
    };
  }

  scrollToBottom() {
    const container = this.querySelector('.messages');
    if (container) setTimeout(() => (container.scrollTop = container.scrollHeight), 50);
  }

  render() {
    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <div class="container mx-auto">
        <div class="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden">
          <aside
            class="fixed md:relative w-3/4 md:w-1/4 h-full border-r bg-card p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${this
              .isSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'}"
            style="z-index:20"
          >
            <button
              id="btn-new-chat"
              class="btn-primary w-full mb-4 flex items-center justify-center gap-2"
            >
              ${PlusIcon}<span>New Conversation</span>
            </button>
            <div class="flex-1 overflow-y-auto space-y-2">
              ${this.chats.map(
                (chat) => html`
                  <button
                    class="chat-item w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${this
                      .selectedChat?.UID === chat.UID
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-foreground'}"
                    data-uid="${chat.UID}"
                  >
                    <span class="font-medium text-sm">${chat.name}</span>
                  </button>
                `
              )}
            </div>
            <button
              id="btn-close-sidebar"
              class="md:hidden p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors mt-4 self-end"
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
          </aside>

          <main class="w-full md:w-3/4 flex flex-col bg-background">
            <header class="flex items-center gap-4 border-b p-4 bg-card">
              <button id="btn-toggle-sidebar" class="md:hidden">
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
                ${this.selectedChat ? `Chat: ${this.selectedChat.name}` : 'Select a conversation'}
              </h3>
            </header>

            <div class="flex-1 overflow-y-auto p-4 space-y-4 messages">
              ${this.messages.map(
                (msg) => html`
                  <div
                    class="flex ${msg.user_uid === this.selectedChat?.uid_1
                      ? 'justify-end'
                      : 'justify-start'}"
                  >
                    <div class="max-w-xs lg:max-w-md">
                      <div
                        class="text-xs text-muted-foreground mb-1 ${msg.user_uid ===
                        this.selectedChat?.uid_1
                          ? 'text-right'
                          : 'text-left'}"
                      >
                        ${msg.user_uid === this.selectedChat?.uid_1
                          ? 'You'
                          : this.selectedChat?.name}
                        ·
                        ${new Date(msg.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div
                        class="p-3 rounded-lg ${msg.user_uid === this.selectedChat?.uid_1
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'}"
                      >
                        <p class="text-sm">${msg.message_text}</p>
                      </div>
                    </div>
                  </div>
                `
              )}
            </div>

            <footer class="border-t p-4 bg-card">
              <div class="flex items-center gap-2">
                <input
                  id="input-message"
                  type="text"
                  value="${this.newMessageText}"
                  placeholder="Type your message..."
                  class="input flex-1"
                />
                <button id="btn-send" class="btn btn-primary">Send</button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    `);
    this.setup();
  }

  setup() {
    this.querySelector('#btn-toggle-sidebar')?.addEventListener('click', () =>
      this.toggleSidebar()
    );
    this.querySelector('#btn-close-sidebar')?.addEventListener('click', () => this.toggleSidebar());
    this.querySelector('#btn-send')?.addEventListener('click', () => {
      const inp = this.querySelector<HTMLInputElement>('#input-message');
      if (inp) {
        this.newMessageText = inp.value;
        this.sendMessage();
      }
    });
    this.querySelectorAll<HTMLButtonElement>('.chat-item').forEach((btn) =>
      btn.addEventListener('click', () => this.selectChat(btn.dataset.uid!))
    );

    this.querySelector('#btn-new-chat')?.addEventListener('click', () => {
      this.createNewChat();
    });
  }

  createNewChat() {
    showDialog({
      title: 'New Chat',
      content: html`
        <div class="space-y-4">
          <div>
            <label class="label" for="chat-name">Chat Name</label>
            <input id="chat-name" type="text" class="input" />
          </div>
          <div>
            <label class="label" for="user-uid">User UID</label>
            <input id="chat-uid" type="text" class="input" />
          </div>
          <div>
            <label class="label" for="chat-message">Message</label>
            <input id="chat-message" type="text" class="input" />
          </div>
        </div>
      `,
      asForm: true,
      actions: [{ label: 'create', submit: true }],
      formHandler(formData, dialog) {
        console.log(formData);
      },
    });
  }
}

customElements.define('chat-page', ChatPage);
