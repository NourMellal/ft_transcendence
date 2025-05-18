import { showToast } from '~/components/toast';
import { html } from '~/lib/html';
import { UsersIcon } from '~/icons';
import { friendRequestsStore } from '~/app-state';
import { acceptFriendRequest, denyFriendRequest, fetchFriendRequests } from '~/api/friends';

class FriendsNavMenu extends HTMLElement {
  cleanupCallbacks = new Array<Function>();
  friendsBtn: HTMLButtonElement | null = null;
  friendsMenu: HTMLDivElement | null = null;

  private setFriendsCount(count: number) {
    const countEl = this.querySelector<HTMLSpanElement>('#friends-count');
    if (countEl) {
      countEl.textContent = count.toString();

      countEl.classList.toggle('hidden', count === 0);
    }
  }

  async accept(reqId: string) {
    const result = await acceptFriendRequest(reqId);
    if (result.success) {
      showToast({
        type: 'info',
        message: 'Friend request accepted.',
      });
    } else {
      showToast({
        type: 'error',
        message: result.message,
      });
    }
  }

  async deny(reqId: string) {
    const result = await denyFriendRequest(reqId);
    if (result.success) {
      showToast({
        type: 'info',
        message: 'Friend request denied.',
      });
    } else {
      showToast({
        type: 'error',
        message: result.message,
      });
    }
  }

  private render() {
    const requests = friendRequestsStore.get();

    this.replaceChildren(html`
      <div class="relative">
        <button id="friends-btn" class="btn-outlined btn-icon">
          ${UsersIcon}
          <span
            id="friends-count"
            class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-medium"
          >
            0
          </span>
        </button>
        <div
          id="friends-menu"
          class="hidden fixed sm:absolute right-0 w-[280px] sm:w-[320px] max-w-[90vw] bg-background border border-muted rounded-lg shadow-lg overflow-hidden z-40"
        >
          ${html`
            <div class="px-4 py-2 border-b border-muted">
              <h4 class="text-sm font-semibold">Friend Requests</h4>
            </div>
            <ul class="divide-y divide-muted max-h-60 overflow-y-auto">
              ${!requests || requests?.length === 0
                ? html`
                    <li class="px-4 py-3 text-center text-sm text-muted-foreground">
                      No pending friend requests
                    </li>
                  `
                : requests.map(
                    (request) => html`
                      <li class="flex items-center px-4 py-3 hover:bg-muted/50">
                        <img
                          src="/api/${request.picture_url || 'static/profile/default.jpg'}"
                          alt="${request.username || 'User'}"
                          class="w-8 h-8 rounded-full object-cover"
                        />
                        <div class="ml-3 flex-1 min-w-0">
                          <p class="text-sm font-medium truncate">
                            ${request.username || 'Unknown User'}
                          </p>
                        </div>
                        <div class="flex space-x-2 ml-2">
                          <button
                            class="btn-primary btn-sm"
                            data-action="accept"
                            data-req-id="${request.REQ_ID}"
                          >
                            Accept
                          </button>
                          <button
                            class="btn-sm btn-destructive"
                            data-action="deny"
                            data-req-id="${request.REQ_ID}"
                          >
                            Decline
                          </button>
                        </div>
                      </li>
                    `
                  )}
            </ul>
          `}
        </div>
      </div>
    `);

    this.friendsBtn = this.querySelector('#friends-btn');
    this.friendsMenu = this.querySelector('#friends-menu');
    this.setup();
    this.setFriendsCount(requests?.length || 0);
    this.setupActionButtonsListeners();
  }

  private handleOutsideClick = (e: MouseEvent) => {
    if (
      this.friendsMenu &&
      !this.friendsMenu.classList.contains('hidden') &&
      !this.contains(e.target as Node)
    ) {
      this.close();
    }
  };

  private setup() {
    if (this.friendsBtn) {
      this.friendsBtn.addEventListener('click', this.toggle);
    }
    document.addEventListener('click', this.handleOutsideClick);
  }

  private setupActionButtonsListeners() {
    this.querySelectorAll('button[data-req-id]').forEach((button) => {
      button.addEventListener('click', this.handleFriendRequestAction);
    });
  }

  private handleFriendRequestAction = async (event: Event) => {
    const button = event.target as HTMLButtonElement;
    const action = button.dataset.action;
    const reqId = button.dataset.reqId;

    button.disabled = true;

    if (reqId) {
      if (action === 'accept') {
        await this.accept(reqId);
      } else if (action === 'deny') {
        await this.deny(reqId);
      }
      friendRequestsStore.set(await fetchFriendRequests());
    }
  };

  private toggle = () => {
    if (!this.friendsMenu) return;
    const hidden = this.friendsMenu.classList.contains('hidden');
    const animOpts: KeyframeAnimationOptions = {
      duration: 200,
      easing: 'ease-in-out',
      fill: 'forwards',
    };

    if (hidden) {
      this.friendsMenu.classList.remove('hidden');
      this.friendsMenu.animate(
        [
          { opacity: 0, transform: 'translateY(-10px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        animOpts
      );
    } else {
      this.close();
    }
  };

  private close = () => {
    if (!this.friendsMenu || this.friendsMenu.classList.contains('hidden')) return;

    const animation = this.friendsMenu.animate(
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
    animation.onfinish = () => {
      if (this.friendsMenu) {
        this.friendsMenu.classList.add('hidden');
      }
    };
  };

  connectedCallback() {
    this.render();
    this.cleanupCallbacks.push(friendRequestsStore.subscribe(() => this.render()));
  }

  disconnectedCallback() {
    this.cleanupCallbacks.forEach((callback) => callback());
    if (this.friendsBtn) {
      this.friendsBtn.removeEventListener('click', this.toggle);
    }
    document.removeEventListener('click', this.handleOutsideClick);
  }
}

customElements.define('friends-nav-menu', FriendsNavMenu);
