import { useState, useEffect, useLayoutEffect, useRef, useMemo, type CSSProperties, type PointerEvent } from "react";
import Lottie from "lottie-react";
import { AppHeader } from "./components/AppHeader";
import { FeaturedProjects, type FeaturedProjectItem } from "./components/FeaturedProjects";
import { IntelligentSolutions, type IntelligentSolutionItem } from "./components/IntelligentSolutions";
import { ProjectDetailsDialog } from "./components/ProjectDetailsDialog";
import {
  ContractPdfViewer,
  type ContractPdfField,
} from "./components/ContractPdfViewer";
import type { SolutionInquiryType } from "./components/SolutionInquiryDialog";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Download,
  FileText,
  FolderOpen,
  Mail,
  MapPin,
  Palette,
  Search,
  Send,
} from "lucide-react";
import { useScrollReveal } from "./hooks/useScrollReveal";
import { useImagesReady } from "./hooks/useImagesReady";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import styles from "./App.module.css";

import codexCert from "@/assets/certificates/codex_cert.PNG";
import kodegoCert from "@/assets/certificates/kodego_cert.jpg";
import misCert from "@/assets/certificates/mis_cert.PNG";
import serviceAppsImage from "@/assets/images/manage_apps.png";
import serviceAutomationImage from "@/assets/images/ai_automation.png";
import serviceDataImage from "@/assets/images/data_entry.png";
import serviceWordpressImage from "@/assets/images/wordpress_management.png";
import serviceBrandingImage from "@/assets/images/business_logo.png";
import serviceThumbnailsImage from "@/assets/images/youtube_thumbnails.png";
import serviceFigmaImage from "@/assets/images/figma_prototype.png";
import heroProfileCutout from "@/assets/images/hero-profile-cutout.png";
import heroVisual1 from "@/assets/lotties/visual1.json";
import heroVisual2 from "@/assets/lotties/visual2.json";
import heroVisual3 from "@/assets/lotties/visual3.json";
import ContactMe from "./components/ContactMe";


type BannerSectionData = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
};

type CertificateItem = {
  id: string;
  org: string;
  title: string;
  description: string;
  image: string;
};

type FeedbackItem = {
  id: string;
  name: string;
  role: string;
  rating: number;
  avatar: string;
  feedback: string;
  detail: string;
};

type GalleryProject = {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  portraitImage: string;
  landscapeImage: string;
  images: string[];
  tags: string[];
  status: ProjectDeliveryStatus;
  isFeatured: boolean;
  isPinned: boolean;
  highlights: string[];
  details: string;
};

type GalleryProjectState = GalleryProject & {
  state: "enter" | "active" | "exit";
};

type PublicApiListResponse<T> = {
  data?: T[];
};

type PublicProject = {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string | null;
  portraitImageUrl?: string | null;
  landscapeImageUrl?: string | null;
  previewImages?: string[] | null;
  isFeatured?: boolean | null;
  isPinned?: boolean | null;
  projectStatus?: string | null;
  timeline: string | null;
  tags: string[];
  highlights: string[];
  details: string | null;
};

type ProjectDeliveryStatus = "Completed" | "Canceled" | "Ongoing" | "Pending";

type PublicService = {
  id: string;
  name: string;
  subtitle: string | null;
};

type PublicBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
};

type PublicCertificate = {
  id: string;
  org: string;
  title: string;
  description: string;
  imageUrl: string | null;
};

type PublicReview = {
  id: string;
  name: string;
  role: string | null;
  rating: number;
  avatar: string | null;
  feedback: string;
  detail: string | null;
};

type PublicWorkExperience = {
  id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  summary: string;
  imageUrl: string | null;
  highlights?: string[] | null;
};

type PublicReviewInvitation = {
  clientName: string;
  company: string | null;
  role: string | null;
  expiresAt: string;
};

type PublicContract = {
  id: string;
  title: string;
  recipientName: string;
  pdfDocument: {
    fileUrl: string;
    fileName: string;
    mimeType: string;
  };
  pageCount: number;
  fields: ContractPdfField[];
  values: Record<string, string>;
  sentAt: string | null;
  viewedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
};

type WorkExperienceItem = {
  id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  image: string;
  summary: string;
  highlights: string[];
};

type HeroPitchPanel = {
  eyebrow: string;
  title: string;
  description: string;
  proof: string[];
  metric: string;
  metricLabel: string;
  actionLabel: string;
};

type HeroToolBadge = {
  name: string;
  icon: string;
  layer: "front" | "back";
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  hoverX: number;
  hoverY: number;
  floatY: number;
};

type EssentialTool = {
  name: string;
  icon: string;
};

type EssentialToolGroupId = "design" | "ai" | "build";

type EssentialToolGroup = {
  title: string;
  description: string;
  accent: string;
  icon: typeof Palette;
  tools: EssentialTool[];
};

const heroPitchPanels: HeroPitchPanel[] = [
  {
    eyebrow: "AI automation for operations",
    title: "Remove the repetitive work that slows your team down.",
    description:
      "Let AI and modern automation tools handle your repetitive business operations, so your team can save time, work smarter, and focus on building better customer experiences.",
    proof: [
      "Document extraction into structured records",
      "n8n workflows that can run around the clock",
      "Cleaner handoff from inbox to spreadsheet or app",
    ],
    metric: "Workflow",
    metricLabel: "from inbox to organized records",
    actionLabel: "Automate a process",
  },
  {
    eyebrow: "Business software delivery",
    title: "Ship tools that support the way your business actually works.",
    description:
      "Bring your business into the digital age. Create a custom system and online platform that helps you streamline operations, reach more customers, and grow beyond the limits of traditional business.",
    proof: [
      "Appointment, payment, and consultation flows",
      "Attendance, payroll, leave, and document modules",
      "Custom dashboards, APIs, and deployment support",
    ],
    metric: "Product",
    metricLabel: "from rough idea to usable system",
    actionLabel: "Explore Solutions",
  },
];

const essentialToolGroupMeta: Record<EssentialToolGroupId, Omit<EssentialToolGroup, "tools">> = {
  design: {
    title: "Design Studio",
    description: "Visual systems, layouts, motion, and production-ready graphics.",
    accent: "#38bdf8",
    icon: Palette,
  },
  ai: {
    title: "AI Workspace",
    description: "Research, drafting, automation support, voice, and generation workflows.",
    accent: "#f59e0b",
    icon: Bot,
  },
  build: {
    title: "Build Kit",
    description: "Code, API testing, app delivery, version control, and deployment.",
    accent: "#22c55e",
    icon: Code2,
  },
};

const toolNameBySlug: Record<string, string> = {
  canva: "Canva",
  claude: "Claude",
  deepseek: "DeepSeek",
  elevenlabs: "ElevenLabs",
  figma: "Figma",
  firebase: "Firebase",
  flutter: "Flutter",
  gemini: "Gemini",
  git: "Git",
  grok: "Grok",
  illustrator: "Illustrator",
  nodejs: "Node.js",
  openai: "OpenAI",
  photoshop: "Photoshop",
  postman: "Postman",
  react: "React",
  supabase: "Supabase",
  vscode: "VS Code",
};

const toolGroupBySlug: Record<string, EssentialToolGroupId> = {
  canva: "design",
  figma: "design",
  illustrator: "design",
  photoshop: "design",
  claude: "ai",
  deepseek: "ai",
  elevenlabs: "ai",
  gemini: "ai",
  grok: "ai",
  openai: "ai",
  firebase: "build",
  flutter: "build",
  git: "build",
  nodejs: "build",
  postman: "build",
  react: "build",
  supabase: "build",
  vscode: "build",
};

const toolOrderBySlug: Record<string, number> = {
  figma: 1,
  canva: 2,
  photoshop: 3,
  illustrator: 4,
  openai: 1,
  claude: 2,
  gemini: 3,
  elevenlabs: 4,
  deepseek: 5,
  grok: 6,
  vscode: 1,
  react: 2,
  flutter: 3,
  nodejs: 4,
  firebase: 5,
  git: 6,
  postman: 7,
  supabase: 8,
};

const toolIconModules = import.meta.glob("./assets/icons/tools/*.{png,jpg,jpeg,svg,webp,avif}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const essentialToolGroups: EssentialToolGroup[] = (() => {
  const grouped: Record<EssentialToolGroupId, EssentialTool[]> = {
    design: [],
    ai: [],
    build: [],
  };

  for (const [modulePath, icon] of Object.entries(toolIconModules)) {
    const file = modulePath.split("/").pop() || "";
    const slug = file.replace(/\.[^.]+$/, "").toLowerCase();
    const groupId = toolGroupBySlug[slug];
    if (!groupId) continue;

    grouped[groupId].push({
      name: toolNameBySlug[slug] || slug,
      icon,
    });
  }

  const groupOrder: EssentialToolGroupId[] = ["design", "ai", "build"];

  return groupOrder.map((groupId) => ({
    ...essentialToolGroupMeta[groupId],
    tools: grouped[groupId].sort((a, b) => {
      const aSlug = a.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
      const bSlug = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
      const aOrder = toolOrderBySlug[aSlug] ?? Number.MAX_SAFE_INTEGER;
      const bOrder = toolOrderBySlug[bSlug] ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    }),
  }));
})();

const heroPitchVisuals = [heroVisual2, heroVisual3] as const;

const API_BASE = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000/api").replace(
  /\/+$/,
  "",
);
const PUBLIC_VISITOR_KEY = "ace_public_visitor_id";

const createVisitorKey = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getVisitorKey = () => {
  if (typeof window === "undefined") return createVisitorKey();
  try {
    const existing = window.localStorage.getItem(PUBLIC_VISITOR_KEY);
    if (existing) return existing;
    const next = createVisitorKey();
    window.localStorage.setItem(PUBLIC_VISITOR_KEY, next);
    return next;
  } catch {
    return createVisitorKey();
  }
};

const stringifyErrorDetails = (value: unknown) => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value);
  }
};

