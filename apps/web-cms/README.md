# Web CMS - Content Management System

## Overview

CMS web application built with Next.js 13+ for managing leads pipeline and case studies content.

## Technology Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand

## Features

- Lead pipeline management (New → Contacted → Qualified → Closed)
- Case study creation and editing
- SEO metadata management
- Content publishing workflow

## Project Structure

```
apps/web-cms/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (auth)/             # Authentication pages
│   │   └── (cms)/
│   │       ├── leads/          # Lead pipeline
│   │       ├── case-studies/   # Case study management
│   │       └── content/        # General content
│   ├── components/             # React components
│   ├── lib/                    # Utilities and API clients
│   └── types/                  # TypeScript types
└── public/
```

## API Integration

- **auth-service**: Authentication
- **lead-service**: Lead management
- **content-service**: Case study management

## Environment Variables

- `NEXT_PUBLIC_API_URL`: API Gateway URL
- `NEXT_PUBLIC_APP_URL`: CMS URL

## Development

```bash
npm install
npm run dev
```
