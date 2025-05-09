import { handleEffect } from '~/utils';
import { showToast } from '../toast';
import { fetchWithAuth } from '~/api/auth';
import { html } from '~/lib/html';
import { user } from '~/app-state';
import { fetchUserInfo } from '~/api/user';

class ProfileInfo extends HTMLElement {
  debounceTimeout: number | undefined; // for the username check
  cleanupCallbacks = new Array<Function>();

  render() {
    this.replaceChildren(html`
      <fieldset class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div class="md:col-span-1">
          <h2 class="text-xl font-semibold mb-1">Profile</h2>
          <p class="text-sm text-muted-foreground">
            Update your display name, bio, and profile picture.
          </p>
        </div>
        <div class="md:col-span-2">
          <form class="card border rounded-lg shadow-sm" id="user-details-form">
            <div class="card-content p-6 space-y-6">
              <!-- Profile Picture -->
              <div class="space-y-2">
                <label class="label">Profile Picture</label>
                <div class="flex items-center gap-4">
                  <img
                    id="avatar-preview"
                    src="/api/${user.get()!.picture_url}"
                    alt="Avatar"
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
                    id="change-image-btn"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    id="remove-avatar-btn"
                    class="btn btn-destructive"
                    id="remove-image-btn"
                  >
                    Remove
                  </button>
                </div>
                <p id="avatar-error" class="text-xs text-destructive"></p>
              </div>

              <!-- Username -->
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <label for="username-input" class="label">Username</label>
                  <span
                    id="username-error-message"
                    class="text-sm text-destructive"
                  ></span>
                </div>
                <input
                  name="username"
                  id="username-input"
                  type="text"
                  class="input w-full"
                  placeholder="Your username"
                  value="${user.get()!.username}"
                  autocomplete="off"
                />
                <p
                  id="username-availability"
                  class="text-xs text-muted-foreground"
                >
                  Your unique display name.
                </p>
              </div>

              <!-- Bio -->
              <div class="space-y-2">
                <label for="bio-input" class="label">Bio</label>
                <textarea
                  name="bio"
                  id="bio-input"
                  class="input w-full min-h-[80px]"
                  placeholder="Tell us a little about yourself"
                >
${user.get()!.bio}</textarea
                >
                <p class="text-xs text-muted-foreground">
                  A brief description about you.
                </p>
              </div>
            </div>
            <div class="card-footer p-6 bg-muted/50 border-t flex justify-end">
              <button id="save-profile-btn" class="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </fieldset>
    `);
    this.setup();
  }

  updateProfile = (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(
      this.querySelector('#user-details-form') as HTMLFormElement
    );

    const avatarInput = this.querySelector('#avatar-input') as HTMLInputElement;
    const avatar = avatarInput.files?.[0];

    if (!avatar) {
      formData.delete('picture');
    }

    const fieldset = document.querySelector('fieldset')!;
    fieldset.disabled = true;
    handleEffect(document.body, async () => {
      const res = await fetchWithAuth('/api/user/info', {
        method: 'POST',
        credentials: 'include',
        body: formData,
        cache: 'no-store',
      });

      if (res.ok) {
        showToast({
          type: 'success',
          message: 'Profile updated successfully',
        });
        user.set(await fetchUserInfo());
      } else {
        showToast({
          type: 'error',
          message: await res.text(),
        });
      }
    }).finally(() => {
      fieldset.disabled = false;
    });
  };

  removeAvatar = () => {
    handleEffect(this, async () => {
      const res = await fetchWithAuth('/api/user/remove_picture', {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.ok) {
        showToast({
          type: 'success',
          message: 'Picture removed successfully',
        });
        user.set(await fetchUserInfo());
      } else {
        showToast({ type: 'error', message: 'something went wrong' });
      }
    });
  };

  setup() {
    const removeAvatarBtn = this.querySelector(
      '#remove-avatar-btn'
    ) as HTMLButtonElement;
    const usernameInput = this.querySelector(
      "input[name='username']"
    ) as HTMLInputElement;
    const changeAvatarBtn = this.querySelector(
      '#change-avatar-btn'
    ) as HTMLButtonElement;
    const avatarInput = this.querySelector('#avatar-input') as HTMLInputElement;
    const avatarPreview = this.querySelector(
      '#avatar-preview'
    ) as HTMLImageElement;

    if (user.get()!.picture_url !== '/static/profile/default.jpg') {
      removeAvatarBtn.addEventListener('click', this.removeAvatar);
    } else {
      removeAvatarBtn.disabled = true;
    }

    changeAvatarBtn.addEventListener('click', () => {
      avatarInput.click();
    });

    avatarInput.addEventListener('change', () => {
      if (avatarInput.files?.[0]) {
        avatarPreview.src = URL.createObjectURL(avatarInput.files[0]);
      }
    });

    usernameInput.addEventListener('keyup', (e) => {
      clearTimeout(this.debounceTimeout);
      const target = e.target as HTMLInputElement;
      const errorSpan = document.querySelector(
        '#username-error-message'
      ) as HTMLSpanElement;
      errorSpan.innerText = '';

      const saveBtn = this.querySelector(
        '#save-profile-btn'
      ) as HTMLButtonElement;
      this.debounceTimeout = window.setTimeout(async () => {
        if (e.key === 'Enter') return;
        if (!target.value || target.value === user.get()!.username) {
          errorSpan.innerText = '';
          saveBtn.disabled = false;
          return;
        }

        try {
          const res = await fetchWithAuth(
            `/api/user/namecheck?username=${target.value}`,
            {
              method: 'GET',
              cache: 'no-store',
            }
          );
          if (!res.ok) {
            const errorMessage = await res.text();
            errorSpan.innerText = errorMessage || `Username already taken`;
            saveBtn.disabled = true;
          } else {
            errorSpan.innerText = '';
            saveBtn.disabled = false;
          }
        } catch (error) {
          console.error('Error checking username:', error);
          errorSpan.innerText = 'Error checking username';
        }
      }, 500);
    });

    const userDetailsForm = this.querySelector(
      '#user-details-form'
    ) as HTMLFormElement;
    userDetailsForm.addEventListener('submit', this.updateProfile);
  }

  connectedCallback() {
    this.render();
    this.cleanupCallbacks.push(user.subscribe(() => this.render()));
  }

  disconnectedCallback() {
    clearTimeout(this.debounceTimeout);
    this.cleanupCallbacks.forEach((cb) => cb());
    this.cleanupCallbacks = [];
  }
}

customElements.define('profile-info', ProfileInfo);
