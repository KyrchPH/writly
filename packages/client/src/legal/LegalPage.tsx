import { ArrowLeft, FileSignature, LockKeyhole } from "lucide-react";
import styles from "./LegalPage.module.css";

type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

const effectiveDate = "July 25, 2026";

const termsSections: LegalSection[] = [
  {
    id: "agreement",
    title: "1. Agreement to these terms",
    content: (
      <>
        <p>
          These Terms of Service (“Terms”) govern your access to and use of Writly,
          including its contract drafting, document delivery, electronic signing, and
          related services (the “Service”). By creating an account, accessing a
          recipient link, or using the Service, you agree to these Terms.
        </p>
        <p>
          If you use Writly for a business or other organization, you confirm that you
          have authority to accept these Terms on its behalf. If you do not agree, do
          not use the Service.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "2. Eligibility and accounts",
    content: (
      <>
        <p>
          You must be at least 18 years old and legally able to enter into a binding
          agreement. You are responsible for the accuracy of your account information,
          for safeguarding your credentials, and for activity under your account.
        </p>
        <p>
          Tell us promptly through the contact method provided with the Service if you
          believe your account or a signing link has been compromised.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "3. Using Writly",
    content: (
      <>
        <p>
          Writly lets authorized users upload PDFs, place text and signature fields,
          create reusable templates, send recipient links, collect completed fields and
          signatures, and export completed agreements. Features may change as the
          Service develops.
        </p>
        <p>
          You are responsible for reviewing every document, recipient, field, and final
          export before relying on it. Writly provides software tools and does not
          provide legal, tax, financial, or professional advice.
        </p>
      </>
    ),
  },
  {
    id: "esign",
    title: "4. Electronic records and signatures",
    content: (
      <>
        <p>
          By using an electronic signature or submitting a document through Writly, you
          consent to transact electronically and intend your electronic action to have
          the same effect as a handwritten signature to the extent permitted by
          applicable law.
        </p>
        <p>
          You are responsible for confirming that electronic signatures are suitable
          for your document, jurisdiction, and circumstances. Some documents may
          require special formalities, witnesses, notarization, or paper originals.
          Writly does not guarantee that a document or signature will be enforceable.
        </p>
      </>
    ),
  },
  {
    id: "content",
    title: "5. Your documents and content",
    content: (
      <>
        <p>
          You retain ownership of documents, templates, text, signatures, contact
          details, and other content you submit (“User Content”). You grant Writly a
          limited license to host, process, reproduce, transmit, and display User
          Content only as needed to operate, secure, support, and improve the Service.
        </p>
        <p>
          You confirm that you have all rights and permissions needed to upload and
          process User Content, invite recipients, and request signatures. You are
          responsible for your retention of completed documents and should keep your
          own copies.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable use",
    content: (
      <>
        <p>You may not use Writly to:</p>
        <ul>
          <li>break the law, violate another person’s rights, or facilitate fraud;</li>
          <li>impersonate someone or obtain a signature through deception or coercion;</li>
          <li>upload malware or content that is unlawful, abusive, or infringing;</li>
          <li>probe, disrupt, overload, or bypass the security of the Service;</li>
          <li>access another person’s account or documents without authorization; or</li>
          <li>reverse engineer or resell the Service except where the law permits it.</li>
        </ul>
      </>
    ),
  },
  {
    id: "availability",
    title: "7. Availability and third-party services",
    content: (
      <p>
        The Service may depend on hosting, authentication, storage, database, and email
        providers. We aim to keep Writly reliable, but do not promise uninterrupted,
        error-free, or permanently available access. Third-party services may have
        separate terms and may occasionally affect Writly’s operation.
      </p>
    ),
  },
  {
    id: "suspension",
    title: "8. Suspension and termination",
    content: (
      <p>
        You may stop using Writly at any time. We may restrict or terminate access when
        reasonably necessary to protect users or the Service, comply with law,
        investigate suspected misuse, or address a material breach of these Terms.
        Provisions that by their nature should survive termination will remain in effect.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "9. Disclaimers",
    content: (
      <p>
        To the fullest extent permitted by law, Writly is provided “as is” and “as
        available,” without warranties of merchantability, fitness for a particular
        purpose, non-infringement, legal validity, or uninterrupted operation. Nothing
        in these Terms excludes rights or warranties that cannot lawfully be excluded.
      </p>
    ),
  },
  {
    id: "liability",
    title: "10. Limitation of liability",
    content: (
      <p>
        To the fullest extent permitted by law, Writly and its operators will not be
        liable for indirect, incidental, special, consequential, or punitive damages,
        or for lost profits, data, business, or opportunities arising from the Service.
        These limits do not apply where liability cannot legally be limited.
      </p>
    ),
  },
  {
    id: "changes",
    title: "11. Changes to these terms",
    content: (
      <p>
        We may update these Terms to reflect changes to the Service, law, or our
        practices. We will post the revised Terms and update the effective date.
        Continued use after an update means you accept the revised Terms, where
        permitted by law.
      </p>
    ),
  },
  {
    id: "contact",
    title: "12. Contact",
    content: (
      <p>
        Questions about these Terms may be sent through the contact or support method
        provided in Writly or by the organization that gave you access to the Service.
      </p>
    ),
  },
];

const privacySections: LegalSection[] = [
  {
    id: "scope",
    title: "1. Scope",
    content: (
      <p>
        This Privacy Policy explains how Writly collects, uses, discloses, and protects
        personal information when you use the Service as an account holder, document
        sender, recipient, or signer. An organization using Writly may separately
        control information in its documents and should answer questions about why it
        asked you to sign.
      </p>
    ),
  },
  {
    id: "information",
    title: "2. Information we collect",
    content: (
      <>
        <h3>Information you provide</h3>
        <ul>
          <li>account details such as your name, email address, and profile information;</li>
          <li>documents, templates, entered text, signatures, and form-field values;</li>
          <li>recipient names, email addresses, and delivery instructions;</li>
          <li>messages or information you provide when requesting support.</li>
        </ul>
        <h3>Information collected through use</h3>
        <ul>
          <li>document events such as creation, sending, viewing, and submission times;</li>
          <li>device, browser, approximate location derived from IP, and log data;</li>
          <li>diagnostic details, error reports, and the page where an error occurred;</li>
          <li>local identifiers and draft data stored in your browser for recovery.</li>
        </ul>
      </>
    ),
  },
  {
    id: "use",
    title: "3. How we use information",
    content: (
      <>
        <p>We use personal information to:</p>
        <ul>
          <li>create accounts and authenticate users;</li>
          <li>create, store, deliver, sign, and export documents;</li>
          <li>send transactional emails and recipient links;</li>
          <li>maintain document history, prevent misuse, and protect the Service;</li>
          <li>troubleshoot errors, provide support, and improve performance;</li>
          <li>comply with legal obligations and enforce our Terms.</li>
        </ul>
      </>
    ),
  },
  {
    id: "legal-bases",
    title: "4. Reasons we process information",
    content: (
      <p>
        Depending on your location, we process information to perform a contract with
        you, follow your instructions or those of the document sender, pursue legitimate
        interests such as security and service improvement, comply with law, or act with
        your consent. You may withdraw consent where consent is the basis, without
        affecting earlier processing.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "5. How information is shared",
    content: (
      <>
        <p>We may share information:</p>
        <ul>
          <li>
            with document senders, recipients, signers, and workspace members as needed
            to complete a transaction;
          </li>
          <li>
            with providers that support authentication, databases, file storage,
            hosting, monitoring, and email delivery;
          </li>
          <li>
            when required by law or reasonably necessary to protect rights, safety, and
            the integrity of the Service;
          </li>
          <li>
            in connection with a merger, financing, acquisition, or sale of assets,
            subject to appropriate safeguards.
          </li>
        </ul>
        <p>We do not sell personal information or use document content for advertising.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "6. Retention",
    content: (
      <p>
        We retain information for as long as needed to provide the Service, maintain
        transaction records, meet legal obligations, resolve disputes, and protect the
        Service. Retention varies by data type and workspace settings. Copies may remain
        temporarily in backups after deletion. Document senders and recipients should
        keep their own required records.
      </p>
    ),
  },
  {
    id: "security",
    title: "7. Security",
    content: (
      <p>
        We use reasonable administrative, technical, and organizational safeguards
        designed to protect information. No online service is completely secure, so use
        a strong unique password, protect recipient links, and avoid uploading
        information that is not needed for the agreement.
      </p>
    ),
  },
  {
    id: "choices",
    title: "8. Your choices and rights",
    content: (
      <>
        <p>
          Depending on your location and relationship with Writly, you may have rights
          to access, correct, delete, restrict, object to, or receive a copy of your
          personal information, and to withdraw consent or complain to a regulator.
        </p>
        <p>
          Account holders may update certain profile information through the Service.
          If your information appears in a document sent by an organization, contact
          that organization first because it may control the document and its retention.
          We may verify your identity before fulfilling a request.
        </p>
      </>
    ),
  },
  {
    id: "browser",
    title: "9. Browser storage",
    content: (
      <p>
        Writly may use local storage and similar browser technologies for authentication
        state, preferences, visitor identifiers, and draft recovery. Blocking or
        clearing browser storage may sign you out or remove locally recoverable drafts.
        Writly does not currently describe the Service as using advertising cookies.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "10. International processing",
    content: (
      <p>
        Writly and its providers may process information in countries other than yours.
        Where required, we use appropriate safeguards for international transfers. Data
        protection laws in those countries may differ from those where you live.
      </p>
    ),
  },
  {
    id: "children",
    title: "11. Children",
    content: (
      <p>
        Writly is not directed to children under 18, and we do not knowingly collect
        their personal information. Contact us if you believe a child has provided
        personal information through the Service.
      </p>
    ),
  },
  {
    id: "updates",
    title: "12. Updates to this policy",
    content: (
      <p>
        We may revise this Policy as the Service or legal requirements change. We will
        post the updated version and change the effective date. We may provide
        additional notice when a change is material.
      </p>
    ),
  },
  {
    id: "contact",
    title: "13. Contact",
    content: (
      <p>
        To ask a privacy question or exercise a privacy right, use the contact or
        support method provided in Writly or contact the organization that sent your
        document. Please do not include sensitive document contents in an initial
        support request.
      </p>
    ),
  },
];

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const isTerms = kind === "terms";
  const sections = isTerms ? termsSections : privacySections;
  const title = isTerms ? "Terms of Service" : "Privacy Policy";
  const summary = isTerms
    ? "The rules that keep Writly useful, secure, and fair for everyone."
    : "How Writly handles information across drafting, delivery, and signing.";
  const Icon = isTerms ? FileSignature : LockKeyhole;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Writly home">
          <img src="/writly-logo-black.svg" alt="Writly" />
        </a>
        <a className={styles.backLink} href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Writly
        </a>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <span className={styles.iconWrap}><Icon size={24} aria-hidden="true" /></span>
            <p className={styles.eyebrow}>Writly legal</p>
            <h1>{title}</h1>
            <p className={styles.summary}>{summary}</p>
            <p className={styles.date}>Effective {effectiveDate}</p>
          </div>
        </section>

        <div className={styles.layout}>
          <aside className={styles.toc} aria-label={`${title} sections`}>
            <p>On this page</p>
            <nav>
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>{section.title}</a>
              ))}
            </nav>
          </aside>

          <article className={styles.article}>
            <div className={styles.notice}>
              <strong>Plain-language summary</strong>
              <p>
                {isTerms
                  ? "Use Writly lawfully, protect your account and signing links, and review documents before relying on them."
                  : "Writly uses the information needed to run the contract workflow, secure the service, and support its users."}
              </p>
            </div>
            {sections.map((section) => (
              <section key={section.id} id={section.id} className={styles.section}>
                <h2>{section.title}</h2>
                {section.content}
              </section>
            ))}
          </article>
        </div>
      </main>

      <footer className={styles.footer}>
        <div>
          <span>© {new Date().getFullYear()} Writly</span>
          <nav aria-label="Legal">
            <a aria-current={isTerms ? "page" : undefined} href="/terms">Terms</a>
            <a aria-current={!isTerms ? "page" : undefined} href="/privacy">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
