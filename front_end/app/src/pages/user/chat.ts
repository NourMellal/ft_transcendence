import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import {
  fetchUserChats,
  fetchChatMessages,
  sendChatMessage,
  createNewChat,
  Chat,
  ChatMessage,
  blockUser,
  unblockUser,
  renameChat,
} from '~/api/chat';
import { PlusIcon } from '~/icons';
import { showDialog } from '~/components/dialog';
import { showToast } from '~/components/toast';
import { fetchFriends } from '~/api/friends';
import { blockedUsersStore, pushNotificationStore, userStore } from '~/app-state';
import { NotificationType, WebsocketNotificationData } from '~/api/notifications';
import { navigateTo } from '~/components/app-router';

export default class ChatPage extends HTMLElement {
  private isSidebarOpen = false;
  private chats: Chat[] = [];
  private messages: ChatMessage[] = [];
  private selectedChat: Chat | null = null;
  private newMessageText = '';
  private chatUID = new URLSearchParams(window.location.search).get('chat');

  handleNewMessage = async (ev: MessageEvent) => {
    const data = JSON.parse(ev.data) as WebsocketNotificationData;

    if (data.type === NotificationType.NewMessage && data.conversation_uid === this.chatUID) {
      if (this.selectedChat) {
        const res = await fetchChatMessages(this.selectedChat.UID);
        if (res.success) {
          const newMessage = res.data.at(0);
          if (newMessage) {
            this.messages = [...this.messages, newMessage];
            this.appendMessage(newMessage);
          }
        }
        this.scrollToBottom();
      }
    }
  };

  async connectedCallback() {
    if (!userStore.get()) {
      navigateTo('/signin');
      return;
    }
    await this.loadChats();
    if (this.chatUID) {
      await this.selectChat(this.chatUID);
    } else {
      this.render();
    }

    pushNotificationStore.get()?.addEventListener('message', this.handleNewMessage);
  }

  async loadChats() {
    const res = await fetchUserChats();
    if (res.success) {
      this.chats = res.data.reverse();
      this.render();
    }
  }

  async selectChat(uid: string) {
    const chat = this.chats.find((c) => c.UID === uid) || null;
    this.selectedChat = chat;
    this.messages = [];

    if (chat) {
      window.history.pushState(null, '', `?chat=${uid}`);
      const res = await fetchChatMessages(chat.UID, 0);
      if (res.success) {
        this.messages = res.data.reverse();
        this.render();
        this.scrollToBottom();
      }
    }
  }

  async sendMessage() {
    if (!this.selectedChat || !this.newMessageText.trim()) return;
    const messageText = this.newMessageText.trim();
    const fd = new FormData();
    fd.append('message', messageText);
    const res = await sendChatMessage(this.selectedChat.UID, fd);
    if (res.success) {
      const currentUID = userStore.get()?.UID;
      const now = Math.floor(Date.now() / 1000);
      const msg: ChatMessage = { user_uid: currentUID!, time: now, message_text: messageText };
      this.messages = [...this.messages, msg];
      this.appendMessage(msg);
      this.newMessageText = '';
      const inp = this.querySelector<HTMLTextAreaElement>('#input-message');
      if (inp) inp.value = '';
      this.scrollToBottom();
    }
  }

  toggleSidebar = () => {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.render();
  };

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
    const container = this.querySelector<HTMLDivElement>('.messages');

