from time import time
from typing import Any, Dict

from splunk_add_on_ucc_framework.generators.conf_files import ConfGenerator
from splunk_add_on_ucc_framework.global_config import GlobalConfig


class AppConf(ConfGenerator):
    __description__ = (
        "Generates `app.conf` with the details mentioned in globalConfig[meta]"
    )

    def __init__(
        self,
        global_config: GlobalConfig,
        input_dir: str,
        output_dir: str,
        **kwargs: Any
    ) -> None:
        super().__init__(global_config, input_dir, output_dir, **kwargs)
        self.conf_file = "app.conf"

    def _set_attributes(self, **kwargs: Any) -> None:
        self.check_for_updates = "true"
        self.custom_conf = []
        self.name = self._addon_name
        self.id = self._addon_name
        self.supported_themes = ""

        if self._global_config:
            self.custom_conf.extend(list(self._gc_schema.settings_conf_file_names))
            self.custom_conf.extend(list(self._gc_schema.configs_conf_file_names))
            self.custom_conf.extend(list(self._gc_schema.oauth_conf_file_names))

            if self._global_config.meta.get("checkForUpdates") is False:
                self.check_for_updates = "false"
            if self._global_config.meta.get("supportedThemes") is not None:
                self.supported_themes = ", ".join(
                    self._global_config.meta["supportedThemes"]
                )
            self.name = self._global_config.product
            self.id = self._global_config.product

        self.addon_version = kwargs["addon_version"]
        self.is_visible = str(kwargs["has_ui"]).lower()
        self.description = kwargs["app_manifest"].get_description()
        self.author = kwargs["app_manifest"].get_authors()[0]["name"]
        self.build = str(int(time()))

    def generate_conf(self) -> Dict[str, str]:
        file_path = self.get_file_output_path(["default", self.conf_file])
        self.set_template_and_render(
            template_file_path=["conf_files"], file_name="app_conf.template"
        )
        rendered_content = self._template.render(
            custom_conf=self.custom_conf,
            addon_version=self.addon_version,
            check_for_updates=self.check_for_updates,
            supported_themes=self.supported_themes,
            description=self.description,
            author=self.author,
            name=self.name,
            build=self.build,
            id=self.id,
            label=self.description,
            is_visible=self.is_visible,
        )
        self.writer(
            file_name=self.conf_file,
            file_path=file_path,
            content=rendered_content,
            merge_mode="item_overwrite",
        )
        return {self.conf_file: file_path}