const reportFrontendError = async ({
  message,
  stack,
  details,
}: {
  message: string;
  stack?: string;
  details?: string;
}) => {
  if (typeof window === "undefined") return;
  try {
    await fetch(`${API_BASE}/public/error-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorKey: getVisitorKey(),
        message,
        stack,
        details,
        path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        url: window.location.href,
      }),
    });
  } catch {
    // Error reporting must never create user-facing failures.
  }
};

const fallbackProjectImage =
  "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200";

const bannerFallbackImages = [
  serviceAppsImage,
  serviceAutomationImage,
  serviceDataImage,
  serviceWordpressImage,
  serviceBrandingImage,
  serviceThumbnailsImage,
  serviceFigmaImage,
];

const certificateFallbackImages = [kodegoCert, codexCert, misCert];

const toSectionId = (value: string) =>
  `service-${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const parseListResponse = <T,>(payload: unknown): T[] => {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return [];
  const data = (payload as PublicApiListResponse<T>).data;
  return Array.isArray(data) ? data : [];
};

const normalizeStringList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const normalized = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return normalized.length > 0 ? normalized : fallback;
};

const normalizeProjectDeliveryStatus = (value: unknown): ProjectDeliveryStatus => {
  if (typeof value !== "string") return "Ongoing";
  const normalized = value.trim().toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "canceled" || normalized === "cancelled") return "Canceled";
  if (normalized === "ongoing") return "Ongoing";
  if (normalized === "pending") return "Pending";
  return "Ongoing";
};

const getProjectThumbnail = (
  project: GalleryProject,
  variant: "default" | "portrait" | "landscape",
) => {
  if (variant === "portrait") return project.portraitImage || project.image;
  if (variant === "landscape") return project.landscapeImage || project.image;
  return project.image;
};

const archiveColorPalettes = [
  {
    match: "automation",
    panel: "#2d2864",
    panelText: "#bdb5ec",
    tagBg: "#ded9f1",
    tagColor: "#6d28d9",
  },
  {
    match: "web",
    panel: "#184f89",
    panelText: "#9ac1f3",
    tagBg: "#cfe4f3",
    tagColor: "#0756d8",
  },
  {
    match: "graphic",
    panel: "#18181b",
    panelText: "#a7a7aa",
    tagBg: "#e9decb",
    tagColor: "#d94c0a",
  },
  {
    match: "brand",
    panel: "#11552d",
    panelText: "#9cccae",
    tagBg: "#e9decb",
    tagColor: "#d94c0a",
  },
  {
    match: "design",
    panel: "#95172c",
    panelText: "#ee8ca0",
    tagBg: "#e9decb",
    tagColor: "#d94c0a",
  },
] as const;

const archiveFallbackPalettes = [
  archiveColorPalettes[1],
  archiveColorPalettes[2],
  archiveColorPalettes[3],
  archiveColorPalettes[4],
] as const;

const getStablePaletteIndex = (value: string, size: number) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return Math.abs(hash) % size;
};

const getProjectArchiveStyle = (project: GalleryProject): CSSProperties => {
  const haystack = `${project.category} ${project.title}`.toLowerCase();
  const matchedPalette =
    archiveColorPalettes.find((palette) => haystack.includes(palette.match)) ??
    archiveFallbackPalettes[getStablePaletteIndex(project.id || project.title, archiveFallbackPalettes.length)];

  return {
    "--project-panel": matchedPalette.panel,
    "--project-panel-text": matchedPalette.panelText,
    "--project-tag-bg": matchedPalette.tagBg,
    "--project-tag-color": matchedPalette.tagColor,
  } as CSSProperties;
};

const mapProjectToGallery = (project: PublicProject): GalleryProject => {
  const image = project.imageUrl || fallbackProjectImage;
  const portraitImage = project.portraitImageUrl || image;
  const landscapeImage = project.landscapeImageUrl || image;
  const previewImages =
    Array.isArray(project.previewImages) && project.previewImages.length > 0
      ? project.previewImages.filter(Boolean)
      : [image];
  return {
    id: project.id,
    title: project.title,
    category: project.category,
    description: project.description,
    image,
    portraitImage,
    landscapeImage,
    images: previewImages.length > 0 ? previewImages : [image],
    tags: Array.isArray(project.tags) ? project.tags : [],
    status: normalizeProjectDeliveryStatus(project.projectStatus ?? project.timeline),
    isFeatured: Boolean(project.isFeatured),
    isPinned: Boolean(project.isPinned),
    highlights:
      Array.isArray(project.highlights) && project.highlights.length > 0
        ? project.highlights
        : ["Project highlights will be available soon."],
    details: project.details || project.description,
  };
};

function BannerStack({ banners }: { banners: BannerSectionData[] }) {
  const bannerCount = banners.length;
  const sectionRef = useRef<HTMLElement>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useLayoutEffect(() => {
    if (bannerCount <= 1) {
      setActiveBannerIndex(0);
      return;
    }

    let frameId: number | null = null;
    const timeoutIds: number[] = [];

    const updateBannerStates = () => {
      frameId = null;

      const section = sectionRef.current;
      if (!section) return;

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 1;
      const sectionRect = section.getBoundingClientRect();
      const activeIndex = Math.min(
        bannerCount - 1,
        Math.max(
          0,
          Math.floor((-sectionRect.top + viewportHeight * 0.45) / viewportHeight),
        ),
      );

      section.setAttribute("data-active-banner-index", String(activeIndex));
      setActiveBannerIndex((currentIndex) =>
        currentIndex === activeIndex ? currentIndex : activeIndex,
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId =
        typeof window.requestAnimationFrame === "function"
          ? window.requestAnimationFrame(updateBannerStates)
          : window.setTimeout(updateBannerStates, 16);
    };

    scheduleUpdate();
    [80, 220, 520].forEach((delay) => {
      timeoutIds.push(window.setTimeout(scheduleUpdate, delay));
    });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    document.addEventListener("visibilitychange", scheduleUpdate);
    const intervalId = window.setInterval(scheduleUpdate, 140);

    return () => {
      if (frameId !== null) {
        if (typeof window.cancelAnimationFrame === "function") {
          window.cancelAnimationFrame(frameId);
        } else {
          window.clearTimeout(frameId);
        }
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      document.removeEventListener("visibilitychange", scheduleUpdate);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.clearInterval(intervalId);
    };
  }, [bannerCount]);

  return (
    <section
      ref={sectionRef}
      className={`${styles.app__section} ${styles["app__section--bannerStack"]} ${styles.app__sectionReveal}`}
      id="banners"
      data-active-banner-index={activeBannerIndex}
      data-section-reveal="true"
    >
      {banners.map((banner, index) => {
        const isReversed = index % 2 === 1;
        const isActive = index === activeBannerIndex;
        const isPassed = index < activeBannerIndex;
        const stackIndex = isActive
          ? bannerCount * 3
          : isPassed
            ? index + 1
            : bannerCount + index + 1;

        return (
          <article
            key={banner.id}
            id={banner.id}
            data-banner-panel="true"
            data-banner-state={
              isPassed ? "passed" : isActive ? "active" : "upcoming"
            }
            className={`${styles.app__bannerPanel} ${
              isReversed ? styles["app__bannerPanel--reverse"] : ""
            } ${isPassed ? styles["app__bannerPanel--passed"] : ""}`}
            style={
              {
                zIndex: stackIndex,
              } as CSSProperties
            }
          >
            <div className={styles.app__bannerMedia}>
              <img
                src={banner.image}
                alt={banner.title}
                className={styles.app__bannerMediaImage}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
            <div className={styles.app__bannerContent}>
              <span className={styles.app__bannerStep}>
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(bannerCount).padStart(2, "0")}
              </span>
              <h3 className={styles.app__bannerTitle}>{banner.title}</h3>
              <p className={styles.app__bannerDescription}>{banner.subtitle}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function BannerSectionSkeleton() {
  return (
    <section
      className={`${styles.app__section} ${styles["app__section--service"]} ${styles.app__sectionReveal}`}
      data-section-reveal="true"
    >
      <div className={styles.app__sectionInner}>
        <div className={styles.app__content}>
          <div className={`${styles.app__serviceRow} ${styles["app__serviceRow--visible"]}`} aria-busy="true">
            <span className={`${styles.app__skeleton} ${styles.app__serviceSkeletonMedia}`} />
            <div className={styles.app__serviceContent}>
              <span className={`${styles.app__skeleton} ${styles.app__skeletonTitle}`} />
              <span className={`${styles.app__skeleton} ${styles.app__skeletonLine}`} />
              <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--wide"]}`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CertificateSkeletonGrid() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`certificate-skeleton-${index}`} className={`${styles.app__certificateCard} ${styles["app__certificateCard--visible"]}`}>
          <span className={`${styles.app__skeleton} ${styles.app__certificateSkeletonMedia}`} />
          <div className={styles.app__certificateMeta}>
            <span className={`${styles.app__skeleton} ${styles.app__skeletonKicker}`} />
            <span className={`${styles.app__skeleton} ${styles.app__skeletonLine}`} />
            <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--short"]}`} />
          </div>
        </div>
      ))}
    </>
  );
}

function WorkSkeletonRow() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`work-skeleton-${index}`} className={`${styles.app__workCard} ${styles["app__workCard--visible"]}`}>
          <div className={styles.app__workHeader}>
            <span className={`${styles.app__skeleton} ${styles.app__workSkeletonAvatar}`} />
            <div className={styles.app__workMeta}>
              <span className={`${styles.app__skeleton} ${styles.app__skeletonKicker}`} />
              <span className={`${styles.app__skeleton} ${styles.app__skeletonTitle}`} />
            </div>
          </div>
          <span className={`${styles.app__skeleton} ${styles.app__skeletonLine}`} />
          <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--wide"]}`} />
          <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--short"]}`} />
        </div>
      ))}
    </>
  );
}

function FeedbackSkeletonRow() {
  return (
    <div className={styles.app__feedbackSkeletonRow} aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`feedback-skeleton-${index}`} className={styles.app__feedbackCard}>
          <div className={styles.app__feedbackHeader}>
            <span className={`${styles.app__skeleton} ${styles.app__feedbackSkeletonAvatar}`} />
            <div className={styles.app__feedbackMeta}>
              <span className={`${styles.app__skeleton} ${styles.app__skeletonKicker}`} />
              <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--short"]}`} />
            </div>
            <span className={`${styles.app__skeleton} ${styles.app__feedbackSkeletonStars}`} />
          </div>
          <span className={`${styles.app__skeleton} ${styles.app__skeletonLine}`} />
          <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--wide"]}`} />
          <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--short"]}`} />
        </div>
      ))}
    </div>
  );
}

