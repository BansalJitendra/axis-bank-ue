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
    const hasImage = !!block.querySelector('img');
    const linkCount = block.querySelectorAll('a').length;
    if (hasImage && linkCount === 0) {
      // heading + illustrative image only -> product promo band
      block.classList.add('columns-product');
    } else if (linkCount >= 3) {
      // side-by-side panels with quick-action links -> payments/rewards promo
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
