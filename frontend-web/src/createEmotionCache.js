import createCache from '@emotion/cache';

export default function createEmotionCache() {
  let insertionPoint;
  if (typeof document !== 'undefined') {
    const el = document.querySelector('meta[name="emotion-insertion-point"]');
    insertionPoint = el ?? undefined;
  }
  return createCache({ key: 'mui', insertionPoint });
}