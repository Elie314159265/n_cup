# アプリケーション設計書

## アプリケーション概要
AR×マッチングアプリ「LinkPersona」は、AR技術とAIを活用した新しいマッチングプラットフォームです。
ユーザーは自分のARアバターを作成してプロフィールを登録し、マッチングした相手のAIアバターと音声でリアルタイム会話できます。
AIが相手のプロフィール情報（性格、趣味、年齢など）を基に相手になりきって会話するため、実際に会う前に相手の雰囲気や相性を確認できます。

## 採用技術スタック
- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **AR Engine**: Three.js, React Three Fiber
- **Backend**: Ruby on Rails 8 (API mode), Action Cable (WebSocket)
- **Database**: MySQL 8.0
- **Cache**: Redis (セッション、リアルタイム通信)
- **Storage**: AWS S3 (画像、3Dモデル)
- **Authentication**: AWS Cognito
- **AI/ML**: Amazon Bedrock (Claude), Amazon Polly, Amazon Transcribe
- **Container Orchestration**: Amazon EKS (Kubernetes)
- **Monitoring**: Prometheus, Grafana
- **IaC**: Terraform
- **Cloud**: AWS
- **CI/CD**: GitHub Actions
- **Job Queue**: Sidekiq

---

## システムアーキテクチャ図

```
[Client (Next.js + Three.js)]
         |
         | HTTPS
         v
[CloudFront] --> [S3 (静的ファイル/3Dアセット)]
         |
         | API/WebSocket
         v
[ALB + WAF (Application Load Balancer)]
         |
         v
[EKS Cluster (Kubernetes)]
    |
    +-- [Rails API Pod] (Deployment)
    +-- [Action Cable Pod] (Deployment)
    +-- [Sidekiq Pod] (Deployment)
    +-- [Prometheus] (Monitoring)
    +-- [Grafana] (Visualization)
    |
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v
  [RDS] [Redis] [Cognito] [S3] [Bedrock/Polly/Transcribe]
```

---

## データベース設計

### users テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| cognito_sub | VARCHAR(255) | Cognito User Sub | NO | UNIQUE |
| email | VARCHAR(255) | メールアドレス | NO | UNIQUE |
| username | VARCHAR(50) | ユーザー名 | NO | UNIQUE |
| created_at | TIMESTAMP | 作成日時 | NO | |
| updated_at | TIMESTAMP | 更新日時 | NO | |

### profiles テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| user_id | BIGINT | 外部キー (users) | NO | INDEX |
| display_name | VARCHAR(100) | 表示名 | NO | |
| bio | TEXT | 自己紹介 | YES | |
| age | INT | 年齢 | NO | |
| gender | ENUM('male','female','other') | 性別 | NO | INDEX |
| location | VARCHAR(100) | 所在地 | YES | |
| avatar_url | VARCHAR(500) | プロフィール画像URL | YES | |
| ar_avatar_id | BIGINT | 外部キー (ar_avatars) | YES | |
| cup_size | ENUM('A','B','C','D','E','F','G','H','I','J') | カップ数 | YES | |
| personality | VARCHAR(50) | 性格タイプ | YES | |
| mbti | VARCHAR(4) | MBTIタイプ (例: ENFP) | YES | INDEX |
| interests | JSON | 興味・趣味 (配列) | YES | |
| preferences | JSON | マッチング設定 | YES | |
| created_at | TIMESTAMP | 作成日時 | NO | |
| updated_at | TIMESTAMP | 更新日時 | NO | |

### ar_avatars テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| user_id | BIGINT | 外部キー (users) | NO | INDEX |
| name | VARCHAR(100) | アバター名 | NO | |
| model_url | VARCHAR(500) | 3DモデルURL (S3) | NO | |
| texture_url | VARCHAR(500) | テクスチャURL (S3) | YES | |
| animation_data | JSON | アニメーション設定 | YES | |
| customization | JSON | カスタマイズ情報 | YES | |
| voice_id | VARCHAR(50) | Amazon Polly Voice ID | YES | |
| created_at | TIMESTAMP | 作成日時 | NO | |
| updated_at | TIMESTAMP | 更新日時 | NO | |

### matches テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| user_id_1 | BIGINT | 外部キー (users) | NO | |
| user_id_2 | BIGINT | 外部キー (users) | NO | |
| status | ENUM('pending','matched','rejected') | 状態 | NO | INDEX |
| matched_at | TIMESTAMP | マッチング成立日時 | YES | |
| compatibility_score | INT | 相性スコア (0-100) | YES | |
| created_at | TIMESTAMP | 作成日時 | NO | |
| updated_at | TIMESTAMP | 更新日時 | NO | |
| INDEX | (user_id_1, user_id_2) | 複合ユニークインデックス | | UNIQUE |

### likes テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| from_user_id | BIGINT | 外部キー (users) いいねした人 | NO | |
| to_user_id | BIGINT | 外部キー (users) いいねされた人 | NO | |
| created_at | TIMESTAMP | 作成日時 | NO | |
| INDEX | (from_user_id, to_user_id) | 複合ユニークインデックス | | UNIQUE |

