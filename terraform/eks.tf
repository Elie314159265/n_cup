# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = var.eks_cluster_name
  cluster_version = "1.31"

  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private_app[*].id

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    main = {
      desired_size = var.desired_node_count
      min_size     = var.min_node_count
      max_size     = var.max_node_count

      instance_types = [var.node_instance_type]
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = "production"
        GithubRepo  = "link_persona"
      }

      tags = {
        Name = "${var.project_name}-node"
      }
    }
  }

  tags = {
    Environment = "production"
  }
}
