# Web Public - Public Website

## Overview

Public-facing website built with Next.js 13+ (App Router) for Ashva Experts. This application serves as the marketing website with lead capture forms, case studies, and service information.

## Technology Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand (if needed)

## Features

- Homepage with hero section
- Services page
- Case studies listing and detail pages
- About page
- Contact/Enquiry form (leads to lead-service)
- SEO optimized pages
- Responsive design

## Project Structure

```
apps/web-public/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Homepage
│   │   ├── about/              # About page
│   │   ├── services/           # Services listing
│   │   ├── case-studies/       # Case studies listing and detail
│   │   └── contact/            # Contact/Enquiry form
│   ├── components/
│   │   ├── common/             # Reusable components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components (Header, Footer)
│   │   └── sections/           # Page sections
│   ├── lib/
│   │   ├── api/                # API client functions
│   │   ├── utils/              # Utility functions
│   │   └── constants/          # Constants
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── styles/                 # Global styles
└── public/                     # Static assets
```

## API Integration

The app integrates with:
- **content-service**: Fetch case studies
- **lead-service**: Submit enquiry forms

All API calls go through the API Gateway.

## Environment Variables

- `NEXT_PUBLIC_API_URL`: API Gateway URL
- `NEXT_PUBLIC_SITE_URL`: Public site URL

## Development

```bash
npm install
npm run dev
```

## Deployment

Build for production:
```bash
npm run build
npm start
```
