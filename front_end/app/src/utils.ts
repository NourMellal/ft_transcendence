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
    const result = await fetchDataAsync();
    return result;
  } finally {
    clearTimeout(showLoader);
    if (loader.isConnected) {
      loader.remove();
    }
  }
}
