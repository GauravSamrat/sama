param([switch]$Browser)
Set-Location $PSScriptRoot
node --test test.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
if ($Browser) { node browser-test.js; exit $LASTEXITCODE }
