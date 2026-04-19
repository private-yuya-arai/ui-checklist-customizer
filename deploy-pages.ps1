# ============================================================
# GitHub Pages デプロイ用スクリプト
# ============================================================
# 使い方:
#   cd C:\Users\yarai\workspace\demo
#   powershell -ExecutionPolicy Bypass -File .\deploy-pages.ps1
# ============================================================

Write-Host "=== GitHub Pages デプロイ ===" -ForegroundColor Cyan
Write-Host ""

# Step 0: gitリポジトリが正常か確認
if (-not (Test-Path .git\HEAD)) {
    Write-Host "エラー: このフォルダはgitリポジトリではありません。" -ForegroundColor Red
    Write-Host "まず setup-git.ps1 を実行してください。" -ForegroundColor Yellow
    exit 1
}

# 破損した config.lock があれば削除
if (Test-Path .git\config.lock) {
    Write-Host "[i] 破損した .git\config.lock を削除します..." -ForegroundColor Yellow
    Remove-Item .git\config.lock -Force
}

# .git が破損していないか実際に git コマンドで検証
git rev-parse --git-dir *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "エラー: .git フォルダは存在しますが、壊れています。" -ForegroundColor Red
    Write-Host "  (git rev-parse --git-dir が失敗しました)" -ForegroundColor Red
    Write-Host ""
    Write-Host "=== 対処方法 ===" -ForegroundColor Yellow
    Write-Host "まず setup-git.ps1 を実行して .git を作り直してください:" -ForegroundColor Yellow
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\setup-git.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "その後、もう一度このスクリプトを実行してください。" -ForegroundColor Yellow
    exit 1
}

# Step 1: 変更を確認
Write-Host "[1/5] 変更内容を確認..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "  未コミットの変更があります:" -ForegroundColor Cyan
    git status --short
} else {
    Write-Host "  未コミットの変更はありません" -ForegroundColor Green
}

# Step 2: add + commit
if ($status) {
    Write-Host ""
    Write-Host "[2/5] 変更をコミットします..." -ForegroundColor Yellow
    git add .
    $msg = Read-Host "  コミットメッセージ（空なら 'Update for GitHub Pages' を使用）"
    if (-not $msg) { $msg = "Update for GitHub Pages" }
    git commit -m $msg
    if ($LASTEXITCODE -ne 0) {
        Write-Host "エラー: git commit に失敗しました" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[2/5] コミットはスキップ（変更なし）" -ForegroundColor Green
}

# Step 3: リモートの確認
Write-Host ""
Write-Host "[3/5] リモート設定を確認..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "  リモート 'origin' が未設定です。" -ForegroundColor Yellow
    $url = Read-Host "  GitHubリポジトリURLを入力 (例: https://github.com/USER/ui-checklist-customizer.git)"
    git remote add origin $url
    $remote = $url
}
Write-Host "  remote origin = $remote" -ForegroundColor Cyan

# Step 4: push
Write-Host ""
Write-Host "[4/5] main ブランチへ push します..." -ForegroundColor Yellow
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "エラー: git push に失敗しました" -ForegroundColor Red
    Write-Host "リモートURLや認証情報を確認してください。" -ForegroundColor Yellow
    exit 1
}
Write-Host "  → push 完了" -ForegroundColor Green

# Step 5: Pages 設定画面とActionsタブをブラウザで開く
Write-Host ""
Write-Host "[5/5] GitHubのPages設定とActionsタブを開きます..." -ForegroundColor Yellow

# リモートURLから owner/repo を抽出
$m = [regex]::Match($remote, "github\.com[:/](?<owner>[^/]+)/(?<repo>[^/.]+)(\.git)?$")
if ($m.Success) {
    $owner = $m.Groups["owner"].Value
    $repo  = $m.Groups["repo"].Value
    $pagesUrl   = "https://github.com/$owner/$repo/settings/pages"
    $actionsUrl = "https://github.com/$owner/$repo/actions"
    $liveUrl    = "https://$owner.github.io/$repo/"

    Write-Host ""
    Write-Host "=== 次の手順（GitHub画面で1回だけ）===" -ForegroundColor Cyan
    Write-Host "① Pages設定でSourceを「GitHub Actions」に変更" -ForegroundColor White
    Write-Host "   $pagesUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "② Actionsタブでワークフロー進行を確認" -ForegroundColor White
    Write-Host "   $actionsUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "③ 1〜2分後に以下のURLでサイトが閲覧可能" -ForegroundColor White
    Write-Host "   $liveUrl" -ForegroundColor Green
    Write-Host ""

    Start-Process $pagesUrl
    Start-Sleep -Seconds 1
    Start-Process $actionsUrl
} else {
    Write-Host "  （リモートURLのパースに失敗。手動で設定画面を開いてください）" -ForegroundColor Yellow
}

Write-Host "=== 完了！ ===" -ForegroundColor Green
