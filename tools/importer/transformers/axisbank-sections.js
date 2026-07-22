/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Axis Bank section boundaries.
 *
 * Emits EDS section breaks (<hr>) and Section Metadata blocks from the
 * template's sections[] array (page-templates.json). Runs in afterTransform
 * only, so block parsers have already extracted their content before section
 * scaffolding is inserted.
 *
 * Section selectors come from payload.template.sections (verified against
 * migration-work/cleaned.html: body > main > div.pageWrapper.home > div:nth-of-type(n)).
 * All 11 homepage sections carry a style (light | accent | dark).
 *
 * Expected output for the homepage template (11 sections, all styled):
 *  - Section breaks (<hr>): 10  (one before each section except the first)
 *  - Section Metadata blocks: 11 (one per section with a style)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const template = payload && payload.template;
  const sections = template && Array.isArray(template.sections) ? template.sections : [];
  if (sections.length < 2) return;

  const doc = element.ownerDocument || document;

  // Process in reverse so inserting <hr>/metadata does not disturb the DOM
  // positions of not-yet-processed earlier sections.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section || !section.selector) continue;

    // Resolve the section root within the transformed element. The nth-of-type
    // selectors reference the original document tree; try scoped lookup first,
    // then fall back to the owning document.
    let target = element.querySelector(section.selector);
    if (!target) target = doc.querySelector(section.selector);
    if (!target) continue;

    // Section Metadata block appended after the section content, when styled.
    if (section.style) {
      const metaBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      if (target.parentNode) {
        target.parentNode.insertBefore(metaBlock, target.nextSibling);
      }
    }

    // Section break before every section except the first, when preceded by content.
    if (i > 0 && target.parentNode && target.previousElementSibling) {
      const hr = doc.createElement('hr');
      target.parentNode.insertBefore(hr, target);
    }
  }
}
