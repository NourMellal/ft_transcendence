import { html } from '~/lib/html';

import '~/components/navbar/navigation-bar';
import { XIcon } from '~/icons';

import {
  deleteNotification,
  fetchAllNotifications,
  getNotificationMessage,
  getNotificationTitle,
  Notification,
} from '~/api/notifications';
import { showToast } from '~/components/toast';
import { showDialog } from '~/components/dialog';
import { userStore } from '~/app-state';
import { navigateTo } from '~/components/app-router';

type Tab = 'all' | 'unread' | 'read';

export default class NotificationsPage extends HTMLElement {
  notifications: Notification[] = [];
  activeTab: Tab = 'all';
  tabsElement: HTMLElement | null = null;
  notificationsListElement: HTMLElement | null = null;

  async renderStructure() {
    this.replaceChildren(html`
      <div class="container mt-8">
        <button data-action="delete-all-notifications" class="btn-destructive mb-4">
          Delete All Notifications
        </button>
        <div id="tabs-container" class="flex border-b border-border mb-6"></div>
        <div id="notifications-list" class="space-y-4"></div>
      </div>
    `);

    this.tabsElement = this.querySelector('#tabs-container');
    this.notificationsListElement = this.querySelector('#notifications-list');

    await this.renderTabs();
    await this.renderNotificationsList();
    this.setupEventListeners();
  }

  getFilteredLists() {
    const all = this.notifications;
    const unread = all.filter((n) => !n.is_read);
    const read = all.filter((n) => n.is_read);

    let list: Notification[] = [];
    if (this.activeTab === 'all') list = all;
    else if (this.activeTab === 'unread') list = unread;
    else if (this.activeTab === 'read') list = read;

    return { all, unread, read, list };
  }

  async renderTabs() {
    if (!this.tabsElement) return;

    const { all, unread, read } = this.getFilteredLists();

    this.tabsElement.innerHTML = '';
    this.tabsElement.append(html`
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
    `);

    this.tabsElement.querySelectorAll('button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', (e: Event) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as Tab;
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          this.renderTabs();
          this.renderNotificationsList();
        }
      });
    });
  }

  async renderNotificationsList() {
    if (!this.notificationsListElement) return;

    const { list } = this.getFilteredLists();

    this.notificationsListElement.innerHTML = '';

    if (list.length === 0) {
      this.notificationsListElement.append(
        html`<div class="text-muted-foreground text-center py-8">No notifications.</div>`
      );
      return;
    }

    // Create and append each notification
    for (const notification of list) {
      const notificationElement = await this.createNotificationElement(notification);
      this.notificationsListElement.append(notificationElement);
    }
  }

  async createNotificationElement(n: Notification) {
    return html`
      <div
        class="rounded-lg border border-border bg-card p-6 shadow-sm relative ${n.is_read
          ? 'opacity-80'
          : ''}"
        data-notification-id="${n.notification_uid}"
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
            <h3 class="font-semibold text-card-foreground">${getNotificationTitle(n.type)}</h3>
            <p class="text-sm text-muted-foreground mt-1">${await getNotificationMessage(n)}</p>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
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
                    const notificationElement = this.querySelector(
                      `[data-notification-id="${id}"]`
                    );
                    if (notificationElement) {
                      notificationElement.remove();
                    }

                    this.notifications = this.notifications.filter(
                      (n) => n.notification_uid !== id
                    );

                    this.renderTabs();

                    const { list } = this.getFilteredLists();
                    if (list.length === 0 && this.notificationsListElement) {
                      this.notificationsListElement.innerHTML = '';
                      this.notificationsListElement.append(
                        html`<div class="text-muted-foreground text-center py-8">
                          No notifications.
                        </div>`
                      );
                    }

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

        if (action === 'delete-all-notifications') {
          showDialog({
            title: 'Delete All Notifications',
            content: html`<p>Are you sure you want to delete all notifications?</p>`,
            actions: [
              {
                label: 'confirm',
                callback: async (dialog) => {
                  try {
                    await Promise.all(
                      this.notifications.map((n) => deleteNotification(n.notification_uid))
                    );
                    this.notifications = [];
                    this.renderTabs();
                    this.renderNotificationsList();
                    showToast({
                      message: 'All notifications deleted successfully',
                      type: 'success',
                    });
                  } catch {
                    showToast({
                      message: 'Failed to delete all notifications',
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
    if (!userStore.get()) {
      navigateTo('/signin');
      return;
    }
    const res = await fetchAllNotifications();
    if (res.success) {
      this.notifications = res.data;
    } else {
      this.notifications = [];
    }
    await this.renderStructure();
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
