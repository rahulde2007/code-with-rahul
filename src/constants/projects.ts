export type Project = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: 'Frontend' | 'Utility';
  filterCategories: ProjectFilterCategory[];
  image?: string;
  github: string;
  demo?: string;
  tags: string[];
  date?: string;
  postImageHtml?: string;
};

export type ProjectFilterCategory =
  | 'Full Stack'
  | 'Frontend'
  | 'Backend'
  | 'Mobile App'
  | 'Bot Development'
  | 'Game'
  | 'Utility'
  | 'AI/ML'
  | 'Other';

export const projects: Project[] = [
  {
    id: 1,
    slug: 'wifi-qr-generator',
    title: 'WiFi QR Generator',
    description: 'A modern, lightweight, offline-capable WiFi QR code generator that creates scannable QR codes directly in the browser while keeping network credentials private.',
    category: 'Utility',
    filterCategories: ['Frontend', 'Utility'],
    github: 'https://github.com/rahulde2007/WiFi-QR-Generator',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'Vite'],
  },
  {
    id: 2,
    slug: 'github-achievement-hunt',
    title: 'GitHub Achievement Hunt',
    description: 'A guide and tracker for GitHub achievements, original badge artwork, contribution activities, and an open-source learning roadmap.',
    category: 'Utility',
    filterCategories: ['Frontend', 'Other'],
    github: 'https://github.com/rahulde2007/Github-Achievement-Hunt',
    tags: ['HTML5', 'CSS3', 'JavaScript'],
  },
  {
    id: 3,
    slug: 'rahuls-3d-world',
    title: "Rahul's 3D World",
    description: 'An interactive 3D personal portfolio featuring a 3D character scene, smooth scrolling animations, projects, skills, and education.',
    category: 'Frontend',
    filterCategories: ['Frontend'],
    github: 'https://github.com/rahulde2007/rahuls-3d-world',
    demo: 'https://rahuls-3d-world.vercel.app/',
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Three.js', 'GSAP'],
  },
  {
    id: 4,
    slug: 'calcx-pro-calculator',
    title: 'Calcx-Pro Calculator',
    description: 'A modern, responsive calculator supporting standard arithmetic, scientific functions, calculation history, and offline-capable PWA functionality.',
    category: 'Utility',
    filterCategories: ['Frontend', 'Utility'],
    github: 'https://github.com/rahulde2007/Calcx-Pro-Calculator',
    tags: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
  },
];
