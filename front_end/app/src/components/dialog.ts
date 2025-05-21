type DialogSize = 'sm' | 'md' | 'lg';

interface DialogAction {
  label: string;
  callback?: (dialog: AppDialog) => void;
  className?: string;
  submit?: boolean;
}

interface DialogOptions {
  title: string;
  content: DocumentFragment | HTMLElement;
  actions?: DialogAction[];
  size?: DialogSize;
  asForm?: boolean;
  formHandler?: (formData: FormData, dialog: AppDialog) => void;
}

const DIALOG_EVENT_NAME = 'app-dialog-event';

export function showDialog(options: DialogOptions) {
  const event = new CustomEvent(DIALOG_EVENT_NAME, {
    detail: { ...options, id: crypto.randomUUID() },
    bubbles: true,
    composed: true,
  });

  let container = document.querySelector<AppDialog>('app-dialog');
  if (!container) {
    container = document.createElement('app-dialog') as AppDialog;
    document.body.append(container);
  }
  container.dispatchEvent(event);
}

class AppDialog extends HTMLElement {
  private readonly transitionDuration = 200;

  constructor() {
    super();
    this.className = 'fixed inset-0 z-[100] hidden items-center justify-center';
  }

  handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  connectedCallback() {
    this.addEventListener(DIALOG_EVENT_NAME, this.handleEvent as EventListener);
    window.addEventListener('keydown', this.handleEscape);
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this.handleEscape);
    this.removeEventListener(DIALOG_EVENT_NAME, this.handleEvent as EventListener);
  }

  private handleEvent = (e: CustomEvent<DialogOptions & { id: string }>) => {
    this.showDialog(e.detail);
  };

  private showDialog(options: DialogOptions & { id: string }) {
    this.innerHTML = '';
    this.style.display = 'flex';

    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-background/60 backdrop-blur-sm';
    overlay.onclick = () => this.close();

    // Panel: either form or div
    const panel = options.asForm ? document.createElement('form') : document.createElement('div');
    panel.className = this.getPanelClass(options.size);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    if (options.asForm && options.formHandler) {
      (panel as HTMLFormElement).onsubmit = (e) => {
        e.preventDefault();
        options.formHandler!(new FormData(panel as HTMLFormElement), this);
      };
    }

    const header = document.createElement('h2');
    header.className = 'text-xl font-semibold text-foreground mb-6';
    header.textContent = options.title;

    const contentEl = document.createElement('div');
    contentEl.className = 'mt-2 text-sm text-foreground';
    contentEl.append(options.content);

    const footer = document.createElement('div');
    footer.className = 'mt-4 flex gap-2 flex-row-reverse';

    options.actions?.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = options.asForm && action.submit ? 'submit' : 'button';
      btn.className = action.className || 'btn-primary';
      btn.textContent = action.label;
      if (action.callback) btn.onclick = () => action.callback!(this);
      footer.append(btn);
    });

    // Default Close
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-destructive';
    closeBtn.textContent = 'Cancel';
    closeBtn.onclick = () => this.close();
    footer.append(closeBtn);

    panel.append(header, contentEl, footer);
    this.append(overlay, panel);

    panel.animate(
      [
        { transform: 'scale(0.9)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: this.transitionDuration, easing: 'ease-out' }
    );

    contentEl.querySelector<HTMLInputElement>('input:not([type="hidden"])')?.focus();
  }

  close() {
    const panel = this.querySelector('[role="dialog"]') as HTMLElement;
    if (panel) {
      const anim = panel.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(0.9)', opacity: 0 },
        ],
        { duration: this.transitionDuration, easing: 'ease-in' }
      );
      anim.onfinish = () => this.reset();
    } else this.reset();
  }

  private reset() {
    this.innerHTML = '';
    this.style.display = 'none';
  }

  private getPanelClass(size: DialogSize = 'md'): string {
    const base = 'relative z-[101] rounded-lg bg-card p-6 shadow-lg ring-1 ring-ring';
    const sizes: Record<DialogSize, string> = {
      sm: 'w-full max-w-sm',
      md: 'w-full max-w-md',
      lg: 'w-full max-w-lg',
    };
    return `${base} ${sizes[size]}`;
  }
}

if (!customElements.get('app-dialog')) {
  customElements.define('app-dialog', AppDialog);
}
