# SkillDocker Local Verification Gate
# Usage:
#   .\scripts\verify.ps1           # Quick verification (tsc, eslint, engine, clippy, test)
#   .\scripts\verify.ps1 -Full     # Full verification (with local tauri build)

param(
    [switch]$Full
)

$ErrorActionPreference = "Stop"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$global:gateSummary = @()
$totalStart = [System.Diagnostics.Stopwatch]::StartNew()

function Run-GateStep {
    param(
        [string]$StepName,
        [scriptblock]$Action
    )

    Write-Host "`n>>> [GATE] Running: $StepName..." -ForegroundColor Cyan
    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    & $Action
    $exitCode = $LASTEXITCODE
    if ($null -eq $exitCode) { $exitCode = 0 }

    $sw.Stop()
    $dur = "{0:N2}s" -f $sw.Elapsed.TotalSeconds

    if ($exitCode -ne 0) {
        Write-Host ">>> [FAILED] Step failed: $StepName (Exit code: $exitCode)" -ForegroundColor Red
        $global:gateSummary += [PSCustomObject]@{
            Step     = $StepName
            Status   = "FAILED"
            Duration = $dur
        }
        Show-GateSummary
        Write-Host "`n[FATAL] Local verification gate failed! Aborting.`n" -ForegroundColor Red
        exit $exitCode
    }

    Write-Host ">>> [PASSED] Step passed: $StepName (Duration: $dur)" -ForegroundColor Green
    $global:gateSummary += [PSCustomObject]@{
        Step     = $StepName
        Status   = "PASSED"
        Duration = $dur
    }
}

function Show-GateSummary {
    Write-Host "`n================================================================================" -ForegroundColor Yellow
    Write-Host "                    SkillDocker Local Verification Gate Summary                 " -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor Yellow
    $global:gateSummary | Format-Table -AutoSize | Out-String | Write-Host
    $totalStart.Stop()
    $totalSec = "{0:N2}s" -f $totalStart.Elapsed.TotalSeconds
    Write-Host "Total verification time: $totalSec`n" -ForegroundColor DarkGray
}

# 1. TypeScript Compile Check
Run-GateStep "1. TypeScript Compile (npx tsc --noEmit)" { cmd /c "npx tsc --noEmit" }

# 2. ESLint Lint Check (0 Warnings)
Run-GateStep "2. ESLint Check (npx eslint src --max-warnings 0)" { cmd /c "npx eslint src --max-warnings 0" }

# 3. Core Engine & Pro Unit Tests
Run-GateStep "3. Engine & Pro Unit Tests" {
    cmd /c "node --experimental-strip-types tests/test-engine.mjs && node --experimental-strip-types tests/test-pro.mjs"
}

# 4. Community Edition Physical Isolation Gate (sandbox with src/pro/ removed)
Run-GateStep "4. Community Physical Isolation (scripts/verify-community.ps1)" {
    cmd /c "powershell -ExecutionPolicy Bypass -File scripts/verify-community.ps1"
}

# 5. Rust Format Check (cargo fmt --check)
Run-GateStep "5. Rust Format Check (cargo fmt --check)" { cmd /c "cargo fmt --manifest-path src-tauri/Cargo.toml -- --check" }

# 6. Rust Clippy (0 Warnings)
Run-GateStep "6. Rust Clippy (cargo clippy -- -D warnings)" { cmd /c "cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings" }

# 7. Rust Unit Tests
Run-GateStep "7. Rust Unit Tests (cargo test)" { cmd /c "cargo test --manifest-path src-tauri/Cargo.toml" }

# 8. Optional: Full Build
if ($Full) {
    Run-GateStep "8. Local Package Build (npx tauri build --no-bundle)" { cmd /c "npx tauri build --no-bundle" }
}

Show-GateSummary
Write-Host "SUCCESS: All verification gates passed! Code is safe to commit and push.`n" -ForegroundColor Green
exit 0
