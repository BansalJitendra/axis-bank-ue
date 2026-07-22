import { getMetadata } from '../../scripts/aem.js';

/**
 * Resolve the footer fragment path (without the .plain.html suffix) from block
 * metadata, defaulting to the site footer document.
 * @returns {string} footer document path
 */
function getFooterPath() {
  const meta = getMetadata('footer');
  if (meta) return new URL(meta, window.location).pathname;
  return '/footer';
}

/**
 * Fetch the footer fragment markup. Tries the metadata-driven path first — it is
 * authoritative and resolves identically in the Universal Editor, preview and
 * published site (e.g. /footer.plain.html). The /content/footer.plain.html path
 * is only a local-dev ("aem up") fallback; trying it first caused the UE to load
 * a different/stale footer than the preview.
 * @returns {Promise<string|null>} raw HTML string or null
 */
async function fetchFooterMarkup() {
  let resp = await fetch(`${getFooterPath()}.plain.html`);
  if (!resp.ok) {
    resp = await fetch('/content/footer.plain.html');
  }
  if (!resp.ok) return null;
  return resp.text();
}

/**
 * Parse raw footer markup into an array of top-level section elements.
 * @param {string} markup raw HTML
 * @returns {Element[]} section elements
 */
function parseSections(markup) {
  const tpl = document.createElement('div');
  tpl.innerHTML = markup;
  return [...tpl.children].filter((el) => el.tagName === 'DIV');
}

/**
 * Determine whether a section is a link-column group belonging to the upper
 * (light) band: sections whose first child is a heading.
 * @param {Element} section
 * @returns {boolean}
 */
function isColumnSection(section) {
  const first = section.firstElementChild;
  return !!first && /^H[1-6]$/.test(first.tagName);
}

/**
 * Classify a section by its content so the correct layout region is applied.
 * @param {Element} section
 * @param {number} index
 * @param {number} total
 * @returns {string} region class suffix
 */
function classifySection(section, index, total) {
  const text = section.textContent.replace(/\s+/g, ' ').trim();
  if (index === total - 1 && /Copyright/i.test(text)) return 'copyright';
  if (section.querySelector('img[alt="QR code"], img[alt="DICGC"]')
    || section.querySelector('a[href*="facebook"], a[href*="instagram"]')) return 'connect';
  if (/Site best viewed/i.test(text)) return 'siteinfo';
  if (/Our Offerings/i.test(text)) return 'offerings';
  if (isColumnSection(section)) return 'column';
  return 'other';
}

/**
 * Build the decorated footer DOM from parsed sections, grouping the upper
 * link columns into a single band and the remaining bands beneath.
 * @param {Element[]} sections
 * @returns {Element} footer wrapper
 */
function buildFooter(sections) {
  const wrapper = document.createElement('div');
  wrapper.className = 'footer-content';

  const columnBand = document.createElement('div');
  columnBand.className = 'footer-columns';

  const lowerBand = document.createElement('div');
  lowerBand.className = 'footer-lower';

  let copyright = null;

  sections.forEach((section, i) => {
    const region = classifySection(section, i, sections.length);
    section.classList.add('footer-section', `footer-section-${region}`);
    if (region === 'connect') {
      // tag the social-icons list so it is discoverable as social markup
      const socialList = section.querySelector('ul');
      if (socialList) socialList.classList.add('footer-social');
    }
    if (region === 'column') {
      columnBand.append(section);
    } else if (region === 'copyright') {
      copyright = section;
    } else {
      lowerBand.append(section);
    }
  });

  if (columnBand.children.length) wrapper.append(columnBand);
  if (lowerBand.children.length) wrapper.append(lowerBand);
  if (copyright) wrapper.append(copyright);

  return wrapper;
}

/**
 * Wire up the mobile accordion for the upper link columns. Each column heading
 * (h3) becomes a tappable trigger controlling the list that immediately follows
 * it. Behavior only takes effect on mobile (guarded by the footer-columns
 * layout collapsing in CSS); on desktop every list stays open. Single-expand:
 * opening one heading closes any other open heading.
 * @param {Element} wrapper the decorated footer wrapper
 */
function setupAccordion(wrapper) {
  const columnBand = wrapper.querySelector('.footer-columns');
  if (!columnBand) return;

  const triggers = [...columnBand.querySelectorAll('h3')];
  triggers.forEach((heading) => {
    const list = heading.nextElementSibling;
    if (!list || list.tagName !== 'UL') return;
    heading.classList.add('footer-accordion-trigger');
    heading.setAttribute('role', 'button');
    heading.setAttribute('tabindex', '0');
    heading.setAttribute('aria-expanded', 'false');

    const toggle = () => {
      const willOpen = !heading.classList.contains('footer-accordion-open');
      // single-expand: close all others first
      triggers.forEach((other) => {
        other.classList.remove('footer-accordion-open');
        other.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        heading.classList.add('footer-accordion-open');
        heading.setAttribute('aria-expanded', 'true');
      }
    };

    heading.addEventListener('click', toggle);
    heading.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const markup = await fetchFooterMarkup();
  block.textContent = '';
  if (!markup) return;

  const sections = parseSections(markup);
  if (!sections.length) return;

  const footer = buildFooter(sections);
  setupAccordion(footer);
  block.append(footer);
}