### conversations テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| match_id | BIGINT | 外部キー (matches) | NO | INDEX |
| ar_session_id | VARCHAR(255) | ARセッションID | YES | |
| status | ENUM('active','ended') | 状態 | NO | INDEX |
| started_at | TIMESTAMP | 開始日時 | YES | |
| ended_at | TIMESTAMP | 終了日時 | YES | |
| created_at | TIMESTAMP | 作成日時 | NO | |
| updated_at | TIMESTAMP | 更新日時 | NO | |

### messages テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| conversation_id | BIGINT | 外部キー (conversations) | NO | |
| sender_id | BIGINT | 外部キー (users) | NO | |
| message_type | ENUM('text','image','voice','ar_action','ai_response') | メッセージタイプ | NO | |
| content | TEXT | メッセージ内容 | YES | |
| metadata | JSON | メタデータ (AR動作、音声URL等) | YES | |
| read_at | TIMESTAMP | 既読日時 | YES | |
| created_at | TIMESTAMP | 作成日時 | NO | |
| INDEX | (conversation_id, created_at) | 複合インデックス | | INDEX |

### ar_sessions テーブル
| カラム名 | 型 | 説明 | NULL | Index |
|---------|-----|------|------|-------|
| id | BIGINT | 主キー | NO | PRIMARY |
| conversation_id | BIGINT | 外部キー (conversations) | NO | INDEX |
| session_token | VARCHAR(255) | セッショントークン | NO | UNIQUE |
| environment_type | VARCHAR(50) | AR環境タイプ | NO | |
| environment_data | JSON | 環境設定データ | YES | |
| ai_conversation_history | JSON | AI会話履歴 (Bedrock用) | YES | |
| created_at | TIMESTAMP | 作成日時 | NO | |
| updated_at | TIMESTAMP | 更新日時 | NO | |

---

## API設計

### 認証関連

| メソッド | エンドポイント | 役割 | 認証 |
|---------|---------------|------|------|
| POST | /api/v1/auth/signup | 新規ユーザー登録 (Cognito) | - |
| POST | /api/v1/auth/signin | ログイン (Cognito) | - |
| POST | /api/v1/auth/signout | ログアウト | ✓ |
| POST | /api/v1/auth/refresh | トークンリフレッシュ | ✓ |
| GET | /api/v1/auth/me | 現在のユーザー情報取得 | ✓ |

**POST /api/v1/auth/signup**
```json
// Request
{
  "email": "user@example.com",
  "password": "password123",
  "username": "link_persona_user"
}

// Response
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "link_persona_user",
    "cognito_sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  },
  "tokens": {
    "id_token": "eyJhbG...",
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "expires_in": 3600
  }
}
```

### ユーザー・プロフィール関連

| メソッド | エンドポイント | 役割 | 認証 |
|---------|---------------|------|------|
| GET | /api/v1/users/:id | ユーザー情報取得 | ✓ |
| PATCH | /api/v1/users/:id | ユーザー情報更新 | ✓ |
| GET | /api/v1/profiles/:id | プロフィール取得 | ✓ |
| PATCH | /api/v1/profiles/:id | プロフィール更新 | ✓ |
| POST | /api/v1/profiles/:id/avatar | プロフィール画像アップロード | ✓ |

**PATCH /api/v1/profiles/:id**
```json
// Request
{
  "display_name": "ヨクちゃん",
  "bio": "AR空間で楽しく話したいです！",
  "age": 25,
  "gender": "female",
  "cup_size": "C",
  "personality": "friendly",
  "interests": ["アニメ", "旅行", "カフェ巡り"]
}

// Response
{
  "profile": {
    "id": 1,
    "user_id": 1,
    "display_name": "ヨクちゃん",
    "bio": "AR空間で楽しく話したいです！",
    "age": 25,
    "gender": "female",
    "cup_size": "C",
    "personality": "friendly",
    "avatar_url": "https://xxx.cloudfront.net/avatars/user1.jpg",
    "interests": ["アニメ", "旅行", "カフェ巡り"]
  }
}
```

### ARアバター関連

| メソッド | エンドポイント | 役割 | 認証 |
|---------|---------------|------|------|
| GET | /api/v1/ar_avatars | ARアバター一覧取得 | ✓ |
| POST | /api/v1/ar_avatars | ARアバター作成 | ✓ |
| GET | /api/v1/ar_avatars/:id | ARアバター詳細取得 | ✓ |
| PATCH | /api/v1/ar_avatars/:id | ARアバター更新 | ✓ |
| DELETE | /api/v1/ar_avatars/:id | ARアバター削除 | ✓ |
| POST | /api/v1/ar_avatars/:id/upload_model | 3Dモデルアップロード | ✓ |

**POST /api/v1/ar_avatars**
```json
// Request
{
  "name": "My Cool Avatar",
  "voice_id": "Joanna",  // Amazon Polly Voice ID
  "customization": {
    "hair_color": "#FF5733",
    "skin_tone": "#FFD1A4",
    "clothing": "casual_01",
    "cup_size": "C"
  }
}

// Response
{
  "ar_avatar": {
    "id": 1,
    "user_id": 1,
    "name": "My Cool Avatar",
    "model_url": "https://xxx.cloudfront.net/models/avatar1.glb",
    "texture_url": "https://xxx.cloudfront.net/textures/avatar1.png",
    "voice_id": "Joanna",
    "customization": {...}
  }
}
```

