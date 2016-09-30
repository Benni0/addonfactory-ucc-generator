# This script triggers tests on appropriate codeline (passed from command line)

function invoke_plan()
{
curl -X POST --user soln-test:bamboo -d bamboo.variable.CODELINE=$CODELINE app-bamboo2:8085/rest/api/latest/queue/${1}?os_authType=basic
}

# Functional Tests
invoke_plan SO-OPF

# JSHINT
invoke_plan SO-OPSECJSHINT
