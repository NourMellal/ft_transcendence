import '~/components/signin/google-signin-btn';

import { navigateTo } from '~/components/app-router';
import { showToast } from '~/components/toast';
import { setupUser } from '~/api/user';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import { userStore } from '~/app-state';
import { LockIcon } from '~/icons';

export default class SignupPage extends HTMLElement {
  intended =
    new URLSearchParams(window.location.search).get('intended') ?? '/profile';

  handleSumbit = async (e: SubmitEvent) => {
    const form = (e.target as HTMLElement).closest('form');

    if (form) {
      e.preventDefault();
      const formData = new FormData(form);

      // Remove picture field if no image was selected
      const avatarInput =
        this.querySelector<HTMLInputElement>('#avatar-input')!;
      if (!avatarInput.files?.length) {
        formData.delete('picture');
      }

      if (
        formData.get('password')?.toString() !==
        formData.get('password_confirmation')?.toString()
      ) {
        showToast({
          type: 'error',
          message: "password/password confirmation doesn't match",
        });
        return;
      }
      formData.delete('password_confirmation');

      const res = await fetch('/api/user/signup', {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      });
      if (!res.ok) {
        showToast({
          type: 'error',
          message: await res.text(),
        });
        return;
      }
      await setupUser();
      showToast({
        type: 'success',
        message: `Welcome to ft_transcendence!`,
      });
      navigateTo(this.intended);
    }
  };

  getAuthState = async () => {
    const res = await fetch('/api/OAuth/state', {
      cache: 'no-store',
      method: 'GET',
    });
    if (!res.ok) throw Error('Unexpected error occured!');

    return res.text();
  };

  async render() {
    if (userStore.get()) {
      return navigateTo('/profile');
    }
    this.replaceChildren(html`
      <fieldset class="max-w-md mx-auto my-4 flex flex-col gap-4 mt-16">
        <div class="p-6 md:rounded-md border">
          <form class="space-y-6 [&_label]:block [&_label]:mb-4">
            <!-- Profile Picture -->
            <div class="space-y-2">
              <label class="label">Profile Picture</label>
              <div class="flex items-center gap-4">
                <img
                  id="avatar-preview"
                  src="/api/static/profile/default.jpg"
                  class="h-16 w-16 rounded-full object-cover border"
                />
                <input
                  type="file"
                  id="avatar-input"
                  class="hidden"
                  name="picture"
                  accept="image/jpeg, image/png, image/webp"
                />
                <button
                  type="button"
                  id="change-avatar-btn"
                  class="btn btn-outlined"
                >
                  Select
                </button>
                <button
                  type="button"
                  id="remove-avatar-btn"
                  class="btn btn-destructive"
                >
                  Remove
                </button>
              </div>
              <p id="avatar-error" class="text-xs text-destructive"></p>
            </div>

            <div>
              <label for="user-name">username</label>
              <input
                class="input"
                type="text"
                id="user-name"
                name="username"
                placeholder="msitni"
                autocomplete="off"
                required
              />
            </div>
            <div>
              <label for="user-password">password</label>
              <input
                class="input"
                type="password"
                id="user-password"
                name="password"
                placeholder="••••••••••••••••"
                required
              />
            </div>
            <div>
              <label for="user-password-confirmation"
                >password confirmation</label
              >
              <input
                name="password_confirmation"
                class="input"
                type="password"
                id="user-password-confirmation"
                placeholder="••••••••••••••••"
                required
              />
            </div>
            <button class="btn btn-primary w-full" type="submit">
              ${LockIcon}
              <span>Signup</span>
            </button>
          </form>
          <div class="shrink-0 bg-border h-[1px] w-full my-4"></div>
          <google-signin-btn></google-signin-btn>
        </div>
      </fieldset>
    `);
    this.setup();
  }

  setup() {
    const signinForm = this.querySelector('form');
    const userInput = this.querySelector<HTMLInputElement>('#user-name')!;
    const changeAvatarBtn =
      this.querySelector<HTMLButtonElement>('#change-avatar-btn')!;
    const avatarInput = this.querySelector<HTMLInputElement>('#avatar-input')!;
    const avatarPreview =
      this.querySelector<HTMLImageElement>('#avatar-preview')!;
    const removeAvatarBtn =
      this.querySelector<HTMLButtonElement>('#remove-avatar-btn')!;

    // Initially hide the remove button
    removeAvatarBtn.style.display = 'none';

    signinForm?.addEventListener('submit', this.handleSumbit);
    userInput?.focus();

    changeAvatarBtn.addEventListener('click', () => {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', () => {
      if (avatarInput.files?.[0]) {
        avatarPreview.src = URL.createObjectURL(avatarInput.files[0]);
        removeAvatarBtn.style.display = 'inline-flex';
      }
    });

    removeAvatarBtn.addEventListener('click', () => {
      avatarPreview.src = '/api/static/profile/default.jpg';
      avatarInput.value = '';
      removeAvatarBtn.style.display = 'none';
    });
  }

  connectedCallback() {
    this.render();
  }
}

if (!customElements.get('signup-page')) {
  customElements.define('signup-page', SignupPage);
}