### マッチング関連

| メソッド | エンドポイント | 役割 | 認証 |
|---------|---------------|------|------|
| GET | /api/v1/discover | マッチング候補取得 | ✓ |
| POST | /api/v1/likes | いいねを送る | ✓ |
| GET | /api/v1/likes/received | 受け取ったいいね一覧 | ✓ |
| GET | /api/v1/matches | マッチング一覧 | ✓ |
| DELETE | /api/v1/matches/:id | マッチング解除 | ✓ |

**GET /api/v1/discover**
```json
// Query: ?limit=10&age_min=20&age_max=30&gender=female

// Response
{
  "users": [
    {
      "id": 2,
      "profile": {
        "display_name": "さくら",
        "age": 24,
        "bio": "映画が好きです",
        "cup_size": "B",
        "personality": "calm",
        "avatar_url": "https://xxx.cloudfront.net/avatars/user2.jpg",
        "ar_avatar_preview": "https://xxx.cloudfront.net/models/avatar2_thumb.jpg"
      },
      "compatibility_score": 85
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 50
  }
}
```

**POST /api/v1/likes**
```json
// Request
{
  "to_user_id": 2
}

// Response
{
  "like": {
    "id": 1,
    "from_user_id": 1,
    "to_user_id": 2,
    "created_at": "2026-02-21T10:00:00Z"
  },
  "is_match": true,
  "match": {
    "id": 1,
    "matched_at": "2026-02-21T10:00:00Z"
  }
}
```

### 会話・メッセージング関連

| メソッド | エンドポイント | 役割 | 認証 |
|---------|---------------|------|------|
| GET | /api/v1/conversations | 会話一覧取得 | ✓ |
| POST | /api/v1/conversations | 会話開始 | ✓ |
| GET | /api/v1/conversations/:id | 会話詳細取得 | ✓ |
| POST | /api/v1/conversations/:id/end | 会話終了 | ✓ |
| GET | /api/v1/conversations/:id/messages | メッセージ一覧取得 | ✓ |
| POST | /api/v1/conversations/:id/messages | メッセージ送信 | ✓ |
| PATCH | /api/v1/messages/:id/read | 既読にする | ✓ |

**POST /api/v1/conversations**
```json
// Request
{
  "match_id": 1,
  "type": "ar_session"
}

// Response
{
  "conversation": {
    "id": 1,
    "match_id": 1,
    "ar_session_id": "sess_abc123",
    "status": "active",
    "started_at": "2026-02-21T10:00:00Z"
  }
}
```

### ARセッション & AI会話関連

| メソッド | エンドポイント | 役割 | 認証 |
|---------|---------------|------|------|
| POST | /api/v1/ar_sessions | ARセッション作成 | ✓ |
| GET | /api/v1/ar_sessions/:id | ARセッション情報取得 | ✓ |
| PATCH | /api/v1/ar_sessions/:id | ARセッション更新 | ✓ |
| POST | /api/v1/ar_sessions/:id/join | ARセッション参加 | ✓ |
| POST | /api/v1/ar_sessions/:id/leave | ARセッション退出 | ✓ |
| POST | /api/v1/ai/chat | AI会話リクエスト (Bedrock) | ✓ |
| POST | /api/v1/ai/speech | テキスト→音声変換 (Polly) | ✓ |
| POST | /api/v1/ai/transcribe | 音声→テキスト変換 (Transcribe) | ✓ |

**POST /api/v1/ar_sessions**
```json
// Request
{
  "conversation_id": 1,
  "environment_type": "cafe",
  "environment_data": {
    "lighting": "warm",
    "background_music": "lofi"
  }
}

// Response
{
  "ar_session": {
    "id": 1,
    "session_token": "tok_xyz789",
    "environment_assets": {
      "scene_url": "https://xxx.cloudfront.net/scenes/cafe.glb",
      "skybox_url": "https://xxx.cloudfront.net/skyboxes/sunset.jpg"
    }
  }
}
```

**POST /api/v1/ai/chat**
```json
// Request
{
  "ar_session_id": 1,
  "message": "こんにちは！今日はどんな映画が好き？",
  "context": {
    "user_personality": "friendly",
    "partner_interests": ["映画", "旅行"]
  }
}

// Response
{
  "response": {
    "text": "こんにちは！私はSF映画が大好きです。特にインターステラーとか見ました？",
    "audio_url": "https://xxx.cloudfront.net/audio/response_123.mp3",
    "animation": "wave_hand",
    "conversation_id": "conv_bedrock_123"
  }
}
```

**POST /api/v1/ai/speech**
```json
// Request
{
  "text": "こんにちは！元気ですか？",
  "voice_id": "Mizuki",  // Amazon Polly Japanese Voice
  "engine": "neural"
}

// Response
{
  "audio_url": "https://xxx.cloudfront.net/audio/speech_456.mp3",
  "duration": 2.5
}
```

