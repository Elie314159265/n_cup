# yoku - AR×マッチングアプリ

**ARで理想の人とマッチング！気になる相手とARアバターでお話しよう**

---

## アプリ概要

「共通の趣味がある友だちが欲しい」
「気になる人と話してみたいけど、恥ずかしい...」

そんなあなたに **LinkPersona** は、マッチングした相手のAIアバターとリアルタイム音声会話ができる、次世代マッチングアプリです。相手のプロフィールを学習したAIが相手になりきって会話するので、実際に会う前に相手の雰囲気や相性を確認できます。

### 主な特徴

- **相手のAIアバターと会話** - マッチングした相手のARアバターがAIで応答
- **完全音声ベース** - マイクで話すだけ、リアルタイムな音声会話
- **相手になりきるAI** - プロフィール情報を基にClaudeが相手の性格で会話
- **実際に会う前の練習** - AIアバターで相手の雰囲気や相性を事前確認
- **スマートマッチング** - 趣味や性格から最適な相手を提案
- **ブラウザで完結** - 特別なアプリ不要、ブラウザですぐに始められる

---

## 使い方

### 1. アカウント登録

メールアドレスとユーザー名で簡単に登録できます。

### 2. プロフィール作成

- 年齢、性別、趣味などの基本情報を入力
- MBTIや性格タイプなど、詳細なプロフィールも設定可能
- プロフィール画像をアップロード

### 3. ARアバター作成

自分専用のARアバターを作成します：

- **外見のカスタマイズ**
  - 髪型・髪色
  - 肌の色
  - 服装スタイル
  - 体型

- **声の設定**
  - Amazon Pollyの音声タイプを選択
  - 優しい声、元気な声など、好みに合わせて選択可能

### 4. マッチング候補を探す

- スワイプUIで気になる相手を探す
- 相性スコアが表示されるので参考に
- フィルター機能で年齢、性別、趣味などを絞り込み
- 気になる相手には「いいね」を送る

### 5. マッチング成立

お互いに「いいね」したらマッチング成立！メッセージやAR空間での会話が楽しめます。

### 6. AR空間で会話

マッチングした相手のAIアバターとリアルタイム音声会話：

- **環境を選択** - カフェ、公園、ビーチなど、好きな雰囲気を選べる
- **相手のARアバターが登場** - 相手の3Dアバターが目の前に表示される
- **音声で話しかける** - マイクで話すと、AIが相手になりきって返答
- **完全音声ベース** - テキスト入力なし、リアルタイムな音声会話のみ
- **相手の性格を反映** - プロフィール情報（性格、趣味、年齢）を基にAIが自然に会話
- **表情やジェスチャー** - アバターが会話に合わせて動き、口パクも同期

---

## 主な機能

### マッチング機能

- スワイプUIで直感的に相手を選択
- フィルター機能（年齢、性別、趣味、性格など）
- 相性スコア自動計算
  - 共通の興味・趣味
  - 年齢の近さ
  - 性格の相性

### ARアバター機能

- 3Dアバターのフルカスタマイズ
- リアルタイムのアニメーション
  - 表情変化
  - ジェスチャー
  - 音声に合わせた口パク
- WebブラウザでAR表示（Three.js使用）

### AI会話機能（AR空間）

- **完全音声ベース** - テキスト不要、音声のみでリアルタイム会話
- **相手になりきるAI** - マッチングした相手のプロフィール（性格、趣味）を基にClaudeが会話生成
- **音声入力** - Amazon Transcribe で音声をリアルタイム認識
- **AI応答生成** - Amazon Bedrock (Claude) が相手の性格で自然な返答を生成
- **音声出力** - Amazon Polly Neural TTS で超自然な音声合成
- **アバター同期** - 音声に合わせて口パク、表情変化

### メッセージング

- テキストメッセージ
- 音声メッセージ
- 画像送信
- 既読・未読管理

---

## こんな人におすすめ

- **対面で話すのが苦手な人** - ARアバターで気軽にコミュニケーション
- **効率的に出会いたい人** - 相性スコアで最適な相手をマッチング
- **カスタマイズが好きな人** - 自分だけのアバターを作成
- **新しい体験を求める人** - AR×AIの最新技術を体験

---

## プライバシーとセキュリティ

- AWS Cognitoによる安全な認証
- 個人情報の暗号化保存
- 不適切なユーザーのブロック機能
- 通報システム

---

## 技術スタック

### Frontend
- Next.js 15 (App Router) + TypeScript
- Three.js / React Three Fiber (AR表示)
- TailwindCSS

### Backend
- Ruby on Rails 8 (API mode)
- MySQL 8.0
- Redis
- Sidekiq

### AI/ML
- Amazon Bedrock (Claude) - AI会話生成
- Amazon Polly - テキスト→音声変換
- Amazon Transcribe - 音声→テキスト変換

### Infrastructure
- AWS EKS (Kubernetes)
- Terraform (IaC)
- Prometheus + Grafana (モニタリング)
- CloudFront + WAF

---

## 開発者向け情報

技術スタックやセットアップ方法については [DEVELOPER_README.md](./DEVELOPER_README.md) をご覧ください。

詳細な設計書は [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) にあります。

---

## ライセンス

MIT License

---

## 技術の無駄遣いポイント

