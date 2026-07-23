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

  // Build the ordered list of friendly tab labels from the tablist.
  // The source `ul.banner-tabs .banner-tab-link h3 a` anchors carry the
  // friendly labels (Save & Grow, Spend with Purpose, ...). They may map to a
  // panel via data-target, but on this site the anchors are href="javascript:void(0)"
  // with no data-target, so the tab list order matches the panel order.
  const tabList = document.querySelector('.banner-tabs');
  const labelLinks = Array.from(
    (tabList || document).querySelectorAll('.banner-tab-link h3 a, .banner-tab-link h3, .banner-tab-link a'),
  );
  const labelById = {};
  const labelsInOrder = [];
  labelLinks.forEach((a) => {
    const text = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    labelsInOrder.push(text);
    const target = a.getAttribute('data-target');
    if (target) labelById[target] = text;
  });

  // Stable fallback map (panel id -> friendly label) confirmed from the source
  // tablist. The headless import can capture the DOM before the tab anchors are
  // populated, in which case the ordered list above is empty; this guarantees
  // the friendly labels instead of the raw panel ids.
  const FALLBACK_LABELS = {
    bannerSavingsAc: 'Save & Grow',
    bannerCreditCards: 'Spend with Purpose',
    bannerLoans: 'Borrow Smart',
    bannerInvestments: 'Build for the future',
    bannerPayments: 'Smart Pay',
    bannerProtection: 'Bank safe',
  };

  const cells = [];

  panels.forEach((panel, idx) => {
    const label = labelById[panel.id]
      || labelsInOrder[idx]
      || FALLBACK_LABELS[panel.id]
      || (panel.getAttribute('aria-label') || '').trim();

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
