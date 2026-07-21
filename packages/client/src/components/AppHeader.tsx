import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Moon,
  Sun,
  Download,
  Search,
  X,
  QrCode,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Menu,
  FileText,
  Sparkles,
} from "lucide-react";
import logo from "/logo.svg";
import styles from "./AppHeader.module.css";
import qrCodeImage from "@/assets/qrcodes/qrcode.png";
import type { SolutionInquiryType } from "./SolutionInquiryDialog";

interface AppHeaderProps {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  showSearchInHeader: boolean;
  showSearchToggle: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onLogoClick: () => void;
  onProjectsToggle: () => void;
  onNavigateToSection: (id: string) => void;
  onServiceSelect: (inquiryType: SolutionInquiryType) => void;
  isProjectsView: boolean;
  serviceLinks: Array<{ id: string; label: string; inquiryType: SolutionInquiryType }>;
  downloadCvSignal?: number;
  showReviewsLink?: boolean;
}

const API_BASE = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000/api").replace(
  /\/+$/,
  "",
);

type CvRequestError = Error & {
  retryAfterSeconds?: number;
};

type CvDocumentType = "ATS" | "Visual";
const OTP_LENGTH = 6;

async function parseApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

export function AppHeader({
  theme,
  onThemeToggle,
  showSearchInHeader,
  showSearchToggle,
  searchValue,
  onSearchChange,
  onLogoClick,
  onProjectsToggle,
  onNavigateToSection,
  onServiceSelect,
  isProjectsView,
  serviceLinks,
  downloadCvSignal = 0,
  showReviewsLink = true,
}: AppHeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const desktopSearchToggleRef = useRef<HTMLDivElement>(null);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cvDialogOpen, setCvDialogOpen] = useState(false);
  const [cvStep, setCvStep] = useState<"select" | "email" | "otp">("select");
  const [selectedCvDocumentType, setSelectedCvDocumentType] =
    useState<CvDocumentType | null>(null);
  const [cvEmail, setCvEmail] = useState("");
  const [cvOtpChars, setCvOtpChars] = useState<string[]>(
    () => Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [cvCountdown, setCvCountdown] = useState(0);
  const [cvError, setCvError] = useState("");
  const [cvLoading, setCvLoading] = useState(false);
  const cvOtp = cvOtpChars.join("");
  const qrUrl = "https://www.linkedin.com/in/archie-sevillano-5b74a939b/";
  const services = serviceLinks;
  const cvDocumentOptions: Array<{
    type: CvDocumentType;
    title: string;
    description: string;
    points: string[];
    icon: typeof FileText;
  }> = [
    {
      type: "ATS",
      title: "ATS Friendly",
      description: "Best for job portals, recruiters, and applicant tracking systems.",
      points: ["Text-first layout", "No photos or icons", "More detailed career information"],
      icon: FileText,
    },
    {
      type: "Visual",
      title: "Visual Friendly",
      description: "Best for direct sharing and human-first presentation.",
      points: ["Designed layout", "Photos, icons, and QR codes", "More colorful and polished"],
      icon: Sparkles,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!showSearchToggle) {
      setDesktopSearchOpen(false);
      setMobileSearchOpen(false);
    }
  }, [showSearchToggle]);

  const isDesktopSearchOpen = showSearchToggle && desktopSearchOpen;

  useEffect(() => {
    if (cvCountdown <= 0) return;
    const intervalId = window.setInterval(() => {
      setCvCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [cvCountdown]);

  useEffect(() => {
    if (downloadCvSignal <= 0) return;
    setCvDialogOpen(true);
    setMobileMenuOpen(false);
  }, [downloadCvSignal]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.matchMedia("(min-width: 851px)").matches) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [mobileMenuOpen]);

  const resetCvDialog = () => {
    setCvStep("select");
    setSelectedCvDocumentType(null);
    setCvEmail("");
    setCvOtpChars(Array.from({ length: OTP_LENGTH }, () => ""));
    setCvCountdown(0);
    setCvError("");
    setCvLoading(false);
  };

  const sanitizeOtpValue = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, OTP_LENGTH);

  const setOtpAt = (index: number, char: string) => {
    setCvOtpChars((previous) => {
      const slots = [...previous];
      slots[index] = char;
      return slots;
    });
  };

  const handleOtpInputChange = (index: number, value: string) => {
    const sanitized = sanitizeOtpValue(value);
    if (sanitized.length === 0) {
      setOtpAt(index, "");
      return;
    }

    setCvOtpChars((previous) => {
      const slots = [...previous];
      const chars = sanitized.split("");
      chars.forEach((char, offset) => {
        const targetIndex = index + offset;
        if (targetIndex < OTP_LENGTH) {
          slots[targetIndex] = char;
        }
      });
      return slots;
    });

    const nextIndex = Math.min(index + sanitized.length, OTP_LENGTH - 1);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !cvOtpChars[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (index: number, event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = sanitizeOtpValue(event.clipboardData.getData("text"));
    if (!pasted) return;

    setCvOtpChars((previous) => {
      const slots = [...previous];
      pasted.split("").forEach((char, offset) => {
        const targetIndex = index + offset;
        if (targetIndex < OTP_LENGTH) {
          slots[targetIndex] = char;
        }
      });
      return slots;
    });

    const focusIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const requestCvOtp = async (emailInput: string) => {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!selectedCvDocumentType) {
      throw new Error("Select which CV document you want to request.");
    }
    const response = await fetch(`${API_BASE}/public/cv/request-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
        documentType: selectedCvDocumentType,
      }),
    });

    const payload = (await response
      .json()
      .catch(() => ({}))) as {
      message?: string;
      retryAfterSeconds?: number;
      data?: { resendAvailableInSeconds?: number; email?: string };
    };

    if (!response.ok) {
      const error = new Error(
        payload.message || (await parseApiError(response, "Failed to send OTP.")),
      ) as CvRequestError;
      if (typeof payload.retryAfterSeconds === "number") {
        error.retryAfterSeconds = payload.retryAfterSeconds;
      }
      throw error;
    }

    return {
      email: payload.data?.email || normalizedEmail,
      resendAvailableInSeconds: payload.data?.resendAvailableInSeconds ?? 180,
    };
  };

  const handleCvEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cvEmail.trim()) return;
    if (!selectedCvDocumentType) {
      setCvError("Select which CV document you want to request.");
      setCvStep("select");
      return;
    }

    setCvLoading(true);
    setCvError("");
    try {
      const data = await requestCvOtp(cvEmail);
      setCvEmail(data.email);
      setCvStep("otp");
      setCvOtpChars(Array.from({ length: OTP_LENGTH }, () => ""));
      setCvCountdown(data.resendAvailableInSeconds);
    } catch (error) {
      const maybeRetry = error as CvRequestError;
      if (typeof maybeRetry.retryAfterSeconds === "number") {
        setCvCountdown(maybeRetry.retryAfterSeconds);
      }
      setCvError(error instanceof Error ? error.message : "Failed to send OTP.");
    } finally {
      setCvLoading(false);
    }
  };

  const handleCvOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (cvOtp.length !== OTP_LENGTH) return;
    if (!selectedCvDocumentType) {
      setCvError("Select which CV document you want to request.");
      setCvStep("select");
      return;
    }

    setCvLoading(true);
    setCvError("");
    try {
      const response = await fetch(`${API_BASE}/public/cv/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cvEmail.trim().toLowerCase(),
          documentType: selectedCvDocumentType,
          otp: cvOtp.toUpperCase(),
        }),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, "Failed to verify OTP."));
      }

      const payload = (await response.json()) as {
        data?: { downloadUrl?: string };
      };
      const downloadUrl = payload.data?.downloadUrl;
      if (!downloadUrl) {
        throw new Error("Download URL is unavailable.");
      }

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setCvDialogOpen(false);
      resetCvDialog();
    } catch (error) {
      setCvError(error instanceof Error ? error.message : "Failed to verify OTP.");
    } finally {
      setCvLoading(false);
    }
  };

  const handleCvResend = async () => {
    if (cvCountdown > 0 || !cvEmail.trim()) return;
    setCvLoading(true);
    setCvError("");
    try {
      const data = await requestCvOtp(cvEmail);
      setCvEmail(data.email);
      setCvCountdown(data.resendAvailableInSeconds);
    } catch (error) {
      const maybeRetry = error as CvRequestError;
      if (typeof maybeRetry.retryAfterSeconds === "number") {
        setCvCountdown(maybeRetry.retryAfterSeconds);
      }
      setCvError(error instanceof Error ? error.message : "Failed to resend OTP.");
    } finally {
      setCvLoading(false);
    }
  };

  const handleCvOpenChange = (open: boolean) => {
    setCvDialogOpen(open);
    if (!open) {
      resetCvDialog();
    }
  };

  useEffect(() => {
    if (!isDesktopSearchOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (desktopSearchRef.current?.contains(target)) return;
      if (desktopSearchToggleRef.current?.contains(target)) return;
      setDesktopSearchOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDesktopSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDesktopSearchOpen]);

  useEffect(() => {
    if (!servicesOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (servicesRef.current?.contains(target)) return;
      setServicesOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setServicesOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [servicesOpen]);

  useEffect(() => {
    if (cvStep !== "otp") return;
    const firstEmptyIndex = Array.from({ length: OTP_LENGTH }).findIndex(
      (_, index) => !cvOtpChars[index],
    );
    const focusIndex = firstEmptyIndex === -1 ? OTP_LENGTH - 1 : firstEmptyIndex;
    window.setTimeout(() => {
      otpInputRefs.current[focusIndex]?.focus();
    }, 0);
  }, [cvStep, cvOtpChars]);

  const handleSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    setServicesOpen(false);
    onNavigateToSection(id);
  };

  const handleMobileSectionClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    handleSectionClick(event, id);
    setMobileMenuOpen(false);
  };

  const handleServiceClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    inquiryType: SolutionInquiryType,
  ) => {
    event.preventDefault();
    setServicesOpen(false);
    onServiceSelect(inquiryType);
  };

  const handleMobileServiceClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    inquiryType: SolutionInquiryType,
  ) => {
    handleServiceClick(event, inquiryType);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`${styles["app-header"]} ${
        showSearchInHeader
          ? styles["app-header--scrolled"]
          : styles["app-header--transparent"]
      } ${theme === "dark" ? styles["app-header--dark"] : ""}`}
    >
      <div className={styles["app-header__container"]}>
        <div className={styles["app-header__row"]}>
          {/* Logo */}
          <button
            type="button"
            className={`${styles["app-header__logoWrap"]} ${
              mobileSearchOpen ? styles["app-header__logoWrap--hidden"] : ""
            }`}
            aria-label="Go to homepage"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileSearchOpen(false);
              setDesktopSearchOpen(false);
              setServicesOpen(false);
              onLogoClick();
            }}
          >
            <img
              src={logo}
              alt="ace logo"
              className={styles["app-header__logo"]}
              style={{ filter: theme === "dark" ? "invert(1)" : "none" }}
            />
          </button>

          {/* Mobile search toggle */}
          {showSearchToggle && (
            <div className={styles["app-header__mobileToggle"]}>
              <Button
                variant="ghost"
                size="sm"
                className={styles["app-header__mobileToggleButton"]}
                onClick={() => setMobileSearchOpen((s) => !s)}
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              >
                {mobileSearchOpen ? (
                  <X className={styles["app-header__icon"]} />
                ) : (
                  <Search className={styles["app-header__icon"]} />
                )}
              </Button>
            </div>
          )}

          <div
            className={`${styles["app-header__hamburger"]} ${
              !showSearchToggle
                ? styles["app-header__hamburger--push-right"]
                : ""
            }`}
          >
            <Button
              variant="ghost"
              size="sm"
              className={styles["app-header__hamburgerButton"]}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() =>
                setMobileMenuOpen((open) => {
                  const next = !open;
                  if (next) {
                    setMobileSearchOpen(false);
                  }
                  return next;
                })
              }
            >
              {mobileMenuOpen ? (
                <X className={styles["app-header__icon"]} />
              ) : (
                <Menu className={styles["app-header__icon"]} />
              )}
            </Button>
          </div>

          {/* Right side actions */}
          <div className={styles["app-header__actions"]}>
            {isDesktopSearchOpen && (
              <div
                className={`${styles["app-header__searchDesktop"]} ${
                  isDesktopSearchOpen
                    ? styles["app-header__searchDesktop--open"]
                    : ""
                }`}
                ref={desktopSearchRef}
              >
                <div className={styles["app-header__searchWrap"]}>
                  <Search className={styles["app-header__searchIcon"]} />
                  <input
                    type="text"
                    placeholder="Search projects, skills..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={styles["app-header__searchInput"]}
                  />
                </div>
              </div>
            )}
            {!isDesktopSearchOpen && (
              <>
                {services.length > 0 && (
                  <div
                    className={styles["app-header__services"]}
                    ref={servicesRef}
                  >
                    <button
                      type="button"
                      className={`${styles["app-header__link"]} ${styles["app-header__servicesButton"]}`}
                      aria-haspopup="true"
                      aria-expanded={servicesOpen}
                      onClick={() => setServicesOpen((open) => !open)}
                    >
                      <span>Services</span>
                      <ChevronDown className={styles["app-header__servicesIcon"]} />
                    </button>
                    {servicesOpen && (
                      <div className={styles["app-header__servicesMenu"]}>
                        {services.map((service) => (
                          <a
                            key={service.id}
                            href="#services"
                            className={styles["app-header__servicesItem"]}
                            onClick={(event) =>
                              handleServiceClick(event, service.inquiryType)
                            }
                          >
                            <span>{service.label}</span>
                            <ChevronRight className={styles["app-header__servicesItemIcon"]} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className={`${styles["app-header__link"]} ${
                    isProjectsView ? styles["app-header__link--active"] : ""
                  }`}
                  onClick={() => {
                    setServicesOpen(false);
                    onProjectsToggle();
                  }}
                >
                  Projects
                </button>
                <a
                  href="#certificates"
                  className={styles["app-header__link"]}
                  onClick={(event) =>
                    handleSectionClick(event, "certificates")
                  }
                >
                  Certificates
                </a>
                {showReviewsLink && (
                  <a
                    href="#reviews"
                    className={styles["app-header__link"]}
                    onClick={(event) => handleSectionClick(event, "reviews")}
                  >
                    Reviews
                  </a>
                )}
                <a
                  href="#contacts"
                  className={styles["app-header__link"]}
                  onClick={(event) => handleSectionClick(event, "contacts")}
                >
                  Contacts
                </a>
              </>
            )}
            {showSearchToggle && (
              <div ref={desktopSearchToggleRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={styles["app-header__searchToggle"]}
                  aria-label={desktopSearchOpen ? "Hide search" : "Show search"}
                  onClick={() => setDesktopSearchOpen((open) => !open)}
                >
                  {isDesktopSearchOpen ? (
                    <X className={styles["app-header__icon"]} />
                  ) : (
                    <Search className={styles["app-header__icon"]} />
                  )}
                </Button>
              </div>
            )}
            <Button
              variant="default"
              size="lg"
              className={`${styles["app-header__downloadButton"]} ${
                theme === "light"
                  ? styles["app-header__downloadButton--light"]
                  : styles["app-header__downloadButton--dark"]
              }`}
              onClick={() => setCvDialogOpen(true)}
            >
              <span className={styles["app-header__downloadLink"]}>
                <Download className={styles["app-header__icon--sm"]} />
                <span className={`${styles["app-header__downloadText"]} ${styles["app-header__downloadText--desktop"]}`}>Download CV</span>
                <span className={`${styles["app-header__downloadText"]} ${styles["app-header__downloadText--mobile"]}`}>CV</span>
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={styles["app-header__qrButton"]}
              aria-label="Show QR code"
              onClick={() => setQrOpen(true)}
            >
              <QrCode className={styles["app-header__icon"]} />
            </Button>

            {/* Theme Toggle Icon Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onThemeToggle}
              className={styles["app-header__themeButton"]}
            >
            {theme === "light" ? (
                <Moon className={styles["app-header__icon"]} />
              ) : (
                <Sun className={styles["app-header__icon"]} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className={styles["app-header__mobileMenu"]}>
          <button
            type="button"
            className={styles["app-header__mobileMenuBackdrop"]}
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className={styles["app-header__mobileMenuInner"]}
            aria-label="Mobile navigation"
          >
            <div className={styles["app-header__mobileMenuHeader"]}>
              <span className={styles["app-header__mobileMenuTitle"]}>Menu</span>
              <button
                type="button"
                className={styles["app-header__mobileMenuClose"]}
                aria-label="Close menu"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className={styles["app-header__icon"]} />
              </button>
            </div>
            <div className={styles["app-header__mobileMenuGroup"]}>
              <p className={styles["app-header__mobileMenuLabel"]}>Shortcuts</p>
              <button
                type="button"
                className={`${styles["app-header__mobileMenuLink"]} ${
                  isProjectsView ? styles["app-header__mobileMenuLink--active"] : ""
                }`}
                onClick={() => {
                  onProjectsToggle();
                  setMobileMenuOpen(false);
                }}
              >
                <span>Projects</span>
              </button>
              <a
                href="#certificates"
                className={styles["app-header__mobileMenuLink"]}
                onClick={(event) => handleMobileSectionClick(event, "certificates")}
              >
                Certificates
              </a>
              {showReviewsLink && (
                <a
                  href="#reviews"
                  className={styles["app-header__mobileMenuLink"]}
                  onClick={(event) => handleMobileSectionClick(event, "reviews")}
                >
                  Reviews
                </a>
              )}
              <a
                href="#contacts"
                className={styles["app-header__mobileMenuLink"]}
                onClick={(event) => handleMobileSectionClick(event, "contacts")}
              >
                Contacts
              </a>
            </div>

            {services.length > 0 && (
              <div className={styles["app-header__mobileMenuGroup"]}>
                <p className={styles["app-header__mobileMenuLabel"]}>Services</p>
                {services.map((service) => (
                  <a
                    key={service.id}
                    href="#services"
                    className={styles["app-header__mobileMenuLink"]}
                    onClick={(event) =>
                      handleMobileServiceClick(event, service.inquiryType)
                    }
                  >
                    {service.label}
                  </a>
                ))}
              </div>
            )}

            <div className={styles["app-header__mobileMenuGroup"]}>
              <p className={styles["app-header__mobileMenuLabel"]}>Actions</p>
              <div className={styles["app-header__mobileMenuActionsRow"]}>
                <button
                  type="button"
                  className={`${styles["app-header__mobileMenuLink"]} ${styles["app-header__mobileMenuIconAction"]}`}
                  aria-label="Show QR code"
                  onClick={() => {
                    setQrOpen(true);
                    setMobileMenuOpen(false);
                  }}
                >
                  <QrCode className={styles["app-header__mobileMenuActionIcon"]} />
                </button>
                <button
                  type="button"
                  className={`${styles["app-header__mobileMenuLink"]} ${styles["app-header__mobileMenuIconAction"]}`}
                  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
                  onClick={() => {
                    onThemeToggle();
                    setMobileMenuOpen(false);
                  }}
                >
                  {theme === "light" ? (
                    <Moon className={styles["app-header__mobileMenuActionIcon"]} />
                  ) : (
                    <Sun className={styles["app-header__mobileMenuActionIcon"]} />
                  )}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile search field overlay */}
      {mobileSearchOpen && showSearchToggle && (
        <div className={styles["app-header__mobileSearch"]}>
          <div className={styles["app-header__mobileSearchInner"]}>
            <Search className={styles["app-header__mobileSearchIcon"]} />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Search projects, skills..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={styles["app-header__mobileInput"]}
            />
            <button
              type="button"
              aria-label="Close search"
              className={styles["app-header__mobileClose"]}
              onClick={() => setMobileSearchOpen(false)}
            >
              <X className={styles["app-header__icon--sm"]} />
            </button>
          </div>
        </div>
      )}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className={styles["app-header__qrDialog"]}>
          <DialogHeader className={styles["app-header__qrHeader"]}>
            <DialogTitle>Connect on LinkedIn</DialogTitle>
          </DialogHeader>
          <div className={styles["app-header__qrBody"]}>
            <div className={styles["app-header__qrImageWrap"]}>
              <img
                src={qrCodeImage}
                alt="LinkedIn QR code"
                className={styles["app-header__qrImage"]}
              />
            </div>
            <div className={styles["app-header__qrUrlRow"]}>
              <span className={styles["app-header__qrUrl"]}>{qrUrl}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={styles["app-header__qrCopyButton"]}
                onClick={handleCopy}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cvDialogOpen} onOpenChange={handleCvOpenChange}>
        <DialogContent
          className={`${styles["app-header__cvDialog"]} ${
            cvStep === "email" || cvStep === "otp"
              ? styles["app-header__cvDialog--auth"]
              : ""
          }`}
        >
          <DialogHeader className={styles["app-header__cvHeader"]}>
            <DialogTitle>Download CV</DialogTitle>
          </DialogHeader>
          <div className={styles["app-header__cvBody"]}>
            {cvStep === "select" ? (
              <div className={styles["app-header__cvSelect"]}>
                <p className={styles["app-header__cvText"]}>
                  Choose the CV document that fits your use case before email verification.
                </p>
                <div className={styles["app-header__cvOptions"]}>
                  {cvDocumentOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedCvDocumentType === option.type;
                    return (
                      <button
                        key={option.type}
                        type="button"
                        className={`${styles["app-header__cvOption"]} ${
                          isSelected ? styles["app-header__cvOption--selected"] : ""
                        }`}
                        onClick={() => setSelectedCvDocumentType(option.type)}
                      >
                        <span className={styles["app-header__cvOptionIcon"]}>
                          <Icon size={18} />
                        </span>
                        <strong>{option.title}</strong>
                        <p>{option.description}</p>
                        <ul>
                          {option.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>
                {cvError && <p className={styles["app-header__cvError"]}>{cvError}</p>}
                <div
                  className={`${styles["app-header__cvActions"]} ${styles["app-header__cvActions--select"]}`}
                >
                  <button
                    type="button"
                    className={`${styles["app-header__cvPrimary"]} ${styles["app-header__cvPrimary--select"]}`}
                    disabled={!selectedCvDocumentType}
                    onClick={() => {
                      setCvError("");
                      setCvStep("email");
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : cvStep === "email" ? (
              <form className={styles["app-header__cvForm"]} onSubmit={handleCvEmailSubmit}>
                <p className={styles["app-header__cvText"]}>
                  Enter your email to receive a one-time code for the{" "}
                  <strong>{selectedCvDocumentType} Friendly</strong> CV.
                </p>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={cvEmail}
                  onChange={(event) => setCvEmail(event.target.value)}
                  className={styles["app-header__cvInput"]}
                />
                {cvError && <p className={styles["app-header__cvError"]}>{cvError}</p>}
                <div
                  className={`${styles["app-header__cvActions"]} ${styles["app-header__cvActions--center"]}`}
                >
                  <button
                    type="submit"
                    className={styles["app-header__cvPrimary"]}
                    disabled={cvLoading}
                  >
                    {cvLoading && (
                      <LoaderCircle className={styles["app-header__cvSpinner"]} aria-hidden="true" />
                    )}
                    <span>Send OTP</span>
                  </button>
                </div>
              </form>
            ) : (
              <form
                className={`${styles["app-header__cvForm"]} ${styles["app-header__cvForm--otp"]}`}
                onSubmit={handleCvOtpSubmit}
              >
                <p className={styles["app-header__cvText"]}>
                  We sent a 6-character OTP to <strong>{cvEmail}</strong> for the{" "}
                  <strong>{selectedCvDocumentType} Friendly</strong> CV.
                </p>
                <div className={styles["app-header__cvOtpFields"]}>
                  {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                    <input
                      key={`cv-otp-${index}`}
                      ref={(element) => {
                        otpInputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="text"
                      autoComplete="one-time-code"
                      placeholder="X"
                      value={cvOtpChars[index]}
                      onChange={(event) => handleOtpInputChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      onPaste={(event) => handleOtpPaste(index, event)}
                      className={`${styles["app-header__cvInput"]} ${styles["app-header__cvInput--otp"]}`}
                      maxLength={1}
                      aria-label={`OTP character ${index + 1}`}
                    />
                  ))}
                </div>
                {cvError && <p className={styles["app-header__cvError"]}>{cvError}</p>}
                <div
                  className={`${styles["app-header__cvActions"]} ${styles["app-header__cvActions--otp"]}`}
                >
                  <button
                    type="submit"
                    className={styles["app-header__cvPrimary"]}
                    disabled={cvLoading || cvOtp.length !== OTP_LENGTH}
                  >
                    {cvLoading && (
                      <LoaderCircle className={styles["app-header__cvSpinner"]} aria-hidden="true" />
                    )}
                    <span>Verify & Download</span>
                  </button>
                  <button
                    type="button"
                    className={styles["app-header__cvSecondary"]}
                    disabled={cvCountdown > 0 || cvLoading}
                    onClick={() => {
                      void handleCvResend();
                    }}
                  >
                    {cvCountdown > 0
                      ? `Resend in ${Math.floor(cvCountdown / 60)
                          .toString()
                          .padStart(2, "0")}:${(cvCountdown % 60)
                          .toString()
                          .padStart(2, "0")}`
                      : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
