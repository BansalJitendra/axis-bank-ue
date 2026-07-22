/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-product (base: columns).
 * Source: https://www.axis.bank.in/ (product promo bands — account /
 *   creditcard / loans / investments / deposits; 5 instances, nth-of-type 6..10)
 * Generated: 2026-07-22
 *
 * Each band is a two-column promo layout. Source structure (per band, inside an
 * `.open-*` / `#loans|#investments|...` section):
 *   Left  (`.content-box` + sibling `.model`):
 *     - illustration image (`.model picture/img`)
 *     - "learning" article links (`ul.query-list li a.query-link`, ~2)
 *     - a "Learn More" link (`a.view-all-query`)
 *   Right (`.data-card`):
 *     - sub-heading (`h3.data-title`)
 *     - product cards (`ul.option-list li a.option-link`, ~4) each with an
 *       `h4.opt-title` product name + `p.opt-desc` tagline
 *     - an "Explore More"/"Apply Now" CTA (`a.btn-explore`)
 *
 * Extraction is generic (driven off these class hooks) so all 5 bands work from
 * their own DOM. Graceful fallback: if article links / product cards aren't
 * found, still emit the heading + illustration image so output never regresses
 * below heading+image.
 *
 * Columns block: NO field hints. Row 1 = block name; row 2 = the 2 cells.
 */
export default function parse(element, { document }) {
  // The band sits inside the matched nth-of-type wrapper; scope to the section
  // when present so we don't grab neighbouring content.
  const band = element.querySelector(
    '.open-account, .open-creditcard, .open-loans, .open-investments, .open-deposit, section[class*="open-"]',
  ) || element;

  const clean = (s) => (s || '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  const textLink = (href, text) => {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = text;
    const p = document.createElement('p');
    p.appendChild(a);
    return p;
  };

  // ---- Left column ----------------------------------------------------------
  const leftCell = document.createDocumentFragment();

  // Heading (h2.badge-text). Rebuild as a plain <h2> with normalized whitespace
  // so the "open  " prefix + rest reads cleanly.
  const heading = band.querySelector('.badge-text, .content-box h2, h2');
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = clean(heading.textContent);
    leftCell.appendChild(h2);
  }

  // Illustration image (unlinked picture inside `.model`).
  const modelPicture = band.querySelector('.model picture, .content-box ~ .model picture');
  const modelImg = band.querySelector('.model img');
  if (modelPicture) {
    leftCell.appendChild(modelPicture.cloneNode(true));
  } else if (modelImg) {
    leftCell.appendChild(modelImg.cloneNode(true));
  }

  // Article ("learning") links.
  const seenLeft = new Set();
  Array.from(band.querySelectorAll('ul.query-list li a[href], .query-list a.query-link')).forEach((a) => {
    const href = a.getAttribute('href');
    const text = clean(a.textContent);
    if (!href || !text || seenLeft.has(href)) return;
    seenLeft.add(href);
    leftCell.appendChild(textLink(href, text));
  });

  // "Learn More" link.
  const learnMore = band.querySelector('a.view-all-query, .content-box a.link-btn');
  if (learnMore && learnMore.getAttribute('href') && !seenLeft.has(learnMore.getAttribute('href'))) {
    leftCell.appendChild(textLink(learnMore.getAttribute('href'), clean(learnMore.textContent)));
  }

  // ---- Right column ---------------------------------------------------------
  const rightCell = document.createDocumentFragment();

  // Sub-heading (h3.data-title).
  const subHeading = band.querySelector('.data-title, .data-card h3, h3');
  if (subHeading) {
    const h3 = document.createElement('h3');
    h3.textContent = clean(subHeading.textContent);
    rightCell.appendChild(h3);
  }

  // Product cards: keep product name + tagline as link text.
  const seenRight = new Set();
  Array.from(band.querySelectorAll('ul.option-list li a.option-link, .option-list a[href]')).forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || seenRight.has(href)) return;
    seenRight.add(href);
    const title = clean((a.querySelector('.opt-title, h4') || {}).textContent);
    const desc = clean((a.querySelector('.opt-desc') || {}).textContent);
    const label = [title, desc].filter(Boolean).join(' / ') || clean(a.textContent);
    if (!label) return;
    rightCell.appendChild(textLink(href, label));
  });

  // "Explore More" CTA.
  const explore = band.querySelector('a.btn-explore, .data-content a.btn');
  if (explore && explore.getAttribute('href') && !seenRight.has(explore.getAttribute('href'))) {
    rightCell.appendChild(textLink(explore.getAttribute('href'), clean(explore.textContent)));
  }

  const hasLeft = leftCell.childNodes.length > 0;
  const hasRight = rightCell.childNodes.length > 0;

  if (!hasLeft && !hasRight) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Two-cell row when both sides have content; single cell otherwise (graceful
  // fallback keeps at least heading + image rather than a broken empty column).
  const row = hasLeft && hasRight ? [leftCell, rightCell] : [hasLeft ? leftCell : rightCell];
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-product',
    cells,
  });
  element.replaceWith(block);
}
