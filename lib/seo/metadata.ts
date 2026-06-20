import type { Metadata } from 'next';
import { SITE_CONFIG, absoluteUrl } from './config';

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noIndex?: boolean;
  keywords?: string[];
};

/**
 * Genera metadata completa (title, description, OG, Twitter, canonical) para una página.
 * Uso: export const metadata = buildPageMetadata({ title: '...', description: '...', path: '/ruta' })
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    image = SITE_CONFIG.ogImage,
    imageAlt = SITE_CONFIG.ogImageAlt,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
    noIndex = false,
    keywords
  } = input;

  const url = absoluteUrl(path);
  const fullTitle = path === '/' ? title : `${title} | ${SITE_CONFIG.name}`;
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords ?? [...SITE_CONFIG.keywords],
    alternates: {
      canonical: url
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt
        }
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors
      })
    },
    twitter: {
      card: SITE_CONFIG.social.twitterCardType,
      title: fullTitle,
      description,
      images: [imageUrl],
      site: SITE_CONFIG.social.twitter,
      creator: SITE_CONFIG.social.twitter
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1
          }
        }
  };

  return metadata;
}
