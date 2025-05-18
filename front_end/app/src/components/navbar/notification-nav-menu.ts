import {
  fetchUndreadNotifications,
  markNotificationAsRead,
  Notification,
  NotificationType,
} from '~/api/notifications';
import { fetchUserInfo } from '~/api/user';
import { notificationsStore as notificationsStore } from '~/app-state';
import { BellIcon } from '~/icons';
import { html } from '~/lib/html';
import { showToast } from '../toast';

class NotificationNavMenu extends HTMLElement {
  cleanupCallbacks: Function[] = [];

  setNotificationCount(count: number) {
    const notificationCount = this.querySelector<HTMLSpanElement>('#notification-count');

    if (notificationCount) {
      notificationCount.textContent = count.toString();
      notificationCount.style.display = count > 0 ? 'flex' : 'none';
    }
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

  async render() {
    const notifications = notificationsStore.get();

    this.replaceChildren(html`
      <div class="relative">
        <button id="notification-btn" class="btn-outlined btn-icon">
          ${BellIcon}
          <span
            id="notification-count"
            class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium"
          >
            0
          </span>
        </button>
        <div
          id="notification-menu"
          class="hidden fixed sm:absolute right-0 mt-2 w-[280px] sm:w-[320px] max-w-[90vw] rounded-md border border-border bg-popover text-popover-foreground shadow-md z-40"
        >
          <div class="flex justify-between items-center px-4 py-2 border-b border-muted">
            <h4 class="text-sm font-semibold">Notifications</h4>
            <button
              class="cursor-pointer text-sm text-muted-foreground hover:underline focus:outline-none"
            >
              Mark all as read
            </button>
          </div>
          <div class="divide-y divide-border max-h-64 overflow-auto ">
            ${notifications?.length
              ? await Promise.all(
                  notifications.map(async (data) => {
                    return html`
                      <button
                        data-uid="${data.notification_uid}"
                        class="w-full text-start cursor-pointer flex flex-col gap-1 px-4 py-3 hover:bg-accent/10 focus:bg-accent/10 outline-none"
                      >
                        <h4>${this.getNotificationTitle(data.type)}</h4>
                        <p class="text-sm text-muted-foreground">
                          ${await this.getNotificationMessage(data)}
                        </p>
                      </button>
                    `;
                  })
                )
              : html`
                  <div class="flex items-center justify-center p-4">
                    <p class="text-sm text-muted-foreground">No notifications</p>
                  </div>
                `}
          </div>
        </div>
      </div>
    `);

    this.setup();
    this.setNotificationCount(notificationsStore.get()?.length || 0);
  }

  toggle = () => {
    const notificationMenu = this.querySelector<HTMLDivElement>('#notification-menu');

    if (!notificationMenu) return;

    if (notificationMenu.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  };

  open = () => {
    const notificationMenu = this.querySelector<HTMLDivElement>('#notification-menu');

    if (!notificationMenu) return;

    notificationMenu.classList.remove('hidden');

    notificationMenu.animate(
      [
        { opacity: 0, transform: 'translateY(-10px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 200,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );
  };

  close = () => {
    const notificationMenu = this.querySelector<HTMLDivElement>('#notification-menu');

    if (!notificationMenu) return;

    const animation = notificationMenu.animate(
      [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-10px)' },
      ],
      {
        duration: 200,
        easing: 'ease-in-out',
        fill: 'forwards',
      }
    );

    animation.onfinish = () => notificationMenu.classList.add('hidden');
  };

  clickOutsideHandler = (event: MouseEvent) => {
    const notificationBtn = this.querySelector<HTMLButtonElement>('#notification-btn');

    const notificationMenu = this.querySelector<HTMLDivElement>('#notification-menu');

    const target = event.target as HTMLElement;
    if (
      !notificationMenu?.classList.contains('hidden') &&
      !notificationMenu?.contains(target) &&
      !notificationBtn?.contains(target)
    ) {
      this.close();
    }
  };

  private setup() {
    this.cleanup();
    const notificationBtn = this.querySelector<HTMLButtonElement>('#notification-btn');

    const notificationMenu = this.querySelector<HTMLDivElement>('#notification-menu');

    notificationBtn?.addEventListener('click', this.toggle);
    document.addEventListener('click', this.clickOutsideHandler);

    notificationMenu?.addEventListener('click', async (e) => {
      const target = e.target;

      if (target instanceof HTMLButtonElement && target.dataset.uid) {
        const result = await markNotificationAsRead(target.dataset.uid);
        if (result.success) {
          const newNotifications = await fetchUndreadNotifications();
          if (newNotifications.success) {
            notificationsStore.set(newNotifications.data);
          } else {
            showToast({
              type: 'error',
              message: newNotifications.message,
            });
          }
        } else {
          showToast({
            type: 'error',
            message: result.message,
          });
        }
      }
    });
  }

  connectedCallback() {
    this.render();
    this.cleanupCallbacks.push(notificationsStore.subscribe(() => this.render()));
  }

  private cleanup() {
    document.removeEventListener('click', this.clickOutsideHandler);
    this.cleanupCallbacks.forEach((callback) => callback());
    this.cleanupCallbacks = [];
  }

  disconnectedCallback() {
    this.cleanup();
  }
}

customElements.define('notification-nav-menu', NotificationNavMenu);
