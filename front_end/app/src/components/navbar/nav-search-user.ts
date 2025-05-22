import { SearchIcon } from '~/icons';
import { html } from '~/lib/html';
import { showDialog } from '../dialog';
import { SearchByUsername } from '~/api/user';
import { navigateTo } from '../app-router';

class NavUserSearchInput extends HTMLElement {
  dropdown: HTMLDivElement | null = null;
  input: HTMLInputElement | null = null;

  closeDialog = () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
      }),
    );
  };

  connectedCallback() {
    this.replaceChildren(html`
      <input type="text" class="input" placeholder="search..." />
      <div class="relative">
        <div
          id="search-dropdown"
          class="hidden shadow text-sm absolute top-2 left-0 right-0 border border-border rounded-md divide-y divide-border bg-background max-h-48 overflow-auto flex-col"
        ></div>
      </div>
    `);

    this.dropdown = this.querySelector<HTMLDivElement>('#search-dropdown');
    this.input = this.querySelector<HTMLInputElement>('input');

    let debounceTimeout: ReturnType<typeof setInterval> | null = null;

    document.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement;

      if (target !== this.input) {
        this.dropdown?.classList.replace('flex', 'hidden');
      } else {
        this.dropdown?.classList.replace('hidden', 'flex');
      }
    });

    this.input?.addEventListener('keyup', async (ev) => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      const input = ev.target as HTMLInputElement;
      if (input.value.length < 3) {
        this.dropdown?.classList.replace('flex', 'hidden');
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        return;
      }

      debounceTimeout = setTimeout(async () => {
        const res = await SearchByUsername(input.value);
        if (res.success) {
          this.dropdown?.classList.replace('hidden', 'flex');
          this.dropdown?.replaceChildren(html`
            ${res.data.length > 0
              ? res.data.map(
                  (user) => html`
                    <button
                      data-url="/profile?username=${user.username}"
                      class="p-4 hover:bg-muted text-start cursor-pointer"
                    >
                      ${user.username}
                    </button>
                  `,
                )
              : html`
                  <p class="text-sm text-muted-foreground p-4 text-center">
                    No user found.
                  </p>
                `}
          `);

          document
            .querySelectorAll<HTMLButtonElement>('button[data-url]')
            .forEach((el) =>
              el.addEventListener('click', (ev) => {
                const target = ev.target as HTMLButtonElement;
                if (target.dataset.url) navigateTo(target.dataset.url);
                this.closeDialog();
              }),
            );
        }
      }, 500);
    });
  }
}

if (!customElements.get('nav-user-search-input')) {
  customElements.define('nav-user-search-input', NavUserSearchInput);
}

class NavSearchUser extends HTMLElement {
  connectedCallback() {
    this.replaceChildren(html`
      <button id="search-btn" class="btn-outlined btn-icon">
        ${SearchIcon}
      </button>
    `);

    this.querySelector<HTMLButtonElement>('#search-btn')?.addEventListener(
      'click',
      () => {
        showDialog({
          title: 'search user',
          content: html`<nav-user-search-input></nav-user-search-input>`,
        });
      },
    );
  }
}

if (!customElements.get('nav-search-user')) {
  customElements.define('nav-search-user', NavSearchUser);
}
