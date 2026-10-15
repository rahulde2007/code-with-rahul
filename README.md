<!-- ═══════════════════════════ HERO ═══════════════════════════ -->
<div align="center">

<!-- Animated wave header: change text, desc and colors directly in the URL -->
<img width="100%" alt="Animated gradient banner introducing Rahul De" src="https://capsule-render.vercel.app/api?type=waving&color=0:0d1117,50:161b22,100:58a6ff&height=220&section=header&text=Rahul%20De&fontSize=60&fontColor=f0f6fc&animation=fadeIn&fontAlignY=36&desc=Modern%20Developer%20Portfolio&descSize=20&descAlignY=58" />

<!-- Typing animation: add or edit lines in the lines= parameter (separate with ;) -->
<a href="https://codewith-rahul.vercel.app">
  <img alt="Typing animation: Computer Science Engineering Student, Aspiring Full-Stack Developer, Open Source Enthusiast" src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=20&duration=3200&pause=1200&color=58A6FF&center=true&vCenter=true&width=760&lines=Computer+Science+Engineering+Student;Aspiring+Full-Stack+Developer;Open+Source+Enthusiast;Building+thoughtful+web+experiences" />
</a>

<p>
  A modern developer portfolio featuring a custom animated logo, interactive UI,<br />
  and smooth animations — built with a focus on creativity, performance, and clean design.
</p>

<!-- Live badges: the status badge re-checks the site every time it loads -->
<p>
  <a href="https://codewith-rahul.vercel.app"><img alt="Open the live portfolio" src="https://img.shields.io/badge/Live_Demo-Visit_Site-58a6ff?style=for-the-badge&logo=vercel&logoColor=white&labelColor=161b22" /></a>
  <a href="https://codewith-rahul.vercel.app"><img alt="Live site status" src="https://img.shields.io/website?url=https%3A%2F%2Fcodewith-rahul.vercel.app&label=live%20site&up_message=online&down_message=offline&up_color=2ea043&down_color=da3633&style=for-the-badge&labelColor=161b22" /></a>
  <a href="https://github.com/rahulde2007/code-with-rahul/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/rahulde2007/code-with-rahul?style=for-the-badge&label=last%20commit&labelColor=161b22&color=58a6ff" /></a>
</p>

<p>
  <a href="#overview">Overview</a> &nbsp;•&nbsp;
  <a href="#features">Features</a> &nbsp;•&nbsp;
  <a href="#tech-stack">Tech Stack</a> &nbsp;•&nbsp;
  <a href="#getting-started">Getting Started</a> &nbsp;•&nbsp;
  <a href="#featured-projects">Projects</a> &nbsp;•&nbsp;
  <a href="#connect">Connect</a>
</p>

</div>

## Overview

This repository contains the source code of my personal portfolio — a space to share the projects I build, the ideas I'm exploring, and the progress I make as a developer. It pairs a custom animated logo and fluid motion with a clean, performance-minded React + TypeScript codebase.

