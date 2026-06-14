import type { ResumeDensity, ResumePageTarget } from "./schema.js";

export const resumePageSizeValues = ["letter", "a4"] as const;

export type ResumePageSizeName = (typeof resumePageSizeValues)[number];

export interface ResumePageSize {
  name: ResumePageSizeName | string;
  width: string;
  height: string;
  margin: string;
}

export interface ResumeTypographyTokens {
  fontFamily: string;
  baseSize: string;
  smallSize: string;
  h1Size: string;
  h2Size: string;
  h3Size: string;
  lineHeight: string;
  headingLineHeight: string;
  regularWeight: number;
  mediumWeight: number;
  boldWeight: number;
  letterSpacing: string;
}

export interface ResumeSpacingTokens {
  headerGap: string;
  contactGap: string;
  sectionGap: string;
  sectionTitleGap: string;
  itemGap: string;
  itemHeaderGap: string;
  paragraphGap: string;
  listGap: string;
  listIndent: string;
}

export interface ResumeColorTokens {
  background: string;
  text: string;
  muted: string;
  subtle: string;
  accent: string;
  link: string;
  rule: string;
}

export interface ResumeRuleTokens {
  sectionWidth: string;
  sectionStyle: string;
  itemWidth: string;
  itemStyle: string;
  radius: string;
}

export interface ResumeDensityTokens {
  fontScale: string;
  sectionGap: string;
  itemGap: string;
  listGap: string;
  paragraphGap: string;
}

export interface ResumeThemeTokens {
  typography: ResumeTypographyTokens;
  spacing: ResumeSpacingTokens;
  color: ResumeColorTokens;
  rules: ResumeRuleTokens;
  density: Record<ResumeDensity, ResumeDensityTokens>;
}

export interface ResumeTheme {
  name: string;
  tokens: ResumeThemeTokens;
}

export interface LegacyResumeTheme {
  name: string;
  accentColor?: string;
  fontFamily?: string;
}

export type ResumeThemeInput = ResumeTheme | LegacyResumeTheme;

export interface ResumePresentationControls {
  density?: ResumeDensity;
  pageSize?: ResumePageSizeName | ResumePageSize;
  pageTarget?: ResumePageTarget;
}

export const resumePageSizes: Record<ResumePageSizeName, ResumePageSize> = {
  letter: {
    name: "letter",
    width: "8.5in",
    height: "11in",
    margin: "0.55in",
  },
  a4: {
    name: "a4",
    width: "210mm",
    height: "297mm",
    margin: "14mm",
  },
};

export const baselineResumeTheme: ResumeTheme = {
  name: "baseline",
  tokens: {
    typography: {
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      baseSize: "10.5pt",
      smallSize: "8.8pt",
      h1Size: "20pt",
      h2Size: "9.5pt",
      h3Size: "10.5pt",
      lineHeight: "1.35",
      headingLineHeight: "1.12",
      regularWeight: 400,
      mediumWeight: 600,
      boldWeight: 700,
      letterSpacing: "0",
    },
    spacing: {
      headerGap: "0.14in",
      contactGap: "0.08in",
      sectionGap: "0.18in",
      sectionTitleGap: "0.08in",
      itemGap: "0.11in",
      itemHeaderGap: "0.035in",
      paragraphGap: "0.045in",
      listGap: "0.025in",
      listIndent: "0.16in",
    },
    color: {
      background: "#ffffff",
      text: "#111827",
      muted: "#4b5563",
      subtle: "#6b7280",
      accent: "#0f766e",
      link: "#0f766e",
      rule: "#d1d5db",
    },
    rules: {
      sectionWidth: "0.8pt",
      sectionStyle: "solid",
      itemWidth: "0",
      itemStyle: "solid",
      radius: "0",
    },
    density: {
      compact: {
        fontScale: "0.96",
        sectionGap: "0.135in",
        itemGap: "0.075in",
        listGap: "0.016in",
        paragraphGap: "0.03in",
      },
      standard: {
        fontScale: "1",
        sectionGap: "0.18in",
        itemGap: "0.11in",
        listGap: "0.025in",
        paragraphGap: "0.045in",
      },
      spacious: {
        fontScale: "1.04",
        sectionGap: "0.24in",
        itemGap: "0.16in",
        listGap: "0.04in",
        paragraphGap: "0.065in",
      },
    },
  },
};

export function normalizeResumeTheme(themeInput?: ResumeThemeInput): ResumeTheme {
  if (!themeInput) {
    return baselineResumeTheme;
  }

  if ("tokens" in themeInput) {
    return themeInput;
  }

  return {
    ...baselineResumeTheme,
    name: themeInput.name ?? baselineResumeTheme.name,
    tokens: {
      ...baselineResumeTheme.tokens,
      typography: {
        ...baselineResumeTheme.tokens.typography,
        fontFamily: themeInput.fontFamily ?? baselineResumeTheme.tokens.typography.fontFamily,
      },
      color: {
        ...baselineResumeTheme.tokens.color,
        accent: themeInput.accentColor ?? baselineResumeTheme.tokens.color.accent,
        link: themeInput.accentColor ?? baselineResumeTheme.tokens.color.link,
      },
    },
  };
}

export function resolveResumePageSize(pageSize: ResumePageSizeName | ResumePageSize = "letter"): ResumePageSize {
  if (typeof pageSize === "string") {
    return resumePageSizes[pageSize];
  }

  return pageSize;
}
