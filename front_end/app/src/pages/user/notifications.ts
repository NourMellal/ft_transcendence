import { html } from '~/lib/html';

import '~/components/navbar/navigation-bar';
import { XIcon } from '~/icons';

// Assume fetchAllNotifications is imported from your API utilities
import {
  deleteNotification,
  fetchAllNotifications,
  Notification,
  NotificationType,
} from '~/api/notifications';
import { fetchUserInfo } from '~/api/user';
import { showToast } from '~/components/toast';
import { showDialog } from '~/components/dialog';

type Tab = 'all' | 'unread' | 'read';

export default class NotificationsPage extends HTMLElement {
  notifications: Notification[] = [];
  activeTab: Tab = 'all';

  async render() {
    // Group notifications by read/unread
    const all = this.notifications;
    const unread = all.filter((n) => !n.is_read);
    const read = all.filter((n) => n.is_read);

    let list: Notification[] = [];
    if (this.activeTab === 'all') list = all;
    else if (this.activeTab === 'unread') list = unread;
    else if (this.activeTab === 'read') list = read;

    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <div class="container mt-8">
        <!-- Tabs -->
        <div class="flex border-b border-border mb-6">
          <button
            class="px-4 py-2 text-sm font-medium border-b-2 ${this.activeTab === 'all'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'}"
            data-tab="all"
          >
            All
            <span
              class="ml-1 inline-flex items-center justify-center rounded-full text-xs px-2 py-0.5 ${this
                .activeTab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'}"
            >
              ${all.length}
            </span>
          </button>
          <button
            class="px-4 py-2 text-sm font-medium border-b-2 ${this.activeTab === 'unread'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'}"
            data-tab="unread"
          >
            Unread
            <span
              class="ml-1 inline-flex items-center justify-center rounded-full text-xs px-2 py-0.5 ${this
                .activeTab === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'}"
            >
              ${unread.length}
            </span>
          </button>
          <button
            class="px-4 py-2 text-sm font-medium border-b-2 ${this.activeTab === 'read'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'}"
            data-tab="read"
          >
            Read
            <span
              class="ml-1 inline-flex items-center justify-center rounded-full text-xs px-2 py-0.5 ${this
                .activeTab === 'read'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'}"
            >
              ${read.length}
            </span>
          </button>
        </div>

        <!-- Notifications List -->
        <div class="space-y-4">
          ${list.length === 0
            ? html`<div class="text-muted-foreground text-center py-8">No notifications.</div>`
            : await Promise.all(
                list.map(
                  async (n) => html`
                    <div
                      class="rounded-lg border border-border bg-card p-6 shadow-sm relative ${n.is_read
                        ? 'opacity-80'
                        : ''}"
                    >
                      <div class="absolute top-4 right-4">
                        <button
                          class="rounded-full p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
                          data-id="${n.notification_uid}"
                          data-action="delete-notification"
                          aria-label="Dismiss"
                        >
                          ${XIcon}
                        </button>
                      </div>
                      <div class="flex items-start gap-4">
                        <div class="flex-1">
                          <h3 class="font-semibold text-card-foreground">
                            ${this.getNotificationTitle(n.type)}
                          </h3>
                          <p class="text-sm text-muted-foreground mt-1">
                            ${await this.getNotificationMessage(n)}
                          </p>
                          <!-- <p class="text-xs text-muted-foreground mt-2">
                          ${''}
                        </p> -->
                        </div>
                      </div>
                    </div>
                  `
                )
              )}
        </div>
      </div>
    `);
    this.setup();
  }

  getNotificationTitle(type: NotificationType) {
    switch (type) {
      case NotificationType.NewFriendRequest:
        return 'You have a new friend request';
      case NotificationType.FriendRequestAccepted:
        return 'Your friend request has been accepted';
      case NotificationType.FriendRequestDenied:
        return 'Your friend request has been denied';
      case NotificationType.GameInvite:
        return 'You have a new game invite';
      case NotificationType.Poke:
        return 'You have been poked';
      default:
        return 'You have a new notification';
    }
  }

  async getNotificationMessage(data: Notification) {
    const fromUsername = (await fetchUserInfo(data.from_uid))?.username || 'an unknown user';
    switch (data.type) {
      case NotificationType.NewFriendRequest:
        return `${fromUsername} sent you a friend request`;
      case NotificationType.FriendRequestAccepted:
        return `${fromUsername} accepted your friend request`;
      case NotificationType.FriendRequestDenied:
        return `${fromUsername} denied your friend request`;
      case NotificationType.GameInvite:
        return `${fromUsername} invited you to play a game`;
      case NotificationType.Poke:
        return `${fromUsername} poked you`;
      default:
        return 'You have a new notification';
    }
  }

  async setup() {
    // Tab switching
    this.querySelectorAll('button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', (e: Event) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as Tab;
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          this.render();
        }
      });
    });

    // delete notification
    this.addEventListener('click', (ev) => {
      if (ev.target instanceof HTMLButtonElement) {
        const action = ev.target.getAttribute('data-action');
        const id = ev.target.getAttribute('data-id');
        if (action === 'delete-notification' && id) {
          showDialog({
            title: 'Delete Notification',
            content: html`<p>Are you sure you want to delete this notification?</p>`,
            actions: [
              {
                label: 'confirm',
                callback: async (dialog) => {
                  const res = await deleteNotification(id);
                  if (res.success) {
                    this.notifications = this.notifications.filter(
                      (n) => n.notification_uid !== id
                    );
                    this.render();
                    showToast({
                      message: 'Notification deleted successfully',
                      type: 'success',
                    });
                  } else {
                    showToast({
                      message: 'Failed to delete notification',
                      type: 'error',
                    });
                  }
                  dialog.close();
                },
              },
            ],
          });
        }
      }
    });
  }

  async connectedCallback() {
    const res = await fetchAllNotifications();
    if (res.success) {
      this.notifications = res.data;
    } else {
      this.notifications = [];
    }
    this.render();
  }

  timeAgo(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }
}

customElements.define('notifications-page', NotificationsPage);
