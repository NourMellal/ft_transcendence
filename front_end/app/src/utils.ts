import { showToast } from './components/toast';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function handleEffect(
  component: HTMLElement,
  fetchDataAsync: () => Promise<any>,
  delay: number = 300,
  loadingElement: HTMLElement = document.createElement('app-loader'),
): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    let loader = loadingElement;

    component.appendChild(loader);

    try {
      await fetchDataAsync();
    } catch (error) {
      showToast({
        type: 'error',
        message: 'An unexpected error occurred',
      });
    } finally {
      if (loader.isConnected) {
        loader.remove();
      }
    }
  }, delay);
}
