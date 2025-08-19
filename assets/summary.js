if (!customElements.get('order-summary')) {
class OrderSummary extends HTMLElement {
    constructor() {
    super();
    this.inputs = [];
    this.data = [];
    this.size = 0;

    this.dropdown = this.querySelector('custom-variant-dropdown button.wt-product__option__dropdown') || null;
    this.handleEvent = this.handleEvent.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
    }

    connectedCallback() {
    this.add_to_cart_button = document.querySelector('custom-product-form button[type="submit"]');
    this.inputs = document.querySelectorAll('input[data-input]');

    const filtered = Array.from(this.inputs)
    .filter(input => input.name !== 'quantity');
    
    // Create a Set of unique input names
    const uniqueNames = new Set(filtered.map(input => input.name));
    // Store unique names
    this.inputNames = [...uniqueNames];

    this.size = uniqueNames.size + 1; // check

    this.inputs.forEach(input => {
        const eventType = input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input';
        input.addEventListener(eventType, this.handleEvent);
    });
    }

    handleEvent(type = null) {
    this.pullData();
    
    const hasAllInputs = this.inputNames.every(name =>
        this.data.some(obj => obj.name === name)
    );
    
    if (this.data.length >= this.size && hasAllInputs) {
        this.enable();
    } else {
        this.disable();
    }

    const sorted = this.data.sort((a, b) => {
        const stepA = a.step ?? Number.MAX_SAFE_INTEGER;
        const stepB = b.step ?? Number.MAX_SAFE_INTEGER;
        return stepA - stepB;
    });

    window.productSummary = sorted;
    }

    pullData() {
    const seenVariantKeys = new Set();
    const variants = [];
    const data = [];
    
    this.inputs.forEach(input => {
        if (!input.name) return;
    
        let value = null;
    
        if (input.name === 'quantity') {
        const key = input.dataset.value;
        if (!key || seenVariantKeys.has(key)) return;
    
        if (Number(input.value) > 0) {
            seenVariantKeys.add(key);
    
            variants.push({
            key,
            value: input.value,
            variant: input.dataset.variant,
            name: input.dataset.name,
            step: Number(input.dataset.input)
            });
        }
        } else {
        if (input.type === 'checkbox') {
            value = input.checked;
        } else if (input.type === 'radio') {
            if (!input.checked) return;
            value = input.value;
        } else if (input.value !== '') {
            value = input.value;
        }
    
        if (value !== null) {
            data.push({ name: input.name, value, step: Number(input.dataset.input) });
        }
        }
    });
    
    // Only push the quantity object if variants exist
    if (variants.length > 0) {
        data.push({ name: 'quantity', name_override: variants[0].name, variants, step: variants[0].step });
    }
    
    this.data = data;
    }
    

    disable() {
    this.dataset.state = 'disabled';
    if (this.dropdown) this.dropdown.setAttribute('disabled', true);
    if (this.add_to_cart_button) this.add_to_cart_button.setAttribute('disabled', true);
    this.removeAttribute('data-active');
    }
    
    enable() {
    if (this.dropdown) this.dropdown.removeAttribute('disabled');
    if (this.add_to_cart_button) this.add_to_cart_button.removeAttribute('disabled');
    this.setAttribute('data-active', '');
    this.dataset.state = '';
    }
}

customElements.define('order-summary', OrderSummary);
}