**Live site:** [codewith-rahul.vercel.app](https://codewith-rahul.vercel.app)

## Features

- **Custom animated logo & fluid motion** — smooth, purposeful animations powered by Framer Motion.
- **Interactive, responsive UI** — a Tailwind CSS interface that adapts across screen sizes.
- **Projects & skills showcase** — featured work with source and live-demo links.
- **MDX-powered content** — MDX with Prism syntax highlighting and a feed generated at build time (`scripts/generate-feed.ts`).
- **Contact & collaboration** — a Formspree contact form, a Cal.com scheduling embed, and Giscus-powered comments.
- **GitHub Sponsors section** — data is fetched server-side, so the token never reaches the browser.
- **Supabase integration** — optional backend-powered features through Supabase.
- **SEO & social sharing** — Open Graph metadata managed through `og-meta.config.ts` and `react-helmet-async`.
- **Developer experience** — TypeScript, ESLint and Prettier configuration, and Husky git hooks.

## Tech stack

<p>
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img alt="Framer Motion" src="https://img.shields.io/badge/Framer_Motion-5A31F4?style=flat-square&logo=framer&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" />
</p>

| Layer | Technologies |
| --- | --- |
| **Core** | React 18, TypeScript 5, Vite 6, React Router 7 |
| **Styling & motion** | Tailwind CSS 3 (+ Typography plugin), Framer Motion / Motion, styled-components, Lucide & React Icons |
| **State & content** | Zustand, MDX, PrismJS, DOMPurify, react-pdf |
| **Integrations** | Supabase, Formspree, Giscus, Cal.com embed, GitHub API (`graphql-request`) |
| **Tooling & delivery** | Husky, ESLint & Prettier configs, GitHub Actions, Vercel |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- npm (bundled with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/rahulde2007/code-with-rahul.git
cd code-with-rahul

# 2. Install dependencies (this also sets up the Husky git hooks)
npm ci

# 3. Create your local environment file (only the integrations you use are needed)
cp .env.example .env.local

# 4. Start the development server
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot module replacement |
| `npm run build` | Generate the content feed, then create an optimized production build |
| `npm run preview` | Preview the production build locally |

## Environment variables

Configure only the integrations you plan to use — in `.env.local` for local development and in your deployment environment for production. [`.env.example`](.env.example) is the template.

| Variable | Scope | Used for |
| --- | --- | --- |
| `VITE_FORMSPREE_FORM_ID` | Client | Contact form delivery through [Formspree](https://formspree.io/) |
| `VITE_SUPABASE_URL` | Client | Supabase project URL for Supabase-backed features |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase public (anon) key |
| `VITE_GISCUS_REPO_ID` | Client | Giscus repository ID for comments |
| `VITE_GISCUS_CATEGORY_ID` | Client | Giscus discussion category ID |
| `GITHUB_TOKEN` | **Server only** | GitHub Sponsors section (needs the required GitHub permissions) |

> [!WARNING]
> Never commit real secrets. Keep `GITHUB_TOKEN` server-side and never give it a `VITE_` prefix — `VITE_` variables are bundled into the browser build.

## Deployment

The portfolio is deployed on [Vercel](https://vercel.com/) (see `vercel.json`). Add the same environment variables in your Vercel project settings before deploying.

## Project structure

```text
code-with-rahul/
├── .github/workflows/   # GitHub Actions workflows
├── .husky/              # Git hooks
├── .vscode/             # Shared editor settings
├── api/                 # Server-side API routes (keeps secrets off the client)
├── public/              # Static assets served as-is
├── scripts/             # Build-time scripts (e.g. generate-feed.ts)
├── src/                 # Application source code
├── index.html           # App entry point
├── og-meta.config.ts    # Open Graph / SEO metadata config
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.ts       # Vite configuration
├── vercel.json          # Vercel deployment configuration
└── package.json         # Dependencies and scripts
```

## Featured projects

| Project | Overview | Links |
| --- | --- | --- |
| **WiFi QR Generator** | An offline-capable WiFi QR code generator that creates scannable codes in the browser while keeping network credentials private. | [Source](https://github.com/rahulde2007/WiFi-QR-Generator) |
| **GitHub Achievement Hunt** | A guide and tracker for GitHub achievements, with badge artwork, contribution activities, and an open-source learning roadmap. | [Source](https://github.com/rahulde2007/Github-Achievement-Hunt) |
| **Rahul's 3D World** | An interactive 3D portfolio featuring a character scene, smooth scrolling animations, projects, skills, and education. | [Source](https://github.com/rahulde2007/rahuls-3d-world) · [Live demo](https://rahuls-3d-world.vercel.app/) |
| **Calcx-Pro Calculator** | A responsive calculator with standard and scientific functions, calculation history, and offline-capable PWA support. | [Source](https://github.com/rahulde2007/Calcx-Pro-Calculator) |

<details>
<summary><b>Skills showcased in the portfolio</b></summary>

<br />

**Languages**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=222)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=flat-square&logo=php&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)

**Web and application development**

![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css3&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-5A31F4?style=flat-square&logo=framer&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=threedotjs&logoColor=white)

**Backend, data, and tools**

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=figma&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonwebservices&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=222)
![VS Code](https://img.shields.io/badge/VS_Code-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

</details>

## Feedback

Found a bug or have an idea to improve the portfolio? Please [open an issue](https://github.com/rahulde2007/code-with-rahul/issues) — feedback is always welcome.

## About me

I'm **Rahul De**, a Computer Science Engineering student and aspiring full-stack developer. I enjoy turning ideas into useful digital experiences — building intuitive interfaces, solving practical problems, exploring new technologies, and learning by contributing to open source. I'm continually strengthening my foundations and aim to create thoughtful, impactful software.

## Connect

<p>
  <a href="https://codewith-rahul.vercel.app"><img alt="Portfolio" src="https://img.shields.io/badge/Portfolio-Visit-58a6ff?style=for-the-badge&logo=vercel&logoColor=white&labelColor=161b22" /></a>
  <a href="https://github.com/rahulde2007"><img alt="GitHub: rahulde2007" src="https://img.shields.io/badge/GitHub-rahulde2007-161b22?style=for-the-badge&logo=github&logoColor=white" /></a>
  <a href="https://www.linkedin.com/in/rahul-de-r6294520571/"><img alt="Connect on LinkedIn" src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://x.com/rahulde_937"><img alt="Follow on X" src="https://img.shields.io/badge/X-Follow-161b22?style=for-the-badge&logo=x&logoColor=white" /></a>
  <a href="https://www.instagram.com/rahulde_18/"><img alt="Follow on Instagram" src="https://img.shields.io/badge/Instagram-Follow-E4405F?style=for-the-badge&logo=instagram&logoColor=white" /></a>
</p>

<!-- ═══════════════════════════ FOOTER ═══════════════════════════ -->
<div align="center">

<sub>If you like this project, consider giving it a ⭐ — it really helps!</sub>

<img width="100%" alt="Animated footer wave" src="https://capsule-render.vercel.app/api?type=waving&color=0:58a6ff,50:161b22,100:0d1117&height=120&section=footer" />

</div>
