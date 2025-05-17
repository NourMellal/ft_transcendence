import { ActiveSession, fetchActiveSessions } from '~/api/sessions';
import { html } from '~/lib/html';
import { showDialog } from '../dialog';

class SettingsDevices extends HTMLElement {
  private sessions: ActiveSession[] | null = null;

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  async render() {
    this.sessions = await fetchActiveSessions();
    this.replaceChildren(html`
      <fieldset class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div class="md:col-span-1">
          <h2 class="text-xl font-semibold mb-1">Connected Devices</h2>
          <p class="text-sm text-muted-foreground">
            Manage devices and sessions that have access to your account.
          </p>
        </div>
        <div class="md:col-span-2">
          <div class="card border rounded-lg shadow-sm">
            <div class="card-header p-6 border-b">
              <h3 class="text-lg font-medium">Active Sessions</h3>
            </div>
            <div class="card-content p-6">
              ${!this.sessions
                ? html`
                    <p class="text-sm text-muted-foreground">Failed to fetch active sessions.</p>
                  `
                : this.sessions.length === 0
                ? html` <p class="text-sm text-muted-foreground">No active sessions found.</p> `
                : html`
                    <ul class="space-y-4">
                      ${this.sessions.map(
                        (session) => html`
                          <li
                            class="flex items-center justify-between p-4 border rounded-md bg-background hover:bg-muted/50 transition-colors"
                          >
                            <div>
                              <p class="font-medium text-foreground">IP Address: ${session.ip}</p>
                              <p class="text-sm text-muted-foreground">
                                Connected: ${this.formatDate(session.created)}
                              </p>
                            </div>
                            <button
                              class="btn btn-sm btn-destructive"
                              data-token-id="${session.token_id}"
                            >
                              Revoke
                            </button>
                          </li>
                        `
                      )}
                    </ul>
                  `}
            </div>
            <div class="card-footer p-6 bg-muted/50 border-t flex justify-end">
              <button
                ${!this.sessions?.length ? 'disabled' : ''}
                class="btn btn-outlined"
                id="revoke-all-sessions-btn"
              >
                Revoke All Sessions
              </button>
            </div>
          </div>
        </div>
      </fieldset>
    `);
    this.setup();
  }

  setup() {
    const revokeButtons = this.querySelectorAll<HTMLButtonElement>('button[data-token-id]');
    const revokeAllButton = this.querySelector<HTMLButtonElement>('#revoke-all-sessions-btn')!;

    revokeButtons.forEach((button) => {
      button.addEventListener('click', async () => {
        const tokenId = button.dataset.tokenId;
        if (tokenId) {
          await fetch(`/api/jwt/revoke?token_id=${tokenId}`, {
            method: 'POST',
            cache: 'no-store',
          });
          this.render();
        }
      });
    });

    revokeAllButton.addEventListener('click', async () => {
      showDialog({
        content: html`<p>Are you sure? this action is irreversible.</p>`,
        title: 'Revoke All Sessions',
        actions: [
          {
            label: 'Confirm',
            callback: async (dialog) => {
              await Promise.all(
                Array.from(revokeButtons).map(async (button) => {
                  const tokenId = button.dataset.tokenId;
                  if (tokenId) {
                    await fetch(`/api/jwt/revoke?token_id=${tokenId}`, {
                      method: 'POST',
                      cache: 'no-store',
                    });
                  }
                })
              );
              this.render();
              dialog.close();
            },
          },
        ],
      });
    });
  }

  connectedCallback() {
    this.render();
  }
}

customElements.define('settings-devices', SettingsDevices);
