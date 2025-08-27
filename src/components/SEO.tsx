import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export default function SEO({
  title = 'Contact Tables - Gemeinsam statt einsam essen',
  description = 'Finde Gesellschaft beim Essen in teilnehmenden Restaurants. Verbinde dich mit neuen Menschen und genieße inspirierende Gespräche.',
  image = '/images/og-image.jpg',
  url = 'https://contact-tables.org',
  type = 'website',
}: SEOProps) {
  const siteTitle = title.includes('Contact Tables') ? title : `${title} | Contact Tables`;
  
  return (
    <Head>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      
      {/* OpenGraph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`https://contact-tables.org${image}`} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`https://contact-tables.org${image}`} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
