/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo (base: columns).
 * Source: https://www.axis.bank.in/ (Payments & Rewards section, #payments)
 * Generated: 2026-07-20
 *
 * Two side-by-side promo panels:
 *   - `.effortless` — "Payments made effortless": heading + description +
 *     quick-action links (Bill Payments, Digital Rupee, FASTag, View All) +
 *     illustration image.
 *   - `.spending` — "Spending made rewarding": heading + description +
 *     "Explore Offers" CTA + reward banner images.
 *
 * Columns block: NO field hints. Row 1 = block name; row 2 = the 2 panel cells.
 */
export default function parse(element, { document }) {
  // The nth-of-type selector may not land exactly on the payments section;
  // fall back to the #payments section anywhere in the document.
  let root = element;
  if (!root.querySelector('.effortless, .spending, .payments-wrapper')) {
    root = document.querySelector('#payments, .payments, .payments-wrapper') || element;
  }

  const panels = Array.from(
    root.querySelectorAll('.effortless, .spending'),
  );
  // Fallback: split the two direct promo children if class names differ.
  const panelEls = panels.length
    ? panels
    : Array.from(root.querySelectorAll('.payments-wrapper > div')).slice(0, 2);

  const buildPanel = (panel) => {
    const cell = document.createDocumentFragment();

    const heading = panel.querySelector('.paymt-title, h2, h3');
    if (heading) cell.appendChild(heading.cloneNode(true));
    const desc = panel.querySelector('.paymt-desc, p:not(.plans-link p)');
    if (desc && !desc.closest('.plans-link')) cell.appendChild(desc.cloneNode(true));

    // Quick-action links (icon + label) -> keep as text links.
    const quickLinks = Array.from(panel.querySelectorAll('.plans-link, .plans-item > a[href]'));
    const seen = new Set();
    quickLinks.forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || seen.has(href)) return;
      seen.add(href);
      const label = a.querySelector('p');
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.textContent = (label ? label.textContent : a.textContent || '').trim();
      if (!link.textContent) return;
      const p = document.createElement('p');
      p.appendChild(link);
      cell.appendChild(p);
    });

    // Standalone CTA (e.g. Explore Offers).
    const cta = panel.querySelector('.btn-explore, a.link-btn');
    if (cta && cta.getAttribute('href') && !seen.has(cta.getAttribute('href'))) {
      cell.appendChild(cta.cloneNode(true));
    }

    // Images: illustration + reward banners (kept as linked pictures when linked).
    const imgSeen = new Set();
    // Linked banner images.
    Array.from(panel.querySelectorAll('a.card-item[href]')).forEach((a) => {
      const img = a.querySelector('img');
      const key = img && img.getAttribute('src');
      if (!img || (key && imgSeen.has(key))) return;
      if (key) imgSeen.add(key);
      const link = document.createElement('a');
      link.setAttribute('href', a.getAttribute('href'));
      link.appendChild((a.querySelector('picture') || img).cloneNode(true));
      const p = document.createElement('p');
      p.appendChild(link);
      cell.appendChild(p);
    });
    // Unlinked illustration image(s).
    Array.from(panel.querySelectorAll('picture, img')).forEach((node) => {
      if (node.closest('a')) return;
      const img = node.tagName === 'IMG' ? node : node.querySelector('img');
      const key = img && img.getAttribute('src');
      if (key && imgSeen.has(key)) return;
      if (key) imgSeen.add(key);
      cell.appendChild(node.cloneNode(true));
    });

    return cell;
  };

  const cellsRow = panelEls
    .map((p) => buildPanel(p))
    .filter((frag) => frag.childNodes.length);

  if (!cellsRow.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [cellsRow];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-promo',
    cells,
  });
  element.replaceWith(block);
}
