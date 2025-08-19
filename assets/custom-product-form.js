window.productSummary = [];
document.addEventListener("DOMContentLoaded", () => {
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
          this.cart_data = [];
          this.updated_cart = {
            message: '',
            data: {
              toAdd: [],
              toUpdate: {}
            }
          };
          this.cart = document.querySelector("cart-drawer");
          this.cart_button = null
          this.variant_size = this.querySelectorAll('[data-field]');
          this.product_popup_cart = document.querySelector('.product-cart-popup');
          this.product_popup_error = document.querySelector('.product-cart-popup--error');
  
          this.product_popup_cart_update_button = null
          this.product_popup_cart_cancel_buttons = []
          this.file_upload = this.querySelector('.upload-container') || null;
  
          if (this.product_popup_cart) {
            this.product_popup_cart_update_button = this.product_popup_cart.querySelector('[data-button-type="update"]');
            this.product_popup_cart_cancel_buttons = this.product_popup_cart.querySelectorAll('[data-button-type="cancel"]');
            this.product_popup_cart_update_button.addEventListener('click', this.popupAddToCart.bind(this));
            this.product_popup_cart_cancel_buttons.forEach(button => {
              button.addEventListener('click', this.onPopupCartCancel.bind(this));
            });
          }
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
          
          for (const wrapper of this.variant_image_wrappers) {
            const identifier = wrapper.getAttribute('data-product-sub-id');
            if (!identifier) continue;
            
            const variant = variants.find(v => v.sub_id?.includes(identifier));

            wrapper.innerHTML = '';
            if (variant?.featured_image) {
              const img = document.createElement('img');
              img.src = variant.featured_image;
              img.alt = variant.title || 'Product Image';
              wrapper.innerHTML = '';
              wrapper.appendChild(img);
  
              const quantity_input = wrapper.parentElement.lastElementChild;
              if (quantity_input) quantity_input.dataset.featuredImageId = variant.featured_image_id;
            }
          }
          
          this.filterList();
        }
  
        capitalize(str) {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }
  
        filterList() {
          const tags = productData.variants
            .filter(variant => Array.isArray(variant.tags)) // only keep variants with tags
            .flatMap(variant => variant.tags);
        
          const uniqueTags = [...new Set(tags)];
        
          uniqueTags.forEach(tag => {
            if (!tag) return; // skip empty strings/null just in case
        
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
            let properties = this.checkProperties();
            let initial_sub_id = '';
  
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
    
            let totalVariants = 0;

            let item_data = {
              minimum_quantity: null,
              title: null
            }

            cart_temp.forEach(item => {
              const prop = properties;
              const variant = variants.find(variant => variant.sub_id === item.sub_id);
              if (!variant.available && variant.inventory_quantity < 1) return;
  
              const qty = item.quantity > variant.inventory_quantity && !variant.available ? variant.inventory_quantity : item.quantity
              totalVariants += Number(qty);

              if (variant.minimum_quantity && variant.minimum_quantity > 0) {
                prop['_minimum_quantity'] = variant.minimum_quantity;
                item_data.minimum_quantity = variant.minimum_quantity;
                item_data.title = variant.product.title + (variant.title ? ` - ${variant.title}` : '');
              }
  
              cart.push({
                id: variant.id,
                quantity: qty,
                properties: prop
              });
            });

            if (item_data.minimum_quantity && item_data.minimum_quantity > 0 && totalVariants < item_data.minimum_quantity) {
              const err = new Error(`The minimum quantity for <strong>${item_data.title}</strong> is <strong>${item_data.minimum_quantity}</strong>`);
              err.data = {
                'status': 'minimum_quantity',
              }
              throw err;
            }
  
            const addOns = this.querySelectorAll('[data-addon] input:checked')
            addOns.forEach(addOn => {
              cart.push({
                id: addOn.dataset.variantId,
                quantity: Math.ceil(totalVariants / 24) ,
              });
            });
  
            // fetch cart data
            const { alteredItems, foundAltered, remainingItems } = await this.fetchCart(cart);
  
            if (foundAltered) {
              this.updated_cart = {
                message: 'You already have this item in your cart',
                data: {
                  toAdd: remainingItems,
                  toUpdate: alteredItems
                }
              }
  
              throw new Error('alter_cart');
            }

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
      
            this.cart.refreshCartDrawer();
  
            setTimeout(() => {
              this.buttonLoad(false);
              this.cart_button.click();
            }, 1000);
          } catch (error) {
            this.buttonLoad(false);
  
            if (error.message === 'alter_cart') {
              this.product_popup_cart.setAttribute('data-state', 'active');
            }

            if (error.data?.status === 'minimum_quantity') {
              this.product_popup_error.querySelector('.product-cart-popup__title').innerHTML = error.message;
              this.product_popup_error.setAttribute('data-state', 'active');
            }
          }
        }
  
        async popupAddToCart(e) {
          e.preventDefault();
          this.product_popup_cart_update_button.setAttribute('disabled', true);
          this.product_popup_cart.setAttribute('data-state', 'active');
        
          this.product_popup_cart_update_button.firstElementChild.classList.add('hidden');
          this.product_popup_cart_update_button.lastElementChild.classList.remove('hidden');
        
          try {
            // console.log('updated_cart.data.cartItems', this.updated_cart.data)
  
            for (const [line, quantity] of Object.entries(this.updated_cart.data.toUpdate)) {
              await fetch('/cart/change.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ line: Number(line), quantity: Number(quantity) })
              });
            }
  
            // ➕ Bulk add new items
            if (this.updated_cart.data.toAdd.length > 0) {
              const addRes = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ items: this.updated_cart.data.toAdd })
              });
  
              if (!addRes.ok) {
                const errorData = await addRes.json();
                throw new Error(errorData.description || 'Failed to add items');
              }
            }
        
            await this.cart.refreshCartDrawer();
        
            setTimeout(() => {
              this.product_popup_cart_update_button.firstElementChild.classList.remove('hidden');
              this.product_popup_cart_update_button.lastElementChild.classList.add('hidden');
              this.product_popup_cart_update_button.removeAttribute('disabled');
              this.onPopupCartCancel();
              this.cart_button.click();
            }, 1000);
          } catch (error) {
            // console.error(error);
          } finally {
            this.product_popup_cart_update_button.firstElementChild.classList.remove('hidden');
            this.product_popup_cart_update_button.lastElementChild.classList.add('hidden');
            this.product_popup_cart_update_button.removeAttribute('disabled');
            this.updated_cart = {
              message: '',
              data: {
                toAdd: [],
                toUpdate: {}
              }
            };
          }
        }      
        
        onPopupCartCancel() {
          this.product_popup_cart.setAttribute('data-state', '');
        }
  
        async fetchCart(dataToCompare = []) {
          try {
            const response = await fetch('/cart.js');
            if (!response.ok) throw new Error('Network response was not ok');
        
            const cart = await response.json();
            const properties = this.checkProperties();
        
            const updates = {}; // line index => quantity
            const remainingItems = dataToCompare.map(item => ({
              ...item,
              ...properties,
            }));
            let lineIndex = 1;
        
            for (const item of cart.items) {
              const matchIndex = remainingItems.findIndex(compare =>
                compare.id === item.id &&
                JSON.stringify(compare.properties || {}) === JSON.stringify(item.properties || {})
              );
        
              if (matchIndex !== -1) {
                const match = remainingItems[matchIndex];
                updates[lineIndex] = Number(match.quantity);
                remainingItems.splice(matchIndex, 1);
              }
        
              lineIndex += 1;
            }
        
            const foundAltered = Object.keys(updates).length > 0;
        
            return {
              alteredItems: updates,
              remainingItems,
              foundAltered
            };
        
          } catch (error) {
            // console.error('Failed to fetch cart:', error);
            return {
              alteredItems: {},
              remainingItems: [],
              foundAltered: false
            };
          }
        }
        
        checkProperties() {
          let errs = 0;
          const properties = {};
          this.querySelectorAll('custom-metaproperty').forEach(property => {
            const input = property.querySelector('input[name^="properties["]');
  
            // console.log('input', input);
  
            if (!input.value) {
              property.error()
              errs += 1
            } else {
              property.filled()
              errs -= 1
            }
  
            const nameAttr = input.getAttribute('name');
            const match = nameAttr.match(/^properties\[(.+)\]$/);
          
            if (match) {
              const key = match[1];
              
              if (key.toLowerCase().includes('artwork')) {
                const file = property.querySelector('input[type="file"]')
                properties[key] = (file.value).split('/').pop();
              } else {
                properties[key] = input.value;
              }
            }
          });
  
          if (errs > 0) throw new Error('please fill all metaproperties')
          return properties;
        }
      }
    );
  }
  
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
  
        this.size = uniqueNames.size + 1;
  
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
})

