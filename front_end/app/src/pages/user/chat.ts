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
  checkIfBlockedByUser,
} from '~/api/chat';
import { PlusIcon } from '~/icons';
import { showDialog } from '~/components/dialog';
import { showToast } from '~/components/toast';
import { fetchFriends } from '~/api/friends';
import { blockedUsersStore, pushNotificationStore, userStore } from '~/app-state';
import { NotificationType, NotificationData } from '~/api/notifications';
import { navigateTo } from '~/components/app-router';

export default class ChatPage extends HTMLElement {
  private isSidebarOpen = false;
  private chats: Chat[] = [];
  private messages: ChatMessage[] = [];
  private selectedChat: Chat | null = null;
  private newMessageText = '';
  private chatUID = new URLSearchParams(window.location.search).get('chat');

  private sidebarElement: HTMLElement | null = null;
  private headerElement: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;
  private inputFieldset: HTMLFieldSetElement | null = null;

  handleNewMessage = async (ev: MessageEvent) => {
    const data = JSON.parse(ev.data) as NotificationData;

    if (data.type === NotificationType.ConversationNameChanged) {
      const chat = this.chats.find((c) => c.UID === data.conversation_uid);
      if (chat) {
        chat.name = data.conversation_name;
        this.updateSidebar();
        this.updateHeader();
      }
    }
    if (data.type === NotificationType.NewMessage) {
      if (this.selectedChat && this.selectedChat.UID === data.conversation_uid) {
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

      if (!this.chats.find((c) => c.UID === data.conversation_uid)) {
        this.loadChats();
      }
    }
  };

  async connectedCallback() {
    if (!userStore.get()) {
      navigateTo('/signin');
      return;
    }

    await this.renderLayout();

    await this.loadChats();

    if (this.chatUID) {
      this.selectChat(this.chatUID);
    }

    pushNotificationStore.get()?.addEventListener('message', this.handleNewMessage);
  }

  async loadChats() {
    const res = await fetchUserChats();
    if (res.success) {
      this.chats = res.data.reverse();
      this.updateSidebar();
    }
  }

  async selectChat(uid: string) {
    if (this.selectedChat) {
      document
        .querySelector(`button[data-uid="${this.selectedChat.UID}"]`)
        ?.classList.remove('bg-secondary', 'text-secondary-foreground');
    }

    const chat = this.chats.find((c) => c.UID === uid) || null;
    this.selectedChat = chat;
    this.messages = [];

    if (chat) {
      window.history.pushState(null, '', `?chat=${uid}`);
      const res = await fetchChatMessages(chat.UID, 0);
      if (res.success) {
        this.messages = res.data.reverse();
        this.updateHeader();
        this.updateMessages();
        await this.updateInputField();
        this.scrollToBottom();
        this.querySelector(`button[data-uid="${uid}"]`)?.classList.add(
          'bg-secondary',
          'text-secondary-foreground'
        );
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
      const inp = this.querySelector<HTMLInputElement>('#input-message');
      if (inp) inp.value = '';
      this.scrollToBottom();
    }
  }

  toggleSidebar = () => {
    this.isSidebarOpen = !this.isSidebarOpen;
    if (this.sidebarElement) {
      if (this.isSidebarOpen) {
        this.sidebarElement.classList.remove('-translate-x-full');
        this.sidebarElement.classList.add('translate-x-0');
      } else {
        this.sidebarElement.classList.remove('translate-x-0');
        this.sidebarElement.classList.add('-translate-x-full');
      }
    }
  };

  scrollToBottom() {
    if (this.messagesContainer) {
      setTimeout(() => {
        if (this.messagesContainer) {
          this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
      }, 50);
    }
  }

  getChatUserUID() {}

  async renderLayout() {
    this.replaceChildren(html`
      <div class="container mx-auto mt-8">
        <div class="flex h-[calc(100vh-8rem)] border rounded-lg overflow-hidden">
          <aside
            id="sidebar"
            class="fixed md:relative w-3/4 md:w-1/4 h-full border-r bg-card p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${this
              .isSidebarOpen
              ? 'translate-x-0'
              : '-translate-x-full md:translate-x-0'}"
            style="z-index:20"
          ></aside>

          <main id="main-chat" class="relative w-full md:w-3/4 flex flex-col bg-background">
            <header id="chat-header" class="flex items-center gap-4 border-b p-4 bg-card"></header>
            <div
              id="messages-container"
              class="flex-1 overflow-y-auto p-4 space-y-4 messages"
            ></div>
            <fieldset id="chat-input" class="border-t p-4 bg-card"></fieldset>
          </main>
        </div>
      </div>
    `);

    this.sidebarElement = this.querySelector('#sidebar');
    this.headerElement = this.querySelector('#chat-header');
    this.messagesContainer = this.querySelector('#messages-container');
    this.inputFieldset = this.querySelector('#chat-input');

    this.updateSidebar();
    this.updateHeader();
    this.updateMessages();
    await this.updateInputField();
  }

  updateSidebar() {
    if (!this.sidebarElement) return;

    this.sidebarElement.innerHTML = '';
    this.sidebarElement.appendChild(html`
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
    `);

    this.querySelector('#btn-new-chat')?.addEventListener('click', () => {
      this.createNewChat();
    });

    this.querySelector('#btn-close-sidebar')?.addEventListener('click', this.toggleSidebar);

    this.querySelectorAll<HTMLButtonElement>('.chat-item').forEach((btn) =>
      btn.addEventListener('click', () => this.selectChat(btn.dataset.uid!))
    );
  }

  updateHeader() {
    if (!this.headerElement) return;

    const currentUID = userStore.get()?.UID;
    this.headerElement.innerHTML = '';

    this.headerElement.appendChild(html`
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
    `);

    if (this.selectedChat) {
      this.headerElement.appendChild(
        html`<button class="btn-outlined ms-auto" id="rename-chat-btn">Rename Chat</button>`
      );

      const otherUserUID =
        this.selectedChat.uid_1 === currentUID ? this.selectedChat.uid_2 : this.selectedChat.uid_1;
      const isBlocked = blockedUsersStore
        .get()
        ?.some((blockedUser) => blockedUser.blocked_uid === otherUserUID);

      if (isBlocked) {
        this.headerElement.appendChild(html`
          <button class="btn-primary" id="unblock-user-btn" data-uid="${otherUserUID}">
            Unblock User
          </button>
        `);
      } else {
        this.headerElement.appendChild(html`
          <button class="btn-destructive" id="block-user-btn" data-uid="${otherUserUID}">
            Block User
          </button>
        `);
      }
    }

    this.querySelector('#btn-toggle-sidebar')?.addEventListener('click', this.toggleSidebar);
    this.setupHeaderActionEvents();
  }

  updateMessages() {
    if (!this.messagesContainer) return;

    this.messagesContainer.innerHTML = '';
    const currentUID = userStore.get()?.UID;

    if (this.selectedChat && this.messages.length > 0) {
      this.messages.forEach((msg) => {
        this.messagesContainer?.appendChild(this.createMessageElement(msg, currentUID));
      });
    } else if (this.selectedChat) {
      this.messagesContainer.appendChild(
        html`<p class="text-center text-muted-foreground">No messages yet</p>`
      );
    } else {
      this.messagesContainer.appendChild(html`
        <div class="flex-1 flex items-center justify-center">
          <p class="text-muted-foreground">Select a conversation to start chatting</p>
        </div>
      `);
    }
  }

  async updateInputField() {
    if (!this.inputFieldset) return;

    this.inputFieldset.innerHTML = '';

    if (!this.selectedChat) {
      return;
    }

    const currentUID = userStore.get()?.UID;
    const otherUserUID =
      this.selectedChat.uid_1 === currentUID ? this.selectedChat.uid_2 : this.selectedChat.uid_1;

    const blockedByUser = await checkIfBlockedByUser(otherUserUID);
    console.log(blockedByUser);

    if (blockedByUser.success && blockedByUser.data) {
      this.inputFieldset.replaceChildren(html`
        <p class="text-muted-foreground text-center">
          You cannot send messages to this user because they have blocked you.
        </p>
      `);
      return;
    }

    const isBlocked = blockedUsersStore
      .get()
      ?.some((blockedUser) => blockedUser.blocked_uid === otherUserUID);

    this.inputFieldset.disabled = isBlocked;
    this.inputFieldset.appendChild(html`
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
    `);

    this.querySelector<HTMLFormElement>('#send-message-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = this.querySelector<HTMLInputElement>('#input-message');
      if (inp) {
        this.newMessageText = inp.value;
        this.sendMessage();
      }
    });
  }

  createMessageElement(msg: ChatMessage, currentUID: string | undefined) {
    return html`
      <div class="flex ${msg.user_uid === currentUID ? 'justify-end' : 'justify-start'}">
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
      </div>
    `;
  }

  appendMessage(msg: ChatMessage) {
    if (this.messagesContainer) {
      const currentUID = userStore.get()?.UID;
      const msgElement = this.createMessageElement(msg, currentUID);
      this.messagesContainer.appendChild(msgElement);
    }
  }

  setupHeaderActionEvents() {
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
        this.updateHeader();
        await this.updateInputField();
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
        this.updateHeader();
        await this.updateInputField();
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
            <input
              value="${this.selectedChat?.name || ''}"
              id="chat-name"
              type="text"
              class="input"
              name="name"
              autofocus
              onFocus="if (this.dataset.focused === 1) return;this.dataset.focused = 1;this.select();"
            />
          </div>
        `,
        asForm: true,
        actions: [{ label: 'Rename', submit: true }],
        formHandler: async (formData, dialog) => {
          try {
            const res = await renameChat(uid, formData);
            if (res.success) {
              showToast({
                type: 'success',
                message: 'Chat renamed successfully',
              });
              await this.loadChats();
              this.selectedChat!.name = formData.get('name') as string;
              this.updateHeader();
              dialog.close();
            } else {
              showToast({
                type: 'error',
                message: `Failed to rename chat for the following reason: ${res.message}`,
              });
            }
          } catch {
            showToast({
              type: 'error',
              message: 'Failed to rename chat',
            });
          }
        },
      });
    });
  }

  async createNewChat() {
    const friends = await fetchFriends();

    if (!friends.success || !friends.data.length) {
      showToast({
        type: 'warning',
        message: 'You have no friends to chat with',
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

if (!customElements.get('chat-page')) {
  customElements.define('chat-page', ChatPage);
}