    if (container) {
      setTimeout(() => (container.scrollTop = container.scrollHeight), 50);
    }
  }

  getChatUserUID() {}

  render() {
    const currentUID = userStore.get()?.UID;
    console.log(blockedUsersStore.get());

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
                    class="chat-item w-full text-left py-2 px-4 cursor-pointer rounded-md hover:bg-accent hover:text-accent-foreground transition-colors ${this
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
              ${this.selectedChat
                ? html`
                    <button class="btn-outlined ms-auto" id="rename-chat-btn">Rename Chat</button>
                  `
                : ''}
              ${this.selectedChat
                ? blockedUsersStore
                    .get()
                    ?.some(
                      (blockedUser) =>
                        blockedUser.blocked_uid ===
                        (this.selectedChat?.uid_1 === userStore.get()!.UID
                          ? this.selectedChat.uid_2
                          : this.selectedChat?.uid_1)
                    )
                  ? html`<button
                      class="btn-primary"
                      id="unblock-user-btn"
                      data-uid="${this.selectedChat?.uid_1 === userStore.get()!.UID
                        ? this.selectedChat.uid_2
                        : this.selectedChat?.uid_1}"
                    >
                      Unblock User
                    </button>`
                  : html`<button
                      class="btn-destructive"
                      id="block-user-btn"
                      data-uid="${this.selectedChat?.uid_1 === userStore.get()!.UID
                        ? this.selectedChat.uid_2
                        : this.selectedChat?.uid_1}"
                    >
                      Block User
                    </button>`
                : ''}
            </header>
            ${this.selectedChat
              ? html`
                  <div class="flex-1 overflow-y-auto p-4 space-y-4 messages">
                    ${this.messages.map(
                      (msg) => html`
                        <div
                          class="flex ${msg.user_uid === currentUID
                            ? 'justify-end'
                            : 'justify-start'}"
                        >
                          <div class="max-w-xs lg:max-w-md">
                            <div
                              class="text-xs text-muted-foreground mb-1 ${msg.user_uid ===
                              currentUID
                                ? 'text-right'
                                : 'text-left'}"
                            >
                              ${msg.user_uid === currentUID ? 'You' : msg.username} ·
                              ${new Date(msg.time * 1000).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                            <div
                              class="p-3 rounded-lg ${msg.user_uid === currentUID
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
                  <fieldset
                    class="border-t p-4 bg-card"
                    ${blockedUsersStore
                      .get()
                      ?.some(
                        (blockedUser) =>
                          blockedUser.blocked_uid ===
                          (this.selectedChat?.uid_1 === userStore.get()!.UID
                            ? this.selectedChat.uid_2
                            : this.selectedChat?.uid_1)
                      )
                      ? 'disabled'
                      : ''}
                  >
                    <form id="send-message-form" class="flex items-center gap-2">
                      <input
                        id="input-message"
                        type="text"
                        value="${this.newMessageText}"
                        placeholder="Type your message..."
                        class="input flex-1"
                        autocomplete="off"
                      />
                      <button id="btn-send" class="btn btn-primary">Send</button>
                    </form>
                  </fieldset>
                `
              : html`
                  <div class="flex-1 flex items-center justify-center">
                    <p class="text-muted-foreground">Select a conversation to start chatting</p>
                  </div>
                `}
          </main>
        </div>
      </div>
    `);
    this.scrollToBottom();

    this.setup();
  }

  setup() {
    this.querySelector('#btn-toggle-sidebar')?.addEventListener('click', this.toggleSidebar);
    this.querySelector('#btn-close-sidebar')?.addEventListener('click', this.toggleSidebar);

    this.querySelector<HTMLFormElement>('#send-message-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
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

    this.querySelector('#block-user-btn')?.addEventListener('click', async (ev) => {
      const uid = (ev.target as HTMLButtonElement).dataset.uid;
      if (!uid) return;
      const res = await blockUser(uid);
      if (res.success) {
        showToast({
          type: 'success',
          message: 'User blocked successfully',
        });
        await this.loadChats();
        this.render();
      } else {
        showToast({
          type: 'error',
          message: `Failed to block user: ${res.message}`,
        });
      }
    });

    this.querySelector('#unblock-user-btn')?.addEventListener('click', async (ev) => {
      const uid = (ev.target as HTMLButtonElement).dataset.uid;
      if (!uid) return;
      const res = await unblockUser(uid);
      if (res.success) {
        showToast({
          type: 'success',
          message: 'User unblocked successfully',
        });
        await this.loadChats();
        this.render();
      } else {
        showToast({
          type: 'error',
          message: `Failed to unblock user: ${res.message}`,
        });
      }
    });

    this.querySelector('#rename-chat-btn')?.addEventListener('click', () => {
      const uid = this.selectedChat?.UID;
      if (!uid) return;
      showDialog({
        title: 'Rename Chat',
        content: html`
          <div>
            <label class="label" for="chat-name">Chat Name</label>
            <input id="chat-name" type="text" class="input" name="name" />
          </div>
        `,
        asForm: true,
        actions: [{ label: 'Rename', submit: true }],
        formHandler: async (formData, dialog) => {
          const res = await renameChat(uid, formData);
          if (res.success) {
            showToast({
              type: 'success',
              message: 'Chat renamed successfully',
            });
            await this.loadChats();
            dialog.close();
          } else {
            showToast({
              type: 'error',
              message: `Failed to rename chat for the following reason: ${res.message}`,
            });
          }
        },
      });
    });
  }

  appendMessage(msg: ChatMessage) {
    const container = this.querySelector('.messages');
    if (container) {
      const currentUID = userStore.get()?.UID;
      const msgEl = html` <div
        class="flex ${msg.user_uid === currentUID ? 'justify-end' : 'justify-start'}"
      >
        <div class="max-w-xs lg:max-w-md">
          <div
            class="text-xs text-muted-foreground mb-1 ${msg.user_uid === currentUID
              ? 'text-right'
              : 'text-left'}"
          >
            ${msg.user_uid === currentUID ? 'You' : msg.username} ·
            ${new Date(msg.time * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div
            class="p-3 rounded-lg ${msg.user_uid === currentUID
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'}"
          >
            <p class="text-sm">${msg.message_text}</p>
          </div>
        </div>
      </div>`;
      container.appendChild(msgEl);
    }
  }

  async createNewChat() {
    const friends = await fetchFriends();

    if (!friends) {
      showToast({
        type: 'error',
        message: 'Failed to fetch friends',
      });
      return;
    }

    showDialog({
      title: 'New Chat',
      content: html`
        <div class="space-y-4">
          <div>
            <label class="label" for="chat-name">Chat Name</label>
            <input id="chat-name" type="text" class="input" name="name" />
          </div>
          <div>
            <label class="label" for="user-uid">Friend</label>
            <select class="select" name="to_uid" id="user-uid">
              ${friends.success
                ? friends.data.map(
                    (friend) => html` <option value="${friend.UID}">${friend.username}</option> `
                  )
                : html` <option value="" disabled selected>No friends available</option> `}
            </select>
          </div>
          <div>
            <label class="label" for="chat-message">Message</label>
            <input id="chat-message" autocomplete="off" type="text" name="message" class="input" />
          </div>
        </div>
      `,
      asForm: true,
      actions: [{ label: 'create', submit: true }],
      formHandler: async (formData, dialog) => {
        const res = await createNewChat(formData);
        if (res.success) {
          showToast({
            type: 'success',
            message: 'Chat created successfully',
          });
          await this.loadChats();
          dialog.close();
          await this.selectChat(res.data);
        } else {
          showToast({
            type: 'error',
            message: `Failed to create chat for the following reason: ${res.message}`,
          });
        }
      },
    });
  }

  disconnectedCallback() {
    pushNotificationStore.get()?.removeEventListener('message', this.handleNewMessage);
  }
}

customElements.define('chat-page', ChatPage);
