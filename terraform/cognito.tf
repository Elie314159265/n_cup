# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool"

  # ユーザー名属性
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # パスワードポリシー: 8文字以上、大小英数字
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # MFA: オプション (SMS/TOTP)
  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  # スキーマ属性
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 255
    }
  }

  schema {
    name                = "username"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 50
    }
  }

  # メール認証設定
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "【LinkPersona】メールアドレスの確認"
    email_message        = "確認コード: {####}"
  }

  # アカウント復旧
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  tags = {
    Name = "${var.project_name}-user-pool"
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # トークン有効期限
  id_token_validity      = 60 # 1時間 (分単位)
  access_token_validity  = 60 # 1時間 (分単位)
  refresh_token_validity = 30 # 30日 (日単位)

  token_validity_units {
    id_token      = "minutes"
    access_token  = "minutes"
    refresh_token = "days"
  }

  # 認証フロー
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  # クライアントシークレットなし (モバイル/SPA向け)
  generate_secret = false

  # トークン失効を有効化
  enable_token_revocation = true

  # 認証属性読み取り権限
  read_attributes = [
    "email",
    "email_verified",
    "custom:username",
  ]

  write_attributes = [
    "email",
    "custom:username",
  ]
}
