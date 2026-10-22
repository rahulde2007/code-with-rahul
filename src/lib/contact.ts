export const CONTACT_EMAIL = 'rahulde937@gmail.com';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  _gotcha?: string;
}

export class ContactSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContactSubmissionError';
  }
}

export const sendContactMessage = async (
  message: ContactMessage,
  configuredFormId = import.meta.env.VITE_FORMSPREE_FORM_ID
): Promise<void> => {
  // If honeypot is populated, silently discard the submission without notifying the bot
  if (message._gotcha && message._gotcha.trim().length > 0) {
    return;
  }

  const formId = configuredFormId?.trim();
  if (!formId || formId === 'your_formspree_form_id_here') {
    throw new ContactSubmissionError(
      `Email delivery is not configured yet. Please email ${CONTACT_EMAIL} directly.`
    );
  }

  const name = message.name.trim();
  const email = message.email.trim();
  const subject = message.subject.trim();
  const body = message.message.trim();
  if (!name || !email || !subject || !body) {
    throw new ContactSubmissionError('Please complete all fields before sending.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ContactSubmissionError('Please enter a valid email address.');
  }
  if (name.length > 100 || email.length > 254 || subject.length > 200 || body.length > 5000) {
    throw new ContactSubmissionError('One or more fields exceed the allowed length.');
  }

  let response: Response;
  try {
    response = await fetch(`https://formspree.io/f/${encodeURIComponent(formId)}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        subject,
        _replyto: email,
        _subject: subject,
        message: body,
      }),
    });
  } catch {
    throw new ContactSubmissionError(
      'Could not connect to the email service. Please check your connection and try again.'
    );
  }

  if (!response.ok) {
    throw new ContactSubmissionError(
      'The email service could not accept your message. Please try again later.'
    );
  }
};
