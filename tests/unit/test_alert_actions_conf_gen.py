#
# Copyright 2021 Splunk Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
import os
import unittest
from unittest import mock

from splunk_add_on_ucc_framework.modular_alert_builder.build_core import (
    alert_actions_conf_gen,
)
from tests.unit.helpers import get_testdata_file


class AlertActionsConfGenTest(unittest.TestCase):
    def test_generate_alert_action(self):
        generated = alert_actions_conf_gen.generate_alert_actions_conf(
            input_setting={
                "product_id": "Splunk_TA_UCCExample",
                "short_name": "splunk_ta_uccexample",
                "modular_alerts": [
                    {
                        "label": "Test Alert",
                        "description": "Description for test Alert Action",
                        "short_name": "test_alert",
                        "active_response": {
                            "task": ["Create", "Update"],
                            "subject": ["endpoint"],
                            "category": [
                                "Information Conveyance",
                                "Information Portrayal",
                            ],
                            "technology": [
                                {
                                    "version": ["1.0.0"],
                                    "product": "Test Incident Update",
                                    "vendor": "Splunk",
                                }
                            ],
                            "sourcetype": "test:incident",
                            "supports_adhoc": True,
                            "drilldown_uri": 'search?q=search%20index%3D"_internal"&earliest=0&latest=',
                        },
                        "parameters": [
                            {
                                "label": "Name",
                                "required": True,
                                "format_type": "text",
                                "name": "name",
                                "default_value": "xyz",
                                "help_string": "Please enter your name",
                            },
                            {
                                "label": "All Incidents",
                                "required": False,
                                "format_type": "checkbox",
                                "name": "all_incidents",
                                "default_value": 0,
                                "help_string": "Tick if you want to update all incidents/problems",
                            },
                            {
                                "label": "Table List",
                                "required": False,
                                "format_type": "dropdownlist",
                                "name": "table_list",
                                "help_string": "Please select the table",
                                "default_value": "problem",
                                "possible_values": {
                                    "incident": "Incident",
                                    "problem": "Problem",
                                },
                            },
                            {
                                "label": "Action:",
                                "required": True,
                                "format_type": "radio",
                                "name": "action",
                                "help_string": "Select the action you want to perform",
                                "default_value": "two",
                                "possible_values": {
                                    "update": "Update",
                                    "delete": "Delete",
                                },
                            },
                            {
                                "label": "Select Account",
                                "required": True,
                                "format_type": "dropdownlist_splunk_search",
                                "name": "account",
                                "help_string": "Select the account from the dropdown",
                                "ctrl_props": {
                                    "value-field": "title",
                                    "label-field": "title",
                                    "search": "| rest /servicesNS/nobody/TA-SNOW/admin/TA_SNOW_account | dedup title",
                                },
                            },
                        ],
                        "alert_props": {
                            "python.version": "python3",
                            "is_custom": 1,
                            "payload_format": "json",
                        },
                    }
                ],
            },
            logger=mock.MagicMock(),
            package_path=os.path.dirname(__file__),
        )
        expected_alert_actions_conf = get_testdata_file("alert_actions.conf.generated")
        self.assertEqual(expected_alert_actions_conf, generated["alert_actions.conf"])
        expected_alert_actions_conf_spec = get_testdata_file(
            "alert_actions.conf.spec.generated"
        )
        self.assertEqual(
            expected_alert_actions_conf_spec, generated["alert_actions.conf.spec"]
        )
        expected_eventtypes_conf = get_testdata_file("eventtypes.conf.generated")
        self.assertEqual(expected_eventtypes_conf, generated["eventtypes.conf"])
        expected_tags_conf = get_testdata_file("tags.conf.generated")
        self.assertEqual(expected_tags_conf, generated["tags.conf"])