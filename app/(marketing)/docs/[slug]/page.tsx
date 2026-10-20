import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDocFeatureBySlug, getAllDocFeatures } from "@/lib/docs-data";
import { DocArticleView } from "@/components/marketing/doc-article-view";
import { DocArticleStructuredData } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const features = getAllDocFeatures();
  return features.map((f) => ({
    slug: f.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const feature = getDocFeatureBySlug(slug);

  if (!feature) {
    return {
      title: "Document Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `${feature.title} — Documentation`;
  const description = feature.subtitle || feature.description?.slice(0, 160);

  return {
    title,
    description,
    alternates: {
      canonical: `/docs/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/docs/${slug}`,
      type: "article",
      images: [
        feature.image
          ? {
              url: feature.image,
              width: 1200,
              height: 630,
              alt: feature.title,
            }
          : {
              url: `/api/og?title=${encodeURIComponent(feature.title)}&desc=${encodeURIComponent(description)}`,
              width: 1200,
              height: 630,
              alt: feature.title,
            },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        feature.image ||
          `/api/og?title=${encodeURIComponent(feature.title)}`,
      ],
    },
  };
}

export default async function DocFeaturePage({ params }: Props) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;
  const feature = getDocFeatureBySlug(slug);

  if (!feature) {
    notFound();
  }

  const allFeatures = getAllDocFeatures();
  const currentIndex = allFeatures.findIndex((f) => f.slug === feature.slug);
  const prevFeature = currentIndex > 0 ? allFeatures[currentIndex - 1] : null;
  const nextFeature = currentIndex < allFeatures.length - 1 ? allFeatures[currentIndex + 1] : null;

  const relatedFeatures = allFeatures
    .filter((f) => f.slug !== feature.slug)
    .slice(0, 2);

  return (
    <>
      <DocArticleStructuredData
        title={feature.title}
        subtitle={feature.subtitle}
        slug={feature.slug}
        image={feature.image}
      />
      <DocArticleView
        feature={feature}
        relatedFeatures={relatedFeatures}
        prevFeature={prevFeature}
        nextFeature={nextFeature}
      />
    </>
  );
}
