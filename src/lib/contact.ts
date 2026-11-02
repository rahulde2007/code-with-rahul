export const CONTACT_EMAIL = 'rahulde937@gmail.com';

export interface ContactMessage {
  name: string;
  email: string;
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
  message: ContactMessage
): Promise<void> => {
  const name = message.name.trim();
  const email = message.email.trim();
  const body = message.message.trim();
  if (!name || !email || !body) {
    throw new ContactSubmissionError('Please complete all fields before sending.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ContactSubmissionError('Please enter a valid email address.');
  }
  if (name.length > 100 || email.length > 254 || body.length > 2000) {
    throw new ContactSubmissionError('One or more fields exceed the allowed length.');
  }

  let response: Response;
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        message: body,
        _gotcha: message._gotcha,
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
