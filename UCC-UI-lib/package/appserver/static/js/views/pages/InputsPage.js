import {configManager} from 'app/util/configManager';
import {generateCollection} from 'app/util/backboneHelpers';
import {getFormattedMessage} from 'app/util/messageUtil';
import {MODE_CREATE} from 'app/constants/modes';
import {PAGE_STYLE} from 'app/constants/pageStyle';
import restEndpointMap from 'app/constants/restEndpointMap';
import BaseTableView from 'app/views/BaseTableView';
import 'appCssDir/common.css';
import 'appCssDir/inputs.css';

const ALL_SERVICE = 'all';

define([
    'jquery',
    'lodash',
    'backbone',
    'app/util/Util',
    'app/views/pages/InputsPage.html',
    'views/shared/tablecaption/Master',
    'views/shared/controls/SyntheticSelectControl',
    'app/views/component/InputFilterMenu',
    'app/views/component/AddInputMenu',
    'app/views/component/EntityDialog',
    'app/views/component/Table',
    'expose-loader?Lodash!lodash'
], function (
    $,
    _,
    Backbone,
    Util,
    InputsPageTemplate,
    CaptionView,
    SyntheticSelectControl,
    InputFilter,
    AddInputMenu,
    EntityDialog,
    Table
) {
    return BaseTableView.extend({
        className: 'inputsContainer',

        initialize: function (options) {
            BaseTableView.prototype.initialize.apply(this, arguments);

            this.unifiedConfig = configManager.unifiedConfig;
            this.inputsConfig = this.unifiedConfig.pages.inputs;
            this.inputsPageTemplateData = {
                'title': this.inputsConfig.title,
                'description': this.inputsConfig.description,
                'singleInput': this.inputsConfig.services.length === 1,
                'buttonText': getFormattedMessage(100)
            };

            this.navModel = options.navModel;

            // Set state model
            this.stateModel.set('service', ALL_SERVICE, {'silent': true});

            this.services = this.inputsConfig.services;
            // filter keys for search
            this.filterKey = [];
            _.each(this.services, service =>
                _.each(service.entity, e => {
                    if (this.filterKey.indexOf(e.field) < 0) {
                        this.filterKey.push(e.field);
                    }
                })
            );
            // create collection for each service
            _.each(this.services, service => {
                if (!restEndpointMap[service.name]) {
                    this[service.name] = generateCollection(service.name);
                } else {
                    this[service.name] = generateCollection(
                        '',
                        {'endpointUrl': restEndpointMap[service.name]}
                    );
                }
            });
            this.inputs = generateCollection();

            // Change filter
            this.listenTo(this.dispatcher, 'filter-change', (type) => {
                // Trigger change:service event
                this.stateModel.set('service', type);
            });

            this.deferred = this.fetchAllCollection();

            this.emptySearchString =
                this.filterKey.map(d => d + '=*')
                .join(' OR ');
        },

        stateChange: function () {
            let models = this.adjustPaging(
                this.inputs,
                this.filterSort(
                    this.filterSearch(
                        this.filterService(this.cachedCollection.models)
                    )
            ));
            this.inputs.reset(models);
        },

        filterSearch: function(models) {
            if (!this.stateModel.get('search') ||
                    this.stateModel.get('search') === this.emptySearchString) {
                return models;
            }
            const search = this.getRawSearch(this.stateModel.get('search'));
            let result = models.filter(d =>
                this.filterKey.some(field => {
                    const entryValue = (d.entry.get(field) &&
                        d.entry.get(field).toLowerCase()) || undefined;
                    const contentValue = (d.entry.content.get(field) &&
                        d.entry.content.get(field).toLowerCase()) || undefined;

                    return (entryValue && entryValue.indexOf(search) > -1) ||
                        (contentValue && contentValue.indexOf(search) > -1);
                })
            );
            //make the filter work for field 'status'
            if ("disabled".indexOf(search) > -1) {
                result = result.concat(models.filter(model => {
                    return model.entry.content.get('disabled') === true;
                }));
            } else if ("enabled".indexOf(search) > -1) {
                result = result.concat(models.filter(model => {
                    return model.entry.content.get('disabled') === false;
                }));
            }
            return result;
        },

        filterService: function (models) {
            // Filter by service
            const service = this.stateModel.get('service');
            if (service === ALL_SERVICE) {
                return models;
            } else {
                return models.filter(model => {
                    return Util.extractServiceName(model) === service;
                });
            }
        },

        render: function () {
            Util.addLoadingMsg.apply(this);
            if (this.cachedCollection) {
                this._render();
            } else {
                this.deferred.done(() => {
                    this.stateModel.set('fetching', false);
                    this.cachedCollection = this.combineCollection();
                    this.inputs.models = this.cachedCollection.models;
                    this.stateChange();
                    this._render();
                });
            }
            return this;
        },

        _render: function () {
            this.$el.html('');
            // Table caption view
            this.caption = new CaptionView({
                countLabel: _(this.inputsConfig.title).t(),
                model: {
                    state: this.stateModel
                },
                collection: this.inputs,
                noFilterButtons: true,
                filterKey: this.filterKey
            });

            // Page count setting view
            this.countSelect = new SyntheticSelectControl({
                modelAttribute: 'count',
                model: this.stateModel,
                items: [
                    {label: _('10 Per Page').t(), value: 10},
                    {label: _('25 Per Page').t(), value: 25},
                    {label: _('50 Per Page').t(), value: 50}
                ],
                menuWidth: 'narrow'
            });

            this.filter = new InputFilter({
                dispatcher: this.dispatcher,
                services: this.services
            });

            this.inputTable = new Table({
                stateModel: this.stateModel,
                collection: this.inputs,
                dispatcher: this.dispatcher,
                enableBulkActions: false,
                showActions: true,
                enableMoreInfo: true,
                customRow: this.inputsConfig.table.customRow,
                component: this.inputsConfig,
                unifiedConfig: this.unifiedConfig,
                navModel: this.navModel
            });
            this.$el.append(
                _.template(InputsPageTemplate)(this.inputsPageTemplateData)
            );
            this.$el.append(this.caption.render().$el);

            // render input filter for multiple inputs
            if (!this.inputsPageTemplateData.singleInput) {
                this.$('.table-caption-inner').append(
                    this.countSelect.render().$el
                );
                this.$('.table-caption-inner').append(
                    this.filter.render().$el
                );
            }
            // render inputs table
            this.$el.append(this.inputTable.render().$el);

            // Single data input or multiple data inputs
            if (this.inputsPageTemplateData.singleInput) {
                let serviceConfig = this.inputsConfig.services[0];
                this.$('#addInputBtn').on('click', () => {
                    if (serviceConfig.style === PAGE_STYLE) {
                        this.navModel.navigator.navigate({
                            'service': serviceConfig.name,
                            'action': MODE_CREATE
                        });
                    } else {
                        let dlg = new EntityDialog({
                            el: $(".dialog-placeholder"),
                            collection: this.inputs,
                            component: serviceConfig
                        }).render();
                        dlg.modal();
                    }
                });
            } else {
                let customMenu = this.inputsConfig.menu;
                if (customMenu) {
                    this._loadCustomMenu(
                        customMenu.src,
                        this.$('#addInputBtn').get(0),
                        this.navModel.navigator
                    ).then(() => {
                        this.editmenu.render();
                    });
                } else {
                    this.$('#addInputBtn').on("click", e => {
                        let $target = $(e.currentTarget);
                        if (this.editmenu && this.editmenu.shown) {
                            this.editmenu.hide();
                            e.preventDefault();
                            return;
                        }
                        this.editmenu = new AddInputMenu({
                            collection: this.inputs,
                            dispatcher: this.dispatcher,
                            services: this.services,
                            navModel: this.navModel
                        });

                        $('body').append(this.editmenu.render().el);
                        this.editmenu.show($target);
                    });
                }
            }
        },

        _loadCustomMenu: function(module, target, navigator) {
            let deferred = $.Deferred();
            __non_webpack_require__(['custom/' + module], (CustomMenu) => {
                this.editmenu = new CustomMenu(
                    this.unifiedConfig,
                    target,
                    navigator
                );
                deferred.resolve(CustomMenu);
            });
            return deferred.promise();
        },

        fetchAllCollection: function () {
            const calls = _.map(this.services, service => {
                return this[service.name].fetch({
                    count: 0 // fetch all stanzas
                });
            });
            return $.when.apply(this, calls);
        },

        combineCollection: function () {
            const tempCollection = generateCollection();
            _.each(this.services, service => {
                tempCollection.add(this[service.name].models, {silent: true});
            });
            return tempCollection;
        }
    });
});
