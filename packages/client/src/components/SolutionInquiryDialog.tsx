import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Mail, Send, X } from "lucide-react";
import styles from "./SolutionInquiryDialog.module.css";

export type SolutionInquiryType = "operations" | "business-systems" | "ai-automation";

type SolutionInquiryItem = {
  id: string;
  title: string;
  subtitle: string;
};

type SolutionInquiryContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: SolutionInquiryItem[];
};

type SolutionInquiryDialogProps = {
  inquiryType: SolutionInquiryType | null;
  onClose: () => void;
};

const solutionInquiryContent: Record<SolutionInquiryType, SolutionInquiryContent> = {
  operations: {
    eyebrow: "Internal operations",
    title: "What operational improvements are you currently looking for?",
    subtitle: "Select the operational tools or support work your business needs.",
    items: [
      {
        id: "operations-dashboard",
        title: "Operations Dashboard",
        subtitle:
          "Track tasks, sales, requests, team output, and business metrics in one internal dashboard.",
      },
      {
        id: "automated-reports",
        title: "Automated Reports",
        subtitle:
          "Generate daily, weekly, or monthly reports automatically from spreadsheets, databases, or business tools.",
      },
      {
        id: "data-cleanup",
        title: "Data Cleanup & Processing",
        subtitle:
          "Organize messy spreadsheets, remove duplicates, format data, and prepare files for business use.",
      },
      {
        id: "inventory-asset-tracker",
        title: "Inventory / Asset Tracker",
        subtitle:
          "Monitor products, equipment, supplies, or company assets with searchable records and status updates.",
      },
      {
        id: "admin-workflow-tool",
        title: "Admin Workflow Tool",
        subtitle:
          "Replace repetitive manual admin work with a simple internal system for approvals, tracking, and updates.",
      },
      {
        id: "client-request-management",
        title: "Client / Request Management System",
        subtitle:
          "Track customer requests, service tickets, follow-ups, and assigned team members in one place.",
      },
    ],
  },
  "business-systems": {
    eyebrow: "Custom systems",
    title: "What app or software would help your business grow?",
    subtitle: "Select the system type that fits the workflow you want to build.",
    items: [
      {
        id: "booking-appointment-system",
        title: "Booking / Appointment System",
        subtitle:
          "Let clients schedule services, appointments, or consultations through a custom web or mobile system.",
      },
      {
        id: "client-portal",
        title: "Client Portal",
        subtitle:
          "Give clients a secure place to view updates, submit requests, upload files, or track project progress.",
      },
      {
        id: "custom-crm",
        title: "Custom CRM System",
        subtitle:
          "Manage leads, customers, follow-ups, sales activity, and client history in a system built for your workflow.",
      },
      {
        id: "order-job-tracking",
        title: "Order / Job Tracking System",
        subtitle:
          "Track orders, jobs, service requests, delivery status, and team assignments from start to finish.",
      },
      {
        id: "ecommerce-ordering",
        title: "E-Commerce / Online Ordering System",
        subtitle:
          "Sell products or accept custom orders online with checkout, order management, and customer notifications.",
      },
      {
        id: "mobile-business-app",
        title: "Mobile App for Business Operations",
        subtitle:
          "Build a mobile app for staff, customers, field teams, bookings, reporting, or service tracking.",
      },
    ],
  },
  "ai-automation": {
    eyebrow: "AI automation",
    title: "What areas of your operations need more support or automation?",
    subtitle: "Select the automation ideas you want to explore for your business.",
    items: [
      {
        id: "chat-agent",
        title: "Chat Agent",
        subtitle: "An AI agent that responds to client or customer inquiries 24/7.",
      },
      {
        id: "hr-assistant",
        title: "HR Assistant",
        subtitle:
          "An automated workflow that reads applicants' resumes and creates a shortlist of qualified job candidates.",
      },
      {
        id: "document-processing-assistant",
        title: "Document Processing Assistant",
        subtitle:
          "Extract important details from invoices, forms, contracts, PDFs, or uploaded documents automatically.",
      },
      {
        id: "email-response-automation",
        title: "Email Response Automation",
        subtitle:
          "Classify incoming emails, draft replies, route messages, and help your team respond faster.",
      },
      {
        id: "lead-qualification-agent",
        title: "Lead Qualification Agent",
        subtitle:
          "Review new inquiries, ask follow-up questions, score leads, and send qualified prospects to your team.",
      },
      {
        id: "ai-report-generator",
        title: "AI Report Generator",
        subtitle:
          "Turn raw business data, notes, or documents into clean summaries, reports, and action items.",
      },
      {
        id: "tool-integration-workflow",
        title: "Tool Integration Workflow",
        subtitle:
          "Connect forms, spreadsheets, CRMs, email, and databases so information moves automatically.",
      },
    ],
  },
};

const otherItemId = "other";

