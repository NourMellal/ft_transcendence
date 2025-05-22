const sanitizeHtml = (input: string) => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };

  return input.replace(/[&<>"'`=\/]/g, (char) => map[char]);
};

type NodeMarkerInfo = {
  marker: string;
  fragment: DocumentFragment;
};

export const html = (
  strings: TemplateStringsArray,
  ...values: unknown[]
): DocumentFragment => {
  const nodesToInsertLater: Array<NodeMarkerInfo> = [];
  const fragmentMarkerAttribute = 'data-fragment-marker';

  let htmlString = strings[0];

  values.forEach((value, i) => {
    const nextStringLiteralPart = strings[i + 1] || '';

    const isHTMLElement = value instanceof HTMLElement;
    const isDocumentFragment = value instanceof DocumentFragment;
    const isNodeArray =
      Array.isArray(value) &&
      value.every(
        (item) =>
          item instanceof HTMLElement || item instanceof DocumentFragment,
      );

    if (isHTMLElement || isDocumentFragment || isNodeArray) {
      const marker = `fragment-${i}`;
      const nodesContainer = document.createDocumentFragment();

      if (isHTMLElement || isDocumentFragment) {
        nodesContainer.appendChild((value as Node).cloneNode(true));
      } else if (isNodeArray) {
        (value as (HTMLElement | DocumentFragment)[]).forEach((node) => {
          nodesContainer.appendChild(node.cloneNode(true));
        });
      }

      nodesToInsertLater.push({ marker, fragment: nodesContainer });
      htmlString += `<template ${fragmentMarkerAttribute}="${marker}"></template>`;
      htmlString += nextStringLiteralPart;
    } else {
      htmlString += sanitizeHtml(String(value ?? ''));
      htmlString += nextStringLiteralPart;
    }
  });

  const template = document.createElement('template');
  template.innerHTML = htmlString;
  const result = template.content;

  nodesToInsertLater.forEach(({ marker, fragment: fragmentToInsert }) => {
    const placeholder = result.querySelector(
      `[${fragmentMarkerAttribute}="${marker}"]`,
    );
    if (placeholder) {
      placeholder.replaceWith(fragmentToInsert);
    } else {
      console.warn(
        `Could not find placeholder element with marker "${marker}" to insert fragment.`,
      );
    }
  });

  return result;
};

export const raw = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};
