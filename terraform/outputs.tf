output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive   = true
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "cloudfront_assets_domain" {
  description = "CloudFront distribution domain for user assets"
  value       = aws_cloudfront_distribution.assets.domain_name
}

output "cloudfront_frontend_domain" {
  description = "CloudFront distribution domain for frontend (also proxies /api/* and /cable* to ALB)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_bucket_assets" {
  description = "S3 bucket for user assets"
  value       = aws_s3_bucket.user_assets.bucket
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
  sensitive   = true
}

output "ecr_repository_url" {
  description = "ECR repository URL for Rails API image"
  value       = aws_ecr_repository.rails_api.repository_url
}

output "rails_api_irsa_role_arn" {
  description = "IAM Role ARN for Rails API IRSA (set this in k8s/rails-api-sa.yaml annotation)"
  value       = aws_iam_role.rails_api.arn
}

output "aws_lbc_role_arn" {
  description = "IAM Role ARN for AWS Load Balancer Controller (set this in k8s/aws-lbc-serviceaccount.yaml annotation)"
  value       = aws_iam_role.aws_lbc.arn
}

output "rails_api_target_group_arn" {
  description = "ALB Target Group ARN for Rails API (set this in k8s/targetgroupbinding.yaml)"
  value       = aws_lb_target_group.rails_api.arn
}

output "action_cable_target_group_arn" {
  description = "ALB Target Group ARN for Action Cable (set this in k8s/targetgroupbinding.yaml)"
  value       = aws_lb_target_group.action_cable.arn
}
