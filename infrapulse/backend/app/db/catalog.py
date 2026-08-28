DEFAULT_TOPICS = [
    {"name": "IAM least privilege for production roles", "category": "AWS"},
    {"name": "S3 bucket encryption and public access blocks", "category": "AWS"},
    {"name": "VPC design with private subnets and NAT", "category": "AWS"},
    {"name": "Azure Private Endpoints for PaaS services", "category": "Azure"},
    {"name": "Azure Policy as preventative guardrails", "category": "Azure"},
    {"name": "Multi-cloud identity federation", "category": "Cloud Infrastructure"},
    {"name": "DNS, TLS, and certificate rotation", "category": "Networking"},
    {"name": "Zero-trust network segmentation", "category": "Networking"},
    {"name": "Linux systemd service hardening", "category": "Linux"},
    {"name": "Windows Server patch windows and WSUS", "category": "Windows Server"},
    {"name": "GitOps promotion between environments", "category": "DevOps"},
    {"name": "Terraform state locking and remote backends", "category": "Terraform"},
    {"name": "Docker image provenance and distroless runtimes", "category": "Docker"},
    {"name": "Kubernetes PodDisruptionBudgets and rollouts", "category": "Kubernetes"},
    {"name": "GitHub Actions OIDC to cloud roles", "category": "CI/CD"},
    {"name": "SLO-based alerting instead of noisy thresholds", "category": "Monitoring"},
    {"name": "Distributed tracing across service boundaries", "category": "Observability"},
    {"name": "Secrets management and rotation", "category": "Cloud Security"},
    {"name": "Designing for blast-radius isolation", "category": "System Design"},
    {"name": "Idempotent consumers in distributed systems", "category": "Distributed Systems"},
    {"name": "Multi-AZ failover that actually works", "category": "High Availability"},
    {"name": "Backup immutability and restore drills", "category": "Disaster Recovery"},
    {"name": "Infrastructure automation with least-privilege runners", "category": "Infrastructure Automation"},
]


SETTING_DEFAULTS = {
    "ai_provider": "demo",
    "scheduler_enabled": "true",
    "schedule_time": "09:00",
    "timezone": "UTC",
    "demo_mode": "true",
}
