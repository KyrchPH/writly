import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import styles from "./HeroSearch.module.css";

interface HeroSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  scrollProgress: number;
  variant?: "default" | "compact";
}

const rotatingPlaceholders = [
  "Logo",
  "Youtube Thumbnail",
  "Food Branding",
  "Mobile UI Design",
  "Business Website",
  "Restaurant Mobile App",
];

export function HeroSearch({
  searchValue,
  onSearchChange,
  scrollProgress,
  variant = "default",
}: HeroSearchProps) {
  // Calculate opacity based on scroll progress (0 to 1)
  const opacity = Math.max(0, 1 - scrollProgress * 2);
  const scale = Math.max(0.8, 1 - scrollProgress * 0.3);

  const [phIndex, setPhIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhIndex((i) => (i + 1) % rotatingPlaceholders.length);
    }, 2400);

    return () => clearTimeout(timer);
  }, [phIndex]);

  const displayPlaceholder = "Search projects, skills, technologies...";
  const suggestion = rotatingPlaceholders[phIndex];

  return (
    <div
      className={`${styles["hero-search"]} ${
        variant === "compact" ? styles["hero-search--compact"] : ""
      }`}
      style={{
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: scrollProgress > 0.5 ? "none" : "auto",
      }}
    >
      {/* Main Search Bar */}
      <div className={styles["hero-search__bar"]}>
        <div
          className={`${styles["hero-search__inputWrap"]} ${
            searchValue ? "" : styles["hero-search__inputWrap--suggesting"]
          }`}
        >
          <Search className={styles["hero-search__icon"]} />
          {!searchValue && (
            <span
              key={suggestion}
              className={styles["hero-search__suggestion"]}
              aria-hidden="true"
            >
              {suggestion}
            </span>
          )}
          <input
            type="text"
            placeholder={displayPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles["hero-search__input"]}
            aria-label={displayPlaceholder}
          />
        </div>
      </div>

    </div>
  );
}
