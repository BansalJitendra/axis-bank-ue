/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel-banner.js
  function parse(element, { document: document2 }) {
    const titleEl = element.querySelector("h2.banner-title, .banner-title, h1, h2");
    const subtitle = element.querySelector(".banner-subtitle, p");
    const ctaLinks = Array.from(
      element.querySelectorAll(".banner-btn-wrap a[href], .banner-btn-wrap .btn")
    );
    const bandImage = element.querySelector('.banner-curve img, img[class*="banner"], img');
    const sliderPhrases = Array.from(
      element.querySelectorAll(".slider-text-wrapper .slider-text, .slider-text")
    ).map((s) => (s.textContent || "").trim()).filter((t) => t.length);
    const uniquePhrases = [...new Set(sliderPhrases)];
    let baseHeadline = "";
    if (titleEl) {
      const clone = titleEl.cloneNode(true);
      const wrapper = clone.querySelector(".slider-text-wrapper");
      if (wrapper) wrapper.remove();
      baseHeadline = (clone.textContent || "").replace(/\s+/g, " ").trim();
    }
    const cells = [];
    const buildContentCell = (phrase) => {
      const cell = [];
      const heading = document2.createElement("h2");
      heading.textContent = phrase ? `${baseHeadline} ${phrase}`.trim() : baseHeadline;
      if (heading.textContent) cell.push(heading);
      if (subtitle) cell.push(subtitle.cloneNode(true));
      ctaLinks.forEach((link) => {
        if (link.tagName === "A" && link.getAttribute("href")) {
          cell.push(link.cloneNode(true));
        } else if ((link.textContent || "").trim()) {
          const p = document2.createElement("p");
          p.textContent = (link.textContent || "").trim();
          cell.push(p);
        }
      });
      return cell;
    };
    const slides = uniquePhrases.length ? uniquePhrases : [""];
    slides.forEach((phrase, idx) => {
      const imageCell = document2.createDocumentFragment();
      if (bandImage) {
        imageCell.appendChild(document2.createComment(" field:media_image "));
        imageCell.appendChild(idx === 0 ? bandImage : bandImage.cloneNode(true));
      }
      const contentFrag = document2.createDocumentFragment();
      contentFrag.appendChild(document2.createComment(" field:content_text "));
      buildContentCell(phrase).forEach((n) => contentFrag.appendChild(n));
      cells.push([imageCell, contentFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "carousel-banner",
      cells
    });
    const tabWrap = element.querySelector(".banner-tab-wrap.home-banner-tab-wrap");
    if (tabWrap && element.parentNode) {
      element.parentNode.insertBefore(block, element);
      [".banner-title", ".banner-subtitle", ".banner-btn-wrap", "ul.banner-tabs", ".banner-curve"].forEach((sel) => element.querySelectorAll(sel).forEach((n) => n.remove()));
    } else {
      element.replaceWith(block);
    }
  }

  // tools/importer/parsers/tabs-product.js
  function parse2(element, { document: document2 }) {
    const panels = Array.from(
      element.querySelectorAll(':scope > .banner-tab-card, :scope > [id^="banner"]')
    );
    const labelLinks = Array.from(
      document2.querySelectorAll(".banner-tabs .banner-tab-link a[data-target], .banner-tab-link a[data-target]")
    );
    const labelById = {};
    labelLinks.forEach((a) => {
      const target = a.getAttribute("data-target");
      if (target) labelById[target] = (a.textContent || "").trim();
    });
    const cells = [];
    panels.forEach((panel) => {
      const label = labelById[panel.id] || (panel.getAttribute("aria-label") || "").trim();
      const labelFrag = document2.createDocumentFragment();
      labelFrag.appendChild(document2.createComment(" field:title "));
      const labelCell = document2.createElement("p");
      labelCell.textContent = label || panel.id || "Tab";
      labelFrag.appendChild(labelCell);
      const contentFrag = document2.createDocumentFragment();
      contentFrag.appendChild(document2.createComment(" field:content_richtext "));
      const contentEls = Array.from(
        panel.querySelectorAll(
          ".card-most-searched, .searchedCards a[href], .most-searched > a.btn, a.btn-primary"
        )
      );
      if (contentEls.length) {
        contentEls.forEach((node) => contentFrag.appendChild(node.cloneNode(true)));
      } else {
        Array.from(panel.childNodes).forEach((n) => contentFrag.appendChild(n.cloneNode(true)));
      }
      cells.push([labelFrag, contentFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "tabs-product",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-rates.js
  function parse3(element, { document: document2 }) {
    const cells = [];
    const NBSP = / /g;
    const clean = (s) => (s || "").replace(NBSP, " ").replace(/\s+/g, " ").trim();
    const makeCell = (text, fieldName) => {
      const value = clean(text);
      const frag = document2.createDocumentFragment();
      if (!value) return frag;
      frag.appendChild(document2.createComment(` field:${fieldName} `));
      const p = document2.createElement("p");
      p.textContent = value;
      frag.appendChild(p);
      return frag;
    };
    let scopeRoot = element;
    if (!element.querySelector(".heading3")) {
      scopeRoot = document2.querySelector(".interest-rates-popup, .home-side-bar") || element;
    }
    const rateNodes = Array.from(scopeRoot.querySelectorAll(".heading3"));
    rateNodes.forEach((rateEl) => {
      const rate = clean(rateEl.textContent);
      if (!rate) return;
      let group = rateEl.closest(".data-box");
      let scope = group;
      for (let i = 0; i < 4 && scope && scope.parentElement; i += 1) {
        if (scope.querySelector(".body-text, .body-text2")) break;
        scope = scope.parentElement;
      }
      if (!scope) scope = group || rateEl.parentElement;
      const tier = clean(
        (scope.querySelector(".heading4") || {}).textContent || ""
      );
      let customer = "";
      let tenure = "";
      const bt = scope.querySelector(".body-text");
      const bt2 = scope.querySelector(".body-text2");
      if (bt) {
        const leafSpans = Array.from(bt.querySelectorAll("span")).filter(
          (s) => !s.querySelector("span")
        );
        const texts = leafSpans.map((s) => clean(s.textContent)).filter(Boolean);
        customer = texts.find((t) => !t.startsWith("(")) || "";
        tenure = texts.find((t) => t.startsWith("(")) || "";
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
      const gridWrap = rateEl.closest(".left-grid, .right-grid");
      const section = gridWrap ? clean((gridWrap.querySelector(".heading2") || {}).textContent || "") : "";
      cells.push([
        makeCell(rate, "column1text"),
        makeCell(tier || section, "column2text"),
        makeCell(customer, "column3text"),
        makeCell(tenure, "column4text")
      ]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "table-rates",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-product.js
  function parse4(element, { document: document2 }) {
    const heading = element.querySelector(".card-heading, h2, h3");
    const imageLinks = Array.from(element.querySelectorAll("a[href]")).filter(
      (a) => a.querySelector("img, picture")
    );
    const textLinks = Array.from(
      element.querySelectorAll(
        ".item a[href], a.cardwrap, .card-most-searched, .know-more-item a[href], .card-title"
      )
    ).filter((a) => a.tagName === "A" && a.getAttribute("href") && !a.querySelector("img, picture"));
    const bareImages = Array.from(element.querySelectorAll("picture, img")).filter(
      (img) => !img.closest("a")
    );
    const leftCell = document2.createDocumentFragment();
    if (heading) leftCell.appendChild(heading.cloneNode(true));
    const seenLeft = /* @__PURE__ */ new Set();
    textLinks.forEach((a) => {
      const href = a.getAttribute("href");
      if (seenLeft.has(href)) return;
      seenLeft.add(href);
      const title = a.querySelector(".card-title, .card-content, p");
      const link = document2.createElement("a");
      link.setAttribute("href", href);
      link.textContent = (title ? title.textContent : a.textContent || "").trim();
      if (!link.textContent) return;
      const p = document2.createElement("p");
      p.appendChild(link);
      leftCell.appendChild(p);
    });
    const rightCell = document2.createDocumentFragment();
    const seenRight = /* @__PURE__ */ new Set();
    imageLinks.forEach((a) => {
      const img = a.querySelector("img");
      const href = a.getAttribute("href");
      const key = img && img.getAttribute("src") || href;
      if (seenRight.has(key)) return;
      seenRight.add(key);
      const link = document2.createElement("a");
      if (href) link.setAttribute("href", href);
      const picture = a.querySelector("picture") || img;
      link.appendChild(picture.cloneNode(true));
      const p = document2.createElement("p");
      p.appendChild(link);
      rightCell.appendChild(p);
    });
    bareImages.forEach((img) => {
      var _a;
      const key = img.tagName === "IMG" ? img.getAttribute("src") : (_a = img.querySelector("img")) == null ? void 0 : _a.getAttribute("src");
      if (key && seenRight.has(key)) return;
      if (key) seenRight.add(key);
      rightCell.appendChild(img.cloneNode(true));
    });
    const hasLeft = leftCell.childNodes.length > 0;
    const hasRight = rightCell.childNodes.length > 0;
    if (!hasLeft && !hasRight) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = hasLeft && hasRight ? [leftCell, rightCell] : [hasLeft ? leftCell : rightCell];
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "columns-product",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse5(element, { document: document2 }) {
    let root = element;
    if (!root.querySelector(".effortless, .spending, .payments-wrapper")) {
      root = document2.querySelector("#payments, .payments, .payments-wrapper") || element;
    }
    const panels = Array.from(
      root.querySelectorAll(".effortless, .spending")
    );
    const panelEls = panels.length ? panels : Array.from(root.querySelectorAll(".payments-wrapper > div")).slice(0, 2);
    const buildPanel = (panel) => {
      const cell = document2.createDocumentFragment();
      const heading = panel.querySelector(".paymt-title, h2, h3");
      if (heading) cell.appendChild(heading.cloneNode(true));
      const desc = panel.querySelector(".paymt-desc, p:not(.plans-link p)");
      if (desc && !desc.closest(".plans-link")) cell.appendChild(desc.cloneNode(true));
      const quickLinks = Array.from(panel.querySelectorAll(".plans-link, .plans-item > a[href]"));
      const seen = /* @__PURE__ */ new Set();
      quickLinks.forEach((a) => {
        const href = a.getAttribute("href");
        if (!href || seen.has(href)) return;
        seen.add(href);
        const label = a.querySelector("p");
        const link = document2.createElement("a");
        link.setAttribute("href", href);
        link.textContent = (label ? label.textContent : a.textContent || "").trim();
        if (!link.textContent) return;
        const p = document2.createElement("p");
        p.appendChild(link);
        cell.appendChild(p);
      });
      const cta = panel.querySelector(".btn-explore, a.link-btn");
      if (cta && cta.getAttribute("href") && !seen.has(cta.getAttribute("href"))) {
        cell.appendChild(cta.cloneNode(true));
      }
      const imgSeen = /* @__PURE__ */ new Set();
      Array.from(panel.querySelectorAll("a.card-item[href]")).forEach((a) => {
        const img = a.querySelector("img");
        const key = img && img.getAttribute("src");
        if (!img || key && imgSeen.has(key)) return;
        if (key) imgSeen.add(key);
        const link = document2.createElement("a");
        link.setAttribute("href", a.getAttribute("href"));
        link.appendChild((a.querySelector("picture") || img).cloneNode(true));
        const p = document2.createElement("p");
        p.appendChild(link);
        cell.appendChild(p);
      });
      Array.from(panel.querySelectorAll("picture, img")).forEach((node) => {
        if (node.closest("a")) return;
        const img = node.tagName === "IMG" ? node : node.querySelector("img");
        const key = img && img.getAttribute("src");
        if (key && imgSeen.has(key)) return;
        if (key) imgSeen.add(key);
        cell.appendChild(node.cloneNode(true));
      });
      return cell;
    };
    const cellsRow = panelEls.map((p) => buildPanel(p)).filter((frag) => frag.childNodes.length);
    if (!cellsRow.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [cellsRow];
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "columns-promo",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-calculator.js
  function parse6(element, { document: document2 }) {
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    const tabLinks = Array.from(
      element.querySelectorAll(
        '.calcTabs-heading--tabs .tab-link a, .line-tabs_card .tab-link a, .tab-link a, [role="tab"] a, [role="tab"]'
      )
    );
    const labelById = {};
    tabLinks.forEach((a) => {
      const ids = [
        (a.id || "").replace(/-tab$/, ""),
        (a.getAttribute("href") || "").replace(/^#/, ""),
        a.getAttribute("aria-controls") || "",
        a.getAttribute("data-target") || ""
      ].filter(Boolean);
      const text = clean(a.textContent);
      ids.forEach((id) => {
        if (id && text) labelById[id] = text;
      });
    });
    const allPanels = Array.from(
      element.querySelectorAll('.line-tab-content, [id][class*="tab-content"]')
    );
    const panels = allPanels.filter(
      (p) => !allPanels.some((other) => other !== p && other.contains(p))
    );
    const cells = [];
    panels.forEach((panel, idx) => {
      const label = labelById[panel.id] || clean((tabLinks[idx] || {}).textContent || "") || panel.id || "Calculator";
      const labelFrag = document2.createDocumentFragment();
      labelFrag.appendChild(document2.createComment(" field:title "));
      const labelCell = document2.createElement("p");
      labelCell.textContent = label;
      labelFrag.appendChild(labelCell);
      const contentFrag = document2.createDocumentFragment();
      contentFrag.appendChild(document2.createComment(" field:content_richtext "));
      const nestedTabs = panel.querySelector('.calcTabs, [id="emiCalcTabs"]');
      if (nestedTabs) {
        const intro = panel.querySelector("p, .section-heading");
        if (intro && !intro.closest(".calcTabs")) {
          const p = document2.createElement("p");
          p.textContent = clean(intro.textContent);
          if (p.textContent) contentFrag.appendChild(p);
        }
        Array.from(
          nestedTabs.querySelectorAll('.tab-link a, [role="tab"] a, [role="tab"]')
        ).forEach((a) => {
          const txt = clean(a.textContent);
          if (!txt) return;
          const p = document2.createElement("p");
          p.textContent = txt;
          contentFrag.appendChild(p);
        });
        cells.push([labelFrag, contentFrag]);
        return;
      }
      Array.from(panel.querySelectorAll(".range-main-wrap, .inner-form-wrap")).forEach((field) => {
        const fieldLabel = clean((field.querySelector(".form-control label") || {}).textContent || "");
        const min = clean((field.querySelector(".number-wrap .min-amt") || {}).textContent || "");
        const max = clean((field.querySelector(".number-wrap .max-amt") || {}).textContent || "");
        if (!fieldLabel && !min && !max) return;
        const p = document2.createElement("p");
        const range = min || max ? ` (${[min, max].filter(Boolean).join(" \u2013 ")})` : "";
        p.textContent = `${fieldLabel}${range}`.trim();
        contentFrag.appendChild(p);
      });
      const totalText = panel.querySelector(".total-text, .totalamt-text");
      if (totalText) {
        const p = document2.createElement("p");
        p.textContent = clean(totalText.textContent);
        contentFrag.appendChild(p);
      }
      const cta = panel.querySelector(".sec-input-total a[href], a.btn-primary[href]");
      if (cta) {
        const link = document2.createElement("a");
        link.setAttribute("href", cta.getAttribute("href"));
        link.textContent = clean(cta.textContent);
        const p = document2.createElement("p");
        p.appendChild(link);
        contentFrag.appendChild(p);
      }
      if (contentFrag.childNodes.length <= 1) {
        const p = document2.createElement("p");
        p.textContent = clean(panel.textContent);
        if (p.textContent) contentFrag.appendChild(p);
      }
      cells.push([labelFrag, contentFrag]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "tabs-calculator",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-features.js
  function parse7(element, { document: document2 }) {
    const cards = Array.from(element.querySelectorAll(".digi-card, .digi-item .digi-card"));
    const cells = [];
    cards.forEach((card) => {
      const icon = card.querySelector('.icon, span[class*="icon"]');
      const title = card.querySelector(".digi-card-title, p");
      const imageCell = document2.createDocumentFragment();
      imageCell.appendChild(document2.createComment(" field:image "));
      if (icon) imageCell.appendChild(icon.cloneNode(true));
      const textCell = document2.createDocumentFragment();
      textCell.appendChild(document2.createComment(" field:text "));
      if (title) {
        const p = document2.createElement("p");
        p.textContent = (title.textContent || "").trim();
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "cards-features",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-gallery.js
  function parse8(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".owl-item:not(.cloned) .item, .item")).filter(
      (item) => !item.closest(".cloned") && item.querySelector("img, picture")
    );
    if (!slides.length) {
      slides = Array.from(element.querySelectorAll("picture, img")).map((n) => n.closest(".item") || n);
    }
    const resolveSrc = (img) => {
      const lazy = img.getAttribute("data-src") || img.getAttribute("data-lazy") || img.getAttribute("data-original");
      const current = img.getAttribute("src") || "";
      if (lazy && /^data:/.test(current)) return lazy;
      return current || lazy || "";
    };
    const cells = [];
    const seen = /* @__PURE__ */ new Set();
    slides.forEach((slide) => {
      const img = slide.tagName === "IMG" ? slide : slide.querySelector("img");
      if (!img) return;
      const src = resolveSrc(img);
      if (!src || seen.has(src)) return;
      seen.add(src);
      const picture = document2.createElement("img");
      picture.setAttribute("src", src);
      const alt = (img.getAttribute("alt") || "").trim();
      if (alt) picture.setAttribute("alt", alt);
      const imageCell = document2.createDocumentFragment();
      imageCell.appendChild(document2.createComment(" field:media_image "));
      imageCell.appendChild(picture);
      const textCell = document2.createDocumentFragment();
      cells.push([imageCell, textCell]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, {
      name: "carousel-gallery",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/transformers/axisbank-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Cookie-consent CMP banner (privy-cmp*). Verified: banner-container-privy-cmp-AE1VSVI8T5
        '[class*="privy-cmp"]',
        '[class*="consent-button-privy-cmp"]',
        '[class*="banner-container-privy-cmp"]',
        // Notification prompt / "Never miss what matters" overlay. Verified: notification-overlay
        ".notification-overlay",
        // Floating chat widget. Verified: id="chatbotUI"
        "#chatbotUI",
        // Scroll-to-top button. Verified: id="scrollToTopBtn"
        "#scrollToTopBtn",
        ".scrollToTopBtn"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Site header. Verified: <header class="header">
        "header",
        "header.header",
        // Site footer. Verified: <footer>
        "footer",
        // Trailing copyright bar. Verified: <div class="copyright-wrap">
        ".copyright-wrap",
        // Empty breadcrumb container (no breadcrumb items). Verified: section.breadcrumb-wrap
        "section.breadcrumb-wrap",
        ".breadcrumb-wrap",
        // Tracking / social iframes (demdex ID sync, Twitter widgets). Verified: 4 <iframe> in DOM
        "iframe",
        // Safe non-content elements.
        "noscript",
        "source",
        "link"
      ]);
      element.querySelectorAll("[data-aos], [data-aos-duration], [data-aos-delay], [data-aos-easing], [onclick]").forEach((el) => {
        el.removeAttribute("data-aos");
        el.removeAttribute("data-aos-duration");
        el.removeAttribute("data-aos-delay");
        el.removeAttribute("data-aos-easing");
        el.removeAttribute("onclick");
      });
    }
  }

  // tools/importer/transformers/axisbank-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const template = payload && payload.template;
    const sections = template && Array.isArray(template.sections) ? template.sections : [];
    if (sections.length < 2) return;
    const doc = element.ownerDocument || document;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section || !section.selector) continue;
      let target = element.querySelector(section.selector);
      if (!target) target = doc.querySelector(section.selector);
      if (!target) continue;
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(doc, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        if (target.parentNode) {
          target.parentNode.insertBefore(metaBlock, target.nextSibling);
        }
      }
      if (i > 0 && target.parentNode && target.previousElementSibling) {
        const hr = doc.createElement("hr");
        target.parentNode.insertBefore(hr, target);
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel-banner": parse,
    "tabs-product": parse2,
    "table-rates": parse3,
    "columns-product": parse4,
    "columns-promo": parse5,
    "tabs-calculator": parse6,
    "cards-features": parse7,
    "carousel-gallery": parse8
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Axis Bank homepage: header navigation, hero carousel banner with tabbed product finder, promotional card grids, EMI calculator tabs, digital banking showcase, and footer with link columns.",
    urls: [
      "https://www.axis.bank.in/"
    ],
    blocks: [
      { name: "carousel-banner", instances: ["#hm-banner"] },
      { name: "tabs-product", instances: ["#hm-banner div.banner-tab-wrap.home-banner-tab-wrap"] },
      { name: "table-rates", instances: ["body > main > div.pageWrapper.home > div:nth-of-type(2)"] },
      {
        name: "columns-product",
        instances: [
          "body > main > div.pageWrapper.home > div:nth-of-type(6)",
          "body > main > div.pageWrapper.home > div:nth-of-type(7)",
          "body > main > div.pageWrapper.home > div:nth-of-type(8)",
          "body > main > div.pageWrapper.home > div:nth-of-type(9)",
          "body > main > div.pageWrapper.home > div:nth-of-type(10)"
        ]
      },
      { name: "columns-promo", instances: ["body > main > div.pageWrapper.home > div:nth-of-type(11)"] },
      { name: "tabs-calculator", instances: ["#emiCalcTabs"] },
      { name: "cards-features", instances: ["#digital-baking-sec div.digi-wrapper"] },
      { name: "carousel-gallery", instances: ["body > main > div.pageWrapper.home > div:nth-of-type(17)"] }
    ],
    sections: [
      { id: "product-savings", name: "Product Savings", selector: "body > main > div.pageWrapper.home > div:nth-of-type(6)", style: "light", blocks: ["columns-product"], defaultContent: ["body > main > div.pageWrapper.home > div:nth-of-type(6)"] },
      { id: "product-creditcard", name: "Product Credit Card", selector: "body > main > div.pageWrapper.home > div:nth-of-type(7)", style: "accent", blocks: ["columns-product"], defaultContent: [] },
      { id: "product-loans", name: "Product Loans", selector: "body > main > div.pageWrapper.home > div:nth-of-type(8)", style: "accent", blocks: ["columns-product"], defaultContent: [] },
      { id: "product-investments", name: "Product Investments", selector: "body > main > div.pageWrapper.home > div:nth-of-type(9)", style: "accent", blocks: ["columns-product"], defaultContent: [] },
      { id: "product-deposits", name: "Product Deposits", selector: "body > main > div.pageWrapper.home > div:nth-of-type(10)", style: "accent", blocks: ["columns-product"], defaultContent: [] },
      { id: "payments-rewards", name: "Payments and Rewards", selector: "body > main > div.pageWrapper.home > div:nth-of-type(11)", style: "light", blocks: ["columns-promo"], defaultContent: [] },
      { id: "calculators", name: "Calculators", selector: "body > main > div.pageWrapper.home > div:nth-of-type(12)", style: "light", blocks: ["tabs-calculator"], defaultContent: ["body > main > div.pageWrapper.home > div:nth-of-type(12) h2.section-heading"] },
      { id: "digital-banking", name: "Digital Banking", selector: "body > main > div.pageWrapper.home > div:nth-of-type(13)", style: "dark", blocks: ["cards-features"], defaultContent: ["#digital-baking-sec div.section-heading"] },
      { id: "csr-progress", name: "CSR Progress", selector: "body > main > div.pageWrapper.home > div:nth-of-type(14)", style: "light", blocks: [], defaultContent: ["body > main > div.pageWrapper.home > div:nth-of-type(14)"] },
      { id: "safe-banking", name: "Safe Banking", selector: "body > main > div.pageWrapper.home > div:nth-of-type(15)", style: "light", blocks: [], defaultContent: ["body > main > div.pageWrapper.home > div:nth-of-type(15)"] },
      { id: "financial-literacy-week", name: "Financial Literacy Week", selector: "body > main > div.pageWrapper.home > div:nth-of-type(17)", style: "light", blocks: ["carousel-gallery"], defaultContent: ["body > main > div.pageWrapper.home > div:nth-of-type(17) h2"] }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\.html$/, "").replace(/\/$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath || "/index");
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
