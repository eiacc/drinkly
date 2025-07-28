if (!customElements.get("custom-product-form")) {
  customElements.define(
    "custom-product-form",
    class CustomProductForm extends HTMLElement {
      constructor() {
        super();
        this.form_button = null;
        this.option_size = this.dataset.optionSize;
        this.metaproperties = [];
        this.variant_images = [];
        this.cart = document.querySelector("cart-drawer");
        this.cart_button = null
      }

      connectedCallback() {
        this.form_button = this.querySelector("button[type='submit']")
        this.form_button.addEventListener("click", this.onFormButtonClick.bind(this));
        this.quantities = this.querySelectorAll("input[name='quantity']")
        this.variant_image_wrappers = this.querySelectorAll("[data-product-sub-id]")
        this.filter_list = this.querySelector(".drawer__filter-list")
        this.init();
      }

      init() {
        const variants = Array.isArray(productData?.variants) ? productData.variants : [];
        this.cart_button = document.getElementById("cart-icon-bubble");
      
        this.variant_image_wrappers.forEach(wrapper => {
          const identifier = wrapper.dataset.productSubId;
      
          if (!identifier) return;
      
          const variant = variants.find(v => v.sub_id?.includes(identifier));
      
          if (variant?.featured_image) {
            const img = document.createElement('img');
            img.src = variant.featured_image;
            img.alt = variant.title || 'Product Image';
            wrapper.innerHTML = '';
            wrapper.appendChild(img);
          }

          wrapper.setAttribute('data-variant-tags', variant.tags.join(','));
        });
        this.filterList();
      }

      capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }

      filterList() {
        const tags = productData.variants.map(variant => variant.tags).flat();
        const uniqueTags = [...new Set(tags)];

        uniqueTags.forEach(tag => {
          const li = document.createElement('li');
          li.classList.add('f-button__list__item', 'f-button__list__item--button');
          const id = `drawer-filter-${crypto.randomUUID()}`;
          li.innerHTML = `
            <input type="checkbox" tabindex="-1" id="${id}" name="drawer_filter" value="${tag}" form="">
            <label tabindex="0" class="f-button__list__link" for="${id}">
              ${this.capitalize(tag)}
            </label>
          `;
          li.addEventListener('change', this.onFilterChange.bind(this));
          this.filter_list.appendChild(li);
        });
      }

      onFilterChange(e) {
        const filter_values = [];

        this.filter_list.querySelectorAll('input[name="drawer_filter"]').forEach(input => {
          if (input.checked) filter_values.push(input.value);
        });

        this.querySelectorAll('[data-variant-tags]').forEach(wrapper => {
          const variant_tags = wrapper.dataset.variantTags.split(',');
          if (filter_values.every(value => variant_tags.includes(value))) {
            wrapper.parentElement.classList.remove('hidden');
          } else {
            wrapper.parentElement.classList.add('hidden');
          }
        });
      }

      buttonLoad(state) {
        const span = this.form_button.firstElementChild;
        const loader = this.form_button.querySelector('.loading-overlay__spinner');

        if (state) {

          loader.classList.remove('hidden');
          span.classList.add('hidden');
          this.form_button.setAttribute("aria-disabled", state);
        } else {
          loader.classList.add('hidden');
          span.classList.remove('hidden');
          this.form_button.setAttribute("aria-disabled", state);
        }
      }

      async onFormButtonClick(e) {
        e.preventDefault();
        this.buttonLoad(true);

        try {
          const productVariantInputs = this.querySelectorAll(".js.wt-product__option:not([data-option='dropdown']) input:checked")
          const options = [];
          const cart = [];
          const cart_temp = [];
          const properties = {};
          let initial_sub_id = '';
  
          this.metaproperties = this.querySelectorAll('input[name^="properties["][name$="]"]');
          this.metaproperties.forEach(property => {
            const nameAttr = property.getAttribute('name');
            const match = nameAttr.match(/^properties\[(.+)\]$/);
          
            if (match) {
              const key = match[1];
              properties[key] = property.value;
            }
          });
  
          productVariantInputs.forEach(input => {
            initial_sub_id += (input.value).toLowerCase().replaceAll(' ', '-') + '-';
            options.push(input.value);
          });
  
          // checkpoint 1: see if quantity is greater than 0
          for (let i = 0; i < this.quantities.length; i++) {
            const quantity = this.quantities[i];
  
            if (quantity.value < 1) continue;
            if (!options.includes(quantity.getAttribute('name'))) {
              options.push(quantity.getAttribute('name'));
            }
            const sub_id = [initial_sub_id, quantity.dataset.value].join('');
            cart_temp.push({
              sub_id,
              quantity: quantity.value
            });
          }
  
          if (options.length < this.option_size) throw new Error('please fill all options');
  
          if (cart_temp.length < 1) return;
  
          const variants = productData.variants;
          if (!variants || variants.length < 1) return;
  
          cart_temp.forEach(item => {
            const variant = variants.find(variant => variant.sub_id === item.sub_id);
            if (!variant.available && variant.inventory_quantity < 1) return;
            cart.push({
              id: variant.id,
              quantity: item.quantity > variant.inventory_quantity && !variant.available ? variant.inventory_quantity : item.quantity,
              properties
            });
          });
  
          const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ items: cart })
          });
    
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.description || 'Failed to add items');
          }
    
          // const cart_response = await response.json();
          console.log('Items added successfully:', response);
          this.cart.refreshCartDrawer();

          setTimeout(() => {
            this.buttonLoad(false);
            this.cart_button.click();
          }, 1000);
        } catch (error) {
          this.buttonLoad(false);
          console.error('error', error);
        }
      }
    }
  );
}