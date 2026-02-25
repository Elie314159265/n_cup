# S3 Bucket for User Assets
resource "aws_s3_bucket" "user_assets" {
  bucket = "${var.project_name}-user-assets-production"

  tags = {
    Name = "${var.project_name}-user-assets"
  }
}

resource "aws_s3_bucket_versioning" "user_assets" {
  bucket = aws_s3_bucket.user_assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "user_assets" {
  bucket = aws_s3_bucket.user_assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront OAI経由でのみアクセス可能にする（パブリックアクセス全遮断）
resource "aws_s3_bucket_public_access_block" "user_assets" {
  bucket = aws_s3_bucket.user_assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront OAIにのみGetObjectを許可するバケットポリシー
resource "aws_s3_bucket_policy" "user_assets" {
  bucket     = aws_s3_bucket.user_assets.id
  depends_on = [aws_s3_bucket_public_access_block.user_assets]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.assets.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.user_assets.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "user_assets" {
  bucket = aws_s3_bucket.user_assets.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    filter {}

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
  }
}

# S3 Bucket for Frontend
resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-production"

  tags = {
    Name = "${var.project_name}-frontend"
  }
}

# CloudFront OAI経由でのみアクセス可能にする（パブリックアクセス全遮断）
# これによりアカウントレベルのBlock Public Access設定に依存せずに済む
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront OAIにのみGetObjectを許可するバケットポリシー
# depends_onでpublic_access_blockの適用後にポリシーを設定することを保証する
resource "aws_s3_bucket_policy" "frontend" {
  bucket     = aws_s3_bucket.frontend.id
  depends_on = [aws_s3_bucket_public_access_block.frontend]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAI"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# S3 Bucket for Transcribe Input (temporary files)
resource "aws_s3_bucket" "transcribe_input" {
  bucket = "${var.project_name}-transcribe-input"

  tags = {
    Name = "${var.project_name}-transcribe-input"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "transcribe_input" {
  bucket = aws_s3_bucket.transcribe_input.id

  rule {
    id     = "delete-after-1-day"
    status = "Enabled"

    filter {}

    expiration {
      days = 1
    }
  }
}
