
from __future__ import absolute_import

import copy
import json

from solnlib.packages.splunklib.binding import HTTPError

from ..rest_handler.schema import RestSchema
from ..rest_handler.handler import RestHandler


__all__ = [
    'GlobalConfigError',
    'Configuration',
    'Inputs',
    'Configs',
    'Settings',
]


class GlobalConfigError(Exception):
    pass


class Configuration(object):
    """
    Splunk Configuration Handler.
    """

    FILTERS = [u'eai:appName', u'eai:acl', u'eai:userName']
    ENTITY_NAME = u'name'

    def __init__(self, splunkd_client, schema):
        """

        :param splunkd_client: SplunkRestClient
        :param schema:
        """
        self._client = splunkd_client
        self._schema = schema

    def load(self, *args, **kwargs):
        """
        Load all stored configuration for given schema.

        :param args:
        :param kwargs:
        :return:
        """
        raise NotImplementedError()

    def save(self, payload):
        """
        Save configuration. Return error while saving.
        It includes creating and updating. That is, it will try to
        update first, then create if NOT FOUND error occurs.

        :param payload: same format with return of ``load``.
        :return:
        """
        errors = {}
        for type_name, configurations in payload.iteritems():
            errors[type_name] = {}
            for configuration in configurations:
                res = self._save_configuration(
                    type_name,
                    configuration,
                )
                if res:
                    name = configuration[self.ENTITY_NAME]
                    errors[type_name][name] = res
        return errors

    @property
    def internal_schema(self):
        raise NotImplementedError()

    def _save_configuration(self, type_name, configuration):
        schema = self._search_configuration_schema(
            type_name,
            configuration[self.ENTITY_NAME],
        )
        configuration = copy.copy(configuration)
        self._dump_multiple_select(configuration, schema)

        # update
        try:
            self._update(type_name, copy.copy(configuration))
        except HTTPError as exc:
            if 'HTTPError: HTTP 404 Not Found' in str(exc):
                # not exists, go to create
                pass
            else:
                return exc
        except Exception as exc:
            return exc
        else:
            return None

        # create
        try:
            self._create(type_name, configuration)
        except Exception as exc:
            return exc
        else:
            return None

    def _create(self, type_name, configuration):
        self._save_endpoint(
            type_name,
            configuration,
        )

    def _update(self, type_name, configuration):
        name = configuration[self.ENTITY_NAME]
        del configuration[self.ENTITY_NAME]
        self._save_endpoint(
            type_name,
            configuration,
            name=name,
        )

    @classmethod
    def _filter_fields(cls, entity):
        for (k, v) in entity.items():
            if k in cls.FILTERS:
                del entity[k]

    def _load_endpoint(self, name, schema):
        response = self._client.get(
            RestHandler.path_segment(self._endpoint_path(name)),
            output_mode='json'
        )
        body = response.body.read()
        cont = json.loads(body)

        entities = []
        for entry in cont['entry']:
            entity = entry['content']
            entity[self.ENTITY_NAME] = entry['name']
            self._load_multiple_select(entity, schema)
            entities.append(entity)
        return entities

    def _save_endpoint(self, endpoint, content, name=None):
        endpoint = self._endpoint_path(endpoint)
        self._client.post(
            RestHandler.path_segment(endpoint, name=name),
            **content
        )

    @classmethod
    def _load_multiple_select(cls, entity, schema):
        for field in schema:
            field_type = field.get('type')
            value = entity.get(field['field'])
            if field_type != 'multipleSelect' or not value:
                continue
            delimiter = field['options']['delimiter']
            entity[field['field']] = value.split(delimiter)

    @classmethod
    def _dump_multiple_select(cls, entity, schema):
        for field in schema:
            field_type = field.get('type')
            value = entity.get(field['field'])
            if field_type != 'multipleSelect' or not value:
                continue
            if not isinstance(value, list):
                continue
            delimiter = field['options']['delimiter']
            entity[field['field']] = delimiter.join(value)

    def _endpoint_path(self, name):
        return '{admin_match}/{endpoint_name}'.format(
            admin_match=self._schema.admin_match,
            endpoint_name=RestSchema.endpoint_name(
                name,
                self._schema.namespace
            )
        )

    def _search_configuration_schema(self, type_name, configuration_name):
        for item in self.internal_schema:
            if item['name'] == type_name:
                return item['entity']
        else:
            raise GlobalConfigError(
                'Schema Not Found for Configuration, '
                'configuration_type={configuration_type}, '
                'configuration_name={configuration_name}'.format(
                    configuration_type=type_name,
                    configuration_name=configuration_name,
                ),
            )


class Inputs(Configuration):

    def __init__(self, splunkd_client, schema):
        super(Inputs, self).__init__(splunkd_client, schema)
        self._references = Configs(splunkd_client, schema).load()

    def load(self, input_type=None):
        inputs = {}
        for input_item in self.internal_schema:
            if input_type is None or input_item['name'] == input_type:
                input_entities = self._load_endpoint(
                    input_item['name'],
                    input_item['entity']
                )
                # filter unused fields in response
                for input_entity in input_entities:
                    self._filter_fields(input_entity)
                # expand referenced entity
                self._reference(
                    input_entities,
                    input_item,
                    self._references,
                )
                inputs[input_item['name']] = input_entities
        return inputs

    @property
    def internal_schema(self):
        return self._schema.inputs

    @classmethod
    def _reference(
        cls,
        input_entities,
        input_item,
        configs
    ):
        for input_entity in input_entities:
            cls._input_reference(
                input_item['name'],
                input_entity,
                input_item['entity'],
                configs
            )

    @classmethod
    def _input_reference(
        cls,
        input_type,
        input_entity,
        input_schema,
        configs
    ):
        for field in input_schema:
            options = field.get('options', {})
            config_type = options.get('referenceName')
            config_name = input_entity.get(field['field'])
            if not config_type or not config_name:
                continue

            for config in configs.get(config_type, []):
                if config['name'] == config_name:
                    input_entity[field['field']] = config
                    break
            else:
                raise GlobalConfigError(
                    'Config Not Found for Input, '
                    'input_type={input_type}, '
                    'input_name={input_name}, '
                    'config_type={config_type}, '
                    'config_name={config_name}'.format(
                        input_type=input_type,
                        input_name=input_entity['name'],
                        config_type=config_type,
                        config_name=config_name
                    )
                )


class Configs(Configuration):

    def load(self, config_type=None):
        configs = {}
        for config in self.internal_schema:
            if config_type is None or config['name'] == config_type:
                config_entities = self._load_endpoint(
                    config['name'],
                    config['entity']
                )
                for config_entity in config_entities:
                    self._filter_fields(config_entity)
                configs[config['name']] = config_entities
        return configs

    @property
    def internal_schema(self):
        return self._schema.configs


class Settings(Configuration):

    TYPE_NAME = u'settings'

    def load(self):
        settings = []
        for setting in self.internal_schema:
            setting_entity = self._load_endpoint(
                'settings/%s' % setting['name'],
                setting['entity']
            )
            self._load_multiple_select(
                setting_entity[0],
                setting['entity']
            )
            entity = setting_entity[0]
            self._filter_fields(entity)
            settings.append(entity)
        return {Settings.TYPE_NAME: settings}

    @property
    def internal_schema(self):
        return self._schema.settings

    def _search_configuration_schema(self, type_name, configuration_name):
        return super(Settings, self)._search_configuration_schema(
            configuration_name,
            configuration_name,
        )
