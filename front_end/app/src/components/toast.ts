type ToastVariant = 'default' | 'destructive';
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

const TOAST_EVENT_NAME = 'app-toast-event';

export function showToast(toast: Omit<Toast, 'id'>) {
  const event = new CustomEvent(TOAST_EVENT_NAME, {
    detail: {
      ...toast,
      id: crypto.randomUUID(),
    },
  });
  window.dispatchEvent(event);
}

class ToastContainer extends HTMLElement {
  private toasts: Toast[] = [];
  private readonly transitionDuration = 300;

  private closeIconSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  `;

  constructor() {
    super();
    this.className =
      'fixed top-0 z-[100] flex w-full flex-col [&:has(*)]:p-4 space-y-2 sm:inset-auto sm:bottom-0 sm:right-0 sm:max-w-[420px]';
  }

  connectedCallback() {
    window.addEventListener(TOAST_EVENT_NAME, this.handleEvent);
  }

  disconnectedCallback() {
    window.removeEventListener(TOAST_EVENT_NAME, this.handleEvent);
  }

  private handleEvent = (e: Event) => {
    const toast = (e as CustomEvent).detail as Toast;
    this.addToast(toast);
  };

  private addToast(toast: Toast) {
    this.toasts.push(toast);
    this.renderToast(toast);

    setTimeout(() => this.removeToast(toast.id), toast.duration ?? 5000);
  }

  private removeToast(id: string) {
    const el = this.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!el) return;

    const leaveAnim = el.animate(
      [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0 },
      ],
      {
        duration: this.transitionDuration,
        easing: 'ease-out',
      }
    );

    leaveAnim.onfinish = () => {
      el.remove();
      this.toasts = this.toasts.filter((t) => t.id !== id);
    };
  }

  private renderToast(toast: Toast) {
    const toastElement = document.createElement('div');
    toastElement.dataset.id = toast.id;

    const variant: ToastVariant = toast.type === 'error' ? 'destructive' : 'default';
    toastElement.className = this.getToastClass(variant);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'text-sm font-semibold';
    contentDiv.textContent = toast.message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Dismiss');
    closeButton.className = this.getCloseButtonClass(variant);
    closeButton.innerHTML = this.closeIconSvg;
    closeButton.onclick = () => this.removeToast(toast.id);

    toastElement.append(contentDiv, closeButton);
    this.append(toastElement);

    toastElement.animate(
      [
        { transform: 'translateY(16px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 },
      ],
      {
        duration: this.transitionDuration,
        easing: 'ease-out',
      }
    );
  }

  private getToastClass(variant: ToastVariant = 'default'): string {
    const base = `group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg`;
    const themes: Record<ToastVariant, string> = {
      default: 'border bg-background text-foreground',
      destructive: 'border-destructive bg-destructive text-destructive-foreground',
    };
    return `${base} ${themes[variant]}`;
  }

  private getCloseButtonClass(variant: ToastVariant = 'default'): string {
    const base = `absolute right-2 top-2 rounded-md p-1 focus:outline-none focus:ring-2 group-hover:opacity-100`;
    const variantStyles =
      variant === 'destructive'
        ? 'text-red-300 hover:text-red-50 focus:ring-red-400 focus:ring-offset-red-600'
        : 'text-foreground/50 hover:text-foreground focus:ring-ring focus:ring-offset-background';
    return `${base} ${variantStyles}`;
  }
}

customElements.define('toast-container', ToastContainer);
