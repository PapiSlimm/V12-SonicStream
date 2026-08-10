import { Helmet } from 'react-helmet-async';

interface MetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'music.song' | 'music.album' | 'profile' | 'event';
  artist?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
}

export const Meta = ({ 
  title = 'The Future of Independent Media',
  description = 'Empowering independent creators with secure, low-latency streaming and white-label solutions.',
  image = 'https://sonicstream.com/og-image.jpg',
  url,
  type = 'website',
  artist,
  twitterCard = 'summary_large_image',
  noIndex = false
}: MetaProps) => {
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://sonicstream.com');
  const fullTitle = `${title} | SonicStream`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      <meta name="theme-color" content="#c81e3a" />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content="SonicStream" />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      
      {artist && (
        <>
          <meta property="music:musician" content={artist} />
          <meta property="og:audio:artist" content={artist} />
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content="@sonicstream" />
      <meta name="twitter:creator" content="@sonicstream" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />
    </Helmet>
  );
};

