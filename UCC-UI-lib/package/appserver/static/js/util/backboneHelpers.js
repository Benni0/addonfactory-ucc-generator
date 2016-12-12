import $ from 'jquery';
import {configManager} from 'app/util/configManager';
import BaseModel from 'app/models/Base.Model';
import BaseCollection from 'app/collections/ProxyBase.Collection';
import {getAddonName} from 'app/util/Util';
import {parseFuncRawStr} from 'app/util/script';
import restEndpointMap from 'app/constants/restEndpointMap';

export function generateModel(name, options = {}) {
    const {
        customizedUrl,
        fields,
        modelName,
        formDataValidatorRawStr,
        onLoadRawStr,
        shouldInvokeOnload,
        validators
    } = options;
    const {unifiedConfig: {meta}} = configManager;
    const validateFormData = parseFuncRawStr(formDataValidatorRawStr);
    const onLoad = parseFuncRawStr(onLoadRawStr);

    const optionsNeedMerge = {fields, modelName, onLoad, shouldInvokeOnload, validateFormData};

    const newModel = BaseModel.extend({
        url: name ? (meta.restRoot + '_' + name) : customizedUrl,
        initialize: function (attributes, options = {}) {
            options.appData = configManager.getAppData().toJSON();
            BaseModel.prototype.initialize.call(this, attributes, {...options, ...optionsNeedMerge});
            (validators || []).forEach(({fieldName, validator}) => {
                this.addValidation(fieldName, validator);
            });
        }
    });
    return newModel;
}

export function generateCollection(name, options = {}) {
    const {unifiedConfig: {meta}} = configManager;
    const {customizedUrl} = options;

    const collectionModel = BaseCollection.extend({
        url: name ? (meta.restRoot + '_' + name) : customizedUrl,
        model: generateModel(name, options),
        initialize: function (attributes, options = {}) {
            options.appData = configManager.getAppData().toJSON();
            BaseCollection.prototype.initialize.call(this, attributes, options);
        }
    });
    return new collectionModel([], {
        targetApp: getAddonName(),
        targetOwner: 'nobody'
    });
}

export function fetchServiceCollections() {
    const {unifiedConfig: {pages: {inputs}}} = configManager;
    // User may only sepecified config for configuration page.
    if (!inputs) {
        return;
    }
    const {services} = inputs,
        collectionMap = {};

    services.forEach(({name}) => {
        collectionMap[name] = generateCollection(
            restEndpointMap[name] ? '' : name,
            {customizedUrl: restEndpointMap[name]}
        );
    });

    const calls = services.map(({name}) => fetchListCollection(collectionMap[name]));

    return {deferred: $.when(...calls), collectionMap};
}

function fetchListCollection(collection) {
    return collection.fetch({
        data: {
            sort_dir: 'asc',
            sort_key: 'name',
            count: 100,
            offset: 0,
            search: ''
        }
    });
}

export function combineCollection(collectionMap) {
    const tempCollection = generateCollection();
    Object.keys(collectionMap).forEach(d => {
        tempCollection.add(collectionMap[d].models, {silent: true});
    });
    return tempCollection;
}
