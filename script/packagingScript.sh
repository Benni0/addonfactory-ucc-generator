#!/bin/sh

echo "Initializing Packaging tool"

echo "Checking for python 3"
if ! python3 -v &> /dev/null
then
    echo "Python3 could not be found"
    echo "Installing python 3"
    pwd_var=`pwd`
    echo "Getting dependencies"
    # sudo yum -y install gcc openssl-devel bzip2-devel libffi-devel
    sudo apt-get -qq update > /dev/null
    sudo apt-get -qq install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libreadline-dev libffi-dev curl libbz2-dev > /dev/null
    cd /usr/src
    echo "Getting Python 3.7 binaries"
    sudo wget https://www.python.org/ftp/python/3.7.9/Python-3.7.9.tgz > /dev/null
    sudo tar xzf Python-3.7.9.tgz > /dev/null
    cd Python-3.7.9 
    sudo ./configure --enable-optimizations > /dev/null
    sudo make altinstall > /dev/null
    sudo rm -f /usr/src/Python-3.7.9.tgz
    echo "Generating alias"
    alias python3='python3.7'
    alias pip3='pip3.7'
    . ~/.bashrc
    if python3 -v &> /dev/null
    then
        echo "Python Installed"
    fi
    cd $pwd_var
fi

echo "Installing Virtual Environment"
pip3 install virtualenv > /dev/null
python3 -m virtualenv .venv -p python3 > /dev/null
. .venv/bin/activate
echo "Virtual Environment Installed and Activated"

echo "Installing Dependencies"
sudo apt-get -qq install python-pip > /dev/null
sudo apt-get -qq install -y libxml2-dev libxslt-dev lib32z1-dev python-lxml > /dev/null
pip2 install "virtualenv<17.0.0,>=16.7.9" --upgrade > /dev/null
echo "Getting Python Poetry"
pip3 -q install poetry > /dev/null
cd splunk-add-on-sdk-python
poetry install
poetry run build-ucc
poetry build
pip3 install dist/splunk_add_on_ucc_framework-0.1.0.tar.gz

ucc-gen --source ../package/ --config ../package/appserver/static/js/build/globalConfig.json
ls --all -l ../package/
ls --all -l ../package/appserver/static/js/build/