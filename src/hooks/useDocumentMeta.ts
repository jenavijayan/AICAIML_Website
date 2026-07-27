import { useEffect } from 'react';

const SITE_NAME = 'AICAIML';
const DEFAULT_TITLE = 'AICAIML — All India Council for Artificial Intelligence & Machine Learning';
const DEFAULT_DESCRIPTION =
  "AICAIML is India's national council for Artificial Intelligence, Machine Learning, and Robotics — offering free and membership-gated courses, verifiable digital certification, and academia-industry partnerships to students, professionals, and institutions across India.";

/** Updates document.title and the meta description per route. This is a
 * client-side hash router (#courses, #membership, ...) serving one static
 * index.html, so search engines won't see distinct content per fragment —
 * this hook's value is the accurate browser tab title and description for
 * real visitors and any JS-executing share-preview unfurler, not classic
 * crawler-driven per-page SEO (that needs real paths + SSR/prerendering,
 * a larger change tracked separately). Restores the previous values on
 * unmount so a leftover page's title doesn't linger after navigating away. */
export function useDocumentMeta(title?: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute('content') ?? DEFAULT_DESCRIPTION;
    if (descriptionTag) {
      descriptionTag.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    return () => {
      document.title = previousTitle;
      if (descriptionTag) {
        descriptionTag.setAttribute('content', previousDescription);
      }
    };
  }, [title, description]);
}
