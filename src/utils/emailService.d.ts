export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: any;
    contentType?: string;
  }>;
}

export function sendEmail(options: EmailOptions): Promise<boolean>;
