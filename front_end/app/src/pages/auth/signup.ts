import LockIcon from "~/icons/lock.svg?raw";
import { navigateTo } from "~/components/app-router";
import { showToast } from "~/components/toast";
import { handleEffect } from "~/utils";

class SignupPage extends HTMLElement {
  constructor() {
    super();
  }

  handleSumbit = async (e: SubmitEvent) => {
    const form = (e.target as HTMLElement).closest("form");

    if (form) {
      e.preventDefault();
      const formData = new FormData(form);

      // Remove picture field if no image was selected
      const avatarInput = this.querySelector(
        "#avatar-input"
      ) as HTMLInputElement;
      if (!avatarInput.files?.length) {
        formData.delete("picture");
      }

      if (
        formData.get("password")?.toString() !==
        formData.get("password_confirmation")?.toString()
      ) {
        showToast({
          type: "error",
          message: "password/password confirmation doesn't match",
        });
        return;
      }
      formData.delete("password_confirmation");

      handleEffect(document.body, async () => {
        const res = await fetch("/api/user/signup", {
          method: "POST",
          body: formData,
          cache: "no-store",
        });
        if (!res.ok) {
          showToast({
            type: "error",
            message: await res.text(),
          });
          return;
        }
        showToast({
          type: "success",
          message: `Welcome to ft_transcendence!`,
        });
        navigateTo("/profile");
      });
    }
  };

  getAuthState = async () => {
    const res = await fetch("/api/OAuth/state", {
      cache: "no-store",
      method: "GET",
    });
    if (!res.ok) throw Error("Unexpected error occured!");

    return res.text();
  };

  async render() {
    if (window._currentUser) {
      return navigateTo("/profile");
    }
    this.innerHTML = /*html*/ `
      <navigation-bar></navigation-bar>
      <fieldset class="max-w-md mx-auto my-4 flex flex-col gap-4 mt-16">
          <div class="p-6 md:rounded-md border">
            <form class="space-y-6 [&_label]:block [&_label]:mb-4">
              <!-- Profile Picture -->
              <div class="space-y-2">
                <label class="label">Profile Picture</label>
                <div class="flex items-center gap-4">
                  <img id="avatar-preview" src="/api/static/profile/default.jpg" alt="Avatar" class="h-16 w-16 rounded-full object-cover border">
                  <input type="file" id="avatar-input" class="hidden" name='picture' accept="image/jpeg, image/png, image/webp">
                  <button type='button' id="change-avatar-btn" class="btn btn-outlined">
                    Select
                  </button>
                  <button type='button' id="remove-avatar-btn" class="btn btn-destructive">
                    Remove
                  </button>
                </div>
                <p id="avatar-error" class="text-xs text-destructive"></p>
              </div>

              <div>
                <label for="user-name">username</label>
                <input
                  class='input'
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
                  class='input'
                  type="password"
                  id="user-password"
                  name="password"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
              <div>
                <label for="user-password-confirmation">password confirmation</label>
                <input
                  name="password_confirmation"
                  class='input'
                  type="password"
                  id="user-password-confirmation"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
              <button class='btn btn-primary w-full' type="submit">
                ${LockIcon}
                <span>Signup</span>
              </button>
            </form>
          </div>
        </fieldset>
    `;
    this.setup();
  }

  setup() {
    const signinForm = this.querySelector("form");
    const userInput = this.querySelector("#user-name") as
      | HTMLInputElement
      | undefined;
    const changeAvatarBtn = this.querySelector(
      "#change-avatar-btn"
    ) as HTMLButtonElement;
    const avatarInput = this.querySelector("#avatar-input") as HTMLInputElement;
    const avatarPreview = this.querySelector(
      "#avatar-preview"
    ) as HTMLImageElement;
    const removeAvatarBtn = this.querySelector(
      "#remove-avatar-btn"
    ) as HTMLButtonElement;

    // Initially hide the remove button
    removeAvatarBtn.style.display = "none";

    signinForm?.addEventListener("submit", this.handleSumbit);
    userInput?.focus();

    changeAvatarBtn.addEventListener("click", () => {
      avatarInput.click();
    });

    avatarInput.addEventListener("change", () => {
      if (avatarInput.files?.[0]) {
        avatarPreview.src = URL.createObjectURL(avatarInput.files[0]);
        removeAvatarBtn.style.display = "inline-flex";
      }
    });

    removeAvatarBtn.addEventListener("click", () => {
      avatarPreview.src = "/api/static/profile/default.jpg";
      avatarInput.value = "";
      removeAvatarBtn.style.display = "none";
    });
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define("signup-page", SignupPage);
