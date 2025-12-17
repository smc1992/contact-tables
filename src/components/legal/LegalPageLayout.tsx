import { ReactNode } from 'react';
import PageLayout from '@/components/PageLayout';

type LegalPageLayoutProps = {
  title: string;
  kicker?: string | null;
  description?: string;
  metaTitle?: string;
  children: ReactNode;
  maxWidthClassName?: string;
  contentClassName?: string;
};

export default function LegalPageLayout({
  title,
  kicker = 'Rechtliches',
  description,
  metaTitle,
  children,
  maxWidthClassName = 'max-w-4xl',
  contentClassName = 'space-y-12'
}: LegalPageLayoutProps) {
  return (
    <PageLayout title={metaTitle ?? `${title} | contact-tables`} className="bg-white">
      <div className="relative overflow-hidden">
        <div className="bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700">
          <div className="container mx-auto px-4 py-16 text-white">
            <div className="max-w-3xl">
              {kicker ? (
                <p className="uppercase tracking-wider text-primary-200 text-sm font-semibold mb-4">
                  {kicker}
                </p>
              ) : null}
              <h1 className="text-4xl md:text-5xl font-bold mb-6">{title}</h1>
              {description ? (
                <p className="text-lg text-primary-100 leading-relaxed">{description}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className={`${maxWidthClassName} mx-auto ${contentClassName}`}>
          {children}
        </div>
      </div>
    </PageLayout>
  );
}
