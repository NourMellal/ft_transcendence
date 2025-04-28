import { showToast } from "./components/toast";

export async function handleEffect(
  component: HTMLElement,
  fetchDataAsync: () => Promise<any>,
  loadingElement: HTMLElement = document.createElement("app-loader"),
  delay = 150
) {
  let loader = loadingElement;

  // debounce loading state
  const showLoader = setTimeout(() => {
    component.appendChild(loader);
  }, delay);

  try {
    return await fetchDataAsync();
  } catch (error) {
    showToast({
      type: "error",
      message: "An unexpected error occurred",
    });
  } finally {
    clearTimeout(showLoader);
    if (loader.isConnected) {
      loader.remove();
    }
  }
}
