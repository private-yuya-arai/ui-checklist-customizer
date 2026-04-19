# ========================================================
# ui-checklist-customizer: Git & GitHub セットアップ スクリプト
# ========================================================
# PowerShell で実行してください:
#   cd C:\Users\yarai\workspace\demo
#   powershell -ExecutionPolicy Bypass -File .\setup-git.ps1
# ========================================================

Write-Host "=== ui-checklist-customizer: Gitセットアップ ===" -ForegroundColor Cyan
Write-Host ""

# Step 0: 破損した .git フォルダを削除
if (Test-Path .git) {
    Write-Host "[0/5] 既存の .git フォルダを削除します..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
    Write-Host "  → 削除完了" -ForegroundColor Green
}

# Step 1: git init
Write-Host "[1/5] git リポジトリを初期化..." -ForegroundColor Yellow
git init -b main
if ($LASTEXITCODE -ne 0) { Write-Host "エラー: git init に失敗しました" -ForegroundColor Red; exit 1 }

# Step 2: add
Write-Host "[2/5] ファイルをステージング..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) { Write-Host "エラー: git add に失敗しました" -ForegroundColor Red; exit 1 }

# Step 3: ユーザー情報の確認
$userName = git config user.name
$userEmail = git config user.email
if (-not $userName) {
    Write-Host ""
    Write-Host "git のユーザー情報が未設定です。" -ForegroundColor Yellow
    $inputName = Read-Host "  あなたの名前を入力してください"
    $inputEmail = Read-Host "  あなたのメールアドレスを入力してください"
    git config user.name "$inputName"
    git config user.email "$inputEmail"
}

# Step 4: commit
Write-Host "[3/5] 初回コミット..." -ForegroundColor Yellow
git commit -m "Initial commit: UIチェックリスト カスタマイズツール"
if ($LASTEXITCODE -ne 0) { Write-Host "エラー: git commit に失敗しました" -ForegroundColor Red; exit 1 }

# Step 5: GitHub リモートの追加
Write-Host ""
Write-Host "[4/5] GitHub リポジトリを作成します" -ForegroundColor Yellow
Write-Host ""
$useGh = $false
if (Get-Command gh -ErrorAction SilentlyContinue) {
    $res = Read-Host "  GitHub CLI (gh) が見つかりました。これを使ってリポジトリを作成しますか？ [Y/n]"
    if ($res -eq "" -or $res -eq "Y" -or $res -eq "y") { $useGh = $true }
}

if ($useGh) {
    $visibility = Read-Host "  リポジトリの公開範囲 (public / private) [private]"
    if (-not $visibility) { $visibility = "private" }
    Write-Host "  GitHub にリポジトリを作成し push します..." -ForegroundColor Yellow
    gh repo create ui-checklist-customizer --$visibility --source=. --remote=origin --push
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== 完了！ ===" -ForegroundColor Green
        Write-Host "GitHub にリポジトリを作成し、初回pushが完了しました。" -ForegroundColor Green
    } else {
        Write-Host "gh でのリポジトリ作成に失敗しました。手動手順をご確認ください。" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "=== 以下の手順で手動 push してください ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. ブラウザで https://github.com/new を開く"
    Write-Host "2. Repository name に 'ui-checklist-customizer' と入力"
    Write-Host "3. Public / Private を選択し 'Create repository' をクリック"
    Write-Host "   （README・.gitignore・LICENSE の追加は 不要 です）"
    Write-Host ""
    Write-Host "4. 作成後に表示されるコマンドのうち、以下を実行:"
    Write-Host ""
    Write-Host "   git remote add origin https://github.com/<YOUR_USERNAME>/ui-checklist-customizer.git" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    Write-Host ""
}

Write-Host "[5/5] セットアップ終了" -ForegroundColor Yellow
