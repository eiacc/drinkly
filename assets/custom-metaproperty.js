if (!customElements.get('custom-metaproperty')) {
  class CustomMetaproperty extends HTMLElement {
    constructor() {
      super();
      this.input = this.querySelector('input');
      this.handleInputChange = this.handleInputChange.bind(this);
    }

    connectedCallback() {
      this.input.addEventListener('input', this.handleInputChange);
    }

    error() {
      this.dataset.state = 'error';
    }

    filled() {
      this.dataset.state = '';
    }

    handleInputChange(e) {
      if (e.target.value !== '') this.filled();
    }
  }

  customElements.define('custom-metaproperty', CustomMetaproperty);
}