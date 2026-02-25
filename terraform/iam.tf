data "aws_caller_identity" "current" {}

# -------------------------------------------------------
# IRSA (IAM Roles for Service Accounts) for Rails API Pod
# EKSのOIDCプロバイダーを利用してPodレベルでIAM権限を付与する
# -------------------------------------------------------

# Rails API用IAMロールの信頼ポリシー
data "aws_iam_policy_document" "rails_api_irsa_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [module.eks.oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:default:rails-api"]
    }

    condition {
      test     = "StringEquals"
      variable = "${replace(module.eks.cluster_oidc_issuer_url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

# Rails API用IAMロール
resource "aws_iam_role" "rails_api" {
  name               = "${var.project_name}-rails-api-role"
  assume_role_policy = data.aws_iam_policy_document.rails_api_irsa_trust.json

  tags = {
    Name = "${var.project_name}-rails-api-role"
  }
}

# IAMポリシー: S3アクセス（ユーザーアセット・Transcribe入力バケット）
resource "aws_iam_policy" "rails_api_s3" {
  name        = "${var.project_name}-rails-api-s3"
  description = "Allow Rails API pod to access user assets and transcribe input S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "${aws_s3_bucket.user_assets.arn}/*",
          "${aws_s3_bucket.transcribe_input.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.user_assets.arn,
          aws_s3_bucket.transcribe_input.arn
        ]
      }
    ]
  })
}

# IAMポリシー: Amazon Bedrockアクセス（Claude AI）
resource "aws_iam_policy" "rails_api_bedrock" {
  name        = "${var.project_name}-rails-api-bedrock"
  description = "Allow Rails API pod to invoke Bedrock foundation models"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"
        ]
      }
    ]
  })
}

# IAMポリシー: Amazon Pollyアクセス（音声合成）
resource "aws_iam_policy" "rails_api_polly" {
  name        = "${var.project_name}-rails-api-polly"
  description = "Allow Rails API pod to synthesize speech via Polly"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["polly:SynthesizeSpeech"]
        Resource = "*"
      }
    ]
  })
}

# IAMポリシー: Amazon Transcribeアクセス（音声認識）
resource "aws_iam_policy" "rails_api_transcribe" {
  name        = "${var.project_name}-rails-api-transcribe"
  description = "Allow Rails API pod to run transcription jobs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob",
          "transcribe:DeleteTranscriptionJob"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAMポリシー: Amazon Cognitoアクセス（ユーザー情報取得）
resource "aws_iam_policy" "rails_api_cognito" {
  name        = "${var.project_name}-rails-api-cognito"
  description = "Allow Rails API pod to verify tokens and fetch user info from Cognito"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:GetUser",
          "cognito-idp:AdminGetUser"
        ]
        Resource = aws_cognito_user_pool.main.arn
      }
    ]
  })
}

# ポリシーをロールにアタッチ
resource "aws_iam_role_policy_attachment" "rails_api_s3" {
  role       = aws_iam_role.rails_api.name
  policy_arn = aws_iam_policy.rails_api_s3.arn
}

resource "aws_iam_role_policy_attachment" "rails_api_bedrock" {
  role       = aws_iam_role.rails_api.name
  policy_arn = aws_iam_policy.rails_api_bedrock.arn
}

resource "aws_iam_role_policy_attachment" "rails_api_polly" {
  role       = aws_iam_role.rails_api.name
  policy_arn = aws_iam_policy.rails_api_polly.arn
}

resource "aws_iam_role_policy_attachment" "rails_api_transcribe" {
  role       = aws_iam_role.rails_api.name
  policy_arn = aws_iam_policy.rails_api_transcribe.arn
}

resource "aws_iam_role_policy_attachment" "rails_api_cognito" {
  role       = aws_iam_role.rails_api.name
  policy_arn = aws_iam_policy.rails_api_cognito.arn
}
