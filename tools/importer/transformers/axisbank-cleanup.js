/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Axis Bank site-wide cleanup.
 *
 * Removes non-authorable site chrome, overlays, and tracking noise so the
 * imported content contains only page-level authorable content.
 *
 * ALL selectors below were verified against migration-work/cleaned.html for
 * https://www.axis.bank.in/ — none are guessed.
 *
 * Verified DOM landmarks (cleaned.html):
 *  - <header class="header">                            (site header, out of scope)
 *  - <main> <div class="pageWrapper home"> ...           (authorable content root)
 *  - <section class="breadcrumb-wrap"> <div class="container"> (empty breadcrumb container, first child of pageWrapper)
 *  - <div id="chatbotUI">                                (chat widget, inside main after content)
 *  - <div id="scrollToTopBtn" class="scrollToTopBtn">    (scroll-to-top button, inside main)
 *  - <iframe title="Adobe ID Syncing iFrame" ...>        (demdex/twitter tracking iframes)
 *  - <footer> ... </footer>                              (site footer, out of scope)
 *  - <div class="copyright-wrap">                        (trailing copyright bar, after footer)
 *  - class="...privy-cmp-AE1VSVI8T5"                     (cookie-consent CMP banner, dynamic suffix)
 *  - class="notification-overlay"                        (notification prompt overlay)
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / consent banners / floating widgets that would otherwise
    // interfere with block parsing. Removed early so they never leak into
    // block cells. Dynamic privy-cmp class suffix -> attribute substring match.
    WebImporter.DOMUtils.remove(element, [
      // Cookie-consent CMP banner (privy-cmp*). Verified: banner-container-privy-cmp-AE1VSVI8T5
      '[class*="privy-cmp"]',
      '[class*="consent-button-privy-cmp"]',
      '[class*="banner-container-privy-cmp"]',
      // Notification prompt / "Never miss what matters" overlay. Verified: notification-overlay
      '.notification-overlay',
      // Floating chat widget. Verified: id="chatbotUI"
      '#chatbotUI',
      // Scroll-to-top button. Verified: id="scrollToTopBtn"
      '#scrollToTopBtn',
      '.scrollToTopBtn',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome. Header, footer, and the trailing copyright
    // bar are handled by navigation/footer instrumentation and must not
    // duplicate into the imported page body.
    WebImporter.DOMUtils.remove(element, [
      // Site header. Verified: <header class="header">
      'header',
      'header.header',
      // Site footer. Verified: <footer>
      'footer',
      // Trailing copyright bar. Verified: <div class="copyright-wrap">
      '.copyright-wrap',
      // Empty breadcrumb container (no breadcrumb items). Verified: section.breadcrumb-wrap
      'section.breadcrumb-wrap',
      '.breadcrumb-wrap',
      // Tracking / social iframes (demdex ID sync, Twitter widgets). Verified: 4 <iframe> in DOM
      'iframe',
      // Safe non-content elements.
      'noscript',
      'source',
      'link',
    ]);

    // Strip animation / tracking attributes that are not authorable.
    // Verified in DOM: data-aos* on <body> and section wrappers.
    element.querySelectorAll('[data-aos], [data-aos-duration], [data-aos-delay], [data-aos-easing], [onclick]').forEach((el) => {
      el.removeAttribute('data-aos');
      el.removeAttribute('data-aos-duration');
      el.removeAttribute('data-aos-delay');
      el.removeAttribute('data-aos-easing');
      el.removeAttribute('onclick');
    });
  }
}
