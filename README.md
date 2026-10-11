# CloudTask — Cloud-Native Task Manager

A full-stack task management application built with React, Node.js, Express, and MongoDB Atlas, packaged with Docker and deployed to Kubernetes.

## Features

- Create tasks with a title and optional description.
- Mark tasks complete or incomplete.
- Delete tasks and refresh the task list.
- REST API health endpoint that reports application and database status.
- Nginx serves the React frontend and proxies `/api/*` requests to the backend.
- Docker Compose for local containerized development.
- Kubernetes Deployments and Services with two frontend replicas and two backend replicas.
- Kubernetes readiness/liveness probes and CPU/memory requests and limits.

## Architecture

```text
Browser
  |
  v
React frontend (Nginx :80)
  |  /api/*
  v
Express API (:5000)  <---- Kubernetes ClusterIP Service
  |
  v
MongoDB Atlas

Local Docker Compose: http://localhost:8080
Kubernetes (port-forward): http://localhost:8081
```

The backend uses Mongoose to connect to MongoDB Atlas. The frontend talks to the API through Nginx, so the browser uses the same origin for UI and API requests.

## Technology stack

- **Frontend:** React, Vite, Lucide, Nginx
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB Atlas
- **Containers:** Docker, Docker Compose
- **Orchestration:** Kubernetes (tested with Docker Desktop Kubernetes)

## Prerequisites

- Git
- Docker Desktop with Docker Compose
- Node.js and npm (only needed for running/building the app outside containers)
- Kubernetes enabled in Docker Desktop and `kubectl` (for Kubernetes deployment)
- A MongoDB Atlas database and database user

## Configuration and secrets

Create `server/.env` locally. Do not commit this file.

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
```

Use the connection string from MongoDB Atlas and replace the placeholders locally. URL-encode reserved characters in the username/password portion as required (for example, `@` becomes `%40`). Never paste credentials into issues, chat, screenshots, or commits.

## Run with Docker Compose

From the repository root:

```powershell
# Build and start the frontend and backend
docker compose up -d --build

# Check service status
docker compose ps

# Inspect backend startup logs
docker compose logs --tail=50 backend

# Test the health endpoint
Invoke-RestMethod http://localhost:8080/api/health
```

Open [http://localhost:8080](http://localhost:8080).

Expected health response includes `status: ok`, `service: cloudtask-api`, and `database: connected`.

To stop the stack:

```powershell
docker compose down
```

## Deploy to Kubernetes

The manifests in `k8s/` define two backend replicas, two frontend replicas, Services, health probes, and resource requests/limits. The backend expects a Kubernetes Secret named `cloudtask-backend-secret` with `MONGODB_URI` and `PORT` keys.

### 1. Create/update the Secret locally

First create or update `server/.env` with the valid Atlas URI. From PowerShell at the repository root, run the following to apply the values without printing the URI:

```powershell
$line = Get-Content .\server\.env |
    Where-Object { $_ -match '^\s*MONGODB_URI\s*=' } |
    Select-Object -First 1

if (-not $line) { throw "MONGODB_URI not found in server/.env" }

$uri = ($line -replace '^\s*MONGODB_URI\s*=', '').Trim().Trim('"').Trim("'")

kubectl create secret generic cloudtask-backend-secret `
    --from-literal="MONGODB_URI=$uri" `
    --from-literal="PORT=5000" `
    --dry-run=client -o yaml |
    kubectl apply -f -
```

Kubernetes Secret values are base64-encoded, not encrypted by that encoding alone. Restrict cluster access and use your platform's secret-management/encryption controls for production.

### 2. Apply the manifests

Make sure the image names/tags in the deployment manifests exist in a registry accessible to your cluster, then run:

```powershell
kubectl apply -f k8s/
kubectl rollout status deployment/backend --timeout=180s
kubectl rollout status deployment/frontend --timeout=180s
kubectl get deployments
kubectl get pods
kubectl get services
```

### 3. Access the frontend

Docker Desktop may not expose a NodePort directly to Windows in every setup. Port-forwarding is a reliable local option:

```powershell
kubectl port-forward service/frontend 8081:80
```

Keep that terminal open and visit [http://localhost:8081](http://localhost:8081). Test the API through the frontend service:

```powershell
Invoke-RestMethod http://localhost:8081/api/health
```

### Useful Kubernetes commands

```powershell
kubectl logs deployment/backend --tail=50
kubectl describe deployment backend
kubectl describe secret cloudtask-backend-secret
kubectl rollout restart deployment/backend
kubectl rollout status deployment/backend
kubectl get events --sort-by=.lastTimestamp
```

Do not use `kubectl get secret ... -o yaml` when sharing terminal output; it can expose encoded secret values.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API and MongoDB connection status |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update task fields, including completion |
| DELETE | `/api/tasks/:id` | Delete a task |

## Security checklist

- [ ] Rotate any database password that has been exposed or shared.
- [ ] Keep `server/.env` out of Git and never commit credentials.
- [ ] Keep Kubernetes Secret manifests with real values out of the repository.
- [ ] Use least-privilege MongoDB database users and Atlas network access rules.
- [ ] Review Git history if a secret was ever committed. Removing a file from the latest commit does not remove it from history; rotate the credential first.
- [ ] Before making the repository public or sharing it, scan current files and Git history for secrets.

## Troubleshooting

**Docker Compose returns `502 Bad Gateway`**
- Run `docker compose ps` and `docker compose logs --tail=50 backend`.
- Confirm the backend is running and reports a successful MongoDB connection.
- If the backend container was recreated, recreate the frontend if needed: `docker compose up -d --force-recreate frontend`.

**Backend says `Invalid connection string`**
- Check that `MONGODB_URI` in `server/.env` is the actual Atlas URI, not a placeholder.
- Ensure reserved characters in credentials are URL-encoded.
- Recreate the backend after saving the file: `docker compose up -d --force-recreate backend`.

**MongoDB says `authentication failed` in Kubernetes**
- Update the `cloudtask-backend-secret` with the valid URI, then restart the backend Deployment.
- Check pod logs and wait for the rollout to complete.

**Kubernetes frontend isn't reachable on NodePort**
- Use `kubectl port-forward service/frontend 8081:80` and open `http://localhost:8081`.

## Local development (optional)

Install dependencies in each app directory, then run the corresponding package scripts:

```powershell
cd server
npm install
npm run dev
```

For the frontend, in a separate terminal:

```powershell
cd client
npm install
npm run dev
```

The containerized deployment is the primary documented path; local development may require configuring the frontend dev server's API proxy if it is not using the Nginx container.
