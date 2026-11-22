"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface HeroAction {
  label: string;
  /** Renders a link when provided, otherwise a button. */
  href?: string;
  onClick?: () => void;
}

export interface CodeTab {
  /** Text on the tab, e.g. "cURL". */
  label: string;
  /** Drives the syntax colours: bash, curl, typescript, javascript, python, json... */
  language: string;
  code: string;
}

export interface SplitDeveloperHighlight {
  title: string;
  desc: string;
}

export interface SplitDeveloperHeroProps {
  id?: string;
  /** Small status pill above the headline. */
  badge?: string;
  title: React.ReactNode;
  description: string;
  highlights?: SplitDeveloperHighlight[];
  primaryAction: HeroAction;
  secondaryAction?: HeroAction;
  codeTabs: CodeTab[];
  terminalFooter?: {
    status: string;
    endpoint: string;
  };
  headingAs?: "h1" | "h2";
  className?: string;
}

/* ------------------------------------------------------------------ */
/* Tiny syntax highlighter (no library needed)                         */
/* ------------------------------------------------------------------ */

type TokenType =
  | "jsonKey"
  | "string"
  | "comment"
  | "keyword"
  | "number"
  | "function"
  | "flag";

const TOKEN_CLASS: Record<TokenType, string> = {
  jsonKey: "text-[#0066FF] dark:text-[#7AB3FF]",
  string: "text-emerald-600 dark:text-emerald-400",
  comment: "italic text-[#71717A] dark:text-zinc-500",
  keyword: "text-[#0066FF] dark:text-[#60A5FA] font-medium",
  number: "text-amber-600 dark:text-amber-400",
  function: "text-sky-600 dark:text-sky-400",
  flag: "text-sky-600 dark:text-sky-400",
};

const KEYWORDS =
  "const|let|var|await|async|import|from|export|default|function|return|new|class|if|else|for|of|in|as|def|print|with|try|except|raise|lambda|yield|True|False|None|true|false|null|undefined|curl";

const TOKEN_ORDER: TokenType[] = [
  "jsonKey",
  "string",
  "comment",
  "keyword",
  "number",
  "function",
  "flag",
];

// One regular expression per language family: strings first, so a // inside a URL is never read as a comment
function buildPattern(language: string) {
  const shell = /^(bash|shell|sh|curl|zsh)$/i.test(language);
  const hashComments = shell || /^(python|py|ruby|yaml|yml)$/i.test(language);
  return new RegExp(
    [
      '("(?:[^"\\\\]|\\\\.)*"(?=\\s*:))', // 1 json/object keys
      '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)', // 2 strings
      hashComments ? "(#.*)" : "(\\/\\/.*)", // 3 comments
      `\\b(${KEYWORDS})\\b`, // 4 keywords
      "(\\b\\d+(?:\\.\\d+)?\\b)", // 5 numbers
      "(\\b[A-Za-z_]\\w*(?=\\())", // 6 function calls
      shell ? "((?<=\\s)--?[A-Za-z][\\w-]*)" : "(?!)", // 7 command line flags
    ].join("|"),
    "g",
  );
}

function highlight(line: string, language: string): React.ReactNode[] {
  const pattern = buildPattern(language);
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match[0] === "") {
      pattern.lastIndex++;
      continue;
    }
    if (match.index > last) out.push(line.slice(last, match.index));
    const groupIndex = match.findIndex((g, i) => i > 0 && g !== undefined);
    const type = TOKEN_ORDER[groupIndex - 1];
    out.push(
      <span key={match.index} className={TOKEN_CLASS[type]}>
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/* ------------------------------------------------------------------ */
/* Copy button with a self-drawing checkmark                           */
/* ------------------------------------------------------------------ */

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    setCopied(false);
    return () => window.clearTimeout(timer.current);
  }, [text]);

  const handleCopy = async () => {
    if (!(await copyToClipboard(text))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#E4E7EC] dark:border-white/12 bg-white/80 dark:bg-white/[0.05] px-2.5 text-xs font-medium text-[#52525B] dark:text-zinc-300 transition-colors hover:bg-[#F4F5F8] dark:hover:bg-white/[0.10] hover:text-[#09090B] dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] cursor-pointer"
    >
      <span className="relative size-4">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-4 transition-all duration-200 motion-reduce:transition-none",
            copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
          )}
        >
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 0 1 2-2h9" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-4 text-emerald-500 transition-all duration-200 motion-reduce:transition-none",
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        >
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            style={{
              strokeDasharray: 24,
              strokeDashoffset: copied ? 0 : 24,
              transition: "stroke-dashoffset 0.35s ease-out 0.05s",
            }}
          />
        </svg>
      </span>
      <span aria-live="polite" className="w-10 text-left">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Code window with tabs                                               */
