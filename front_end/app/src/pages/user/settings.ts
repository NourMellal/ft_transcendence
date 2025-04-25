import { getUser } from "~/api/user";
import { navigateTo } from "~/components/app-router";
import { showToast } from "~/components/toast";
import { handleEffect } from "~/utils";

class SettingsPage extends HTMLElement {
  // for the username check
  debounceTimeout: number | undefined;

  constructor() {
    super();
  }

  render() {
    if (!window._currentUser) {
      return navigateTo("/signin");
    }
    this.innerHTML = /*html*/ `
      <!-- HTML Markup for Settings Page -->
      <navigation-bar></navigation-bar>
      <div class="container pb-8">

        <!-- Profile Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div class="md:col-span-1">
            <h2 class="text-xl font-semibold mb-1">Profile</h2>
            <p class="text-sm text-muted-foreground">Update your display name, bio, and profile picture.</p>
          </div>
          <div class="md:col-span-2">
            <form class="card border rounded-lg shadow-sm" id='user-details-form'>
              <div class="card-content p-6 space-y-6">
                <!-- Profile Picture -->
                <div class="space-y-2">
                  <label class="label">Profile Picture</label>
                  <div class="flex items-center gap-4">
                    <img id="avatar-preview" src="/api/${window._currentUser.picture_url}" alt="Avatar" class="h-16 w-16 rounded-full object-cover border">
                    <input type="file" id="avatar-input" class="hidden" name='picture' accept="image/jpeg, image/png, image/webp">
                    <button type='button' id="change-avatar-btn" class="btn btn-outlined" id='change-image-btn'>Change</button>
                    <button type='button' id="remove-avatar-btn" class="btn btn-destructive" id='remove-image-btn'>Remove</button>
                  </div>
                  <p id="avatar-error" class="text-xs text-destructive"></p>
                </div>

                <!-- Username -->
                <div class="space-y-2">
                  <div class='flex items-center justify-between gap-2'>
                    <label for="username-input" class="label">Username</label>
                    <span id='username-error-message' class="text-sm text-destructive"></span>
                  </div>
                  <input name='username' id="username-input" type="text" class="input w-full" placeholder="Your username" value='${window._currentUser.username}' autocomplete="off">
                  <p id="username-availability" class="text-xs text-muted-foreground">Your unique display name.</p>
                </div>

                <!-- Bio -->
                <div class="space-y-2">
                  <label for="bio-input" class="label">Bio</label>
                  <textarea name='bio' id="bio-input" class="input w-full min-h-[80px]" placeholder="Tell us a little about yourself">${window._currentUser.bio}</textarea>
                  <p class="text-xs text-muted-foreground">A brief description about you.</p>
                </div>
              </div>
              <div class="card-footer p-6 bg-muted/50 border-t flex justify-end">
                <button id="save-profile-btn" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Security Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="md:col-span-1">
            <h2 class="text-xl font-semibold mb-1">Security</h2>
            <p class="text-sm text-muted-foreground">Manage your account security settings.</p>
          </div>
          <div class="md:col-span-2">
            <div class="card border rounded-lg shadow-sm">
              <div class="card-header p-6 border-b">
                <h3 class="text-lg font-medium">Two-Factor Authentication</h3>
              </div>
              <div class="card-content p-6 space-y-4">
                <p class="text-sm text-muted-foreground mb-4">
                  Add an additional layer of security to your account during login.
                </p>

                <!-- 2FA Status and Toggle -->
                <div class="flex items-center justify-between p-4 border rounded-md bg-background">
                  <div>
                    <p class="font-medium text-sm">Enable 2FA using TOTP</p>
                    <p id="2fa-status" class="text-xs text-muted-foreground">Status: <span class="font-semibold">Disabled</span></p>
                  </div>

                  <!-- Toggle 2FA Switch -->
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer">
                    <div class="w-11 h-6 bg-input rounded-full peer dark:bg-input peer-checked:bg-primary peer-checked:dark:bg-primary after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:dark:bg-background after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full"></div>
                  </label>
                </div>

                <!-- 2FA Setup Area -->
                <div id="2fa-setup-area" class="hidden pt-4 space-y-4">
                  <p class="text-sm">1. Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy):</p>
                  <div id="qr-code-container" class="flex justify-center p-4 border rounded-md bg-white">
                    <div class="w-40 h-40 bg-muted flex items-center justify-center text-muted-foreground text-xs">Loading QR Code...</div>
                  </div>
                  <p class="text-sm">2. Enter the 6-digit code generated by your app to verify and enable 2FA:</p>
                  <div class="flex gap-2 items-start">
                    <div class="flex-grow">
                      <input id="totp-verify-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="input w-full tracking-widest" placeholder="123456">
                      <p id="totp-verify-error" class="text-xs text-destructive mt-1"></p>
                    </div>
                    <button id="verify-2fa-btn" class="btn btn-primary">Verify & Enable</button>
                    <button id="cancel-2fa-btn" class="btn btn-outline">Cancel</button>
                  </div>
                </div>

                <!-- 2FA Disable Area -->
                <div id="2fa-disable-area" class="hidden pt-4 space-y-4">
                  <p class="text-sm">Enter the 6-digit code from your authenticator app to disable 2FA:</p>
                  <div class="flex gap-2 items-start">
                    <div class="flex-grow">
                      <input id="totp-disable-input" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="input w-full tracking-widest" placeholder="123456">
                      <p id="totp-disable-error" class="text-xs text-destructive mt-1"></p>
                    </div>
                    <button id="disable-2fa-btn" class="btn btn-destructive">Confirm Disable</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    `;
  }