**POST /api/v1/ai/transcribe**
```json
// Request (multipart/form-data)
{
  "audio_file": <binary>,
  "language": "ja-JP"
}

// Response
{
  "text": "こんにちは、今日はいい天気ですね",
  "confidence": 0.95
}
```

### WebSocket (Action Cable) エンドポイント

**接続**: `wss://<ALB-DNS-NAME>/cable`

**チャンネル一覧**:
- `ConversationChannel` - リアルタイムメッセージング
- `ArSessionChannel` - ARセッション同期（位置、動作）
- `MatchNotificationChannel` - マッチング通知
- `AiResponseChannel` - AIリアルタイム応答

```json
// ConversationChannel Subscribe
{
  "command": "subscribe",
  "identifier": "{\"channel\":\"ConversationChannel\",\"conversation_id\":1}"
}

// Message Event
{
  "type": "message",
  "data": {
    "id": 123,
    "sender_id": 2,
    "content": "こんにちは！",
    "created_at": "2026-02-21T10:05:00Z"
  }
}

// ArSessionChannel - Avatar Movement
{
  "type": "avatar_move",
  "data": {
    "user_id": 2,
    "position": {"x": 1.5, "y": 0, "z": 2.0},
    "rotation": {"x": 0, "y": 45, "z": 0}
  }
}

// AiResponseChannel - AI Streaming Response
{
  "type": "ai_response_chunk",
  "data": {
    "text_chunk": "こんにちは！",
    "is_final": false,
    "audio_chunk_url": "https://xxx.cloudfront.net/audio/chunk_1.mp3"
  }
}
```

---

## Frontend設計

### ディレクトリ構成
```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (main)/
│   │   │   ├── discover/page.tsx       # マッチング候補
│   │   │   ├── matches/page.tsx        # マッチング一覧
│   │   │   ├── messages/page.tsx       # メッセージ
│   │   │   ├── ar-session/page.tsx     # ARセッション
│   │   │   └── profile/page.tsx        # プロフィール編集
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ar/
│   │   │   ├── ARAvatar.tsx            # ARアバターコンポーネント
│   │   │   ├── ARScene.tsx             # AR空間
│   │   │   ├── AvatarCreator.tsx       # アバターエディタ
│   │   │   └── AvatarAnimator.tsx      # アニメーション制御
│   │   ├── matching/
│   │   │   ├── UserCard.tsx            # ユーザーカード
│   │   │   └── SwipeCard.tsx           # スワイプUI
│   │   ├── messaging/
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── VoiceInput.tsx          # 音声入力
│   │   ├── ai/
│   │   │   ├── AIChat.tsx              # AI会話UI
│   │   │   └── VoicePlayer.tsx         # 音声再生
│   │   └── shared/
│   │       ├── Header.tsx
│   │       └── Navigation.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts               # APIクライアント
│   │   │   ├── auth.ts
│   │   │   ├── matching.ts
│   │   │   ├── ar-session.ts
│   │   │   └── ai.ts                   # AI API
│   │   ├── ar/
│   │   │   ├── scene-manager.ts        # Three.jsシーン管理
│   │   │   ├── avatar-loader.ts        # GLTFモデルローダー
│   │   │   └── animation-controller.ts # アニメーション
│   │   ├── audio/
│   │   │   ├── recorder.ts             # 音声録音
│   │   │   └── player.ts               # 音声再生
│   │   ├── websocket/
│   │   │   └── cable.ts                # Action Cable接続
│   │   └── store/
│   │       ├── auth.ts                 # Zustand: 認証状態
│   │       ├── conversation.ts
│   │       └── ar-session.ts
│   └── types/
│       ├── user.ts
│       ├── matching.ts
│       ├── ar.ts
│       └── ai.ts
├── public/
│   ├── models/                          # 3Dモデル
│   └── audio/                           # 音声ファイル
├── package.json
├── next.config.js
└── tsconfig.json
```

### 主要機能

#### 1. AR表示機能
- **Three.js / React Three Fiber**を使用
- GLTFフォーマットの3Dアバター読み込み
- リアルタイムアニメーション（口パク、表情）
- AI応答に合わせたアバター動作

#### 2. AI会話機能
- **音声入力**: Web Audio API → Transcribe
- **AI応答**: Bedrock (Claude) → テキスト生成
- **音声出力**: Polly → 音声再生
- **アバター同期**: AI応答に合わせて口パク・表情変化

#### 3. マッチング機能
- Tinder風スワイプUI
- フィルター機能（年齢、性別、カップ数、性格）
- 相性スコア表示

#### 4. リアルタイム通信
- Action CableによるWebSocket接続
- メッセージのリアルタイム送受信
- ARセッション内のアバター位置同期
- AI応答のストリーミング配信

#### 5. 認証フロー
- AWS Cognito統合
- JWT トークン管理（IdToken, AccessToken）
- 自動リフレッシュ

---

## Backend設計

