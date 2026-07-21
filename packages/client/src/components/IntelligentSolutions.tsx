import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Cloud, Database, Sparkles } from "lucide-react";
import {
  SolutionInquiryDialog,
  type SolutionInquiryType,
} from "./SolutionInquiryDialog";
import styles from "./IntelligentSolutions.module.css";

export type IntelligentSolutionItem = {
  id: string;
  title: string;
  subtitle: string;
};

type IntelligentSolutionsProps = {
  services: IntelligentSolutionItem[];
  isLoading?: boolean;
  activeInquiryType?: SolutionInquiryType | null;
  onInquiryTypeChange?: (inquiryType: SolutionInquiryType | null) => void;
};

const cardMeta: Array<{
  Icon: typeof Cloud;
  inquiryType: SolutionInquiryType;
  label: string;
}> = [
  {
    Icon: Cloud,
    inquiryType: "operations",
    label: "Operations",
  },
  {
    Icon: Database,
    inquiryType: "business-systems",
    label: "Business systems",
  },
  {
    Icon: Sparkles,
    inquiryType: "ai-automation",
    label: "Automation",
  },
];

export function IntelligentSolutions({
  services,
  isLoading = false,
  activeInquiryType: controlledInquiryType,
  onInquiryTypeChange,
}: IntelligentSolutionsProps) {
  const [internalInquiryType, setInternalInquiryType] = useState<SolutionInquiryType | null>(null);
  const [visibleCardCount, setVisibleCardCount] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const activeInquiryType =
    controlledInquiryType === undefined ? internalInquiryType : controlledInquiryType;
  const setActiveInquiryType = (inquiryType: SolutionInquiryType | null) => {
    if (onInquiryTypeChange) {
      onInquiryTypeChange(inquiryType);
      return;
    }
    setInternalInquiryType(inquiryType);
  };

  useEffect(() => {
    if (isLoading || services.length === 0) {
      setVisibleCardCount(0);
      return;
    }

    if (typeof window.matchMedia !== "function") {
      setVisibleCardCount(services.length);
      return;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrowScreenQuery = window.matchMedia("(max-width: 850px)");
    let frameId: number | null = null;

    const getImmediateCount = () =>
      reducedMotionQuery.matches || narrowScreenQuery.matches
        ? services.length
        : null;
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
        setVisibleCardCount(immediateCount);
        return;
      }

      const section = sectionRef.current;
      const stage =
        section?.closest<HTMLElement>("[data-solution-step-section]") ?? section;

      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const scrollRange = Math.max(1, stage.offsetHeight - viewportHeight);
      const rawProgress = -rect.top / scrollRange;
      const progress = Math.min(1, Math.max(0, rawProgress));
      const nextCount =
        rawProgress <= 0
          ? 0
          : Math.min(services.length, Math.ceil(progress * services.length));

      setVisibleCardCount((currentCount) =>
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
  }, [isLoading, services.length]);

  return (
    <section
      className={styles["intelligent-solutions"]}
      ref={sectionRef}
      data-visible-cards={visibleCardCount}
    >
      <div className={styles["intelligent-solutions__header"]}>
        <div className={styles["intelligent-solutions__heading"]}>
          <p className={styles["intelligent-solutions__eyebrow"]}>Service systems</p>
          <h2>Intelligent IT Solutions</h2>
          <p className={styles["intelligent-solutions__subtitle"]}>
            Smart, scalable services designed to reduce friction and accelerate delivery.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className={styles["intelligent-solutions__list"]} aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`solution-skeleton-${index}`} className={styles["intelligent-solutions__skeletonCard"]}>
              <span className={styles["intelligent-solutions__skeletonIcon"]} />
              <span className={styles["intelligent-solutions__skeletonKicker"]} />
              <span className={styles["intelligent-solutions__skeletonTitle"]} />
              <span className={styles["intelligent-solutions__skeletonLine"]} />
              <span className={`${styles["intelligent-solutions__skeletonLine"]} ${styles["intelligent-solutions__skeletonLine--short"]}`} />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <p className={styles["intelligent-solutions__empty"]}>
          No solutions available yet.
        </p>
      ) : (
        <div className={styles["intelligent-solutions__list"]}>
          {services.map((service, index) => {
            const { Icon, inquiryType, label } = cardMeta[index % cardMeta.length];
            const isCardVisible = index < visibleCardCount;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => setActiveInquiryType(inquiryType)}
                aria-label={`Open ${service.title} inquiry options`}
                aria-hidden={isCardVisible ? undefined : true}
                tabIndex={isCardVisible ? 0 : -1}
                className={`${styles["intelligent-solutions__card"]} ${
                  index % 2 === 0
                    ? styles["intelligent-solutions__card--from-left"]
                    : styles["intelligent-solutions__card--from-right"]
                } ${
                  isCardVisible
                    ? styles["intelligent-solutions__card--visible"]
                    : ""
                }`}
              >
                <div className={styles["intelligent-solutions__cardTop"]}>
                  <div className={styles["intelligent-solutions__icon"]}>
                    <Icon className={styles["intelligent-solutions__iconGlyph"]} />
                  </div>
                  <span className={styles["intelligent-solutions__number"]}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className={styles["intelligent-solutions__text"]}>
                  <p className={styles["intelligent-solutions__kicker"]}>{label}</p>
                  <h3 className={styles["intelligent-solutions__title"]}>{service.title}</h3>
                  <p className={styles["intelligent-solutions__subtitleText"]}>{service.subtitle}</p>
                </div>
                <span className={styles["intelligent-solutions__action"]} aria-hidden="true">
                  Discuss scope
                  <ArrowUpRight className={styles["intelligent-solutions__actionIcon"]} />
                </span>
              </button>
            );
          })}
        </div>
      )}
      <SolutionInquiryDialog
        inquiryType={activeInquiryType}
        onClose={() => setActiveInquiryType(null)}
      />
    </section>
  );
}
