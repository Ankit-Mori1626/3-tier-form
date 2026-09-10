# 🚀 3-Tier Enterprise Submission Application

A production-grade 3-Tier application built with **HTML5/CSS3/JS (Frontend)**, **Node.js/Express (Backend API)**, and **AWS Aurora RDS PostgreSQL (Database Tier)** with **automatic table creation**, **Docker & Docker Compose**, and **Self-Managed Kubeadm Kubernetes Cluster on EC2**.

---

## 🏗️ Kubeadm + AWS Aurora RDS Architecture

```mermaid
graph TD
    Client["🌐 User Browser"] -->|Port 30080 (NodePort)| Worker["EC2 Kubeadm Worker Node<br/>(Public IP)"]
    Worker --> Frontend["Tier 1: Frontend Pods (Nginx)"]
    Frontend --> Backend["Tier 2: Backend Pods (Node.js API)"]
    Backend -->|Port 5432 + SSL| Aurora[("🗄️ AWS Aurora RDS PostgreSQL Cluster<br/>(Managed Multi-AZ Database)")]
```

---

## 📁 Repository Structure

```
Form/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Auto table creation, Connection pool & RDS SSL support
│   │   ├── controllers/
│   │   │   └── submissionController.js
│   │   ├── routes/
│   │   │   └── submissionRoutes.js
│   │   └── server.js            # Express server & /health probe
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/
│   ├── src/
│   │   ├── index.html           # Modern Submission UI & Success Confirmation
│   │   ├── style.css            # Dark Glassmorphism Theme
│   │   └── app.js               # Form submission logic & health polling
│   ├── nginx.conf               # Nginx Reverse Proxy Config
│   ├── Dockerfile
│   └── .dockerignore
├── k8s-kubeadm/                 # ☸️ Kubeadm Cluster Manifests (Configured for AWS Aurora RDS)
│   ├── 00-namespace.yaml
│   ├── 01-rds-secret.yaml       # Aurora RDS Endpoint & Credentials
│   ├── 02-backend-deployment.yaml
│   ├── 03-backend-service.yaml
│   ├── 04-frontend-deployment.yaml
│   ├── 05-frontend-service.yaml # NodePort 30080 Service
│   └── kustomization.yaml
├── k8s/                         # 🏠 Local Standalone K8s (with local Postgres container)
├── docker-compose.yml           # 🐳 Local Docker Compose stack
├── .env
├── .env.example
└── README.md
```

---

## ☸️ Kubeadm Cluster Deployment Guide (Step-by-Step)

### Step 1: AWS Aurora PostgreSQL Cluster Setup
1. AWS Console me **RDS > Create Database** par jayein.
2. Select **Amazon Aurora (PostgreSQL Compatible)**.
3. Master username: `postgres`, password set karein.
4. Database name: `form_db`.
5. **Security Group Rule**: Aurora RDS ke security group me **Port 5432** par apne **Kubeadm EC2 Nodes (Security Group / VPC CIDR)** ko allow karein.
6. Note down the **Cluster Endpoint** (e.g. `mydb.cluster-xxxxxx.us-east-1.rds.amazonaws.com`).

---

### Step 2: EC2 Security Groups Configuration (Kubeadm)
Apne **Worker Node EC2** ke Security Group me inbound rules add karein:
- **Port 30080 (Custom TCP)**: `0.0.0.0/0` (Browser se access karne ke liye).
- **Port 6443 (Kubernetes API)**: Master node ke liye.

---

### Step 3: Docker Images Build & Push
Images ko Docker Hub ya AWS ECR par push karein:
```bash
# Docker Hub Example
docker build -t <your-dockerhub-username>/three-tier-backend:latest ./backend
docker push <your-dockerhub-username>/three-tier-backend:latest

docker build -t <your-dockerhub-username>/three-tier-frontend:latest ./frontend
docker push <your-dockerhub-username>/three-tier-frontend:latest
```

---

### Step 4: Configure `k8s-kubeadm/01-rds-secret.yaml`
`k8s-kubeadm/01-rds-secret.yaml` file me apna Aurora RDS endpoint aur password dalein:
```yaml
stringData:
  DB_HOST: "your-aurora-cluster.cluster-xxxxxx.us-east-1.rds.amazonaws.com"
  DB_PORT: "5432"
  DB_USER: "postgres"
  DB_PASSWORD: "YourAuroraPassword123"
  DB_NAME: "form_db"
  DB_SSL: "true"
```

---

### Step 5: Deploy to Kubeadm Master Node
Master Node par ye command run karein:
```bash
kubectl apply -k k8s-kubeadm/
```

Verify pods:
```bash
kubectl get pods,svc -n three-tier-app -o wide
```

---

### Step 6: Access Application in Browser
Browser me apne kisi bhi **EC2 Worker Node ka Public IP** open karein:
```
http://<EC2-WORKER-NODE-PUBLIC-IP>:30080
```

---

## ⚡ Local Testing with Docker Compose

```bash
docker compose up --build -d
```
- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:5000/api/submissions](http://localhost:5000/api/submissions)
