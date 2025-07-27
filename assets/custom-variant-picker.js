const customVariantPickerSelectedVariants = [];

if (!customElements.get("custom-variant-picker")) {
  customElements.define(
    "custom-variant-picker",
    class CustomVariantPicker extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}