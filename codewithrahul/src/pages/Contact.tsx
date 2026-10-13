import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { SectionButton } from '../components/ui/SectionButton';
import ScrollReveal from '../components/ui/ScrollReveal';
import { CONTACT_EMAIL, ContactSubmissionError, sendContactMessage } from '../lib/contact';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const submissionInProgress = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submissionInProgress.current) return;

    submissionInProgress.current = true;
    setLoading(true);
    setSent(false);
    setStatus(null);

    try {
      await sendContactMessage(formData);
      setStatus('Message sent successfully!');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSent(true);
    } catch (error) {
      console.error('Contact form submission failed:', error);
      setStatus(
        error instanceof ContactSubmissionError
          ? error.message
          : 'We could not send your message. Please try again later.'
      );
    } finally {
      submissionInProgress.current = false;
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="pt-20 md:pt-28 min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="pb-6 mb-4">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto w-full px-6 text-center">
            <h1 className="text-4xl md:text-4xl font-bold mb-6 font-bricolage">
              <span className="text-foreground font-bricolage">
                Let's Work Together
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-sm">
              Have an interesting idea or a project in mind ! Drop a message and let's build something extraordinary together.
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Contact Content */}
      <section className="pb-16">
        <div className="max-w-3xl mx-auto w-full px-6">
          {/* Contact Form */}
          <ScrollReveal delay={0.2}>
            <div className="border-border bg-card border backdrop-blur-sm rounded-2xl p-8 shadow-lg">
              <h2 className="text-3xl font-bold font-bricolage text-foreground mb-6 text-center">
                Send Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium font-poppins text-muted-foreground mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    autoComplete="name"
                    className="w-full px-4 py-3 border-input bg-card border rounded-lg text-foreground font-poppins placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 focus:border-foreground/30 transition-colors"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium font-poppins text-muted-foreground mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    maxLength={254}
                    autoComplete="email"
                    className="w-full px-4 py-3 border-input bg-card border rounded-lg text-foreground font-poppins placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 focus:border-foreground/30 transition-colors"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium font-poppins text-muted-foreground mb-2"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    maxLength={200}
                    className="w-full px-4 py-3 font-poppins border-input bg-card border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 focus:border-foreground/30 transition-colors"
                    placeholder="Project Discussion"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium font-poppins text-muted-foreground mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    maxLength={5000}
                    rows={5}
                    className="w-full px-4 py-3 font-poppins border-input bg-card border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 focus:border-foreground/30 transition-colors resize-none"
                    placeholder="Tell me about your project..."
                  />
                </div>

                <div className="flex justify-center">
                  <SectionButton
                    type="submit"
                    disabled={loading || sent}
                    className=""
                    text={loading ? 'Sending...' : sent ? 'Message Sent' : 'Send Message'}
                    icon={loading ? (
                      <svg
                        className="animate-spin h-5 w-5 text-foreground"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 00-8 8h4z"
                        ></path>
                      </svg>
                    ) : sent ? null : <Send className="w-5 h-5" />}
                  />
                </div>
              </form>

              {/* Status Message */}
              {status && (
                <p
                  role={sent ? 'status' : 'alert'}
                  className={`mt-4 text-center text-sm ${sent ? 'text-muted-foreground' : 'text-destructive'}`}
                >
                  {status}
                </p>
              )}

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Prefer email?{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-foreground underline underline-offset-4 hover:opacity-80"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Contact;
