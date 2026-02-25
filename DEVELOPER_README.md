# AR×マッチングアプリ **LinkPersona**

## アプリ概要
ARで理想の人とマッチング！
気になる子とお話してみたいけど恥ずかしい。。。
そんな時に「ARでお話しよう！」

AIアバターとリアルタイムで会話できる、次世代マッチングアプリです。

## 技術スタック

### Frontend
- **Next.js 15** (App Router) + TypeScript
- **Three.js** / React Three Fiber (AR表示)
- **TailwindCSS** (スタイリング)
- **Zustand** (状態管理)
- **Action Cable** (WebSocket通信)

### Backend
- **Ruby on Rails 8** (API mode)
- **MySQL 8.0**
- **Redis** (キャッシュ、WebSocket)
- **Sidekiq** (バックグラウンドジョブ)

### AI/ML Services
- **Amazon Bedrock** (Claude) - AI会話生成
- **Amazon Polly** - テキスト→音声変換
- **Amazon Transcribe** - 音声→テキスト変換

### Infrastructure
- **AWS EKS** (Kubernetes)
- **Terraform** (IaC)
- **Prometheus + Grafana** (モニタリング)
- **CloudFront + WAF** (CDN、セキュリティ)
- **GitHub Actions** (CI/CD)

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
DATABASE_URL=mysql2://user:password@localhost:3306/link_persona_development
REDIS_URL=redis://localhost:6379
AWS_REGION=ap-northeast-1
S3_BUCKET_NAME=link_persona-user-assets-production
COGNITO_USER_POOL_ID=ap-northeast-1_xxxxxxxxx
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
aws eks update-kubeconfig --name link_persona-cluster --region ap-northeast-1

# Secretsの作成
kubectl create secret generic db-credentials \
  --from-literal=url='mysql2://user:password@host:3306/link_persona_production'

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
aws s3 sync out s3://link_persona-frontend-production --delete

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



