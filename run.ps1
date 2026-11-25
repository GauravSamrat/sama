Set-Location $PSScriptRoot
node build.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node server.js
exit $LASTEXITCODE
