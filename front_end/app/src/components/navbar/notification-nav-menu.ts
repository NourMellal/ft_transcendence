import {
  fetchUndreadNotifications,
  getNotificationMessage,
  getNotificationTitle,
  markNotificationAsRead,
} from '~/api/notifications';
import { notificationsStore as notificationsStore } from '~/app-state';
import { BellIcon } from '~/icons';
import { html } from '~/lib/html';
import { showToast } from '../toast';

class NotificationNavMenu extends HTMLElement {
  cleanupCallbacks: Function[] = [];

  setNotificationCount(count: number) {
    const notificationCount = this.querySelector<HTMLSpanElement>(
      '#notification-count',
    );
    if (notificationCount) {
      notificationCount.textContent = count.toString();
      notificationCount.style.display = count > 0 ? 'flex' : 'none';
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
          <div
            class="flex justify-between items-center px-4 py-2 border-b border-muted"
          >
            <h4 class="text-sm font-semibold">Notifications</h4>
            <button
              id="mark-all-as-read-btn"
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
                        class="w-full text-start cursor-pointer flex flex-col gap-1 px-4 py-3 hover:bg-accent/10 focus:bg-accent/10 outline-none ${data.is_read
                          ? ''
                          : 'font-bold'}"
                        style="background: none; border: none;"
                      >
                        <h4>${getNotificationTitle(data.type)}</h4>
                        <p class="text-sm text-muted-foreground">
                          ${await getNotificationMessage(data)}
                        </p>
                      </button>
                    `;
                  }),
                )
              : html`
                  <div class="flex items-center justify-center p-4">
                    <p class="text-sm text-muted-foreground">
                      No notifications
                    </p>
                  </div>
                `}
          </div>
          <div class="border-t border-muted px-4 py-2 text-center">
            <a
              href="/notifications"
              class="text-primary hover:underline text-sm"
              >View all notifications</a
            >
          </div>
        </div>
      </div>
    `);
    this.setup();
    this.setNotificationCount(
      notificationsStore.get()?.filter((n) => !n.is_read).length || 0,
    );
  }

  toggle = () => {
    const notificationMenu =
      this.querySelector<HTMLDivElement>('#notification-menu');
    if (!notificationMenu) return;
    if (notificationMenu.classList.contains('hidden')) {
      this.open();
    } else {
      this.close();
    }
  };

  open = () => {
    const notificationMenu =
      this.querySelector<HTMLDivElement>('#notification-menu');
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
      },
    );
  };

  close = () => {
    const notificationMenu =
      this.querySelector<HTMLDivElement>('#notification-menu');
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
      },
    );
    animation.onfinish = () => notificationMenu.classList.add('hidden');
  };

  clickOutsideHandler = (event: MouseEvent) => {
    const notificationBtn =
      this.querySelector<HTMLButtonElement>('#notification-btn');
    const notificationMenu =
      this.querySelector<HTMLDivElement>('#notification-menu');
    const target = event.target as HTMLElement;

    const isClickableWithin =
      notificationMenu?.contains(target) &&
      (target instanceof HTMLAnchorElement ||
        target instanceof HTMLButtonElement);
    const shouldClose =
      !notificationMenu?.classList.contains('hidden') &&
      !notificationMenu?.contains(target) &&
      !notificationBtn?.contains(target);

    if (isClickableWithin || shouldClose) {
      this.close();
    }
  };

  private updateNotificationItemAsRead(uid: string) {
    const btn = this.querySelector(`button[data-uid="${uid}"]`);
    if (btn) {
      btn.classList.remove('font-bold');
    }
  }

  private updateAllNotificationItemsAsRead() {
    const btns = this.querySelectorAll('button[data-uid]');
    btns.forEach((btn) => btn.classList.remove('font-bold'));
  }

  private updateNotificationCount(count: number) {
    const notificationCount = this.querySelector<HTMLSpanElement>(
      '#notification-count',
    );
    if (notificationCount) {
      notificationCount.textContent = count.toString();
      notificationCount.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  private setup() {
    this.cleanup();
    const notificationBtn =
      this.querySelector<HTMLButtonElement>('#notification-btn');
    const notificationMenu =
      this.querySelector<HTMLDivElement>('#notification-menu');
    const markAllBtn = this.querySelector<HTMLButtonElement>(
      '#mark-all-as-read-btn',
    );

    notificationBtn?.addEventListener('click', this.toggle);
    document.addEventListener('click', this.clickOutsideHandler);

    // Mark all as read
    markAllBtn?.addEventListener('click', async () => {
      const notifications = notificationsStore.get();
      if (!notifications || notifications.length === 0) return;
      const unreadUids = notifications
        .filter((n) => !n.is_read)
        .map((n) => n.notification_uid);
      if (unreadUids.length === 0) return;
      const result = await markNotificationAsRead(unreadUids.join(';'));
      if (result.success) {
        // Update store and UI without full re-render
        const newNotifications = await fetchUndreadNotifications();
        if (newNotifications.success) {
          notificationsStore.set(newNotifications.data);
          this.updateAllNotificationItemsAsRead();
          this.updateNotificationCount(0);
        } else {
          showToast({ type: 'error', message: newNotifications.message });
        }
      } else {
        showToast({ type: 'error', message: result.message });
      }
    });

    // Mark individual notification as read
    notificationMenu?.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest(
        'button[data-uid]',
      ) as HTMLButtonElement | null;
      if (btn && btn.dataset.uid) {
        const uid = btn.dataset.uid;
        const result = await markNotificationAsRead(uid);
        if (result.success) {
          // Update store and UI without full re-render
          const newNotifications = await fetchUndreadNotifications();
          if (newNotifications.success) {
            notificationsStore.set(newNotifications.data);
            this.updateNotificationItemAsRead(uid);
            const unreadCount = newNotifications.data.filter(
              (n: any) => !n.read,
            ).length;
            this.updateNotificationCount(unreadCount);
          } else {
            showToast({ type: 'error', message: newNotifications.message });
          }
        } else {
          showToast({ type: 'error', message: result.message });
        }
      }
    });
  }

  connectedCallback() {
    this.render();
    this.cleanupCallbacks.push(
      notificationsStore.subscribe(() => this.render()),
    );
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

if (!customElements.get('notification-nav-menu')) {
  customElements.define('notification-nav-menu', NotificationNavMenu);
}
