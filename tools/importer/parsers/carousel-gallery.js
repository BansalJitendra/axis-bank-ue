/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-gallery (base: carousel).
 * Source: https://www.axis.bank.in/ (Financial Literacy Week section)
 * Generated: 2026-07-20
 *
 * An owl-carousel of ~8 rotating images (`.item picture img.fwSliderimg`).
 * Owl duplicates edge slides as `.owl-item.cloned` — those are skipped.
 * Lazy images may carry the real URL on data-src/data-lazy; the parser
 * promotes that onto the <img src> so the imported image resolves.
 *
 * xwalk container block (carousel-gallery-item): each slide = one row:
 *   [ media_image (+ collapsed media_imageAlt) | content_text (optional caption) ]
 */
export default function parse(element, { document }) {
  // Real slides only — exclude owl clones.
  let slides = Array.from(element.querySelectorAll('.owl-item:not(.cloned) .item, .item')).filter(
    (item) => !item.closest('.cloned') && item.querySelector('img, picture'),
  );
  // Fallback: if the owl markup isn't present, take every slide image wrapper.
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('picture, img')).map((n) => n.closest('.item') || n);
  }

  const resolveSrc = (img) => {
    const lazy = img.getAttribute('data-src')
      || img.getAttribute('data-lazy')
      || img.getAttribute('data-original');
    const current = img.getAttribute('src') || '';
    // Ignore 1x1 / base64 placeholders in favour of the lazy URL.
    if (lazy && /^data:/.test(current)) return lazy;
    return current || lazy || '';
  };

  const cells = [];
  const seen = new Set();
  slides.forEach((slide) => {
    const img = slide.tagName === 'IMG' ? slide : slide.querySelector('img');
    if (!img) return;
    const src = resolveSrc(img);
    if (!src || seen.has(src)) return;
    seen.add(src);

    const picture = document.createElement('img');
    picture.setAttribute('src', src);
    const alt = (img.getAttribute('alt') || '').trim();
    if (alt) picture.setAttribute('alt', alt);

    // media_image cell (field:media_image; media_imageAlt collapses into alt).
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:media_image '));
    imageCell.appendChild(picture);

    // content_text cell (field:content_text) — optional caption. Left empty
    // here (the source slides carry no visible caption beyond the alt text).
    const textCell = document.createDocumentFragment();

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'carousel-gallery',
    cells,
  });
  element.replaceWith(block);
}
