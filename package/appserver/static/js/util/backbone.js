import {configManager} from 'app/util/configManager';
import BaseModel from 'app/models/Base.Model';
import BaseCollection from 'app/collections/ProxyBase.Collection';

export function generateModel(name, options = {}) {
    const {customizedUrl} = options;
    const {unifiedConfig: {meta}} = configManager;

    const newModel = BaseModel.extend({
        url: customizedUrl || (meta.restRoot + '/' + name),
        initialize: function (attributes, options = {}) {
            options.appData = configManager.getAppData().toJSON();
            BaseModel.prototype.initialize.call(this, attributes, options);
        },
    });
    return newModel;
}

export function generateCollection(name, options = {}) {
    const {unifiedConfig: {meta}} = configManager;
    const {customizedUrl} = options;

    const newCollection = BaseCollection.extend({
        url: customizedUrl || (meta.restRoot + '/' + name),
        model: generateModel(name, options),
        initialize: function (attributes, options = {}) {
            options.appData = configManager.getAppData().toJSON();
            BaseCollection.prototype.initialize.call(this, attributes, options);
        },
    });
    return newCollection;
}