function ProjectsGridSkeleton() {
  return (
    <div className={styles.app__projectsGrid} aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`project-skeleton-${index}`} className={styles.app__projectsCard}>
          <span className={`${styles.app__skeleton} ${styles.app__projectsSkeletonMedia}`} />
          <div className={styles.app__projectsBody}>
            <span className={`${styles.app__skeleton} ${styles.app__skeletonKicker}`} />
            <span className={`${styles.app__skeleton} ${styles.app__skeletonTitle}`} />
            <span className={`${styles.app__skeleton} ${styles.app__skeletonLine}`} />
            <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--short"]}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeaturedProjectsRailSkeleton() {
  return (
    <div className={styles.app__projectsFeaturedRail} aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`featured-project-skeleton-${index}`} className={styles.app__projectsFeatureCard}>
          <span className={`${styles.app__skeleton} ${styles.app__projectsFeatureSkeletonMedia}`} />
          <div className={styles.app__projectsFeatureBody}>
            <span className={`${styles.app__skeleton} ${styles.app__skeletonKicker}`} />
            <span className={`${styles.app__skeleton} ${styles.app__skeletonTitle}`} />
            <span className={`${styles.app__skeleton} ${styles["app__skeletonLine--short"]}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsGallery({
  onBack,
  projects,
  requestedCategory,
  isLoading,
}: {
  onBack: () => void;
  projects: GalleryProject[];
  requestedCategory?: string | null;
  isLoading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const featuredRailRef = useRef<HTMLDivElement>(null);
  const [featuredScrollState, setFeaturedScrollState] = useState({
    canScrollNext: false,
    canScrollPrev: false,
  });
  const [displayedProjects, setDisplayedProjects] = useState<GalleryProjectState[]>(
    () => projects.map((project) => ({ ...project, state: "enter" })),
  );
  const [activeProject, setActiveProject] = useState<GalleryProject | null>(null);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(projects.map((project) => project.category))),
    ],
    [projects],
  );
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      counts.set(project.category, (counts.get(project.category) ?? 0) + 1);
    });
    return counts;
  }, [projects]);
  const normalizedRequestedCategory = requestedCategory?.trim().toLowerCase() || "";
  const resolvedRequestedCategory = useMemo(() => {
    if (!normalizedRequestedCategory) return null;
    const exactMatch = categories.find(
      (option) => option.toLowerCase() === normalizedRequestedCategory,
    );
    if (exactMatch) return exactMatch;
    const partialMatch = categories.find((option) =>
      option.toLowerCase().includes(normalizedRequestedCategory),
    );
    return partialMatch || null;
  }, [categories, normalizedRequestedCategory]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory =
        category === "All" || project.category === category;
      const haystack = `${project.title} ${project.description} ${project.tags.join(" ")}`.toLowerCase();
      const matchesQuery = normalizedQuery === "" || haystack.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [projects, query, category]);
  const featuredProjects = useMemo(() => projects.filter((project) => project.isPinned), [projects]);
  const showProjectsSkeleton = isLoading;
  const showFeaturedSkeleton = isLoading;

  const scrollFeaturedProjects = (direction: "next" | "prev") => {
    const rail = featuredRailRef.current;
    if (!rail) return;

    const firstCard = rail.querySelector<HTMLElement>("[data-featured-project-card='true']");
    const cardGap = 14;
    const scrollAmount = firstCard
      ? firstCard.getBoundingClientRect().width + cardGap
      : rail.clientWidth * 0.8;

    rail.scrollBy({
      behavior: "smooth",
      left: direction === "next" ? scrollAmount : -scrollAmount,
    });
  };

  useEffect(() => {
    const rail = featuredRailRef.current;
    if (!rail || showFeaturedSkeleton) {
      setFeaturedScrollState({ canScrollNext: false, canScrollPrev: false });
      return;
    }

    const syncFeaturedScrollState = () => {
      const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
      setFeaturedScrollState({
        canScrollPrev: rail.scrollLeft > 1,
        canScrollNext: rail.scrollLeft < maxScrollLeft - 1,
      });
    };

    const frame = window.requestAnimationFrame(syncFeaturedScrollState);
    rail.addEventListener("scroll", syncFeaturedScrollState, { passive: true });
    window.addEventListener("resize", syncFeaturedScrollState);

    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", syncFeaturedScrollState);
      window.removeEventListener("resize", syncFeaturedScrollState);
    };
  }, [featuredProjects.length, showFeaturedSkeleton]);

  useEffect(() => {
    if (!normalizedRequestedCategory) return;
    setCategory(resolvedRequestedCategory || "All");
  }, [normalizedRequestedCategory, resolvedRequestedCategory]);

  useEffect(() => {
    setDisplayedProjects((prev) => {
      const prevMap = new Map(prev.map((item) => [item.id, item]));
      const nextIds = new Set(filteredProjects.map((item) => item.id));
      const visibleItems: GalleryProjectState[] = filteredProjects.map((project) => {
        const prevItem = prevMap.get(project.id);
        const state = prevItem && prevItem.state !== "exit" ? "active" : "enter";
        return { ...project, state };
      });
      const exitingItems: GalleryProjectState[] = prev
        .filter((item) => !nextIds.has(item.id))
        .map((item) => ({ ...item, state: "exit" }));

      return [...visibleItems, ...exitingItems];
    });
  }, [filteredProjects]);

  useEffect(() => {
    const hasEntering = displayedProjects.some((item) => item.state === "enter");
    if (!hasEntering) return;
    const frame = window.requestAnimationFrame(() => {
      setDisplayedProjects((prev) =>
        prev.map((item) =>
          item.state === "enter" ? { ...item, state: "active" } : item,
        ),
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, [displayedProjects]);

  const handleCardTransitionEnd = (id: string, state: "enter" | "active" | "exit") => {
    if (state !== "exit") return;
    setDisplayedProjects((prev) =>
      prev.filter((item) => !(item.id === id && item.state === "exit")),
    );
  };

  return (
    <section className={`${styles.app__section} ${styles["app__section--projects"]}`}>
      <div className={`${styles.app__sectionInner} ${styles["app__sectionInner--top"]}`}>
        <div className={styles.app__projects}>
          <div className={styles.app__projectsHero}>
            <div className={styles.app__projectsHeroCopy}>
              <button
                type="button"
                className={styles.app__projectsBack}
                onClick={onBack}
              >
                <span aria-hidden="true">{"\u2190"}</span>
                Back to Home
              </button>
              <p className={styles.app__projectsEyebrow}>
                <span aria-hidden="true" className={styles.app__projectsEyebrowDot} />
                Selected work archive
              </p>
              <h2>Project Gallery</h2>
              <p className={styles.app__sectionSubtitle}>
                A compact archive of selected design, web, and automation work.
              </p>
            </div>
          </div>

          <section className={styles.app__projectsFeatured} aria-labelledby="featured-project-list-title">
            <div className={styles.app__projectsSectionHeader}>
              <div>
                <p className={styles.app__projectsSectionKicker}>Featured</p>
                <h3 id="featured-project-list-title">Featured projects</h3>
              </div>
              <div className={styles.app__projectsSectionActions}>
                <span className={styles.app__projectsSectionCount}>
                  {featuredProjects.length} selected
                </span>
                <div className={styles.app__projectsRailControls} aria-label="Featured project navigation">
                  <button
                    type="button"
                    className={styles.app__projectsRailButton}
                    onClick={() => scrollFeaturedProjects("prev")}
                    disabled={!featuredScrollState.canScrollPrev}
                    aria-label="Show previous featured projects"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={styles.app__projectsRailButton}
                    onClick={() => scrollFeaturedProjects("next")}
                    disabled={!featuredScrollState.canScrollNext}
                    aria-label="Show next featured projects"
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {showFeaturedSkeleton ? (
              <FeaturedProjectsRailSkeleton />
            ) : featuredProjects.length === 0 ? (
              <p className={styles.app__projectsEmpty}>No featured projects available yet.</p>
            ) : (
              <div
                className={styles.app__projectsFeaturedRailShell}
                data-show-start-shader={featuredScrollState.canScrollPrev}
                data-show-end-shader={featuredScrollState.canScrollNext}
              >
                <div className={styles.app__projectsFeaturedRail} ref={featuredRailRef}>
                  {featuredProjects.map((project) => (
                    <button
                      type="button"
                      key={`featured-${project.id}`}
                      className={styles.app__projectsFeatureCard}
                      style={getProjectArchiveStyle(project)}
                      data-featured-project-card="true"
                      onClick={() => setActiveProject(project)}
                      aria-label={`Open ${project.title}`}
                    >
                      <div className={styles.app__projectsFeatureMedia}>
                        <img
                          src={getProjectThumbnail(project, "portrait")}
                          alt={project.title}
                          className={styles.app__projectsImage}
                        />
                        <span className={styles.app__projectsTag}>{project.category}</span>
                      </div>
                      <div className={styles.app__projectsFeatureBody}>
                        <h4>{project.title}</h4>
                        <p>{project.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className={styles.app__projectsList} aria-labelledby="all-projects-list-title">
            <div className={styles.app__projectsListHeader}>
              <div className={styles.app__projectsListTitle}>
                <p className={styles.app__projectsSectionKicker}>All projects</p>
                <h3 id="all-projects-list-title">Project list</h3>
                <span>{filteredProjects.length} of {projects.length} shown</span>
              </div>
              <div className={styles.app__projectsToolbar}>
                <div className={styles.app__projectsControls}>
                  <div className={styles.app__projectsSearchWrap}>
                    <Search className={styles.app__projectsSearchIcon} />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className={styles.app__projectsInput}
                    />
                  </div>
                </div>
                <div className={styles.app__projectsFilterStrip} aria-label="Project categories">
                  {categories.map((option) => {
                    const count =
                      option === "All"
                        ? projects.length
                        : categoryCounts.get(option) ?? 0;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`${styles.app__projectsFilterChip} ${
                          category === option
                            ? styles["app__projectsFilterChip--active"]
                            : ""
                        }`}
                        aria-pressed={category === option}
                        onClick={() => setCategory(option)}
                      >
                        <span>{option}</span>
                        <strong>{count}</strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {showProjectsSkeleton ? (
              <ProjectsGridSkeleton />
            ) : (
              <div className={styles.app__projectsGrid}>
                {displayedProjects.map((project) => (
                  <button
                    type="button"
                    key={project.id}
                    className={styles.app__projectsCard}
                    style={getProjectArchiveStyle(project)}
                    data-state={project.state}
                    onTransitionEnd={() =>
                      handleCardTransitionEnd(project.id, project.state)
                    }
                    onClick={() => setActiveProject(project)}
                    aria-label={`Open ${project.title}`}
                  >
                    <div className={styles.app__projectsMedia}>
                      <img
                        src={getProjectThumbnail(project, "landscape")}
                        alt={project.title}
                        className={styles.app__projectsImage}
                      />
                      <span className={styles.app__projectsTag}>{project.category}</span>
                      <span className={styles.app__projectsYear}>2024</span>
                    </div>
                    <div className={styles.app__projectsBody}>
                      <h3 className={styles.app__projectsTitle}>{project.title}</h3>
                      <p className={styles.app__projectsDescription}>{project.description}</p>
                      <div className={styles.app__projectsFooter}>
                        <span className={styles.app__projectsStatusBadge} data-status={project.status}>
                          {project.status}
                        </span>
                        {project.tags.length > 0 && (
                          <div className={styles.app__projectsMeta}>
                            {project.tags.slice(0, 2).map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!showProjectsSkeleton && filteredProjects.length === 0 && (
              <div className={styles.app__projectsEmpty}>
                <strong>No projects matched this view.</strong>
                <span>Try a different keyword or switch back to all disciplines.</span>
              </div>
            )}
          </section>
        </div>
      </div>
      <ProjectDetailsDialog
        project={activeProject}
        onOpenChange={(open: boolean) => {
          if (!open) setActiveProject(null);
        }}
      />
    </section>
  );
}

function getReviewTokenFromPath() {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/^\/review\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export function ReviewInvitationApp() {
  const token = getReviewTokenFromPath();
  const [invitation, setInvitation] = useState<PublicReviewInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadInvitation = async () => {
      if (!token) {
        setError("This review link is invalid.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/public/review-invitations/${encodeURIComponent(token)}`,
        );
        const payload = (await response.json().catch(() => ({}))) as {
          data?: PublicReviewInvitation;
          message?: string;
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.message || "This review link is expired or already used.");
        }
        if (!cancelled) {
          setInvitation(payload.data);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "This review link is expired or already used.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInvitation();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/public/review-invitations/${encodeURIComponent(token)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            feedback: feedback.trim(),
            detail: detail.trim() || undefined,
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || "Failed to submit review.");
      }
      setIsSubmitted(true);
      setFeedback("");
      setDetail("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to submit review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.reviewPage}>
      <section className={styles.reviewPage__panel}>
        <div className={styles.reviewPage__header}>
          <span className={styles.reviewPage__icon}>
            {isSubmitted ? <CheckCircle2 size={24} /> : <Mail size={24} />}
          </span>
          <div>
            <p className={styles.reviewPage__eyebrow}>Client review</p>
            <h1>{isSubmitted ? "Review Submitted" : "Share your feedback"}</h1>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.reviewPage__loading}>
            <span />
            <span />
            <span />
          </div>
        ) : isSubmitted ? (
          <div className={styles.reviewPage__status}>
            <CheckCircle2 size={32} />
            <h2>Thank you for your review.</h2>
            <p>
              Your feedback was submitted for approval. This link is now expired and
              cannot be used again.
            </p>
          </div>
        ) : error && !invitation ? (
          <div className={`${styles.reviewPage__status} ${styles["reviewPage__status--error"]}`}>
            <AlertTriangle size={32} />
            <h2>Review link unavailable</h2>
            <p>{error}</p>
          </div>
        ) : (
          <form className={styles.reviewPage__form} onSubmit={submitReview}>
            {invitation && (
              <div className={styles.reviewPage__client}>
                <span>Invited client</span>
                <strong>{invitation.clientName}</strong>
                <small>
                  Expires{" "}
                  {new Date(invitation.expiresAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </small>
              </div>
            )}

            <label className={styles.reviewPage__field}>
              <span>Rating</span>
              <div
                className={styles.reviewPage__rating}
                role="radiogroup"
                aria-label="Rating"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      value <= rating ? styles["reviewPage__star--active"] : undefined
                    }
                    onClick={() => setRating(value)}
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  >
                    {value <= rating ? "\u2605" : "\u2606"}
                  </button>
                ))}
              </div>
            </label>

            <label className={styles.reviewPage__field}>
              <span>Short feedback</span>
              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Write the main feedback you want to share."
                maxLength={1200}
                rows={5}
                required
              />
            </label>

            <label className={styles.reviewPage__field}>
              <span>Additional details</span>
              <textarea
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                placeholder="Optional. Add context, project details, or specific results."
                maxLength={5000}
                rows={5}
              />
            </label>

            {error && (
              <p className={styles.reviewPage__error}>
                <AlertTriangle size={15} />
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.reviewPage__submit}
              disabled={isSubmitting || feedback.trim().length < 3}
            >
              <Send size={16} />
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
            <p className={styles.reviewPage__finePrint}>
              This is a one-time submission. After sending, the link expires and only
              the admin can make edits.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}

