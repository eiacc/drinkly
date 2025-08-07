if (!customElements.get('app-wrapper')) {
  class AppWrapper extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          .app-wrapper {
            padding: 16px;
            background-color: var(--background-color, #fff);
            border-radius: 8px;
          }
        </style>
        <div class="app-wrapper">
          <slot></slot>
        </div>
      `;
    }

    connectedCallback() {
      const state = this.getAttribute('data-state') || 'default';
      const step = this.getAttribute('data-step') || '1';
      this.shadowRoot.querySelector('.app-wrapper').setAttribute('data-state', state);
      this.shadowRoot.querySelector('.app-wrapper').setAttribute('data-step', step);
    }
  }

  customElements.define('app-wrapper', AppWrapper);
}