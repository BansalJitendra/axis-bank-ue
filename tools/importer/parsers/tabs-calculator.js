/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-calculator (base: tabs).
 * Source: https://www.axis.bank.in/ (EMI calculators, #emiCalcTabs)
 * Generated: 2026-07-20
 *
 * Tab labels live in `ul.calcTabs-heading--tabs .tab-link a`
 * (Personal Loan / Home Loan / Car Loan EMI Calculator). Content panels are
 * `.line-tab-content` (#personalLoan, #homeLoan, #carLoan). The interactive
 * compute logic is app functionality; the parser captures the tab structure
 * plus the labels, input ranges, EMI result labels and the CTA link present
 * as content.
 *
 * xwalk 2-column tabs table:
 *   Row 1: block name
 *   Each subsequent row: [ Tab Label | Tab Content (richtext) ]
 */
export default function parse(element, { document }) {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  // Map panel id -> label via the tab list anchors. Labels may be linked by
  // id suffix ("#homeLoan-tab" -> "homeLoan"), by href ("#homeLoan") or by
  // aria-controls / data-target.
  const tabLinks = Array.from(
    element.querySelectorAll(
      '.calcTabs-heading--tabs .tab-link a, .line-tabs_card .tab-link a, .tab-link a, [role="tab"] a, [role="tab"]',
    ),
  );
  const labelById = {};
  tabLinks.forEach((a) => {
    const ids = [
      (a.id || '').replace(/-tab$/, ''),
      (a.getAttribute('href') || '').replace(/^#/, ''),
      a.getAttribute('aria-controls') || '',
      a.getAttribute('data-target') || '',
    ].filter(Boolean);
    const text = clean(a.textContent);
    ids.forEach((id) => { if (id && text) labelById[id] = text; });
  });

  // Only top-level tab panels — skip panels nested inside another tab panel
  // (e.g. the #emiCalcTabs sub-tabs embedded in the outer EMI panel).
  const allPanels = Array.from(
    element.querySelectorAll('.line-tab-content, [id][class*="tab-content"]'),
  );
  const panels = allPanels.filter(
    (p) => !allPanels.some((other) => other !== p && other.contains(p)),
  );

  const cells = [];

  panels.forEach((panel, idx) => {
    const label = labelById[panel.id]
      || clean((tabLinks[idx] || {}).textContent || '')
      || panel.id
      || 'Calculator';

    // Label cell -> item field:title.
    const labelFrag = document.createDocumentFragment();
    labelFrag.appendChild(document.createComment(' field:title '));
    const labelCell = document.createElement('p');
    labelCell.textContent = label;
    labelFrag.appendChild(labelCell);

    // Content cell -> item field:content_richtext (content_headingType collapsed).
    const contentFrag = document.createDocumentFragment();
    contentFrag.appendChild(document.createComment(' field:content_richtext '));

    // If this panel wraps a nested tabs widget (e.g. #emiCalcTabs), that
    // content is captured by the dedicated inner instance — summarise it by
    // its sub-tab labels instead of dumping the whole nested widget as text.
    const nestedTabs = panel.querySelector('.calcTabs, [id="emiCalcTabs"]');
    if (nestedTabs) {
      const intro = panel.querySelector('p, .section-heading');
      if (intro && !intro.closest('.calcTabs')) {
        const p = document.createElement('p');
        p.textContent = clean(intro.textContent);
        if (p.textContent) contentFrag.appendChild(p);
      }
      Array.from(
        nestedTabs.querySelectorAll('.tab-link a, [role="tab"] a, [role="tab"]'),
      ).forEach((a) => {
        const txt = clean(a.textContent);
        if (!txt) return;
        const p = document.createElement('p');
        p.textContent = txt;
        contentFrag.appendChild(p);
      });
      cells.push([labelFrag, contentFrag]);
      return;
    }

    // Content cell: each input field (label + min/max range) as a paragraph.
    Array.from(panel.querySelectorAll('.range-main-wrap, .inner-form-wrap')).forEach((field) => {
      const fieldLabel = clean((field.querySelector('.form-control label') || {}).textContent || '');
      const min = clean((field.querySelector('.number-wrap .min-amt') || {}).textContent || '');
      const max = clean((field.querySelector('.number-wrap .max-amt') || {}).textContent || '');
      if (!fieldLabel && !min && !max) return;
      const p = document.createElement('p');
      const range = min || max ? ` (${[min, max].filter(Boolean).join(' – ')})` : '';
      p.textContent = `${fieldLabel}${range}`.trim();
      contentFrag.appendChild(p);
    });

    // EMI result text.
    const totalText = panel.querySelector('.total-text, .totalamt-text');
    if (totalText) {
      const p = document.createElement('p');
      p.textContent = clean(totalText.textContent);
      contentFrag.appendChild(p);
    }

    // CTA link.
    const cta = panel.querySelector('.sec-input-total a[href], a.btn-primary[href]');
    if (cta) {
      const link = document.createElement('a');
      link.setAttribute('href', cta.getAttribute('href'));
      link.textContent = clean(cta.textContent);
      const p = document.createElement('p');
      p.appendChild(link);
      contentFrag.appendChild(p);
    }

    // contentFrag always holds the field comment; only the comment means empty.
    if (contentFrag.childNodes.length <= 1) {
      // Fallback: preserve the panel's text content.
      const p = document.createElement('p');
      p.textContent = clean(panel.textContent);
      if (p.textContent) contentFrag.appendChild(p);
    }

    cells.push([labelFrag, contentFrag]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'tabs-calculator',
    cells,
  });
  element.replaceWith(block);
}
