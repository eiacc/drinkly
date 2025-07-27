console.log('custom-sticky-buy-button.js');
if (!customElements.get('custom-sticky-buy-button')) {
  class CustomStickyBuyButton extends HTMLElement {
    constructor() {
      super();
    }
  }

  customElements.define('custom-sticky-buy-button', CustomStickyBuyButton);
}