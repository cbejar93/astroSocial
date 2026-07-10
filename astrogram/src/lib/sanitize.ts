/**
 * Shared HTML sanitization utilities.
 *
 * sanitizeHtml: allowlist-based sanitizer — strips all tags not in the allowlist
 *   and removes all attributes not in the allowed set. Prevents XSS from
 *   user-generated or admin-created HTML content.
 *
 * toSafeHtml: deep-decode HTML entities first, then sanitize (handles double-
 *   encoded payloads that arrive as entities).
 */

function decodeHtmlEntitiesDeep(value: string): string {
  if (!value) return '';
  let prev = value;
  for (let i = 0; i < 5; i++) {
    const ta = document.createElement('textarea');
    ta.innerHTML = prev;
    const next = ta.value;
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

export function sanitizeHtml(value: string): string {
  if (typeof window === 'undefined' || !value) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, 'text/html');
  const body = doc.body;
  if (!body) return '';

  const allowedTags = new Set([
    'a',
    'blockquote',
    'br',
    'code',
    'em',
    'i',
    'li',
    'ol',
    'p',
    'pre',
    'strong',
    'ul',
  ]);
  const allowedAttrs = new Set(['href', 'title', 'rel', 'target']);

  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_ELEMENT, null);
  const nodesToRemove: Element[] = [];
  const nodesToUnwrap: Element[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Element;
    const tag = node.tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      if (tag === 'script' || tag === 'style') {
        nodesToRemove.push(node);
        continue;
      }
      nodesToUnwrap.push(node);
      continue;
    }

    [...node.attributes].forEach((attr) => {
      if (!allowedAttrs.has(attr.name.toLowerCase())) node.removeAttribute(attr.name);
    });

    if (tag === 'a') {
      if (!node.hasAttribute('rel')) node.setAttribute('rel', 'noopener noreferrer');
      if (!node.hasAttribute('target')) node.setAttribute('target', '_blank');
      // Block javascript: and data: hrefs
      const href = node.getAttribute('href') ?? '';
      if (/^\s*(javascript|data):/i.test(href)) node.removeAttribute('href');
    }
  }

  nodesToRemove.forEach((n) => n.remove());
  nodesToUnwrap.forEach((n) => {
    const frag = document.createDocumentFragment();
    while (n.firstChild) frag.appendChild(n.firstChild);
    n.replaceWith(frag);
  });

  return body.innerHTML;
}

export const toSafeHtml = (value: string): string =>
  sanitizeHtml(decodeHtmlEntitiesDeep(value));
