# 陶芸記録アプリ

陶芸作品の制作日、工程、土、釉薬、焼成、サイズ、写真URL、メモを記録できるシンプルなWebアプリです。

## 使い方

`index.html` をブラウザで開くか、GitHub Pagesで公開して使います。

記録データはブラウザの `localStorage` に保存されます。端末間で自動同期はされません。

## GitHub Pagesで公開する

GitHubで空のリポジトリを作成後、以下を実行します。

```bash
git remote add origin https://github.com/YOUR_NAME/pottery-record-app.git
git branch -M main
git push -u origin main
```

GitHubのリポジトリ画面で `Settings` → `Pages` を開き、`Deploy from a branch`、`main`、`/(root)` を選択して保存します。
