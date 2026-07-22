/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselBannerParser from './parsers/carousel-banner.js';
import tabsProductParser from './parsers/tabs-product.js';
import tableRatesParser from './parsers/table-rates.js';
import columnsProductParser from './parsers/columns-product.js';
import columnsPromoParser from './parsers/columns-promo.js';
import tabsCalculatorParser from './parsers/tabs-calculator.js';
import cardsFeaturesParser from './parsers/cards-features.js';
import carouselGalleryParser from './parsers/carousel-gallery.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/axisbank-cleanup.js';
import sectionsTransformer from './transformers/axisbank-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-banner': carouselBannerParser,
  'tabs-product': tabsProductParser,
  'table-rates': tableRatesParser,
  'columns-product': columnsProductParser,
  'columns-promo': columnsPromoParser,
  'tabs-calculator': tabsCalculatorParser,
  'cards-features': cardsFeaturesParser,
  'carousel-gallery': carouselGalleryParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Axis Bank homepage: header navigation, hero carousel banner with tabbed product finder, promotional card grids, EMI calculator tabs, digital banking showcase, and footer with link columns.',
  urls: [
    'https://www.axis.bank.in/',
  ],
  blocks: [
    { name: 'carousel-banner', instances: ['#hm-banner'] },
    { name: 'tabs-product', instances: ['#hm-banner div.banner-tab-wrap.home-banner-tab-wrap'] },
    { name: 'table-rates', instances: ['body > main > div.pageWrapper.home > div:nth-of-type(2)'] },
    {
      name: 'columns-product',
      instances: [
        'section.open-account',
        'section.open-creditcard',
        'section.open-loans:not(.open-deposit)',
        'section.open-investments',
        'section.open-deposit',
      ],
    },
    { name: 'columns-promo', instances: ['body > main > div.pageWrapper.home > div:nth-of-type(11)'] },
    { name: 'tabs-calculator', instances: ['#emiCalcTabs'] },
    { name: 'cards-features', instances: ['#digital-baking-sec div.digi-wrapper'] },
    { name: 'carousel-gallery', instances: ['body > main > div.pageWrapper.home > div:nth-of-type(17)'] },
  ],
  sections: [
    { id: 'product-savings', name: 'Product Savings', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(6)', style: 'light', blocks: ['columns-product'], defaultContent: ['body > main > div.pageWrapper.home > div:nth-of-type(6)'] },
    { id: 'product-creditcard', name: 'Product Credit Card', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(7)', style: 'accent', blocks: ['columns-product'], defaultContent: [] },
    { id: 'product-loans', name: 'Product Loans', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(8)', style: 'accent', blocks: ['columns-product'], defaultContent: [] },
    { id: 'product-investments', name: 'Product Investments', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(9)', style: 'accent', blocks: ['columns-product'], defaultContent: [] },
    { id: 'product-deposits', name: 'Product Deposits', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(10)', style: 'accent', blocks: ['columns-product'], defaultContent: [] },
    { id: 'payments-rewards', name: 'Payments and Rewards', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(11)', style: 'light', blocks: ['columns-promo'], defaultContent: [] },
    { id: 'calculators', name: 'Calculators', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(12)', style: 'light', blocks: ['tabs-calculator'], defaultContent: ['body > main > div.pageWrapper.home > div:nth-of-type(12) h2.section-heading'] },
    { id: 'digital-banking', name: 'Digital Banking', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(13)', style: 'dark', blocks: ['cards-features'], defaultContent: ['#digital-baking-sec div.section-heading'] },
    { id: 'csr-progress', name: 'CSR Progress', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(14)', style: 'light', blocks: [], defaultContent: ['body > main > div.pageWrapper.home > div:nth-of-type(14)'] },
    { id: 'safe-banking', name: 'Safe Banking', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(15)', style: 'light', blocks: [], defaultContent: ['body > main > div.pageWrapper.home > div:nth-of-type(15)'] },
    { id: 'financial-literacy-week', name: 'Financial Literacy Week', selector: 'body > main > div.pageWrapper.home > div:nth-of-type(17)', style: 'light', blocks: ['carousel-gallery'], defaultContent: ['body > main > div.pageWrapper.home > div:nth-of-type(17) h2'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, sections after (adds <hr> + section-metadata)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced/detached by an earlier parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized document path. Root ("/") maps to "/index" (EDS homepage convention);
    //    an empty path would otherwise trigger path.resolve -> process.cwd() in the browser.
    const rawPath = new URL(params.originalURL).pathname.replace(/\.html$/, '').replace(/\/$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath || '/index');

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
