import { getMetadata } from '../../scripts/aem.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Chevron/arrow markup for mobile expand toggles. A dedicated button so the
 * text link can still navigate while the chevron expands the sub-panel.
 * @returns {HTMLButtonElement}
 */
function makeChevronToggle(label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'nav-chevron';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', `Expand ${label || 'section'}`);
  return btn;
}

/**
 * Fetch the nav fragment as raw HTML. Tries the canonical content path first,
 * then falls back to the metadata-driven path (both as plain HTML).
 * @param {string} navPath metadata-derived nav path (no extension)
 * @returns {Promise<Document|null>} parsed fragment document
 */
async function fetchNavFragment(navPath) {
  const candidates = ['/content/nav.plain.html', `${navPath}.plain.html`];
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(candidates[i]);
      if (resp.ok) {
        // eslint-disable-next-line no-await-in-loop
        const html = await resp.text();
        if (html && html.trim()) {
          return new DOMParser().parseFromString(html, 'text/html');
        }
      }
    } catch (e) {
      // try next candidate
    }
  }
  return null;
}

/**
 * Rewrite an image path so relative fragment paths resolve against the content
 * folder where nav.plain.html and its images live.
 * @param {HTMLImageElement} img
 */
function resolveImagePath(img) {
  const src = img.getAttribute('src');
  if (src && !src.startsWith('http') && !src.startsWith('/')) {
    // Nav images are committed to the repo-served /icons folder (available on
    // both local preview and the published site), keyed by file name. The
    // authored fragment references them as relative "images/<file>" paths.
    const fileName = src.split('/').pop();
    img.setAttribute('src', `/icons/${fileName}`);
  }
}

/**
 * Close every open dropdown panel in a nav bar.
 * @param {Element} navBar the bar whose panels should be collapsed
 * @param {Element} [except] optional item to keep open
 */
function collapseAllPanels(navBar, except) {
  navBar.querySelectorAll(':scope > ul > li[aria-expanded="true"]').forEach((li) => {
    if (li !== except) li.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Wire hover + click behaviour for a bar of top-level items that each expose a
 * dropdown/megamenu panel. Works for both the product megamenu row and any
 * other row with nested lists.
 * @param {Element} navBar container whose direct <ul> holds the triggers
 */
function decorateDropdownBar(navBar) {
  const items = navBar.querySelectorAll(':scope > ul > li');
  items.forEach((li) => {
    const list = li.querySelector(':scope > ul');
    if (!list) return;
    li.classList.add('has-panel');
    li.setAttribute('aria-expanded', 'false');

    // Wrap the sub-link list plus any promo images/paragraphs into one panel
    // element so the whole megamenu (links + promo cards) shows/hides together.
    const panel = document.createElement('div');
    // 'nav-panel' keeps the panel discoverable by generic nav-panel tooling;
    // 'megamenu-panel' drives the desktop hover megamenu styling.
    panel.className = 'megamenu-panel nav-panel';
    const trigger = li.querySelector(':scope > a');
    Array.from(li.children).forEach((child) => {
      if (child !== trigger) panel.append(child);
    });
    li.append(panel);

    // A list whose items carry no links is a set of filter pills — mark it and
    // wire simple click-to-activate filtering behaviour.
    panel.querySelectorAll(':scope > ul').forEach((ul) => {
      const hasLinks = ul.querySelector(':scope > li > a');
      if (!hasLinks) {
        ul.classList.add('megamenu-filters');
        ul.querySelectorAll(':scope > li').forEach((pill) => {
          pill.setAttribute('role', 'button');
          pill.setAttribute('tabindex', '0');
          pill.addEventListener('click', () => {
            ul.querySelectorAll(':scope > li').forEach((p) => p.classList.remove('is-active'));
            pill.classList.add('is-active');
          });
        });
        const firstPill = ul.querySelector(':scope > li');
        if (firstPill) firstPill.classList.add('is-active');
      } else {
        ul.classList.add('megamenu-links');
      }
    });

    if (trigger) trigger.setAttribute('aria-haspopup', 'true');

    // Mobile accordion: a dedicated chevron toggle expands the sub-panel inline
    // (siblings stay visible, panel pushes content down) while the text link
    // still navigates. Matches the source's mobile accordion (button.desk-drop-
    // arrow with aria-expanded toggling an inline .dropdown-menu).
    const chevron = makeChevronToggle(trigger ? trigger.textContent.trim() : '');
    const toggleAccordion = () => {
      const open = li.getAttribute('aria-expanded') === 'true';
      // Single-open accordion: collapse siblings before expanding this one.
      collapseAllPanels(navBar);
      li.setAttribute('aria-expanded', open ? 'false' : 'true');
      chevron.setAttribute('aria-expanded', open ? 'false' : 'true');
    };
    chevron.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleAccordion();
    });
    // insert chevron right after the trigger link
    if (trigger) trigger.after(chevron);
    else li.prepend(chevron);

    // On mobile the source suppresses the trigger link's navigation and instead
    // expands the accordion when the text row is tapped (same as the chevron).
    // On desktop the link still navigates and hover drives the megamenu.
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        if (!isDesktop.matches) {
          e.preventDefault();
          e.stopPropagation();
          toggleAccordion();
        }
      });
    }

    // Second-level items with children (depth 2) also get a chevron + slide.
    panel.querySelectorAll(':scope > ul.megamenu-links > li').forEach((subLi) => {
      const subList = subLi.querySelector(':scope > ul');
      if (!subList) return;
      subLi.classList.add('has-subpanel');
      subLi.setAttribute('aria-expanded', 'false');
      const subLink = subLi.querySelector(':scope > a');
      const subChevron = makeChevronToggle(subLink ? subLink.textContent.trim() : '');
      subChevron.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const openSub = subLi.getAttribute('aria-expanded') === 'true';
        subLi.setAttribute('aria-expanded', openSub ? 'false' : 'true');
        subChevron.setAttribute('aria-expanded', openSub ? 'false' : 'true');
      });
      if (subLink) subLink.after(subChevron);
    });

    // Hover opens on desktop
    li.addEventListener('mouseenter', () => {
      if (isDesktop.matches) {
        collapseAllPanels(navBar, li);
        li.setAttribute('aria-expanded', 'true');
      }
    });
    li.addEventListener('mouseleave', () => {
      if (isDesktop.matches) li.setAttribute('aria-expanded', 'false');
    });

    // Desktop click still lets the trigger link navigate; the chevron drives
    // expansion on mobile. On desktop, clicking the trigger navigates via href.
  });
}

