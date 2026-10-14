# SkillDocker Community Edition Physical Isolation & Build Verification Gate
# Proves that Community edition can build, test, and package cleanly without src/pro/
# Usage:
#   .\scripts\verify-community.ps1

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$global:commSummary = @()
$totalStart = [System.Diagnostics.Stopwatch]::StartNew()

function Log-CommStep {
    param(
        [string]$StepName,
        [scriptblock]$Action
    )
    Write-Host "`n>>> [COMMUNITY-GATE] Running: $StepName..." -ForegroundColor Cyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    & $Action
    $exitCode = $LASTEXITCODE
    if ($null -eq $exitCode) { $exitCode = 0 }

    $sw.Stop()
    $dur = "{0:N2}s" -f $sw.Elapsed.TotalSeconds

    if ($exitCode -ne 0) {
        Write-Host ">>> [FAILED] Community Gate Failed: $StepName (Exit code: $exitCode)" -ForegroundColor Red
        $global:commSummary += [PSCustomObject]@{
            Step     = $StepName
            Status   = "FAILED"
            Duration = $dur
        }
        Show-CommSummary
        throw "Community verification step failed: $StepName"
    }

    Write-Host ">>> [PASSED] $StepName (Duration: $dur)" -ForegroundColor Green
    $global:commSummary += [PSCustomObject]@{
        Step     = $StepName
        Status   = "PASSED"
        Duration = $dur
    }
}

function Show-CommSummary {
    Write-Host "`n================================================================================" -ForegroundColor Yellow
    Write-Host "               SkillDocker Community Edition Isolation Summary                  " -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor Yellow
    $global:commSummary | Format-Table -AutoSize | Out-String | Write-Host
    $totalStart.Stop()
    $totalSec = "{0:N2}s" -f $totalStart.Elapsed.TotalSeconds
    Write-Host "Total isolation check time: $totalSec`n" -ForegroundColor DarkGray
}

function Get-DynamicProSignatures {
    param(
        [string]$ProPath,
        [string]$CorePath
    )

    if (-not (Test-Path $ProPath)) {
        throw "Cannot extract signatures: Pro directory not found at $ProPath"
    }

    # 1. Collect non-pro source text to filter against
    $coreFiles = Get-ChildItem -Path $CorePath -Recurse -File -Include *.ts, *.tsx | Where-Object {
        $_.FullName -notmatch '[\\/]src[\\/]pro[\\/]'
    }
    $coreTextBuilder = [System.Text.StringBuilder]::new()
    foreach ($cf in $coreFiles) {
        [void]$coreTextBuilder.Append([System.IO.File]::ReadAllText($cf.FullName))
        [void]$coreTextBuilder.Append("`n")
    }
    $coreText = $coreTextBuilder.ToString()

    # 2. Extract candidate signatures from src/pro/
    $proFiles = Get-ChildItem -Path $ProPath -Recurse -File -Include *.ts, *.tsx
    $candidateSignatures = [System.Collections.Generic.HashSet[string]]::new()

    foreach ($pf in $proFiles) {
        $text = [System.IO.File]::ReadAllText($pf.FullName)

        # Chinese phrases between 6 and 40 characters
        $zhMatches = [regex]::Matches($text, '[\u4e00-\u9fa5]{6,40}')
        foreach ($m in $zhMatches) {
            [void]$candidateSignatures.Add($m.Value)
        }

        # Quoted literal strings >= 12 characters
        $strMatches = [regex]::Matches($text, '["''`]([^"''`\r\n]{12,60})["''`]')
        foreach ($m in $strMatches) {
            $val = $m.Groups[1].Value.Trim()
            if ($val -notmatch '^(\.\/|\.\.\/|import |export |https?:\/\/|<|\/)' -and $val -notmatch '^[a-zA-Z0-9_\-\.\/]+$') {
                [void]$candidateSignatures.Add($val)
            }
        }
    }

    # 3. Filter out any candidate that also exists in core code
    $exclusiveSignatures = @()
    foreach ($cand in $candidateSignatures) {
        if (-not $coreText.Contains($cand)) {
            $exclusiveSignatures += $cand
        }
    }

    if ($exclusiveSignatures.Count -lt 5) {
        throw "Failed to extract sufficient Pro exclusive signatures (found $($exclusiveSignatures.Count))."
    }

    return $exclusiveSignatures
}

