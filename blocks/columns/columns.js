export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // Restore Axis promo variant classes when the authored content collapsed
  // to the base columns block (DA/JCR conversion drops the variant name).
  // Only classify unstyled 2-column blocks so we never override an explicit
  // variant already present on the block.
  if (cols.length === 2
    && !block.classList.contains('columns-product')
    && !block.classList.contains('columns-promo')) {
    // Product bands have a right-column <h3> sub-heading ("Choose from ...");
    // the payments/rewards promo has only <h2> panel headings and no <h3>.
    const hasSubheading = !!block.querySelector('h3');
    if (hasSubheading) {
      block.classList.add('columns-product');
    } else if (block.querySelectorAll('a').length >= 3) {
      block.classList.add('columns-promo');
    }
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
