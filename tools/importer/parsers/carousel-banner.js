/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-banner (base: carousel).
 * Source: https://www.axis.bank.in/ (#hm-banner hero banner)
 * Generated: 2026-07-20
 *
 * The Axis #hm-banner does not use classic full-image slides. The rotating
 * effect comes from the `.slider-text` spans inside `h2.banner-title`
 * ("financial growth" / "aspirations" / "life goals" / "progress"). Each
 * rotating phrase is treated as a slide caption over the shared headline,
 * subtitle and CTAs. The decorative `.banner-curve` band image is used as
 * the shared slide media_image.
 *
 * xwalk container block (carousel-banner-item): each slide row =
 *   [ media_image (+ collapsed media_imageAlt) | content_text (richtext) ]
 */
export default function parse(element, { document }) {
  const titleEl = element.querySelector('h2.banner-title, .banner-title, h1, h2');
  const subtitle = element.querySelector('.banner-subtitle, p');
  const ctaLinks = Array.from(
    element.querySelectorAll('.banner-btn-wrap a[href], .banner-btn-wrap .btn'),
  );
  const bandImage = element.querySelector('.banner-curve img, img[class*="banner"], img');

  // Rotating phrases -> one slide each. Fall back to a single slide if none.
  const sliderPhrases = Array.from(
    element.querySelectorAll('.slider-text-wrapper .slider-text, .slider-text'),
  )
    .map((s) => (s.textContent || '').trim())
    .filter((t) => t.length);
  // Dedupe while preserving order (the source repeats the first phrase).
  const uniquePhrases = [...new Set(sliderPhrases)];

  // Shared, non-rotating portion of the headline (strip the rotating wrapper).
  let baseHeadline = '';
  if (titleEl) {
    const clone = titleEl.cloneNode(true);
    const wrapper = clone.querySelector('.slider-text-wrapper');
    if (wrapper) wrapper.remove();
    baseHeadline = (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }

  const cells = [];

  const buildContentCell = (phrase) => {
    const cell = [];
    const heading = document.createElement('h2');
    heading.textContent = phrase ? `${baseHeadline} ${phrase}`.trim() : baseHeadline;
    if (heading.textContent) cell.push(heading);
    if (subtitle) cell.push(subtitle.cloneNode(true));
    ctaLinks.forEach((link) => {
      // buttons (no href) become plain text CTAs; anchors keep their href
      if (link.tagName === 'A' && link.getAttribute('href')) {
        cell.push(link.cloneNode(true));
      } else if ((link.textContent || '').trim()) {
        const p = document.createElement('p');
        p.textContent = (link.textContent || '').trim();
        cell.push(p);
      }
    });
    return cell;
  };

  const slides = uniquePhrases.length ? uniquePhrases : [''];
  slides.forEach((phrase, idx) => {
    // media_image cell (field:media_image; media_imageAlt collapses into alt)
    const imageCell = document.createDocumentFragment();
    if (bandImage) {
      imageCell.appendChild(document.createComment(' field:media_image '));
      imageCell.appendChild(idx === 0 ? bandImage : bandImage.cloneNode(true));
    }
    // content_text cell (field:content_text)
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content_text '));
    buildContentCell(phrase).forEach((n) => contentFrag.appendChild(n));

    cells.push([imageCell, contentFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'carousel-banner',
    cells,
  });

  // The overlaid tabbed product finder (.banner-tab-wrap) lives inside #hm-banner
  // and is a separate block (tabs-product). Replacing the whole container would
  // destroy it, so insert the carousel block before the container and strip only
  // the intro pieces we consumed, leaving the tab wrap intact for tabs-product.
  const tabWrap = element.querySelector('.banner-tab-wrap.home-banner-tab-wrap');
  if (tabWrap && element.parentNode) {
    element.parentNode.insertBefore(block, element);
    ['.banner-title', '.banner-subtitle', '.banner-btn-wrap', 'ul.banner-tabs', '.banner-curve']
      .forEach((sel) => element.querySelectorAll(sel).forEach((n) => n.remove()));
  } else {
    element.replaceWith(block);
  }
}
