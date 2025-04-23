import { navigateTo } from "~/components/app-router";

class SettingsPage extends HTMLElement {
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
      <div class="container">
        <h1 class="text-3xl font-bold mb-8">Settings</h1>

        <!-- Profile Section -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div class="md:col-span-1">
            <h2 class="text-xl font-semibold mb-1">Profile</h2>
            <p class="text-sm text-muted-foreground">Update your display name, bio, and profile picture.</p>
          </div>
          <div class="md:col-span-2">
            <div class="card border rounded-lg shadow-sm">
              <div class="card-content p-6 space-y-6">
                <!-- Profile Picture -->
                <div class="space-y-2">
                  <label class="label">Profile Picture</label>
                  <div class="flex items-center gap-4">
                    <img id="avatar-preview" src="/api/${window._currentUser.picture_url}" alt="Avatar" class="h-16 w-16 rounded-full object-cover border">
                    <input type="file" id="avatar-input" class="hidden" accept="image/jpeg, image/png, image/webp">
                    <button id="change-avatar-btn" class="btn outline">Change</button>
                    <button id="remove-avatar-btn" class="btn destructive">Remove</button>
                  </div>
                  <p id="avatar-error" class="text-xs text-destructive"></p>
                </div>

                <!-- Username -->
                <div class="space-y-2">
                  <label for="username-input" class="label">Username</label>
                  <input id="username-input" type="text" class="input w-full" placeholder="Your username" autocomplete="off">
                  <p id="username-availability" class="text-xs text-muted-foreground">Your unique display name.</p>
                </div>

                <!-- Bio -->
                <div class="space-y-2">
                  <label for="bio-input" class="label">Bio</label>
                  <textarea id="bio-input" class="input w-full min-h-[80px]" placeholder="Tell us a little about yourself"></textarea>
                  <p class="text-xs text-muted-foreground">A brief description about you.</p>
                </div>
              </div>
              <div class="card-footer p-6 bg-muted/50 border-t flex justify-end">
                <button id="save-profile-btn" class="btn primary">Save Changes</button>
              </div>
            </div>
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
                    <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-sky-500 peer-checked:dark:bg-sky-500 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white"></div>
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

  setup() {
    //
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define("settings-page", SettingsPage);