function Audit-BundleSignatures {
    param(
        [string]$DistPath,
        [string[]]$Signatures
    )
    $jsFiles = Get-ChildItem -Path $DistPath -Filter "*.js" -Recurse
    if ($jsFiles.Count -eq 0) {
        throw "No JS bundles found in $DistPath!"
    }
    $hits = @()
    foreach ($file in $jsFiles) {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        foreach ($sig in $Signatures) {
            if ($content.Contains($sig)) {
                $hits += [PSCustomObject]@{
                    File = $file.Name
                    Signature = $sig
                }
            }
        }
    }
    return $hits
}

$tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ("skilldocker-comm-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

try {
    # 1. Export clean git archive from HEAD (no uncommitted/untracked files)
    Write-Host "[1/6] Exporting clean git archive from current commit to sandbox: $tmpDir" -ForegroundColor Yellow
    $tarFile = Join-Path $tmpDir "archive.tar"
    git archive HEAD -o $tarFile
    tar -xf $tarFile -C $tmpDir
    Remove-Item -Force $tarFile

    # 2. Extract dynamic Pro signatures from current src/pro
    Write-Host "[2/6] Dynamically deriving Pro proprietary signatures from src/pro (excluding core)..." -ForegroundColor Yellow
    $proSignatures = Get-DynamicProSignatures -ProPath (Join-Path $tmpDir "src\pro") -CorePath (Join-Path $tmpDir "src")
    Write-Host "  -> Derived $($proSignatures.Count) Pro-exclusive signatures for anti-leak verification." -ForegroundColor DarkGray

    # Mount node_modules via NTFS Junction
    $tmpNodeModules = Join-Path $tmpDir "node_modules"
    $realNodeModules = Join-Path $repoRoot "node_modules"
    if (Test-Path $realNodeModules) {
        New-Item -ItemType Junction -Path $tmpNodeModules -Target $realNodeModules | Out-Null
    } else {
        throw "node_modules not found in $repoRoot. Run npm install first."
    }

    # Switch working directory to sandbox
    Set-Location $tmpDir

    # 3. Efficacy Verification: Ensure dynamic signatures actually detect Pro code in Pro build
    Log-CommStep "1. Audit Efficacy Proof (Signatures must detect Pro code in Pro build)" {
        $env:SKILLDOCKER_EDITION = "pro"
        cmd /c "npx vite build"
        $proHits = Audit-BundleSignatures -DistPath (Join-Path $tmpDir "dist\assets") -Signatures $proSignatures
        if ($proHits.Count -eq 0) {
            throw "Efficacy proof failed: Derived Pro signatures did not hit any code in Pro build!"
        }
        Write-Host "  -> Efficacy verified: $($proHits.Count) signature hits in Pro build bundle." -ForegroundColor Green
    }

    # 4. Physically remove src/pro/ and Pro test files
    Write-Host "[4/6] Physically removing src/pro/ and Pro test files from sandbox..." -ForegroundColor Yellow
    $proDir = Join-Path $tmpDir "src\pro"
    if (Test-Path $proDir) {
        Remove-Item -Recurse -Force $proDir
        Write-Host "  -> Physically deleted src/pro/ (Zero pro source files remaining)" -ForegroundColor DarkGray
    }

    $proTests = Get-ChildItem -Path (Join-Path $tmpDir "tests") -Filter "*pro*.mjs" -File
    foreach ($pt in $proTests) {
        Remove-Item -Force $pt.FullName
        Write-Host "  -> Physically deleted pro test: $($pt.Name)" -ForegroundColor DarkGray
    }

    $env:SKILLDOCKER_EDITION = "community"

    # 5. TypeScript Compile Check without src/pro/
    Log-CommStep "2. Community TypeScript Compile (npx tsc --noEmit)" {
        cmd /c "npx tsc --noEmit"
    }

    # 6. ESLint Check without src/pro/
    Log-CommStep "3. Community ESLint (npx eslint src --max-warnings 0)" {
        cmd /c "npx eslint src --max-warnings 0"
    }

    # 7. Core Engine Tests without src/pro/
    Log-CommStep "4. Community Engine Tests (node tests/test-engine.mjs)" {
        cmd /c "node --experimental-strip-types tests/test-engine.mjs"
    }

    # 8. Production Build in Community Mode
    Log-CommStep "5. Community Frontend Production Build (npx vite build)" {
        cmd /c "npx vite build"
    }

    # 9. Rigorous Anti-Tamper & Pro Feature Elimination Audit on Community Build
    Log-CommStep "6. Bundled Artifact Anti-Leak Audit (Zero Pro Code in dist)" {
        $commHits = Audit-BundleSignatures -DistPath (Join-Path $tmpDir "dist\assets") -Signatures $proSignatures
        if ($commHits.Count -gt 0) {
            foreach ($h in $commHits) {
                Write-Host ">>> [VIOLATION] Found Pro signature '$($h.Signature)' in $($h.File)" -ForegroundColor Red
            }
            throw "Community bundle contains Pro proprietary code characteristics!"
        }
        Write-Host "  -> Verified $($proSignatures.Count) dynamic Pro signature rules: 100% CLEAN (0 hits)" -ForegroundColor Green
    }

    Show-CommSummary
    Write-Host "SUCCESS: Community Edition successfully verified in complete physical isolation!`n" -ForegroundColor Green
}
finally {
    Set-Location $repoRoot
    # Safely detach junction first, with strict ReparsePoint verification
    if (Test-Path -LiteralPath $tmpDir) {
        $tmpNodeModules = Join-Path $tmpDir "node_modules"
        $junctionConfirmed = $false

        if (Test-Path -LiteralPath $tmpNodeModules) {
            $item = Get-Item -LiteralPath $tmpNodeModules -Force -ErrorAction SilentlyContinue
            if ($item -and ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
                $junctionConfirmed = $true
                cmd /c "rmdir `"$tmpNodeModules`"" | Out-Null
            } else {
                Write-Host "[ERROR] Target node_modules exists but cannot be verified as an NTFS Junction!" -ForegroundColor Red
            }
        } else {
            # node_modules was never mounted or already gone
            $junctionConfirmed = $true
        }

        # Rigorously verify that the node_modules junction no longer exists
        $nodeModulesStillExists = (Test-Path -LiteralPath $tmpNodeModules) -or
            [System.IO.Directory]::Exists($tmpNodeModules) -or
            [System.IO.File]::Exists($tmpNodeModules)

        if ($nodeModulesStillExists -or (-not $junctionConfirmed)) {
            Write-Host "`n================================================================================" -ForegroundColor Red
            Write-Host "[CLEANUP HALTED] Cannot confirm node_modules junction was safely unlinked!" -ForegroundColor Red
            Write-Host "To protect host node_modules, sandbox directory was preserved." -ForegroundColor Red
            Write-Host "Manual cleanup required for path:" -ForegroundColor Yellow
            Write-Host "  $tmpDir" -ForegroundColor White
            Write-Host "================================================================================`n" -ForegroundColor Red
            exit 1
        } else {
            try {
                Remove-Item -LiteralPath $tmpDir -Recurse -Force -ErrorAction Stop
            } catch {
                Write-Host "`n[WARNING] Sandbox removal encountered an error: $($_.Exception.Message)" -ForegroundColor Yellow
                Write-Host "Manual cleanup required for path: $tmpDir" -ForegroundColor Yellow
                exit 1
            }
        }
    }
}
exit 0