### ディレクトリ構成（Rails 8 API）
```
backend/
├── app/
│   ├── controllers/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth_controller.rb
│   │   │       ├── users_controller.rb
│   │   │       ├── profiles_controller.rb
│   │   │       ├── ar_avatars_controller.rb
│   │   │       ├── likes_controller.rb
│   │   │       ├── matches_controller.rb
│   │   │       ├── conversations_controller.rb
│   │   │       ├── messages_controller.rb
│   │   │       ├── ar_sessions_controller.rb
│   │   │       └── ai_controller.rb           # AI API
│   ├── models/
│   │   ├── user.rb
│   │   ├── profile.rb
│   │   ├── ar_avatar.rb
│   │   ├── like.rb
│   │   ├── match.rb
│   │   ├── conversation.rb
│   │   ├── message.rb
│   │   └── ar_session.rb
│   ├── services/
│   │   ├── auth/
│   │   │   ├── cognito_service.rb              # Cognito認証
│   │   │   └── token_service.rb                # JWT検証
│   │   ├── matching/
│   │   │   ├── discovery_service.rb            # マッチング候補
│   │   │   ├── compatibility_service.rb        # 相性スコア
│   │   │   └── match_service.rb                # マッチング処理
│   │   ├── ar/
│   │   │   ├── avatar_generator_service.rb     # アバター生成
│   │   │   └── session_manager_service.rb      # ARセッション管理
│   │   ├── ai/
│   │   │   ├── bedrock_service.rb              # Bedrock (Claude)
│   │   │   ├── polly_service.rb                # Amazon Polly
│   │   │   └── transcribe_service.rb           # Amazon Transcribe
│   │   └── storage/
│   │       └── s3_service.rb                   # S3アップロード
│   ├── channels/
│   │   ├── application_cable/
│   │   ├── conversation_channel.rb
│   │   ├── ar_session_channel.rb
│   │   ├── match_notification_channel.rb
│   │   └── ai_response_channel.rb              # AIストリーミング
│   └── jobs/
│       ├── match_notification_job.rb
│       ├── avatar_processing_job.rb
│       ├── ai_conversation_job.rb              # AI会話処理
│       └── cleanup_sessions_job.rb
├── config/
│   ├── routes.rb
│   ├── database.yml
│   ├── cable.yml
│   └── sidekiq.yml
├── db/
│   ├── migrate/
│   └── schema.rb
├── Gemfile
└── Dockerfile
```

### Gemfile (Rails 8)
```ruby
source 'https://rubygems.org'

ruby '3.3.0'

gem 'rails', '~> 8.0'
gem 'mysql2'
gem 'puma'
gem 'redis'
gem 'sidekiq'                    # Job Queue
gem 'aws-sdk-cognitoidentityprovider'  # Cognito
gem 'aws-sdk-s3'                 # S3
gem 'aws-sdk-bedrockruntime'     # Bedrock
gem 'aws-sdk-polly'              # Polly
gem 'aws-sdk-transcribeservice'  # Transcribe
gem 'jwt'                        # JWT Token
gem 'bcrypt'                     # パスワードハッシュ（予備）
gem 'rack-cors'                  # CORS
gem 'bootsnap', require: false

group :development, :test do
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'pry-rails'
end
```

### 主要サービスロジック

#### AI会話サービス (Bedrock)
```ruby
# app/services/ai/bedrock_service.rb
class Ai::BedrockService
  def initialize
    @client = Aws::BedrockRuntime::Client.new(region: 'ap-northeast-1')
  end

  def chat(message, context = {})
    response = @client.invoke_model({
      model_id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      content_type: 'application/json',
      accept: 'application/json',
      body: {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: build_prompt(message, context)
          }
        ]
      }.to_json
    })

    parse_response(response.body)
  end

  private

  def build_prompt(message, context)
    personality = context[:personality] || 'friendly'
    interests = context[:interests] || []

    """
    あなたは#{personality}な性格で、#{interests.join('、')}に興味があります。
    自然な会話を心がけてください。

    ユーザーメッセージ: #{message}
    """
  end
end
```

#### 音声合成サービス (Polly)
```ruby
# app/services/ai/polly_service.rb
class Ai::PollyService
  def initialize
    @client = Aws::Polly::Client.new(region: 'ap-northeast-1')
    @s3_service = Storage::S3Service.new
  end

  def synthesize_speech(text, voice_id: 'Mizuki', engine: 'neural')
    response = @client.synthesize_speech({
      text: text,
      voice_id: voice_id,
      output_format: 'mp3',
      engine: engine,
      language_code: 'ja-JP'
    })

    # S3にアップロード
    audio_key = "audio/#{SecureRandom.uuid}.mp3"
    @s3_service.upload(audio_key, response.audio_stream.read)

    {
      audio_url: @s3_service.public_url(audio_key),
      duration: estimate_duration(text)
    }
  end

  private

  def estimate_duration(text)
    # 日本語の平均読み上げ速度: 約400文字/分
    (text.length / 400.0 * 60).round(1)
  end
end
```

