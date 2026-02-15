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
- `_SERVER_TIMEOUT` (default `3600`)
- `_SERVER_MIN_INSTANCES` (default `1`)
- `_SERVER_MAX_INSTANCES` (default `1`)
- `_SESSION_STATE_FILE` (default empty; when set, pipeline writes this to `SESSION_STATE_FILE` on server service)
- `_SESSION_STATE_BUCKET` (default empty; when set, pipeline configures Cloud Storage volume mount)
- `_SESSION_STATE_MOUNT_PATH` (default `/mnt/session-state`)
- `_SESSION_STATE_FILENAME` (default `sessions.json`)
- `_SESSION_STATE_VOLUME_NAME` (default `session-state`)

## Session Persistence

The server now supports durable session snapshots via `SESSION_STATE_FILE`.

- If unset, sessions remain in-memory only.
- If set, the server loads snapshot state on boot and persists lobby/game changes after each successful mutation.
- If `_SESSION_STATE_BUCKET` is set, the pipeline mounts that bucket into Cloud Run and sets `SESSION_STATE_FILE` to `${_SESSION_STATE_MOUNT_PATH}/${_SESSION_STATE_FILENAME}` automatically.
- For real failover across instances, use `_SESSION_STATE_BUCKET` (single local disk paths only protect same-instance restarts).