- EKS + Kubernetes - マッチングアプリに本格コンテナオーケストレーション
- Amazon Bedrock (Claude) - AIアバターとの自然な会話
- Three.js AR - ブラウザで3Dアバターをリアルタイム表示
- Amazon Polly Neural TTS - 超自然な音声合成
- Prometheus + Grafana - モニタリングスタック
- CloudFront + WAF - グローバル配信とセキュリティ

---


## プロジェクト構成

```
.
├── backend/           # Rails 8 API
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/  # ビジネスロジック
│   │   │   ├── auth/  # Cognito認証
│   │   │   ├── ai/    # AI関連サービス
│   │   │   ├── matching/
│   │   │   └── storage/
│   │   └── channels/  # Action Cable
│   ├── db/migrations/
│   └── Dockerfile
│
├── frontend/          # Next.js 15
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── ar/
│   │   │   ├── matching/
│   │   │   ├── messaging/
│   │   │   └── ai/
│   │   └── lib/
│   └── package.json
│
├── terraform/         # インフラ構成
│   ├── main.tf
│   ├── vpc.tf
│   ├── eks.tf
│   ├── rds.tf
│   ├── s3.tf
│   └── alb_waf.tf
│
├── k8s/              # Kubernetesマニフェスト
│   ├── rails-api-deployment.yaml
│   ├── action-cable-deployment.yaml
│   ├── sidekiq-deployment.yaml
│   ├── prometheus-deployment.yaml
│   └── grafana-deployment.yaml
│
├── .github/workflows/ # CI/CD
│   ├── frontend.yml
│   ├── backend.yml
│   └── terraform.yml
│
└── docs/
    └── ARCHITECTURE.md  # 詳細設計書
```

## セットアップ

### 必要なツール
- Ruby 3.3.0
- Node.js 20+
- Docker
- Terraform
- AWS CLI
- kubectl

### 1. Backend (Rails)

```bash
cd backend

# Gemのインストール
bundle install

# データベース作成・マイグレーション
rails db:create db:migrate

# サーバー起動
rails server
```

### 2. Frontend (Next.js)

```bash
cd frontend

# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

### 3. 環境変数の設定

#### Backend: `backend/.env`
```bash
DATABASE_URL=mysql2://user:password@localhost:3306/yoku_development
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1
S3_BUCKET_NAME=yoku-user-assets-production
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
```

#### Frontend: `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000/cable
```

## デプロイ

### 1. インフラのプロビジョニング

```bash
cd terraform

# 初期化
terraform init

# プランの確認
terraform plan -var="db_password=your-password"

# 適用
terraform apply -var="db_password=your-password"
```

### 2. Kubernetes設定

```bash
# EKS クラスタに接続
aws eks update-kubeconfig --name yoku-cluster --region us-east-1

# Secretsの作成
kubectl create secret generic db-credentials \
  --from-literal=url='mysql2://user:password@host:3306/yoku_production'

kubectl create secret generic cognito-credentials \
  --from-literal=user_pool_id='xxx' \
  --from-literal=client_id='xxx'

# ConfigMapとSecretsを適用
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets-example.yaml  # 実際の値に置き換え

# アプリケーションのデプロイ
kubectl apply -f k8s/rails-api-deployment.yaml
kubectl apply -f k8s/action-cable-deployment.yaml
kubectl apply -f k8s/sidekiq-deployment.yaml
kubectl apply -f k8s/prometheus-deployment.yaml
kubectl apply -f k8s/grafana-deployment.yaml

# ステータス確認
kubectl get pods
```

### 3. フロントエンドのデプロイ

```bash
cd frontend

# ビルド
npm run build

# S3にアップロード
aws s3 sync out s3://yoku-frontend-production --delete

# CloudFront キャッシュ無効化
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## CI/CD

GitHub Actionsで自動デプロイが設定されています。

### 必要なGitHub Secrets

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
ECR_REGISTRY
DB_PASSWORD
API_URL
WS_URL
CLOUDFRONT_DISTRIBUTION_ID
```

## モニタリング

### Grafana アクセス

```bash
# Grafana サービスの外部IPを取得
kubectl get service grafana-service

# ブラウザで http://<EXTERNAL-IP>:3000 にアクセス
# デフォルト: admin / admin
```

### Prometheus メトリクス

```bash
# Prometheus UIへのポートフォワード
kubectl port-forward service/prometheus-service 9090:9090

# ブラウザで http://localhost:9090 にアクセス
```

## API エンドポイント

ALBのDNS名でAPIにアクセス:

```
http://<ALB-DNS-NAME>/api/v1/...
ws://<ALB-DNS-NAME>/cable
```

### 主要なエンドポイント

- `POST /api/v1/auth/signup` - ユーザー登録
- `POST /api/v1/auth/signin` - ログイン
- `GET /api/v1/discover` - マッチング候補取得
- `POST /api/v1/likes` - いいねを送る
- `POST /api/v1/ar_sessions` - ARセッション作成
- `POST /api/v1/ai/chat` - AI会話リクエスト
- `POST /api/v1/ai/speech` - 音声合成

詳細は [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) を参照してください。

## ライセンス

MIT License

## 技術の無駄遣いポイント 🎉

1. **EKS + Prometheus + Grafana** - マッチングアプリに本格Kubernetes
2. **Amazon Bedrock (Claude)** - AIアバターとの会話生成
3. **Three.js AR** - ブラウザで3Dアバター表示
4. **Amazon Polly Neural TTS** - 自然な音声合成
5. **リアルタイムストリーミング** - WebSocket + AI応答
6. **CloudFront + WAF** - グローバル配信とセキュリティ