#### 音声認識サービス (Transcribe)
```ruby
# app/services/ai/transcribe_service.rb
class Ai::TranscribeService
  def initialize
    @client = Aws::TranscribeService::Client.new(region: 'ap-northeast-1')
    @s3_service = Storage::S3Service.new
  end

  def transcribe_audio(audio_file, language: 'ja-JP')
    # 音声ファイルをS3にアップロード
    audio_key = "transcribe-input/#{SecureRandom.uuid}.wav"
    @s3_service.upload(audio_key, audio_file.read)

    # Transcribe ジョブ作成
    job_name = "transcribe-#{SecureRandom.uuid}"
    @client.start_transcription_job({
      transcription_job_name: job_name,
      language_code: language,
      media_format: 'wav',
      media: {
        media_file_uri: @s3_service.s3_uri(audio_key)
      }
    })

    # ジョブ完了待ち（Sidekiq Jobで非同期処理推奨）
    wait_for_completion(job_name)
  end

  private

  def wait_for_completion(job_name)
    loop do
      response = @client.get_transcription_job({
        transcription_job_name: job_name
      })

      status = response.transcription_job.transcription_job_status

      if status == 'COMPLETED'
        return extract_text(response)
      elsif status == 'FAILED'
        raise 'Transcription failed'
      end

      sleep 2
    end
  end

  def extract_text(response)
    transcript_uri = response.transcription_job.transcript.transcript_file_uri
    # URIから結果JSONを取得してパース
    # ... 実装
  end
end
```

---

## インフラ設計（AWS + EKS）

### リソース構成

```
[Route 53] (オプション)
    |
    v
[CloudFront]
    |
    +-- [S3] (Next.js静的ファイル)
    +-- [ALB + WAF]
         |
         v
[EKS Cluster]
    |
    +-- Node Group (EC2: t3.medium x2~4)
         |
         +-- [Rails API Pod] x 2-4
         +-- [Action Cable Pod] x 2-4
         +-- [Sidekiq Pod] x 1-2
         +-- [Prometheus] x 1
         +-- [Grafana] x 1
         |
         v
    +-- [RDS MySQL] (Multi-AZ)
    +-- [ElastiCache Redis]
    +-- [S3] (画像・3Dモデル)
    +-- [Cognito]
    +-- [Bedrock / Polly / Transcribe]
```

### 各リソースの詳細

#### VPC設計
- **3-Tier Architecture**
  - Public Subnet (2 AZ): ALB, NAT Gateway
  - Private Subnet (2 AZ - App): EKS Node Group
  - Private Subnet (2 AZ - Data): RDS, ElastiCache

#### EKS Cluster
- **Kubernetesバージョン**: 1.31
- **Node Group**:
  - インスタンスタイプ: t3.medium
  - ノード数: 2-4 (Auto Scaling)
  - AMI: Amazon Linux 2

#### Kubernetes リソース

**Rails API Deployment**
```yaml
# k8s/rails-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rails-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: rails-api
  template:
    metadata:
      labels:
        app: rails-api
    spec:
      containers:
      - name: rails
        image: <ECR_REPO>/rails-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

**Action Cable Deployment**
```yaml
# k8s/action-cable-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: action-cable
spec:
  replicas: 2
  selector:
    matchLabels:
      app: action-cable
  template:
    metadata:
      labels:
        app: action-cable
    spec:
      containers:
      - name: cable
        image: <ECR_REPO>/action-cable:latest
        ports:
        - containerPort: 28080
        env:
        - name: REDIS_URL
          value: redis://redis-service:6379
```

**Sidekiq Deployment**
```yaml
# k8s/sidekiq-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sidekiq
spec:
  replicas: 1
  selector:
    matchLabels:
      app: sidekiq
  template:
    metadata:
      labels:
        app: sidekiq
    spec:
      containers:
      - name: sidekiq
        image: <ECR_REPO>/rails-api:latest
        command: ["bundle", "exec", "sidekiq"]
        env:
        - name: REDIS_URL
          value: redis://redis-service:6379
```

**Prometheus Deployment**
```yaml
# k8s/prometheus-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
```

**Grafana Deployment**
```yaml
# k8s/grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-credentials
              key: password
