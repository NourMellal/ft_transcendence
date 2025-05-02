import { showToast } from "./components/toast";

export async function handleEffect(
  component: HTMLElement,
  fetchDataAsync: () => Promise<any>,
  loadingElement: HTMLElement = document.createElement("app-loader")
) {
  let loader = loadingElement;

  component.appendChild(loader);

  try {
    return await fetchDataAsync();
  } catch (error) {
    showToast({
      type: "error",
      message: "An unexpected error occurred",
    });
  } finally {
    if (loader.isConnected) {
      loader.remove();
    }
  }
}
