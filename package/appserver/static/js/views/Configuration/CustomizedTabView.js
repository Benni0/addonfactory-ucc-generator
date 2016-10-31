import {configManager} from 'app/util/configManager';

define([
    'jquery',
    'lodash',
    'backbone',
    'app/views/controls/ControlWrapper'
], function (
    $,
    _,
    Backbone,
    ControlWrapper
) {
    return Backbone.View.extend({
        initialize: function (options) {
            this.props = options.props;
        },

        render: function() {
            const {entity} = this.props;

            entity.forEach(d => {
                const controlOptions = {
                    modelAttribute: d.field,
                    password: d.encrypted ? true : false
                };
                _.extend(controlOptions, d.options);
                const controlWrapper = new ControlWrapper({
                    label: d.label,
                    controlType: d.type,
                    wrapperClass: d.field,
                    required: d.required ? true : false,
                    help: d.help || null,
                    controlOptions
                });
                this.$el.append(controlWrapper.render().$el)
            });
            return this;
        }
    });
});
