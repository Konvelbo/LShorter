"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DocFeature } from "@/lib/docs-data";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface DocArticleViewProps {
  feature: DocFeature;
  relatedFeatures: DocFeature[];
  prevFeature?: DocFeature | null;
  nextFeature?: DocFeature | null;
}

export function DocArticleView({
  feature,
  relatedFeatures,
  prevFeature,
  nextFeature,
}: DocArticleViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    // 1. Header entrance
    const headerEl = document.querySelector(".doc-article-header");
    if (headerEl) {
      gsap.fromTo(
        headerEl,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
        }
      );
    }

    // 2. Sections staggered animation on scroll
    const sections = document.querySelectorAll(".doc-article-section");
    sections.forEach((sec) => {
      gsap.fromTo(
        sec,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 90%",
            once: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [feature.slug]);

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen pt-24 pb-20 px-4 sm:px-6 md:px-8 bg-[#FAF7F2] dark:bg-[#09090b] transition-colors duration-300"
    >
      {/* Top Editorial Header (Spacious max-w-5xl) */}
      <header className="doc-article-header max-w-5xl mx-auto pt-4 pb-8 sm:pb-12">
        {/* Back Link */}
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>All guides &amp; documentation</span>
        </Link>

        {/* Big Authoritative Sans-Serif H1 */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#2B2520] dark:text-neutral-100 leading-[1.15]">
          {feature.title}
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-xl text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed max-w-3xl">
          {feature.subtitle}
        </p>

        {/* Read Time Info & Edge Badge */}
        <div className="mt-4 flex items-center gap-3 text-xs font-mono text-neutral-500">
          <span>{feature.readTime}</span>
          <span>•</span>
          <span className="text-[#0080ff] sm:text-[#ff6600] font-semibold">Official Edge Documentation</span>
        </div>

        {/* Wide 16:9 Hero Image */}
        <div className="mt-8 relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#E7DFD5] dark:border-white/10 shadow-[0_12px_40px_rgba(43,37,32,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] bg-neutral-100 dark:bg-neutral-900">
          <Image
            src={feature.image}
            alt={feature.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>
      </header>

      {/* Main Reading Area */}
      <main className="max-w-5xl mx-auto text-[#2B2520] dark:text-neutral-200 space-y-12 sm:space-y-16">
        
        {/* 1. Overview Section */}
        <section className="doc-article-section space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B2520] dark:text-white">
            Overview &amp; Architecture
          </h2>
          <div className="space-y-3">
            {feature.overview.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-base sm:text-[17px] leading-relaxed text-neutral-700 dark:text-neutral-300"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        {/* 2. Key Points — Arranged in a Clean Horizontal Row */}
        {feature.keyPoints.length > 0 && (
          <section className="doc-article-section space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B2520] dark:text-white">
                Key Principles
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Core architectural pillars ensuring high performance, isolation, and security.
              </p>
            </div>

            {/* HORIZONTAL CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
              {feature.keyPoints.map((point, idx) => (
                <Card
                  key={idx}
                  className="doc-interactive-card doc-keypoint-card p-5 flex flex-col justify-between h-full rounded-xl border border-[#E7DFD5] dark:border-white/10 bg-[#FFFDF9] dark:bg-[#121214] shadow-xs"
                >
                  <div className="space-y-2.5">
                    <CardHeader className="p-0 pb-1">
                      <CardTitle className="text-base font-bold text-[#2B2520] dark:text-white flex items-center gap-2">
                        <span className="keypoint-number-badge w-6 h-6 rounded-md bg-[#0080ff]/10 sm:bg-[#ff6600]/10 flex items-center justify-center text-[#0080ff] sm:text-[#ff6600] shrink-0 font-bold text-xs font-mono">
                          0{idx + 1}
                        </span>
                        <span className="leading-snug">{point.title}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CardDescription className="text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                        {point.description}
                      </CardDescription>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 3. Code Snippets Section */}
        <section className="doc-article-section space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B2520] dark:text-white">
              Implementation &amp; Code
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Ready-to-use API code snippets and configuration examples for your integrations.
            </p>
          </div>

          <div className="space-y-6">
            {feature.codeSnippets.map((cs, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-lg font-semibold text-[#2B2520] dark:text-neutral-100">
                  {cs.title}
                </h3>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {cs.description}
                </p>
                <CodeBlock
                  language={cs.snippet.language}
                  filename={cs.snippet.filename}
                  code={cs.snippet.code}
                  tabs={cs.snippet.tabs}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 4. Response Sample Section (if available) */}
        {feature.responseSample && (
          <section className="doc-article-section space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B2520] dark:text-white">
              {feature.responseSample.title}
            </h2>
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {feature.responseSample.description}
            </p>
            <CodeBlock
              language="json"
              filename="response.json"
              code={feature.responseSample.json}
            />
          </section>
        )}

        {/* 5. Best Practices */}
        {feature.bestPractices.length > 0 && (
          <section className="doc-article-section space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2B2520] dark:text-white">
                Recommended Best Practices
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Expert tips to maximize performance, resilience, and link security.
              </p>
            </div>

            {/* HORIZONTAL CARDS GRID FOR BEST PRACTICES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
              {feature.bestPractices.map((bp, idx) => (
                <Card
                  key={idx}
                  className="doc-interactive-card doc-practice-card p-5 flex flex-col justify-between h-full rounded-xl border border-[#E7DFD5] dark:border-white/10 bg-[#FFFDF9] dark:bg-[#121214] shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs font-mono uppercase tracking-wider">
                      <CheckCircle2 className="practice-icon w-4 h-4 shrink-0" />
                      <span>Recommendation 0{idx + 1}</span>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {bp}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 6. Previous & Next Article Navigation Cards */}
        {(prevFeature || nextFeature) && (
          <section className="doc-article-section pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
              {prevFeature ? (
                <Link
                  href={`/docs/${prevFeature.slug}`}
                  className="doc-interactive-card doc-nav-card group block p-4 rounded-xl border border-[#E7DFD5] dark:border-white/10 bg-[#FFFDF9] dark:bg-[#121214] cursor-pointer shadow-xs"
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mb-1">
                    <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    <span>Previous guide</span>
                  </span>
                  <span className="text-sm font-bold text-[#2B2520] dark:text-white group-hover:text-[#0080ff] sm:group-hover:text-[#ff6600] transition-colors block truncate">
                    {prevFeature.title}
                  </span>
                </Link>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextFeature && (
                <Link
                  href={`/docs/${nextFeature.slug}`}
                  className="doc-interactive-card doc-nav-card group block p-4 rounded-xl border border-[#E7DFD5] dark:border-white/10 bg-[#FFFDF9] dark:bg-[#121214] cursor-pointer shadow-xs sm:text-right"
                >
                  <span className="text-[10px] font-mono uppercase font-bold text-neutral-400 dark:text-neutral-500 flex items-center gap-1 sm:justify-end mb-1">
                    <span>Next guide</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-sm font-bold text-[#2B2520] dark:text-white group-hover:text-[#0080ff] sm:group-hover:text-[#ff6600] transition-colors block truncate">
                    {nextFeature.title}
                  </span>
                </Link>
              )}
            </div>
          </section>
        )}

        <Separator />

        {/* 7. Related Resources / Guides */}
        {relatedFeatures.length > 0 && (
          <section className="doc-article-section pt-2 space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2B2520] dark:text-white">
              Related Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedFeatures.map((rf) => (
                <Link
                  key={rf.slug}
                  href={`/docs/${rf.slug}`}
                  className="group block cursor-pointer"
                >
                  <Card className="doc-interactive-card doc-related-card overflow-hidden p-4 border-[#E7DFD5] dark:border-white/10 bg-[#FFFDF9] dark:bg-[#121214] shadow-xs">
                    <div className="related-img-container relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-neutral-100 dark:bg-neutral-900 border border-[#E7DFD5] dark:border-white/5">
                      <Image
                        src={rf.image}
                        alt={rf.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 500px"
                      />
                    </div>
                    <CardHeader className="p-0 pb-1.5">
                      <CardTitle className="text-base font-bold text-[#2B2520] dark:text-white group-hover:text-[#0080ff] sm:group-hover:text-[#ff6600] transition-colors">
                        {rf.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CardDescription className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {rf.subtitle}
                      </CardDescription>
                    </CardContent>
                    <CardFooter className="p-0 pt-3 flex items-center justify-between text-xs font-semibold text-[#0080ff] sm:text-[#ff6600]">
                      <span className="inline-flex items-center gap-1 group-hover:underline">
                        <span>Read guide</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
