import ScrollReveal from '../ui/ScrollReveal';
import { SiC, SiCplusplus, SiGit, SiGithub } from 'react-icons/si';

// Import SVG icons from the components/svgs folder
import { Python } from '../svgs/Python';
import Html from '../svgs/Html';
import CSS from '../svgs/CSS';
import JavaScript from '../svgs/JavaScript';
import NextJs from '../svgs/NextJs';
import Bun from '../svgs/Bun';
import { MySQL } from '../svgs/MySQL';
import { VisualStudioCode } from '../svgs/VisualStudioCode';
import Vercel from '../svgs/Vercel';

// Icon wrappers for languages/tools from react-icons
const CIcon = ({ className }: { className?: string }) => (
  <SiC className={`text-[#659AD2] ${className || ''}`} />
);

const CppIcon = ({ className }: { className?: string }) => (
  <SiCplusplus className={`text-[#00599C] ${className || ''}`} />
);

const GitIcon = ({ className }: { className?: string }) => (
  <SiGit className={`text-[#F05032] ${className || ''}`} />
);

const GithubIcon = ({ className }: { className?: string }) => (
  <SiGithub className={`text-foreground ${className || ''}`} />
);

const Skills = () => {
  // Ordered tech stack with 13 items
  const techStack = [
    { name: 'C', icon: CIcon, href: 'https://en.cppreference.com/w/c' },
    { name: 'C++', icon: CppIcon, href: 'https://isocpp.org/' },
    { name: 'Python', icon: Python, href: 'https://www.python.org/' },
    { name: 'HTML', icon: Html, href: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
    { name: 'CSS', icon: CSS, href: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
    { name: 'JavaScript', icon: JavaScript, href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
    { name: 'Next.js', icon: NextJs, href: 'https://nextjs.org/' },
    { name: 'Bun', icon: Bun, href: 'https://bun.sh/' },
    { name: 'MySQL', icon: MySQL, href: 'https://www.mysql.com/' },
    { name: 'Git', icon: GitIcon, href: 'https://git-scm.com/' },
    { name: 'GitHub', icon: GithubIcon, href: 'https://github.com/' },
    { name: 'VS Code', icon: VisualStudioCode, href: 'https://code.visualstudio.com/' },
    { name: 'Vercel', icon: Vercel, href: 'https://vercel.com/' },
  ];

  return (
    <section id="skills" className="pt-8 pb-8 bg-background">
      <div className="max-w-3xl mx-auto w-full px-6">
        <ScrollReveal className="mb-8">
          <p className="text-lg text-muted-foreground font-outfit text-left">
            Latest
          </p>
          <h2 className="text-3xl font-extrabold font-bricolage text-foreground text-left">
            Tech Stack
          </h2>
        </ScrollReveal>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-start items-center">
          {techStack.map((tech, idx) => {
            const IconComponent = tech.icon;
            return (
              <ScrollReveal
                key={tech.name}
                delay={idx * 0.012}
              >
                <a
                  href={tech.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 bg-card border border-border rounded-full shadow-sm cursor-pointer select-none transition-colors duration-200 hover:bg-accent"
                >
                  {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
                  <span className="font-outfit font-medium text-[11px] sm:text-xs text-foreground tracking-wide">
                    {tech.name}
                  </span>
                </a>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Skills;