  updateProfile = (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(
      this.querySelector("#user-details-form") as HTMLFormElement
    );

    handleEffect(this, async () => {
      const res = await fetch("/api/user/info", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (res.ok) {
        window._currentUser = await getUser();
        showToast({
          type: "success",
          message: "Profile updated successfully",
        });
      } else {
        showToast({
          type: "error",
          message: await res.text(),
        });
      }
    });
  };

  removeAvatar = () => {
    handleEffect(this, async () => {
      const res = await fetch("/api/user/remove_picture", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        window._currentUser = await getUser();
        showToast({
          type: "success",
          message: "Picture removed successfully",
        });
        navigateTo("/settings");
      }
      showToast({ type: "error", message: "something went wrong" });
    });
  };

  setup() {
    const removeAvatarBtn = this.querySelector(
      "#remove-avatar-btn"
    ) as HTMLButtonElement;
    const usernameInput = this.querySelector(
      "input[name='username']"
    ) as HTMLInputElement;
    const changeAvatarBtn = this.querySelector(
      "#change-avatar-btn"
    ) as HTMLButtonElement;
    const avatarInput = this.querySelector("#avatar-input") as HTMLInputElement;
    const avatarPreview = this.querySelector(
      "#avatar-preview"
    ) as HTMLImageElement;

    if (window._currentUser?.picture_url !== "/static/profile/default.jpg") {
      removeAvatarBtn.addEventListener("click", this.removeAvatar);
    } else {
      removeAvatarBtn.disabled = true;
    }

    changeAvatarBtn.addEventListener("click", () => {
      avatarInput.click();
    });

    avatarInput.addEventListener("change", () => {
      if (avatarInput.files?.[0]) {
        avatarPreview.src = URL.createObjectURL(avatarInput.files[0]);
      }
    });

    usernameInput.addEventListener("keyup", (e) => {
      clearTimeout(this.debounceTimeout);
      const target = e.target as HTMLInputElement;
      const errorSpan = document.querySelector(
        "#username-error-message"
      ) as HTMLSpanElement;
      errorSpan.innerText = "";

      const saveBtn = this.querySelector(
        "#save-profile-btn"
      ) as HTMLButtonElement;
      this.debounceTimeout = window.setTimeout(async () => {
        if (e.key === "Enter") return;
        if (!target.value || target.value === window._currentUser?.username) {
          errorSpan.innerText = "";
          saveBtn.disabled = false;
          return;
        }

        try {
          const res = await fetch(
            `/api/user/namecheck?username=${target.value}`,
            {
              method: "GET",
            }
          );
          if (!res.ok) {
            const errorMessage = await res.text();
            errorSpan.innerText = errorMessage || `Username already taken`;
            saveBtn.disabled = true;
          } else {
            errorSpan.innerText = "";
            saveBtn.disabled = false;
          }
        } catch (error) {
          console.error("Error checking username:", error);
          errorSpan.innerText = "Error checking username";
        }
      }, 500);
    });

    const userDetailsForm = this.querySelector(
      "#user-details-form"
    ) as HTMLFormElement;
    userDetailsForm.addEventListener("submit", this.updateProfile);
  }

  connectedCallback() {
    this.render();
    this.setup();
  }

  disconnectedCallback() {
    clearTimeout(this.debounceTimeout);
  }
}

customElements.define("settings-page", SettingsPage);
