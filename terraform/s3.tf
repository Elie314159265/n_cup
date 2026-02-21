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

resource "aws_s3_bucket_public_access_block" "user_assets" {
  bucket = aws_s3_bucket.user_assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_lifecycle_configuration" "user_assets" {
  bucket = aws_s3_bucket.user_assets.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

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

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "404.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
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

    expiration {
      days = 1
    }
  }
}
