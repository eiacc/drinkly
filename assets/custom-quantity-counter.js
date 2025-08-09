class CustomQuantityCounter extends HTMLElement {
  constructor() {
    super();
    this.changeEvent = new Event("change", { bubbles: true });
    this.gallery_section = document.querySelector("gallery-section") || null;
  }

  connectedCallback() {
    this.counterEl = this.querySelector(".js-counter-quantity");
    this.increaseBtn = this.querySelector(".js-counter-increase");
    this.decreaseBtn = this.querySelector(".js-counter-decrease");

    this.min = parseInt(this.counterEl.min) || 1;
    this.max = parseInt(this.counterEl.max) || 999;

    this.increaseBtn.addEventListener("click", this.onIncrease.bind(this));
    this.decreaseBtn.addEventListener("click", this.onDecrease.bind(this));
  }

  onIncrease(e) {    
    const currentValue = parseInt(this.counterEl.value);
    const imageId = this.dataset.featuredImageId ? this.dataset.featuredImageId : null;
    if (currentValue < this.max) {
      this.updateValue(currentValue + 1, imageId);
    }
  }

  onDecrease(e) {
    const currentValue = parseInt(this.counterEl.value);
    if (this.dataset.cart) this.min = 0;
    if (currentValue > this.min) {
      this.updateValue(currentValue - 1);
    } else {
      this.updateValue(0);
    }
  }

  updateValue(value, switchImage = null) {
    this.counterEl.value = value;

    this.counterEl.dispatchEvent(new Event("input", { bubbles: true }));
    this.counterEl.dispatchEvent(this.changeEvent);
  
    if (this.gallery_section && switchImage) {
      this.gallery_section.setActiveMedia(switchImage, true);
    }
  }
}

window.customElements.define("custom-quantity-counter", CustomQuantityCounter);