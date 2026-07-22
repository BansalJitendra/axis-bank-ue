/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-product (base: columns).
 * Source: https://www.axis.bank.in/ (product promo sections — savings /
 *   creditcard / loans / investments / deposits; 5 instances)
 * Generated: 2026-07-20
 *
 * Two-column promo layout. Because this parser runs across 5 sections whose
 * internal markup varies, extraction is content-driven rather than tied to a
 * single wrapper class:
 *   - Right cell: anchors that wrap a promotional image (banner slides,
 *     Scene7/DM images). DM images are kept as carrier anchors for the
 *     downstream DM transformer.
 *   - Left cell: the section heading plus text-only product/service links.
 *
 * Columns block: NO field hints. Row 1 = block name; row 2 = the cells.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector('.card-heading, h2, h3');

  // Image-bearing anchors -> right (promo) column.
  const imageLinks = Array.from(element.querySelectorAll('a[href]')).filter(
    (a) => a.querySelector('img, picture'),
  );
  // Text-only product/service links -> left column.
  const textLinks = Array.from(
    element.querySelectorAll(
      '.item a[href], a.cardwrap, .card-most-searched, .know-more-item a[href], .card-title',
    ),
  ).filter((a) => a.tagName === 'A' && a.getAttribute('href') && !a.querySelector('img, picture'));
  // Bare images not wrapped in an anchor.
  const bareImages = Array.from(element.querySelectorAll('picture, img')).filter(
    (img) => !img.closest('a'),
  );

  // ---- Left column ----------------------------------------------------------
  const leftCell = document.createDocumentFragment();
  if (heading) leftCell.appendChild(heading.cloneNode(true));
  const seenLeft = new Set();
  textLinks.forEach((a) => {
    const href = a.getAttribute('href');
    if (seenLeft.has(href)) return;
    seenLeft.add(href);
    const title = a.querySelector('.card-title, .card-content, p');
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.textContent = (title ? title.textContent : a.textContent || '').trim();
    if (!link.textContent) return;
    const p = document.createElement('p');
    p.appendChild(link);
    leftCell.appendChild(p);
  });

  // ---- Right column ---------------------------------------------------------
  const rightCell = document.createDocumentFragment();
  const seenRight = new Set();
  imageLinks.forEach((a) => {
    const img = a.querySelector('img');
    const href = a.getAttribute('href');
    const key = (img && img.getAttribute('src')) || href;
    if (seenRight.has(key)) return;
    seenRight.add(key);
    const link = document.createElement('a');
    if (href) link.setAttribute('href', href);
    const picture = a.querySelector('picture') || img;
    link.appendChild(picture.cloneNode(true));
    const p = document.createElement('p');
    p.appendChild(link);
    rightCell.appendChild(p);
  });
  bareImages.forEach((img) => {
    const key = img.tagName === 'IMG' ? img.getAttribute('src') : img.querySelector('img')?.getAttribute('src');
    if (key && seenRight.has(key)) return;
    if (key) seenRight.add(key);
    rightCell.appendChild(img.cloneNode(true));
  });

  const hasLeft = leftCell.childNodes.length > 0;
  const hasRight = rightCell.childNodes.length > 0;

  if (!hasLeft && !hasRight) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // If only one side has content, keep the block single-column (one cell)
  // rather than emitting a broken heading + empty column.
  const row = hasLeft && hasRight ? [leftCell, rightCell] : [hasLeft ? leftCell : rightCell];
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-product',
    cells,
  });
  element.replaceWith(block);
}
