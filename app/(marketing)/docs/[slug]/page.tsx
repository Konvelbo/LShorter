import React from "react";
import { notFound } from "next/navigation";
import { getDocFeatureBySlug, getAllDocFeatures } from "@/lib/docs-data";
import { DocArticleView } from "@/components/marketing/doc-article-view";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const features = getAllDocFeatures();
  return features.map((f) => ({
    slug: f.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const feature = getDocFeatureBySlug(slug);

  if (!feature) {
    return {
      title: "Ressource non trouvée | LShorter",
    };
  }

  return {
    title: `${feature.title} — Documentation | LShorter`,
    description: feature.subtitle,
  };
}

export default async function DocFeaturePage({ params }: Props) {
  const { slug } = await params;
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
    <DocArticleView
      feature={feature}
      relatedFeatures={relatedFeatures}
      prevFeature={prevFeature}
      nextFeature={nextFeature}
    />
  );
}
