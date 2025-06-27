// Typ-Deklarationen für Module mit verschiedenen relativen Pfaden

// AdminSidebar-Deklarationen für verschiedene Pfade
declare module '../../components/AdminSidebar' {
  import { FC } from 'react';
  
  interface AdminSidebarProps {
    activeItem?: string;
  }
  
  const AdminSidebar: FC<AdminSidebarProps>;
  export default AdminSidebar;
}

declare module '../components/AdminSidebar' {
  import { FC } from 'react';
  
  interface AdminSidebarProps {
    activeItem?: string;
  }
  
  const AdminSidebar: FC<AdminSidebarProps>;
  export default AdminSidebar;
}

// dateUtils-Deklarationen für verschiedene Pfade
declare module '../../utils/dateUtils' {
  export function formatDate(date: Date | string | null): string;
  export function formatDateTime(date: Date | string | null): string;
  export function daysBetween(date1: Date | string, date2?: Date | string): number;
  export function isPast(date: Date | string): boolean;
  export function isFuture(date: Date | string): boolean;
  export function addDays(date: Date | string, days: number): Date;
  export function timeAgo(date: Date | string): string;
}

declare module '../utils/dateUtils' {
  export function formatDate(date: Date | string | null): string;
  export function formatDateTime(date: Date | string | null): string;
  export function daysBetween(date1: Date | string, date2?: Date | string): number;
  export function isPast(date: Date | string): boolean;
  export function isFuture(date: Date | string): boolean;
  export function addDays(date: Date | string, days: number): Date;
  export function timeAgo(date: Date | string): string;
}

// emailService-Deklarationen für verschiedene Pfade
declare module '../../../../utils/emailService' {
  interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }
  
  export function sendEmail(options: EmailOptions): Promise<boolean>;
}

declare module '../../../utils/emailService' {
  interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }
  
  export function sendEmail(options: EmailOptions): Promise<boolean>;
}

declare module '../../utils/emailService' {
  interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }
  
  export function sendEmail(options: EmailOptions): Promise<boolean>;
}

declare module '../utils/emailService' {
  interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }
  
  export function sendEmail(options: EmailOptions): Promise<boolean>;
}
