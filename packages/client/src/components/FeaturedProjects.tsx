import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import styles from "./FeaturedProjects.module.css";
import { ProjectDetailsDialog } from "./ProjectDetailsDialog";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useImagesReady } from "../hooks/useImagesReady";

export type FeaturedProjectItem = {
  id: string;
  label: string;
  tag: string;
  image: string;
  images: string[];
  description: string;
  details: string;
  status: "Completed" | "Canceled" | "Ongoing" | "Pending";
  tools: string[];
  highlights: string[];
};

type FeaturedProjectsProps = {
  projects: FeaturedProjectItem[];
  isLoading?: boolean;
  onViewAllProjects?: () => void;
};

export function FeaturedProjects({
  projects,
  isLoading = false,
  onViewAllProjects,
}: FeaturedProjectsProps) {
  const normalizedProjects = useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        images: project.images.length > 0 ? project.images : [project.image],
        tools: project.tools,
        details: project.details || project.description,
        highlights:
          project.highlights.length > 0
            ? project.highlights
            : ["Project highlights will be available soon."],
      })),
    [projects],
  );
  const [activeProject, setActiveProject] = useState<FeaturedProjectItem | null>(null);
  const featuredImagesReady = useImagesReady(
    normalizedProjects.map((project) => project.image),
    !isLoading && normalizedProjects.length > 0,
  );
  const showSkeleton = isLoading || !featuredImagesReady;
  const rowRef = useScrollReveal<HTMLDivElement>({
    selector: "[data-reveal='featured-card']",
    visibleClass: styles["featured-projects__card--visible"],
  });

  useEffect(() => {
    if (!activeProject) return;
    if (normalizedProjects.some((item) => item.id === activeProject.id)) return;
    setActiveProject(null);
  }, [activeProject, normalizedProjects]);

  return (
    <section className={styles["featured-projects"]}>
      <div className={styles["featured-projects__header"]}>
        <div className={styles["featured-projects__heading"]}>
          <p className={styles["featured-projects__eyebrow"]}>Selected work</p>
          <h2>Featured Projects</h2>
          <p className={styles["featured-projects__subtitle"]}>
            Discover how my featured projects use a wide range of skills to solve problems and drive growth.
          </p>
        </div>
        <div className={styles["featured-projects__headerMeta"]}>
          <span className={styles["featured-projects__count"]}>
            {showSkeleton ? "..." : normalizedProjects.length} live projects
          </span>
          <button
            type="button"
            aria-label="View all projects"
            className={styles["featured-projects__action"]}
            disabled={isLoading || normalizedProjects.length === 0}
            onClick={onViewAllProjects}
          >
            <ArrowRight className={styles["featured-projects__icon"]} />
          </button>
        </div>
      </div>

      {showSkeleton ? (
        <div className={styles["featured-projects__row"]} aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`featured-skeleton-${index}`} className={styles["featured-projects__skeletonCard"]}>
              <span className={styles["featured-projects__skeletonMedia"]} />
              <span className={styles["featured-projects__skeletonLine"]} />
              <span className={`${styles["featured-projects__skeletonLine"]} ${styles["featured-projects__skeletonLine--short"]}`} />
            </div>
          ))}
        </div>
      ) : normalizedProjects.length === 0 ? (
        <p className={styles["featured-projects__empty"]}>
          No featured projects available yet.
        </p>
      ) : (
        <div className={styles["featured-projects__row"]} ref={rowRef}>
          {normalizedProjects.map((project, index) => (
            <button
              type="button"
              key={project.id}
              data-reveal="featured-card"
              className={`${styles["featured-projects__card"]} ${
                index % 2 === 0
                  ? styles["featured-projects__card--from-left"]
                  : styles["featured-projects__card--from-right"]
              }`}
              onClick={() => setActiveProject(project)}
              aria-label={`Open details for ${project.label}`}
            >
              <div className={styles["featured-projects__media"]}>
                <img
                  src={project.image}
                  alt={project.label}
                  className={styles["featured-projects__image"]}
                />
                <div className={styles["featured-projects__overlay"]} />
                <span className={styles["featured-projects__cardIndex"]}>
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className={styles["featured-projects__body"]}>
                <div>
                  <p className={styles["featured-projects__tag"]}>{project.tag}</p>
                  <p className={styles["featured-projects__title"]}>{project.label}</p>
                  <span className={styles["featured-projects__statusBadge"]} data-status={project.status}>
                    {project.status}
                  </span>
                </div>
                <span className={styles["featured-projects__cardCta"]} aria-hidden="true">
                  <ArrowRight className={styles["featured-projects__cardIcon"]} />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <ProjectDetailsDialog
        project={
          activeProject
            ? {
                id: activeProject.id,
                title: activeProject.label,
                category: activeProject.tag,
                description: activeProject.description,
                images: activeProject.images,
                status: activeProject.status,
                tags: activeProject.tools,
                highlights: activeProject.highlights,
                details: activeProject.details,
              }
            : null
        }
        onOpenChange={(open: boolean) => {
          if (!open) setActiveProject(null);
        }}
      />
    </section>
  );
}
