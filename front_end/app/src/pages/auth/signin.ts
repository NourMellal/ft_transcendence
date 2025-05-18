import '~/components/signin/google-signin-btn';

import { navigateTo } from '~/components/app-router';
import { showToast } from '~/components/toast';
import { handleEffect } from '~/utils';
import { setupUser } from '~/api/user';
import { html } from '~/lib/html';
import '~/components/navbar/navigation-bar';
import { userStore } from '~/app-state';
import { LockIcon } from '~/icons';
import { showDialog } from '~/components/dialog';

export default class SigninPage extends HTMLElement {
  intended = new URLSearchParams(window.location.search).get('intended') ?? '/profile';

  handleSumbit = (e: SubmitEvent) => {
    const form = (e.target as HTMLElement).closest('form');
    e.preventDefault();

    if (form) {
      handleEffect(document.body, async () => {
        const formData = new FormData(form);

        const res = await fetch('/api/user/signin', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          cache: 'no-store',
        });

        if (!res.ok) {
          form.querySelector<HTMLInputElement>('[name="password"]')!.value = '';
          showToast({ type: 'error', message: await res.text() });
          return;
        }

        if (res.redirected) {
          console.log(res.url);

          showDialog({
            title: '2FA verification',
            asForm: true,
            content: html`
              <div>
                <input
                  type="hidden"
                  name="state"
                  value="${new URL(res.url).searchParams.get('state')}"
                />
                <label class="label" for="code">TOTP Code</label>
                <input
                  autocomplete="off"
                  name="code"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="6"
                  class="input w-full tracking-wider"
                  placeholder="XXXXXX"
                />
              </div>
            `,
            actions: [{ label: 'verify', className: 'btn-primary', submit: true }],
            formHandler: async (formData, dialog) => {
              console.log('submitted');

              const res = await fetch(`/api/2FA/verify?state=${formData.get('state')}`, {
                method: 'POST',
                body: formData,
              });

              if (res.ok) {
                dialog.close();
                await setupUser();
                navigateTo(this.intended);
                showToast({
                  message: 'Welcome Back!',
                });
                return;
              }

              showToast({
                message: await res.text(),
                type: 'error',
              });
            },
          });

          return;
        }

        await setupUser();

        showToast({
          type: 'success',
          message: `Welcome back!`,
        });
        navigateTo(this.intended);
      });
    }
  };

  async render() {
    if (userStore.get()) return navigateTo('/profile');

    this.replaceChildren(html`
      <navigation-bar></navigation-bar>
      <fieldset class="max-w-md mx-auto my-4 flex flex-col gap-4 mt-16">
        <div class="p-6 md:rounded-md border">
          <form class="space-y-6 [&_label]:block [&_label]:mb-4">
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
            <button class="btn btn-primary w-full" type="submit">
              ${LockIcon}
              <span>Submit</span>
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
    const userInput = this.querySelector<HTMLInputElement>('#user-name');

    signinForm?.addEventListener('submit', this.handleSumbit);
    userInput?.focus();
  }

  connectedCallback() {
    this.innerHTML = '<app-loader></app-loader>';
    this.render();
  }
}

customElements.define('signin-page', SigninPage);
