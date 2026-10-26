# LinkHub Server

> High-performance, secure REST API backend for the LinkHub customizable link-in-bio platform. Built with Express 5, TypeScript, Prisma 7, PostgreSQL, and Supabase Storage.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%206.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Storage-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

---

## Table of Contents

- [Overview](#overview)
- [The Problem & The Solution](#the-problem--the-solution)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Database Schema & Data Model](#database-schema--data-model)
- [API Reference](#api-reference)
  - [API Discovery](#api-discovery)
  - [Authentication & User Management](#authentication--user-management)
  - [Link Management](#link-management)
  - [Click Tracking & Analytics](#click-tracking--analytics)
  - [User Settings & Theming](#user-settings--theming)
- [Image Processing Pipeline](#image-processing-pipeline)
- [Security & Reliability](#security--reliability)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup & Migrations](#database-setup--migrations)
  - [Running the Server](#running-the-server)
- [Problems Solved & Engineering Highlights](#problems-solved--engineering-highlights)
- [Limitations & Roadmap](#limitations--roadmap)
- [License](#license)

---

## Overview

**LinkHub Server** provides the foundational REST API powering LinkHub, a modern link-in-bio platform that lets creators, businesses, and developers host branded landing pages, aggregate their external content, customize visual appearances, and monitor click analytics in real time.

Engineered with a layered architectural pattern (Controller &rarr; Service &rarr; Repository &rarr; Database), the service guarantees strict boundary isolation, resource ownership validation, automated WebP image transformation, and high-performance click aggregation.

---

## The Problem & The Solution

### The Problem
- **Platform Fragmentation:** Content creators distribute audience engagement across dozens of social networks, marketplaces, and portfolios, requiring a unified public gateway.
- **Heavy Asset Overhead:** Bio-link profile images uploaded directly from mobile devices often exceed multiple megabytes, drastically degrading public page load speeds and driving up bandwidth costs.
- **Inaccurate & Slow Analytics:** Naive analytics implementations either run expensive `COUNT(*)` queries across unbounded datasets or compromise database concurrency during traffic spikes.
- **Resource Ownership Vulnerabilities:** Common REST implementations frequently fail to bind update and delete mutations to the authenticated tenant, exposing link management to IDOR (Insecure Direct Object Reference) exploits.

### The Solution
- **Lightweight Public Profiles:** A dedicated public endpoint delivers only active links and essential profile metadata, omitting private credentials and minimizing payload size.
- **In-Memory Image Optimization:** Automatic pipeline using Multer memory storage and Sharp resizes profile avatars to 500&times;500 and compresses them to WebP (quality 80) before streaming directly to Supabase cloud storage.
- **Aggregated Analytics Engine:** Multi-interval click tracking supporting UTC-aligned daily counts, rolling 7-day and 30-day windows, and dimensional grouping (by country, device type, or browser) through Prisma grouping pipelines.
- **Strict Tenant Scoping:** Every link query, mutation, and deletion enforces strict ownership verification (`link_id` + `user_id`) at the database layer.

---

## Core Features

- **Authentication & Email Verification:**
  - Secure registration with bcrypt password hashing (salt rounds = 10).
  - Cryptographically secure 32-byte hex verification tokens (1-hour expiration) dispatched via Nodemailer SMTP.
  - Mandatory email verification gating user logins.
  - Stateless JWT authentication enforcing a minimum 256-bit secret length, standard `sub`, `jti`, `iss`, and `aud` claims.

- **Curated Link Management:**
  - Full CRUD operations with custom link titles, target URLs, icons, and link types.
  - Protocol whitelist validation (`http:`, `https:`, `mailto:`, `tel:`).
  - Automatic position sequencing (`maxPos + 1`) and custom order persistence.
  - Active/inactive toggle allowing links to be hidden without deletion.

- **Public Bio Profiles:**
  - Unauthenticated access via `/api/users/public-profile/:username`.
  - Exposes sanitized user details (display name, bio, profile image) and active links only.

- **Real-Time Click Analytics:**
  - Public telemetry ingestion (`POST /api/clicks/:linkId`) capturing device type, browser, and country without requiring user authentication.
  - Capitalized normalization for consistent aggregation dimensions.
  - Dashboard analytics: aggregate counts across distinct time intervals (Today UTC, 7-day rolling, 30-day rolling, all-time).
  - Breakdown analytics: group by country, device, or browser, and breakdown clicks by specific link titles.

- **Appearance Customization & Theming:**
  - Dedicated `user_settings` entity supporting theme mode (`system`, `light`, `dark`), primary color tokens, typography styles, button styles, and locale.
  - Automatic upsert of default styling preferences upon registration or first fetch.

- **Asset Pipeline:**
  - Direct memory buffer processing with 5MB file size ceiling and image MIME-type filtering.
  - Sharp image compression delivering optimized WebP outputs to Supabase Storage.

---

## System Architecture

```mermaid
flowchart TD
    Client["Client Applications<br/>(Web, Mobile, Public Bio Pages)"]

    subgraph Middleware["Security & Routing Layer"]
        Helmet["Helmet (HTTP Headers)"]
        Cors["CORS (Domain Whitelisting)"]
        RateLimit["Rate Limiter (Brute-Force Guard)"]
        BodyParser["Body Parser (100kb limit)"]
        AuthMiddleware["JWT Authentication Middleware"]
    end

    subgraph Controllers["Controller Layer"]
        UserController["User Controller"]
        LinkController["Link Controller"]
        ClickController["Click Controller"]
        SettingsController["Settings Controller"]
    end

    subgraph Services["Service Layer (Business Logic)"]
        UserService["User Service"]
        LinkService["Link Service"]
        ClickService["Click Service"]
        SettingsService["Settings Service"]
        EmailService["Email Service (Nodemailer)"]
    end

    subgraph Repositories["Data Access Layer"]
        UserRepo["User Repository"]
        LinkRepo["Link Repository"]
        ClickRepo["Click Repository"]
        SettingsRepo["Settings Repository"]
    end

    subgraph External["Persistence & External Services"]
        PrismaORM["Prisma 7 ORM (@prisma/adapter-pg)"]
        Postgres[("PostgreSQL Database")]
        Supabase[("Supabase Object Storage")]
        SMTP["Gmail / SMTP Server"]
        SharpEngine["Sharp WebP Processing"]
    end

    Client --> Helmet --> Cors --> RateLimit --> BodyParser
    BodyParser --> UserController
    BodyParser --> LinkController
    BodyParser --> ClickController
    BodyParser --> SettingsController

    UserController --> AuthMiddleware
    LinkController --> AuthMiddleware
    SettingsController --> AuthMiddleware

    UserController --> UserService
    LinkController --> LinkService
    ClickController --> ClickService
    SettingsController --> SettingsService

    UserService --> EmailService --> SMTP
    UserService --> SharpEngine --> Supabase
    UserService --> UserRepo
    LinkService --> LinkRepo
    ClickService --> ClickRepo
    SettingsService --> SettingsRepo

    UserRepo --> PrismaORM
    LinkRepo --> PrismaORM
    ClickRepo --> PrismaORM
    SettingsRepo --> PrismaORM

    PrismaORM --> Postgres
```

---

## Repository Structure

```
LinkHub-server/
├── prisma/
│   └── schema.prisma              # Database schema definitions & generator configs
├── prisma.config.ts               # Prisma CLI configuration
├── src/
│   ├── config/
│   │   ├── env.ts                 # Strongly-typed environment variables & validation
│   │   └── supabase.ts            # Supabase JS client configuration
│   ├── controllers/
│   │   ├── click.controller.ts    # Click tracking & analytics HTTP handlers
│   │   ├── link.controller.ts     # Link CRUD HTTP handlers
│   │   ├── settings.controller.ts # Appearance settings HTTP handlers
│   │   └── user.controller.ts     # Registration, login, profile HTTP handlers
│   ├── database/
│   │   └── prisma.ts              # Prisma Client instance with PostgreSQL adapter
│   ├── errors/
│   │   ├── AppError.ts            # Custom HTTP operational error class
│   │   └── asyncHandler.ts        # Express async exception wrapper
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # Bearer JWT extraction, verification, & claims binding
│   │   ├── error.middleware.ts    # Centralized error handler with production masking
│   │   ├── logger.ts              # Request logger middleware
│   │   ├── security.middleware.ts # Helmet, CORS configuration, & rate limiters
│   │   └── upload.middlerware.ts  # Multer memory storage configuration & MIME filter
│   ├── repositories/
│   │   ├── click.repository.ts    # Click queries, date-range filters, & group aggregations
│   │   ├── link.repository.ts     # Link queries, ownership checks, & position aggregations
│   │   ├── settings.repository.ts # User settings queries & upserts
│   │   └── user.repository.ts     # User queries & persistence operations
│   ├── routes/
│   │   ├── click.routes.ts        # /api/clicks endpoints
│   │   ├── link.routes.ts         # /api/links endpoints
│   │   ├── settings.routes.ts     # /api/settings endpoints
│   │   └── user.routes.ts         # /api/users endpoints
│   ├── services/
│   │   ├── click.service.ts       # Click tracking, UTC ranges, & analytics logic
│   │   ├── email.service.ts       # Nodemailer verification email dispatch
│   │   ├── link.service.ts        # URL validation, ownership rules, & link business logic
│   │   ├── settings.service.ts    # Settings validation & default population
│   │   └── user.service.ts        # Registration, hashing, token issuance, & profile logic
│   ├── types/
│   │   ├── click.ts               # Click DTOs, intervals, & group-by types
│   │   ├── express.d.ts           # Express request augmentation for user payload
│   │   ├── link.ts                # Link DTOs & update contracts
│   │   ├── settings.ts            # Settings DTOs
│   │   └── user.ts                # User registration & profile contracts
│   ├── utils/
│   │   ├── apiResponse.ts         # Standardized JSON response utilities
│   │   ├── capitalize.ts          # String normalization utility
│   │   ├── hash.ts                # Bcrypt password hashing & comparison
│   │   ├── jwt.ts                 # JWT signing & verification utilities
│   │   └── uploadImage.ts         # Sharp transformation & Supabase upload
│   ├── app.ts                     # Express application definition, routes, & middleware
│   └── server.ts                  # Application entry point & HTTP listener
├── package.json                   # Project metadata, scripts, & dependencies
├── tsconfig.json                  # TypeScript compiler options
└── README.md                      # Comprehensive documentation
```

---

## Database Schema & Data Model

The database is built on PostgreSQL and managed via Prisma 7 using the `@prisma/adapter-pg` driver.

```mermaid
erDiagram
    users ||--o{ links : "owns (Cascade Delete)"
    users ||--o| user_settings : "configures (Cascade Delete)"
    links ||--o{ clicks : "accumulates (Cascade Delete)"

    users {
        Int user_id PK "autoincrement"
        String username UK "VarChar(50)"
        String email UK "VarChar(100)"
        String password_hash "Nullable"
        String provider "Default: local"
        String google_id "Nullable"
        String display_name "VarChar(100)"
        String bio "Nullable"
        String profile_image "Nullable"
        Boolean is_verified "Default: false"
        DateTime last_login_at "Nullable"
        DateTime created_at "Default: now()"
        DateTime updated_at "Default: now()"
        String verification_token "Nullable"
        DateTime verification_expires "Nullable"
    }

    links {
        Int link_id PK "autoincrement"
        Int user_id FK "References users.user_id"
        String title "VarChar(100)"
        String url "Text"
        String icon "Nullable, VarChar(50)"
        String link_type "Default: custom"
        Boolean is_active "Default: true"
        Int position "Default: 0"
        Int click_count "Default: 0"
        DateTime created_at "Default: now()"
        DateTime updated_at "Default: now()"
    }

    clicks {
        Int click_id PK "autoincrement"
        Int link_id FK "References links.link_id"
        DateTime clicked_at "Default: now()"
        String country "Nullable, VarChar(100)"
        String device_type "Nullable, VarChar(50)"
        String browser "Nullable, VarChar(50)"
    }

    user_settings {
        Int setting_id PK "autoincrement"
        Int user_id UK "References users.user_id"
        String theme_mode "Default: system"
        String primary_color "Default: theme-green"
        String font_style "Default: font-geist"
        String button_style "Default: border-soft"
        String language "Default: en"
        DateTime updated_at "Default: now()"
    }
```

### Relational Integrity & Cascades
- Deleting a `users` record automatically cascades and purges all related `links` and `user_settings`.
- Deleting a `links` record automatically cascades and purges all historical `clicks` associated with that link.

---

## API Reference

All successful responses follow the unified envelope structure:
```json
{
  "success": true,
  "message": "Operation status message",
  "data": {}
}
```

Error responses adhere to:
```json
{
  "success": false,
  "message": "Human-readable failure reason",
  "errors": null
}
```

### API Discovery
- **`GET /api`**
  - **Auth:** None
  - **Description:** Returns the discovery index outlining primary routes.

---

### Authentication & User Management

#### `POST /api/users/register`
Creates a new account, generates an email verification token, and dispatches a confirmation email.
- **Auth:** None (Rate-limited: 20 requests per 3 seconds)
- **Request Body:**
  ```json
  {
    "username": "janedoe",
    "email": "jane@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Validation Constraints:**
  - `username`: String, 2 to 50 characters.
  - `email`: Valid RFC email format.
  - `password`: Minimum 10 characters.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User Created Successfully",
    "data": {
      "message": "User created. Please verify your email."
    }
  }
  ```

#### `POST /api/users/login`
Authenticates credentials and returns a signed JWT. Requires verified email status.
- **Auth:** None (Rate-limited: 20 requests per 3 seconds)
- **Request Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logined",
    "data": {
      "user": {
        "user_id": 1,
        "username": "janedoe",
        "email": "jane@example.com",
        "display_name": "janedoe",
        "bio": null,
        "profile_image": null,
        "is_verified": true,
        "created_at": "2026-10-24T00:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### `POST /api/users/google`
Authenticates with Google OAuth. Verifies Google ID token, performs safe account linking, auto-provisions new users if not found, and returns a signed JWT.
- **Auth:** None (Rate-limited: 20 requests per 3 seconds)
- **Request Body:**
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
  }
  ```
- **Response (200 OK):** User object and JWT token.

#### `POST /api/users/forgot-password`
Requests a password reset email. Employs cryptographically secure random tokens stored as SHA-256 hashes, with non-enumerating generic response.
- **Auth:** None (Rate-limited)
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "If an account with that email exists, a password reset link has been sent."
  }
  ```

#### `POST /api/users/reset-password`
Sets a new password using a valid, single-use, non-expired reset token.
- **Auth:** None (Rate-limited)
- **Request Body:**
  ```json
  {
    "token": "32-byte-hex-token",
    "newPassword": "NewStrongPassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password has been successfully updated. You can now login."
  }
  ```

#### `GET /api/users/verify-email`

Verifies account ownership using the token emailed during registration.
- **Auth:** None
- **Query Parameters:** `token` (String, Required)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Email Verified",
    "data": {
      "message": "Email verified successfully"
    }
  }
  ```

#### `GET /api/users/public-profile/:username`
Fetches public profile details and active links for public bio rendering.
- **Auth:** None
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "user fetched successfully.",
    "data": {
      "user": {
        "display_name": "Jane Doe",
        "bio": "Open Source Engineer & Creator",
        "email": "jane@example.com",
        "profile_image": "https://<project-ref>.supabase.co/storage/v1/object/public/profile-images/<uuid>.webp",
        "links": [
          {
            "id": 10,
            "title": "GitHub",
            "url": "https://github.com/janedoe",
            "icon": "github"
          }
        ]
      }
    }
  }
  ```

#### `GET /api/users/me`
Fetches authenticated user information.
- **Auth:** Bearer JWT Required
- **Response (200 OK):** User object without `password_hash`.

#### `PATCH /api/users/me`
Updates user profile information and uploads an optional avatar image.
- **Auth:** Bearer JWT Required
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `display_name` (string, optional)
  - `bio` (string, optional)
  - `profileImage` (binary image file, max 5MB, optional)
- **Response (200 OK):** Updated user object reflecting the new Supabase CDN avatar URL.

---

### Link Management

All endpoints under `/api/links` require a valid `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/links` | Returns all links owned by the user, sorted by `position ASC, link_id ASC`. |
| `GET` | `/api/links/:linkId` | Fetches a single link verifying tenant ownership. |
| `POST` | `/api/links` | Creates a new link. Auto-increments position if not specified. |
| `PUT` | `/api/links/reorder` | Atomically reorders links array via a database transaction. |
| `PATCH` | `/api/links/:linkId` | Partially updates a link verifying tenant ownership. |
| `DELETE` | `/api/links/:linkId` | Deletes a link and cascades associated click metrics. |

#### Reorder Links Request (`PUT /api/links/reorder`)
```json
{
  "linkIds": [12, 10, 15]
}
```

#### Create Link Request (`POST /api/links`)

```json
{
  "title": "My Portfolio",
  "url": "https://janedoe.dev",
  "icon": "globe",
  "link_type": "custom",
  "is_active": true,
  "position": 1
}
```
*Note: URL protocol is validated against `http:`, `https:`, `mailto:`, and `tel:`.*

---

### Click Tracking & Analytics

#### `POST /api/clicks/:linkId`
Records a link click interaction. Executed by the public landing page prior to redirecting.
- **Auth:** None
- **Request Body (Optional metadata):**
  ```json
  {
    "country": "united states",
    "device_type": "mobile",
    "browser": "chrome"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "clicked"
  }
  ```

#### `GET /api/clicks/stats`
Retrieves aggregated click volume across key operational time frames.
- **Auth:** Bearer JWT Required
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Click statistics.",
    "data": {
      "today": 142,
      "lastWeek": 1280,
      "lastMonth": 4820,
      "allTime": 15420,
      "definitions": {
        "today": "Clicks with clicked_at on or after 00:00:00 UTC today.",
        "lastWeek": "Rolling window: last 7×24 hours from now.",
        "lastMonth": "Rolling window: last 30×24 hours from now.",
        "allTime": "Every click for your links."
      }
    }
  }
  ```

#### `GET /api/clicks/grouped?by=:dimension&period=:period`
Aggregates clicks across specific dimensions.
- **Auth:** Bearer JWT Required
- **Query Parameters:**
  - `by`: `country` | `device_type` | `browser` (Required)
  - `period`: `today` | `week` | `month` | `all` (Default: `all`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Analytics fetched.",
    "data": [
      { "value": "Mobile", "clicks": 850 },
      { "value": "Desktop", "clicks": 410 },
      { "value": "Tablet", "clicks": 20 }
    ]
  }
  ```

#### `GET /api/clicks/links?period=:period`
Returns total click counts broken down by link title.
- **Auth:** Bearer JWT Required
- **Query Parameters:**
  - `period`: `today` | `week` | `month` | `all` (Default: `all`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Links analytics fetched.",
    "data": [
      { "title": "My Portfolio", "clicks": 620 },
      { "title": "GitHub", "clicks": 430 }
    ]
  }
  ```

---

### User Settings & Theming

Endpoints under `/api/settings` allow users to configure layout and appearance tokens.

#### `GET /api/settings`
Returns appearance preferences (automatically provisions default settings if missing).
- **Auth:** Bearer JWT Required
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Settings fetched.",
    "data": {
      "setting_id": 1,
      "user_id": 1,
      "theme_mode": "system",
      "primary_color": "theme-green",
      "font_style": "font-geist",
      "button_style": "border-soft",
      "language": "en",
      "updated_at": "2026-10-24T00:00:00.000Z"
    }
  }
  ```

#### `PATCH /api/settings`
Updates appearance configuration.
- **Auth:** Bearer JWT Required
- **Request Body (Partial update):**
  ```json
  {
    "theme_mode": "dark",
    "primary_color": "theme-violet",
    "font_style": "font-inter",
    "button_style": "rounded-full"
  }
  ```

---

## Image Processing Pipeline

To maintain peak delivery speeds across public bio profiles, images uploaded via `PATCH /api/users/me` undergo an automated optimization pipeline:

```
Multipart Form Upload (file <= 5MB, image/*)
                       │
                       ▼
Multer Memory Storage (RAM buffer, no temp disk files)
                       │
                       ▼
Sharp Image Processing Pipeline:
  • Resize: 500px × 500px
  • Re-encode: WebP (Quality: 80)
                       │
                       ▼
Supabase Object Storage (Bucket: "profile-images")
  • Key: {crypto.randomUUID()}.webp
  • Content-Type: image/webp
                       │
                       ▼
Public CDN URL stored in users.profile_image
```

---

## Security & Reliability

- **Helmet Protection:** Automatically provisions critical HTTP security headers and removes standard disclosure headers such as `X-Powered-By`.
- **CORS Configuration:** Configured to dynamically inspect origins. In production (`NODE_ENV=production`), incoming origins are validated against the `CORS_ORIGINS` whitelist.
- **Brute-Force Rate Limiting:** An `authRouteLimiter` middleware throttles authentication endpoints (`/api/users/login`, `/api/users/register`) to 20 requests per 3 seconds per client IP. Supports reverse proxy scenarios with `TRUST_PROXY=true`.
- **Payload Constraints:** Strict body-parser ceiling set at `100kb` to thwart volumetric denial-of-service attempts.
- **Cryptographic Standards:**
  - Password hashes computed using `bcrypt` (10 rounds).
  - JWTs issued using HMAC SHA-256 (`HS256`) with a cryptographically verified secret minimum length of 32 characters (256 bits).
  - Tokens incorporate `jti` (UUID v4) for traceability and assert both `issuer` and `audience`.
- **Information Leakage Prevention:** In production environments, unhandled exceptions return a sanitized `"Internal Server Error"` message to prevent internal stack trace disclosure.

---

## Getting Started

### Prerequisites
- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **PostgreSQL:** v15+ instance (local or hosted e.g., Neon, Supabase, AWS RDS)
- **Supabase Account:** Storage bucket named `profile-images` configured with public read access
- **SMTP Account:** Gmail or third-party SMTP provider for transactional verification emails

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Omiskn/LinkHub-server.git
   cd LinkHub-server
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
PORT=3000
NODE_ENV=development
TRUST_PROXY=false
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/LinkHub?schema=public

# Authentication (JWT)
JWT_SECRET=super_secret_signing_key_at_least_32_chars_long
JWT_ISSUER=LinkHub-server
JWT_AUDIENCE=LinkHub-clients
JWT_EXPIRES_IN=30d

# Supabase Storage
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Transactional Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

#### Environment Variables Reference

| Variable | Purpose | Required | Default / Example |
|---|---|:---:|---|
| `PORT` | Local port for Express HTTP listener | No | `3000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | No | `development` |
| `TRUST_PROXY` | Configures Express `trust proxy` when hosted behind a reverse proxy | No | `false` |
| `FRONTEND_URL` | Base URL used to build email verification callback links | No | `http://localhost:5173` |
| `CORS_ORIGINS` | Comma-delimited list of permitted CORS origins in production | No (Required in Prod) | `https://LinkHub.app` |
| `DATABASE_URL` | PostgreSQL connection URI for Prisma ORM | **Yes** | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT signing (Minimum 32 characters) | **Yes** | 256-bit secret string |
| `JWT_ISSUER` | JWT `iss` claim | No | `LinkHub-server` |
| `JWT_AUDIENCE` | JWT `aud` claim | No | `LinkHub-clients` |
| `JWT_EXPIRES_IN` | JWT validity duration | No | `30d` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for ID token audience validation | No (Optional) | `16588090...apps.googleusercontent.com` |
| `SUPABASE_URL` | Supabase API URL for object storage client | **Yes** | `https://xyz.supabase.co` |

| `SUPABASE_SERVICE_ROLE_KEY` | Supabase administrative key for storage bucket uploads | **Yes** | Service role token |
| `EMAIL_USER` | SMTP username for email verification dispatch | **Yes** | `user@gmail.com` |
| `EMAIL_PASS` | SMTP application password / credentials | **Yes** | App password |

### Database Setup & Migrations

Generate the Prisma Client and apply migrations:

```bash
# Generate the Prisma Client to src/generated/prisma
npx prisma generate

# Apply pending migrations to your database
npx prisma migrate dev --name init
```

### Running the Server

- **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```
  *The development server uses `ts-node-dev` and will bind to `http://localhost:3000` (or your configured `PORT`).*

---

## Problems Solved & Engineering Highlights

- **Multi-Tenant Link Isolation & IDOR Prevention**
  - **Problem:** When modifying or removing links via IDs passed in route parameters, malicious authenticated users could manipulate other users' links by simply changing `:linkId`.
  - **Solution:** Strict scoped queries at the database layer.
  - **Implementation:** `requireOwnedLink` validates all link operations against `linkRepositories.findByIdAndUserId(linkId, userId)`. Requests targeting links not owned by the authenticated user immediately abort with a `404 Not Found`.
  - **Benefit:** Guarantees absolute tenant isolation across all write operations without fragile controller-level conditionals.

- **Automated WebP In-Memory Image Transcoding**
  - **Problem:** User-uploaded profile avatars often introduce high latency and large file sizes on public bio pages, while writing intermediate files to disk causes concurrency bottlenecks and cleanup risks.
  - **Solution:** Direct stream memory compression via Multer and Sharp.
  - **Implementation:** Multer stores uploaded images in RAM buffers (`multer.memoryStorage()`). Sharp resizes the buffer to 500&times;500 and encodes to WebP at quality 80 before uploading the resulting buffer directly to Supabase Storage.
  - **Benefit:** Standardizes all profile pictures to lightweight, modern WebP assets, saving up to 80% bandwidth on public profile page views while leaving zero leftover artifacts on the server disk.

- **UTC-Aligned & Rolling Time Range Analytics**
  - **Problem:** Aggregating click statistics across changing user timezones can result in inconsistent analytics summaries, while running unindexed table scans degrades database performance.
  - **Solution:** Deterministic time range helpers and indexed Prisma grouping queries.
  - **Implementation:** `startOfUtcToday()` creates an exact UTC boundary for daily metrics, while `rollingSinceMs()` builds rolling 7-day and 30-day windows. The repository utilizes Prisma's `groupBy` and selective relations to count clicks directly inside PostgreSQL.
  - **Benefit:** Fast, reliable metric aggregation that scales consistently regardless of client timezone variations.

- **Strict Cryptographic Key Length Validation at Boot**
  - **Problem:** Weak or truncated JWT secrets leave HS256 tokens vulnerable to brute-force dictionary attacks.
  - **Solution:** Enforced secret length validation at server initialization.
  - **Implementation:** `src/config/env.ts` explicitly asserts `JWT_SECRET.length >= 32` during bootstrap; if violated, the process immediately halts with an explanatory error.
  - **Benefit:** Prevents running insecure servers in production before traffic can reach the application.

---

## Limitations & Roadmap

### Current Limitations
- **Google OAuth:** The `users` table contains `provider` and `google_id` columns, but the OAuth handshake route handlers are not yet wired into the routing table.
- **Link Reordering Batch API:** Links currently maintain a `position` attribute that increments sequentially upon creation, but an endpoint for batch reordering array indices has not yet been introduced.
- **Automated Test Coverage:** `package.json` contains a placeholder test script; unit and integration test suites (e.g. Jest / Vitest with Supertest) are not yet integrated.

### Roadmap
- [ ] Add Google OAuth 2.0 social login flow.
- [ ] Implement batch link reordering endpoint (`PATCH /api/links/reorder`).
- [ ] Implement comprehensive integration test suites using Vitest and Supertest.
- [ ] Introduce caching layer (e.g. Redis) for high-traffic public bio profiles.
- [ ] Add export capabilities for click analytics (CSV / JSON).

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
