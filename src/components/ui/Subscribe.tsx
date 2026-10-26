import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, Radio, Instagram, Loader2, AlertCircle } from 'lucide-react';
import { getVisitorId } from '../../lib/visitor';

interface SubscribeProps {
  postTitle?: string;
}

function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

const Subscribe: React.FC<SubscribeProps> = ({
  postTitle = 'Mastering Gradient Borders in CSS 🌈✨',
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Check if user is already marked as subscribed in localStorage
    const cachedSubscribed = typeof window !== 'undefined'
      ? localStorage.getItem('is_newsletter_subscribed')
      : null;

    if (cachedSubscribed === 'true') {
      setIsSubscribed(true);
      setStatus('success');
      setMessage("You're already subscribed to the newsletter!");
    }

    const visitorId = getVisitorId();
    if (!visitorId) return;

    fetch(`/api/subscribe?visitorId=${encodeURIComponent(visitorId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.subscribed) {
          setIsSubscribed(true);
          setStatus('success');
          setMessage("You're already subscribed to the newsletter!");
          try {
            localStorage.setItem('is_newsletter_subscribed', 'true');
          } catch {}
        } else {
          setIsSubscribed(false);
          setStatus('idle');
          try {
            localStorage.removeItem('is_newsletter_subscribed');
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('Unable to verify subscription:', err);
      });
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    setStatus('idle');
    setMessage('');

    // Localhost guard: do not send network POST on localhost to avoid populating live test data
    if (isLocalhost()) {
      setStatus('success');
      setMessage("You're already subscribed to the newsletter!");
      setIsSubscribed(true);
      try {
        localStorage.setItem('is_newsletter_subscribed', 'true');
      } catch {}
      setEmail('');
      setIsSubmitting(false);
      return;
    }

    try {
      const visitorId = getVisitorId();
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail, visitorId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe. Please try again.');
      }

      // Successful subscription (or already subscribed)
      setStatus('success');
      setMessage(data.message || "You're already subscribed to the newsletter!");
      setIsSubscribed(true);
      try {
        localStorage.setItem('is_newsletter_subscribed', 'true');
      } catch {}
      setEmail('');
    } catch (err: any) {
      console.error('Subscription error:', err);
      setStatus('error');
      setMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Truncate title for the notification preview card
  const displayTitle =
    postTitle.length > 32 ? postTitle.slice(0, 32) + '...' : postTitle;

  return (
    <div className="relative overflow-hidden w-full bg-card border border-border rounded-3xl py-6 px-6 sm:py-8 sm:px-8 md:py-8 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 shadow-xl transition-all duration-300">
      {/* Background Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute left-[5%] -top-[20%] w-[130px] h-[130px] border border-border/40 rounded-[30px] rotate-12"></div>
        <div className="absolute left-[20%] -bottom-[30%] w-[180px] h-[180px] border border-border/30 rounded-[40px] -rotate-12"></div>
        <div className="absolute right-[25%] -top-[40%] w-[220px] h-[220px] border border-border/30 rounded-[50px] rotate-45"></div>
        <div className="absolute right-[10%] -bottom-[20%] w-[150px] h-[150px] border border-border/40 rounded-[35px] -rotate-45"></div>
      </div>

      {/* Left/Bottom Column: Title, Subtitle, Form */}
      <div className="flex flex-col items-start w-full md:max-w-[58%] relative z-10 order-2 md:order-1">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-hanken">
          Enjoying this post?
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base mt-2 max-w-md font-poppins leading-relaxed font-light">
          Get my latest articles and web dev insights directly in your inbox.
        </p>

        <div className="mt-5 w-full max-w-md">
          <AnimatePresence mode="wait">
            {isSubscribed ? (
              <motion.div
                key="subscribed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 px-4 py-3 bg-[#00DC82]/10 border border-[#00DC82]/30 text-foreground rounded-2xl text-sm font-medium w-full"
              >
                <div className="w-6 h-6 rounded-full bg-[#00DC82]/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#00DC82]" />
                </div>
                <span className="font-outfit text-sm">
                  {message || "You're already subscribed to the newsletter!"}
                </span>
              </motion.div>
            ) : (
              <motion.form
                key="subscribe-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubscribe}
                className="w-full flex flex-col gap-2.5"
              >
                {/* Input & Submit Row */}
                <div className="flex items-center gap-2 w-full bg-card border border-border rounded-2xl p-1.5 focus-within:border-[#00DC82] focus-within:ring-1 focus-within:ring-[#00DC82]/30 transition-all duration-200">
                  <div className="pl-3 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="Enter your email address..."
                    required
                    disabled={isSubmitting}
                    aria-label="Email address for newsletter"
                    className="flex-1 bg-transparent px-2 py-2 text-foreground placeholder-muted-foreground focus:outline-none text-sm w-full font-hanken"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting || !email.trim()}
                    title="Subscribe"
                    className="flex items-center justify-center h-9 px-4 bg-primary text-primary-foreground rounded-xl active:scale-95 transition-all font-outfit text-xs font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm flex-shrink-0"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span>Subscribe</span>
                        <svg
                          className="w-3 h-3 group-hover:translate-x-0.5 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>

                {/* Error / Feedback Message */}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-xs text-red-500 font-hanken pl-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{message}</span>
                  </motion.div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right/Top Column: Stacked Notification Cards */}
      <div className="relative w-full md:w-[320px] h-[110px] md:h-[160px] select-none flex justify-center md:justify-end z-10 order-1 md:order-2 mb-0">
        <div className="relative w-[240px] sm:w-[270px] h-[140px]">
          {/* Card 3 (Bottom Card) */}
          <div
            className="absolute top-[40px] left-[20px] right-[-20px] sm:top-[48px] sm:left-[24px] sm:right-[-24px] bg-gradient-to-br from-[#C8C8C8] to-[#B3B3B3] text-neutral-900 p-4 rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-0 flex items-center gap-3 origin-center"
            style={{ transform: 'rotate(5deg) scale(0.88)' }}
          >
            <div className="w-10 h-10 bg-[#0F0F10] rounded-xl flex items-center justify-center flex-shrink-0 text-white">
              <Instagram className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-neutral-900 truncate">and many more!</div>
                <span className="text-[8px] text-neutral-500 font-medium ml-1 flex-shrink-0">1d ago</span>
              </div>
            </div>
          </div>

          {/* Card 2 (Middle Card) */}
          <div
            className="absolute top-[20px] left-[10px] right-[-10px] sm:top-[24px] sm:left-[12px] sm:right-[-12px] bg-gradient-to-br from-[#E3E3E3] to-[#CFCFCF] text-neutral-900 p-4 rounded-[24px] shadow-[0_10px_28px_rgba(0,0,0,0.18)] z-10 flex items-center gap-3 origin-center"
            style={{ transform: 'rotate(2deg) scale(0.94)' }}
          >
            <div className="w-10 h-10 bg-[#0F0F10] rounded-xl flex items-center justify-center flex-shrink-0 text-white">
              <Radio className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-neutral-900 truncate">A talk is happening</div>
                <span className="text-[8px] text-neutral-500 font-medium ml-1 flex-shrink-0">2h ago</span>
              </div>
              <div className="text-[10px] text-neutral-700 truncate mt-0.5 font-light">
                Sharing My 2023 Retrospective
              </div>
            </div>
          </div>

          {/* Card 1 (Top Card) */}
          <div
            className="absolute top-0 right-0 left-0 bg-gradient-to-br from-[#FFFFFF] to-[#EBEBEB] text-neutral-900 p-4 rounded-[24px] shadow-[0_12px_36px_rgba(0,0,0,0.25)] z-20 flex items-center gap-3 origin-center"
            style={{ transform: 'rotate(-1deg) scale(1)' }}
          >
            <div className="w-10 h-10 bg-[#0F0F10] rounded-xl flex items-center justify-center flex-shrink-0 text-white">
              <Mail className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold text-neutral-900 truncate">New Blog Post 🙄</div>
                <span className="text-[8px] text-neutral-500 font-medium ml-1 flex-shrink-0">20m ago</span>
              </div>
              <div className="text-[10px] text-neutral-700 truncate mt-0.5 font-light">{displayTitle}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
