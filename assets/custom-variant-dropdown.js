if (!customElements.get("custom-variant-dropdown")) {
  customElements.define(
    "custom-variant-dropdown",
    class CustomVariantDropdown extends HTMLElement {
      constructor() {
        super();

        this.body = document.querySelector("body");
        this.overlay = this.previousElementSibling;

        this.dropdownButton = this.querySelector(
          ".wt-product__option__dropdown",
        );
        this.dropdownIcon = this.dropdownButton.querySelector("svg") || null;

        this.container = this.querySelector(".wt-product__option__body");
        this.drawerList = this.querySelector(".drawer__list");
        this.drawerContent = this.querySelector(".drawer__content");
        this.closeButton = this.querySelector(".drawer__list-nav__close");
        this.componentSummary = this.dataset.component;

        this.isDrawerOpen = false;

        // Featured product sections
        this.featuredProductSection = this.closest(".wt-featured-product");
        this.isInsideFeaturedProductSection =
          this.featuredProductSection !== null;
        this.featuredProductSectionActiveClass =
          "wt-featured-product--active-variant-dropdown";

        this.classOpen = "open";
        this.classHidden = "hidden";
        this.classBodyOverlayed = "variant-dropdown-page-overlay";
      }

      connectedCallback() {
        this._init();
      }

      openDrawer() {
        if (this.dropdownIcon) this.dropdownIcon.classList.add(this.classOpen);
        this.container.classList.add(this.classOpen);
        this.overlay.classList.remove(this.classHidden);
        this.body.classList.add(this.classBodyOverlayed);
        this.isDrawerOpen = true;
        if (this.isInsideFeaturedProductSection) {
          this.featuredProductSection.classList.add(
            this.featuredProductSectionActiveClass,
          );
        }
        this._handleTabindex();
        document.addEventListener("click", this.handleInteractionOutside);

        if (this.componentSummary !== 'summary') return
        if (window.productSummary.length < 1) return;
        
        this.drawerContent.innerHTML = ''

        window.productSummary.forEach((product, idx) => {
          const match = product.name.match(/^properties\[(.+)\]$/);
          let key = match ? match[1] : product.name

          
          if (product.name === 'quantity') {
            console.log('variants', product.variants, product.variants.length)
            const variants = this.setVariants(product.variants)
            this.drawerContent.innerHTML += `
              <div class="drawer__list__item drawer__list__item--mb">
                <strong>Step ${idx + 1} (${product.name_override}):</strong>
                <ul>
                  ${variants}
                </ul>
              </div>
            `
          } else {
            this.drawerContent.innerHTML += `
              <div class="drawer__list__item drawer__list__item--mb">
                <strong>Step ${idx + 1} (${key}):</strong>
                <p>${product.value}</p>
              </div>
            `
          }

        })
      }

      setVariants(data) {
        let temp = '';

        for (let i = 0; i < data.length; i++) {
          const variant = data[i]
          temp += `<li>${(variant.variant).replaceAll('-', ' ')} x${variant.value}</li>`
        }

        console.log('temp', temp)
        return temp
      }

      closeDrawer() {
        this.container.classList.remove(this.classOpen);
        this.overlay.classList.add(this.classHidden);
        this.body.classList.remove(this.classBodyOverlayed);
        if (this.dropdownIcon) this.dropdownIcon.classList.add(this.classOpen);
        this.isDrawerOpen = false;
        if (this.isInsideFeaturedProductSection) {
          this.featuredProductSection.classList.remove(
            this.featuredProductSectionActiveClass,
          );
        }
        this._handleTabindex();
        document.removeEventListener("click", this.handleInteractionOutside);
      }

      handleInteractionOutside(event) {
        if (this.isDrawerOpen) {
          // Only proceed if the drawer is open
          const clickInsideDrawer = this.container.contains(event.target);
          // Close the drawer if the click was outside the drawer and not on the toggle button
          if (!clickInsideDrawer && event.target !== this.dropdownButton) {
            this.closeDrawer();
          }
        }
      }

      addEventListeners() {
        this.dropdownButton.addEventListener("click", (event) => {
          event.stopPropagation();
          this.openDrawer();
        });

        this.closeButton.addEventListener("click", () => {
          this.closeDrawer();
        });

        this.container.addEventListener("keydown", this._keyDownHandler);
      }

      removeEventListeners() {
        this.dropdownButton.removeEventListener("click", () => {
          this.openDrawer();
        });

        this.closeButton.removeEventListener("click", () => {
          this.closeDrawer();
        });
      }

      disconnectedCallback() {
        this.removeEventListeners();
      }

      temporaryHideFocusVisible() {
        document.body.classList.add("no-focus-visible");
      }

      getFocusableElements() {
        const focusableElementsSelector =
          "button, [href], input, select, [tabindex]";
        const focusableElements = () =>
          Array.from(
            this.container.querySelectorAll(focusableElementsSelector),
          ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex >= 0);

        return {
          focusableElements,
          first: focusableElements()[0],
          last: focusableElements()[focusableElements().length - 1],
        };
      }

      _handleTabindex() {
        const interactivElements = this.container.querySelectorAll(
          ".drawer__list__link, .drawer__list-nav__close",
        );

        setTabindex(interactivElements, this.isDrawerOpen ? "0" : "-1");
      }

      _keyDownHandler(e) {
        const isTabPressed =
          e.key === "Tab" || e.keyCode === 9 || e.code === "Tab";
        const { first, last } = this.getFocusableElements();

        if (e.key === "Escape" || e.keyCode === 27 || e.code === "Escape") {
          if (this.isDrawerOpen) {
            this.closeDrawer();
          }
        }

        if (this.isDrawerOpen) {
          if (isTabPressed) {
            if (e.shiftKey && document.activeElement === first) {
              last.focus();
              e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      }

      _init() {
        this.openDrawer = this.openDrawer.bind(this);
        this.closeDrawer = this.closeDrawer.bind(this);
        this._keyDownHandler = this._keyDownHandler.bind(this);
        this.handleInteractionOutside =
          this.handleInteractionOutside.bind(this);

        this._handleTabindex();
        this.addEventListeners();
      }
    },
  );
}
