import { Link } from 'react-router-dom';
import {
  GithubIcon,
  LinkedinIcon,
  XIcon,
  InstagramIcon,
} from '../icons/SocialIcons';

const navigateLinks = [
  { name: 'Home', href: '/' },
  { name: 'Work', href: '/experience' },
  { name: 'Blog', href: '/blog' },
  { name: 'Resume', href: '/resume' },
  { name: 'Projects', href: '/projects' },
  { name: 'Gears', href: '/gears' },
  { name: 'Setup', href: '/extensions' },
  { name: 'Gallery', href: '/photos' },
  { name: 'Achievements', href: '/certificates' },
  { name: 'Contact', href: '/contact' },
];

const socialLinks = [
  {
    href: 'https://x.com/rahulde_937',
    icon: <XIcon size="18" className="fill-muted-foreground group-hover:fill-foreground transition-colors duration-300" />
  },
  {
    href: 'https://www.linkedin.com/in/rahul-de-r6294520571?utm_source=share_via&utm_content=profile&utm_medium=member_android',
    icon: <LinkedinIcon size="21" className="stroke-muted-foreground group-hover:stroke-foreground transition-colors duration-300" />
  },
  {
    href: 'https://github.com/rahulde2007/',
    icon: <GithubIcon size="18" className="stroke-muted-foreground group-hover:stroke-foreground transition-all duration-300" />
  },
  {
    href: 'https://www.instagram.com/rahulde_18/',
    icon: <InstagramIcon size="18" className="stroke-muted-foreground group-hover:stroke-foreground transition-all duration-300" />
  },
];

const Footer = () => {
  // Play click audio sound from public/Audio/
  const playClickSound = () => {
    const audio = new Audio('/Audio/link_sound.mp3');
    audio.volume = 0.1; // Lower volume for a very soft and pleasant click
    audio.play().catch((err) => console.log('Audio play blocked or failed:', err));
  };

  return (
    <footer className="bg-background pt-20 pb-16 relative">
      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>

      <div className="max-w-3xl mx-auto w-full px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
          {/* Left: NAVIGATE */}
          <div className="flex flex-col gap-4">
            <span className="text-foreground text-xs font-bold uppercase tracking-wider font-outfit">
              Navigate
            </span>
            <div className="flex flex-wrap gap-x-6 gap-y-3 max-w-md font-outfit text-sm">
              {navigateLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={playClickSound}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Spotify Widget */}
            <a
              href="https://open.spotify.com/playlist/6jiB4RHp3nz0Rd4RXGj2pl?si=rP8oX_oAR4eteetwBUP0qA"
              target="_blank"
              rel="noopener noreferrer"
              onClick={playClickSound}
              className="flex items-center gap-2.5 mt-4 group w-fit"
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#1DB954] rounded-full opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg"
                  alt="Spotify"
                  className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium font-outfit">
                <span className="text-foreground group-hover:text-[#1DB954] transition-colors">
                  My Ordinary Life
                </span>
                <span className="text-muted-foreground/60">—</span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                  Everyday Feelings
                </span>
              </div>
            </a>
          </div>

          {/* Right: CONNECT */}
          <div className="flex flex-col gap-4 text-left">
            <span className="text-foreground text-xs font-bold uppercase tracking-wider font-outfit">
              Connect
            </span>
            <div className="flex flex-wrap md:grid md:grid-cols-4 gap-2">
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={playClickSound}
                  className="group w-10 h-10 border border-border bg-card hover:bg-accent rounded-lg flex items-center justify-center transition-all duration-300"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 relative flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
          <p className="text-muted-foreground text-sm font-hanken">
            © 2026 Rahul De. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
