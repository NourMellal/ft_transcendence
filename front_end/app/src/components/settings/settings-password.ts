import { handleEffect } from "~/utils";
import { navigateTo } from "../app-router";
import { showToast } from "../toast";
import { fetchWithAuth } from "~/api/auth";
import { html } from "~/lib/html";

class SettingsPassword extends HTMLElement {
  constructor() {
    super();
  }

  render() {
    this.replaceChildren(html`
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div class="md:col-span-1">
          <h2 class="text-xl font-semibold mb-1">Password</h2>
          <p class="text-sm text-muted-foreground">
            Update your account password.
          </p>
        </div>
        <div class="md:col-span-2">
          <form class="card border rounded-lg shadow-sm" id="password-form">
            <div class="card-content p-6 space-y-6">
              <!-- Current Password -->
              <div class="space-y-2">
                <label for="current-password" class="label"
                  >Current Password</label
                >
                <input
                  type="password"
                  id="current-password"
                  name="old_password"
                  class="input w-full"
                  placeholder="Enter your current password"
                />
              </div>

              <!-- New Password -->
              <div class="space-y-2">
                <label for="new-password" class="label">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  name="new_password"
                  class="input w-full"
                  placeholder="Enter your new password"
                  required
                />
                <p class="text-xs text-muted-foreground">
                  Password must be at least 8 characters long.
                </p>
              </div>

              <!-- Confirm New Password -->
              <div class="space-y-2">
                <label for="confirm-password" class="label"
                  >Confirm New Password</label
                >
                <input
                  type="password"
                  id="confirm-password"
                  name="confirm_password"
                  class="input w-full"
                  placeholder="Confirm your new password"
                  required
                />
              </div>
            </div>
            <div class="card-footer p-6 bg-muted/50 border-t flex justify-end">
              <button type="submit" class="btn btn-primary">
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    `);
  }

  updatePassword = (e: SubmitEvent) => {
    e.preventDefault();
    const formData = new FormData(
      this.querySelector("#password-form") as HTMLFormElement
    );

    const newPassword = formData.get("new_password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (newPassword !== confirmPassword) {
      showToast({
        type: "error",
        message: "New passwords do not match",
      });
      return;
    }

    handleEffect(document.body, async () => {
      const res = await fetchWithAuth("/api/user/passwd", {
        method: "POST",
        credentials: "include",
        body: formData,
        cache: "no-store",
      });

      if (res.ok) {
        showToast({
          type: "success",
          message: "Password updated successfully",
        });
        navigateTo("/settings");
      } else {
        showToast({
          type: "error",
          message: await res.text(),
        });
      }
    });
  };

  setup() {
    const passwordForm = this.querySelector(
      "#password-form"
    ) as HTMLFormElement;
    passwordForm.addEventListener("submit", this.updatePassword);
  }

  connectedCallback() {
    this.render();
    this.setup();
  }
}

customElements.define("settings-password", SettingsPassword);
