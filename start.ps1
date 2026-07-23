<#
.SYNOPSIS
  测井专业智能培训系统 - 一键启动脚本
.DESCRIPTION
  交互式菜单, 支持开发/生产模式
#>

#Requires -Version 5.1

$PROJECT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$SERVER_URL = "http://localhost:3000"
$DEFAULT_ACCOUNTS = "管理员: admin / admin123 | 学员: student / student123"

function Write-Title {
    param([string]$Text)
    $w = 56
    Write-Host ""
    Write-Host ("=" * $w) -ForegroundColor DarkCyan
    Write-Host (" " * [Math]::Max(1, [Math]::Floor(($w - $Text.Length - 2) / 2))) -NoNewline
    Write-Host " $Text " -ForegroundColor Cyan
    Write-Host ("=" * $w) -ForegroundColor DarkCyan
}

function Write-OK {
    param([string]$Msg)
    Write-Host "  [+] $Msg" -ForegroundColor Green
}

function Write-Info {
    param([string]$Msg)
    Write-Host "  [i] $Msg" -ForegroundColor DarkYellow
}

function Write-Fail {
    param([string]$Msg)
    Write-Host "  [x] $Msg" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Title "环境检查"

    try {
        $v = node --version
        Write-OK "Node.js $v"
    } catch {
        Write-Fail "Node.js 未安装! 请先安装 Node.js 16+"
        return $false
    }

    try {
        $v = npm --version
        Write-OK "npm v$v"
    } catch {
        Write-Fail "npm 不可用"
        return $false
    }

    $nm = Join-Path $PROJECT_DIR "node_modules"
    if (Test-Path $nm) {
        Write-OK "项目依赖已安装"
    } else {
        Write-Info "安装依赖中..."
        Push-Location $PROJECT_DIR
        npm install --ignore-scripts 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "依赖安装失败!"
            Pop-Location
            return $false
        }
        Pop-Location
        Write-OK "依赖安装完成"
    }

    $ef = Join-Path $PROJECT_DIR ".env"
    if (Test-Path $ef) {
        Write-OK "配置文件 .env 已就绪"
    } else {
        Write-Info "未找到 .env 文件, 使用默认配置"
    }

    return $true
}

function Start-DevMode {
    Clear-Host
    Write-Title "开发模式 -- 内存数据库 + 热重载"
    Write-Info "数据库: 内存模式 (无需 MongoDB)"
    Write-Info "热重载: nodemon 自动检测文件变化"
    Write-Host ""
    Write-Host "  >> $SERVER_URL" -ForegroundColor Green
    Write-Host "  $DEFAULT_ACCOUNTS" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  按 Ctrl+C 停止服务器" -ForegroundColor DarkYellow
    Write-Host ""
    Push-Location $PROJECT_DIR
    npm run dev
    Pop-Location
}

function Start-ProdMode {
    Clear-Host
    Write-Title "生产模式 -- Node.js 直接启动"
    Write-Info "数据库: 使用 .env 中 MONGODB_URI 配置"
    Write-Host ""
    Write-Host "  >> $SERVER_URL" -ForegroundColor Green
    Write-Host "  $DEFAULT_ACCOUNTS" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  按 Ctrl+C 停止服务器" -ForegroundColor DarkYellow
    Write-Host ""
    Push-Location $PROJECT_DIR
    node start.js
    Pop-Location
}

function Open-Browser {
    Write-Title "打开浏览器"
    Write-Host "  正在打开: $SERVER_URL" -ForegroundColor Green
    Start-Process $SERVER_URL
    Write-Host ""
    Write-Host "  按任意键返回主菜单..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "  测井专业智能培训系统" -ForegroundColor Cyan
    Write-Host "  Well Logging Training Platform v1.1.0" -ForegroundColor DarkGray
    Write-Host ("-" * 54) -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [1] 开发模式启动" -ForegroundColor Yellow
    Write-Host "      nodemon + 内存数据库, 带热重载" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [2] 生产模式启动" -ForegroundColor Yellow
    Write-Host "      node start.js, 使用 .env 配置" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [3] 打开浏览器" -ForegroundColor Yellow
    Write-Host "      访问 http://localhost:3000" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host ("-" * 54) -ForegroundColor DarkGray
    Write-Host "  [Q] 退出" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  当前配置: " -NoNewline
    $ef = Join-Path $PROJECT_DIR ".env"
    if (Test-Path $ef) {
        $db = (Select-String -Path $ef -Pattern "^MONGODB_URI=").Line -replace "^MONGODB_URI=", ""
        if ($db -match "^memory://") {
            Write-Host "内存数据库" -ForegroundColor DarkYellow
        } else {
            Write-Host "MongoDB" -ForegroundColor DarkYellow
        }
    }
    Write-Host ""
}

Clear-Host
Write-Host ""
Write-Host "  测井专业智能培训系统" -ForegroundColor Cyan
Write-Host "  Well Logging Training Platform" -ForegroundColor DarkGray
Write-Host ""

$ready = Test-Prerequisites
if (-not $ready) {
    Write-Host ""
    Write-Fail "环境检查失败, 请修复后重试"
    Write-Host "  按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

do {
    Show-Menu
    $input = Read-Host "  请选择操作"
    $c = if ($input) { $input.ToUpper() } else { "" }
    switch ($c) {
        "1" { Start-DevMode }
        "2" { Start-ProdMode }
        "3" { Open-Browser }
        "Q" { Write-Host ""; Write-Host "  再见" -ForegroundColor Cyan; exit 0 }
        default { Write-Host "  [!] 无效选项" -ForegroundColor Red; Start-Sleep -Seconds 1 }
    }
} while ($true)
