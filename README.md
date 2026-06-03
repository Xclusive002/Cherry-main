# AdultFlix Platform

A mature-content streaming platform built with Django on the backend and React + Vite on the frontend. The application supports creator profiles, paid content access, subscriptions, notifications, and admin-managed platform content.

## Overview

AdultFlix is designed as a creator-driven content marketplace with support for:

- User registration, login, and profile handling
- Creator discovery and creator detail pages
- Paid content with unlock logic for subscribers and purchasers
- Admin-managed uploads that become platform-wide content
- Notification messages from admin to users
- Age verification gate for public access
- Nigerian Naira currency display (₦)

## Architecture

- Backend: Django project at the repository root
- Frontend: React + Vite + TypeScript app in `frontend/`
- Database: SQLite for local development (`db.sqlite3`)
- API prefix: `/api/`

## Feature Summary

- `ContentItem` supports video, leak, story, and image content types
- `Profile` extends the user model and tracks creator status
- `Subscription` and `Purchase` models control access to paid content
- `Notification` model delivers admin messages to the frontend notifications page
- `show_on_home` enables featured content filtering for home/trending feeds
- Admin-uploaded content is stored without a creator, making it platform content
- Subscriber-only chat initiation is enforced on the backend
- Paid content is blurred on the frontend for users without access

## Current Implementation Status

The application currently has the following behavior:

- Registration and auth connected between frontend and backend
- Creator detail pages are fixed and return creator content correctly
- Admin-uploaded content is not assigned to creator accounts
- Featured home content is filtered using the backend `home` query parameter
- Home, trending, and videos pages surface both creator content and platform content
- Paid content uses blur UI and lock overlay for unauthorized users
- Currency labels display as `₦` in the frontend
- Non-creators have a dedicated profile page
- Notifications exist as backend-managed data and frontend polling
- Django admin compatibility was patched for Python 3.14 via `BaseContext.__copy__`

## Setup

### Backend

```bash
cd abiod
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend app in the browser, usually at `http://127.0.0.1:3000/` or `http://127.0.0.1:3001/`.

## Important Routes

### Backend API

- `GET /api/content/` — list all content
- `GET /api/content/?home=1` — list featured home content
- `GET /api/content/?creator_id=<id>` — list content for a creator
- `GET /api/creators/` — list creators
- `GET /api/creators/<id>/` — creator detail and content
- `GET /api/notifications/` — active notifications
- `POST /api/notifications/` — create notification (staff only)
- `POST /api/purchase/content/<id>/` — purchase content
- `POST /api/chat/start/` — start chat with creator (subscriber only)

### Frontend Pages

- `/` — home page
- `/watch/:id` — watch a content item
- `/creators` — creators directory
- `/creator/:id` — creator detail page
- `/notifications` — notifications page
- `/profile` — creator profile/dashboard
- `/user-profile` — non-creator viewer profile page

## Project Structure

- `adultsite/` — Django project settings, URLs, ASGI/WGI
- `content_app/` — Django app for models, admin, API, and views
- `frontend/` — React frontend with Vite, Tailwind, and TypeScript
- `static/` — static asset folder
- `db.sqlite3` — local development database

## Recommended Improvements

### Backend Improvements

- Add environment variable support and production configuration
- Migrate from SQLite to PostgreSQL or another production-ready database
- Add API authentication tokens or JWT auth for the frontend
- Add unit tests and integration tests for API endpoints and business rules
- Add search, filtering, and pagination to content and creator endpoints
- Implement real-time notifications via WebSockets or server-sent events
- Harden security for chat, purchase, and subscription endpoints

### Frontend Improvements

- Add full subscription and pricing flows
- Improve content search/filtering and sorting
- Add responsive mobile-first design and accessibility improvements
- Add better purchase and subscription UI states
- Add full creator onboarding and dashboard functionality
- Add graceful error handling and retry behavior

### Admin / Operations

- Improve admin content metadata and featured visibility controls
- Add content moderation and reporting tools
- Add media processing, thumbnails, and production static/media hosting
- Add deployment and Docker configuration for staging/production

## Notes

- Admin-created content is intentionally saved as platform content with no creator.
- Notifications use polling in the frontend, not real-time push.
- The current setup is for development; production deployment requires further configuration.
