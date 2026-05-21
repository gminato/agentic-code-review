# Frontend Dependencies Backlog

This document tracks missing backend features and API endpoints required to fulfill the frontend specification.

## High Priority (Core Workflow)

### 1. Dashboard Metrics Endpoint
- **Requirement**: The Dashboard needs aggregated data (Total repos, reviews today, open PRs count, AI findings count, health trends).
- **Proposed Endpoint**: `GET /api/v1/dashboard/stats`
- **Missing**: No aggregation logic or endpoint in the backend.

### 2. Agents Management API
- **Requirement**: Full CRUD for Agents (Create, List, Edit, Delete).
- **Proposed Endpoint**: `GET/POST/PATCH/DELETE /api/v1/agents`
- **Missing**: `Agent` model exists, but no API router or endpoints are implemented.

### 3. Cron Jobs Management API
- **Requirement**: Full CRUD for Cron Jobs.
- **Proposed Endpoint**: `GET/POST/PATCH/DELETE /api/v1/cron-jobs`
- **Missing**: `CronJob` model and scheduler exist, but no API router or endpoints are implemented.

### 4. Pull Requests Listing
- **Requirement**: List PRs for a specific repository.
- **Proposed Endpoint**: `GET /api/v1/repositories/{repo_id}/pull-requests`
- **Missing**: Backend lacks an endpoint to fetch or proxy PR lists from GitHub.

## Medium Priority (Settings & Refinement)

### 5. GitHub App Installation Management
- **Requirement**: Manage GitHub installations and repository sync.
- **Proposed Endpoint**: `GET /api/v1/settings/installations`
- **Missing**: No API to list or manage installations for the current user.

### 6. Search & Command Palette Backend
- **Requirement**: Global search for repositories, commits, and findings.
- **Proposed Endpoint**: `GET /api/v1/search?q=...`
- **Missing**: No unified search endpoint.

## Low Priority (User Experience)

### 7. User Notifications API
- **Requirement**: Fetch notifications for the logged-in user.
- **Proposed Endpoint**: `GET /api/v1/notifications`
- **Missing**: No notification model or API.