/**
 * Build a search control from copy present in the nav fragment. The fragment
 * only carries a plain "Search" link; the actual form/input is created here.
 * @param {Element} sourceEl element in the fragment representing search
 * @returns {Element} the search control
 */
function buildSearchControl(sourceEl) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-search';

  const form = document.createElement('form');
  form.setAttribute('role', 'search');
  form.action = '/search';

  const label = document.createElement('label');
  label.className = 'nav-search-label';
  label.setAttribute('for', 'nav-search-input');
  label.textContent = 'Search';

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'nav-search-input';
  input.name = 'q';
  input.placeholder = 'What are you looking for today?';
  input.setAttribute('aria-label', 'Search');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'nav-search-submit';
  button.setAttribute('aria-label', 'Search');

  form.append(label, input, button);
  wrapper.append(form);

  if (sourceEl) sourceEl.remove();
  return wrapper;
}

/**
 * Turn a flat list of links from the fragment into a CTA/utility group. Marks
 * the last item(s) as buttons so they can be styled as primary actions.
 * @param {Element} listEl the <ul> of utility/CTA links
 */
function decorateActionGroup(listEl) {
  listEl.classList.add('nav-actions');
  const links = listEl.querySelectorAll('a');
  links.forEach((a) => {
    const text = a.textContent.trim().toLowerCase();
    if (text.includes('open digital') || text === 'login') {
      a.classList.add('nav-cta');
    }
  });
}

/**
 * Build a language/locale toggle from the fragment's locale links.
 * @param {Element} listEl the <ul> of language links
 */
