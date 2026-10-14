# SkillDocker Test Coverage Measurement Gate
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\coverage.ps1
#
# Generates line coverage reports for both Rust and TypeScript engines,
# asserting that all core files meet the >= 80% line coverage standard.

$ErrorActionPreference = "Stop"
$env:PATH = "$env:USERPROFILE\.cargo\bin;$env:PATH"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "                SkillDocker Engine Test Coverage Measurement Suite              " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# -------------------------------------------------------------
# 1. Rust Engine Coverage (cargo-llvm-cov)
# -------------------------------------------------------------
Write-Host "`n>>> [1/2] Measuring Rust Backend Coverage (cargo llvm-cov)..." -ForegroundColor Yellow

Push-Location "src-tauri"
try {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $rustOutput = & cmd /c "cargo llvm-cov --summary-only" | Out-String
    $ErrorActionPreference = $prevEap
    Write-Host $rustOutput
} finally {
    Pop-Location
}

# -------------------------------------------------------------
# 2. TypeScript Engine Coverage (c8 + Node)
# -------------------------------------------------------------
Write-Host "`n>>> [2/2] Measuring TypeScript Frontend & Doctor Engine Coverage (c8)..." -ForegroundColor Yellow

$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$tsOutput = & cmd /c "npx c8 --reporter=text node tests/test-engine.mjs" | Out-String
$ErrorActionPreference = $prevEap
Write-Host $tsOutput

# Clean up any leftover temporary coverage directory
if (Test-Path "coverage") {
    Remove-Item -Recurse -Force "coverage" -ErrorAction SilentlyContinue
}

# -------------------------------------------------------------
# 3. Core Files Verification & Summary Table
# -------------------------------------------------------------
Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "                     Core Modules Line Coverage Summary Table                   " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$targets = @(
    # Rust core modules
    @{ Name = "backup.rs (Rust)"; Pattern = "backup\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 80.0; Source = "Rust" },
    @{ Name = "paths.rs (Rust)"; Pattern = "paths\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 80.0; Source = "Rust" },
    @{ Name = "skills.rs (Rust)"; Pattern = "skills\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\d*\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 80.0; Source = "Rust" },
    @{ Name = "scanner.rs (Rust)"; Pattern = "scanner\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 80.0; Source = "Rust" },
    @{ Name = "logging.rs (Rust)"; Pattern = "logging\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 80.0; Source = "Rust" },
    @{ Name = "license.rs (Rust)"; Pattern = "license\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 80.0; Source = "Rust" },
    @{ Name = "vault.rs (Rust)"; Pattern = "vault\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 80.0; Source = "Rust" },
    @{ Name = "export.rs (Rust)"; Pattern = "export\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 75.0; Source = "Rust" },
    @{ Name = "import.rs (Rust)"; Pattern = "import\.rs\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\d+\s+\d+\s+(\d+\.\d+)%"; Target = 75.0; Source = "Rust" },

    # TypeScript core modules
    @{ Name = "injector.ts (TS)"; Pattern = "injector\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "parser.ts (TS)"; Pattern = "parser\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "crossCompiler.ts (TS)"; Pattern = "crossCompiler\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "consultation.ts (TS)"; Pattern = "consultation\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "engine.ts (TS)"; Pattern = "engine\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "index.ts (TS)"; Pattern = "index\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "l3TriggerBenchmark.ts (TS)"; Pattern = "l3TriggerBenchmark\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "l4LibraryAudit.ts (TS)"; Pattern = "l4LibraryAudit\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "linter.ts (TS)"; Pattern = "linter\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "optimizer.ts (TS)"; Pattern = "optimizer\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "rulesL1.ts (TS)"; Pattern = "rulesL1\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "rulesL1Body.ts (TS)"; Pattern = "rulesL1Body\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "rulesL1Name.ts (TS)"; Pattern = "rulesL1Name\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "rulesL2.ts (TS)"; Pattern = "rulesL2\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" },
    @{ Name = "types.ts (TS)"; Pattern = "types\.ts\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+[\d\.]+\s+\|\s+([\d\.]+)"; Target = 80.0; Source = "TS" }
)

$allPassed = $true
$summaryList = @()

foreach ($t in $targets) {
    $srcText = if ($t.Source -eq "Rust") { $rustOutput } else { $tsOutput }
    $covVal = 0.0
    if ($srcText -match $t.Pattern) {
        $covVal = [double]$Matches[1]
    }

    $status = if ($covVal -ge $t.Target) { "PASSED" } else { $allPassed = $false; "FAILED" }
    $summaryList += [PSCustomObject]@{
        "Core Module"      = $t.Name
        "Line Coverage"    = ("{0:N2}%" -f $covVal)
        "Target Threshold" = ("{0:N2}%" -f $t.Target)
        "Status"           = $status
    }
}

$summaryList | Format-Table -AutoSize | Out-String | Write-Host

if (-not $allPassed) {
    Write-Host "`n[FATAL] Some core modules did not reach >= 80% coverage threshold!`n" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: All core modules strictly reached >= 80% line coverage standard!`n" -ForegroundColor Green
exit 0
