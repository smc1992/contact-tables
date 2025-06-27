// Globale Typdeklarationen für die Contact Tables-Anwendung

// AdminSidebar
declare module '../../components/AdminSidebar' {
  import { FC } from 'react';
  
  interface AdminSidebarProps {
    activeItem?: string;
  }
  
  const AdminSidebar: FC<AdminSidebarProps>;
  export default AdminSidebar;
}

// dateUtils
declare module '../../utils/dateUtils' {
  export function formatDate(date: Date | string | null): string;
  export function formatDateTime(date: Date | string | null): string;
  export function isPast(date: Date | string): boolean;
  export function isFuture(date: Date | string): boolean;
  export function addDays(date: Date | string, days: number): Date;
  export function timeAgo(date: Date | string): string;
}

// emailService
declare module '../../../../utils/emailService' {
  interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }
  
  export function sendEmail(options: EmailOptions): Promise<boolean>;
}

// Auch für den relativen Pfad
declare module '../../utils/emailService' {
  interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }
  
  export function sendEmail(options: EmailOptions): Promise<boolean>;
}
