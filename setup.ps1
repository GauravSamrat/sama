Set-Location $PSScriptRoot
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Install Node.js 22 or later and reopen PowerShell.' }
node -e "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if ($LASTEXITCODE -ne 0) { throw 'Node.js 22 or later is required.' }
node build.js
exit $LASTEXITCODE
