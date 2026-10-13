import ScrollReveal from '../ui/ScrollReveal';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

export const AboutWorkspace = () => {
  return (
    <div className="mt-0 border-t border-border pt-6">
      <ScrollReveal>
        <h2 className="text-3xl font-extrabold font-bricolage mb-6 text-foreground text-left">
          Workspace
        </h2>
      </ScrollReveal>

      {/* Photo Card */}
      <ScrollReveal delay={0.1}>
        <div className="relative w-full rounded-2xl overflow-hidden shadow-xl mb-6 md:mb-12 group bg-card">
          <img
            src="/assets/desksetup.jpg"
            alt="Workspace Setup"
            className="w-full h-auto max-h-[480px] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
        </div>
      </ScrollReveal>

      {/* Workspace details */}
      <div className="flex flex-col gap-8 md:gap-12 mt-6 md:mt-8">
        {/* Workstation Category */}
        <ScrollReveal delay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10 py-6 text-left">
            <div className="md:col-span-1 flex items-center md:items-start gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono">
              <span>Workstation</span>
              <div className="hidden md:block h-[1px] flex-1 bg-border mt-2"></div>
            </div>
            <div className="md:col-span-3 flex flex-col gap-8">
              <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">
                    Asus Vivobook 16" 2025
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        href="https://www.flipkart.com/asus-vivobook-16-2025-office-2024-m365-basic-intel-core-i5-13th-gen-13420h-16-gb-512-gb-ssd-windows-11-home-x1605va-mb1627ws-thin-light-laptop/p/itmd74674c1c830b?pid=COMH9SJ9CF9DSGXF&lid=LSTCOMH9SJ9CF9DSGXFUGIS4G&marketplace=FLIPKART&cmpid=content_computer_24004169905_g_8965229628_gmc_pla&tgi=sem,1,G,11214002,g,search,,815466423545,,,,c,,,,,,,&entryMethod=24004169905&&cmpid=content_24004169905_gmc_pla&gad_source=1&gad_campaignid=24004169905&gbraid=0AAAAADxRY59M1ziXxeLGgJ0s40gCTjt6o&gclid=CjwKCAjwrbfWBhAeEiwAc2e6Pmfdq_iCTihiaZbbD5m-yQCT4IAzGjNGumHPOUf-8X8pc3M3Mz2eQxoCto8QAvD_BwE"
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
                  16GB Memory, 512GB SSD
                </p>
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed mt-2">
                  My ultimate powerhouse and absolute daily driver. The
                  exceptional efficiency and outstanding performance of this
                  machine enable me to build, compile, and design complex
                  software without breaking a sweat.
                </p>
              </div>

              <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">
                    ASUS MD100 Mouse
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        href="https://www.flipkart.com/asus-md100-marshmallow-wireless-ambidextrous-optical-mouse-upto-1600-dpi-adjustable-sensitivity-silent-click-switches-dual-mode-connectivity-concealed-carrying-strap-antimicrobial-guard-protection/p/itmc18ed8cae1b4a?pid=ACCGSBQHAC9J9Z5S&lid=LSTACCGSBQHAC9J9Z5SZOKH2L&marketplace=FLIPKART"
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
                  Marshmallow Wireless • Up to 1600 DPI • Dual-Mode Connectivity
                </p>
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed mt-2">
                  This is my primary mouse. Its ambidextrous design, silent
                  click switches, and dual-mode connectivity provide quiet,
                  comfortable control for my daily workflows.
                </p>
              </div>

              <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">
                    ASUS Marshmallow KW100
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        href="https://www.flipkart.com/asus-marshmallow-kw100-bluetooth-laptop-size-laptop-keyboard-compatible-desktop-laptop-mac-ipad-tablet-easy-use-plug-play-quick-comfy-durable-body/p/itm705d8efa683b4?pid=ACCGSBQCATQCHCDT&lid=LSTACCGSBQCATQCHCDTQMDOIA&marketplace=FLIPKART"
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
                  Green Tea Latte • Bluetooth Laptop-Size Keyboard
                </p>
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed mt-2">
                  This is my primary keyboard. Its Bluetooth connectivity,
                  comfortable laptop-size layout, and durable body make typing
                  across my devices easy and comfortable.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Furniture Category */}
        <ScrollReveal delay={0.2}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10 py-6 border-t border-border text-left">
            <div className="md:col-span-1 flex items-center md:items-start gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono">
              <span>Furniture</span>
              <div className="hidden md:block h-[1px] flex-1 bg-border mt-2"></div>
            </div>
            <div className="md:col-span-3 flex flex-col gap-8">
              <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">
                    Engineered Wood Office Desk
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        href="https://amzn.in/d/0h3ilZMp"
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
                  120cm x 80cm
                </p>
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed mt-2">
                  This spacious engineered wood desk is the anchor of my
                  workspace. It offers ample surface area for my dual-screen
                  setup and accessories while maintaining a clean, minimalist
                  aesthetic.
                </p>
              </div>

              <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">
                    Green Soul Ergonomic Chair
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        href="https://www.greensoul.online/"
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
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed mt-2">
                  An incredibly comfortable and highly supportive ergonomic
                  chair where I spend most of my day sitting, learning, and
                  coding.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Accessories Category */}
        <ScrollReveal delay={0.25}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10 py-6 border-t border-border text-left">
            <div className="md:col-span-1 flex items-center md:items-start gap-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground font-mono">
              <span>Accessories</span>
              <div className="hidden md:block h-[1px] flex-1 bg-border mt-2"></div>
            </div>
            <div className="md:col-span-3 flex flex-col gap-8">
              <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">
                    Soundcore Anker H30i
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        href="https://www.soundcore.com/"
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
                <p className="text-muted-foreground font-satoshi text-sm md:text-base leading-relaxed mt-2">
                  Lightweight wireless headphones with long battery life,
                  perfect for block-out focus sessions.
                </p>
              </div>
              <div className="flex flex-col gap-1 group/title w-fit cursor-default">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-lg md:text-xl font-bold font-outfit text-foreground">
                    AKR 1740
                  </h4>
                  <Tooltip>
                    <TooltipTrigger>
                      <a
                        href="https://www.google.com/search?q=AKR+1740+Desk+Lamp"
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
                  Desk Lamp
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};
