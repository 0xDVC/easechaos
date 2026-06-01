import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
}

const SITE_NAME = "EaseCHAOS";
const DEFAULT_DESCRIPTION =
  "Simplified academic schedules for UMaT students with intuitive viewing, exam schedules, and mobile-friendly design.";
const DEFAULT_IMAGE = "https://easechaos.xyz/assets/easechaos.png";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMAGE,
  ogUrl,
}: SEOProps) {
  const pageTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · UMaT Timetable Viewer`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={ogTitle ?? pageTitle} />
      <meta property="og:description" content={ogDescription ?? description} />
      <meta property="og:image" content={ogImage} />
      {ogUrl && <meta property="og:url" content={ogUrl} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle ?? pageTitle} />
      <meta name="twitter:description" content={ogDescription ?? description} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: SITE_NAME,
          description: DEFAULT_DESCRIPTION,
          url: "https://easechaos.xyz",
          applicationCategory: "Educational Application",
          operatingSystem: "All",
          offers: { "@type": "Offer", price: "0" },
        })}
      </script>
    </Helmet>
  );
}
