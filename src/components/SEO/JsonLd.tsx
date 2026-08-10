import { Helmet } from 'react-helmet-async';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd = ({ data }: JsonLdProps) => {
  // Use a custom stringifier to handle safe JSON-LD injection and formatting
  const safeJsonLd = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  
  return (
    <Helmet>
      <script type="application/ld+json">
        {safeJsonLd}
      </script>
    </Helmet>
  );
};

interface BaseSchemaProps {
  name: string;
  description?: string;
  image?: string;
  url: string;
}

interface MusicGroupProps extends BaseSchemaProps {
  genre?: string;
  location?: string;
}

export const MusicGroupSchema = ({ name, description, image, url, genre, location }: MusicGroupProps) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': url,
    name,
    description,
    image,
    url,
    genre,
    ...(location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: location
      }
    })
  }} />
);

interface MusicRecordingProps extends BaseSchemaProps {
  duration?: string;
  datePublished?: string;
  artistName: string;
  albumName?: string;
}

export const MusicRecordingSchema = ({ name, url, duration, datePublished, artistName, albumName, image }: MusicRecordingProps) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'MusicRecording',
    '@id': url,
    name,
    url,
    duration,
    datePublished,
    image,
    byArtist: {
      '@type': 'MusicGroup',
      name: artistName,
      '@id': `${url}#artist`
    },
    ...(albumName && {
      inAlbum: {
        '@type': 'MusicAlbum',
        name: albumName,
        '@id': `${url}#album`
      }
    })
  }} />
);

interface EventProps extends BaseSchemaProps {
  startDate: string;
  locationName: string;
  locationAddress: string;
  offers?: {
    url: string;
    price: number;
    currency?: string;
    validFrom?: string;
    priceValidUntil?: string;
  };
}

export const EventSchema = ({ name, startDate, locationName, locationAddress, description, image, url, offers }: EventProps) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': url,
    name,
    startDate,
    location: {
      '@type': 'Place',
      name: locationName,
      address: {
        '@type': 'PostalAddress',
        streetAddress: locationAddress,
        addressLocality: locationName // Simplified, ideally passed from props
      }
    },
    description,
    image,
    url,
    ...(offers && {
      offers: {
        '@type': 'Offer',
        url: offers.url,
        price: offers.price,
        priceCurrency: offers.currency || 'USD',
        availability: 'https://schema.org/InStock',
        validFrom: offers.validFrom,
        priceValidUntil: offers.priceValidUntil
      }
    })
  }} />
);

interface ProductProps extends BaseSchemaProps {
  sku?: string;
  brand: string;
  price: number;
  currency?: string;
  priceValidUntil?: string;
}

export const ProductSchema = ({ name, image, description, sku, brand, price, currency = 'USD', url, priceValidUntil }: ProductProps) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': url,
    name,
    image,
    description,
    sku,
    brand: {
      '@type': 'Brand',
      name: brand
    },
    offers: {
      '@type': 'Offer',
      url,
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      priceValidUntil
    }
  }} />
);

interface MusicAlbumProps extends BaseSchemaProps {
  artistName: string;
  genre?: string;
  datePublished?: string;
  numTracks?: number;
}

export const MusicAlbumSchema = ({ name, artistName, url, image, genre, datePublished, numTracks }: MusicAlbumProps) => (
  <JsonLd data={{
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    '@id': url,
    name,
    byArtist: {
      '@type': 'MusicGroup',
      name: artistName,
      '@id': `${url}#artist`
    },
    url,
    image,
    genre,
    datePublished,
    numTracks
  }} />
);

