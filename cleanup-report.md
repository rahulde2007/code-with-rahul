# Project Cleanup Analysis Report

> **Note**: Ekhon kono file ba code delete kora hoyni. Ei report-e shob unused file, orphaned code ar asset-er comprehensive breakdown dewa holo user-er confirmation-er jonno.

---

## Summary Overview

- **Total `src/` Files Scanned**: 159 files
- **Actively Reachable Files in `src/`**: 118 files
- **Unreachable / Orphaned Files in `src/`**: 41 files
- **Total `public/` Assets Scanned**: 102 files
- **Directly Referenced `public/` Assets**: 88 files
- **Unreferenced / Redundant `public/` Files**: 14 files (jar moddhe `robots.txt`, `sitemap.xml`, `_redirects` standard web file hisebe strictly protected)
- **`package.json` Dependencies**: Shob 27-ti runtime dependencies actively used.

---

## Category A: Nishchito Unused (Safe to Delete)

Ei file-gulo project-er kono jaigai import hoy na, kono route-e refer hoy na, ebong build/runtime-e kono provab fele na:

### 1. Unused SVG Components (`src/components/svgs/`) — 24 Files
Ei 24-ti SVG component kokhono import kora hoyni (tech stack `Skills.tsx` ebong onnanno page-e nirdishto 16-ti icon finalize kora hoyeche):
1. `src/components/svgs/Award.tsx` — *Kono import nei*
2. `src/components/svgs/AWS.tsx` — *Kono import nei*
3. `src/components/svgs/ExpressJs.tsx` — *Kono import nei*
4. `src/components/svgs/FastAPI.tsx` — *Kono import nei*
5. `src/components/svgs/Figma.tsx` — *Kono import nei*
6. `src/components/svgs/Gmail.tsx` — *Kono import nei*
7. `src/components/svgs/Image.tsx` — *Kono import nei*
8. `src/components/svgs/Java.tsx` — *Kono import nei*
9. `src/components/svgs/Language.tsx` — *Kono import nei*
10. `src/components/svgs/Linux.tsx` — *Kono import nei*
11. `src/components/svgs/MongoDB.tsx` — *Kono import nei*
12. `src/components/svgs/Motion.tsx` — *Kono import nei*
13. `src/components/svgs/Netlify.tsx` — *Kono import nei*
14. `src/components/svgs/NodeJs.tsx` — *Kono import nei*
15. `src/components/svgs/Php.tsx` — *Kono import nei*
16. `src/components/svgs/PostgreSQL.tsx` — *Kono import nei*
17. `src/components/svgs/Postman.tsx` — *Kono import nei*
18. `src/components/svgs/Prisma.tsx` — *Kono import nei*
19. `src/components/svgs/ReactIcon.tsx` — *Kono import nei*
20. `src/components/svgs/Search.tsx` — *Kono import nei*
21. `src/components/svgs/Shadcn.tsx` — *Kono import nei*
22. `src/components/svgs/TailwindCss.tsx` — *Kono import nei*
23. `src/components/svgs/ThreeJs.tsx` — *Kono import nei*
24. `src/components/svgs/TypeScript.tsx` — *Kono import nei*

### 2. Unused UI Component (`src/components/common/`) — 1 File
1. `src/components/common/Skill.tsx` — *Kono import ba reference nei (Skills.tsx-e inline badge markup use hoy)*

