param([switch]$Build)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $repoRoot
$listener = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host 'Port 3000 is already running. Open http://127.0.0.1:3000/en/login'
    Write-Host 'To rebuild, stop the existing server first, then run this script with -Build.'
    exit 0
}
# SWC requires a private cache whose parent is not a shared temporary folder.
$taskCache = Join-Path $env:USERPROFILE '.firstfruits-swc-cache'
if (!(Test-Path -LiteralPath $taskCache)) {
    New-Item -ItemType Directory -Path $taskCache | Out-Null
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl = New-Object System.Security.AccessControl.DirectorySecurity
    $acl.SetOwner($identity)
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $acl.AddAccessRule($rule)
    Set-Acl -LiteralPath $taskCache -AclObject $acl
}
$env:SWC_NATIVE_BINDING_CACHE = $taskCache
if ($Build -or !(Test-Path -LiteralPath '.next/BUILD_ID')) {
    & node node_modules/next/dist/bin/next build
    if ($LASTEXITCODE -ne 0) { throw 'Build failed. The local test server was not started.' }
}
Write-Host 'First Fruits local test environment: http://127.0.0.1:3000/en/login'
Write-Host 'Keep this window open during testing. Press Ctrl+C to stop.'
& node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
exit $LASTEXITCODE
