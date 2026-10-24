'use client';

import { useEffect } from 'react';
import {
  Laptop,
  Keyboard,
  Mouse,
  Headphones,
  Smartphone,
  ArrowUpRight,
} from 'lucide-react';
import { Devices } from '../components/svgs/Devices';
import { AppStore } from '../components/svgs/AppStore';
import ScrollReveal from '../components/ui/ScrollReveal';

export default function Gears() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const devicesList = [
    { icon: Laptop, text: 'ASUS Vivobook 16 (2025) — Laptop' },
    { icon: Smartphone, text: 'Motorola Moto G34 5G — Smartphone' },
    { icon: Mouse, text: 'ASUS MD100 — Wireless Mouse' },
    { icon: Keyboard, text: 'ASUS Marshmallow KW100 — Wireless Keyboard' },
    { icon: Headphones, text: 'boAt Airdopes Ace Gen 2 — Wireless Earbuds' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-28 pb-16">
      <div className="max-w-3xl mx-auto w-full px-6">
        {/* Page Heading */}
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-outfit mb-3 text-foreground">
              Tools & Gears
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base font-supreme">
              Tools and gear I use every day to make work happen.
            </p>
          </div>
        </ScrollReveal>

        {/* Divider */}
        <div className="border-t border-border mb-12"></div>

        <div className="space-y-12">
          {/* Devices Section */}
          <section>
            <ScrollReveal delay={0.1}>
              <h4 className="text-lg md:text-xl sm:text-base font-bold mb-6 flex items-center gap-3 text-foreground">
                <span className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card">
                  <Devices className="w-5 h-5 text-foreground" />
                </span>
                Devices
              </h4>
            </ScrollReveal>

            <ul className="space-y-4">
              {devicesList.map((dev, i) => {
                const Icon = dev.icon;
                return (
                  <ScrollReveal key={i} delay={i * 0.02} className="flex items-center gap-3 text-base sm:text-base font-supreme text-muted-foreground">
                    <span className="w-8 h-8 flex items-center justify-center border border-border rounded-md bg-muted">
                      <Icon className="w-4 h-4 text-foreground" />
                    </span>
                    {dev.text}
                  </ScrollReveal>
                );
              })}
            </ul>
          </section>

          <section>
            <ScrollReveal delay={0.15}>
              <h4 className="text-lg md:text-xl sm:text-base font-bold mb-6 flex items-center gap-3 text-foreground">
                <span className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-card">
                  <AppStore className="w-5 h-5 text-foreground" />
                </span>
                Software
              </h4>
            </ScrollReveal>

            <ul className="space-y-4">
              {[
                { name: 'VS Code', url: 'https://code.visualstudio.com/' },
                { name: 'Antigravity IDE', url: 'https://antigravity.google' },
                { name: 'Git', url: 'https://git-scm.com' },
                { name: 'GitHub', url: 'https://github.com' },
                {
                  name: 'GitHub Desktop',
                  url: 'https://desktop.github.com/download/',
                },
                { name: 'Vercel', url: 'https://vercel.com/home' },
                { name: 'Netlify', url: 'https://app.netlify.com/' },
                { name: 'Notion', url: 'https://www.notion.com/' },
                { name: 'Figma', url: 'https://www.figma.com/' },
                { name: 'npm', url: 'https://www.npmjs.com/' },
                {
                  name: 'VLC',
                  url: 'https://vlc-media-player.en.softonic.com/download?ex=RAMP-3507.0&rex=true',
                },
                { name: 'Discord', url: 'https://discord.com/download' },
                {
                  name: 'Spotify',
                  url: 'https://www.spotify.com/us/download/windows/',
                },
              ].map((ext, i) => (
                <ScrollReveal key={i} delay={i * 0.02} className="flex items-center gap-3 text-base sm:text-base">
                  {/* Number Circle */}
                  <span className="w-7 h-7 flex items-center justify-center rounded-md bg-muted text-sm text-foreground">
                    {i + 1}
                  </span>
                  <a
                    href={ext.url}
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition font-supreme"
                  >
                    {ext.name}
                  </a>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </ScrollReveal>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
