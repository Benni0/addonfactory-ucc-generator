# splunk-add-on-ucc-framework

![PyPI](https://img.shields.io/pypi/v/splunk-add-on-ucc-framework)
![Python](https://img.shields.io/pypi/pyversions/splunk-add-on-ucc-framework.svg)

A framework to generate a template for Add-ons. It includes UI, Rest handler, Modular input, Oauth, Alert action templates.

## Features

- Generate ucc based addons for your Splunk Technology Add-ons

## Requirements

- Addon package and globalConfig.json file

## Installation

You can install "splunk-add-on-ucc-framework" via `pip` from `PyPI`:

```bash
$ pip3 install splunk-add-on-ucc-framework
```
## How to use

To build the ucc based addon follow the below steps:

1. Install the `splunk-add-on-ucc-framework` via `pip3`
2. Navigate to the root directory of addon where package folder is present
3. Make sure globalConfig.json file is present in the root directory of an addon
4. Run the `ucc-gen` command
5. The addon will be generated, at `output` directory of an addon

## Workflow
By the running the `ucc-gen` command, the following steps came in action.
1. Cleaning out the `output` directory
2. Retrieve the package ID of addon
3. Copy UCC template directory under `output/<package_ID>` directory
4. Copy globalConfig to `output/<package_ID>/appserver/static/js/build` directory
5. Collect and install UCC Requirements into `output/<package_ID>/lib` directory of addon's package
6. Collect and install Addon's Requirements into `output/<package_ID>/lib` directory of addon's package
7. For the addon's requirements, `requirements.txt` file will fetch both python compatible packages and install it in `output/<package_ID>/lib` directory where `requirements_py2.txt` and `requirements_py3.txt` files install the python2, python3 specific packages and in installing in `py2`, `py3` directory under the `lib` directory respectively. 
8. Replace tokens in views
9. Copy source package to `output/<package_ID>` directory

## Params

splunk-add-on-ucc-framework supports the following params:
| Name       | Description                                                                                              |
|------------|----------------------------------------------------------------------------------------------------------|
| source     | Folder containing the app.manifest and app source                                                        |
| config     | Path to the configuration file, Defaults to GlobalConfig.json in the parent directory of source provided |
| ta-version | Current version of TA, Default version is version specified in globalConfig.json                         |
