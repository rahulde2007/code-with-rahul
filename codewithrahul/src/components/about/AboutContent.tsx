import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { FilmStripCard } from '../gallery/film-strip-card';

export const AboutContent = () => {

    return (
        <div className="flex flex-col mt-0">
            {/* Film Strip Gallery Banner */}
            <FilmStripCard className="-mt-6 sm:-mt-10 mb-8" />

            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-extrabold font-bricolage text-foreground">
                    About <span className="text-[#00DC82]">Me</span>
                </h1>
            </div>
            <div className="flex flex-col gap-6">
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed">
                    I'm Rahul De, a Computer Science Engineering student and aspiring Full-Stack Developer passionate about turning ideas into meaningful digital experiences.
                    With a growing foundation in programming, modern web technologies, and problem-solving, I enjoy building intuitive interfaces and practical applications that balance functionality with thoughtful design.
                </p>
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed">
                    I’m constantly exploring new technologies, refining my development skills, and contributing to open-source projects.
                    My goal is to grow as a software developer by creating impactful solutions, embracing new challenges, and learning through every project I build.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10 py-6 text-left">
                <div className="md:col-span-1 flex items-center md:items-start gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono">
                    <span>Education</span>
                    <div className="hidden md:block h-[1px] flex-1 bg-border mt-2"></div>
                </div>
                <div className="md:col-span-3 flex flex-col gap-8">
                    <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                        <div className="flex items-center gap-2.5">
                            <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">Bachelors of Computer Science</h4>
                            <Tooltip>
                                <TooltipTrigger>
                                    <a
                                        href="https://futureeducation.in/fiem/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-border bg-transparent opacity-0 -translate-x-1.5 scale-90 group-hover/title:opacity-100 group-hover/title:translate-x-0 group-hover/title:scale-100 hover:border-muted-foreground transition-all duration-300 ease-out select-none cursor-pointer"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground"></span>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <span className="text-xs font-mono">Link</span>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <p className="text-xs font-mono text-[#00DC82] mt-0.5">
                            <a
                                href="https://futureeducation.in/fiem/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00DC82] no-underline"
                            >
                                Future Institute of Engineering
                            </a>{' '}
                            (2026 - 2030)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
