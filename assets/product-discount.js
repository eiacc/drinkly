if (!customElements.get('product-discount')) {
  class ProductDiscount extends HTMLElement {
    constructor() {
      super();
    }
  }

  customElements.define('product-discount', ProductDiscount);
}