/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-rates (base: table).
 * Source: https://www.axis.bank.in/ (Interest Rates popup / home side bar)
 * Generated: 2026-07-20
 *
 * The rates content is the `.interest-rates-popup` with two grids:
 *   - Fixed Deposit (left-grid): each `.data-box` group has a rate
 *     (.heading3), a tier (.heading4) and a customer-type + tenure
 *     (.body-text / .body-text2).
 *   - Loans (right-grid): each `.data-box.right-box` group has a rate
 *     (.heading3) and a product name (.body-text2), plus a "Know More" link.
 *
 * Table block (all rows same cell count). Rendered as a 4-column table:
 *   Row 1: block name
 *   Each subsequent row: [ Rate | Tier / Section | Customer Type / Product | Tenure ]
 */
export default function parse(element, { document }) {
  const cells = [];
  const NBSP = / /g;
  const clean = (s) => (s || '').replace(NBSP, ' ').replace(/\s+/g, ' ').trim();

  // Each row uses the 4-column model (table-rates-col-4): column1text..column4text
  // are richtext cells that require field hints. Empty cells get no hint.
  const makeCell = (text, fieldName) => {
    const value = clean(text);
    const frag = document.createDocumentFragment();
    if (!value) return frag; // empty cell: no content, no hint
    frag.appendChild(document.createComment(` field:${fieldName} `));
    const p = document.createElement('p');
    p.textContent = value;
    frag.appendChild(p);
    return frag;
  };

  // The selector may land on the teaser wrapper; the rate data lives in the
  // `.interest-rates-popup`. Prefer rates found inside the matched element,
  // otherwise fall back to the popup anywhere in the document.
  let scopeRoot = element;
  if (!element.querySelector('.heading3')) {
    scopeRoot = document.querySelector('.interest-rates-popup, .home-side-bar') || element;
  }

  // Collect leaf rate groups: a group has a .heading3 (rate) somewhere inside.
  const rateNodes = Array.from(scopeRoot.querySelectorAll('.heading3'));

  rateNodes.forEach((rateEl) => {
    const rate = clean(rateEl.textContent);
    if (!rate) return;

    // Nearest ancestor grouping wrapper that also holds the descriptive text.
    let group = rateEl.closest('.data-box');
    // Walk up to the wrapper that also contains a body-text sibling.
    let scope = group;
    for (let i = 0; i < 4 && scope && scope.parentElement; i += 1) {
      if (scope.querySelector('.body-text, .body-text2')) break;
      scope = scope.parentElement;
    }
    if (!scope) scope = group || rateEl.parentElement;

    const tier = clean(
      (scope.querySelector('.heading4') || {}).textContent || '',
    );

    // Customer type + tenure live in .body-text (two spans) or .body-text2 (single line).
    let customer = '';
    let tenure = '';
    const bt = scope.querySelector('.body-text');
    const bt2 = scope.querySelector('.body-text2');
    if (bt) {
      // Only leaf spans (no nested span) to avoid double-counting parent spans.
      const leafSpans = Array.from(bt.querySelectorAll('span')).filter(
        (s) => !s.querySelector('span'),
      );
      const texts = leafSpans.map((s) => clean(s.textContent)).filter(Boolean);
      // Customer type = first non-parenthetical leaf; tenure = parenthetical leaf.
      customer = texts.find((t) => !t.startsWith('(')) || '';
      tenure = texts.find((t) => t.startsWith('(')) || '';
      if (!customer && !tenure) {
        customer = clean(bt.textContent);
      }
    } else if (bt2) {
      const whole = clean(bt2.textContent);
      const m = whole.match(/^(.*?)(\(.*\))\s*$/);
      if (m) {
        customer = clean(m[1]);
        tenure = clean(m[2]);
      } else {
        customer = whole;
      }
    }

    // Section label (Fixed Deposit / Loans) from the enclosing grid heading.
    const gridWrap = rateEl.closest('.left-grid, .right-grid');
    const section = gridWrap
      ? clean((gridWrap.querySelector('.heading2') || {}).textContent || '')
      : '';

    cells.push([
      makeCell(rate, 'column1text'),
      makeCell(tier || section, 'column2text'),
      makeCell(customer, 'column3text'),
      makeCell(tenure, 'column4text'),
    ]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'table-rates',
    cells,
  });
  element.replaceWith(block);
}
