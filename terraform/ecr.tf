# ECR Repository for Rails API
# Rails API, Action Cable, Sidekiq の各 Pod が同イメージを使用
resource "aws_ecr_repository" "rails_api" {
  name                 = "${var.project_name}-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# ライフサイクルポリシー: 最新10イメージのみ保持
resource "aws_ecr_lifecycle_policy" "rails_api" {
  repository = aws_ecr_repository.rails_api.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
