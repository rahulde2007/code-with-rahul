import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Database, Earth, FileText, Network, ServerCog, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { SiC, SiCplusplus, SiHtml5, SiPython } from 'react-icons/si';
import {
  GithubIcon,
  LinkedinIcon,
  XIcon,
} from './icons/SocialIcons';
import TerminalIcon from './svgs/TerminalIcon';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

import ScrollReveal from './ui/ScrollReveal';

const technologyBadgeClassName =
  'inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground align-middle whitespace-nowrap transition-colors hover:border-foreground/30 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const Hero = () => {
  const [githubFollowers, setGithubFollowers] = useState<number | null>(null);
  const [copiedTerminal, setCopiedTerminal] = useState(false);
  const [avatarTheme, setAvatarTheme] = useState<'logo' | 'avatar'>(() => {
    const saved = localStorage.getItem('avatar_theme');
    return (saved as 'logo' | 'avatar') || 'logo';
  });

  // Play click audio sound from public/Audio/
  const playClickSound = () => {
    const audio = new Audio('/Audio/public_audio_toggle-on.MP3');
    audio.volume = 0.1; // Lower volume for a very soft and pleasant click
    audio.play().catch((err) => console.log('Audio play blocked or failed:', err));
  };

  const handleThemeClick = () => {
    playClickSound();
    setAvatarTheme((prev) => {
      const next = prev === 'logo' ? 'avatar' : 'logo';
      localStorage.setItem('avatar_theme', next);
      return next;
    });
  };

  const handleCopyTerminal = () => {
    navigator.clipboard.writeText('npx codewithrahul');
    setCopiedTerminal(true);
    setTimeout(() => setCopiedTerminal(false), 2000);
  };

  useEffect(() => {
    // Fetch GitHub follower count dynamically using the configured GitHub username
    fetch('https://api.github.com/users/rahulde2007')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.followers === 'number') {
          setGithubFollowers(data.followers);
        }
      })
      .catch((err) => console.error('Failed to fetch GitHub followers:', err));
  }, []);

  // Format the followers count nicely
  const formatFollowers = (count: number | null) => {
    if (count === null) return '2.2k';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <section
      id="home"
      className="relative bg-background pt-24 md:pt-28 pb-6 md:pb-8"
    >
      <ScrollReveal className="max-w-3xl mx-auto w-full px-6 flex flex-col">
        <div className="relative w-full rounded-xl overflow-hidden aspect-[13/5] sm:aspect-[3/1] bg-muted">
          <motion.img
            src="/assets/bg1.jpg"
            alt="Night mountain landscape banner"
            initial={false}
            animate={{
              opacity: avatarTheme === 'logo' ? 1 : 0,
              filter: avatarTheme === 'logo' ? 'blur(0px)' : 'blur(12px)',
              scale: avatarTheme === 'logo' ? 1 : 1.04,
            }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            className={`absolute inset-0 w-full h-full object-cover object-center brightness-[0.8] ${
              avatarTheme === 'logo' ? 'pointer-events-auto z-10' : 'pointer-events-none z-0'
            }`}
            {...{ fetchpriority: 'high' }}
            loading="eager"
            decoding="async"
          />

          <motion.img
            src="/assets/bg.png"
            alt="Day mountain landscape banner"
            initial={false}
            animate={{
              opacity: avatarTheme !== 'logo' ? 1 : 0,
              filter: avatarTheme !== 'logo' ? 'blur(0px)' : 'blur(12px)',
              scale: avatarTheme !== 'logo' ? 1 : 1.04,
            }}
            transition={{ duration: 0.75, ease: 'easeInOut' }}
            className={`absolute inset-0 w-full h-full object-cover object-center brightness-[0.75] ${
              avatarTheme !== 'logo' ? 'pointer-events-auto z-10' : 'pointer-events-none z-0'
            }`}
            {...{ fetchpriority: 'high' }}
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 z-10">
            <p className="font-serif italic text-white/95 text-center text-sm sm:text-base md:text-lg max-w-md md:max-w-xl leading-relaxed select-none drop-shadow-md">
              "Hanging with problem"
            </p>
          </div>
        </div>

        <div className="relative px-4 flex justify-between items-end -mt-10 sm:-mt-12 md:-mt-14 z-10">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-card shadow-md bg-muted">
            <motion.img
              src="/assets/avaterlogo.webp"
              alt="Rahul De"
              initial={false}
              animate={{
                opacity: avatarTheme === 'logo' ? 1 : 0,
                filter: avatarTheme === 'logo' ? 'blur(0px)' : 'blur(10px)',
                scale: avatarTheme === 'logo' ? 1 : 1.05,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className={`absolute inset-0 w-full h-full object-cover ${
                avatarTheme === 'logo' ? 'pointer-events-auto z-10' : 'pointer-events-none z-0'
              }`}
              {...{ fetchpriority: 'high' }}
              loading="eager"
            />
            <motion.img
              src="/assets/dp%20avater.png"
              alt="Rahul De"
              initial={false}
              animate={{
                opacity: avatarTheme === 'avatar' ? 1 : 0,
                filter: avatarTheme === 'avatar' ? 'blur(0px)' : 'blur(10px)',
                scale: avatarTheme === 'avatar' ? 1 : 1.05,
              }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className={`absolute inset-0 w-full h-full object-cover ${
                avatarTheme === 'avatar' ? 'pointer-events-auto z-10' : 'pointer-events-none z-0'
              }`}
              {...{ fetchpriority: 'high' }}
              loading="eager"
            />
          </div>

          <div className="pb-2 md:pb-4">
            <Tooltip>
              <TooltipTrigger>
                <a
                  href="https://github.com/rahulde2007/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition duration-200 select-none shadow-sm cursor-pointer"
                >
                  <GithubIcon size="14" className="stroke-current inline" />
                  <span>{formatFollowers(githubFollowers)}</span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Follow me!</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-6 px-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bricolage font-extrabold md:text-3xl tracking-tight text-foreground flex items-center gap-2">
              <span>Rahul De</span>
              <Tooltip>
                <TooltipTrigger>
                  <button
                    onClick={handleCopyTerminal}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center focus:outline-none"
                    aria-label="Copy npx codewithrahul"
                  >
                    <TerminalIcon size={24} className="stroke-current" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{copiedTerminal ? 'Copied npx codewithrahul!' : 'npx codewithrahul'}</p>
                </TooltipContent>
              </Tooltip>
            </h2>
            <p className="mt-1.5 font-hanken text-[14px] leading-[20px] tracking-normal text-muted-foreground">
              engineer • developer • builder
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <a
                  href="https://github.com/rahulde2007/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <GithubIcon size="18" className="stroke-current" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>GitHub</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <a
                  href="https://x.com/rahulde_937"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <XIcon size="18" className="fill-current" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>X (Twitter)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <a
                  href="https://www.linkedin.com/in/rahul-de-r6294520571?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <LinkedinIcon size="20" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>LinkedIn</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={handleThemeClick}
                  className="p-2.5 rounded-full border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-200 flex items-center justify-center cursor-pointer hover:rotate-45 shadow-sm"
                >
                  <Earth className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Change Avatar Theme</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="h-8 sm:h-10"></div>

        {/* Bio Section */}
        <div className="px-1">
          <h3 className="font-bold font-bricolage text-foreground text-base sm:text-lg mb-3">
            I build from scratch.
          </h3>
          <p className="text-muted-foreground leading-relaxed text-base font-hanken font-regular">
            I am a <strong className="text-foreground font-hanken font-medium">First-Year CSE Student</strong> at Future Institute of Engineering and Management (MAKAUT), Kolkata, dedicated to building strong fundamentals with{' '}
            <a
              href="https://en.cppreference.com/w/c/language.html"
              target="_blank"
              rel="noopener noreferrer"
              className={technologyBadgeClassName}
            >
              <SiC className="h-3.5 w-3.5 text-[#A8B9CC]" aria-hidden="true" />
              <span>C</span>
            </a>
            ,{' '}
            <a
              href="https://en.cppreference.com/w/"
              target="_blank"
              rel="noopener noreferrer"
              className={technologyBadgeClassName}
            >
              <SiCplusplus className="h-3.5 w-3.5 text-[#00599C]" aria-hidden="true" />
              <span>C++</span>
            </a>
            ,{' '}
            <a
              href="https://www.python.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={technologyBadgeClassName}
            >
              <SiPython className="h-3.5 w-3.5 text-[#3776AB]" aria-hidden="true" />
              <span>Python</span>
            </a>
            ,{' '}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/HTML"
              target="_blank"
              rel="noopener noreferrer"
              className={technologyBadgeClassName}
            >
              <SiHtml5 className="h-3.5 w-3.5 text-[#E34F26]" aria-hidden="true" />
              <span>HTML5</span>
            </a>
            , and{' '}
            <a
              href="https://www.w3.org/TR/sql-92/"
              target="_blank"
              rel="noopener noreferrer"
              className={technologyBadgeClassName}
            >
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              <span>SQL</span>
            </a>
            , along with{' '}
            <a
              href="https://www.ibm.com/think/topics/dbms"
              target="_blank"
              rel="noopener noreferrer"
              className={technologyBadgeClassName}
            >
              <ServerCog className="h-3.5 w-3.5" aria-hidden="true" />
              <span>DBMS</span>
            </a>{' '}
            and{' '}
            <a
              href="https://www.cisco.com/site/us/en/learn/topics/networking/what-is-computer-networking.html"
              target="_blank"
              rel="noopener noreferrer"
              className={technologyBadgeClassName}
            >
              <Network className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Computer Networking</span>
            </a>
            . Guided by consistent learning and the discipline the Army represents, I turn what I learn into practical projects. Always curious about technology, I focus on learning step by step and growing into a well-grounded developer.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-8 px-1">
          <a
            href="/assets/RAHUL%20DE%20RESUME.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 font-hanken rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground font-medium text-xs transition-all duration-200 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            Resume / CV
          </a>
          <Link
            to="/about"
            className="flex items-center gap-1.5 px-3.5 py-2 font-hanken rounded-lg bg-neutral-800 dark:bg-foreground hover:bg-zinc-700 dark:hover:bg-foreground/90 text-white dark:text-background font-medium text-xs transition-all duration-200 shadow-sm"
          >
            <UserRound className="w-4 h-4" aria-hidden="true" />
            About Me
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
};

export default Hero;
