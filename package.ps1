$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
node build.js
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$archive = 'SAMA-v1.0.0-Final.zip'
$entries = @(
    '.gitignore', 'assets', 'locales', 'dist', 'app.js', 'studio.js', 'styles.css',
    'build.js', 'server.js', 'test.js', 'browser-test.js',
    'setup.ps1', 'run.ps1', 'test.ps1', 'build.ps1', 'package.ps1',
    'README.md', 'TEST_REPORT.md', 'BRAND_GUIDE.md', 'CONTENT_GUIDE.md',
    'PAYMENT_GUIDE.md', 'DEPLOYMENT.md', 'CHANGELOG.md', 'LICENSE'
)
tar.exe -a -cf $archive -- @entries
if ($LASTEXITCODE -ne 0) { throw 'ZIP creation failed.' }

$verification = Join-Path ([IO.Path]::GetTempPath()) ([guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $verification | Out-Null
tar.exe -xf $archive -C $verification
if ($LASTEXITCODE -ne 0) { throw 'ZIP extraction failed.' }

foreach ($entry in $entries) {
    $source = Get-Item -LiteralPath (Join-Path $PSScriptRoot $entry) -Force
    $target = Join-Path $verification $entry
    if ($source.PSIsContainer) {
        $extracted = @(Get-ChildItem -LiteralPath $target -File -Recurse -Force)
        $original = @(Get-ChildItem -LiteralPath $source.FullName -File -Recurse -Force)
        if ($original.Count -ne $extracted.Count) { throw "ZIP file count mismatch: $entry" }
        foreach ($file in $original) {
            $relative = $file.FullName.Substring($source.FullName.Length + 1)
            $expected = (Get-FileHash -LiteralPath $file.FullName).Hash
            $actual = (Get-FileHash -LiteralPath (Join-Path $target $relative)).Hash
            if ($expected -ne $actual) { throw "ZIP hash mismatch: $entry/$relative" }
        }
    } elseif ((Get-FileHash -LiteralPath $source.FullName).Hash -ne (Get-FileHash -LiteralPath $target).Hash) {
        throw "ZIP hash mismatch: $entry"
    }
}

$resolved = (Resolve-Path -LiteralPath $verification).Path
if ($resolved -eq $verification -and [IO.Path]::GetFileName($resolved) -match '^[0-9a-f-]{36}$') {
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
Get-FileHash -LiteralPath $archive