```

#### ALB + WAF
- **ALB**: EKSへのトラフィック振り分け
- **WAF**: DDoS保護、SQLインジェクション対策
  - AWS Managed Rules使用
  - Rate Limiting: 2000 req/5min per IP

#### RDS MySQL
- **インスタンス**: db.t4g.medium
- **Multi-AZ**: 有効
- **自動バックアップ**: 7日間保持
- **暗号化**: 有効
- **ストレージ**: 100GB (Auto Scaling有効)

#### ElastiCache Redis
- **用途**:
  - セッションストア
  - Action Cableアダプタ
  - Sidekiq Queue
  - マッチングキャッシュ
- **インスタンス**: cache.t4g.small
- **レプリケーション**: 有効

#### S3バケット

**1. ユーザーアセット** (`link_persona-user-assets-production`)
- プロフィール画像
- ARアバター3Dモデル
- AI音声ファイル
- CloudFront配信
- ライフサイクル: 90日未アクセス→IA移行

**2. フロントエンド** (`link_persona-frontend-production`)
- Next.js ビルド成果物
- CloudFront Origin

**3. Transcribe入力** (`link_persona-transcribe-input`)
- 音声認識用一時ファイル
- ライフサイクル: 1日後削除

#### CloudFront

**利点**:
1. **高速配信**: エッジロケーションからの配信で低レイテンシ
2. **コスト削減**: S3への直接アクセス削減
3. **HTTPS簡単設定**: ACM証明書統合
4. **キャッシュ**: 静的ファイル・3Dモデルのキャッシュ
5. **セキュリティ**: OAI (Origin Access Identity) でS3を保護

**ディストリビューション1**: フロントエンド配信
- Origin: S3 (link_persona-frontend-production)
- Behavior: Cache all
- SSL/TLS: TLS 1.2以上

**ディストリビューション2**: アセット配信
- Origin: S3 (link_persona-user-assets-production)
- Behavior: Cache 1年
- Custom Headers: CORS

#### Cognito
- **User Pool**: ユーザー認証
- **属性**: email, username
- **MFA**: オプション（SMS/TOTP）
- **パスワードポリシー**: 8文字以上、大小英数字
- **トークン有効期限**:
  - IdToken: 1時間
  - AccessToken: 1時間
  - RefreshToken: 30日

#### AWS AI/ML サービス

**Amazon Bedrock**
- **モデル**: Claude 3.5 Sonnet
- **リージョン**: ap-northeast-1
- **用途**: AI会話生成

**Amazon Polly**
- **音声**: Mizuki (日本語女性), Takumi (日本語男性)
- **エンジン**: Neural TTS
- **用途**: テキスト→音声変換

**Amazon Transcribe**
- **言語**: ja-JP
- **用途**: 音声→テキスト変換
- **リアルタイム対応**: Transcribe Streaming API

---

## モニタリング設計（Prometheus + Grafana）

### Prometheus設定

**prometheus.yml**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  # Rails API メトリクス
  - job_name: 'rails-api'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: rails-api
        action: keep

  # Action Cable メトリクス
  - job_name: 'action-cable'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: action-cable
        action: keep

  # Sidekiq メトリクス
  - job_name: 'sidekiq'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: sidekiq
        action: keep

  # Node Exporter
  - job_name: 'node'
    kubernetes_sd_configs:
      - role: node

  # kube-state-metrics
  - job_name: 'kube-state-metrics'
    static_configs:
      - targets: ['kube-state-metrics:8080']
```

### Grafana ダッシュボード

**主要メトリクス**:
1. **Kubernetes Cluster**
   - ノードCPU/メモリ使用率
   - Pod数、再起動回数
   - ネットワークトラフィック

2. **Rails API**
   - リクエスト数、レイテンシ
   - エラー率（4xx, 5xx）
   - アクティブコネクション数

3. **Action Cable**
   - WebSocket接続数
   - メッセージ送受信数
   - 接続エラー

4. **Sidekiq**
   - Job処理数、失敗数
   - Queue深度
   - 処理レイテンシ

5. **RDS**
   - 接続数、CPU使用率
   - クエリレイテンシ
   - ストレージ使用量

6. **Redis**
   - メモリ使用率
   - キャッシュヒット率
   - コネクション数

7. **AI/ML**
   - Bedrock リクエスト数、レイテンシ
   - Polly 音声合成数
   - Transcribe 処理時間

### CloudWatch Logs統合
- Fluent Bit DaemonSetでログ収集
- CloudWatch Logs Insightsでログ分析

---

## CI/CD設計

### GitHub Actions ワークフロー

#### 1. Frontend CI/CD
```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Build
        run: |
          cd frontend
          npm ci
          npm run build
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/out s3://link_persona-frontend-production --delete
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

#### 2. Backend CI/CD
```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: link_persona_test
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
      - name: Run RSpec
        run: |
          cd backend
          bundle exec rspec

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      - uses: aws-actions/amazon-ecr-login@v2
      - name: Build and Push
        run: |
          cd backend
          docker build -t link_persona-api .
          docker tag link_persona-api:latest ${{ secrets.ECR_REGISTRY }}/link_persona-api:${{ github.sha }}
          docker tag link_persona-api:latest ${{ secrets.ECR_REGISTRY }}/link_persona-api:latest
          docker push ${{ secrets.ECR_REGISTRY }}/link_persona-api:${{ github.sha }}
          docker push ${{ secrets.ECR_REGISTRY }}/link_persona-api:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig --name link_persona-cluster --region ap-northeast-1
      - name: Deploy to EKS
        run: |
          kubectl set image deployment/rails-api \
            rails=${{ secrets.ECR_REGISTRY }}/link_persona-api:${{ github.sha }}
          kubectl set image deployment/action-cable \
            cable=${{ secrets.ECR_REGISTRY }}/link_persona-api:${{ github.sha }}
          kubectl set image deployment/sidekiq \
            sidekiq=${{ secrets.ECR_REGISTRY }}/link_persona-api:${{ github.sha }}
          kubectl rollout status deployment/rails-api
```

#### 3. Infrastructure (Terraform)
```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  pull_request:
    paths:
      - 'terraform/**'
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      - name: Terraform Format
        run: |
          cd terraform
          terraform fmt -check
      - name: Terraform Init
        run: |
          cd terraform
          terraform init
      - name: Terraform Validate
        run: |
          cd terraform
          terraform validate
      - name: Terraform Plan
        run: |
          cd terraform
          terraform plan
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: |
          cd terraform
          terraform apply -auto-approve
