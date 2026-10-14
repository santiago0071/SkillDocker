# SkillDocker 原生桌面端一键编译构建脚本
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SkillDocker 原生桌面端构建"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SkillDocker - 编译独立 Windows 原生应用 (SkillDocker.exe)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 注入 Rust / Cargo 环境变量
$cargoPath = "$HOME\.cargo\bin"
if (Test-Path "$cargoPath\cargo.exe") {
    $env:PATH = "$env:PATH;$cargoPath"
}

# 2. 前端构建与自检
Write-Host "[1/2] 正在执行前端构建与类型自检..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 前端构建失败，请检查报错信息。" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit $LASTEXITCODE
}

# 3. Tauri 原生二进制构建
Write-Host ""
Write-Host "[2/2] 正在调用 Rust 编译器生成纯独立 EXE (单文件免安装)..." -ForegroundColor Cyan
npx tauri build
# 如果仅是打包安装包警告但二进制已产出，依然继续校验
$targetExe = Join-Path $PSScriptRoot "src-tauri\target\release\SkillDocker.exe"
$targetExeLower = Join-Path $PSScriptRoot "src-tauri\target\release\skilldocker.exe"

if (-not (Test-Path $targetExe) -and (Test-Path $targetExeLower)) {
    $targetExe = $targetExeLower
}

if (-not (Test-Path $targetExe)) {
    Write-Host "[错误] 未在目标目录找到 SkillDocker.exe 产物。" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit 1
}

# 4. 自动部署至桌面并启动
$desktopPath = [Environment]::GetFolderPath("Desktop")
$desktopExe = Join-Path $desktopPath "SkillDocker.exe"
Copy-Item -Path $targetExe -Destination $desktopExe -Force

Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  🎉 恭喜！纯独立原生 Windows 应用已成功生成！" -ForegroundColor Green
Write-Host "  - 桌面应用位置：$desktopExe" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "正在为您立即启动 SkillDocker.exe..." -ForegroundColor Cyan
Start-Process $desktopExe
Write-Host ""
Read-Host "请按回车键完成..."
