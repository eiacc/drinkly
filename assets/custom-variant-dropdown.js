if (!customElements.get("custom-variant-dropdown")) {
  customElements.define(
    "custom-variant-dropdown",
    class CustomVariantDropdown extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        this._init();
      }
    },
  );
}