/* ------------------------------------------------------------------ */

function CodeWindow({
  tabs,
  footer,
}: {
  tabs: CodeTab[];
  footer?: { status: string; endpoint: string };
}) {
  const baseId = React.useId();
  const [active, setActive] = React.useState(0);
  const [shown, setShown] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const fade = React.useRef<number | undefined>(undefined);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => () => window.clearTimeout(fade.current), []);

  const select = (index: number) => {
    if (index === active) return;
    setActive(index);
    setVisible(false);
    window.clearTimeout(fade.current);
    fade.current = window.setTimeout(() => {
      setShown(index);
      setVisible(true);
    }, 90);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const last = tabs.length - 1;
    const next =
      e.key === "ArrowRight"
        ? (active + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (active - 1 + tabs.length) % tabs.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  };

  const maxLines = React.useMemo(
    () =>
      Math.max(
        1,
        ...tabs.map((t) => t.code.replace(/\n$/, "").split("\n").length),
      ),
    [tabs],
  );

  const current = tabs[shown] ?? tabs[0];
  if (!current) return null;
  const lines = current.code.replace(/\n$/, "").split("\n");
  const fixedPanelHeight = maxLines * 24 + 48;

  return (
    <div className="min-w-0 overflow-hidden rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.10] bg-white dark:bg-[#0D0E14] text-[#09090B] dark:text-zinc-100 shadow-[0_18px_48px_-18px_rgba(16,24,40,0.14)] dark:shadow-[0_24px_60px_-18px_rgba(0,0,0,0.65)]">
      {/* Title bar: window dots, tabs and copy button */}
      <div className="flex items-center gap-3 border-b border-[#E4E7EC] dark:border-white/[0.08] bg-[#F8F9FB] dark:bg-[#13151D] px-4 py-2.5">
        <div className="hidden gap-1.5 sm:flex" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-[#D4D4D8] dark:bg-white/20" />
          <span className="size-2.5 rounded-full bg-[#D4D4D8] dark:bg-white/20" />
          <span className="size-2.5 rounded-full bg-[#D4D4D8] dark:bg-white/20" />
        </div>

        <div
          role="tablist"
          aria-label="Code examples"
          onKeyDown={handleKeyDown}
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto"
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={active === i}
              aria-controls={`${baseId}-panel`}
              tabIndex={active === i ? 0 : -1}
              onClick={() => select(i)}
              className={cn(
                "shrink-0 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] cursor-pointer",
                active === i
                  ? "bg-white dark:bg-[#1C1F2B] text-[#09090B] dark:text-white shadow-xs ring-1 ring-[#E4E7EC] dark:ring-white/15"
                  : "text-[#52525B] dark:text-zinc-400 hover:text-[#09090B] dark:hover:text-white",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <CopyButton text={current.code} />
      </div>

      {/* Code viewport — fixed height sized to largest tab to prevent layout shifts */}
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        tabIndex={0}
        style={{ height: `${fixedPanelHeight}px` }}
        className={cn(
          "overflow-auto p-4 sm:p-5 font-mono text-[12.5px] sm:text-[13px] leading-6 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0066FF] motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        <pre className="w-max min-w-full">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex">
                <span
                  aria-hidden="true"
                  className="w-8 shrink-0 select-none pr-4 text-right text-[#A1A1AA] dark:text-zinc-600 tabular-nums"
                >
                  {i + 1}
                </span>
                <span className="whitespace-pre">
                  {line ? highlight(line, current.language) : " "}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {footer && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E4E7EC] dark:border-white/[0.08] bg-[#F8F9FB] dark:bg-[#13151D] px-4 py-2.5 font-mono text-[11.5px]">
          <span className="text-emerald-600 dark:text-emerald-400">
            {footer.status}
          </span>
          <span className="text-[#71717A] dark:text-zinc-400">
            {footer.endpoint}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Action button                                                       */
/* ------------------------------------------------------------------ */

function ActionButton({
  action,
  variant,
}: {
  action: HeroAction;
  variant: "primary" | "secondary";
}) {
  const classes = cn(
    "group inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 active:scale-[0.98] cursor-pointer",
    variant === "primary"
      ? "bg-[#0066FF] text-white shadow-sm hover:bg-[#0055D4]"
      : "border border-[#E4E7EC] dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#09090B] dark:text-white hover:bg-[#F8F9FB] dark:hover:bg-white/[0.08]",
  );
  const content = (
    <>
      {action.label}
      {variant === "primary" && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-0.5"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} onClick={action.onClick} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={classes}>
      {content}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Main Split Developer Hero Section                                   */
/* ------------------------------------------------------------------ */

export function SplitDeveloperHero({
  id,
  badge,
  title,
  description,
  highlights,
  primaryAction,
  secondaryAction,
  codeTabs,
  terminalFooter,
  headingAs = "h2",
  className,
}: SplitDeveloperHeroProps) {
  const HeadingTag = headingAs;

  return (
    <section
      id={id}
      className={cn(
        "relative isolate w-full min-h-[100svh] flex items-center overflow-x-clip bg-[#FFFFFF] dark:bg-[#09090B] px-6 sm:px-10 xl:px-14 py-20 sm:py-24 text-[#09090B] dark:text-white border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-16 transition-colors duration-300",
        className,
      )}
    >
      {/* Soft top radial accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(55%_60%_at_50%_0%,rgba(0,102,255,0.08),transparent)] dark:bg-[radial-gradient(55%_60%_at_50%_0%,rgba(0,102,255,0.14),transparent)]"
      />

      {/* Two columns on desktop, stacked on mobile. min-w-0 lets the code window scroll instead of stretching the page */}
      <div className="mx-auto grid w-full max-w-[1520px] items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-16">
        <div className="min-w-0 space-y-5">
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4E7EC] dark:border-white/12 bg-[#F8F9FB] dark:bg-white/[0.05] px-3 py-1 text-xs font-medium text-[#52525B] dark:text-zinc-300 shadow-2xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              {badge}
            </div>
          )}

          <HeadingTag className="text-balance text-[30px] sm:text-[40px] lg:text-[42px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white">
            {title}
          </HeadingTag>

          <p className="max-w-xl text-pretty text-[15.5px] leading-[1.65] text-[#52525B] dark:text-zinc-400">
            {description}
          </p>

          {highlights && highlights.length > 0 && (
            <div className="pt-1 border-y border-[#E4E7EC] dark:border-white/[0.08] divide-y divide-[#E4E7EC] dark:divide-white/[0.08] text-[14px]">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="py-3 flex items-start gap-2.5"
                >
                  <Check className="w-4 h-4 text-[#0066FF] dark:text-[#60A5FA] shrink-0 mt-0.5" />
                  <span className="text-[#52525B] dark:text-zinc-300">
                    <strong className="text-[#09090B] dark:text-white font-medium">
                      {item.title}:
                    </strong>{" "}
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <ActionButton action={primaryAction} variant="primary" />
            {secondaryAction && (
              <ActionButton action={secondaryAction} variant="secondary" />
            )}
          </div>
        </div>

        <div className="relative min-w-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 -z-10 rounded-[10px] bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.14)_0%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.22)_0%,transparent_72%)]"
          />
          <CodeWindow tabs={codeTabs} footer={terminalFooter} />
        </div>
      </div>
    </section>
  );
}

export default SplitDeveloperHero;
