import { useEffect } from 'react';

const SITE_NAME = 'NovelCheckr';
const BASE_URL = 'https://novelcheckr.com';

function setMetaTag(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(path) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', `${BASE_URL}${path}`);
}

/**
 * Sets this route's document title, meta description, and canonical URL.
 * Without this, every route in this SPA shares index.html's single static
 * <title>/<meta description>/<link rel=canonical> — which is what caused
 * Google to source an AI Overview snippet from /privacy-policy instead of
 * the homepage (identical tags gave it no reason to prefer one over the
 * other, so it picked whichever page's crawled text answered the query
 * best). Each route should describe itself, and the canonical should point
 * at itself, not always back at "/".
 */
export default function useDocumentMeta({ title, description, path = '/' }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    setMetaTag('description', description);
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:url', `${BASE_URL}${path}`, 'property');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setCanonical(path);
  }, [title, description, path]);
}

export { SITE_NAME, BASE_URL };