### 3. Unused Legacy Project MDX Files (`src/content/projects/`) — 15 Files
Project detail pages ekhon `src/constants/projects.ts` ebong `src/constants/projectDetails.ts` theke load hoy. Ei MDX file-gulo kono `import.meta.glob` ba static import dara connect kora nei:
1. `src/content/projects/clearbg.mdx` — *0 reference / 0 import*
2. `src/content/projects/college-fee-payment.mdx` — *0 reference / 0 import*
3. `src/content/projects/colorkit-webapp.mdx` — *0 reference / 0 import*
4. `src/content/projects/comfortpg-website.mdx` — *0 reference / 0 import*
5. `src/content/projects/cutting-mat-generator.mdx` — *0 reference / 0 import*
6. `src/content/projects/dictionary-webapp.mdx` — *0 reference / 0 import*
7. `src/content/projects/emojihub-webapp.mdx` — *0 reference / 0 import*
8. `src/content/projects/face-recognition-realtime.mdx` — *0 reference / 0 import*
9. `src/content/projects/flipclock.mdx` — *0 reference / 0 import*
10. `src/content/projects/github-developer-tools.mdx` — *0 reference / 0 import*
11. `src/content/projects/ip-address-tracker.mdx` — *0 reference / 0 import*
12. `src/content/projects/multicalc.mdx` — *0 reference / 0 import*
13. `src/content/projects/outfit-wallpaper-generator.mdx` — *0 reference / 0 import*
14. `src/content/projects/typing-master.mdx` — *0 reference / 0 import*
15. `src/content/projects/xmedia.mdx` — *0 reference / 0 import*

### 4. OS Artifacts & Build Cache Files — 3 Files
1. `public/assets/desktop.ini` (0.1 KB) — *Windows Explorer OS configuration metadata, already in `.gitignore`*
2. `tsconfig.tsbuildinfo` (4 KB) — *Local TypeScript incremental cache, already in `.gitignore`*
3. `tsconfig.node.tsbuildinfo` (74.7 KB) — *Local TypeScript cache, already in `.gitignore`*

---

## Category B: Sondeho (Manual Verification / User Confirmation Required)

Ei file ebong code-gulo actively runtime-e dorkar nei mone hochhe, tobe delete korar age apni dekhe confirm korben:

### 1. One-off Migration Scripts (`scripts/`)
1. `scripts/migrate-blogs.ts` — *Purono HTML blogs-ke MDX-e convert korar ekbar-er migration script. `package.json`-er kono script ba build step-e use hoy na.*
2. `scripts/migrate-books.ts` — *Purono thoughts data-ke MDX-e convert korar ekbar-er migration script.*
   > *Note:* Jodi ei 2-ti script remove kora hoy, tobe `package.json`-er devDependencies theke `turndown` ebong `@types/turndown` o safe bhabe remove kora jabe (karon eita shudhu ei migration script-e use hoyechilo).

### 2. Internal Documentation
1. `src/data/blogs/BLOG_GUIDE.md` — *Blog lekhar guideline doc. Code-e import hoy na, shudhu developer reference-er jonno.*

### 3. Public Assets (Unreferenced / Redundant Files)
*(Notice: Apnar nirdesh onusare public/ asset kono bhabei ekhon delete kora hoyni. Shudhu kon gulo code-e refer nei sheta list kora holo)*:
1. `public/assets/photo5.jpeg` (670.3 KB) — *Unused duplicate. Code-e `src/data/photos.ts`-e `/photo/photo5.jpg` use hocche; ei `/assets/photo5.jpeg` kothao refer nei.*
2. `public/assets/workstation.jpg` (76.7 KB) — *Unused desk photo. `src/components/about/AboutWorkspace.tsx`-e `/assets/desksetup.jpg` use kora hoyeche.*
3. `public/assets/my_avater.png` (79.5 KB) — *Unused avatar. App-e `/assets/dp avater.png` ebong `/assets/avaterlogo.webp` use hocche.*
4. `public/assets/cover.webp` (51.8 KB) & `public/assets/cover1.webp` (77.2 KB) — *Purono cover images, code-e kono direct reference nei.*
5. `public/assets/noise.svg` (0.3 KB) — *Unreferenced SVG background noise texture.*
6. `public/company/cal-com.png` (14.4 KB) & `public/company/GDC.png` (6.6 KB) — *Unreferenced company logos.*
7. `public/site.webmanifest` (0.7 KB) — *Redundant manifest. `index.html`-e `<link rel="manifest" href="/manifest.json" />` use kora hoyeche.*
8. `public/oneko/oneko-classic.gif` (3.2 KB) — *Classic variant gif. Dynamic path hisebe oneko script-e thakteo pare.*

