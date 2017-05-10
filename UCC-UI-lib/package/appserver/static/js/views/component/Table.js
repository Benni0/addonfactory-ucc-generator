/*global __non_webpack_require__*/
define([
    'jquery',
    'lodash',
    'app/views/component/TableRow',
    'app/views/component/MoreInfo',
    'views/Base',
    'views/shared/TableHead',
    'views/shared/delegates/TableRowToggle'
], function (
    $,
    _,
    TableRow,
    MoreInfo,
    BaseView,
    TableHeadView,
    TableRowToggleView
) {
    return BaseView.extend({
        initialize: function (options) {
            _.extend(this, options);
            //Expand the detail row
            this.children.tableRowToggle = new TableRowToggleView({
                el: this.el,
                collapseOthers: true
            });
            //Table Header
            var tableHeaders = [],
                TableHead;
            if (this.enableMoreInfo) {
                tableHeaders.push({
                    label: 'i',
                    className: 'col-info',
                    html: '<i class="icon-info"></i>'
                });
                // Load custom row if defined
                if (this.customRow) {
                    this.crDeferred = this._loadCustomRow(this.customRow.src);
                }
            }

            _.each(this.component.table.header, h => {
                tableHeaders.push({
                    "label": _(h.label).t(),
                    "className": 'col-' + h.field,
                    "sortKey": h.field
                });
            });

            if (this.showActions) {
                tableHeaders.push({
                    label: _('Actions').t(),
                    className: 'col-action'
                });
            }
            //TODO: implement bulk action
            TableHead = TableHeadView;

            this.children.head = new TableHead({
                model: this.stateModel,
                columns: tableHeaders
            });
            this.activate();
        },

        startListening: function () {
            this.listenTo(this.collection, 'remove', this.renderRows);
            this.listenTo(this.collection, 'reset', this.renderRows);
            this.listenTo(this.collection, 'sync', this.renderRows);
            this.listenTo(this.collection, 'add', this.addWithOffsetChange);
        },

        addWithOffsetChange: function () {
            if (this.collection._url === undefined) {
                this.dispatcher.trigger('add-input');
            } else {
                this.renderRows();
            }
        },

        _loadCustomRow: function(module) {
            const deferred = $.Deferred();
            __non_webpack_require__(['custom/' + module], (CustomRow) => {
                this.CustomRow = CustomRow;
                deferred.resolve(CustomRow);
            });
            return deferred.promise();
        },

        _newCustomRow: function(component, model, index) {
            const el = document.createElement("tr");
            // set className and style
            el.className = 'more-info';
            el.className += (index % 2) ? ' even' : ' odd';
            el.style.display = "none";
            const cols = component.table.header.length + 1;
            el.innerHTML = `
                <td class="details" colspan="${cols}">
                </td>
            `;
            // The serviceName is extracted from model id which comes from
            // util/backboneHelpers.js: generateModel
            let id_str = model.id.split('/');
            let serviceName = null;
            if (id_str.length >= 2 && this.restRoot) {
                serviceName = id_str[id_str.length - 2];
                serviceName = serviceName.replace(this.restRoot + '_', '');
            }

            return new this.CustomRow(el, component, model, serviceName);
        },

        rowsFromCollection: function () {
            return _.flattenDeep(
                this.collection.map((model, i) => {
                    let result = [];
                    result.push(new TableRow({
                        dispatcher: this.dispatcher,
                        model: {
                            entity: model,
                            stateModel: this.stateModel,
                            enableBulkActions: false,
                            enableMoreInfo: this.enableMoreInfo,
                            showActions: true,
                            collection: this.collection,
                            component: this.component,
                            restRoot: this.restRoot,
                            navModel: this.navModel
                        },
                        index: i
                    }));
                    if (this.enableMoreInfo) {
                        if (this.customRow) {
                            result.push(this._newCustomRow(
                                this.component,
                                model,
                                i
                            ));
                        } else {
                            result.push(new MoreInfo({
                                model: {
                                    entity: model,
                                    component: this.component
                                },
                                index: i
                            }));
                        }
                    }
                    return result;
                })
            );
        },

        _render: function (rows) {
            _.each(rows, row => {
                row.render();
                if (row.$el) {
                    this.$('tbody').append(row.$el);
                } else {
                    this.$('tbody').append(row.el);
                }
            });
        },

        renderRows: function () {
            this.$('tbody').empty();
            if (this.customRow) {
                $.when(this.crDeferred).done(() => {
                    this.children.rows = this.rowsFromCollection();
                    this._render(this.children.rows);
                });
            } else {
                this.children.rows = this.rowsFromCollection();
                this._render(this.children.rows);
            }
        },

        render: function () {
            if (!this.el.innerHTML) {
                this.$el.append(this.compiledTemplate({}));
                this.children.head.render().prependTo(this.$('> .table-chrome'));
            }
            this.renderRows();
            return this;
        },

        template: `
            <table class="table table-chrome table-striped table-row-expanding table-listing">
                <tbody class="app-listings"></tbody>
            </table>
        `
    });
});
