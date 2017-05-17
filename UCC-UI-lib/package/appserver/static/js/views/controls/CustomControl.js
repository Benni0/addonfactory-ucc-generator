define([], function() {
    class CustomComponent {
        /**
         * Custom Component
         * @constructor
         * @param {Object} globalConfig - Global configuration.
         * @param {string} serviceName - Service name.
         * @param {element} el - The element of the custom row.
         * @param {string} modelAttribute - Backbone model attribute name.
         * @param {object} model - Backbone model for form, not Splunk model
         * @param {object} util - {
                    displayErrorMsg,
                    addErrorToComponent,
                    removeErrorFromComponent
                }.
         */
        constructor(globalConfig, serviceName, el, modelAttribute, model, util) {
            this.globalConfig = globalConfig;
            this.el = el;
            this.serviceName = serviceName;
            this.modelAttribute = modelAttribute;
            this.model = model;
            this.util = util;
        }
        render() {
            this.el.innerHTML = '<input id="mytext" type="text"></text>';
            var el = this.el.querySelector('#mytext');
            el.addEventListener('change', () => {
                this.model.set(this.field, el.value);
                console.log(`Set ${this.field} to ${el.value}`);
                // this.context.displayErrorMsg(this.context.selector, el.value);
            });
            return this;
        }
    }

    return CustomComponent;
});
