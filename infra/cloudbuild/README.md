# Google Cloud CI/CD

This repository now includes a single Cloud Build pipeline at `cloudbuild.yaml`.

## Pipeline Behavior

1. Installs monorepo dependencies with `npm ci`.
2. Runs `npm test`.
3. Runs `npm run build`.
4. Builds and pushes the backend image from `server/Dockerfile`.
5. Deploys the backend to Cloud Run.
6. Resolves the backend Cloud Run URL and converts it to a WebSocket URL.
7. Builds and pushes the frontend image from `client/Dockerfile` with `VITE_SERVER_URL`.
8. Deploys the frontend to Cloud Run.

## Required GCP Setup

1. Enable APIs: Cloud Build, Cloud Run, Artifact Registry.
2. Create an Artifact Registry Docker repository (default in pipeline: `carcassonne`).
3. Grant the Cloud Build service account:
   - `roles/run.admin`
   - `roles/iam.serviceAccountUser`
   - `roles/artifactregistry.writer`

## Trigger Configuration

Create a Cloud Build trigger that points to `cloudbuild.yaml` on your deployment branch and set substitutions as needed:

- `_REGION` (default `us-central1`)
- `_AR_REPOSITORY` (default `carcassonne`)
- `_SERVER_SERVICE` (default `carcassonne-server`)
- `_CLIENT_SERVICE` (default `carcassonne-client`)
- `_ALLOW_UNAUTHENTICATED` (`true` or `false`)
