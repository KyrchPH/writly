import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Instagram,
  Linkedin,
  Mail,
  MessageCircleMore,
  PhoneCall,
  Send,
} from "lucide-react";
import { Button } from "./ui/button";
import styles from "./ContactMe.module.css";
import { useScrollReveal } from "../hooks/useScrollReveal";
import instagramLogo from "@/assets/icons/instagram.png";
import telegramLogo from "@/assets/icons/telegram.png";
import whatsappLogo from "@/assets/icons/whatsapp.png";

type ContactConfig = {
  email: string;
  phone: string;
  instagramUrl: string;
  whatsappUrl: string;
  telegramUrl: string;
  linkedinUrl: string;
};

const API_BASE = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000/api").replace(
  /\/+$/,
  "",
);

const defaultContacts: ContactConfig = {
  email: "archie.sevillano29@gmail.com",
  phone: "",
  instagramUrl: "",
  whatsappUrl: "",
  telegramUrl: "",
  linkedinUrl: "",
};

const buildGmailComposeUrl = (email: string) => {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: "Project inquiry",
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
};

function ContactMe() {
  const [contacts, setContacts] = useState<ContactConfig>(defaultContacts);
  const [copyNotice, setCopyNotice] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);
  const revealRef = useScrollReveal<HTMLDivElement>({
    selector: "[data-reveal='contact-panel']",
    visibleClass: styles["contact-me__panel--visible"],
  });

  useEffect(() => {
    let cancelled = false;

    const loadContacts = async () => {
      try {
        const response = await fetch(`${API_BASE}/public/contacts`);
        if (!response.ok) return;

        const payload = (await response.json()) as {
          data?: {
            email?: string | null;
            phone?: string | null;
            instagramUrl?: string | null;
            whatsappUrl?: string | null;
            telegramUrl?: string | null;
            linkedinUrl?: string | null;
          } | null;
        };

        if (!payload.data || cancelled) return;
        setContacts((prev) => ({
          ...prev,
          email: payload.data?.email || "",
          phone: payload.data?.phone || "",
          instagramUrl: payload.data?.instagramUrl || "",
          whatsappUrl: payload.data?.whatsappUrl || "",
          telegramUrl: payload.data?.telegramUrl || "",
          linkedinUrl: payload.data?.linkedinUrl || "",
        }));
      } catch {
        // Keep defaults when API fails.
      }
    };

    void loadContacts();
    return () => {
      cancelled = true;
    };
  }, []);

  const contactChannels = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: contacts.whatsappUrl,
      icon: MessageCircleMore,
      logo: whatsappLogo,
      external: true,
    },
    {
      key: "telegram",
      label: "Telegram",
      href: contacts.telegramUrl,
      icon: Send,
      logo: telegramLogo,
      external: true,
    },
    {
      key: "instagram",
      label: "Instagram",
      href: contacts.instagramUrl,
      icon: Instagram,
      logo: instagramLogo,
      external: true,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: contacts.linkedinUrl,
      icon: Linkedin,
      external: true,
    },
    {
      key: "phone",
      label: "Call",
      href: contacts.phone ? `tel:${contacts.phone}` : "",
      icon: PhoneCall,
      external: false,
    },
  ].filter((channel) => channel.href.trim().length > 0);
  const gmailComposeUrl = buildGmailComposeUrl(contacts.email);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contacts.email);
      setEmailCopied(true);
      setCopyNotice("Email copied.");
      window.setTimeout(() => {
        setEmailCopied(false);
        setCopyNotice("");
      }, 2200);
    } catch {
      setCopyNotice("Clipboard access is unavailable.");
    }
  };

  return (
    <div className={styles["contact-me"]} ref={revealRef}>
      <div className={styles["contact-me__intro"]}>
        <p className={styles["contact-me__eyebrow"]}>Contact</p>
        <h2 className={styles["contact-me__title"]}>Reach me directly.</h2>
        <p className={styles["contact-me__lead"]}>
          Pick the channel that is easiest for you. Each button opens the app or contact
          method directly.
        </p>
      </div>

      <div className={styles["contact-me__cards"]}>
        <section className={styles["contact-me__card"]} data-reveal="contact-panel">
          <div className={styles["contact-me__cardHeader"]}>
            <h3>Social platforms</h3>
            <p>Open the channel you prefer and message me directly.</p>
          </div>

          {contactChannels.length > 0 ? (
          <div className={styles["contact-me__channelList"]}>
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              return (
                <a
                  key={channel.key}
                  href={channel.href}
                  className={styles["contact-me__channelButton"]}
                  target={channel.external ? "_blank" : undefined}
                  rel={channel.external ? "noreferrer" : undefined}
                >
                  {"logo" in channel ? (
                    <img
                      src={channel.logo}
                      alt=""
                      className={styles["contact-me__platformLogo"]}
                    />
                  ) : (
                    <Icon className={styles["contact-me__platformIcon"]} />
                  )}
                  <span>{channel.label}</span>
                  <ArrowUpRight className={styles["contact-me__arrow"]} />
                </a>
              );
            })}
          </div>
          ) : (
            <p className={styles["contact-me__empty"]}>
              Social contact buttons appear when configured in admin.
            </p>
          )}
        </section>

        <section className={styles["contact-me__card"]} data-reveal="contact-panel">
          <div className={styles["contact-me__cardHeader"]}>
            <h3>Contact me via Email</h3>
            <p>You can also drop your other contacts in your email body so I can reach you easily.</p>
          </div>

          {contacts.email ? (
            <>
              <div className={styles["contact-me__emailRow"]}>
                <span className={styles["contact-me__emailLabel"]}>Email:</span>
                <a
                  href={gmailComposeUrl}
                  className={styles["contact-me__emailLink"]}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>{contacts.email}</span>
                  <ArrowUpRight className={styles["contact-me__arrow"]} />
                </a>
                <button
                  type="button"
                  className={styles["contact-me__copyButton"]}
                  onClick={() => void handleCopyEmail()}
                  aria-label="Copy email address"
                >
                  {emailCopied ? (
                    <Check className={styles["contact-me__icon"]} />
                  ) : (
                    <Copy className={styles["contact-me__icon"]} />
                  )}
                </button>
              </div>

              <Button asChild className={styles["contact-me__emailButton"]}>
                <a href={gmailComposeUrl} target="_blank" rel="noreferrer">
                  <Mail className={styles["contact-me__icon"]} />
                  <span>Open Gmail</span>
                </a>
              </Button>
            </>
          ) : (
            <p className={styles["contact-me__empty"]}>
              Email contact appears when configured in admin.
            </p>
          )}

          {copyNotice && <p className={styles["contact-me__notice"]}>{copyNotice}</p>}
        </section>
      </div>
    </div>
  );
}

export default ContactMe;
