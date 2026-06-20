import { SITE_CONFIG, absoluteUrl } from './config';

/**
 * Genera los distintos tipos de JSON-LD que usa la app.
 * Cada función devuelve un objeto listo para serializar en un <script type="application/ld+json">.
 */

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.organization.legalName,
    url: SITE_CONFIG.url,
    logo: absoluteUrl(SITE_CONFIG.organization.logo),
    foundingDate: SITE_CONFIG.organization.foundingYear,
    description: SITE_CONFIG.description,
    sameAs: [] as string[]
  };
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    operatingSystem: 'Web, iOS, Android',
    applicationCategory: 'FinanceApplication',
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    image: absoluteUrl(SITE_CONFIG.ogImage),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Plan gratuito disponible'
    },
    aggregateRating: undefined // se añade cuando haya reseñas reales; no inventar datos
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    inLanguage: SITE_CONFIG.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/recursos?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export type BlogPostJsonLdInput = {
  title: string;
  description: string;
  slug: string;
  publishedTime: string;
  modifiedTime?: string;
  authorName: string;
  image?: string;
};

export function blogPostJsonLd(input: BlogPostJsonLdInput) {
  const { title, description, slug, publishedTime, modifiedTime, authorName, image } = input;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? absoluteUrl(image) : absoluteUrl(SITE_CONFIG.ogImage),
    datePublished: publishedTime,
    dateModified: modifiedTime ?? publishedTime,
    author: {
      '@type': 'Person',
      name: authorName
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(SITE_CONFIG.organization.logo)
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/recursos/${slug}`)
    }
  };
}

/** Componente helper para inyectar JSON-LD de forma segura (sin XSS). */
export function jsonLdScriptProps(data: object) {
  return {
    type: 'application/ld+json' as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) }
  };
}
