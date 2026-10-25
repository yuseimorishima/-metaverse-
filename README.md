# NEON TAG — 連打で、逃げきれ。

最大5人で遊べる、ブラウザ向け3Dマルチプレイ鬼ごっこ。**GitHub Pagesを開くだけで参加できます。Renderの登録やサーバーURLの入力は不要です。**

## 遊び方

1. ページを開いて「ONLINE」になるまで待ち、名前を入力して「ルームをつくる」。
2. 友達も同じページを開き、ホストに教えてもらった6文字のコードを入力して参加。
3. 2〜5人集まったらホストがスタート。
4. WASD / 矢印キーで移動、**Spaceを連打**すると加速。スマホは方向パッドとTAPボタンを使います。
5. 光るリングが鬼。触れた相手に鬼が交代し、3秒間は再タッチできません。
6. 2分間で、鬼でなかった時間を競います。終了後は同じルームで再戦できます。

**部屋を作った人のブラウザがゲームを管理します。ホストは対戦中、ページを閉じたりバックグラウンドに移したりせず、開いたままにしてください。ホストが切断すると部屋は終了します。**

## 公開方法

生成済みの `docs/` を同梱しています。GitHub Pagesの **Deploy from a branch → main → /docs**、または **main → / (root)** に対応しています。ルートからは `docs/` へ転送します。

GitHub上で `public/` を編集して自動反映したい場合は、**Settings → Pages → Source → GitHub Actions** を選んでください。`main` 更新時に `.github/workflows/pages.yml` がテスト・ビルド・公開します。公開アドレスのルートと、既存の `/docs/` の両方に対応しています。

**通常は `BACKEND_URL` を設定しません。** 設定すると従来の外部WebSocketサーバーモードへ切り替わります。ブラウザ間通信を使う場合は、このリポジトリ変数を空にして再デプロイしてください。

## 通信方式と制限

- PeerJS / WebRTCでホストと各プレイヤーを接続。ホストが移動・加速・接触・得点を30Hzで判定します。
- 接続仲介にはPeerJS Cloudの公開サービスを使用。ライブラリ標準のSTUN / TURN設定を使用します。外部サービスなので可用性を保証するものではありません。
- ゲームの描画ライブラリと通信ライブラリは同梱し、外部CDNからのスクリプト読み込みは不要です。プレイヤーの名前やゲーム状態は接続した相手と共有されます。
- 学校・会社などの通信制限の強いネットワークではWebRTCや仲介サービスへの接続が拒否される場合があります。つながらない場合は別のWi-Fiやモバイル回線で試してください。
- 切断後の自動復帰、ホスト移譲、永続アカウントはブラウザ間モードにはありません。新しいルームを作成してください。
- 友達同士での利用を想定しています。ホストに対する不正対策やVRヘッドセット操作は未実装です。

## ローカル開発

Node.js 22以上（検証環境24.19.0）。

```sh
npm ci --cache /tmp/neon-tag-npm
npm test
npm run build
```

`npm run build` はPages用ファイルを `docs/` に生成し、Actions用の `_site/` にルート・`docs/` 両方の配置を作ります。生成した `docs/` はコミットし、`_site/` はコミットしません。

ブラウザ間モードのローカル確認：`python3 -m http.server 4173` を実行し、配信された `docs/` をブラウザで開きます。接続仲介サービスへのインターネット接続が必要です。

任意のNode.jsサーバーモードも残しています：`npm start` で `0.0.0.0:3000`、`PORT=8080 npm start` でポート変更。開発中のサーバー監視は `npm run dev`。このモードは同じサーバーでページとWebSocketを提供し、ホスト退出時に別プレイヤーへホストを移譲できます。

## ブラウザテスト

```sh
npx playwright install chromium
npm run test:browser
```

既存のChromiumを使う場合：`CHROMIUM_PATH=/usr/bin/chromium npm run test:browser`。

このテストはローカルの仲介サーバーを立ち上げ、実際のRTCDataChannelで5人参加、6人目の拒否、開始、連打加速、ホスト切断を検証します。ゲーム用のNodeサーバーは使いません。管理されたブラウザで直接UDPが禁止されている場合は、ローカルTURNのTCPリレーを使います。`TEST_TURN_URL`（例：`turn:127.0.0.1:34780?transport=tcp`）、`TEST_TURN_USER`、`TEST_TURN_PASSWORD` でテスト用リレーを指定できます。今回のブラウザ検証はこのローカルTCPリレー経由で実施しています。公開PeerJS Cloud・外部ネットワークへの到達性は、この環境のアクセス制限で未確認です。

`npm test` はサーバーモード経由で共通ゲームルール（5人制限、移動、障害物、鬼交代、得点、終了）を検証します。

## 編集するファイル

- `public/index.html` / `public/style.css` / `public/app.js`：画面・見た目・操作
- `public/game-core.js`：ブラウザとサーバーで共通のゲームルール
- `public/peer-transport.js`：ブラウザ間の通信
- `server.js` / `render.yaml`：任意の外部サーバーモード
- `scripts/build-pages.js` / `.github/workflows/pages.yml`：公開ファイル生成と自動公開
- `docs/`：生成物。元の `public/` を編集後、`npm run build` してください。
