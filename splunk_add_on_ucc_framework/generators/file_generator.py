from abc import ABC, abstractmethod
from typing import Union, List, Dict, NoReturn
from os.path import sep, realpath
from jinja2 import Environment, FileSystemLoader, select_autoescape
from . import file_const as fc
from splunk_add_on_ucc_framework.commands.modular_alert_builder.alert_actions_helper import (
    write_file,
)
from splunk_add_on_ucc_framework.global_config import GlobalConfig

__all__ = ["FileGenerator", "begin"]


class FileGenerator(ABC):
    __description__ = "DESCRIBE THE FILE THAT IS GENERATED"

    def __init__(
        self, global_config: GlobalConfig, input_dir: str, output_dir: str, **kwargs
    ) -> None:
        """
        :param global_config: the GlobalConfig object that is validated and parsed
        :param input_dir: the path to the source code of globalConfig.(json|yaml)
        :param output_dir: the path to output/<addon_name> directory
        :param ucc_dir: the path of source code of UCC framework
        :param addon_name: the addon_name that is being generated

        """
        super().__init__()
        self._global_config = global_config
        self._input_dir = input_dir
        self._output_dir = output_dir
        self._set_attributes(**kwargs)
        self._template_dir = [(sep.join([kwargs["ucc_dir"], "templates"]))]
        self._addon_name = kwargs["addon_name"]
        self.writer = write_file

    def _set_attributes(self, **kwargs) -> NoReturn:
        raise NotImplementedError()

    @abstractmethod
    def generate(self) -> NoReturn:
        raise NotImplementedError()

    def _get_output_dir(self) -> str:
        return sep.join([realpath(self._output_dir), self._addon_name])

    def get_file_output_path(self, output_piece: Union[List[str], str]) -> str:
        if isinstance(output_piece, str):
            return sep.join([self._get_output_dir(), output_piece])
        elif isinstance(output_piece, list):
            return sep.join([self._get_output_dir()] + output_piece)

        raise TypeError(
            "Invalid type of output_piece, provided type='%s'" % (type(output_piece))
        )

    def set_template_and_render(
        self, template_file_path: List[str], file_name: str
    ) -> None:
        assert file_name.endswith(".template")
        select_autoescape(disabled_extensions=("template"))

        self._template = Environment(
            loader=FileSystemLoader(sep.join(self._template_dir + template_file_path))
        )
        self._template = self._template.get_template(file_name)


def begin(
    global_config, input_dir: str, output_dir: str, **kwargs
) -> List[Dict[str, str]]:
    generated_files = []
    for tup in fc.FILE_TUPLE:
        tup.file_class(global_config, input_dir, output_dir, **kwargs).generate()
        # logger.info(f"Successfully generated {tup.file_name}".)
        generated_files.append({tup.file_name: tup.file_path})

    return generated_files