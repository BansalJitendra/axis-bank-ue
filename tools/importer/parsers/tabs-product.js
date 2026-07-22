/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-product (base: tabs).
 * Source: https://www.axis.bank.in/ (#hm-banner overlaid product finder)
 * Generated: 2026-07-20
 *
 * The tab panels live in `.banner-tab-wrap.home-banner-tab-wrap` as
 * `.banner-tab-card` divs (ids: bannerSavingsAc, bannerCreditCards,
 * bannerLoans, bannerInvestments, bannerPayments, bannerProtection).
 * The matching tab labels live in the sibling `ul.banner-tabs` list inside
 * #hm-banner: each `.banner-tab-link h3 a[data-target]` links to a panel id.
 *
 * xwalk 2-column tabs table:
 *   Row 1: block name
 *   Each subsequent row: [ Tab Label | Tab Content (richtext) ]
 */
export default function parse(element, { document }) {
  const panels = Array.from(
    element.querySelectorAll(':scope > .banner-tab-card, :scope > [id^="banner"]'),
  );

  // Build a map of panel id -> tab label from the tablist (elsewhere in the page).
  const labelLinks = Array.from(
    document.querySelectorAll('.banner-tabs .banner-tab-link a[data-target], .banner-tab-link a[data-target]'),
  );
  const labelById = {};
  labelLinks.forEach((a) => {
    const target = a.getAttribute('data-target');
    if (target) labelById[target] = (a.textContent || '').trim();
  });

  const cells = [];

  panels.forEach((panel) => {
    const label = labelById[panel.id] || (panel.getAttribute('aria-label') || '').trim();

    // Tab label cell (mandatory, first cell) -> item field:title
    const labelFrag = document.createDocumentFragment();
    labelFrag.appendChild(document.createComment(' field:title '));
    const labelCell = document.createElement('p');
    labelCell.textContent = label || panel.id || 'Tab';
    labelFrag.appendChild(labelCell);

    // Tab content cell (richtext): the panel's article links + explore CTA
    // -> item field:content_richtext (content_headingType is collapsed, no hint)
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content_richtext '));
    const contentEls = Array.from(
      panel.querySelectorAll(
        '.card-most-searched, .searchedCards a[href], .most-searched > a.btn, a.btn-primary',
      ),
    );
    if (contentEls.length) {
      contentEls.forEach((node) => contentFrag.appendChild(node.cloneNode(true)));
    } else {
      // fallback: clone the whole panel body
      Array.from(panel.childNodes).forEach((n) => contentFrag.appendChild(n.cloneNode(true)));
    }

    cells.push([labelFrag, contentFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'tabs-product',
    cells,
  });
  element.replaceWith(block);
}
