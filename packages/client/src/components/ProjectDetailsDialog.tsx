import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import styles from "../App.module.css";

export type ProjectDetailsDialogProject = {
  id: string;
  title: string;
  category: string;
  description: string;
  images: string[];
  status: "Completed" | "Canceled" | "Ongoing" | "Pending";
  tags: string[];
  highlights: string[];
  details: string;
};

type ProjectDetailsDialogProps = {
  project: ProjectDetailsDialogProject | null;
  onOpenChange: (open: boolean) => void;
};

export function ProjectDetailsDialog({
  project,
  onOpenChange,
}: ProjectDetailsDialogProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isProjectImageLoading, setIsProjectImageLoading] = useState(false);
  const [projectThumbScrollState, setProjectThumbScrollState] = useState({
    canScrollNext: false,
    canScrollPrev: false,
  });
  const projectThumbsRef = useRef<HTMLDivElement>(null);
  const activeImage = project?.images[activeImageIndex] ?? "";
  const totalProjectImages = project?.images.length ?? 0;

  const scrollProjectThumbs = (direction: "next" | "prev") => {
    const rail = projectThumbsRef.current;
    if (!rail) return;

    rail.scrollBy({
      behavior: "smooth",
      left: direction === "next" ? rail.clientWidth * 0.8 : -rail.clientWidth * 0.8,
    });
  };

  useEffect(() => {
    setActiveImageIndex(0);
  }, [project?.id]);

  useEffect(() => {
    if (!activeImage) {
      setIsProjectImageLoading(false);
      return;
    }

    let cancelled = false;
    const image = new Image();
    const stopLoading = () => {
      if (!cancelled) {
        setIsProjectImageLoading(false);
      }
    };

    setIsProjectImageLoading(true);
    image.addEventListener("load", stopLoading);
    image.addEventListener("error", stopLoading);
    image.src = activeImage;

    return () => {
      cancelled = true;
      image.removeEventListener("load", stopLoading);
      image.removeEventListener("error", stopLoading);
    };
  }, [activeImage]);

  useEffect(() => {
    if (!project) return;
    const rail = projectThumbsRef.current;
    if (!rail) return;

    const activeThumb = rail.querySelector<HTMLElement>(
      `[data-project-thumb-index="${activeImageIndex}"]`,
    );
    activeThumb?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeImageIndex, project]);

  useEffect(() => {
    const rail = projectThumbsRef.current;
    if (!project || !rail) {
      setProjectThumbScrollState({ canScrollNext: false, canScrollPrev: false });
      return;
    }

    const syncProjectThumbScrollState = () => {
      const maxScrollLeft = Math.max(rail.scrollWidth - rail.clientWidth, 0);
      setProjectThumbScrollState({
        canScrollPrev: rail.scrollLeft > 1,
        canScrollNext: rail.scrollLeft < maxScrollLeft - 1,
      });
    };

    const frame = window.requestAnimationFrame(syncProjectThumbScrollState);
    rail.addEventListener("scroll", syncProjectThumbScrollState, { passive: true });
    window.addEventListener("resize", syncProjectThumbScrollState);

    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", syncProjectThumbScrollState);
      window.removeEventListener("resize", syncProjectThumbScrollState);
    };
  }, [project, project?.images.length]);

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      {project && (
        <DialogContent className={styles.app__projectsDialog}>
          <div className={styles.app__projectsDialogBody}>
            <div className={styles.app__projectsDialogGallery}>
              <a
                href={activeImage}
                target="_blank"
                rel="noreferrer"
                className={styles.app__projectsDialogMain}
                aria-label={`Open full image for ${project.title}`}
              >
                {isProjectImageLoading && (
                  <span
                    className={styles.app__projectsDialogImageSkeleton}
                    aria-hidden="true"
                  />
                )}
                <img
                  src={activeImage}
                  alt={project.title}
                  className={`${styles.app__projectsDialogImage} ${
                    isProjectImageLoading
                      ? styles["app__projectsDialogImage--loading"]
                      : ""
                  }`}
                  onLoad={() => setIsProjectImageLoading(false)}
                  onError={() => setIsProjectImageLoading(false)}
                />
              </a>
              <div className={styles.app__projectsDialogThumbStrip}>
                {projectThumbScrollState.canScrollPrev && (
                  <button
                    type="button"
                    className={`${styles.app__projectsDialogThumbNav} ${styles["app__projectsDialogThumbNav--prev"]}`}
                    onClick={() => scrollProjectThumbs("prev")}
                    aria-label={`Scroll to previous preview images for ${project.title}`}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                )}
                <div
                  ref={projectThumbsRef}
                  className={styles.app__projectsDialogThumbs}
                  role="listbox"
                  aria-label={`Preview images for ${project.title}`}
                >
                  {project.images.map((image, idx) => (
                    <button
                      type="button"
                      key={`${project.id}-thumb-${idx}`}
                      role="option"
                      aria-selected={idx === activeImageIndex}
                      data-project-thumb-index={idx}
                      className={`${styles.app__projectsDialogThumb} ${
                        idx === activeImageIndex
                          ? styles["app__projectsDialogThumb--active"]
                          : ""
                      }`}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Preview image ${idx + 1} for ${project.title}`}
                    >
                      <img src={image} alt={`${project.title} preview ${idx + 1}`} />
                    </button>
                  ))}
                </div>
                {projectThumbScrollState.canScrollNext && (
                  <button
                    type="button"
                    className={`${styles.app__projectsDialogThumbNav} ${styles["app__projectsDialogThumbNav--next"]}`}
                    onClick={() => scrollProjectThumbs("next")}
                    aria-label={`Scroll to next preview images for ${project.title}`}
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className={styles.app__projectsDialogCounter}>
                Image {Math.min(activeImageIndex + 1, totalProjectImages)} of {totalProjectImages}
              </p>
            </div>
            <div className={styles.app__projectsDialogContent}>
              <DialogHeader className={styles.app__projectsDialogHeader}>
                <DialogDescription className={styles.app__projectsDialogKicker}>
                  {project.category}
                </DialogDescription>
                <DialogTitle className={styles.app__projectsDialogTitle}>
                  {project.title}
                </DialogTitle>
              </DialogHeader>
              <p className={styles.app__projectsDialogLead}>
                {project.description}
              </p>
              <div className={styles.app__projectsDialogStatusRow}>
                <span className={styles.app__projectsStatusBadge} data-status={project.status}>
                  {project.status}
                </span>
              </div>
              {project.tags.length > 0 && (
                <section className={styles.app__projectsDialogSection} aria-label="Tools used">
                  <h4 className={styles.app__projectsDialogSectionTitle}>Tools</h4>
                  <div className={styles.app__projectsDialogTools}>
                    {project.tags.map((tool) => (
                      <span key={tool} className={styles.app__projectsDialogChip}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </section>
              )}
              <section className={styles.app__projectsDialogSection} aria-label="Project highlights">
                <h4 className={styles.app__projectsDialogSectionTitle}>Highlights</h4>
                <ul className={styles.app__projectsDialogList}>
                  {project.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section className={styles.app__projectsDialogSection} aria-label="Project overview">
                <h4 className={styles.app__projectsDialogSectionTitle}>Overview</h4>
                <p className={styles.app__projectsDialogDetail}>
                  {project.details}
                </p>
              </section>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
