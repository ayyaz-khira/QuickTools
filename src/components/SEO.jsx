import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://quicktools.vercel.app';
const DEFAULT_IMAGE = `${BASE_URL}/favicon.png`;
const SITE_NAME = 'QuickTools';

export default function SEO({ title, description }) {
  const location = useLocation();
  const canonicalUrl = `${BASE_URL}${location.pathname}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        'name': SITE_NAME,
        'url': BASE_URL,
        'description': 'QuickTools delivers local-first image utilities for passport photo creation, image resizing, and signature cropping without uploads or backend storage.',
        'publisher': {
          '@type': 'Organization',
          'name': SITE_NAME
        }
      },
      {
        '@type': 'WebApplication',
        'name': SITE_NAME,
        'url': BASE_URL,
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web Browser',
        'browserRequirements': 'Runs in modern browsers with no downloads.',
        'description': description,
        'softwareVersion': '1.0.0'
      }
    ]
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="QuickTools, local-first, image utilities, privacy-focused, passport photo, image resize, signature cropper" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta property="og:image:alt" content={`${SITE_NAME} logo`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
      <meta name="twitter:site" content="@QuickTools" />

      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
}