```

**Note**: Terraformのステートファイルはローカル管理のため、手動デプロイも推奨

---

## セキュリティ設計

### 認証・認可
- **AWS Cognito**でユーザー認証
- **JWT トークン**（IdToken）をAuthorizationヘッダーで送信
- **リフレッシュトークン**でセッション延長
- **CORS設定**: 許可されたオリジンのみ

### データ保護
- **RDS暗号化**: AES-256
- **S3暗号化**: SSE-S3
- **通信暗号化**: TLS 1.2以上
- **Secrets Manager**: DB認証情報、API Key管理

### アクセス制御
- **IAMロール**: EKS Node, Podへのリソースアクセス
- **IRSA** (IAM Roles for Service Accounts): Pod単位のIAM権限
- **Security Group**: ネットワーク制限
- **WAF**: DDoS保護、SQLi/XSS対策

### WAF ルール
```hcl
# terraform/waf.tf
resource "aws_wafv2_web_acl" "main" {
  name  = "link_persona-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }
  }

  # Rate Limiting
  rule {
    name     = "RateLimitRule"
    priority = 2

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
  }
}
```

---

## パフォーマンス最適化

### フロントエンド
- **Next.js 15**: Server Components、Streaming
- **画像最適化**: next/image、WebP形式
- **Code Splitting**: Dynamic Import
- **CDN配信**: CloudFront
- **AR最適化**:
  - 3DモデルのLOD（Level of Detail）
  - テクスチャ圧縮（Draco, KTX2）
  - インスタンシング

### バックエンド
- **クエリ最適化**: N+1クエリ削減（Bullet gem）
- **eager loading**: includes, preload
- **Redis キャッシュ**:
  - マッチング候補リスト（5分TTL）
  - プロフィール情報（10分TTL）
  - AI会話履歴（セッション間）
- **Sidekiq非同期処理**:
  - アバター画像処理
  - AI音声合成（Polly）
  - 通知送信
  - マッチングスコア計算

### データベース
- **インデックス最適化**: 複合インデックス
- **コネクションプーリング**: PgBouncer風
- **Read Replica** (将来): 読み取り負荷分散

### AI/ML最適化
- **Bedrock**: ストリーミングレスポンス
- **Polly**: 音声キャッシュ（同じテキストは再利用）
- **Transcribe**: ストリーミングモード

---

## スケーラビリティ

### 水平スケーリング
- **EKS HPA** (Horizontal Pod Autoscaler):
  - Rails API: CPU 70%でスケール（2-8 Pod）
  - Action Cable: コネクション数でスケール（2-6 Pod）
  - Sidekiq: Queue深度でスケール（1-4 Pod）

### データベーススケーリング
- **RDS**: ストレージ自動拡張
- **ElastiCache**: クラスタモード（将来）

### キャッシュ戦略
- **多層キャッシュ**:
  1. ブラウザキャッシュ
  2. CloudFront（1年）
  3. Redisアプリケーションキャッシュ（5-10分）
  4. RDSクエリキャッシュ

---

## コスト見積もり（月間）

| サービス | 仕様 | 月額 (USD) |
|---------|------|-----------|
| EKS Cluster | 1クラスタ | $73 |
| EC2 (Node) | t3.medium x3 | $90 |
| RDS MySQL | db.t4g.medium Multi-AZ | $120 |
| ElastiCache | cache.t4g.small | $50 |
| S3 | 100GB + 転送 | $10 |
| CloudFront | 50GB転送 | $5 |
| ALB | 1個 | $20 |
| Cognito | 10,000 MAU | $0 (無料枠) |
| Bedrock | 1M tokens | $15 |
| Polly | 100万文字 | $16 |
| Transcribe | 100時間 | $144 |
| **合計** | | **$543** |

---

## ドメイン設定（ALBドメイン使用）

### ALB DNS名
- **フォーマット**: `link_persona-alb-1234567890.ap-northeast-1.elb.amazonaws.com`
- **HTTPS**: ACM証明書（ワイルドカード対応可）

### API エンドポイント
- **REST API**: `https://<ALB-DNS-NAME>/api/v1/...`
- **WebSocket**: `wss://<ALB-DNS-NAME>/cable`

### フロントエンド
- **CloudFront**: `https://d1234567890abc.cloudfront.net`
- 環境変数で APIエンドポイント指定

```typescript
// frontend/.env.production
NEXT_PUBLIC_API_URL=https://link_persona-alb-xxx.ap-northeast-1.elb.amazonaws.com
NEXT_PUBLIC_WS_URL=wss://link_persona-alb-xxx.ap-northeast-1.elb.amazonaws.com/cable
```

---

## 技術の無駄遣いポイント

1. **EKS + Prometheus + Grafana**: マッチングアプリに本格Kubernetes（オーバースペック）
2. **Amazon Bedrock (Claude)**: AIアバターとの会話生成
3. **Three.js AR**: ブラウザで3Dアバター表示
4. **Amazon Polly Neural TTS**: 自然な音声合成
5. **リアルタイムストリーミング**: WebSocket + AI応答のストリーミング
6. **マルチAZ構成**: 高可用性（個人プロジェクトで）
7. **CloudFront + WAF**: グローバル配信とセキュリティ
