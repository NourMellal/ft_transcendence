import { routes } from '~/routes';

function normalizePath(path: string) {
  let normalized = path.replace(/\/{2,}/g, '/');

  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function navigateTo(pathname: string, preserveScroll = false) {
  const appRouter = document.querySelector('app-router') as AppRouter | null;

  const [path, search] = pathname.split('?');
  const normalizedPath = normalizePath(path);
  const currentPath = normalizePath(window.location.pathname);
  const currentSearch = window.location.search;

  if (normalizedPath !== currentPath || search !== currentSearch.slice(1)) {
    const newUrl = search ? `${normalizedPath}?${search}` : normalizedPath;
    window.history.pushState({ pathname: normalizedPath, search }, '', newUrl);
  }
  if (!preserveScroll) {
    window.scrollTo(0, 0);
  }
  appRouter?.renderPage();
}

class AppRouter extends HTMLElement {
  renderPage = () => {
    const route = normalizePath(window.location.pathname);
    const match = routes.find((r) => {
      if (r.pathname === '*') return true;
      return r.pathname === route;
    });

    if (match) {
      document.title = match.title ?? 'ft_transcendence';
      match.component().then((component) => {
        const componentName = customElements.getName(component.default);
        if (componentName) {
          const element = document.createElement(componentName);
          this.replaceChildren(element);
        }
      });
    }
  };

  onLinkClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    const anchor = target.closest('a');
    if (!anchor) return;

    if (
      anchor.target === '_blank' ||
      anchor.hasAttribute('download') ||
      anchor.getAttribute('rel') === 'external' ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const href = anchor.href;
    const origin = window.location.origin;

    if (href.startsWith(origin)) {
      event.preventDefault();
      if (
        anchor.pathname !== window.location.pathname ||
        anchor.search !== window.location.search
      ) {
        navigateTo(href.replace(origin, ''));
      }
    }
  };

  connectedCallback() {
    this.addEventListener('click', this.onLinkClick);
    window.addEventListener('popstate', this.renderPage);
    navigateTo(window.location.pathname + window.location.search);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.renderPage);
  }
}

if (!customElements.get('app-router')) {
  customElements.define('app-router', AppRouter);
}
