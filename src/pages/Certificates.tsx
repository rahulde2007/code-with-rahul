import { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import ScrollReveal from '../components/ui/ScrollReveal';
import Sponsors from '../components/ui/Sponsors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { SectionButton } from '../components/ui/SectionButton';
import { contributions } from '../data/contributions';
import { cn } from '../lib/utils';

type CertificateRecord = {
  title: string;
  description: string;
  actionLabel: string;
} & (
  | { href: string; image?: never }
  | { image: string; href?: never }
);

const Certificates = () => {
  const [visibleAchieveCount, setVisibleAchieveCount] = useState(3);

  const [expandedAchieveIndex, setExpandedAchieveIndex] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const toggleAchieveExpand = (idx: number) => {
    setExpandedAchieveIndex(expandedAchieveIndex === idx ? null : idx);
  };

  const certificates: CertificateRecord[] = [
    {
      title: 'Neo4j GraphAcademy Certificate',
      description: 'Demonstrates learning and practical knowledge gained through Neo4j GraphAcademy training.',
      href: 'https://graphacademy.neo4j.com/c/c2a5bd5b-ed21-4833-8193-273ec87ae5cc',
      actionLabel: 'View Certificate',
    },
    {
      title: 'IBM SkillsBuild Certificate',
      description: 'Highlights learning and skill development completed through IBM\'s learning platform.',
      href: 'https://skills.yourlearning.ibm.com/certificate/share/58129f22d0ewogICJvYmplY3RJZCIgOiAiUExBTi1FNjI0QzI2MDQwNjAiLAogICJsZWFybmVyQ05VTSIgOiAiODkyOTIxNFJFRyIsCiAgIm9iamVjdFR5cGUiIDogIkFDVElWSVRZIgp917bd2b8bc4-10',
      actionLabel: 'View Certificate',
    },
    {
      title: 'Coursera Verified Certificate',
      description: 'Recognizes successful completion of a course or learning program verified by Coursera.',
      href: 'https://www.coursera.org/account/accomplishments/verify/NN938NT28BG2',
      actionLabel: 'Verify Certificate',
    },
    {
      title: 'Coursera Verified Certificate',
      description: 'Showcases additional learning and verified achievement through Coursera.',
      href: 'https://www.coursera.org/account/accomplishments/verify/EKXSLEHWX0ZU',
      actionLabel: 'Verify Certificate',
    },
    {
      title: 'TCS iON Certificate',
      description: 'Highlights learning and professional skill development through TCS iON.',
      image: '/assets/TCSion.jpg',
      actionLabel: 'View Certificate',
    },
  ];

  return (
    <div className="min-h-screen pt-20 md:pt-28 pb-6 bg-background">
      <div className="max-w-3xl mx-auto w-full px-6">


        {/* Certifications Section */}
        <div className="mb-8">
          <ScrollReveal>
            <h4 className="text-lg sm:text-1xl font-semibold text-foreground font-hanken text-left border-b border-border pb-3 mb-2 flex items-center gap-1.5">
              Certifications <span className="text-xs text-muted-foreground font-mono font-normal">[{certificates.length}]</span>
            </h4>
          </ScrollReveal>

          <div className="flex flex-col py-2 sm:py-3 w-full transition-all duration-300">
            {certificates.map((cert, index) => {
              const image = cert.image;

              return (
                <div key={`${cert.title}-${index}`} className="flex flex-col gap-2 py-3 w-full border-b border-border/60 last:border-b-0">
                  <ScrollReveal delay={index * 0.05}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold font-outfit text-foreground tracking-wide">
                          {cert.title}
                        </h3>
                        <p className="mt-1 text-muted-foreground font-hanken text-sm sm:text-base leading-snug">
                          {cert.description}
                        </p>
                      </div>
                      {cert.href ? (
                        <a
                          href={cert.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-accent transition-colors"
                        >
                          {cert.actionLabel}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => image && setPreviewImage(image)}
                          className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg border border-border bg-card px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-accent transition-colors"
                        >
                          {cert.actionLabel}
                        </button>
                      )}
                    </div>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(image)}
                        className="mt-3 block w-fit overflow-hidden rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                        aria-label={`Preview ${cert.title}`}
                      >
                        <img
                          src={image}
                          alt={cert.title}
                          className="h-28 w-auto max-w-full object-contain"
                        />
                      </button>
                    )}
                  </ScrollReveal>
                </div>
              );
            })}
          </div>

          <ScrollReveal className="mt-6 flex justify-center">
            <a
              href="https://www.linkedin.com/in/rahul-de-r6294520571/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium font-hanken text-foreground shadow-sm transition-all duration-200 hover:bg-accent"
            >
              Show More Certificates
            </a>
          </ScrollReveal>
        </div>

        {/* Achievements Section */}
        <div className="mb-6">
          <ScrollReveal>
            <h4 className="text-lg sm:text-1xl font-semibold font-hanken text-foreground text-left border-b border-border pb-3 mb-2 flex items-center gap-1.5">
              Contributions <span className="text-xs text-muted-foreground font-mono font-normal">[{contributions.length}]</span>
            </h4>
          </ScrollReveal>

          <div className="flex flex-col py-2 sm:py-3 w-full transition-all duration-300">
            {contributions.map((contribution, index) => {
              const isExpanded = expandedAchieveIndex === index;
              const isVisible = index < 3 || visibleAchieveCount > 3;
              return (
                <div
                  key={contribution.href}
                  className={cn(
                    "grid transition-all duration-500 ease-in-out",
                    isVisible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <ScrollReveal delay={index < 3 ? index * 0.05 : 0}>
                      <div className="flex flex-col py-2 sm:py-3 w-full transition-all duration-300">
                    <div
                      className="flex flex-col gap-1 w-full group cursor-pointer select-none"
                      onClick={() => toggleAchieveExpand(index)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-bold font-outfit text-foreground tracking-wide transition-colors">
                            {contribution.title}
                          </h3>
                          <div className={cn(
                            "flex items-center justify-center w-5 h-5 rounded transition-all duration-300 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground",
                            isExpanded ? "rotate-90 text-foreground opacity-100" : ""
                          )}>
                            <ChevronRight className="w-4 h-4 shrink-0 transition-transform duration-300" strokeWidth={2.5} />
                          </div>
                        </div>

                        {contribution.date && (
                          <time className="text-muted-foreground text-sm md:text-base font-hanken text-right shrink-0">
                            {contribution.date}
                          </time>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm w-full mt-0.5">
                        <p className="text-muted-foreground font-hanken font-medium text-sm sm:text-base leading-snug">
                          {contribution.organization}
                        </p>

                        <div className="flex items-center gap-3">
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                            {contribution.category}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={contribution.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                                >
                                  View
                                </a>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p>{contribution.category === 'Merged pull request' ? 'View merged pull request' : 'View GitHub project'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="mt-4 space-y-4 border-t border-border pt-4">
                          <div>
                            <h4 className="text-xs font-outfit font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                              {contribution.category === 'Merged pull request' ? 'Contribution details' : 'Project overview'}
                            </h4>
                            <ul className="flex flex-col gap-2">
                              {contribution.details.map((detail, dIdx) => (
                                <li key={dIdx} className="flex gap-2 items-start">
                                  <span className="text-muted-foreground shrink-0 select-none mt-1.5 text-xs">•</span>
                                  <span className="text-muted-foreground font-poppins text-sm sm:text-sm leading-relaxed">
                                    {detail}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                      </div>
                    </ScrollReveal>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toggle Button styled like the standard buttons */}
          {contributions.length > 3 && (
            <ScrollReveal className="flex justify-center mt-6">
              <SectionButton
                onClick={() => setVisibleAchieveCount(visibleAchieveCount === 3 ? contributions.length : 3)}
                text={visibleAchieveCount === 3 ? 'Show More Contributions' : 'Show Less Contributions'}
                icon={null}
              />
            </ScrollReveal>
          )}
        </div>
      </div>
      {previewImage && (
        <div
          role="presentation"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Certificate preview"
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[90vh] max-w-[90vw] rounded-xl border border-border bg-card p-3 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              aria-label="Close certificate preview"
              className="absolute right-2 top-2 z-10 rounded-full border border-border bg-card p-2 text-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewImage}
              alt="TCS iON Certificate"
              className="max-h-[82vh] max-w-[85vw] object-contain"
            />
          </div>
        </div>
      )}
      <Sponsors />
    </div>
  );
};

export default Certificates;
