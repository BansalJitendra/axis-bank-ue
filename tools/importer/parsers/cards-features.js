/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-features (base: cards, icon variant).
 * Source: https://www.axis.bank.in/ (Digital Banking, #digital-baking-sec .digi-wrapper)
 * Generated: 2026-07-20
 *
 * Each feature card is a `.digi-card` containing an icon-font `span.icon`
 * (no <img> — the glyph is a webfont) and a `p.digi-card-title` label.
 *
 * xwalk container block (card model: image + text). Each card = one row:
 *   [ image (icon) | text (label) ]
 * The icon-font span is kept in the image cell (its class carries the glyph);
 * downstream styling / authoring can swap it for a real asset.
 */
export default function parse(element, { document }) {
  const cards = Array.from(element.querySelectorAll('.digi-card, .digi-item .digi-card'));

  const cells = [];
  cards.forEach((card) => {
    const icon = card.querySelector('.icon, span[class*="icon"]');
    const title = card.querySelector('.digi-card-title, p');

    // image cell (field:image) — carry the icon element.
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (icon) imageCell.appendChild(icon.cloneNode(true));

    // text cell (field:text) — the feature label.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (title) {
      const p = document.createElement('p');
      p.textContent = (title.textContent || '').trim();
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'cards-features',
    cells,
  });
  element.replaceWith(block);
}