### 4. Unused Dead Exports / Types (In Active Files)
Ei function ba type-gulo file-er moddhe export ache kintu onno kono file theke import kora hoy na:
1. `src/lib/utils.ts` ➔ `getUserId()` — *Unused function (`photoLikes.ts` ar `likes.ts` nijera userId handle kore)*
2. `src/lib/supabase.ts` ➔ `siteStatsService` — *Unused object (`/api/visit` serverless endpoint ekhon visitor count kore)*
3. `src/lib/supabase.ts` ➔ `interface Comment` — *Unused type definition*
4. `src/lib/contact.ts` ➔ `interface ContactMessage` — *Unused type definition*
5. `src/hooks/usePhotoLikes.ts` ➔ `type UsePhotoLikesReturn` — *Unused exported type*
6. `src/hooks/useVisitorCount.ts` ➔ `type UseVisitorCountReturn` — *Unused exported type*
7. `src/constants/projectDetails.ts` ➔ `type ProjectDetailContent` — *Unused exported type*

---

## Category C: Oboshsoy Use Hocche (Strictly Protected / Don't Touch)

Ei file ebong directory-gulo project-er core functioning-er jonno essential ebong untouched thakbe:

1. **Frontend App Core & Routing**:
   - `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `src/vite-env.d.ts`
   - Shob active pages: `About.tsx`, `AllProjects.tsx`, `BlogList.tsx`, `BucketList.tsx`, `Certificates.tsx`, `Contact.tsx`, `Extensions.tsx`, `Gears.tsx`, `Photos.tsx`, `ProjectDetail.tsx`, `Resume.tsx`, `WorkExperience.tsx`
   - Shob active components (Navbar, Footer, Hero, BlogContent, BookThoughts, CommandPalette, etc.)
2. **Dynamic MDX Content**:
   - `src/content/blog/*.mdx` (Shob 9-ti blog post — `import.meta.glob` diye load hoy)
   - `src/content/thoughts/*.mdx` (Shob 15-ti book review — `import.meta.glob` diye load hoy)
3. **Backend / API Handlers (`api/`)**:
   - `api/likes.ts`, `api/subscribe.ts`, `api/claps.ts`, `api/visit.ts`, `api/photo-likes.ts`, `api/sponsors.ts`, `api/_utils.ts` (Shob Vercel serverless / local middleware endpoints)
4. **Database Schemas (`supabase/`)**:
   - `supabase/migrations/*.sql`
5. **Build Automation Scripts (`scripts/`)**:
   - `scripts/generate-feed.ts` (`npm run build`-e automatically `public/feed.xml` generate kore)
6. **Public Assets (Core & Verified)**:
   - `public/assets/RAHUL_DE_Photo.png` & `public/assets/dp avater.png` (Whitelisted & actively used)
   - `public/assets/RAHUL DE RESUME.pdf` (Actively used in `Resume.tsx` via URL encoded link)
   - `public/oneko/` directory & scripts (Whitelisted cat animation)
   - `public/favicon.*`, `apple-touch-icon.png`, `manifest.json`
   - `public/robots.txt`, `public/sitemap.xml`, `public/_redirects` (SEO & deployment routing)
   - Shob book cover images (`public/books/*`), photos (`public/photo/*`), audio files (`public/Audio/*`), fonts (`public/fonts/*`)
7. **Config & Environment**:
   - `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `vercel.json`, `tailwind.config.js`, `postcss.config.js`, `og-meta.config.ts`, `.env.example`, `.env.local`, `.gitignore`, `README.md`, `LICENSE`
