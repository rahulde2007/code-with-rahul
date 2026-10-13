import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Code2,
  ExternalLink,
  Github,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  Wrench,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import ScrollReveal from '../components/ui/ScrollReveal';
import { projectDetails } from '../constants/projectDetails';
import { projects } from '../constants/projects';

const sectionIcons = {
  problem: Target,
  features: Sparkles,
  workflow: Workflow,
  technologies: Code2,
  implementation: Wrench,
  challenges: ShieldCheck,
  useCases: ExternalLink,
  learning: Lightbulb,
} as const;

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = projects.find((item) => item.slug === slug);
  const content = slug ? projectDetails[slug] : undefined;

  if (!project || !content) {
    return (
      <main className="min-h-screen bg-background px-6 py-24 text-foreground">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-hanken text-3xl font-bold">Project not found</h1>
          <p className="mt-3 text-muted-foreground">
            This project page is unavailable. Return to the project list to explore the portfolio.
          </p>
          <Link
            to="/projects"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-hanken text-sm font-semibold transition-colors hover:bg-accent"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  const SectionIcon = ({
    name,
  }: {
    name: keyof typeof sectionIcons;
  }) => {
    const Icon = sectionIcons[name];
    return <Icon size={19} strokeWidth={1.8} aria-hidden="true" />;
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <article className="mx-auto w-full max-w-5xl px-6 pb-24 pt-12 md:px-8 md:pt-16">
        <ScrollReveal>
          <Link
            to="/projects"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-hanken text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Projects
          </Link>

          <header className="mb-12">
            <span className="inline-flex rounded-full border border-border bg-card px-3 py-1 font-hanken text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {project.category} Project
            </span>
            <h1 className="mt-4 font-hanken text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {project.title}
            </h1>
            <p className="mt-5 max-w-3xl font-hanken text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              {content.summary}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-hanken text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
              >
                <Github size={17} aria-hidden="true" />
                GitHub Repository
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-hanken text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  Live Demo
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent px-3 py-1.5 font-hanken text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>
        </ScrollReveal>

        <ScrollReveal className="mb-14">
          <SectionHeading title="Overview" icon={<BookOpen size={19} aria-hidden="true" />} />
          <div className="space-y-4">
            {content.overview.map((paragraph) => (
              <p
                key={paragraph}
                className="max-w-4xl font-hanken text-base leading-7 text-muted-foreground md:text-lg md:leading-8"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </ScrollReveal>

        <div className="mb-14 grid gap-5 md:grid-cols-2">
          <ScrollReveal>
            <InfoPanel
              title="Problem Statement"
              icon={<SectionIcon name="problem" />}
              description={content.problem}
            />
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <ListPanel
              title="Project Goals"
              icon={<Target size={19} aria-hidden="true" />}
              items={content.goals}
            />
          </ScrollReveal>
        </div>

        <ScrollReveal className="mb-14">
          <SectionHeading title="Key Features" icon={<SectionIcon name="features" />} />
          <div className="grid gap-4 sm:grid-cols-2">
            {content.features.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-accent/50 md:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground">
                    <FeatureIcon index={index} />
                  </span>
                  <div>
                    <h3 className="font-hanken text-base font-bold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 font-hanken text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="mb-14">
          <SectionHeading title="How It Works" icon={<SectionIcon name="workflow" />} />
          <ol className="space-y-3">
            {content.workflow.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 md:p-5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent font-hanken text-sm font-bold text-foreground">
                  {index + 1}
                </span>
                <p className="pt-1 font-hanken text-sm leading-6 text-muted-foreground md:text-base">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </ScrollReveal>

        <ScrollReveal className="mb-14">
          <SectionHeading title="Technologies Used" icon={<SectionIcon name="technologies" />} />
          <div className="grid gap-3 sm:grid-cols-2">
            {content.technologies.map((technology) => (
              <div
                key={technology.name}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h3 className="font-hanken text-base font-bold text-foreground">
                  {technology.name}
                </h3>
                <p className="mt-2 font-hanken text-sm leading-6 text-muted-foreground">
                  {technology.role}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal className="mb-14">
          <SectionHeading
            title="My Contribution & Implementation"
            icon={<SectionIcon name="implementation" />}
          />
          <BulletList items={content.implementation} />
        </ScrollReveal>

        {content.challenges && content.challenges.length > 0 && (
          <ScrollReveal className="mb-14">
            <SectionHeading
              title="Challenges & Solutions"
              icon={<SectionIcon name="challenges" />}
            />
            <div className="space-y-4">
              {content.challenges.map(({ challenge, solution }) => (
                <div
                  key={challenge}
                  className="rounded-2xl border border-border bg-card p-5 md:p-6"
                >
                  <h3 className="font-hanken text-base font-bold text-foreground">
                    {challenge}
                  </h3>
                  <p className="mt-2 font-hanken text-sm leading-6 text-muted-foreground">
                    <span className="font-semibold text-foreground">Approach: </span>
                    {solution}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        <div className="mb-14 grid gap-5 md:grid-cols-2">
          <ScrollReveal>
            <ListPanel
              title="Real-World Use Cases"
              icon={<SectionIcon name="useCases" />}
              items={content.useCases}
            />
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <ListPanel
              title="What I Learned"
              icon={<SectionIcon name="learning" />}
              items={content.learning}
            />
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center md:p-8">
            <div>
              <h2 className="font-hanken text-xl font-bold text-foreground">
                Explore the project
              </h2>
              <p className="mt-2 font-hanken text-sm leading-6 text-muted-foreground">
                Visit the repository
                {project.demo ? ' or try the live demo' : ''}
                {' '}to explore the implementation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 font-hanken text-sm font-semibold transition-colors hover:bg-accent"
              >
                <Github size={16} aria-hidden="true" />
                Repository
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 font-hanken text-sm font-semibold transition-colors hover:bg-accent"
                >
                  Live Demo
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </ScrollReveal>
      </article>
    </main>
  );
};

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon: ReactNode;
}) {
  return (
    <h2 className="mb-5 flex items-center gap-3 font-hanken text-2xl font-extrabold text-foreground md:text-3xl">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-foreground">
        {icon}
      </span>
      {title}
    </h2>
  );
}

function InfoPanel({
  title,
  icon,
  description,
}: {
  title: string;
  icon: ReactNode;
  description: string;
}) {
  return (
    <section className="h-full rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-3 font-hanken text-lg font-bold text-foreground">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent">
          {icon}
        </span>
        {title}
      </h2>
      <p className="font-hanken text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
        {description}
      </p>
    </section>
  );
}

function ListPanel({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <section className="h-full rounded-2xl border border-border bg-card p-5 md:p-6">
      <h2 className="mb-4 flex items-center gap-3 font-hanken text-lg font-bold text-foreground">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent">
          {icon}
        </span>
        {title}
      </h2>
      <BulletList items={items} />
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 font-hanken text-sm leading-6 text-muted-foreground md:text-base"
        >
          <Check
            size={17}
            className="mt-1 shrink-0 text-foreground"
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FeatureIcon({ index }: { index: number }) {
  const icons = [Sparkles, ShieldCheck, Workflow, Code2, ExternalLink];
  const Icon = icons[index % icons.length];
  return <Icon size={18} strokeWidth={1.8} aria-hidden="true" />;
}

export default ProjectDetail;
