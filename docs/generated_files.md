---
title: UCC framework generated files
---

Below table describes the files generated by UCC framework

## File Description

| File Name  | File Location | File Description |
| ------------ | ------------ | ----------------- |
| configuration.xml | output/&lt;YOUR_ADDON_NAME&gt;/default/data/ui/views | Generates configuration.xml file in `default/data/ui/views/` folder if globalConfig is present. |
| dashboard.xml | output/&lt;YOUR_ADDON_NAME&gt;/default/data/ui/views | Generates dashboard.xml file based on dashboard configuration present in globalConfig in `default/data/ui/views` folder. |
| default.xml | output/&lt;YOUR_ADDON_NAME&gt;/default/data/ui/nav | Generates default.xml file based on configs present in globalConfigin in `default/data/ui/nav` folder. |
| inputs.xml | output/&lt;YOUR_ADDON_NAME&gt;/default/data/ui/views | Generates inputs.xml based on inputs configuration present in globalConfig, in `default/data/ui/views/inputs.xml` folder |
| _redirect.xml | output/&lt;YOUR_ADDON_NAME&gt;/default/data/ui/views | Generates ta_name_redirect.xml file, if oauth is mentioned in globalConfig,in `default/data/ui/views/` folder. |
| _.html | output/&lt;YOUR_ADDON_NAME&gt;/default/data/ui/alerts | Generates `alert_name.html` file based on alerts configuration present in globalConfig in `default/data/ui/alerts` folder. |

