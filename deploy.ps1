[CmdletBinding()]
param([switch]$CheckOnly)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed with exit code $LASTEXITCODE." }
}

Get-Command node -ErrorAction Stop | Out-Null
Invoke-Checked node @('-e', "if (Number(process.versions.node.split('.')[0]) < 22) process.exit(1)")
$project = (Get-Content -Raw .firebaserc | ConvertFrom-Json).projects.default
$hosting = (Get-Content -Raw firebase.json | ConvertFrom-Json).hosting
if ($project -ne 'sama-studio-01' -or $hosting.site -ne $project -or $hosting.public -ne 'dist' -or $hosting.rewrites) {
    throw 'Firebase target must be the existing SAMA Hosting site using dist and static routing.'
}

if (-not $CheckOnly) {
    Invoke-Checked node @('-e', "if (require('./studio').editorialPreview) { console.error('Review journal drafts and disable editorialPreview before a public deploy.'); process.exit(1); }")
    Get-Command firebase -ErrorAction Stop | Out-Null
    $sites = firebase hosting:sites:list --project $project --json
    if ($LASTEXITCODE -ne 0) { throw 'Firebase site check failed. Run firebase login and verify project access.' }
    $registered = ($sites | ConvertFrom-Json).result.sites
    if (-not ($registered | Where-Object { $_.name -match "/sites/$project$" -and $_.defaultUrl -eq "https://$project.web.app" })) {
        throw 'The expected Firebase Hosting site or URL could not be verified.'
    }
}

Invoke-Checked node @('--test', 'test.js')
Invoke-Checked node @('browser-test.js')
Invoke-Checked node @('build.js')

$root = Join-Path $PSScriptRoot 'dist'
$files = @(Get-ChildItem -LiteralPath $root -Recurse -File -Force)
$pages = @(Get-ChildItem -LiteralPath (Join-Path $root 'en'), (Join-Path $root 'hi'), (Join-Path $root 'bn') -Filter index.html -Recurse -File)
$expected = node -p "const b=require('./build'); b.routes.length*b.langs.length"
if ($LASTEXITCODE -ne 0 -or $pages.Count -ne [int]$expected) { throw "Expected $expected localized pages. Found $($pages.Count)." }
$credentials = 'BEGIN [A-Z ]*PRIVATE KEY|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|sk_live_[A-Za-z0-9]{12,}|sk-or-v1-[a-z0-9]{24,}|gsk_[A-Za-z0-9]{24,}|AIza[0-9A-Za-z_-]{35}|Citta-Reader'
foreach ($file in $files) {
    $relative = $file.FullName.Substring($root.Length + 1).Replace('\','/')
    if ($relative -notmatch '^(?:(?:en|hi|bn)/[a-z/-]*?(?:index|404)\.html|(?:index|404)\.html|app\.js|styles\.css|manifest\.webmanifest|robots\.txt|sitemap\.xml|_headers|assets/(?:README\.md|[a-z0-9/-]+\.(?:svg|png|webp|avif|jpg|jpeg|vtt|mp4|webm)))$') {
        throw "Unexpected production file: $relative"
    }
    if ($file.Extension -in '.html','.js','.css','.txt','.xml','.svg','.md','.vtt' -or $file.Name -eq '_headers') {
        if (Select-String -LiteralPath $file.FullName -Pattern $credentials -Quiet) {
            throw "Possible credential or private repository reference in $relative. Review before deployment."
        }
    }
}
Write-Host "Verified $($pages.Count) localized pages and $($files.Count) production files."
if ($CheckOnly) { return }

Invoke-Checked firebase @('deploy', '--only', 'hosting', '--project', $project, '--non-interactive')
Write-Host "SAMA https://$project.web.app/"
