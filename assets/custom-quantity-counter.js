class CustomQuantityCounter extends HTMLElement {
  constructor() {
    super();
    this.changeEvent = new Event("change", { bubbles: true });
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

  onIncrease() {    
    const currentValue = parseInt(this.counterEl.value);
    if (currentValue < this.max) {
      this.updateValue(currentValue + 1);
    }
  }

  onDecrease() {
    const currentValue = parseInt(this.counterEl.value);
    if (this.dataset.cart) this.min = 0;
    if (currentValue > this.min) {
      this.updateValue(currentValue - 1);
    } else {
      this.updateValue(0);
    }
  }

  updateValue(value) {
    this.counterEl.value = value;

    this.counterEl.dispatchEvent(new Event("input", { bubbles: true }));
    this.counterEl.dispatchEvent(this.changeEvent);
  }
}

window.customElements.define("custom-quantity-counter", CustomQuantityCounter);