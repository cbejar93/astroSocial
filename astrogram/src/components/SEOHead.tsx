import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
}

const SITE_NAME = 'AstroLounge';
const PROD_URL = 'https://astrosocial.fly.dev';
const DEFAULT_IMAGE = `${PROD_URL}/logo.png`;
const DEFAULT_DESC =
  'Share and discover cosmic photography and musings on AstroLounge.';

export function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedAt,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = (description ?? DEFAULT_DESC).slice(0, 160);
  const img = image ?? DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {url ? <link rel="canonical" href={url} /> : null}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      {url ? <meta property="og:url" content={url} /> : null}
      <meta property="og:type" content={type} />
      {publishedAt ? (
        <meta property="article:published_time" content={publishedAt} />
      ) : null}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
