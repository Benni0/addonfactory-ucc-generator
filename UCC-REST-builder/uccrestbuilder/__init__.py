"""
REST Builder.
"""

from __future__ import absolute_import

from .builder import (
    RestBuilder,
    RestSchema,
    RestBuilderError,
)

__all__ = [
    'RestBuilder',
    'RestSchema',
    'RestBuilderError',
    'build',
]

__version__ = '1.0.0'


def build(schema, handler, output_path):
    """
    Build REST for Add-on.

    :param schema: REST schema.
    :type schema: RestSchema
    :param handler: REST handler class, subclass of
        ``rest_handler.RestHandler``.
    :param output_path: path for output.
    :return:
    """
    builder_obj = RestBuilder(schema, handler, output_path)
    builder_obj.build()
    return builder_obj