export function SolutionInquiryDialog({
  inquiryType,
  onClose,
}: SolutionInquiryDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [otherRequest, setOtherRequest] = useState("");
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const content = inquiryType ? solutionInquiryContent[inquiryType] : null;
  const isOtherSelected = selectedItems.includes(otherItemId);
  const hasSelectedPreset = selectedItems.some((itemId) => itemId !== otherItemId);
  const canSubmit = hasSelectedPreset || (isOtherSelected && otherRequest.trim().length > 0);

  useEffect(() => {
    if (!inquiryType) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [inquiryType]);

  useEffect(() => {
    if (inquiryType) {
      setSelectedItems([]);
      setOtherRequest("");
      setEmail("");
      setSubmittedEmail("");
      setIsEmailDialogOpen(false);
    }
  }, [inquiryType]);

  const selectedTitles = useMemo(() => {
    if (!content) return [];
    const itemTitles = content.items
      .filter((item) => selectedItems.includes(item.id))
      .map((item) => item.title);
    if (isOtherSelected && otherRequest.trim()) {
      itemTitles.push(`Other: ${otherRequest.trim()}`);
    }
    return itemTitles;
  }, [content, isOtherSelected, otherRequest, selectedItems]);

  if (!content) return null;

  const toggleItem = (itemId: string) => {
    setSelectedItems((current) =>
      current.includes(itemId)
        ? current.filter((selectedItemId) => selectedItemId !== itemId)
        : [...current, itemId],
    );
  };

  const submitEmail = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedEmail(email.trim());
    setEmail("");
    setIsEmailDialogOpen(false);
  };

  const dialog = (
    <div className={styles.inquiryDialog__overlay}>
      <section
        className={styles.inquiryDialog__panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-inquiry-title"
      >
        <header className={styles.inquiryDialog__header}>
          <div>
            <p className={styles.inquiryDialog__eyebrow}>{content.eyebrow}</p>
            <h2 id="solution-inquiry-title">{content.title}</h2>
            <p>{content.subtitle}</p>
          </div>
          <button
            type="button"
            className={styles.inquiryDialog__close}
            onClick={onClose}
            aria-label="Close service options"
          >
            <X size={17} />
          </button>
        </header>

        <div className={styles.inquiryDialog__scrollArea}>
          <div className={styles.inquiryDialog__list}>
            {content.items.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`${styles.inquiryDialog__tile} ${
                    isSelected ? styles["inquiryDialog__tile--selected"] : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span className={styles.inquiryDialog__check}>
                    {isSelected && <Check size={13} />}
                  </span>
                  <span className={styles.inquiryDialog__tileText}>
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </span>
                </label>
              );
            })}

            <label
              className={`${styles.inquiryDialog__tile} ${
                isOtherSelected ? styles["inquiryDialog__tile--selected"] : ""
              }`}
            >
              <input
                type="checkbox"
                checked={isOtherSelected}
                onChange={() => toggleItem(otherItemId)}
              />
              <span className={styles.inquiryDialog__check}>
                {isOtherSelected && <Check size={13} />}
              </span>
              <span className={styles.inquiryDialog__tileText}>
                <strong>Other</strong>
                <span>Specify the service or workflow your business needs.</span>
              </span>
            </label>

            {isOtherSelected && (
              <label className={styles.inquiryDialog__otherField}>
                <span>Service needed</span>
                <textarea
                  value={otherRequest}
                  onChange={(event) => setOtherRequest(event.target.value)}
                  placeholder="Describe what you want to build or automate."
                  rows={3}
                />
              </label>
            )}
          </div>
        </div>

        <footer className={styles.inquiryDialog__footer}>
          {selectedItems.length > 0 && (
            <div className={styles.inquiryDialog__selectionCount}>
              <strong>{selectedItems.length}</strong>
              <span>selected</span>
            </div>
          )}
          {submittedEmail && (
            <p className={styles.inquiryDialog__notice}>
              Inquiry received from {submittedEmail}.
            </p>
          )}
          <button
            type="button"
            className={styles.inquiryDialog__submit}
            disabled={!canSubmit}
            onClick={() => setIsEmailDialogOpen(true)}
          >
            <Send size={15} />
            <span>Submit</span>
          </button>
        </footer>
      </section>

      {isEmailDialogOpen && (
        <div className={styles.inquiryDialog__emailOverlay}>
          <section
            className={styles.inquiryDialog__emailDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="solution-email-title"
          >
            <button
              type="button"
              className={styles.inquiryDialog__emailClose}
              onClick={() => setIsEmailDialogOpen(false)}
              aria-label="Close email popup"
            >
              <X size={16} />
            </button>
            <div className={styles.inquiryDialog__emailHeader}>
              <h3 id="solution-email-title">Enter your active email address</h3>
              <p>{selectedTitles.join(", ")}</p>
            </div>
            <form className={styles.inquiryDialog__emailForm} onSubmit={submitEmail}>
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>
              <button type="submit" className={styles.inquiryDialog__emailSubmit}>
                <Mail size={15} />
                <span>Submit Email</span>
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return dialog;

  return createPortal(dialog, document.body);
}
