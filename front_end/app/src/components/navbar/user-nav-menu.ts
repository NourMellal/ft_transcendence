import { navigateTo } from '../app-router';
import { fetchWithAuth } from '~/api/auth';
import { html } from '~/lib/html';
import { userStore } from '~/app-state';
import { UserIcon, CogIcon, LogoutIcon } from '~/icons';

class UserNavMenu extends HTMLElement {
  render() {
    const currentUser = userStore.get();

    if (!currentUser) return;
    this.replaceChildren(html`
      <div class="relative">
        <button id="user-menu-btn" class="cursor-pointer">
          <img
            src="/api/${currentUser.picture_url}"
            class="ring ring-ring rounded-full ring-offset-1 object-cover h-10 w-10"
          />
        </button>
        <div
          id="user-menu"
          class="hidden w-48 absolute right-0 top-full bg-background border border-muted rounded-md shadow-lg mt-2 p-2 [&>a]:p-1 [&>button]:p-1"
        >
          <a
            class="flex gap-2 [&>svg]:h-4 [&>svg]:w-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="/profile"
          >
            ${UserIcon}
            <span>Profile</span>
          </a>
          <a
            class="flex gap-2 [&>svg]:h-4 [&>svg]:w-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="/settings"
          >
            ${CogIcon}
            <span>Settings</span>
          </a>
          <button
            type="button"
            id="logout-btn"
            class="w-full flex gap-2 [&>svg]:h-4 [&>svg]:w-4 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            ${LogoutIcon}
            <span>Signout</span>
          </button>
        </div>
      </div>
    `);
    this.setup();
  }

  handleLogout = async () => {
    try {
      const response = await fetchWithAuth('/api/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      userStore.set(null);

      navigateTo('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      navigateTo('/signin');
    }
  };

  closeUserMenu = (event: MouseEvent) => {
    const userMenu = this.querySelector<HTMLDivElement>('#user-menu');
    const userMenuBtn = this.querySelector<HTMLButtonElement>('#user-menu-btn');

    if (userMenu && userMenuBtn) {
      const target = event.target as HTMLElement;

      const shouldClose =
        userMenu.contains(target.closest('a')) ||
        (!userMenu.contains(target) &&
          !userMenuBtn.contains(target) &&
          userMenu.classList.contains('hidden') === false);

      if (shouldClose) {
        const animation = userMenu.animate(
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

        animation.onfinish = () => userMenu.classList.add('hidden');
      }
    }
  };

  toggleUserMenu = () => {
    const userMenu = this.querySelector<HTMLDivElement>('#user-menu');

    if (!userMenu) return;

    const isClosed = userMenu.classList.contains('hidden');
    let animation: Animation;

    if (isClosed) {
      animation = userMenu.animate(
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
      userMenu.classList.remove('hidden');
    } else {
      animation = userMenu.animate(
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
      animation.onfinish = () => userMenu.classList.add('hidden');
    }
  };

  setup() {
    // user menu
    this.querySelector('#user-menu-btn')?.addEventListener('click', this.toggleUserMenu);
    document.addEventListener('click', this.closeUserMenu);

    // logout btn
    this.querySelector('#logout-btn')?.addEventListener('click', this.handleLogout);
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.closeUserMenu);
  }
}

if (!customElements.get('user-nav-menu')) {
  customElements.define('user-nav-menu', UserNavMenu);
}