function decorateLocaleSelector(listEl) {
  listEl.classList.add('nav-locale');
  const first = listEl.querySelector('li');
  if (first) first.classList.add('is-current');
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await fetchNavFragment(navPath);

  block.textContent = '';
  // Temporary container to hold the fragment sections while we decorate them.
  const holder = document.createElement('div');
  if (fragment) {
    const { body } = fragment;
    while (body.firstElementChild) holder.append(body.firstElementChild);
  }

  // Resolve relative image paths (logo, megamenu thumbnails) against /content
  holder.querySelectorAll('img').forEach(resolveImagePath);

  // Section roles: 0 = brand + audience tabs, 1 = product megamenu, 2 = utility
  const sections = Array.from(holder.children);
  const brandRow = sections[0];
  const productRow = sections[1];
  const utilityRow = sections[2];

  if (brandRow) {
    brandRow.classList.add('nav-brand-row');
    const brandLink = brandRow.querySelector('p a');
    if (brandLink) {
      brandLink.closest('p').classList.add('nav-brand');
      // Some content sources emit the logo link without its image (e.g. a
      // link-wrapped image collapsed during JCR conversion). Guarantee the
      // brand logo renders by inserting it when absent.
      if (!brandLink.querySelector('img')) {
        const logo = document.createElement('img');
        logo.src = '/icons/logo.svg';
        logo.alt = 'Axis Bank Logo';
        logo.width = 122;
        logo.height = 40;
        brandLink.append(logo);
      }
    }
    const audienceList = brandRow.querySelector('ul');
    if (audienceList) audienceList.classList.add('nav-audience');
  }

  if (productRow) {
    productRow.classList.add('nav-sections', 'nav-products');
    decorateDropdownBar(productRow);
  }

  if (utilityRow) {
    utilityRow.classList.add('nav-utility');
    const lists = utilityRow.querySelectorAll(':scope > ul');
    if (lists[0]) decorateLocaleSelector(lists[0]);
    if (lists[1]) decorateActionGroup(lists[1]);
    const searchEl = utilityRow.querySelector('p');
    const search = buildSearchControl(searchEl);
    // place the search control at the head of the utility row
    utilityRow.prepend(search);
  }

  // Build two visual rows that mirror the source header structure:
  //   row 0 (~125px) = brand + audience bar stacked with the search/CTA sub-row
  //   row 1 (~40px)  = product megamenu bar (semantic nav landmark)
  const rowTop = document.createElement('div');
  rowTop.className = 'header-row header-row-top';
  if (brandRow) rowTop.append(brandRow);
  if (utilityRow) rowTop.append(utilityRow);

  const rowBottom = document.createElement('nav');
  rowBottom.id = 'nav';
  rowBottom.className = 'header-row header-row-bottom';
  rowBottom.setAttribute('aria-label', 'Main navigation');
  if (productRow) rowBottom.append(productRow);

  // hamburger for mobile (present at all widths, hidden on desktop via CSS)
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
    const expanded = rowBottom.getAttribute('aria-expanded') === 'true';
    rowBottom.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    document.body.style.overflowY = expanded ? '' : 'hidden';
    hamburger.classList.toggle('open', !expanded);
    const btn = hamburger.querySelector('button');
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    btn.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    // Collapse any expanded accordion section when closing the drawer.
    if (expanded && productRow) {
      collapseAllPanels(productRow);
    }
  });
  rowTop.prepend(hamburger);
  rowBottom.setAttribute('aria-expanded', 'false');

  // Close open panels when clicking outside the header
  document.addEventListener('click', (e) => {
    const headerEl = block.closest('header');
    if (headerEl && !headerEl.contains(e.target) && productRow) collapseAllPanels(productRow);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && productRow) collapseAllPanels(productRow);
  });

  // Reset state cleanly when crossing the desktop/mobile breakpoint so a layout
  // built for one width does not leak into the other (no page refresh needed).
  isDesktop.addEventListener('change', () => {
    // Close every desktop dropdown and mobile accordion section.
    if (productRow) {
      collapseAllPanels(productRow);
      productRow.querySelectorAll('.has-subpanel[aria-expanded="true"]').forEach((li) => {
        li.setAttribute('aria-expanded', 'false');
      });
    }
    // Close the mobile drawer + restore body scroll + reset hamburger to ☰.
    rowBottom.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
    hamburger.classList.remove('open');
    const hb = hamburger.querySelector('button');
    if (hb) {
      hb.setAttribute('aria-expanded', 'false');
      hb.setAttribute('aria-label', 'Open navigation');
    }
    // When returning to desktop, hover handlers are always live (guarded by
    // isDesktop.matches), so no re-init is needed.
  });

  // Promote the two rows to be direct children of <header> so the structure
  // mirrors the source header (header > row0, header > row1). This exposes
  // exactly two top-level row elements for structural/CSS parity.
  const headerEl = block.closest('header');
  if (headerEl) {
    // Keep a `header` class hook on the landmark so tooling that scopes queries
    // to `.header` still resolves after we replace the original block div with
    // the two parity rows. Does not affect CSS (which targets the `header` tag).
    headerEl.classList.add('header');
    headerEl.replaceChildren(rowTop, rowBottom);
  } else {
    block.append(rowTop, rowBottom);
  }
}
