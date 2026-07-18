# 🚀 TaskAI

![License](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Python](https://img.shields.io/badge/Python-3.12-yellow)
![AWS](https://img.shields.io/badge/AWS-Serverless-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)
![Status](https://img.shields.io/badge/Status-Active-success)

---

## Overview

TaskAI is a cloud-native SaaS platform for project management, document management, workflow automation and team collaboration.

The platform was designed around a scalable serverless architecture using AWS services, PostgreSQL and modern React technologies to support multiple organizations through secure multi-tenant deployment.

---

## Features

- Secure authentication
- Role Based Access Control (RBAC)
- Project Management
- Task Management
- Team Collaboration
- Document Management
- Folder Hierarchies
- File Uploads
- Workflow Automation
- Dashboard Analytics
- Notifications
- Responsive UI
- Progressive Web App (PWA)

---

# Screenshots

> Screenshots coming soon.

```
docs/screenshots/
├── dashboard.png
├── tasks.png
├── documents.png
├── login.png
└── analytics.png
```

---

# System Architecture

```
                React + Vite
                     │
                     │
             AWS API Gateway
                     │
     ┌───────────────┼───────────────┐
     │               │               │
 Lambda         Lambda         Lambda
 Auth           Projects       Documents
     │               │               │
     └───────────────┼───────────────┘
                     │
               PostgreSQL
                     │
                Amazon S3
```

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

## Backend

- Python
- AWS Lambda
- API Gateway

## Cloud

- Amazon Cognito
- Amazon S3
- SES

## Database

- PostgreSQL
- Supabase

---

# Database Overview

The application uses a normalized PostgreSQL database designed for scalability.

Major entities include:

- Users
- Roles
- Permissions
- Organizations
- Projects
- Tasks
- Documents
- Folders
- Comments
- Notifications
- Audit Logs

The schema follows relational best practices with foreign key constraints, indexing and role-based access.

---

# Repository Structure

```
TaskAI
│
├── public/
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── lib/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   └── functions/
│
├── package.json
├── vite.config.ts
└── README.md
```

---

# Engineering Challenges Solved

This project demonstrates several production software engineering concepts:

- Designing scalable REST APIs
- Multi-tenant architecture
- Secure Role Based Access Control
- Document storage with permissions
- AWS serverless architecture
- Authentication using Cognito
- PostgreSQL schema design
- State management
- Responsive UI
- Progressive Web App implementation

---

# Why TaskAI?

Many existing project management tools are expensive, overly complex or difficult to customize.

TaskAI was designed as a modern cloud-native alternative focused on:

- Simplicity
- Scalability
- Security
- Automation
- Team collaboration

---

# Installation

```bash
git clone https://github.com/sbonga-mthethwa/taskai.git

cd taskai

npm install

npm run dev
```

---

# Environment Variables

Create a `.env` file.

Example:

```env
VITE_API_URL=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

# Testing

Run unit tests

```bash
npm test
```

Run watch mode

```bash
npm run test:watch
```

Build production version

```bash
npm run build
```

---

# Roadmap

- [x] Authentication
- [x] Project Management
- [x] Task Management
- [x] Document Management
- [x] Role Based Access
- [x] Dashboard Analytics
- [ ] Calendar Integration
- [ ] Real-time Collaboration
- [ ] Mobile Application
- [ ] AI-powered Productivity Assistant

---

# Contributing

Contributions are welcome.

1. Fork the repository.

2. Create a feature branch.

```bash
git checkout -b feature/my-feature
```

3. Commit changes.

```bash
git commit -m "Add feature"
```

4. Push branch.

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

# License

Licensed under the MIT License.

---

# Author

**Sibongakonke Mthethwa**

Founder — Vertex Labz

- LinkedIn:
  https://www.linkedin.com/in/sibongakonke-mthethwa-09583523/

- Portfolio:
  https://gsmthethwa-portfolio-dev.vercel.app/

---

# Acknowledgements

Built using

- React
- TypeScript
- Vite
- PostgreSQL
- AWS
- Supabase

---

⭐ If you found this project interesting, consider giving it a star.