function getContractTokenFromPath() {
  if (typeof window === "undefined") return "";
  const match = window.location.pathname.match(/^\/contracts\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : "";
}

export function ContractShareApp() {
  const token = getContractTokenFromPath();
  const [contract, setContract] = useState<PublicContract | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadContract = async () => {
      if (!token) {
        setError("This document link is invalid.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/public/contracts/${encodeURIComponent(token)}`,
        );
        const payload = (await response.json().catch(() => ({}))) as {
          data?: PublicContract;
          message?: string;
        };
        if (!response.ok || !payload.data) {
          throw new Error(payload.message || "This document link is unavailable.");
        }
        if (!cancelled) {
          setContract(payload.data);
          setFieldValues(payload.data.values ?? {});
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "This document link is unavailable.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadContract();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submitContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !contract || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `${API_BASE}/public/contracts/${encodeURIComponent(token)}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: fieldValues }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        data?: { values?: Record<string, string>; submittedAt?: string | null };
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message || "Failed to save document fields.");
      }
      setFieldValues(payload.data?.values ?? fieldValues);
      setContract((prev) =>
        prev
          ? {
              ...prev,
              values: payload.data?.values ?? fieldValues,
              submittedAt: payload.data?.submittedAt ?? new Date().toISOString(),
            }
          : prev,
      );
      setNotice("Your document fields have been saved.");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to save document fields.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={`${styles.reviewPage} ${styles.contractPage}`}>
      <section className={`${styles.reviewPage__panel} ${styles.contractPage__panel}`}>
        <div className={styles.reviewPage__header}>
          <span className={styles.reviewPage__icon}>
            <FileText size={24} />
          </span>
          <div>
            <p className={styles.reviewPage__eyebrow}>Document</p>
            <h1>{contract?.title ?? "Document Review"}</h1>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.reviewPage__loading}>
            <span />
            <span />
            <span />
          </div>
        ) : error || !contract ? (
          <div className={`${styles.reviewPage__status} ${styles["reviewPage__status--error"]}`}>
            <AlertTriangle size={32} />
            <h2>Document link unavailable</h2>
            <p>{error || "This document link is unavailable."}</p>
          </div>
        ) : (
          <form className={styles.contractPage__document} onSubmit={submitContract}>
            <div className={styles.reviewPage__client}>
              <span>Recipient</span>
              <strong>{contract.recipientName}</strong>
              <small>
                Created{" "}
                {new Date(contract.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </small>
            </div>
            <div className={styles.contractPage__content}>
              <ContractPdfViewer
                pdfUrl={contract.pdfDocument.fileUrl}
                fields={contract.fields}
                mode="fill"
                values={fieldValues}
                onValuesChange={setFieldValues}
              />
            </div>
            {error && (
              <p className={styles.reviewPage__error}>
                <AlertTriangle size={15} />
                {error}
              </p>
            )}
            {notice && (
              <p className={styles.contractPage__notice}>
                <CheckCircle2 size={15} />
                {notice}
              </p>
            )}
            <button
              type="submit"
              className={styles.reviewPage__submit}
              disabled={isSubmitting}
            >
              <Send size={16} />
              {isSubmitting ? "Saving..." : "Save Filled Fields"}
            </button>
            <p className={styles.reviewPage__finePrint}>
              You can complete only the fields added by the sender. The PDF and
              positioned objects cannot be moved or removed from this link.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [viewMode, setViewMode] = useState<"home" | "projects">("home");
  const [searchValue, setSearchValue] = useState("");
  const [projectsRequestedCategory, setProjectsRequestedCategory] = useState<string | null>(null);
  const [downloadCvSignal, setDownloadCvSignal] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [hasSnapped, setHasSnapped] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<CertificateItem | null>(null);
  const [activeWork, setActiveWork] = useState<string | null>(null);
  const [activeFeedback, setActiveFeedback] = useState<FeedbackItem | null>(null);
  const [activeSolutionInquiryType, setActiveSolutionInquiryType] =
    useState<SolutionInquiryType | null>(null);
  const [pendingServiceInquiryType, setPendingServiceInquiryType] =
    useState<SolutionInquiryType | null>(null);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const [galleryProjects, setGalleryProjects] = useState<GalleryProject[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProjectItem[]>([]);
  const [solutionCards, setSolutionCards] = useState<IntelligentSolutionItem[]>([]);
  const [bannerSections, setBannerSections] = useState<BannerSectionData[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [heroPanelIndex, setHeroPanelIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroRailRef = useRef<HTMLDivElement>(null);
  const certificateSectionRef = useRef<HTMLElement>(null);
  const workStepSectionRef = useRef<HTMLElement>(null);
  const toolsStepSectionRef = useRef<HTMLElement>(null);
  const autoSnapUnlockTimerRef = useRef<number | null>(null);
  const autoSnapLockedRef = useRef(false);
  const heroWheelLockedRef = useRef(false);
  const heroWheelUnlockTimerRef = useRef<number | null>(null);
  const [visibleWorkCardCount, setVisibleWorkCardCount] = useState(0);
  const [visibleToolGroupCount, setVisibleToolGroupCount] = useState(0);
  const [isCertificateContentVisible, setIsCertificateContentVisible] = useState(false);
  const roles = ["Software Developer", "AI Automation Specialist"];
  const certificateRowRef = useScrollReveal<HTMLDivElement>({
    selector: "[data-reveal='certificate-card']",
    visibleClass: styles["app__certificateCard--visible"],
  });
  const publicSectionsRef = useScrollReveal<HTMLDivElement>({
    selector: "[data-section-reveal]",
    visibleClass: styles.app__sectionRevealVisible,
    threshold: 0.12,
    rootMargin: "0px 0px -16% 0px",
  });
  const bannerImagesReady = useImagesReady(
    bannerSections.map((banner) => banner.image),
    contentLoaded && bannerSections.length > 0,
  );
  const certificateImagesReady = useImagesReady(
    certificates.map((certificate) => certificate.image),
    contentLoaded && certificates.length > 0,
  );
  const workImagesReady = useImagesReady(
    workExperiences.map((work) => work.image),
    contentLoaded && workExperiences.length > 0,
  );
  const showBannerSkeleton = !contentLoaded || !bannerImagesReady;
  const showCertificateSkeleton = !contentLoaded || !certificateImagesReady;
  const showWorkSkeleton = !contentLoaded || !workImagesReady;
  const showReviewsSection = !contentLoaded || feedbacks.length > 0;

  useEffect(() => {
    let frameId: number | null = null;
    const timeoutIds: number[] = [];

    const updateCertificateReveal = () => {
      frameId = null;

      const section = certificateSectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 1;
      const shouldShow =
        rect.top <= viewportHeight * 0.68 &&
        rect.bottom >= viewportHeight * 0.22;

      setIsCertificateContentVisible((current) =>
        current === shouldShow ? current : shouldShow,
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      frameId =
        typeof window.requestAnimationFrame === "function"
          ? window.requestAnimationFrame(updateCertificateReveal)
          : window.setTimeout(updateCertificateReveal, 16);
    };

    scheduleUpdate();
    [120, 360, 720].forEach((delay) => {
      timeoutIds.push(window.setTimeout(scheduleUpdate, delay));
    });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== null) {
        if (typeof window.cancelAnimationFrame === "function") {
          window.cancelAnimationFrame(frameId);
        } else {
          window.clearTimeout(frameId);
        }
      }
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  useEffect(() => {
    const visitorKey = getVisitorKey();
    void fetch(`${API_BASE}/public/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorKey,
        path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {
      // Analytics should not affect the public portfolio experience.
    });
  }, []);

  useEffect(() => {
    const cardCount = workExperiences.length;

    if (showWorkSkeleton || cardCount === 0) {
      setVisibleWorkCardCount(0);
      return;
    }

    if (typeof window.matchMedia !== "function") {
      setVisibleWorkCardCount(cardCount);
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowScreenQuery = window.matchMedia("(max-width: 899px)");
    let frameId: number | null = null;

    const getImmediateCount = () =>
      reducedMotionQuery.matches || narrowScreenQuery.matches ? cardCount : null;

    const addMediaQueryListener = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", scheduleUpdate);
        return;
      }
      if (typeof query.addListener === "function") {
        query.addListener(scheduleUpdate);
      }
    };

    const removeMediaQueryListener = (query: MediaQueryList) => {
      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", scheduleUpdate);
        return;
      }
      if (typeof query.removeListener === "function") {
        query.removeListener(scheduleUpdate);
      }
    };

    const updateVisibleCards = () => {
      frameId = null;

      const immediateCount = getImmediateCount();
      if (immediateCount !== null) {
        setVisibleWorkCardCount(immediateCount);
        return;
      }

      const section = workStepSectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const scrollRange = Math.max(1, section.offsetHeight - viewportHeight);
      const rawProgress = -rect.top / scrollRange;
      const progress = Math.min(1, Math.max(0, rawProgress));
      const nextCount =
        rawProgress <= 0
          ? 0
          : Math.min(cardCount, Math.ceil(progress * cardCount));

      setVisibleWorkCardCount((currentCount) =>
        currentCount === nextCount ? currentCount : nextCount,
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      const requestFrame =
        window.requestAnimationFrame ??
        ((callback: FrameRequestCallback) => window.setTimeout(callback, 16));
      frameId = requestFrame(updateVisibleCards);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    addMediaQueryListener(reducedMotionQuery);
    addMediaQueryListener(narrowScreenQuery);
    const intervalId = window.setInterval(scheduleUpdate, 120);

    return () => {
      if (frameId !== null) {
        const cancelFrame =
          window.cancelAnimationFrame ??
          ((handle: number) => window.clearTimeout(handle));
        cancelFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      removeMediaQueryListener(reducedMotionQuery);
      removeMediaQueryListener(narrowScreenQuery);
      window.clearInterval(intervalId);
    };
  }, [showWorkSkeleton, workExperiences.length]);

  useEffect(() => {
    const groupCount = essentialToolGroups.length;

    if (groupCount === 0) {
      setVisibleToolGroupCount(0);
      return;
    }

    if (typeof window.matchMedia !== "function") {
      setVisibleToolGroupCount(groupCount);
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowScreenQuery = window.matchMedia("(max-width: 980px)");
    let frameId: number | null = null;

    const getImmediateCount = () =>
      reducedMotionQuery.matches || narrowScreenQuery.matches
        ? groupCount
        : null;
    const syncToolGroups = (nextCount: number) => {
      const section = toolsStepSectionRef.current;
      if (!section) return;

      section
        .querySelectorAll<HTMLElement>("[data-tool-curtain-open]")
        .forEach((group, index) => {
          const isOpen = index < nextCount;
          group.dataset.toolCurtainOpen = isOpen ? "true" : "false";
          group.classList.toggle(styles["app__toolsGroup--curtainOpen"], isOpen);
        });
    };
    const addMediaQueryListener = (query: MediaQueryList) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", scheduleUpdate);
        return;
      }
      if (typeof query.addListener === "function") {
        query.addListener(scheduleUpdate);
      }
    };
    const removeMediaQueryListener = (query: MediaQueryList) => {
      if (typeof query.removeEventListener === "function") {
        query.removeEventListener("change", scheduleUpdate);
        return;
      }
      if (typeof query.removeListener === "function") {
        query.removeListener(scheduleUpdate);
      }
    };

    const updateVisibleGroups = () => {
      frameId = null;

      const immediateCount = getImmediateCount();
      if (immediateCount !== null) {
        syncToolGroups(immediateCount);
        setVisibleToolGroupCount(immediateCount);
        return;
      }

      const section = toolsStepSectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const scrollRange = Math.max(1, section.offsetHeight - viewportHeight);
      const rawProgress = -rect.top / scrollRange;
      const progress = Math.min(1, Math.max(0, rawProgress));
      const nextCount =
        rawProgress <= 0
          ? 0
          : Math.min(groupCount, Math.ceil(progress * groupCount));

      syncToolGroups(nextCount);
      setVisibleToolGroupCount((currentCount) =>
        currentCount === nextCount ? currentCount : nextCount,
      );
    };

    const scheduleUpdate = () => {
      if (frameId !== null) return;
      const requestFrame =
        window.requestAnimationFrame ??
        ((callback: FrameRequestCallback) => window.setTimeout(callback, 16));
      frameId = requestFrame(updateVisibleGroups);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    addMediaQueryListener(reducedMotionQuery);
    addMediaQueryListener(narrowScreenQuery);
    const intervalId = window.setInterval(scheduleUpdate, 120);

    return () => {
      if (frameId !== null) {
        const cancelFrame =
          window.cancelAnimationFrame ??
          ((handle: number) => window.clearTimeout(handle));
        cancelFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      removeMediaQueryListener(reducedMotionQuery);
      removeMediaQueryListener(narrowScreenQuery);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      void reportFrontendError({
        message: event.message || "Unhandled frontend error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
        details: `${event.filename || "unknown file"}:${event.lineno}:${event.colno}`,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      void reportFrontendError({
        message:
          reason instanceof Error
            ? reason.message
            : typeof reason === "string"
              ? reason
              : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : undefined,
        details: reason instanceof Error ? reason.name : stringifyErrorDetails(reason),
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  const handleProjectsToggle = () => {
    setProjectsRequestedCategory(null);
    setViewMode((prev) => (prev === "projects" ? "home" : "projects"));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProjectsBack = () => {
    setProjectsRequestedCategory(null);
    setViewMode("home");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLogoClick = () => {
    setProjectsRequestedCategory(null);
    setViewMode("home");
    setPendingSection(null);
    lockAutoSnapTemporarily();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const lockAutoSnapTemporarily = (durationMs = 4000) => {
    if (typeof window === "undefined") return;
    autoSnapLockedRef.current = true;
    if (autoSnapUnlockTimerRef.current !== null) {
      window.clearTimeout(autoSnapUnlockTimerRef.current);
    }
    autoSnapUnlockTimerRef.current = window.setTimeout(() => {
      autoSnapLockedRef.current = false;
      autoSnapUnlockTimerRef.current = null;
    }, durationMs);
  };

  const handleNavigateToSection = (id: string) => {
    lockAutoSnapTemporarily();
    setPendingServiceInquiryType(null);
    setPendingSection(id);
    if (viewMode !== "home") {
      setViewMode("home");
    }
  };

  const handleServiceSelect = (inquiryType: SolutionInquiryType) => {
    lockAutoSnapTemporarily();
    setPendingServiceInquiryType(inquiryType);
    setPendingSection("services");
    if (viewMode !== "home") {
      setViewMode("home");
    }
  };

  const handleHeroDownloadCv = () => {
    setDownloadCvSignal((prev) => prev + 1);
  };

  const handleHeroSeeFeatured = () => {
    lockAutoSnapTemporarily();
    const target = contentRef.current || document.getElementById("featured-projects");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleHeroSendEmail = () => {
    handleNavigateToSection("contacts");
    const contactsSection = document.getElementById("contacts");
    if (!contactsSection) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    }
  };

  const handleHeroAutomationProjects = () => {
    setProjectsRequestedCategory("Automation");
    setViewMode("projects");
    scrollToProjectsPageOffset();
  };

  const handleHeroExploreSolutions = () => {
    setProjectsRequestedCategory(null);
    setViewMode("projects");
    scrollToProjectsPageOffset();
  };

  const scrollToProjectsPageOffset = () => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 800, behavior: "smooth" });
      });
    });
  };

  const handleHeroPointerMove = (event: PointerEvent<HTMLElement>) => {
    const section = heroSectionRef.current;
    if (!section || event.pointerType === "touch") return;
    const rect = section.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    section.style.setProperty("--hero-cursor-x", `${xPercent}%`);
    section.style.setProperty("--hero-cursor-y", `${yPercent}%`);
    section.style.setProperty("--hero-pattern-shift-x", `${(xPercent - 50) * 0.18}px`);
    section.style.setProperty("--hero-pattern-shift-y", `${(yPercent - 50) * 0.18}px`);
  };

  const handleHeroPointerLeave = () => {
    const section = heroSectionRef.current;
    if (!section) return;
    section.style.setProperty("--hero-pattern-shift-x", "0px");
    section.style.setProperty("--hero-pattern-shift-y", "0px");
  };

  const scrollHeroPanel = (index: number) => {
    const rail = heroRailRef.current;
    if (!rail) return;
    const boundedIndex = Math.max(0, Math.min(2, index));
    rail.scrollTo({
      left: rail.clientWidth * boundedIndex,
      behavior: "smooth",
    });
    setHeroPanelIndex(boundedIndex);
  };

  const handleHeroRailScroll = () => {
    const rail = heroRailRef.current;
    if (!rail) return;
    const nextIndex = Math.round(rail.scrollLeft / Math.max(rail.clientWidth, 1));
    setHeroPanelIndex(Math.max(0, Math.min(2, nextIndex)));
  };

  const handleHeroWheel = (event: WheelEvent) => {
    const rail = heroRailRef.current;
    if (!rail || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    const atStart = rail.scrollLeft <= 2;
    const atEnd = rail.scrollLeft >= maxScrollLeft - 2;

    if ((event.deltaY < 0 && atStart) || (event.deltaY > 0 && atEnd)) {
      return;
    }

    event.preventDefault();
    if (heroWheelLockedRef.current) return;

    const currentIndex = Math.round(rail.scrollLeft / Math.max(rail.clientWidth, 1));
    const nextIndex = Math.max(0, Math.min(2, currentIndex + (event.deltaY > 0 ? 1 : -1)));
    if (nextIndex === currentIndex) return;

    heroWheelLockedRef.current = true;
    scrollHeroPanel(nextIndex);

    if (heroWheelUnlockTimerRef.current !== null) {
      window.clearTimeout(heroWheelUnlockTimerRef.current);
    }
    heroWheelUnlockTimerRef.current = window.setTimeout(() => {
      heroWheelLockedRef.current = false;
      heroWheelUnlockTimerRef.current = null;
    }, 620);
  };

  useEffect(() => {
    if (viewMode !== "home") return;
    const section = heroSectionRef.current;
    if (!section) return;

    const wheelOptions: AddEventListenerOptions = {
      passive: false,
      capture: true,
    };

    section.addEventListener("wheel", handleHeroWheel, wheelOptions);
    return () => {
      section.removeEventListener("wheel", handleHeroWheel, wheelOptions);
    };
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "home" || !pendingSection) return;
    const targetId = pendingSection;
    const inquiryTypeToOpen =
      targetId === "services" ? pendingServiceInquiryType : null;
    setPendingSection(null);
    setPendingServiceInquiryType(null);
    window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.location.hash = `#${targetId}`;
      }

      if (inquiryTypeToOpen) {
        window.setTimeout(() => {
          setActiveSolutionInquiryType(inquiryTypeToOpen);
        }, 520);
      }
    }, 0);
  }, [viewMode, pendingSection, pendingServiceInquiryType]);

  useEffect(() => {
    return () => {
      if (autoSnapUnlockTimerRef.current !== null) {
        window.clearTimeout(autoSnapUnlockTimerRef.current);
      }
      if (heroWheelUnlockTimerRef.current !== null) {
        window.clearTimeout(heroWheelUnlockTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchPublicData = async () => {
      try {
        const [
          projectsResponse,
          servicesResponse,
          bannersResponse,
          workExperiencesResponse,
          certificatesResponse,
          reviewsResponse,
        ] =
          await Promise.all([
            fetch(`${API_BASE}/public/projects`),
            fetch(`${API_BASE}/public/services`),
            fetch(`${API_BASE}/public/banners`),
            fetch(`${API_BASE}/public/work-experiences`),
            fetch(`${API_BASE}/public/certificates`),
            fetch(`${API_BASE}/public/reviews`),
          ]);

        ([
          ["projects", projectsResponse],
          ["services", servicesResponse],
          ["banners", bannersResponse],
          ["work experiences", workExperiencesResponse],
          ["certificates", certificatesResponse],
          ["reviews", reviewsResponse],
        ] as const).forEach(([name, response]) => {
          if (!response.ok) {
            void reportFrontendError({
              message: `Public ${name} API returned ${response.status}`,
              details: response.statusText,
            });
          }
        });

        const [
          projectsPayload,
          servicesPayload,
          bannersPayload,
          workExperiencesPayload,
          certificatesPayload,
          reviewsPayload,
        ] =
          await Promise.all([
            projectsResponse.json().catch(() => ({})),
            servicesResponse.json().catch(() => ({})),
            bannersResponse.json().catch(() => ({})),
            workExperiencesResponse.json().catch(() => ({})),
            certificatesResponse.json().catch(() => ({})),
            reviewsResponse.json().catch(() => ({})),
          ]);

        if (cancelled) return;

        const apiProjects = parseListResponse<PublicProject>(projectsPayload);
        const apiServices = parseListResponse<PublicService>(servicesPayload);
        const apiBanners = parseListResponse<PublicBanner>(bannersPayload);
        const apiWorkExperiences =
          parseListResponse<PublicWorkExperience>(workExperiencesPayload);
        const apiCertificates = parseListResponse<PublicCertificate>(certificatesPayload);
        const apiReviews = parseListResponse<PublicReview>(reviewsPayload);

        const mappedGalleryProjects = apiProjects.map(mapProjectToGallery);
        const mappedFeaturedProjects: FeaturedProjectItem[] = mappedGalleryProjects
          .filter((project) => project.isFeatured)
          .slice(0, 3)
          .map((project) => ({
            id: project.id,
            label: project.title,
            tag: project.category,
            image: getProjectThumbnail(project, "portrait"),
            images: project.images,
            description: project.description,
            details: project.details,
            status: project.status,
            tools: project.tags,
            highlights: project.highlights,
          }));

        const mappedSolutionCards: IntelligentSolutionItem[] = apiServices
          .slice(0, 3)
          .map((service, index) => ({
            id: toSectionId(service.name || `service-${index + 1}`),
            title: service.name,
            subtitle:
              service.subtitle ||
              "Tailored delivery focused on speed, quality, and measurable results.",
          }));

        const mappedBannerSections: BannerSectionData[] = apiBanners.map((banner, index) => ({
          id: toSectionId(banner.title || `banner-${index + 1}`),
          title: banner.title,
          subtitle: banner.subtitle,
          image:
            banner.imageUrl ||
            bannerFallbackImages[index % bannerFallbackImages.length],
        }));

        const mappedWorkExperiences: WorkExperienceItem[] = apiWorkExperiences.map(
          (workExperience, index) => ({
            id: workExperience.id,
            company: workExperience.company,
            role: workExperience.role,
            duration: workExperience.duration,
            location: workExperience.location,
            image:
              workExperience.imageUrl ||
              bannerFallbackImages[index % bannerFallbackImages.length],
            summary: workExperience.summary,
            highlights: normalizeStringList(workExperience.highlights, [
              "Details will be available soon.",
            ]),
          }),
        );

        const mappedCertificates: CertificateItem[] = apiCertificates.map(
          (certificate, index) => ({
            id: certificate.id,
            org: certificate.org,
            title: certificate.title,
            description: certificate.description,
            image:
              certificate.imageUrl ||
              certificateFallbackImages[index % certificateFallbackImages.length],
          }),
        );

        const mappedReviews: FeedbackItem[] = apiReviews.map((review) => ({
          id: review.id,
          name: review.name,
          role: review.role || "Client",
          rating: Math.min(5, Math.max(1, review.rating)),
          avatar: review.avatar || getInitials(review.name) || "CL",
          feedback: review.feedback,
          detail: review.detail || review.feedback,
        }));

        setGalleryProjects(mappedGalleryProjects);
        setFeaturedProjects(mappedFeaturedProjects);
        setSolutionCards(mappedSolutionCards);
        setBannerSections(mappedBannerSections);
        setWorkExperiences(mappedWorkExperiences);
        setCertificates(mappedCertificates);
        setFeedbacks(mappedReviews);
      } catch (error) {
        if (cancelled) return;
        void reportFrontendError({
          message: error instanceof Error ? error.message : "Failed to load public content.",
          stack: error instanceof Error ? error.stack : undefined,
          details: "Public content bootstrap failed.",
        });
        setGalleryProjects([]);
        setFeaturedProjects([]);
        setSolutionCards([]);
        setBannerSections([]);
        setWorkExperiences([]);
        setCertificates([]);
        setFeedbacks([]);
      } finally {
        if (!cancelled) {
          setContentLoaded(true);
        }
      }
    };

    void fetchPublicData();
    return () => {
      cancelled = true;
    };
  }, []);

  const serviceLinks = useMemo(() => {
    const inquiryTypes: SolutionInquiryType[] = [
      "operations",
      "business-systems",
      "ai-automation",
    ];
    const fallbackLabels = [
      "Internal Tools, Data Processing & Operations Support",
      "Custom Mobile & Web Business Systems",
      "AI Workflow Automation & Process Integration",
    ];

    return inquiryTypes.map((inquiryType, index) => ({
      id: `service-${inquiryType}`,
      label: solutionCards[index]?.title || fallbackLabels[index],
      inquiryType,
    }));
  }, [solutionCards]);

  // Handle scroll position (container if present, otherwise window)
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle theme toggle
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Calculate scroll progress (0 to 1 based on viewport height)
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 1000;
  const scrollProgress = Math.min(scrollY / viewportHeight, 1);
  const showSearchInHeader = scrollProgress > 0.3;
  const blurAmount = Math.min(scrollY / 80, 12);
  const overlayOpacity = Math.max(1 - scrollProgress * 0.5, 0.5);

  // Auto-snap from top to content once user scrolls ~80% viewport
  useEffect(() => {
    if (viewMode !== "home") return;
    if (typeof window === "undefined") return;
    if (autoSnapLockedRef.current) return;
    const vh = viewportHeight;

    if (!hasSnapped && scrollY >= vh * 0.8 && scrollY < vh * 1.5) {
      const target = contentRef.current;
      if (target) {
        window.scrollTo({
          top: target.offsetTop,
          behavior: "smooth",
        });
      }
      setHasSnapped(true);
    }

    if (hasSnapped && scrollY < vh * 0.2) {
      setHasSnapped(false);
    }
  }, [scrollY, hasSnapped, viewportHeight, viewMode]);

  const [roleIndex, setRoleIndex] = useState(0);
  const heroToolBadges = useMemo<HeroToolBadge[]>(() => {
    const tools = [
      {
        name: "React",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
      },
      {
        name: "Flutter",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
      },
      {
        name: "Firebase",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg",
      },
      {
        name: "Node.js",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
      },
      {
        name: "WordPress",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg",
      },
      {
        name: "Figma",
        icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
      },
    ];
    const isFaceZone = (left: number, top: number) =>
      left >= 38 && left <= 70 && top >= 12 && top <= 42;
    const withinFrontSafeArea = (left: number, top: number) =>
      !isFaceZone(left, top) && (top >= 46 || left <= 30 || left >= 76);
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const shuffledTools = tools
      .map((tool) => ({ ...tool, order: Math.random() }))
      .sort((a, b) => a.order - b.order);

    const frontCount = Math.floor(tools.length / 2);

    return shuffledTools.map((tool, index) => {
      const layer: HeroToolBadge["layer"] = index < frontCount ? "front" : "back";
      let left = 50;
      let top = 50;

      for (let attempt = 0; attempt < 18; attempt += 1) {
        const candidateLeft = rand(12, 88);
        const candidateTop = rand(12, 86);
        const isValid =
          layer === "front"
            ? withinFrontSafeArea(candidateLeft, candidateTop)
            : true;
        if (isValid) {
          left = candidateLeft;
          top = candidateTop;
          break;
        }
      }

      const size = layer === "front" ? rand(52, 68) : rand(48, 62);
      const duration = rand(4.2, 6.3);
      const delay = rand(0, 1.8);
      const hoverX = rand(-10, 10);
      const hoverY = rand(-10, 10);
      const floatY = rand(6, 12);

      return {
        ...tool,
        layer,
        left,
        top,
        size,
        duration,
        delay,
        hoverX,
        hoverY,
        floatY,
      };
    });
  }, []);
  return (
    <div className={styles.app}>
        <AppHeader
          theme={theme}
          onThemeToggle={toggleTheme}
          showSearchInHeader={showSearchInHeader}
          showSearchToggle
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onLogoClick={handleLogoClick}
          onProjectsToggle={handleProjectsToggle}
          onNavigateToSection={handleNavigateToSection}
          onServiceSelect={handleServiceSelect}
          isProjectsView={viewMode === "projects"}
          serviceLinks={serviceLinks}
          downloadCvSignal={downloadCvSignal}
          showReviewsLink={showReviewsSection}
        />

      {viewMode === "projects" ? (
        <ProjectsGallery
          onBack={handleProjectsBack}
          projects={galleryProjects}
          requestedCategory={projectsRequestedCategory}
          isLoading={!contentLoaded}
        />
      ) : (
        <div className={styles.app__publicPage} ref={publicSectionsRef}>
      {/* Hero Section */}
      <section
        ref={heroSectionRef}
        className={`${styles["app__section"]} ${styles["app__section--hero"]}`}
        onPointerMove={handleHeroPointerMove}
        onPointerLeave={handleHeroPointerLeave}
      >
        <div aria-hidden="true" className={styles.app__heroBackdrop} />
        <div aria-hidden="true" className={styles.app__heroCursorPattern} />
        <div
          ref={heroRailRef}
          className={styles.app__heroSnapViewport}
          onScroll={handleHeroRailScroll}
          aria-label="Business value hero carousel"
        >
          <article
            className={`${styles.app__heroSnapPanel} ${styles["app__heroSnapPanel--intro"]}`}
          >
            <div className={styles.app__heroIntro}>
              <div className={styles.app__heroIntroCopy}>
                <p className={styles.app__heroIntroEyebrow}>Ready when your workflow is</p>
                <div
                  className={styles.app__heroText}
                  style={{
                    filter: `blur(${blurAmount}px)`,
                    opacity: overlayOpacity,
                  }}
                >
                  <p className={styles.app__heroTitle}>Hi, I&apos;m Archie</p>
                  <p className={styles.app__heroSubtitle}>
                    <span
                      key={roleIndex}
                      className={styles.app__heroSubtitleText}
                      onAnimationEnd={() =>
                        setRoleIndex((prev) => (prev + 1) % roles.length)
                      }
                    >
                      {roles[roleIndex]}
                    </span>
                  </p>
                </div>
                <p className={styles.app__heroIntroDescription}>
                  I build AI automations, web apps, and mobile systems that turn scattered
                  business steps into clear, usable tools.
                </p>
                <div className={styles.app__heroIntroActions}>
                  <button
                    type="button"
                    className={`${styles.app__heroIntroButton} ${styles["app__heroIntroButton--primary"]}`}
                    onClick={handleHeroDownloadCv}
                  >
                    <Download aria-hidden="true" />
                    Download CV
                  </button>
                  <button
                    type="button"
                    className={styles.app__heroIntroButton}
                    onClick={handleHeroSeeFeatured}
                  >
                    <FolderOpen aria-hidden="true" />
                    Featured work
                  </button>
                  <button
                    type="button"
                    className={styles.app__heroIntroIconButton}
                    onClick={handleHeroSendEmail}
                    aria-label="Go to contact section"
                  >
                    <Mail aria-hidden="true" />
                  </button>
                </div>
              </div>

            </div>
            <div className={styles.app__heroPlane} aria-hidden="true">
              <div className={`${styles.app__heroToolOrbit} ${styles["app__heroToolOrbit--back"]}`}>
                {heroToolBadges
                  .filter((badge) => badge.layer === "back")
                  .map((badge) => {
                    const style = {
                      left: `${badge.left}%`,
                      top: `${badge.top}%`,
                      width: `${badge.size}px`,
                      height: `${badge.size}px`,
                      animationDuration: `${badge.duration}s`,
                      animationDelay: `${badge.delay}s`,
                      "--hover-x": `${badge.hoverX}px`,
                      "--hover-y": `${badge.hoverY}px`,
                      "--float-y": `${badge.floatY}px`,
                    } as CSSProperties;

                    return (
                      <span
                        key={`back-${badge.name}`}
                        className={styles.app__heroToolBadge}
                        style={style}
                      >
                        <span className={styles.app__heroToolBadgeFloat}>
                          <img
                            src={badge.icon}
                            alt=""
                            className={styles.app__heroToolIcon}
                            loading="lazy"
                          />
                        </span>
                      </span>
                    );
                  })}
              </div>
              <img
                src={heroProfileCutout}
                alt=""
                className={styles.app__heroPlaneImage}
                loading="eager"
              />
              <div className={styles.app__heroPlaneLottie} aria-hidden="true">
                <Lottie
                  animationData={heroVisual1}
                  loop
                  autoplay
                  className={styles.app__heroPlaneLottieInner}
                />
              </div>
              <div className={`${styles.app__heroToolOrbit} ${styles["app__heroToolOrbit--front"]}`}>
                {heroToolBadges
                  .filter((badge) => badge.layer === "front")
                  .map((badge) => {
                    const style = {
                      left: `${badge.left}%`,
                      top: `${badge.top}%`,
                      width: `${badge.size}px`,
                      height: `${badge.size}px`,
                      animationDuration: `${badge.duration}s`,
                      animationDelay: `${badge.delay}s`,
                      "--hover-x": `${badge.hoverX}px`,
                      "--hover-y": `${badge.hoverY}px`,
                      "--float-y": `${badge.floatY}px`,
                    } as CSSProperties;

                    return (
                      <span
                        key={`front-${badge.name}`}
                        className={styles.app__heroToolBadge}
                        style={style}
                      >
                        <span className={styles.app__heroToolBadgeFloat}>
                          <img
                            src={badge.icon}
                            alt=""
                            className={styles.app__heroToolIcon}
                            loading="lazy"
                          />
                        </span>
                      </span>
                    );
                  })}
              </div>
            </div>
          </article>

          {heroPitchPanels.map((panel, index) => {
            const panelVisual = heroPitchVisuals[index] ?? heroPitchVisuals[0];
            return (
            <article
              key={panel.eyebrow}
              className={`${styles.app__heroSnapPanel} ${styles["app__heroSnapPanel--pitch"]}`}
            >
              <div className={styles.app__heroPitch}>
                <div className={styles.app__heroPitchCopy}>
                  <p className={styles.app__heroPitchEyebrow}>{panel.eyebrow}</p>
                  <h1 className={styles.app__heroPitchTitle}>{panel.title}</h1>
                  <p className={styles.app__heroPitchDescription}>{panel.description}</p>
                  <div className={styles.app__heroPitchProofs}>
                    {panel.proof.map((proof) => (
                      <span key={proof} className={styles.app__heroPitchProof}>
                        <CheckCircle2 aria-hidden="true" />
                        {proof}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.app__heroPitchCta}
                    onClick={
                      index === 0
                        ? handleHeroAutomationProjects
                        : handleHeroExploreSolutions
                    }
                  >
                    {panel.actionLabel}
                  </button>
                </div>
                <div className={styles.app__heroPitchVisualSlot} aria-hidden="true">
                  <Lottie
                    animationData={panelVisual}
                    loop
                    autoplay
                    className={styles.app__heroPitchLottie}
                  />
                </div>
              </div>
            </article>
            );
          })}
        </div>

        <div className={styles.app__heroSnapDots} aria-label="Hero panel navigation">
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              className={`${styles.app__heroSnapDot} ${
                heroPanelIndex === index ? styles["app__heroSnapDot--active"] : ""
              }`}
              onClick={() => scrollHeroPanel(index)}
              aria-label={`Show hero panel ${index + 1}`}
              aria-current={heroPanelIndex === index ? "true" : undefined}
            />
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section
        id="featured-projects"
        ref={contentRef}
        className={`${styles.app__section} ${styles.app__sectionReveal}`}
        data-section-reveal="true"
      >
        <div className={styles.app__sectionInner}>
          <div className={styles.app__content}>
            <FeaturedProjects
              projects={featuredProjects}
              isLoading={!contentLoaded}
              onViewAllProjects={handleHeroExploreSolutions}
            />
          </div>
        </div>
      </section>

      {/* Intelligent IT Solutions */}
      <section
        className={`${styles.app__section} ${styles.app__sectionReveal} ${styles["app__section--solutionSteps"]}`}
        id="services"
        data-section-reveal="true"
        data-solution-step-section="true"
        style={
          {
            "--solution-step-scroll": `${Math.max(solutionCards.length || 3, 1) * 180}px`,
          } as CSSProperties
        }
      >
        <div className={styles.app__sectionInner}>
          <div className={styles.app__content}>
            <IntelligentSolutions
              services={solutionCards}
              isLoading={!contentLoaded}
              activeInquiryType={activeSolutionInquiryType}
              onInquiryTypeChange={setActiveSolutionInquiryType}
            />
          </div>
        </div>
      </section>

      {showBannerSkeleton ? (
        <>
          {Array.from({ length: Math.max(1, bannerSections.length) }).map((_, index) => (
            <BannerSectionSkeleton key={`banner-skeleton-${index}`} />
          ))}
        </>
      ) : bannerSections.length === 0 ? (
        <section
          className={`${styles.app__section} ${styles["app__section--service"]} ${styles.app__sectionReveal}`}
          data-section-reveal="true"
        >
          <div className={styles.app__sectionInner}>
            <div className={styles.app__content}>
              <p className={styles.app__sectionEmpty}>
                No banners available yet.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <BannerStack banners={bannerSections} />
      )}

      {/* Certificates */}
      <section
        ref={certificateSectionRef}
        className={`${styles.app__section} ${styles["app__section--certificates"]} ${styles.app__sectionReveal}`}
        id="certificates"
        data-section-reveal="true"
      >
        <div className={styles.app__sectionInner}>
          <div
            className={`${styles.app__content} ${styles.app__certificateScrollMotion} ${
              isCertificateContentVisible
                ? styles["app__certificateScrollMotion--visible"]
                : ""
            }`}
          >
            <div className={styles.app__certificateShowcase}>
              <div className={styles.app__certificateHeading}>
                <div className={styles.app__certificateHeadingCopy}>
                  <p className={styles.app__certificateEyebrow}>Verified Learning</p>
                  <h2>Certificates</h2>
                  <p className={styles.app__sectionSubtitle}>
                    Verified credentials and achievements from recent programs.
                  </p>
                </div>
              </div>
            </div>
            <div
              className={styles.app__certificateRow}
              ref={certificateRowRef}
              aria-busy={showCertificateSkeleton}
            >
              {showCertificateSkeleton ? (
                <CertificateSkeletonGrid />
              ) : (
                certificates.map((cert, index) => (
                  <button
                    type="button"
                    key={cert.id}
                    data-reveal="certificate-card"
                    className={`${styles.app__certificateCard} ${
                      index % 2 === 0
                        ? styles["app__certificateCard--from-left"]
                        : styles["app__certificateCard--from-right"]
                    } ${styles["app__certificateCard--visible"]} ${styles.app__certificateCardButton}`}
                    onClick={() => setActiveCertificate(cert)}
                    aria-label={`Open ${cert.title}`}
                  >
                    <div className={styles.app__certificateMedia}>
                      <img
                        src={cert.image}
                        alt={cert.title}
                        className={styles.app__certificateImage}
                        loading="lazy"
                      />
                      <span className={styles.app__certificateCue}>View credential</span>
                    </div>
                    <div className={styles.app__certificateMeta}>
                      <p className={styles.app__certificateOrg}>{cert.org}</p>
                      <p className={styles.app__certificateTitle}>{cert.title}</p>
                      <p className={styles.app__certificateDescription}>
                        {cert.description}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
            {!showCertificateSkeleton && certificates.length === 0 && (
              <p className={styles.app__sectionEmpty}>
                No certificates published yet.
              </p>
            )}
            <Dialog
              open={!!activeCertificate}
              onOpenChange={(open: boolean) => {
                if (!open) setActiveCertificate(null);
              }}
            >
              {activeCertificate && (
                <DialogContent className={styles.app__certificateDialog}>
                  <div className={styles.app__certificateDialogBody}>
                    <div className={styles.app__certificateDialogGallery}>
                      <div className={styles.app__certificateDialogMain}>
                        <img
                          src={activeCertificate.image}
                          alt={activeCertificate.title}
                          className={styles.app__certificateDialogImage}
                        />
                      </div>
                    </div>
                    <div className={styles.app__certificateDialogContent}>
                      <DialogHeader className={styles.app__certificateDialogHeader}>
                        <DialogTitle>{activeCertificate.title}</DialogTitle>
                        <DialogDescription>{activeCertificate.org}</DialogDescription>
                      </DialogHeader>
                      <p className={styles.app__certificateDialogText}>
                        {activeCertificate.description}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </section>

      {/* Essential Tools */}
      <section
        ref={toolsStepSectionRef}
        className={`${styles.app__section} ${styles["app__section--tools"]} ${styles["app__section--toolSteps"]} ${styles.app__sectionReveal}`}
        id="tools"
        data-section-reveal="true"
        style={
          {
            "--tool-step-scroll": `${Math.max(essentialToolGroups.length, 1) * 180}px`,
          } as CSSProperties
        }
      >
        <div className={styles.app__sectionInner}>
          <div className={styles.app__content}>
            <div className={styles.app__toolsShell}>
              <div className={styles.app__toolsTopline}>
                <div
                  className={`${styles.app__sectionHeader} ${styles["app__sectionHeader--left"]} ${styles.app__toolsHeader}`}
                >
                  <span className={styles.app__toolsEyebrow}>Working stack</span>
                  <h2>Essential Tools</h2>
                  <p className={styles.app__sectionSubtitle}>
                    A focused stack for turning ideas into polished visuals,
                    practical automation, and production-ready web experiences.
                  </p>
                </div>
              </div>

              <div className={styles.app__toolsBoard}>
                {essentialToolGroups.map((group, index) => {
                  const GroupIcon = group.icon;
                  const isGroupOpen = index < visibleToolGroupCount;

                  return (
                    <article
                      key={group.title}
                      className={`${styles.app__toolsGroup} ${
                        isGroupOpen ? styles["app__toolsGroup--curtainOpen"] : ""
                      }`}
                      data-tool-curtain-open={isGroupOpen ? "true" : "false"}
                      style={{ "--tools-accent": group.accent } as CSSProperties}
                    >
                      <div className={styles.app__toolsGroupHeader}>
                        <span className={styles.app__toolsGroupIcon} aria-hidden="true">
                          <GroupIcon size={20} strokeWidth={2.2} />
                        </span>
                        <div>
                          <h3>{group.title}</h3>
                          <p>{group.description}</p>
                        </div>
                        <span className={styles.app__toolsCount}>{group.tools.length}</span>
                      </div>
                      <div className={styles.app__toolsList}>
                        {group.tools.map((tool) => (
                          <div key={tool.name} className={styles.app__toolItem}>
                            <span className={styles.app__toolIconWrap}>
                              <img
                                src={tool.icon}
                                alt=""
                                className={styles.app__toolIcon}
                                loading="lazy"
                                aria-hidden="true"
                              />
                            </span>
                            <span>{tool.name}</span>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section
        ref={workStepSectionRef}
        className={`${styles.app__section} ${styles["app__section--workSteps"]} ${styles.app__sectionReveal}`}
        id="experience"
        data-section-reveal="true"
        style={
          {
            "--work-step-scroll": `${Math.max(workExperiences.length || 3, 1) * 180}px`,
          } as CSSProperties
        }
      >
        <div className={styles.app__sectionInner}>
          <div className={`${styles.app__content} ${styles.app__experienceShowcase}`}>
            <div className={styles.app__experienceHeader}>
              <div className={styles.app__experienceHeaderCopy}>
                <p className={styles.app__experienceEyebrow}>Career timeline</p>
                <h2>Combined Professional Experience</h2>
                <p className={styles.app__sectionSubtitle}>
                  Years of hands-on experience delivering high-quality, competitive solutions backed by a strong and adaptable skill set built to thrive in a dynamic market.
                </p>
              </div>
            </div>
            <div
              className={styles.app__workRow}
              aria-busy={showWorkSkeleton}
            >
              {showWorkSkeleton ? (
                <WorkSkeletonRow />
              ) : (
                workExperiences.map((work, index) => (
                  <button
                    key={work.id}
                    type="button"
                    data-reveal="work-card"
                    data-work-card-visible={index < visibleWorkCardCount}
                    className={`${styles.app__workCard} ${
                      index < visibleWorkCardCount
                        ? styles["app__workCard--visible"]
                        : ""
                    } ${styles.app__workCardButton}`}
                    tabIndex={index < visibleWorkCardCount ? undefined : -1}
                    aria-hidden={index < visibleWorkCardCount ? undefined : true}
                    onClick={() => setActiveWork(work.id)}
                  >
                    <div className={styles.app__workCardTop}>
                      <div className={styles.app__companyLogo}>
                        <img src={work.image} alt={`${work.company} logo`} className={styles.app__companyLogoImg} />
                      </div>
                      <span className={styles.app__workIndex}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className={styles.app__workRoleStack}>
                      <div className={styles.app__workCompany}>{work.company}</div>
                      <h3 className={styles.app__workRole}>{work.role}</h3>
                      <span className={styles.app__workDuration}>{work.duration}</span>
                    </div>
                    <p className={styles.app__workLocation}>
                      <MapPin className={styles.app__workLocationIcon} />
                      {work.location}
                    </p>
                    <p className={styles.app__workDescription}>
                      {work.summary}
                    </p>
                    <span className={styles.app__workReadMore}>
                      View details
                      <ChevronRight className={styles.app__workReadMoreIcon} />
                    </span>
                  </button>
                ))
              )}
            </div>
            {!showWorkSkeleton && workExperiences.length === 0 && (
              <p className={styles.app__sectionEmpty}>
                No work experience entries available yet.
              </p>
            )}
            <Dialog
              open={activeWork !== null}
              onOpenChange={(open: boolean) => {
                if (!open) setActiveWork(null);
              }}
            >
              {activeWork !== null && (
                <DialogContent className={styles.app__workDialog}>
                  {workExperiences
                    .filter((work) => work.id === activeWork)
                    .map((work) => (
                      <div key={work.id} className={styles.app__workDialogBody}>
                        <div className={styles.app__workDialogHeader}>
                          <div className={styles.app__workDialogLogo}>
                            <img src={work.image} alt={`${work.company} logo`} />
                          </div>
                          <div>
                            <DialogTitle>{work.role}</DialogTitle>
                            <div className={styles.app__workDialogCompanyLine}>
                              <DialogDescription className={styles.app__workDialogCompany}>
                                {work.company}
                              </DialogDescription>
                              <span className={styles.app__workDialogLocation}>
                                <MapPin className={styles.app__workDialogLocationIcon} />
                                {work.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className={styles.app__workDialogMeta}>
                          <span>{work.duration}</span>
                        </div>
                        <div className={styles.app__workDialogOverview}>
                          <p className={styles.app__workDialogSummary}>{work.summary}</p>
                          <ul className={styles.app__workDialogList}>
                            {work.highlights.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                </DialogContent>
              )}
            </Dialog>
          </div>
        </div>
      </section>

      {/* Feedbacks */}
      {showReviewsSection && (
        <section
          className={`${styles.app__section} ${styles.app__sectionReveal}`}
          id="reviews"
          data-section-reveal="true"
        >
          <div className={styles.app__sectionInner}>
            <div className={styles.app__content}>
              <div className={styles.app__sectionHeader}>
                <h2>Feedbacks & Preview</h2>
                <p className={styles.app__sectionSubtitle}>
                  A quick look at client impressions and the experience of working together.
                </p>
              </div>
              {!contentLoaded ? (
                <FeedbackSkeletonRow />
              ) : (
                <div className={styles.app__feedbackMarquee}>
                  <div className={styles.app__feedbackTrack}>
                    {feedbacks.concat(feedbacks).map((review, index) => (
                      <button
                        key={`${review.id}-${index}`}
                        type="button"
                        className={`${styles.app__feedbackCard} ${styles.app__feedbackCardButton}`}
                        onClick={() => setActiveFeedback(review)}
                        aria-label={`Open feedback from ${review.name}`}
                      >
                        <div className={styles.app__feedbackHeader}>
                          <div className={styles.app__feedbackAvatar}>
                            <span className={styles.app__feedbackAvatarText}>{review.avatar}</span>
                          </div>
                          <div className={styles.app__feedbackMeta}>
                            <p className={styles.app__feedbackName}>{review.name}</p>
                            <p className={styles.app__feedbackRole}>{review.role}</p>
                          </div>
                          <div className={styles.app__feedbackStars} aria-label={`${review.rating} out of 5 stars`}>
                            {Array.from({ length: 5 }).map((_, starIndex) => (
                              <span
                                key={`${review.id}-star-${starIndex}`}
                                className={`${styles.app__feedbackStar} ${
                                  starIndex < review.rating
                                    ? styles["app__feedbackStar--active"]
                                    : styles["app__feedbackStar--inactive"]
                                }`}
                              >
                                {"\u2605"}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className={styles.app__feedbackText}>&ldquo;{review.feedback}&rdquo;</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Dialog
                open={!!activeFeedback}
                onOpenChange={(open: boolean) => {
                  if (!open) setActiveFeedback(null);
                }}
              >
                {activeFeedback && (
                  <DialogContent className={styles.app__feedbackDialog}>
                    <div className={styles.app__feedbackDialogBody}>
                      <div className={styles.app__feedbackDialogHeader}>
                        <div className={styles.app__feedbackDialogAvatar}>
                          <span>{activeFeedback.avatar}</span>
                        </div>
                        <div>
                          <DialogTitle>{activeFeedback.name}</DialogTitle>
                          <DialogDescription>{activeFeedback.role}</DialogDescription>
                        </div>
                      </div>
                      <div className={styles.app__feedbackDialogStars} aria-label={`${activeFeedback.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <span
                            key={`dialog-star-${starIndex}`}
                            className={`${styles.app__feedbackStar} ${
                              starIndex < activeFeedback.rating
                                ? styles["app__feedbackStar--active"]
                                : styles["app__feedbackStar--inactive"]
                            }`}
                          >
                            {"\u2605"}
                          </span>
                        ))}
                      </div>
                      <p className={styles.app__feedbackDialogText}>
                        &ldquo;{activeFeedback.feedback}&rdquo;
                      </p>
                      <p className={styles.app__feedbackDialogDetail}>
                        {activeFeedback.detail}
                      </p>
                    </div>
                  </DialogContent>
                )}
              </Dialog>
            </div>
          </div>
        </section>
      )}

      {/* Socials / Footer */}
      <section
        className={`${styles.app__section} ${styles.app__sectionReveal}`}
        id="contacts"
        data-section-reveal="true"
      >
        <div className={styles.app__sectionInner}>
          <div className={styles.app__contactStack}>
            <ContactMe />
          </div>
        </div>
      </section>
        </div>
      )}

      {scrollY > 0 && (
        <button
          type="button"
          className={styles.app__backToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <span className={styles.app__backToTopIcon}>{"\u2191"}</span>
          <span className={styles.app__backToTopText}>Back to Top</span>
        </button>
      )}
    </div>
  );
}
