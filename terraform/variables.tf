variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "link_persona"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "link_persona-cluster"
}

variable "node_instance_type" {
  description = "EKS node instance type"
  type        = string
  default     = "t3.medium"
}

variable "desired_node_count" {
  description = "Desired number of EKS nodes"
  type        = number
  default     = 2
}

variable "min_node_count" {
  description = "Minimum number of EKS nodes"
  type        = number
  default     = 2
}

variable "max_node_count" {
  description = "Maximum number of EKS nodes"
  type        = number
  default     = 4
}
