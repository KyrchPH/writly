import { useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Brush,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Copy,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  GripVertical,
  ImagePlus,
  Instagram,
  Linkedin,
  Link2,
  LayoutDashboard,
  LogOut,
  Lock,
  Mail,
  MessageSquare,
  Minus,
  MonitorSmartphone,
  Moon,
  Pencil,
  PhoneCall,
  Plus,
  Printer,
  RefreshCw,
  Redo2,
  RotateCcw,
  Search,
  Send,
  Shield,
  Scissors,
  Sun,
  Trash2,
  Type,
  Unlock,
  Undo2,
  UsersRound,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import instagramLogo from "../assets/icons/instagram.png";
import telegramLogo from "../assets/icons/telegram.png";
import whatsappLogo from "../assets/icons/whatsapp.png";
import {
  ContractPdfViewer,
  type ContractPdfField,
} from "../components/ContractPdfViewer";
import { PDFDocument, rgb, type PDFPage, type RGB } from "pdf-lib";
import styles from "./AdminApp.module.css";

type AuthMode = "login" | "signup" | "forgot" | "reset";
type SectionId =
  | "dashboard"
  | "requests"
  | "projects"
  | "services"
  | "banners"
  | "workExperiences"
  | "certificates"
  | "clients"
  | "contracts"
  | "reviews"
  | "contacts"
  | "cv"
  | "analytics"
  | "errorLogs";
type ProjectStatus = "Draft" | "Published" | "Archived";
type ProjectDeliveryStatus = "Completed" | "Canceled" | "Ongoing" | "Pending";
type AdminErrorScope = "global" | SectionId;
type CvDocumentType = "ATS" | "Visual";
type ReviewStatus = "Pending" | "Approved";
type CvSortMode =
  | "created-desc"
  | "created-asc"
  | "downloads-desc"
  | "downloads-asc"
  | "status-desc"
  | "status-active"
  | "status-inactive";

type ApiUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type DashboardStats = {
  projects: number;
  services: number;
  certificates: number;
  reviews: number;
};

type AdminLoginLog = {
  id: string;
  deviceName: string;
  userAgent: string | null;
  createdAt: string;
};

type AdminProject = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: ProjectStatus;
  imageUrl: string | null;
  portraitImageUrl: string | null;
  landscapeImageUrl: string | null;
  previewImages: string[];
  isFeatured: boolean;
  isPinned: boolean;
  deliveryStatus: ProjectDeliveryStatus;
  startDate: string;
  endDate: string | null;
  tags: string[];
  highlights: string[];
  details: string | null;
  updatedAt: string;
};

type AdminService = {
  id: string;
  name: string;
  summary: string;
  imageUrl: string | null;
};

type AdminBanner = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  sortOrder: number;
};

type AdminWorkExperience = {
  id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  summary: string;
  imageUrl: string | null;
  highlights: string[];
  sortOrder: number;
};

type AdminCertificate = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string | null;
};

type AdminReview = {
  id: string;
  clientId: string | null;
  client: string;
  clientEmail: string | null;
  clientCompany: string | null;
  role: string | null;
  rating: number;
  avatar: string | null;
  excerpt: string;
  detail: string | null;
  status: ReviewStatus;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminClientInvitation = {
  id: string;
  sentAt: string;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
};

type AdminClientInvitationResponse = {
  data: AdminClientApi | null;
  invitation?: {
    id: string;
    sentAt: string;
    expiresAt: string;
    reviewUrl?: string;
  };
  emailDelivery?: {
    status: "sent" | "failed";
    message?: string;
  };
};

type AdminClient = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  reviewCount: number;
  invitation: AdminClientInvitation | null;
  createdAt: string;
  updatedAt: string;
};

type AdminContractTemplate = {
  id: string;
  name: string;
  title: string;
  pdfDocument: AdminContractPdfDocument;
  pageCount: number;
  fields: ContractPdfField[];
  contractCount: number;
  createdAt: string;
  updatedAt: string;
};

type AdminContractPdfDocument = {
  filePath: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
};

type AdminContract = {
  id: string;
  templateId: string | null;
  title: string;
  recipientName: string;
  recipientEmail: string | null;
  pdfDocument: AdminContractPdfDocument;
  pageCount: number;
  fields: ContractPdfField[];
  values: Record<string, string>;
  contractUrl: string;
  sentAt: string | null;
  viewedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    name: string;
  } | null;
};

type AdminContractEmailResponse = {
  data: AdminContractApi;
  emailDelivery?: {
    status: "sent" | "failed";
    message?: string;
  };
};

type PendingAdminAccount = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type AdminCvDownload = {
  id: string;
  email: string;
  documentType: CvDocumentType;
  createdAt: string;
};

type AdminCvDocument = {
  filePath: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
};

type AdminCvAsset = {
  id: string;
  filePath: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  atsFilePath: string;
  atsFileUrl: string;
  atsFileName: string;
  atsMimeType: string;
  visualFilePath: string;
  visualFileUrl: string;
  visualFileName: string;
  visualMimeType: string;
  isActive: boolean;
  statusUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  downloads: AdminCvDownload[];
};

type AdminContactConfig = {
  id: string;
  email: string | null;
  phone: string | null;
  instagramUrl: string | null;
  whatsappUrl: string | null;
  telegramUrl: string | null;
  linkedinUrl: string | null;
  showEmail: boolean;
  showPhone: boolean;
  showInstagram: boolean;
  showWhatsapp: boolean;
  showTelegram: boolean;
  showLinkedin: boolean;
  updatedAt: string;
};

type AdminAnalyticsStats = {
  totalUniqueVisitors: number;
  totalVisits: number;
  todayVisits: number;
  repeatVisitors: number;
};

type AdminVisitorGraphPoint = {
  date: string;
  visits: number;
  uniqueVisitors: number;
};

type AdminErrorLogStats = {
  openErrors: number;
  frontendErrors: number;
  backendErrors: number;
  latestErrorAt: string | null;
};

type AdminErrorGraphPoint = {
  date: string;
  total: number;
  frontend: number;
  backend: number;
};

type AdminErrorLog = {
  id: string;
  source: "frontend" | "backend" | string;
  message: string;
  stack: string | null;
  details: string | null;
  path: string | null;
  url: string | null;
  visitorKey: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AdminContentState = {
  projects: AdminProject[];
  services: AdminService[];
  banners: AdminBanner[];
  workExperiences: AdminWorkExperience[];
  certificates: AdminCertificate[];
  reviews: AdminReview[];
};

type ApiListResponse<T> = {
  data: T[];
};

type AdminProjectApi = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: ProjectStatus;
  imageUrl?: string | null;
  portraitImageUrl?: string | null;
  landscapeImageUrl?: string | null;
  previewImages?: string[] | null;
  isFeatured?: boolean;
  isPinned?: boolean;
  projectStatus?: string | null;
  timeline?: string | null;
  startDate?: string;
  endDate?: string | null;
  tags?: string[] | null;
  highlights?: string[] | null;
  details?: string | null;
  updatedAt: string;
};

type AdminServiceApi = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
};

type AdminBannerApi = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  sortOrder: number;
};

type AdminWorkExperienceApi = {
  id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  summary: string;
  imageUrl?: string | null;
  highlights?: string[] | null;
  sortOrder: number;
};

type AdminCertificateApi = {
  id: string;
  title: string;
  org: string;
  issueDate: string;
  imageUrl?: string | null;
};

type AdminReviewApi = {
  id: string;
  clientId?: string | null;
  clientEmail?: string | null;
  clientCompany?: string | null;
  name: string;
  role?: string | null;
  rating: number;
  avatar?: string | null;
  feedback: string;
  detail?: string | null;
  status?: ReviewStatus;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
};

type AdminClientApi = AdminClient;

type AdminContractTemplateApi = AdminContractTemplate;

type AdminContractApi = AdminContract;

type AdminContractsApiResponse = {
  templates: AdminContractTemplateApi[];
  contracts: AdminContractApi[];
};

type PendingAdminApi = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type AdminDataResponses = {
  statsResponse: { stats: DashboardStats; loginLogs?: AdminLoginLog[] };
  projectsResponse: ApiListResponse<AdminProjectApi>;
  servicesResponse: ApiListResponse<AdminServiceApi>;
  bannersResponse: ApiListResponse<AdminBannerApi>;
  workExperiencesResponse: ApiListResponse<AdminWorkExperienceApi>;
  certificatesResponse: ApiListResponse<AdminCertificateApi>;
  reviewsResponse: ApiListResponse<AdminReviewApi>;
  clientsResponse: ApiListResponse<AdminClientApi>;
  contractsResponse: AdminContractsApiResponse;
  pendingUsersResponse: ApiListResponse<PendingAdminApi>;
  contactsResponse: { data: AdminContactConfig | null };
  cvResponse: { data: AdminCvAsset[]; active: AdminCvAsset | null };
  analyticsResponse: {
    stats: AdminAnalyticsStats;
    graph: AdminVisitorGraphPoint[];
  };
  errorLogsResponse: {
    stats: AdminErrorLogStats;
    graph: AdminErrorGraphPoint[];
    data: AdminErrorLog[];
  };
};

type AdminDataCacheKey = keyof AdminDataResponses;

type AdminDataCache = {
  version: number;
  savedAt: string;
  responses: Partial<AdminDataResponses>;
  etags: Partial<Record<AdminDataCacheKey, string>>;
};

type CompleteAdminDataCache = AdminDataCache & {
  responses: AdminDataResponses;
};

type CachedJsonResult<T> = {
  data: T;
  etag?: string;
  fromCache: boolean;
};

type AdminScopedError = {
  id: number;
  scope: AdminErrorScope;
  message: string;
};

type ContractDraftPdfFileMeta = {
  name: string;
  type: string;
  size: number;
  lastModified: number;
};

type ContractDraftSnapshot = {
  version: number;
  savedAt: string;
  templateId: string;
  templateName: string;
  templateTitle: string;
  existingPdf: AdminContractPdfDocument | null;
  pdfFileMeta: ContractDraftPdfFileMeta | null;
  pageCount: number;
  activePage: number;
  fields: ContractPdfField[];
  selectedFieldId: string | null;
  contractTitle: string;
  recipientName: string;
  recipientEmail: string;
  createdContractId: string | null;
};

type StoredContractDraftRecord = ContractDraftSnapshot & {
  key: string;
  pdfFile: File | Blob | null;
};

type ContractObjectClipboard = {
  field: ContractPdfField;
  action: "copy" | "cut";
} | null;

type ContractPdfExportMode = "print" | "download";
type ContractPdfPreviewPageSize = {
  width: number;
  height: number;
};
type ContractFieldHistorySnapshot = {
  fields: ContractPdfField[];
  selectedFieldId: string | null;
};

const SESSION_TOKEN_KEY = "ace_admin_token";
const SESSION_USER_KEY = "ace_admin_user";
const THEME_KEY = "ace_admin_theme";
const ACTIVE_SECTION_KEY = "ace_admin_active_section";
const SIDEBAR_COLLAPSED_KEY = "ace_admin_sidebar_collapsed";
const ADMIN_DATA_CACHE_KEY = "ace_admin_data_cache";
const ADMIN_DATA_CACHE_VERSION = 13;
const CONTRACT_DRAFT_DB_NAME = "ace_admin_contract_draft";
const CONTRACT_DRAFT_DB_VERSION = 1;
const CONTRACT_DRAFT_STORE_NAME = "drafts";
const CONTRACT_DRAFT_STORE_KEY = "current";
const CONTRACT_DRAFT_SNAPSHOT_VERSION = 1;
const CONTRACT_FIELD_HISTORY_LIMIT = 80;
const API_BASE = (import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000/api").replace(
  /\/+$/,
  "",
);

const normalizeUrlInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) return trimmed;
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

const defaultContent: AdminContentState = {
  projects: [],
  services: [],
  banners: [],
  workExperiences: [],
  certificates: [],
  reviews: [],
};

const defaultAnalyticsStats: AdminAnalyticsStats = {
  totalUniqueVisitors: 0,
  totalVisits: 0,
  todayVisits: 0,
  repeatVisitors: 0,
};

const defaultErrorLogStats: AdminErrorLogStats = {
  openErrors: 0,
  frontendErrors: 0,
  backendErrors: 0,
  latestErrorAt: null,
};

const navItems: Array<{ id: SectionId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "contracts", label: "Contracts", icon: FileText },
];

const cvSortOptions: Array<{ value: CvSortMode; label: string }> = [
  { value: "created-desc", label: "Newest created" },
  { value: "created-asc", label: "Oldest created" },
  { value: "downloads-desc", label: "Most downloads" },
  { value: "downloads-asc", label: "Fewest downloads" },
  { value: "status-desc", label: "Latest status update" },
  { value: "status-active", label: "Active status first" },
  { value: "status-inactive", label: "Inactive status first" },
];

const adminDataCacheResponseKeys: AdminDataCacheKey[] = [
  "statsResponse",
  "projectsResponse",
  "servicesResponse",
  "bannersResponse",
  "workExperiencesResponse",
  "certificatesResponse",
  "reviewsResponse",
  "clientsResponse",
  "contractsResponse",
  "pendingUsersResponse",
  "contactsResponse",
  "cvResponse",
  "analyticsResponse",
  "errorLogsResponse",
];

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const readFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const readBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const clampAdminNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isContractFieldTextAlign = (
  value: unknown,
): value is NonNullable<ContractPdfField["textAlign"]> =>
  value === "left" || value === "center" || value === "right" || value === "justify";

const isContractFieldFontStyle = (
  value: unknown,
): value is NonNullable<ContractPdfField["fontStyle"]> =>
  value === "regular" || value === "bold" || value === "italic" || value === "boldItalic";

const normalizeStoredPdfDocument = (value: unknown): AdminContractPdfDocument | null => {
  if (!isRecord(value)) return null;

  const filePath = readString(value.filePath).trim();
  const fileUrl = readString(value.fileUrl).trim();
  const fileName = readString(value.fileName).trim();
  if (!filePath || !fileUrl || !fileName) return null;

  return {
    filePath,
    fileUrl,
    fileName,
    mimeType: readString(value.mimeType, "application/pdf") || "application/pdf",
  };
};

const normalizeStoredPdfFileMeta = (value: unknown): ContractDraftPdfFileMeta | null => {
  if (!isRecord(value)) return null;

  const name = readString(value.name).trim();
  if (!name) return null;

  return {
    name,
    type: readString(value.type, "application/pdf") || "application/pdf",
    size: Math.max(0, readFiniteNumber(value.size, 0)),
    lastModified: Math.max(0, readFiniteNumber(value.lastModified, Date.now())),
  };
};

const normalizeStoredContractFields = (value: unknown): ContractPdfField[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item, index) => {
    if (!isRecord(item)) return [];

    const type =
      item.type === "text" ||
      item.type === "textbox" ||
      item.type === "signature" ||
      item.type === "image" ||
      item.type === "draw"
        ? item.type
        : null;
    if (!type) return [];

    const width = clampAdminNumber(
      readFiniteNumber(
        item.width,
        type === "textbox"
          ? 0.28
          : type === "signature"
            ? 0.28
            : type === "image"
              ? 0.28
              : type === "draw"
                ? 0.2
              : 0.22,
      ),
      0.03,
      1,
    );
    const height = clampAdminNumber(
      readFiniteNumber(
        item.height,
        type === "textbox"
          ? 0.028
          : type === "signature"
            ? 0.06
            : type === "image"
              ? 0.16
              : type === "draw"
                ? 0.08
              : 0.022,
      ),
      0.015,
      1,
    );
    const imageUrl = readString(item.imageUrl).trim() || undefined;
    const drawingDataUrl = readString(item.drawingDataUrl).trim() || undefined;
    const isDrafterFilledSignature =
      type === "signature" && Boolean(imageUrl || drawingDataUrl);

    return [
      {
        id:
          readString(item.id).trim() ||
          `field-restored-${index}-${Math.random().toString(36).slice(2, 7)}`,
        type,
        page: Math.max(1, Math.round(readFiniteNumber(item.page, 1))),
        x: clampAdminNumber(readFiniteNumber(item.x, 0), 0, 1 - width),
        y: clampAdminNumber(readFiniteNumber(item.y, 0), 0, 1 - height),
        width,
        height,
        objectLabel: readString(item.objectLabel).trim() || undefined,
        label: readString(
          item.label,
          type === "textbox"
            ? "Fillable field"
            : type === "signature"
              ? "Signature"
              : type === "image"
                ? "Image"
                : type === "draw"
                  ? "Drawing"
                  : "Static text",
        ),
        fontFamily: readString(item.fontFamily, defaultContractFieldFontFamily),
        fontStyle: isContractFieldFontStyle(item.fontStyle)
          ? item.fontStyle
          : defaultContractFieldFontStyle,
        fontColor: readString(item.fontColor, defaultContractFieldFontColor),
        backgroundColor: readString(
          item.backgroundColor,
          defaultContractFieldBackgroundColor,
        ),
        borderColor: readString(item.borderColor, defaultContractFieldBorderColor),
        borderWidth: clampAdminNumber(readFiniteNumber(item.borderWidth, 0), 0, 12),
        textAlign: isContractFieldTextAlign(item.textAlign) ? item.textAlign : "left",
        imageUrl,
        drawingDataUrl,
        drawColor: readString(item.drawColor, defaultContractDrawColor),
        drawStrokeWidth: clampAdminNumber(readFiniteNumber(item.drawStrokeWidth, 4), 1, 16),
        fontSize: clampAdminNumber(readFiniteNumber(item.fontSize, 14), 8, 72),
        required:
          !isDrafterFilledSignature &&
          readBoolean(item.required, type === "textbox" || type === "signature"),
        locked: readBoolean(item.locked, false),
      } satisfies ContractPdfField,
    ];
  });
};

const normalizeStoredContractDraftRecord = (
  value: unknown,
): StoredContractDraftRecord | null => {
  if (!isRecord(value)) return null;

  const fields = normalizeStoredContractFields(value.fields);
  const selectedFieldId = readString(value.selectedFieldId).trim();
  const pdfFileMeta = normalizeStoredPdfFileMeta(value.pdfFileMeta);
  const pdfFile = value.pdfFile instanceof Blob ? value.pdfFile : null;

  return {
    key: CONTRACT_DRAFT_STORE_KEY,
    version: readFiniteNumber(value.version, CONTRACT_DRAFT_SNAPSHOT_VERSION),
    savedAt: readString(value.savedAt, new Date().toISOString()),
    templateId: readString(value.templateId),
    templateName: readString(value.templateName),
    templateTitle: readString(value.templateTitle),
    existingPdf: normalizeStoredPdfDocument(value.existingPdf),
    pdfFileMeta,
    pageCount: Math.max(1, Math.round(readFiniteNumber(value.pageCount, 1))),
    activePage: Math.max(1, Math.round(readFiniteNumber(value.activePage, 1))),
    fields,
    selectedFieldId: fields.some((field) => field.id === selectedFieldId)
      ? selectedFieldId
      : null,
    contractTitle: readString(value.contractTitle),
    recipientName: readString(value.recipientName),
    recipientEmail: readString(value.recipientEmail),
    createdContractId: readString(value.createdContractId).trim() || null,
    pdfFile,
  };
};

const getContractDraftFileMeta = (file: File): ContractDraftPdfFileMeta => ({
  name: file.name,
  type: file.type || "application/pdf",
  size: file.size,
  lastModified: file.lastModified,
});

const openContractDraftDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = window.indexedDB.open(CONTRACT_DRAFT_DB_NAME, CONTRACT_DRAFT_DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CONTRACT_DRAFT_STORE_NAME)) {
        database.createObjectStore(CONTRACT_DRAFT_STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open draft storage."));
  });

const readStoredContractDraft = async () => {
  const database = await openContractDraftDb();
  try {
    return await new Promise<StoredContractDraftRecord | null>((resolve, reject) => {
      const transaction = database.transaction(CONTRACT_DRAFT_STORE_NAME, "readonly");
      const request = transaction.objectStore(CONTRACT_DRAFT_STORE_NAME).get(CONTRACT_DRAFT_STORE_KEY);
      let result: StoredContractDraftRecord | null = null;

      request.onsuccess = () => {
        result = normalizeStoredContractDraftRecord(request.result);
      };
      transaction.oncomplete = () => resolve(result);
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read stored contract draft."));
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Failed to read stored contract draft."));
    });
  } finally {
    database.close();
  }
};

const writeStoredContractDraft = async (
  snapshot: ContractDraftSnapshot,
  pdfFile: File | null,
) => {
  const database = await openContractDraftDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(CONTRACT_DRAFT_STORE_NAME, "readwrite");
      const record: StoredContractDraftRecord = {
        ...snapshot,
        key: CONTRACT_DRAFT_STORE_KEY,
        version: CONTRACT_DRAFT_SNAPSHOT_VERSION,
        savedAt: new Date().toISOString(),
        pdfFile: pdfFile ?? null,
        pdfFileMeta: pdfFile ? getContractDraftFileMeta(pdfFile) : snapshot.pdfFileMeta,
      };
      const request = transaction.objectStore(CONTRACT_DRAFT_STORE_NAME).put(record);

      transaction.oncomplete = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to store contract draft."));
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Failed to store contract draft."));
    });
  } finally {
    database.close();
  }
};

const deleteStoredContractDraft = async () => {
  const database = await openContractDraftDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(CONTRACT_DRAFT_STORE_NAME, "readwrite");
      const request = transaction.objectStore(CONTRACT_DRAFT_STORE_NAME).delete(CONTRACT_DRAFT_STORE_KEY);

      transaction.oncomplete = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to clear contract draft."));
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Failed to clear contract draft."));
    });
  } finally {
    database.close();
  }
};

const resolveStoredContractDraftFile = (draft: StoredContractDraftRecord) => {
  if (!draft.pdfFile || !draft.pdfFileMeta) return null;
  if (draft.pdfFile instanceof File) return draft.pdfFile;

  return new File([draft.pdfFile], draft.pdfFileMeta.name, {
    type: draft.pdfFileMeta.type || draft.pdfFile.type || "application/pdf",
    lastModified: draft.pdfFileMeta.lastModified || Date.now(),
  });
};

const isSectionId = (value: string | null): value is SectionId =>
  Boolean(value && navItems.some((item) => item.id === value));

const readStoredActiveSection = (): SectionId => {
  try {
    const storedSection = localStorage.getItem(ACTIVE_SECTION_KEY);
    return isSectionId(storedSection) ? storedSection : "contracts";
  } catch {
    return "contracts";
  }
};

const persistActiveSection = (section: SectionId) => {
  try {
    localStorage.setItem(ACTIVE_SECTION_KEY, section);
  } catch {
    // Local storage may be unavailable in strict browser privacy modes.
  }
};

const getAdminDataCacheStorageKey = (ownerId: string) =>
  `${ADMIN_DATA_CACHE_KEY}:${ownerId}`;

const isCompleteAdminDataCache = (
  cache: AdminDataCache | null,
): cache is CompleteAdminDataCache =>
  Boolean(
    cache &&
      cache.version === ADMIN_DATA_CACHE_VERSION &&
      adminDataCacheResponseKeys.every((key) => cache.responses[key]),
  );

const readAdminDataCache = (ownerId?: string | null) => {
  if (!ownerId) return null;
  const cache = safeJsonParse<AdminDataCache | null>(
    localStorage.getItem(getAdminDataCacheStorageKey(ownerId)),
    null,
  );
  return isCompleteAdminDataCache(cache) ? cache : null;
};

const writeAdminDataCache = (
  ownerId: string | null | undefined,
  responses: AdminDataResponses,
  etags: Partial<Record<AdminDataCacheKey, string | undefined>>,
) => {
  if (!ownerId) return;
  const normalizedEtags = Object.fromEntries(
    Object.entries(etags).filter(([, value]) => Boolean(value)),
  ) as Partial<Record<AdminDataCacheKey, string>>;

  localStorage.setItem(
    getAdminDataCacheStorageKey(ownerId),
    JSON.stringify({
      version: ADMIN_DATA_CACHE_VERSION,
      savedAt: new Date().toISOString(),
      responses,
      etags: normalizedEtags,
    } satisfies AdminDataCache),
  );
};

const clearAdminDataCache = (ownerId?: string | null) => {
  if (ownerId) {
    localStorage.removeItem(getAdminDataCacheStorageKey(ownerId));
    return;
  }

  Object.keys(localStorage).forEach((key) => {
    if (key === ADMIN_DATA_CACHE_KEY || key.startsWith(`${ADMIN_DATA_CACHE_KEY}:`)) {
      localStorage.removeItem(key);
    }
  });
};

const mapProject = (project: {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  status: ProjectStatus;
  imageUrl?: string | null;
  portraitImageUrl?: string | null;
  landscapeImageUrl?: string | null;
  previewImages?: string[] | null;
  isFeatured?: boolean | null;
  isPinned?: boolean | null;
  projectStatus?: string | null;
  timeline?: string | null;
  startDate?: string;
  endDate?: string | null;
  tags?: string[] | null;
  highlights?: string[] | null;
  details?: string | null;
  updatedAt?: string;
}) => ({
  id: project.id,
  title: project.title,
  category: project.category,
  description: project.description || `${project.title} project in ${project.category}.`,
  status: project.status,
  imageUrl: project.imageUrl ?? null,
  portraitImageUrl: project.portraitImageUrl ?? null,
  landscapeImageUrl: project.landscapeImageUrl ?? null,
  previewImages: Array.isArray(project.previewImages) ? project.previewImages : [],
  isFeatured: Boolean(project.isFeatured),
  isPinned: Boolean(project.isPinned),
  deliveryStatus: normalizeProjectDeliveryStatus(project.projectStatus ?? project.timeline),
  startDate: project.startDate ?? new Date().toISOString(),
  endDate: project.endDate ?? null,
  tags: Array.isArray(project.tags) ? project.tags : [],
  highlights: Array.isArray(project.highlights) ? project.highlights : [],
  details: project.details ?? null,
  updatedAt: project.updatedAt || new Date().toISOString(),
});

const getClipboardImageFiles = (clipboardData: DataTransfer | null | undefined) => {
  if (!clipboardData) return [];
  const files: File[] = [];

  for (const item of Array.from(clipboardData.items ?? [])) {
    if (item.kind !== "file") continue;
    if (!item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }

  return files;
};

const projectStatusOptions: ProjectStatus[] = ["Draft", "Published", "Archived"];
const projectDeliveryStatusOptions: ProjectDeliveryStatus[] = [
  "Completed",
  "Canceled",
  "Ongoing",
  "Pending",
];
const defaultContractFieldFontFamily = "Arial";
const defaultContractFieldFontStyle: NonNullable<ContractPdfField["fontStyle"]> = "regular";
const defaultContractFieldFontColor = "#111827";
const defaultContractFieldBackgroundColor = "transparent";
const defaultContractFieldBorderColor = "#111827";
const defaultContractDrawColor = "#111827";
const contractEraserColor = "#ffffff";
const defaultContractDrawStrokeWidth = 4;
const contractFieldTextAlignOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];
const contractFieldFontStyleOptions = [
  { value: "regular", label: "Regular" },
  { value: "bold", label: "Bold" },
  { value: "italic", label: "Italic" },
  { value: "boldItalic", label: "Bold Italic" },
];
const contractFieldFontFamilyOptions = [
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Courier New", label: "Courier New" },
  { value: "Verdana", label: "Verdana" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
];
const contractDrawColorOptions = [
  "#111827",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#2563eb",
  "#7c3aed",
];
const getContractFieldTypeLabel = (field: Pick<ContractPdfField, "type">) => {
  if (
    field.type === "draw" &&
    "drawColor" in field &&
    String(field.drawColor ?? "").toLowerCase() === contractEraserColor
  ) {
    return "Eraser";
  }
  if (field.type === "draw") return "Draw";
  if (field.type === "image") return "Image";
  if (field.type === "signature") return "Signature";
  if (field.type === "textbox") return "Textbox";
  return "Text";
};
const getContractFieldDefaultLabel = (type: ContractPdfField["type"]) => {
  if (type === "draw") return "Drawing";
  if (type === "image") return "Image";
  if (type === "signature") return "Signature";
  if (type === "textbox") return "Fillable field";
  return "Static text";
};
const getContractFieldDefaultObjectLabel = (
  field: Pick<ContractPdfField, "type">,
  index: number,
) => `${getContractFieldTypeLabel(field)} ${index + 1}`;
const getContractFieldObjectLabel = (field: ContractPdfField, index: number) =>
  field.objectLabel?.trim() || getContractFieldDefaultObjectLabel(field, index);
const cloneContractFields = (fields: ContractPdfField[]) =>
  fields.map((field) => ({ ...field }));
const createContractFieldHistorySnapshot = (
  fields: ContractPdfField[],
  selectedFieldId: string | null,
): ContractFieldHistorySnapshot => ({
  fields: cloneContractFields(fields),
  selectedFieldId: selectedFieldId && fields.some((field) => field.id === selectedFieldId)
    ? selectedFieldId
    : null,
});
const getContractColorInputValue = (value: string | undefined, fallback: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value ?? "") ? value ?? fallback : fallback;
const parseContractPdfColor = (value: string | undefined): RGB | null => {
  const normalized = value?.trim() ?? "";
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return null;

  return rgb(
    Number.parseInt(normalized.slice(1, 3), 16) / 255,
    Number.parseInt(normalized.slice(3, 5), 16) / 255,
    Number.parseInt(normalized.slice(5, 7), 16) / 255,
  );
};
const getContractPdfSourceBytes = async (pdfFile: File | null, pdfUrl: string) => {
  if (pdfFile) {
    return pdfFile.arrayBuffer();
  }

  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error("Could not load the PDF file for export.");
  }
  return response.arrayBuffer();
};
const getContractExportText = (field: ContractPdfField) => {
  if (field.type === "signature" && (field.drawingDataUrl || field.imageUrl)) return "";
  if (field.type === "signature") return "Double-click to add your signature";
  return field.label || getContractFieldDefaultLabel(field.type);
};
const getContractPdfPreviewPageSize = (
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
): ContractPdfPreviewPageSize => {
  const pageElement =
    typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>(`[data-contract-pdf-page="${pageNumber}"]`);
  const pageRect = pageElement?.getBoundingClientRect();

  if (pageRect && pageRect.width > 0 && pageRect.height > 0) {
    return { width: pageRect.width, height: pageRect.height };
  }

  const fallbackWidth = 860;
  return {
    width: fallbackWidth,
    height: pageWidth > 0 ? (fallbackWidth * pageHeight) / pageWidth : fallbackWidth,
  };
};
const getContractPdfPointScale = (
  pageWidth: number,
  previewPageSize: ContractPdfPreviewPageSize,
) => (previewPageSize.width > 0 ? pageWidth / previewPageSize.width : 1);
const getContractCanvasFontFamily = (fontFamily: string | undefined) => {
  const normalized = (fontFamily || defaultContractFieldFontFamily).trim();
  return normalized
    .split(",")
    .map((family) => {
      const cleanFamily = family.trim().replace(/^['"]|['"]$/g, "");
      return /\s/.test(cleanFamily) ? `"${cleanFamily}"` : cleanFamily;
    })
    .filter(Boolean)
    .join(", ");
};
const wrapContractCanvasText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const paragraphs = text.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      return;
    }

    let currentLine = "";
    words.forEach((word) => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !currentLine) {
        currentLine = candidate;
        return;
      }
      lines.push(currentLine);
      currentLine = word;
    });

    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines;
};
const canvasToPngBytes = (canvas: HTMLCanvasElement) =>
  new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not render text object for export."));
        return;
      }
      blob
        .arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(() => reject(new Error("Could not render text object for export.")));
    }, "image/png");
  });
const renderContractTextFieldImage = async (
  field: ContractPdfField,
  text: string,
  previewBounds: { width: number; height: number },
) => {
  const cssWidth = Math.max(1, previewBounds.width);
  const cssHeight = Math.max(1, previewBounds.height);
  const pixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(cssWidth * pixelRatio);
  canvas.height = Math.ceil(cssHeight * pixelRatio);

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare text object for export.");
  }

  context.scale(pixelRatio, pixelRatio);
  context.clearRect(0, 0, cssWidth, cssHeight);
  context.save();
  context.beginPath();
  context.rect(0, 0, cssWidth, cssHeight);
  context.clip();

  const fontSize = clampAdminNumber(field.fontSize || 14, 5, 96);
  const fontStyle =
    field.fontStyle === "italic" || field.fontStyle === "boldItalic" ? "italic" : "normal";
  const fontWeight =
    field.fontStyle === "bold" || field.fontStyle === "boldItalic" ? "700" : "400";
  const lineHeight = fontSize * 1.05;
  const paddingX = 4;
  const paddingY = 2;
  const textWidth = Math.max(1, cssWidth - paddingX * 2);

  context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${getContractCanvasFontFamily(
    field.fontFamily,
  )}`;
  context.fillStyle = field.fontColor || defaultContractFieldFontColor;
  context.textBaseline = "top";
  context.textAlign =
    field.textAlign === "center" || field.textAlign === "right" ? field.textAlign : "left";

  const maxLines = Math.max(1, Math.floor((cssHeight - paddingY * 2) / lineHeight));
  const lines = wrapContractCanvasText(context, text, textWidth).slice(0, maxLines);
  lines.forEach((line, index) => {
    const x =
      field.textAlign === "center"
        ? cssWidth / 2
        : field.textAlign === "right"
          ? cssWidth - paddingX
          : paddingX;
    const y = paddingY + index * lineHeight;
    if (y > cssHeight) return;
    context.fillText(line, x, y, textWidth);
  });

  context.restore();
  return canvasToPngBytes(canvas);
};
const dataUrlToBytes = (dataUrl: string) => {
  const separatorIndex = dataUrl.indexOf(",");
  if (separatorIndex === -1) {
    throw new Error("Invalid image data.");
  }

  const metadata = dataUrl.slice(0, separatorIndex);
  const data = dataUrl.slice(separatorIndex + 1);
  const mimeType = metadata.match(/^data:([^;,]+)/)?.[1] ?? "";
  if (metadata.includes(";base64")) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return { bytes, mimeType };
  }

  return {
    bytes: new TextEncoder().encode(decodeURIComponent(data)),
    mimeType,
  };
};
const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid file."));
    reader.onerror = () => reject(new Error("Could not read image data."));
    reader.readAsDataURL(blob);
  });
const rasterizeSvgDataUrl = (dataUrl: string, width: number, height: number) =>
  new Promise<Uint8Array>((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(width * 2));
    canvas.height = Math.max(1, Math.ceil(height * 2));
    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Could not prepare drawing for export."));
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Could not export drawing image."));
          return;
        }
        blob
          .arrayBuffer()
          .then((buffer) => resolve(new Uint8Array(buffer)))
          .catch(() => reject(new Error("Could not export drawing image.")));
      }, "image/png");
    };
    image.onerror = () => reject(new Error("Could not load drawing image."));
    image.src = dataUrl;
  });
const isContractPdfEmbeddableImage = (mimeType: string) =>
  mimeType === "image/png" || mimeType === "image/jpeg" || mimeType === "image/jpg";
const getContractImageBytes = async (
  source: string,
  width: number,
  height: number,
): Promise<{ bytes: Uint8Array; mimeType: string }> => {
  if (source.startsWith("data:")) {
    const { bytes, mimeType } = dataUrlToBytes(source);
    if (!isContractPdfEmbeddableImage(mimeType)) {
      return { bytes: await rasterizeSvgDataUrl(source, width, height), mimeType: "image/png" };
    }
    return { bytes, mimeType };
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error("Could not load an object image for export.");
  }

  const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  const blob = await response.blob();
  if (!isContractPdfEmbeddableImage(mimeType)) {
    const dataUrl = await blobToDataUrl(blob);
    return { bytes: await rasterizeSvgDataUrl(dataUrl, width, height), mimeType: "image/png" };
  }

  return { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType };
};
const drawContractFieldBox = (
  page: PDFPage,
  field: ContractPdfField,
  bounds: { x: number; y: number; width: number; height: number },
  pointScale = 1,
) => {
  const backgroundColor = parseContractPdfColor(field.backgroundColor);
  const borderColor = parseContractPdfColor(field.borderColor);
  const borderWidth = Math.max(0, (field.borderWidth ?? 0) * pointScale);

  if (!backgroundColor && (!borderColor || borderWidth <= 0)) return;

  page.drawRectangle({
    ...bounds,
    color: backgroundColor ?? undefined,
    borderColor: borderColor ?? undefined,
    borderWidth: borderColor && borderWidth > 0 ? borderWidth : undefined,
  });
};
const createFlattenedContractPdfBlob = async ({
  pdfFile,
  pdfUrl,
  fields,
}: {
  pdfFile: File | null;
  pdfUrl: string;
  fields: ContractPdfField[];
}) => {
  const sourceBytes = await getContractPdfSourceBytes(pdfFile, pdfUrl);
  const pdfDocument = await PDFDocument.load(sourceBytes);

  for (const [pageIndex, page] of pdfDocument.getPages().entries()) {
    const pageNumber = pageIndex + 1;
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const previewPageSize = getContractPdfPreviewPageSize(pageNumber, pageWidth, pageHeight);
    const pointScale = getContractPdfPointScale(pageWidth, previewPageSize);
    const pageFields = fields.filter((field) => field.page === pageNumber);

    for (const field of pageFields) {
      const width = clampAdminNumber(field.width * pageWidth, 1, pageWidth);
      const height = clampAdminNumber(field.height * pageHeight, 1, pageHeight);
      const x = clampAdminNumber(field.x * pageWidth, 0, Math.max(0, pageWidth - width));
      const y = clampAdminNumber(
        pageHeight - field.y * pageHeight - height,
        0,
        Math.max(0, pageHeight - height),
      );
      const bounds = { x, y, width, height };

      drawContractFieldBox(page, field, bounds, pointScale);

      const imageSource =
        field.type === "signature"
          ? field.drawingDataUrl || field.imageUrl || ""
          : field.type === "draw"
            ? field.drawingDataUrl || ""
            : field.type === "image"
              ? field.imageUrl || ""
              : "";

      if (imageSource) {
        const { bytes, mimeType } = await getContractImageBytes(imageSource, width, height);
        const image =
          mimeType === "image/jpeg" || mimeType === "image/jpg"
            ? await pdfDocument.embedJpg(bytes)
            : await pdfDocument.embedPng(bytes);
        const shouldFillBounds = field.type === "draw";
        const scale = shouldFillBounds
          ? 1
          : Math.min(width / image.width, height / image.height);
        const imageWidth = shouldFillBounds ? width : image.width * scale;
        const imageHeight = shouldFillBounds ? height : image.height * scale;

        page.drawImage(image, {
          x: x + (width - imageWidth) / 2,
          y: y + (height - imageHeight) / 2,
          width: imageWidth,
          height: imageHeight,
        });
        continue;
      }

      if (field.type === "image" || field.type === "draw") continue;

      const text = getContractExportText(field);
      if (!text.trim()) continue;

      const textImageBytes = await renderContractTextFieldImage(field, text, {
        width: Math.max(1, field.width * previewPageSize.width),
        height: Math.max(1, field.height * previewPageSize.height),
      });
      const textImage = await pdfDocument.embedPng(textImageBytes);
      page.drawImage(textImage, {
        x,
        y,
        width,
        height,
      });
    }
  }

  const bytes = await pdfDocument.save();
  return new Blob([bytes], { type: "application/pdf" });
};
function normalizeProjectDeliveryStatus(value: unknown): ProjectDeliveryStatus {
  if (typeof value !== "string") return "Ongoing";
  const normalized = value.trim().toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "canceled" || normalized === "cancelled") return "Canceled";
  if (normalized === "ongoing") return "Ongoing";
  if (normalized === "pending") return "Pending";
  return "Ongoing";
}
const parseProjectListField = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
const parseWorkHighlightsField = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
const reviewRatingOptions = [5, 4, 3, 2, 1].map((rating) => ({
  value: rating,
  label: `${rating} Stars`,
}));

type AdminSelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type AdminSelectProps<T extends string | number> = {
  value: T;
  options: Array<AdminSelectOption<T>>;
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel: string;
};

type AdminSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
};

type AdminEmptyStateProps = {
  title: string;
  message: string;
};

type AdminImageFieldProps = {
  id: string;
  label: string;
  file: File | null;
  inputKey: number;
  onChange: (file: File | null) => void;
  existingImageUrl?: string | null;
  emptyDescription?: string;
  replaceDescription?: string;
};

type AdminMultiImageFieldProps = {
  id: string;
  label: string;
  files: File[];
  inputKey: number;
  onChange: (files: File[]) => void;
  existingImageUrls?: string[];
  onExistingImageUrlsChange?: (urls: string[]) => void;
};

type AdminErrorPopupProps = {
  error: AdminScopedError;
  placement: "global" | "section";
  onClose: () => void;
};

type AdminBusyState = {
  title: string;
  message: string;
};

type ApiRequestError = Error & {
  status?: number;
  authExpired?: boolean;
};

const matchesSearch = (
  keyword: string,
  values: Array<string | number | null | undefined>,
) => {
  const query = keyword.trim().toLowerCase();
  if (!query) return true;

  return values.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(query),
  );
};

const formatDateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value: string) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateLabel = (value: string) => {
  const date = parseDateValue(value);
  if (!date) return "Select issue date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const monthLabel = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const adminImagePlaceholder =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23111827'/%3E%3Cstop offset='1' stop-color='%230f766e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='640' height='420' rx='34' fill='url(%23g)'/%3E%3Cpath d='M135 292l88-92 69 70 54-58 159 152H92z' fill='%23ffffff' fill-opacity='.18'/%3E%3Ccircle cx='454' cy='128' r='44' fill='%23ffffff' fill-opacity='.2'/%3E%3Crect x='86' y='70' width='468' height='280' rx='28' fill='none' stroke='%23ffffff' stroke-opacity='.38' stroke-width='10'/%3E%3Ctext x='320' y='378' text-anchor='middle' font-family='Arial, sans-serif' font-size='24' font-weight='700' fill='%23ffffff' fill-opacity='.76'%3EPlaceholder image%3C/text%3E%3C/svg%3E";

function AdminEmptyState({ title, message }: AdminEmptyStateProps) {
  return (
    <div className={styles.adminEmptyState}>
      <svg
        viewBox="0 0 160 120"
        role="img"
        aria-label={title}
        className={styles.adminEmptyState__art}
      >
        <rect x="28" y="72" width="104" height="24" rx="8" />
        <path d="M42 72V46c0-7 5-12 12-12h52c7 0 12 5 12 12v26" />
        <path d="M58 54h44M58 66h28" />
        <circle cx="52" cy="88" r="4" />
        <circle cx="108" cy="88" r="4" />
        <path d="M34 32l10-10M126 34l-10-10M80 20v-14" />
      </svg>
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

function AdminErrorPopup({ error, placement, onClose }: AdminErrorPopupProps) {
  return (
    <div
      className={`${styles.adminErrorPopup} ${
        placement === "section" ? styles["adminErrorPopup--section"] : ""
      }`}
      role="alertdialog"
      aria-modal={placement === "global"}
      aria-labelledby={`admin-error-title-${error.id}`}
      aria-describedby={`admin-error-message-${error.id}`}
    >
      <div className={styles.adminErrorPopup__copy}>
        <span id={`admin-error-title-${error.id}`}>Something went wrong</span>
        <p id={`admin-error-message-${error.id}`}>{error.message}</p>
      </div>
      <button
        type="button"
        className={styles.adminErrorPopup__close}
        aria-label="Dismiss error message"
        onClick={onClose}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function AdminBusyOverlay({ title, message }: AdminBusyState) {
  return (
    <div className={styles.contentBusyOverlay} role="status" aria-live="polite">
      <div className={styles.contentBusyDialog}>
        <span className={styles.contentBusySpinner} aria-hidden="true" />
        <div>
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

function AdminKpiSkeleton() {
  return (
    <div className={styles.kpiGrid} aria-label="Loading dashboard data">
      {Array.from({ length: 4 }, (_, index) => (
        <article key={index} className={styles.kpiCard}>
          <span className={`${styles.skeletonLine} ${styles["skeletonLine--label"]}`} />
          <span className={`${styles.skeletonLine} ${styles["skeletonLine--value"]}`} />
        </article>
      ))}
    </div>
  );
}

function AdminTableSkeleton({
  rows = 4,
  withToolbar = true,
}: {
  rows?: number;
  withToolbar?: boolean;
}) {
  return (
    <div className={styles.skeletonStack} aria-label="Loading content">
      {withToolbar && (
        <div className={styles.tableToolbar}>
          <span className={`${styles.skeletonLine} ${styles["skeletonLine--field"]}`} />
        </div>
      )}
      <div className={styles.table}>
        {Array.from({ length: rows }, (_, index) => (
          <article key={index} className={styles.table__row}>
            <div>
              <span className={`${styles.skeletonLine} ${styles["skeletonLine--title"]}`} />
              <span className={`${styles.skeletonLine} ${styles["skeletonLine--text"]}`} />
            </div>
            <span className={`${styles.skeletonLine} ${styles["skeletonLine--badge"]}`} />
            <span className={`${styles.skeletonLine} ${styles["skeletonLine--icon"]}`} />
          </article>
        ))}
      </div>
    </div>
  );
}

function AdminProjectSkeleton() {
  return (
    <div className={styles.projectManager} aria-label="Loading projects">
      <AdminKpiSkeleton />
      <div className={styles.projectManager__toolbar}>
        <span className={`${styles.skeletonLine} ${styles["skeletonLine--field"]}`} />
        <span className={`${styles.skeletonLine} ${styles["skeletonLine--field"]}`} />
        <span className={`${styles.skeletonLine} ${styles["skeletonLine--field"]}`} />
        <span className={`${styles.skeletonLine} ${styles["skeletonLine--icon"]}`} />
        <span className={`${styles.skeletonLine} ${styles["skeletonLine--button"]}`} />
      </div>
      <div className={styles.projectManager__list}>
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className={styles.projectManager__item}>
            <div>
              <span className={`${styles.skeletonLine} ${styles["skeletonLine--title"]}`} />
              <span className={`${styles.skeletonLine} ${styles["skeletonLine--text"]}`} />
            </div>
            <div className={styles.projectManager__itemActions}>
              <span className={`${styles.skeletonLine} ${styles["skeletonLine--badge"]}`} />
              <span className={`${styles.skeletonLine} ${styles["skeletonLine--fieldSmall"]}`} />
              <span className={`${styles.skeletonLine} ${styles["skeletonLine--button"]}`} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AdminFormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className={styles.formGrid} aria-label="Loading form">
      {Array.from({ length: fields }, (_, index) => (
        <span
          key={index}
          className={`${styles.skeletonLine} ${
            index === fields - 1
              ? styles["skeletonLine--button"]
              : styles["skeletonLine--field"]
          }`}
        />
      ))}
    </div>
  );
}

function AdminSearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
}: AdminSearchFieldProps) {
  return (
    <div className={styles.adminSearchField}>
      <Search size={16} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}

function AdminImageField({
  id,
  label,
  file,
  inputKey,
  onChange,
  existingImageUrl,
  emptyDescription = "Optional. If empty, a placeholder image will be used.",
  replaceDescription = "Current image. Drop or select a new image to replace it.",
}: AdminImageFieldProps) {
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl || adminImagePlaceholder);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(existingImageUrl || adminImagePlaceholder);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [existingImageUrl, file]);

  const hasImagePreview = Boolean(file || existingImageUrl);

  return (
    <label className={`${styles.projectManager__field} ${styles.adminImageField}`} htmlFor={id}>
      <span>{label}</span>
      <div
        className={styles.adminImageField__dropzone}
        tabIndex={0}
        aria-label={`${label}. Drop, upload, or paste an image.`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onChange(event.dataTransfer.files?.[0] ?? null);
        }}
        onPaste={(event) => {
          const pastedImages = getClipboardImageFiles(event.clipboardData);
          if (pastedImages.length === 0) return;
          event.preventDefault();
          onChange(pastedImages[0]);
        }}
      >
        <input
          key={inputKey}
          id={id}
          className={styles.adminImageField__input}
          type="file"
          accept="image/*"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        {hasImagePreview ? (
          <img src={previewUrl} alt="" className={styles.adminImageField__preview} />
        ) : (
          <span className={styles.adminImageField__icon}>
            <ImagePlus size={22} />
          </span>
        )}
        <div className={styles.adminImageField__copy}>
          <strong>Drop image or upload</strong>
          <small>
            {file
              ? file.name
              : existingImageUrl
                ? replaceDescription
                : emptyDescription}
          </small>
        </div>
      </div>
    </label>
  );
}

function AdminMultiImageField({
  id,
  label,
  files,
  inputKey,
  onChange,
  existingImageUrls = [],
  onExistingImageUrlsChange,
}: AdminMultiImageFieldProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const appendImageFiles = (nextFiles: File[]) => {
    const filtered = nextFiles.filter((file) => file.type.startsWith("image/"));
    if (filtered.length === 0) return;
    onChange([...files, ...filtered]);
  };

  const appendFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    appendImageFiles(Array.from(fileList));
  };

  return (
    <div className={`${styles.projectManager__field} ${styles.adminImageField}`}>
      <span>{label}</span>
      <div
        className={styles.adminPreviewRail}
        tabIndex={0}
        aria-label={`${label}. Focus this list and use the mouse wheel to scroll horizontally.`}
        onWheel={(event) => {
          if (document.activeElement !== event.currentTarget) return;
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          event.preventDefault();
          event.currentTarget.scrollLeft += event.deltaY;
        }}
        onPaste={(event) => {
          const pastedImages = getClipboardImageFiles(event.clipboardData);
          if (pastedImages.length === 0) return;
          event.preventDefault();
          appendImageFiles(pastedImages);
        }}
      >
        <label
          className={styles.adminPreviewRail__addTile}
          htmlFor={id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            appendFiles(event.dataTransfer.files);
          }}
        >
          <input
            key={inputKey}
            id={id}
            className={styles.adminImageField__input}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => appendFiles(event.target.files)}
          />
          <Plus size={26} />
        </label>
        {existingImageUrls.map((url, index) => (
          <div key={`existing-${url}-${index}`} className={styles.adminPreviewRail__item}>
            <img src={url} alt="" />
            <button
              type="button"
              aria-label={`Remove existing preview image ${index + 1}`}
              onClick={() =>
                onExistingImageUrlsChange?.(
                  existingImageUrls.filter((_, imageIndex) => imageIndex !== index),
                )
              }
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {previewUrls.map((url, index) => (
          <div key={`${url}-${index}`} className={styles.adminPreviewRail__item}>
            <img src={url} alt="" />
            <button
              type="button"
              aria-label={`Remove preview image ${index + 1}`}
              onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminSelect<T extends string | number>({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
}: AdminSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div
      className={styles.adminSelect}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={styles.adminSelect__trigger}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selected?.label ?? String(value)}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.adminSelect__menu} role="listbox">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className={`${styles.adminSelect__option} ${
                option.value === value ? styles["adminSelect__option--active"] : ""
              }`}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    () => selectedDate ?? new Date(),
  );

  useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth(selectedDate);
  }, [value]);

  const firstOfMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  );
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const todayValue = formatDateValue(new Date());

  return (
    <div
      className={styles.adminDatePicker}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={styles.adminDatePicker__trigger}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <CalendarDays size={16} />
        <span>{formatDateLabel(value)}</span>
      </button>
      {open && (
        <div className={styles.adminDatePicker__dialog}>
          <div className={styles.adminDatePicker__header}>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              <ChevronLeft size={16} />
            </button>
            <strong>{monthLabel(visibleMonth)}</strong>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className={styles.adminDatePicker__weekdays}>
            {weekdayLabels.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className={styles.adminDatePicker__grid}>
            {calendarDays.map((date) => {
              const dateValue = formatDateValue(date);
              const isCurrentMonth =
                date.getMonth() === visibleMonth.getMonth();
              return (
                <button
                  key={dateValue}
                  type="button"
                  className={`${styles.adminDatePicker__day} ${
                    !isCurrentMonth ? styles["adminDatePicker__day--muted"] : ""
                  } ${
                    dateValue === todayValue
                      ? styles["adminDatePicker__day--today"]
                      : ""
                  } ${
                    dateValue === value
                      ? styles["adminDatePicker__day--selected"]
                      : ""
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const mapService = (service: {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
}) => ({
  id: service.id,
  name: service.name,
  summary: service.description,
  imageUrl: service.imageUrl ?? null,
});

const mapBanner = (banner: {
  id: string;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  sortOrder: number;
}) => ({
  id: banner.id,
  title: banner.title,
  subtitle: banner.subtitle,
  imageUrl: banner.imageUrl ?? null,
  sortOrder: banner.sortOrder,
});

const mapWorkExperience = (workExperience: {
  id: string;
  company: string;
  role: string;
  duration: string;
  location: string;
  summary: string;
  imageUrl?: string | null;
  highlights?: string[] | null;
  sortOrder: number;
}) => ({
  id: workExperience.id,
  company: workExperience.company,
  role: workExperience.role,
  duration: workExperience.duration,
  location: workExperience.location,
  summary: workExperience.summary,
  imageUrl: workExperience.imageUrl ?? null,
  highlights: workExperience.highlights ?? [],
  sortOrder: workExperience.sortOrder,
});

const normalizeBannerOrder = (banners: AdminBanner[]) =>
  banners.map((banner, index) => ({
    ...banner,
    sortOrder: index,
  }));

const reorderById = <T extends { id: string }>(items: T[], fromId: string, toId: string) => {
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const mapCertificate = (certificate: {
  id: string;
  title: string;
  org: string;
  issueDate: string;
  imageUrl?: string | null;
}) => ({
  id: certificate.id,
  title: certificate.title,
  issuer: certificate.org,
  date: certificate.issueDate.slice(0, 10),
  imageUrl: certificate.imageUrl ?? null,
});

const mapReview = (review: {
  id: string;
  clientId?: string | null;
  clientEmail?: string | null;
  clientCompany?: string | null;
  name: string;
  role?: string | null;
  rating: number;
  avatar?: string | null;
  feedback: string;
  detail?: string | null;
  status?: ReviewStatus;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}) => ({
  id: review.id,
  clientId: review.clientId ?? null,
  client: review.name,
  clientEmail: review.clientEmail ?? null,
  clientCompany: review.clientCompany ?? null,
  role: review.role ?? null,
  rating: review.rating,
  avatar: review.avatar ?? null,
  excerpt: review.feedback,
  detail: review.detail ?? null,
  status: review.status ?? (review.isPublished ? "Approved" : "Pending"),
  isPublished: Boolean(review.isPublished),
  createdAt: review.createdAt ?? new Date(0).toISOString(),
  updatedAt: review.updatedAt ?? review.createdAt ?? new Date(0).toISOString(),
});

const mapClient = (client: AdminClientApi): AdminClient => ({
  id: client.id,
  name: client.name,
  email: client.email,
  imageUrl: client.imageUrl ?? null,
  company: client.company ?? null,
  role: client.role ?? null,
  notes: client.notes ?? null,
  reviewCount: typeof client.reviewCount === "number" ? client.reviewCount : 0,
  invitation: client.invitation
    ? {
        id: client.invitation.id,
        sentAt: client.invitation.sentAt,
        expiresAt: client.invitation.expiresAt,
        createdAt: client.invitation.createdAt,
        isExpired: Boolean(client.invitation.isExpired),
      }
    : null,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
});

const mapContractTemplate = (template: AdminContractTemplateApi): AdminContractTemplate => ({
  id: template.id,
  name: template.name,
  title: template.title,
  pdfDocument: template.pdfDocument,
  pageCount: template.pageCount,
  fields: Array.isArray(template.fields) ? template.fields : [],
  contractCount: typeof template.contractCount === "number" ? template.contractCount : 0,
  createdAt: template.createdAt,
  updatedAt: template.updatedAt,
});

const mapContract = (contract: AdminContractApi): AdminContract => ({
  id: contract.id,
  templateId: contract.templateId ?? null,
  title: contract.title,
  recipientName: contract.recipientName,
  recipientEmail: contract.recipientEmail ?? null,
  pdfDocument: contract.pdfDocument,
  pageCount: contract.pageCount,
  fields: Array.isArray(contract.fields) ? contract.fields : [],
  values: contract.values ?? {},
  contractUrl: contract.contractUrl,
  sentAt: contract.sentAt ?? null,
  viewedAt: contract.viewedAt ?? null,
  submittedAt: contract.submittedAt ?? null,
  createdAt: contract.createdAt,
  updatedAt: contract.updatedAt,
  template: contract.template
    ? {
        id: contract.template.id,
        name: contract.template.name,
      }
    : null,
});

const allowedCvExtensions = [".pdf", ".docx"];

const isAllowedCvFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  return (
    fileType === "application/pdf" ||
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    allowedCvExtensions.some((extension) => fileName.endsWith(extension))
  );
};

const getCvContentType = (file: File) => {
  if (file.type) return file.type;
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".pdf")) return "application/pdf";
  return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
};

const isAdminCvAsset = (value: unknown): value is AdminCvAsset => {
  if (!value || typeof value !== "object") return false;
  const asset = value as Partial<AdminCvAsset>;
  return (
    typeof asset.id === "string" &&
    typeof asset.fileUrl === "string" &&
    typeof asset.fileName === "string"
  );
};

const isAdminCvDownload = (value: unknown): value is AdminCvDownload => {
  if (!value || typeof value !== "object") return false;
  const download = value as Partial<AdminCvDownload>;
  return typeof download.email === "string" && typeof download.createdAt === "string";
};

const normalizeCvDocumentType = (value: unknown): CvDocumentType =>
  value === "ATS" ? "ATS" : "Visual";

const normalizeCvDownload = (download: AdminCvDownload, index: number) => ({
  id:
    typeof download.id === "string" && download.id
      ? download.id
      : `${download.email}-${download.createdAt}-${index}`,
  email: download.email,
  documentType: normalizeCvDocumentType(download.documentType),
  createdAt: download.createdAt,
});

const normalizeCvAsset = (asset: AdminCvAsset): AdminCvAsset => {
  const downloads = Array.isArray(asset.downloads)
    ? asset.downloads.filter(isAdminCvDownload).map(normalizeCvDownload)
    : [];
  return {
    ...asset,
    filePath: typeof asset.filePath === "string" ? asset.filePath : "",
    fileUrl: typeof asset.fileUrl === "string" ? asset.fileUrl : "",
    fileName: typeof asset.fileName === "string" ? asset.fileName : "Visual CV",
    mimeType: typeof asset.mimeType === "string" ? asset.mimeType : "application/pdf",
    atsFilePath: typeof asset.atsFilePath === "string" ? asset.atsFilePath : asset.filePath ?? "",
    atsFileUrl: typeof asset.atsFileUrl === "string" ? asset.atsFileUrl : asset.fileUrl ?? "",
    atsFileName:
      typeof asset.atsFileName === "string" ? asset.atsFileName : asset.fileName ?? "ATS CV",
    atsMimeType:
      typeof asset.atsMimeType === "string" ? asset.atsMimeType : asset.mimeType ?? "application/pdf",
    visualFilePath:
      typeof asset.visualFilePath === "string" ? asset.visualFilePath : asset.filePath ?? "",
    visualFileUrl:
      typeof asset.visualFileUrl === "string" ? asset.visualFileUrl : asset.fileUrl ?? "",
    visualFileName:
      typeof asset.visualFileName === "string" ? asset.visualFileName : asset.fileName ?? "Visual CV",
    visualMimeType:
      typeof asset.visualMimeType === "string"
        ? asset.visualMimeType
        : asset.mimeType ?? "application/pdf",
    isActive: Boolean(asset.isActive),
    statusUpdatedAt:
      typeof asset.statusUpdatedAt === "string"
        ? asset.statusUpdatedAt
        : typeof asset.updatedAt === "string"
          ? asset.updatedAt
          : new Date(0).toISOString(),
    createdAt:
      typeof asset.createdAt === "string" ? asset.createdAt : new Date(0).toISOString(),
    updatedAt:
      typeof asset.updatedAt === "string"
        ? asset.updatedAt
        : typeof asset.createdAt === "string"
          ? asset.createdAt
          : new Date(0).toISOString(),
    downloadCount:
      typeof asset.downloadCount === "number" ? asset.downloadCount : downloads.length,
    downloads,
  };
};

const getAdminCvDocument = (
  asset: AdminCvAsset,
  documentType: CvDocumentType,
): AdminCvDocument =>
  documentType === "ATS"
    ? {
        filePath: asset.atsFilePath || asset.filePath,
        fileUrl: asset.atsFileUrl || asset.fileUrl,
        fileName: asset.atsFileName || asset.fileName,
        mimeType: asset.atsMimeType || asset.mimeType,
      }
    : {
        filePath: asset.visualFilePath || asset.filePath,
        fileUrl: asset.visualFileUrl || asset.fileUrl,
        fileName: asset.visualFileName || asset.fileName,
        mimeType: asset.visualMimeType || asset.mimeType,
      };

const isPdfCvDocument = (document: AdminCvDocument) =>
  document.mimeType.includes("pdf") || document.fileName.toLowerCase().endsWith(".pdf");

const getCvDocumentPreviewUrl = (document: AdminCvDocument) => {
  if (isPdfCvDocument(document)) {
    return `${document.fileUrl.split("#")[0]}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitV&zoom=page-fit`;
  }

  const fileName = document.fileName.toLowerCase();
  const isWordDocument =
    document.mimeType.includes("word") || fileName.endsWith(".doc") || fileName.endsWith(".docx");

  if (!isWordDocument) return "";

  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    document.fileUrl,
  )}&wdStartOn=1&wdPrint=0&wdEmbedCode=0`;
};

const normalizeCvAssets = (assets: unknown): AdminCvAsset[] => {
  if (Array.isArray(assets)) {
    return assets.filter(isAdminCvAsset).map(normalizeCvAsset);
  }
  if (isAdminCvAsset(assets)) {
    return [normalizeCvAsset(assets)];
  }
  return [];
};

const sortCvAssets = (assets: unknown, sortMode: CvSortMode = "created-desc") =>
  normalizeCvAssets(assets).sort((left, right) => {
    if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;
    switch (sortMode) {
      case "created-asc":
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      case "downloads-desc":
        return right.downloadCount - left.downloadCount;
      case "downloads-asc":
        return left.downloadCount - right.downloadCount;
      case "status-desc":
        return (
          new Date(right.statusUpdatedAt).getTime() -
          new Date(left.statusUpdatedAt).getTime()
        );
      case "status-active":
        return Number(right.isActive) - Number(left.isActive);
      case "status-inactive":
        return Number(left.isActive) - Number(right.isActive);
      case "created-desc":
      default:
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  });

async function parseErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      message?: string;
      errors?: {
        fieldErrors?: Record<string, string[] | undefined>;
        formErrors?: string[];
      };
    };
    const fieldErrors = body.errors?.fieldErrors
      ? Object.entries(body.errors.fieldErrors)
          .flatMap(([field, messages]) =>
            (messages ?? []).map((message) => `${field}: ${message}`),
          )
      : [];
    const formErrors = body.errors?.formErrors ?? [];
    const details = [...fieldErrors, ...formErrors].filter(Boolean).join(" ");
    return [body.message || fallback, details].filter(Boolean).join(" ");
  } catch {
    return fallback;
  }
}

export default function AdminApp() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [hydrated, setHydrated] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ApiUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [isSessionExpiredDialogOpen, setIsSessionExpiredDialogOpen] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [adminError, setAdminError] = useState<AdminScopedError | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    projects: 0,
    services: 0,
    certificates: 0,
    reviews: 0,
  });
  const [loginLogs, setLoginLogs] = useState<AdminLoginLog[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  const [activeSection, setActiveSection] = useState<SectionId>(readStoredActiveSection);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [content, setContent] = useState<AdminContentState>(defaultContent);

  const [projectTitle, setProjectTitle] = useState("");
  const [projectCategory, setProjectCategory] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectOverview, setProjectOverview] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("Draft");
  const [projectDeliveryStatus, setProjectDeliveryStatus] =
    useState<ProjectDeliveryStatus>("Ongoing");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState<"All" | ProjectStatus>("All");
  const [projectCategoryFilter, setProjectCategoryFilter] = useState("All");
  const [projectUpdatingId, setProjectUpdatingId] = useState<string | null>(null);
  const [projectDeletingId, setProjectDeletingId] = useState<string | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImageInputKey, setProjectImageInputKey] = useState(0);
  const [projectPortraitImageFile, setProjectPortraitImageFile] = useState<File | null>(null);
  const [projectPortraitImageInputKey, setProjectPortraitImageInputKey] = useState(0);
  const [projectLandscapeImageFile, setProjectLandscapeImageFile] = useState<File | null>(null);
  const [projectLandscapeImageInputKey, setProjectLandscapeImageInputKey] = useState(0);
  const [projectIsFeatured, setProjectIsFeatured] = useState(false);
  const [projectIsPinned, setProjectIsPinned] = useState(false);
  const [projectPreviewImageFiles, setProjectPreviewImageFiles] = useState<File[]>([]);
  const [projectPreviewImageInputKey, setProjectPreviewImageInputKey] = useState(0);
  const [isProjectCreating, setIsProjectCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [projectEditTitle, setProjectEditTitle] = useState("");
  const [projectEditCategory, setProjectEditCategory] = useState("");
  const [projectEditDescription, setProjectEditDescription] = useState("");
  const [projectEditStatus, setProjectEditStatus] = useState<ProjectStatus>("Draft");
  const [projectEditDeliveryStatus, setProjectEditDeliveryStatus] =
    useState<ProjectDeliveryStatus>("Ongoing");
  const [projectEditTags, setProjectEditTags] = useState("");
  const [projectEditHighlights, setProjectEditHighlights] = useState("");
  const [projectEditDetails, setProjectEditDetails] = useState("");
  const [projectEditImageFile, setProjectEditImageFile] = useState<File | null>(null);
  const [projectEditImageInputKey, setProjectEditImageInputKey] = useState(0);
  const [projectEditPortraitImageFile, setProjectEditPortraitImageFile] = useState<File | null>(null);
  const [projectEditPortraitImageInputKey, setProjectEditPortraitImageInputKey] = useState(0);
  const [projectEditLandscapeImageFile, setProjectEditLandscapeImageFile] = useState<File | null>(null);
  const [projectEditLandscapeImageInputKey, setProjectEditLandscapeImageInputKey] = useState(0);
  const [projectEditIsFeatured, setProjectEditIsFeatured] = useState(false);
  const [projectEditIsPinned, setProjectEditIsPinned] = useState(false);
  const [projectEditPreviewImageUrls, setProjectEditPreviewImageUrls] = useState<string[]>([]);
  const [projectEditPreviewImageFiles, setProjectEditPreviewImageFiles] = useState<File[]>([]);
  const [projectEditPreviewImageInputKey, setProjectEditPreviewImageInputKey] = useState(0);

  const [requestSearch, setRequestSearch] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceSummary, setServiceSummary] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [serviceImageFile, setServiceImageFile] = useState<File | null>(null);
  const [serviceImageInputKey, setServiceImageInputKey] = useState(0);
  const [isServiceCreating, setIsServiceCreating] = useState(false);
  const [editingService, setEditingService] = useState<AdminService | null>(null);
  const [serviceEditName, setServiceEditName] = useState("");
  const [serviceEditSummary, setServiceEditSummary] = useState("");
  const [serviceEditImageFile, setServiceEditImageFile] = useState<File | null>(null);
  const [serviceEditImageInputKey, setServiceEditImageInputKey] = useState(0);
  const [serviceSavingId, setServiceSavingId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerSearch, setBannerSearch] = useState("");
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImageInputKey, setBannerImageInputKey] = useState(0);
  const [isBannerCreating, setIsBannerCreating] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBanner | null>(null);
  const [bannerEditTitle, setBannerEditTitle] = useState("");
  const [bannerEditSubtitle, setBannerEditSubtitle] = useState("");
  const [bannerEditImageFile, setBannerEditImageFile] = useState<File | null>(null);
  const [bannerEditImageInputKey, setBannerEditImageInputKey] = useState(0);
  const [bannerSavingId, setBannerSavingId] = useState<string | null>(null);
  const [isBannerReordering, setIsBannerReordering] = useState(false);
  const [draggedBannerId, setDraggedBannerId] = useState<string | null>(null);
  const [bannerDropTargetId, setBannerDropTargetId] = useState<string | null>(null);

  const [workCompany, setWorkCompany] = useState("");
  const [workRole, setWorkRole] = useState("");
  const [workDuration, setWorkDuration] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [workSummary, setWorkSummary] = useState("");
  const [workHighlights, setWorkHighlights] = useState("");
  const [workSearch, setWorkSearch] = useState("");
  const [isWorkDialogOpen, setIsWorkDialogOpen] = useState(false);
  const [workImageFile, setWorkImageFile] = useState<File | null>(null);
  const [workImageInputKey, setWorkImageInputKey] = useState(0);
  const [isWorkCreating, setIsWorkCreating] = useState(false);
  const [editingWorkExperience, setEditingWorkExperience] =
    useState<AdminWorkExperience | null>(null);
  const [workEditCompany, setWorkEditCompany] = useState("");
  const [workEditRole, setWorkEditRole] = useState("");
  const [workEditDuration, setWorkEditDuration] = useState("");
  const [workEditLocation, setWorkEditLocation] = useState("");
  const [workEditSummary, setWorkEditSummary] = useState("");
  const [workEditHighlights, setWorkEditHighlights] = useState("");
  const [workEditImageFile, setWorkEditImageFile] = useState<File | null>(null);
  const [workEditImageInputKey, setWorkEditImageInputKey] = useState(0);
  const [workSavingId, setWorkSavingId] = useState<string | null>(null);

  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDate, setCertDate] = useState("");
  const [certificateSearch, setCertificateSearch] = useState("");
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [certificateImageFile, setCertificateImageFile] = useState<File | null>(null);
  const [certificateImageInputKey, setCertificateImageInputKey] = useState(0);
  const [isCertificateCreating, setIsCertificateCreating] = useState(false);

  const [clients, setClients] = useState<AdminClient[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [clientImageFile, setClientImageFile] = useState<File | null>(null);
  const [clientImageInputKey, setClientImageInputKey] = useState(0);
  const [clientSearch, setClientSearch] = useState("");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientInvitingId, setClientInvitingId] = useState<string | null>(null);
  const [clientDeletingId, setClientDeletingId] = useState<string | null>(null);
  const [clientsNotice, setClientsNotice] = useState("");
  const [contractTemplates, setContractTemplates] = useState<AdminContractTemplate[]>([]);
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [contractTemplateName, setContractTemplateName] = useState("");
  const [contractTemplateTitle, setContractTemplateTitle] = useState("");
  const [contractTemplatePdfFile, setContractTemplatePdfFile] = useState<File | null>(null);
  const [contractTemplateExistingPdf, setContractTemplateExistingPdf] =
    useState<AdminContractPdfDocument | null>(null);
  const [contractTemplatePdfInputKey, setContractTemplatePdfInputKey] = useState(0);
  const [contractTemplatePdfPreviewUrl, setContractTemplatePdfPreviewUrl] = useState("");
  const [contractTemplatePageCount, setContractTemplatePageCount] = useState(1);
  const [contractTemplateActivePage, setContractTemplateActivePage] = useState(1);
  const [showContractObjectBorders, setShowContractObjectBorders] = useState(true);
  const [contractPdfZoom, setContractPdfZoom] = useState(100);
  const [contractPdfFitZoom, setContractPdfFitZoom] = useState(100);
  const [contractTemplateFields, setContractTemplateFields] = useState<ContractPdfField[]>([]);
  const [contractFieldHistoryPast, setContractFieldHistoryPast] = useState<
    ContractFieldHistorySnapshot[]
  >([]);
  const [contractFieldHistoryFuture, setContractFieldHistoryFuture] = useState<
    ContractFieldHistorySnapshot[]
  >([]);
  const contractTemplateFieldsRef = useRef<ContractPdfField[]>([]);
  const selectedContractFieldIdRef = useRef<string | null>(null);
  const contractDrawToolRef = useRef<HTMLDivElement | null>(null);
  const contractEraserToolRef = useRef<HTMLDivElement | null>(null);
  const contractPdfStageRef = useRef<HTMLElement | null>(null);
  const contractPdfZoomRef = useRef(100);
  const contractPdfFitZoomRef = useRef(100);
  const contractImageObjectInputRef = useRef<HTMLInputElement | null>(null);
  const pendingContractImageUploadFieldIdRef = useRef<string | null>(null);
  const [selectedContractFieldId, setSelectedContractFieldId] = useState<string | null>(null);
  const [contractObjectClipboard, setContractObjectClipboard] =
    useState<ContractObjectClipboard>(null);
  const [editingContractObjectLabelId, setEditingContractObjectLabelId] = useState<string | null>(
    null,
  );
  const [contractObjectLabelDraft, setContractObjectLabelDraft] = useState("");
  const [draggedContractFieldId, setDraggedContractFieldId] = useState<string | null>(null);
  const [contractFieldDropTargetId, setContractFieldDropTargetId] = useState<string | null>(null);
  const [contractImageUploadingFieldId, setContractImageUploadingFieldId] = useState<string | null>(
    null,
  );
  const [isContractDrawMenuOpen, setIsContractDrawMenuOpen] = useState(false);
  const [isContractDrawModeActive, setIsContractDrawModeActive] = useState(false);
  const [isContractDrawMenuInteracting, setIsContractDrawMenuInteracting] = useState(false);
  const [isContractEraserMenuOpen, setIsContractEraserMenuOpen] = useState(false);
  const [isContractEraserModeActive, setIsContractEraserModeActive] = useState(false);
  const [isContractEraserMenuInteracting, setIsContractEraserMenuInteracting] = useState(false);
  const [contractDrawColor, setContractDrawColor] = useState(defaultContractDrawColor);
  const [contractDrawStrokeWidth, setContractDrawStrokeWidth] = useState(
    defaultContractDrawStrokeWidth,
  );
  const [contractTemplateSaving, setContractTemplateSaving] = useState(false);
  const [contractTemplateDeletingId, setContractTemplateDeletingId] = useState<string | null>(null);
  const [contractSelectedTemplateId, setContractSelectedTemplateId] = useState("");
  const [contractTitle, setContractTitle] = useState("");
  const [contractRecipientName, setContractRecipientName] = useState("");
  const [contractRecipientEmail, setContractRecipientEmail] = useState("");
  const [contractSearch, setContractSearch] = useState("");
  const [contractCreating, setContractCreating] = useState(false);
  const [contractSendingId, setContractSendingId] = useState<string | null>(null);
  const [contractDeletingId, setContractDeletingId] = useState<string | null>(null);
  const [contractDraftCreatedId, setContractDraftCreatedId] = useState<string | null>(null);
  const [contractPdfExporting, setContractPdfExporting] =
    useState<ContractPdfExportMode | null>(null);
  const [isContractDraftOpen, setIsContractDraftOpen] = useState(() =>
    window.location.pathname.startsWith("/admin/contracts/draft"),
  );
  const [contractDraftStorageReady, setContractDraftStorageReady] = useState(false);
  const [isContractSendDropdownOpen, setIsContractSendDropdownOpen] = useState(false);
  const [contractsNotice, setContractsNotice] = useState("");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<"All" | ReviewStatus>("All");
  const [editingReview, setEditingReview] = useState<AdminReview | null>(null);
  const [reviewEditName, setReviewEditName] = useState("");
  const [reviewEditRole, setReviewEditRole] = useState("");
  const [reviewEditRating, setReviewEditRating] = useState(5);
  const [reviewEditFeedback, setReviewEditFeedback] = useState("");
  const [reviewEditDetail, setReviewEditDetail] = useState("");
  const [reviewSavingId, setReviewSavingId] = useState<string | null>(null);
  const [reviewApprovingId, setReviewApprovingId] = useState<string | null>(null);
  const [reviewDeletingId, setReviewDeletingId] = useState<string | null>(null);
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdminAccount[]>([]);
  const [requestProcessingId, setRequestProcessingId] = useState<string | null>(null);
  const [requestsNotice, setRequestsNotice] = useState("");
  const [contactConfig, setContactConfig] = useState<AdminContactConfig | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactInstagramUrl, setContactInstagramUrl] = useState("");
  const [contactWhatsappUrl, setContactWhatsappUrl] = useState("");
  const [contactTelegramUrl, setContactTelegramUrl] = useState("");
  const [contactLinkedinUrl, setContactLinkedinUrl] = useState("");
  const [showContactEmail, setShowContactEmail] = useState(true);
  const [showContactPhone, setShowContactPhone] = useState(true);
  const [showContactInstagram, setShowContactInstagram] = useState(true);
  const [showContactWhatsapp, setShowContactWhatsapp] = useState(true);
  const [showContactTelegram, setShowContactTelegram] = useState(true);
  const [showContactLinkedin, setShowContactLinkedin] = useState(true);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [contactsNotice, setContactsNotice] = useState("");
  const [cvAssets, setCvAssets] = useState<AdminCvAsset[]>([]);
  const [cvAtsFile, setCvAtsFile] = useState<File | null>(null);
  const [cvVisualFile, setCvVisualFile] = useState<File | null>(null);
  const [cvAtsInputKey, setCvAtsInputKey] = useState(0);
  const [cvVisualInputKey, setCvVisualInputKey] = useState(0);
  const [isCvDialogOpen, setIsCvDialogOpen] = useState(false);
  const [cvSortMode, setCvSortMode] = useState<CvSortMode>("created-desc");
  const [cvSaving, setCvSaving] = useState(false);
  const [cvActivatingId, setCvActivatingId] = useState<string | null>(null);
  const [cvDeletingId, setCvDeletingId] = useState<string | null>(null);
  const [cvNotice, setCvNotice] = useState("");
  const [analyticsStats, setAnalyticsStats] =
    useState<AdminAnalyticsStats>(defaultAnalyticsStats);
  const [visitorGraph, setVisitorGraph] = useState<AdminVisitorGraphPoint[]>([]);
  const [errorLogStats, setErrorLogStats] = useState<AdminErrorLogStats>(defaultErrorLogStats);
  const [errorGraph, setErrorGraph] = useState<AdminErrorGraphPoint[]>([]);
  const [errorLogs, setErrorLogs] = useState<AdminErrorLog[]>([]);
  const [errorLogDeletingId, setErrorLogDeletingId] = useState<string | null>(null);
  const bootstrappedTokenRef = useRef<string | null>(null);

  const projectCategories = useMemo(
    () =>
      Array.from(
        new Set(
          content.projects
            .map((item) => item.category.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [content.projects],
  );
  const projectStatusCounts = useMemo(
    () =>
      content.projects.reduce(
        (acc, item) => {
          acc[item.status] += 1;
          return acc;
        },
        { Draft: 0, Published: 0, Archived: 0 } as Record<ProjectStatus, number>,
      ),
    [content.projects],
  );
  const projectDisplayCounts = useMemo(
    () => ({
      featured: content.projects.filter((item) => item.isFeatured).length,
      pinned: content.projects.filter((item) => item.isPinned).length,
    }),
    [content.projects],
  );
  const visibleProjects = useMemo(() => {
    const keyword = projectSearch.trim().toLowerCase();
    return content.projects.filter((item) => {
      const matchesStatus = projectStatusFilter === "All" || item.status === projectStatusFilter;
      const matchesCategory =
        projectCategoryFilter === "All" || item.category === projectCategoryFilter;
      const matchesKeyword =
        keyword.length === 0 ||
        item.title.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword);
      return matchesStatus && matchesCategory && matchesKeyword;
    });
  }, [content.projects, projectCategoryFilter, projectSearch, projectStatusFilter]);
  const visiblePendingAdmins = useMemo(
    () =>
      pendingAdmins.filter((request) =>
        matchesSearch(requestSearch, [
          request.name,
          request.email,
          new Date(request.createdAt).toLocaleString(),
        ]),
      ),
    [pendingAdmins, requestSearch],
  );
  const visibleServices = useMemo(
    () =>
      content.services.filter((service) =>
        matchesSearch(serviceSearch, [service.name, service.summary]),
      ),
    [content.services, serviceSearch],
  );
  const visibleBanners = useMemo(
    () =>
      content.banners.filter((banner) =>
        matchesSearch(bannerSearch, [banner.title, banner.subtitle]),
      ),
    [bannerSearch, content.banners],
  );
  const canReorderBanners =
    !isBannerReordering && bannerSearch.trim().length === 0 && content.banners.length > 1;
  const visibleWorkExperiences = useMemo(
    () =>
      content.workExperiences.filter((workExperience) =>
        matchesSearch(workSearch, [
          workExperience.company,
          workExperience.role,
          workExperience.duration,
          workExperience.location,
          workExperience.summary,
          workExperience.highlights.join(" "),
        ]),
      ),
    [content.workExperiences, workSearch],
  );
  const visibleCertificates = useMemo(
    () =>
      content.certificates.filter((certificate) =>
        matchesSearch(certificateSearch, [
          certificate.title,
          certificate.issuer,
          certificate.date,
        ]),
      ),
    [certificateSearch, content.certificates],
  );
  const visibleClients = useMemo(
    () =>
      clients.filter((client) =>
        matchesSearch(clientSearch, [
          client.name,
          client.email,
          client.company,
          client.role,
          client.notes,
          client.invitation ? "invited" : "not invited",
        ]),
      ),
    [clientSearch, clients],
  );
  const visibleContracts = useMemo(
    () =>
      contracts.filter((contract) =>
        matchesSearch(contractSearch, [
          contract.title,
          contract.recipientName,
          contract.recipientEmail,
          contract.template?.name,
          contract.pdfDocument.fileName,
          contract.sentAt ? "sent" : "not sent",
          contract.viewedAt ? "viewed" : "not viewed",
          contract.submittedAt ? "submitted" : "not submitted",
        ]),
      ),
    [contractSearch, contracts],
  );
  const selectedContractField = useMemo(
    () =>
      contractTemplateFields.find((field) => field.id === selectedContractFieldId) ?? null,
    [contractTemplateFields, selectedContractFieldId],
  );
  useEffect(() => {
    contractTemplateFieldsRef.current = contractTemplateFields;
  }, [contractTemplateFields]);

  useEffect(() => {
    selectedContractFieldIdRef.current = selectedContractFieldId;
  }, [selectedContractFieldId]);

  const resetContractFieldHistory = () => {
    setContractFieldHistoryPast([]);
    setContractFieldHistoryFuture([]);
  };

  const recordContractFieldHistory = () => {
    setContractFieldHistoryPast((prev) => [
      ...prev.slice(-(CONTRACT_FIELD_HISTORY_LIMIT - 1)),
      createContractFieldHistorySnapshot(
        contractTemplateFieldsRef.current,
        selectedContractFieldIdRef.current,
      ),
    ]);
    setContractFieldHistoryFuture([]);
  };

  const restoreContractFieldHistorySnapshot = (
    snapshot: ContractFieldHistorySnapshot,
    notice: string,
  ) => {
    const nextFields = cloneContractFields(snapshot.fields);
    const nextSelectedFieldId =
      snapshot.selectedFieldId && nextFields.some((field) => field.id === snapshot.selectedFieldId)
        ? snapshot.selectedFieldId
        : null;

    markContractDraftUnsaved();
    contractTemplateFieldsRef.current = nextFields;
    selectedContractFieldIdRef.current = nextSelectedFieldId;
    setContractTemplateFields(nextFields);
    setSelectedContractFieldId(nextSelectedFieldId);
    setContractsNotice(notice);
  };

  const undoContractFieldChange = () => {
    if (contractFieldHistoryPast.length === 0) return;
    const previousSnapshot = contractFieldHistoryPast[contractFieldHistoryPast.length - 1];
    const currentSnapshot = createContractFieldHistorySnapshot(
      contractTemplateFieldsRef.current,
      selectedContractFieldIdRef.current,
    );

    setContractFieldHistoryPast((prev) => prev.slice(0, -1));
    setContractFieldHistoryFuture((prev) => [
      currentSnapshot,
      ...prev.slice(0, CONTRACT_FIELD_HISTORY_LIMIT - 1),
    ]);
    restoreContractFieldHistorySnapshot(previousSnapshot, "Undo applied.");
  };

  const redoContractFieldChange = () => {
    if (contractFieldHistoryFuture.length === 0) return;
    const nextSnapshot = contractFieldHistoryFuture[0];
    const currentSnapshot = createContractFieldHistorySnapshot(
      contractTemplateFieldsRef.current,
      selectedContractFieldIdRef.current,
    );

    setContractFieldHistoryFuture((prev) => prev.slice(1));
    setContractFieldHistoryPast((prev) => [
      ...prev.slice(-(CONTRACT_FIELD_HISTORY_LIMIT - 1)),
      currentSnapshot,
    ]);
    restoreContractFieldHistorySnapshot(nextSnapshot, "Redo applied.");
  };

  const resetContractFieldObjects = () => {
    if (contractTemplateFieldsRef.current.length === 0) return;

    recordContractFieldHistory();
    markContractDraftUnsaved();
    contractTemplateFieldsRef.current = [];
    selectedContractFieldIdRef.current = null;
    setContractTemplateFields([]);
    setSelectedContractFieldId(null);
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setContractsNotice("Objects reset. Use Undo to restore them.");
  };

  const canUndoContractFieldChange = contractFieldHistoryPast.length > 0;
  const canRedoContractFieldChange = contractFieldHistoryFuture.length > 0;
  const canResetContractFieldObjects = contractTemplateFields.length > 0;

  const stopContractFreehandTools = () => {
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
  };

  const activateContractDrawTool = () => {
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setIsContractDrawMenuOpen((current) => !current);
    setIsContractDrawModeActive(true);
  };

  const activateContractEraserTool = () => {
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen((current) => !current);
    setIsContractEraserModeActive(true);
  };

  useEffect(() => {
    if (!isContractDrawMenuOpen) {
      setIsContractDrawMenuInteracting(false);
    }
  }, [isContractDrawMenuOpen]);

  useEffect(() => {
    if (!isContractEraserMenuOpen) {
      setIsContractEraserMenuInteracting(false);
    }
  }, [isContractEraserMenuOpen]);

  useEffect(() => {
    if (!isContractDrawMenuOpen) return;

    const handleDrawMenuOutsidePointerDown = (event: PointerEvent) => {
      const drawTool = contractDrawToolRef.current;
      const target = event.target;
      if (drawTool && target instanceof Node && drawTool.contains(target)) return;

      setIsContractDrawMenuOpen(false);
      setIsContractDrawMenuInteracting(false);
    };

    document.addEventListener("pointerdown", handleDrawMenuOutsidePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handleDrawMenuOutsidePointerDown, true);
  }, [isContractDrawMenuOpen]);

  useEffect(() => {
    if (!isContractEraserMenuOpen) return;

    const handleEraserMenuOutsidePointerDown = (event: PointerEvent) => {
      const eraserTool = contractEraserToolRef.current;
      const target = event.target;
      if (eraserTool && target instanceof Node && eraserTool.contains(target)) return;

      setIsContractEraserMenuOpen(false);
      setIsContractEraserMenuInteracting(false);
    };

    document.addEventListener("pointerdown", handleEraserMenuOutsidePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handleEraserMenuOutsidePointerDown, true);
  }, [isContractEraserMenuOpen]);

  const contractDraftPdfUrl =
    contractTemplatePdfPreviewUrl || contractTemplateExistingPdf?.fileUrl || "";
  const contractDraftPdfLabel =
    contractTemplatePdfFile?.name || contractTemplateExistingPdf?.fileName || "Draft a new contract";
  const isContractDraftSaved = Boolean(contractSelectedTemplateId);
  const contractDraftCreatedContract = useMemo(
    () => contracts.find((contract) => contract.id === contractDraftCreatedId) ?? null,
    [contractDraftCreatedId, contracts],
  );
  const visibleReviews = useMemo(
    () =>
      content.reviews.filter((review) => {
        const matchesStatus =
          reviewStatusFilter === "All" || review.status === reviewStatusFilter;
        const matchesKeyword = matchesSearch(reviewSearch, [
          review.client,
          review.clientEmail,
          review.clientCompany,
          review.role,
          review.excerpt,
          review.detail,
          review.status,
          `${review.rating} stars`,
        ]);
        return matchesStatus && matchesKeyword;
      }),
    [content.reviews, reviewSearch, reviewStatusFilter],
  );
  const pendingDashboardReviews = useMemo(
    () =>
      content.reviews
        .filter((review) => review.status === "Pending")
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        )
        .slice(0, 4),
    [content.reviews],
  );
  const sidebarBadgeCounts = useMemo<Partial<Record<SectionId, number>>>(
    () => ({
      requests: pendingAdmins.length,
      reviews: content.reviews.filter((review) => review.status === "Pending").length,
      errorLogs: errorLogStats.openErrors,
    }),
    [content.reviews, errorLogStats.openErrors, pendingAdmins.length],
  );
  const activeCvAsset = useMemo(
    () => cvAssets.find((asset) => asset.isActive) ?? null,
    [cvAssets],
  );
  const dashboardTopErrorLogs = useMemo(() => errorLogs.slice(0, 3), [errorLogs]);
  const contentBusyState = useMemo<AdminBusyState | null>(() => {
    if (isLoadingData) {
      return {
        title: "Loading content",
        message: "Fetching the latest admin data.",
      };
    }

    if (activeSection === "requests" && requestProcessingId) {
      return {
        title: "Updating request",
        message: "Applying the account request decision.",
      };
    }

    if (activeSection === "projects") {
      if (isProjectCreating) {
        return { title: "Adding project", message: "Uploading assets and saving the project." };
      }
      if (projectUpdatingId) {
        return { title: "Updating project", message: "Saving the project changes." };
      }
      if (projectDeletingId) {
        return { title: "Deleting project", message: "Removing the project record." };
      }
    }

    if (activeSection === "services" && isServiceCreating) {
      return { title: "Adding service", message: "Uploading assets and saving the service." };
    }

    if (activeSection === "banners" && isBannerCreating) {
      return { title: "Adding banner", message: "Uploading assets and saving the banner." };
    }

    if (activeSection === "banners" && isBannerReordering) {
      return { title: "Saving order", message: "Updating the banner sequence." };
    }

    if (activeSection === "workExperiences" && isWorkCreating) {
      return {
        title: "Adding work experience",
        message: "Uploading assets and saving the role.",
      };
    }

    if (activeSection === "certificates" && isCertificateCreating) {
      return {
        title: "Adding certificate",
        message: "Uploading assets and saving the certificate.",
      };
    }

    if (activeSection === "clients") {
      if (clientSaving) {
        return { title: "Adding client", message: "Saving the client profile." };
      }
      if (clientInvitingId) {
        return { title: "Sending invitation", message: "Preparing the review email." };
      }
      if (clientDeletingId) {
        return { title: "Deleting client", message: "Removing the client record." };
      }
    }

    if (activeSection === "contracts") {
      if (contractTemplateSaving) {
        return { title: "Saving template", message: "Creating the contract template." };
      }
      if (contractCreating) {
        return { title: "Creating contract", message: "Generating the shareable link." };
      }
      if (contractSendingId) {
        return { title: "Sending contract", message: "Delivering the contract email." };
      }
      if (contractDeletingId || contractTemplateDeletingId) {
        return { title: "Deleting contract item", message: "Removing the selected record." };
      }
    }

    if (activeSection === "reviews") {
      if (reviewSavingId) {
        return { title: "Saving review", message: "Updating the submitted feedback." };
      }
      if (reviewApprovingId) {
        return { title: "Approving review", message: "Publishing the review to the portfolio." };
      }
      if (reviewDeletingId) {
        return { title: "Deleting review", message: "Removing the declined review." };
      }
    }

    if (activeSection === "contacts" && contactsSaving) {
      return { title: "Saving contacts", message: "Updating public contact details." };
    }

    if (activeSection === "cv") {
      if (cvSaving) {
        return { title: "Submitting CV", message: "Uploading and saving both CV documents." };
      }
      if (cvActivatingId) {
        return { title: "Activating CV", message: "Updating the CV shown to users." };
      }
      if (cvDeletingId) {
        return { title: "Deleting CV", message: "Removing the CV item and its records." };
      }
    }

    if (activeSection === "errorLogs" && errorLogDeletingId) {
      return { title: "Resolving error", message: "Deleting the resolved error log." };
    }

    return null;
  }, [
    activeSection,
    clientDeletingId,
    clientInvitingId,
    clientSaving,
    contractCreating,
    contractDeletingId,
    contractSendingId,
    contractTemplateDeletingId,
    contractTemplateSaving,
    contactsSaving,
    cvActivatingId,
    cvDeletingId,
    cvSaving,
    errorLogDeletingId,
    isBannerCreating,
    isBannerReordering,
    isCertificateCreating,
    isWorkCreating,
    isLoadingData,
    isProjectCreating,
    isServiceCreating,
    projectDeletingId,
    projectUpdatingId,
    requestProcessingId,
    reviewApprovingId,
    reviewDeletingId,
    reviewSavingId,
  ]);
  const visibleCvAssets = useMemo(
    () => sortCvAssets(cvAssets, cvSortMode),
    [cvAssets, cvSortMode],
  );
  const activeVisualCvDocument = useMemo(
    () => (activeCvAsset ? getAdminCvDocument(activeCvAsset, "Visual") : null),
    [activeCvAsset],
  );
  const activeAtsCvDocument = useMemo(
    () => (activeCvAsset ? getAdminCvDocument(activeCvAsset, "ATS") : null),
    [activeCvAsset],
  );
  const activeCvPreviewDocuments = useMemo(
    () =>
      activeAtsCvDocument && activeVisualCvDocument
        ? [
            {
              document: activeAtsCvDocument,
              label: "ATS Friendly",
              description: "Text-first resume for job portals and applicant tracking systems.",
            },
            {
              document: activeVisualCvDocument,
              label: "Visual Friendly",
              description: "Designed resume for direct sharing and human review.",
            },
          ]
        : [],
    [activeAtsCvDocument, activeVisualCvDocument],
  );
  const activeCvDownloads = useMemo(
    () => activeCvAsset?.downloads ?? [],
    [activeCvAsset],
  );
  const activeAtsDownloadCount = useMemo(
    () => activeCvDownloads.filter((download) => download.documentType === "ATS").length,
    [activeCvDownloads],
  );
  const activeVisualDownloadCount = useMemo(
    () => activeCvDownloads.filter((download) => download.documentType === "Visual").length,
    [activeCvDownloads],
  );
  const activeCvDownloadEmails = useMemo(
    () => Array.from(new Set(activeCvDownloads.map((download) => download.email))),
    [activeCvDownloads],
  );
  const activeCvDownloadPeople = useMemo(
    () =>
      activeCvDownloadEmails.map((email) => ({
        email,
        latestDownloadAt:
          activeCvDownloads.find((download) => download.email === email)?.createdAt ?? "",
      })),
    [activeCvDownloadEmails, activeCvDownloads],
  );

  const isAuthExpiredError = (error: unknown): error is ApiRequestError =>
    error instanceof Error && (error as ApiRequestError).authExpired === true;

  const openSessionExpiredDialog = () => {
    setIsSessionExpiredDialogOpen(true);
    setIsLoadingData(false);
    clearAdminError();
    setAuthError("");
    setAuthNotice("");
  };

  const getAdminErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const showAdminError = (
    scope: AdminErrorScope,
    error: unknown,
    fallback = "Request failed.",
  ) => {
    if (isAuthExpiredError(error)) {
      openSessionExpiredDialog();
      return;
    }
    setAdminError({
      id: Date.now(),
      scope,
      message: typeof error === "string" ? error : getAdminErrorMessage(error, fallback),
    });
  };

  const clearAdminError = (scope?: AdminErrorScope) => {
    setAdminError((current) => {
      if (!current) return null;
      if (!scope || current.scope === scope) return null;
      return current;
    });
  };

  const renderScopedError = (scope: SectionId) =>
    adminError?.scope === scope ? (
      <div className={styles.adminSectionMessageOverlay}>
        <AdminErrorPopup
          error={adminError}
          placement="section"
          onClose={() => clearAdminError(scope)}
        />
      </div>
    ) : null;

  const requestJson = async <T,>(
    path: string,
    init: RequestInit = {},
    bearerToken?: string,
  ): Promise<T> => {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }
    if (bearerToken) {
      headers.set("Authorization", `Bearer ${bearerToken}`);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, "Request failed.");
      const requestError = new Error(message) as ApiRequestError;
      requestError.status = response.status;
      requestError.authExpired = Boolean(bearerToken && response.status === 401);
      throw requestError;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  };

  const requestCachedJson = async <T,>(
    path: string,
    bearerToken: string,
    cachedData?: T,
    cachedEtag?: string,
  ): Promise<CachedJsonResult<T>> => {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${bearerToken}`);
    if (cachedEtag) {
      headers.set("If-None-Match", cachedEtag);
    }

    const response = await fetch(`${API_BASE}${path}`, {
      headers,
    });

    if (response.status === 304 && cachedData !== undefined) {
      return {
        data: cachedData,
        etag: cachedEtag,
        fromCache: true,
      };
    }

    if (!response.ok) {
      const message = await parseErrorMessage(response, "Request failed.");
      const requestError = new Error(message) as ApiRequestError;
      requestError.status = response.status;
      requestError.authExpired = response.status === 401;
      throw requestError;
    }

    return {
      data: (await response.json()) as T,
      etag: response.headers.get("ETag") ?? response.headers.get("etag") ?? undefined,
      fromCache: false,
    };
  };

  const uploadAdminFile = async (
    file: File,
    folder:
      | "projects"
      | "services"
      | "banners"
      | "work-experiences"
      | "certificates"
      | "clients"
      | "files",
    contentType: string,
  ) => {
    if (!token) {
      throw new Error("Missing admin session.");
    }

    const signResponse = await requestJson<{
      data: {
        filePath: string;
        proxyPath: string;
        proxyUrl: string;
        uploadUrl: string;
        headers: {
          "Content-Type": string;
        };
      };
    }>(
      "/admin/uploads/sign",
      {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType,
          folder,
        }),
      },
      token,
    );

    const uploadResult = await fetch(signResponse.data.uploadUrl, {
      method: "PUT",
      headers: signResponse.data.headers,
      body: file,
    });
    if (!uploadResult.ok) {
      throw new Error(`Failed to upload ${file.name} to Firebase Storage.`);
    }

    return signResponse.data;
  };

  const uploadAdminImage = async (
    file: File | null,
    folder:
      | "projects"
      | "services"
      | "banners"
      | "work-experiences"
      | "certificates"
      | "clients"
      | "files",
  ) => {
    if (!file) return undefined;
    if (!file.type.startsWith("image/")) {
      throw new Error("Please choose a valid image file.");
    }

    const uploadedFile = await uploadAdminFile(file, folder, file.type || "image/jpeg");
    return uploadedFile.proxyUrl;
  };

  const uploadAdminPdf = async (file: File | null) => {
    if (!file) return null;
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      throw new Error("Please choose a valid PDF file.");
    }

    return uploadAdminFile(file, "files", file.type || "application/pdf");
  };

  const uploadAdminImages = async (
    files: File[],
    folder: "projects" | "services" | "banners" | "work-experiences" | "certificates" | "clients",
  ) => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const uploadedUrl = await uploadAdminImage(file, folder);
      if (uploadedUrl) {
        uploadedUrls.push(uploadedUrl);
      }
    }
    return uploadedUrls;
  };

  const applyAdminDataResponses = (responses: AdminDataResponses) => {
    const {
      statsResponse,
      projectsResponse,
      servicesResponse,
      bannersResponse,
      workExperiencesResponse,
      certificatesResponse,
      reviewsResponse,
      clientsResponse,
      contractsResponse,
      pendingUsersResponse,
      contactsResponse,
      cvResponse,
      analyticsResponse,
      errorLogsResponse,
    } = responses;

    setStats(statsResponse.stats);
    setLoginLogs(Array.isArray(statsResponse.loginLogs) ? statsResponse.loginLogs : []);
    setContent({
      projects: projectsResponse.data.map(mapProject),
      services: servicesResponse.data.map(mapService),
      banners: bannersResponse.data.map(mapBanner),
      workExperiences: workExperiencesResponse.data.map(mapWorkExperience),
      certificates: certificatesResponse.data.map(mapCertificate),
      reviews: reviewsResponse.data.map(mapReview),
    });
    setClients(clientsResponse.data.map(mapClient));
    setContractTemplates(contractsResponse.templates.map(mapContractTemplate));
    setContracts(contractsResponse.contracts.map(mapContract));
    setPendingAdmins(pendingUsersResponse.data);
    setContactConfig(contactsResponse.data);
    setContactEmail(contactsResponse.data?.email ?? "");
    setContactPhone(contactsResponse.data?.phone ?? "");
    setContactInstagramUrl(contactsResponse.data?.instagramUrl ?? "");
    setContactWhatsappUrl(contactsResponse.data?.whatsappUrl ?? "");
    setContactTelegramUrl(contactsResponse.data?.telegramUrl ?? "");
    setContactLinkedinUrl(contactsResponse.data?.linkedinUrl ?? "");
    setShowContactEmail(contactsResponse.data?.showEmail ?? true);
    setShowContactPhone(contactsResponse.data?.showPhone ?? true);
    setShowContactInstagram(contactsResponse.data?.showInstagram ?? true);
    setShowContactWhatsapp(contactsResponse.data?.showWhatsapp ?? true);
    setShowContactTelegram(contactsResponse.data?.showTelegram ?? true);
    setShowContactLinkedin(contactsResponse.data?.showLinkedin ?? true);
    setCvAssets(sortCvAssets(cvResponse.data));
    setAnalyticsStats(analyticsResponse.stats);
    setVisitorGraph(analyticsResponse.graph);
    setErrorLogStats(errorLogsResponse.stats);
    setErrorGraph(errorLogsResponse.graph);
    setErrorLogs(errorLogsResponse.data);
  };

  const invalidateAdminDataCache = () => {
    clearAdminDataCache(activeUser?.id);
  };

  const clearSession = () => {
    bootstrappedTokenRef.current = null;
    clearAdminDataCache();
    void deleteStoredContractDraft().catch(() => undefined);
    setIsSessionExpiredDialogOpen(false);
    setToken(null);
    setActiveUser(null);
    setContent(defaultContent);
    setClients([]);
    setClientsNotice("");
    setContractTemplates([]);
    setContracts([]);
    setContractsNotice("");
    setContractTemplateName("");
    setContractTemplateTitle("");
    setContractTemplatePdfFile(null);
    setContractTemplateExistingPdf(null);
    setContractTemplatePdfInputKey((prev) => prev + 1);
    setContractTemplatePdfPreviewUrl("");
    setContractTemplatePageCount(1);
    setContractTemplateActivePage(1);
    setContractTemplateFields([]);
    resetContractFieldHistory();
    setSelectedContractFieldId(null);
    setContractObjectClipboard(null);
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
    setDraggedContractFieldId(null);
    setContractFieldDropTargetId(null);
    setContractImageUploadingFieldId(null);
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setContractSelectedTemplateId("");
    setContractTitle("");
    setContractRecipientName("");
    setContractRecipientEmail("");
    setContractSearch("");
    setContractDraftCreatedId(null);
    setIsContractDraftOpen(false);
    setContractDraftActiveTab("info");
    setIsContractSendDropdownOpen(false);
    setPendingAdmins([]);
    setRequestProcessingId(null);
    setRequestsNotice("");
    setContactConfig(null);
    setContactEmail("");
    setContactPhone("");
    setContactInstagramUrl("");
    setContactWhatsappUrl("");
    setContactTelegramUrl("");
    setContactLinkedinUrl("");
    setShowContactEmail(true);
    setShowContactPhone(true);
    setShowContactInstagram(true);
    setShowContactWhatsapp(true);
    setShowContactTelegram(true);
    setShowContactLinkedin(true);
    setContactsNotice("");
    setCvAssets([]);
    setCvAtsFile(null);
    setCvVisualFile(null);
    setIsCvDialogOpen(false);
    setCvNotice("");
    setAnalyticsStats(defaultAnalyticsStats);
    setVisitorGraph([]);
    setErrorLogStats(defaultErrorLogStats);
    setErrorGraph([]);
    setErrorLogs([]);
    setEditingProject(null);
    setStats({
      projects: 0,
      services: 0,
      certificates: 0,
      reviews: 0,
    });
    setLoginLogs([]);
    clearAdminError();
    setAuthNotice("");
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(ACTIVE_SECTION_KEY);
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
  };

  const restoreContractDraftRecord = (draft: StoredContractDraftRecord) => {
    const restoredPdfFile = resolveStoredContractDraftFile(draft);
    const restoredPageCount = Math.max(1, draft.pageCount);
    const restoredActivePage = Math.min(Math.max(draft.activePage, 1), restoredPageCount);

    setActiveSection("contracts");
    setIsContractDraftOpen(true);
    setContractTemplateName(draft.templateName);
    setContractTemplateTitle(draft.templateTitle);
    setContractTemplatePdfFile(restoredPdfFile);
    setContractTemplateExistingPdf(restoredPdfFile ? null : draft.existingPdf);
    setContractTemplatePdfInputKey((prev) => prev + 1);
    setContractTemplatePageCount(restoredPageCount);
    setContractTemplateActivePage(restoredActivePage);
    setContractTemplateFields(draft.fields);
    resetContractFieldHistory();
    setSelectedContractFieldId(draft.selectedFieldId);
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
    setDraggedContractFieldId(null);
    setContractFieldDropTargetId(null);
    setContractImageUploadingFieldId(null);
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setContractSelectedTemplateId(draft.templateId);
    setContractTitle(draft.contractTitle);
    setContractRecipientName(draft.recipientName);
    setContractRecipientEmail(draft.recipientEmail);
    setContractDraftCreatedId(draft.createdContractId);
    setIsContractSendDropdownOpen(false);

    if (!restoredPdfFile && !draft.existingPdf && (draft.pdfFileMeta || draft.fields.length > 0)) {
      setContractsNotice(
        `Draft objects restored. Reselect ${draft.pdfFileMeta?.name ?? "the PDF"} to preview the document again.`,
      );
      return;
    }

    setContractsNotice(draft.fields.length > 0 ? "Restored your last contract draft." : "");
  };

  const fetchAdminData = async (
    authToken: string,
    cacheOwnerId: string | null | undefined = activeUser?.id,
  ) => {
    const cachedAdminData = readAdminDataCache(cacheOwnerId);
    const hasCachedData = Boolean(cachedAdminData);
    if (cachedAdminData) {
      applyAdminDataResponses(cachedAdminData.responses);
    }
    setIsLoadingData(!hasCachedData);
    clearAdminError("global");
    try {
      const [
        statsResult,
        projectsResult,
        servicesResult,
        bannersResult,
        workExperiencesResult,
        certificatesResult,
        reviewsResult,
        clientsResult,
        contractsResult,
        pendingUsersResult,
        contactsResult,
        cvResult,
        analyticsResult,
        errorLogsResult,
      ] =
        await Promise.all([
          requestCachedJson<AdminDataResponses["statsResponse"]>(
            "/admin/dashboard/stats",
            authToken,
            cachedAdminData?.responses.statsResponse,
            cachedAdminData?.etags.statsResponse,
          ),
          requestCachedJson<AdminDataResponses["projectsResponse"]>(
            "/admin/projects",
            authToken,
            cachedAdminData?.responses.projectsResponse,
            cachedAdminData?.etags.projectsResponse,
          ),
          requestCachedJson<AdminDataResponses["servicesResponse"]>(
            "/admin/services",
            authToken,
            cachedAdminData?.responses.servicesResponse,
            cachedAdminData?.etags.servicesResponse,
          ),
          requestCachedJson<AdminDataResponses["bannersResponse"]>(
            "/admin/banners",
            authToken,
            cachedAdminData?.responses.bannersResponse,
            cachedAdminData?.etags.bannersResponse,
          ),
          requestCachedJson<AdminDataResponses["workExperiencesResponse"]>(
            "/admin/work-experiences",
            authToken,
            cachedAdminData?.responses.workExperiencesResponse,
            cachedAdminData?.etags.workExperiencesResponse,
          ),
          requestCachedJson<AdminDataResponses["certificatesResponse"]>(
            "/admin/certificates",
            authToken,
            cachedAdminData?.responses.certificatesResponse,
            cachedAdminData?.etags.certificatesResponse,
          ),
          requestCachedJson<AdminDataResponses["reviewsResponse"]>(
            "/admin/reviews",
            authToken,
            cachedAdminData?.responses.reviewsResponse,
            cachedAdminData?.etags.reviewsResponse,
          ),
          requestCachedJson<AdminDataResponses["clientsResponse"]>(
            "/admin/clients",
            authToken,
            cachedAdminData?.responses.clientsResponse,
            cachedAdminData?.etags.clientsResponse,
          ),
          requestCachedJson<AdminDataResponses["contractsResponse"]>(
            "/admin/contracts",
            authToken,
            cachedAdminData?.responses.contractsResponse,
            cachedAdminData?.etags.contractsResponse,
          ),
          requestCachedJson<AdminDataResponses["pendingUsersResponse"]>(
            "/admin/users/pending",
            authToken,
            cachedAdminData?.responses.pendingUsersResponse,
            cachedAdminData?.etags.pendingUsersResponse,
          ),
          requestCachedJson<AdminDataResponses["contactsResponse"]>(
            "/admin/contacts",
            authToken,
            cachedAdminData?.responses.contactsResponse,
            cachedAdminData?.etags.contactsResponse,
          ),
          requestCachedJson<AdminDataResponses["cvResponse"]>(
            "/admin/cv",
            authToken,
            cachedAdminData?.responses.cvResponse,
            cachedAdminData?.etags.cvResponse,
          ),
          requestCachedJson<AdminDataResponses["analyticsResponse"]>(
            "/admin/analytics?days=30",
            authToken,
            cachedAdminData?.responses.analyticsResponse,
            cachedAdminData?.etags.analyticsResponse,
          ),
          requestCachedJson<AdminDataResponses["errorLogsResponse"]>(
            "/admin/error-logs?days=30",
            authToken,
            cachedAdminData?.responses.errorLogsResponse,
            cachedAdminData?.etags.errorLogsResponse,
          ),
        ]);

      const nextResponses: AdminDataResponses = {
        statsResponse: statsResult.data,
        projectsResponse: projectsResult.data,
        servicesResponse: servicesResult.data,
        bannersResponse: bannersResult.data,
        workExperiencesResponse: workExperiencesResult.data,
        certificatesResponse: certificatesResult.data,
        reviewsResponse: reviewsResult.data,
        clientsResponse: clientsResult.data,
        contractsResponse: contractsResult.data,
        pendingUsersResponse: pendingUsersResult.data,
        contactsResponse: contactsResult.data,
        cvResponse: cvResult.data,
        analyticsResponse: analyticsResult.data,
        errorLogsResponse: errorLogsResult.data,
      };

      writeAdminDataCache(cacheOwnerId, nextResponses, {
        statsResponse: statsResult.etag,
        projectsResponse: projectsResult.etag,
        servicesResponse: servicesResult.etag,
        bannersResponse: bannersResult.etag,
        workExperiencesResponse: workExperiencesResult.etag,
        certificatesResponse: certificatesResult.etag,
        reviewsResponse: reviewsResult.etag,
        clientsResponse: clientsResult.etag,
        contractsResponse: contractsResult.etag,
        pendingUsersResponse: pendingUsersResult.etag,
        contactsResponse: contactsResult.etag,
        cvResponse: cvResult.etag,
        analyticsResponse: analyticsResult.etag,
        errorLogsResponse: errorLogsResult.etag,
      });
      applyAdminDataResponses(nextResponses);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load admin data.";
      showAdminError(
        "global",
        hasCachedData ? `Showing cached admin data. Refresh failed: ${message}` : message,
      );
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const storedTheme = safeJsonParse<"dark" | "light">(localStorage.getItem(THEME_KEY), "dark");
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
    const storedUser = storedToken
      ? safeJsonParse<ApiUser | null>(localStorage.getItem(SESSION_USER_KEY), null)
      : null;
    const params = new URLSearchParams(window.location.search);
    const urlResetToken = params.get("resetToken")?.trim() || "";
    const storedSection = localStorage.getItem(ACTIVE_SECTION_KEY);
    const storedSidebarCollapsed = safeJsonParse<boolean>(
      localStorage.getItem(SIDEBAR_COLLAPSED_KEY),
      false,
    );
    const cachedAdminData = storedUser ? readAdminDataCache(storedUser.id) : null;
    setTheme(storedTheme);
    setToken(storedToken);
    setIsSidebarCollapsed(storedSidebarCollapsed);
    setIsLoadingData(Boolean(storedToken) && !cachedAdminData);
    if (isSectionId(storedSection)) {
      setActiveSection(storedSection);
    }
    if (storedUser) {
      setActiveUser(storedUser);
    }
    if (cachedAdminData) {
      applyAdminDataResponses(cachedAdminData.responses);
    }
    if (urlResetToken) {
      setResetToken(urlResetToken);
      setAuthMode("reset");
      setAuthNotice("Reset token detected. Set your new password.");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;
    const shouldRestoreDraft = window.location.pathname.startsWith("/admin/contracts/draft");
    if (!shouldRestoreDraft) {
      setContractDraftStorageReady(true);
      return;
    }

    const restoreDraft = async () => {
      try {
        const storedDraft = await readStoredContractDraft();
        if (!cancelled && storedDraft) {
          restoreContractDraftRecord(storedDraft);
        }
      } catch {
        if (!cancelled) {
          setContractsNotice("Could not restore the previous contract draft from this browser.");
        }
      } finally {
        if (!cancelled) {
          setContractDraftStorageReady(true);
        }
      }
    };

    void restoreDraft();
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, hydrated]);

  useEffect(() => {
    if (!hydrated || !token) return;
    persistActiveSection(activeSection);
  }, [activeSection, hydrated, token]);

  useEffect(() => {
    const syncContractDraftRoute = () => {
      setIsContractDraftOpen(window.location.pathname.startsWith("/admin/contracts/draft"));
    };

    window.addEventListener("popstate", syncContractDraftRoute);
    return () => {
      window.removeEventListener("popstate", syncContractDraftRoute);
    };
  }, []);

  useEffect(() => {
    if (!contractTemplatePdfFile) {
      setContractTemplatePdfPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(contractTemplatePdfFile);
    setContractTemplatePdfPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [contractTemplatePdfFile]);

  useEffect(() => {
    if (!hydrated || !contractDraftStorageReady || !isContractDraftOpen) return;

    const hasDraftContent = Boolean(
      contractTemplatePdfFile ||
        contractTemplateExistingPdf ||
        contractTemplateFields.length > 0 ||
        contractTemplateName.trim() ||
        contractTemplateTitle.trim() ||
        contractTitle.trim() ||
        contractRecipientName.trim() ||
        contractRecipientEmail.trim(),
    );

    const timeoutId = window.setTimeout(() => {
      if (!hasDraftContent) {
        void deleteStoredContractDraft().catch(() => undefined);
        return;
      }

      const selectedFieldId = contractTemplateFields.some(
        (field) => field.id === selectedContractFieldId,
      )
        ? selectedContractFieldId
        : null;
      const snapshot: ContractDraftSnapshot = {
        version: CONTRACT_DRAFT_SNAPSHOT_VERSION,
        savedAt: new Date().toISOString(),
        templateId: contractSelectedTemplateId,
        templateName: contractTemplateName,
        templateTitle: contractTemplateTitle,
        existingPdf: contractTemplatePdfFile ? null : contractTemplateExistingPdf,
        pdfFileMeta: contractTemplatePdfFile
          ? getContractDraftFileMeta(contractTemplatePdfFile)
          : null,
        pageCount: Math.max(1, contractTemplatePageCount),
        activePage: Math.min(
          Math.max(contractTemplateActivePage, 1),
          Math.max(1, contractTemplatePageCount),
        ),
        fields: contractTemplateFields,
        selectedFieldId,
        contractTitle,
        recipientName: contractRecipientName,
        recipientEmail: contractRecipientEmail,
        createdContractId: contractDraftCreatedId,
      };

      void writeStoredContractDraft(snapshot, contractTemplatePdfFile).catch(() => undefined);
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [
    contractDraftCreatedId,
    contractDraftStorageReady,
    contractRecipientEmail,
    contractRecipientName,
    contractSelectedTemplateId,
    contractTemplateActivePage,
    contractTemplateExistingPdf,
    contractTemplateFields,
    contractTemplateName,
    contractTemplatePageCount,
    contractTemplatePdfFile,
    contractTemplateTitle,
    contractTitle,
    hydrated,
    isContractDraftOpen,
    selectedContractFieldId,
  ]);

  useEffect(() => {
    if (!hydrated || !token) return;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(isSidebarCollapsed));
  }, [hydrated, isSidebarCollapsed, token]);

  useEffect(() => {
    if (projectCategoryFilter === "All") return;
    if (projectCategories.includes(projectCategoryFilter)) return;
    setProjectCategoryFilter("All");
  }, [projectCategories, projectCategoryFilter]);

  useEffect(() => {
    const isDialogOpen =
      isProjectDialogOpen ||
      isServiceDialogOpen ||
      isBannerDialogOpen ||
      isCertificateDialogOpen ||
      isClientDialogOpen ||
      isCvDialogOpen ||
      Boolean(editingProject) ||
      Boolean(editingReview);
    if (!isDialogOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProjectDialogOpen(false);
        setIsServiceDialogOpen(false);
        setIsBannerDialogOpen(false);
        setIsCertificateDialogOpen(false);
        setIsCvDialogOpen(false);
        setEditingProject(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    editingProject,
    editingReview,
    isCertificateDialogOpen,
    isClientDialogOpen,
    isCvDialogOpen,
    isBannerDialogOpen,
    isProjectDialogOpen,
    isServiceDialogOpen,
  ]);

  useEffect(() => {
    if (!hydrated || !token) return;
    if (bootstrappedTokenRef.current === token) return;
    let cancelled = false;
    bootstrappedTokenRef.current = token;
    setIsLoadingData(!readAdminDataCache(activeUser?.id));
    clearAdminError();

    const bootstrap = async () => {
      try {
        const me = await requestJson<{ user: ApiUser }>("/auth/me", {}, token);
        if (cancelled) return;
        setActiveUser(me.user);
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(me.user));
        await fetchAdminData(token, me.user.id);
      } catch (error) {
        if (cancelled) return;
        bootstrappedTokenRef.current = null;
        if (isAuthExpiredError(error)) {
          openSessionExpiredDialog();
          return;
        }
        const message = error instanceof Error ? error.message : "Session expired.";
        setAuthError(message);
        clearSession();
        setIsLoadingData(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [activeUser?.id, hydrated, token]);

  const handleAuthSuccess = async (nextToken: string, user: ApiUser) => {
    setAuthError("");
    setAuthNotice("");
    bootstrappedTokenRef.current = nextToken;
    setToken(nextToken);
    setActiveUser(user);
    localStorage.setItem(SESSION_TOKEN_KEY, nextToken);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    setPassword("");
    setSignupConfirmPassword("");
    setNextPassword("");
    setConfirmPassword("");
    await fetchAdminData(nextToken, user.id);
  };

  const resetAuthFields = () => {
    setName("");
    setEmail("");
    setPassword("");
    setSignupConfirmPassword("");
    setShowLoginPassword(false);
    setShowSignupConfirmPassword(false);
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSignupSubmitting) return;
    setAuthError("");
    setAuthNotice("");
    setIsSignupSubmitting(true);

    if (password !== signupConfirmPassword) {
      setAuthError("Passwords do not match.");
      setIsSignupSubmitting(false);
      return;
    }

    try {
      const response = await requestJson<{
        token?: string;
        user?: ApiUser;
        message?: string;
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (response.token && response.user) {
        await handleAuthSuccess(response.token, response.user);
        return;
      }

      setAuthNotice(response.message || "Signup submitted. Awaiting admin approval.");
      setAuthMode("login");
      setPassword("");
      setSignupConfirmPassword("");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Signup failed.");
    } finally {
      setIsSignupSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoginSubmitting) return;
    setAuthError("");
    setAuthNotice("");
    setIsLoginSubmitting(true);

    try {
      const response = await requestJson<{ token: string; user: ApiUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      await handleAuthSuccess(response.token, response.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (isGoogleSubmitting) return;
    setAuthError("");
    setAuthNotice("");
    setIsGoogleSubmitting(true);

    try {
      const response = await requestJson<{
        token?: string;
        user?: ApiUser;
        message?: string;
      }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });

      if (response.token && response.user) {
        await handleAuthSuccess(response.token, response.user);
        return;
      }
      setAuthNotice(response.message || "Google account submitted for approval.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  useEffect(() => {
    if (token || (authMode !== "login" && authMode !== "signup")) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) return;

    let cancelled = false;
    const renderGoogleButton = () => {
      const google = (window as Window & { google?: any }).google;
      if (cancelled || !google?.accounts?.id || !googleButtonRef.current) return;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }: { credential?: string }) => {
          if (credential) void handleGoogleCredential(credential);
        },
      });
      googleButtonRef.current.replaceChildren();
      google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: theme === "dark" ? "filled_black" : "outline",
        size: "large",
        shape: "rectangular",
        text: authMode === "signup" ? "signup_with" : "signin_with",
        width: Math.min(420, googleButtonRef.current.clientWidth || 420),
      });
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      if ((window as Window & { google?: any }).google) renderGoogleButton();
      else existingScript.addEventListener("load", renderGoogleButton, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", renderGoogleButton, { once: true });
      document.head.appendChild(script);
    }

    return () => { cancelled = true; };
  }, [authMode, theme, token]);

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");

    try {
      const response = await requestJson<{ message?: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });
      setAuthNotice(
        response.message ||
          "If the email exists, a password reset link has been sent.",
      );
      setAuthMode("login");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to request reset link.");
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError("");
    setAuthNotice("");

    if (!resetToken.trim()) {
      setAuthError("Missing reset token.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    try {
      const response = await requestJson<{ message?: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: resetToken.trim(),
          newPassword: nextPassword,
        }),
      });
      setAuthNotice(response.message || "Password reset successful. Please log in.");
      setAuthMode("login");
      setResetToken("");
      setNextPassword("");
      setConfirmPassword("");
      const url = new URL(window.location.href);
      url.searchParams.delete("resetToken");
      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Failed to reset password.");
    }
  };

  const handleSignOut = () => {
    clearSession();
    setActiveSection("dashboard");
  };

  const dismissSessionExpiredDialog = () => {
    setIsSessionExpiredDialogOpen(false);
    clearSession();
    setAuthMode("login");
  };

  const selectActiveSection = (section: SectionId) => {
    setActiveSection(section);
    persistActiveSection(section);
  };

  const closeProjectEditor = () => {
    setEditingProject(null);
    setProjectEditImageFile(null);
    setProjectEditPortraitImageFile(null);
    setProjectEditLandscapeImageFile(null);
    setProjectEditPreviewImageFiles([]);
  };

  const openProjectEditor = (project: AdminProject) => {
    clearAdminError("projects");
    setIsProjectDialogOpen(false);
    setEditingProject(project);
    setProjectEditTitle(project.title);
    setProjectEditCategory(project.category);
    setProjectEditDescription(project.description);
    setProjectEditStatus(project.status);
    setProjectEditDeliveryStatus(project.deliveryStatus);
    setProjectEditTags(project.tags.join(", "));
    setProjectEditHighlights(project.highlights.join("\n"));
    setProjectEditDetails(project.details ?? "");
    setProjectEditImageFile(null);
    setProjectEditImageInputKey((prev) => prev + 1);
    setProjectEditPortraitImageFile(null);
    setProjectEditPortraitImageInputKey((prev) => prev + 1);
    setProjectEditLandscapeImageFile(null);
    setProjectEditLandscapeImageInputKey((prev) => prev + 1);
    setProjectEditIsFeatured(project.isFeatured);
    setProjectEditIsPinned(project.isPinned);
    setProjectEditPreviewImageUrls(project.previewImages);
    setProjectEditPreviewImageFiles([]);
    setProjectEditPreviewImageInputKey((prev) => prev + 1);
  };

  const addProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !token ||
      !projectTitle.trim() ||
      !projectCategory.trim() ||
      !projectDescription.trim() ||
      !projectOverview.trim() ||
      !projectStartDate ||
      !projectImageFile ||
      isProjectCreating
    ) {
      if (!projectImageFile) {
        showAdminError("projects", "Default project thumbnail is required.");
      }
      return;
    }

    setIsProjectCreating(true);
    clearAdminError("projects");
    try {
      const imageUrl = await uploadAdminImage(projectImageFile, "projects");
      if (!imageUrl) {
        throw new Error("Default project thumbnail is required.");
      }
      const portraitImageUrl = await uploadAdminImage(projectPortraitImageFile, "projects");
      const landscapeImageUrl = await uploadAdminImage(projectLandscapeImageFile, "projects");
      const previewImages = await uploadAdminImages(projectPreviewImageFiles, "projects");
      const response = await requestJson<{
        data: AdminProjectApi;
      }>("/admin/projects", {
        method: "POST",
        body: JSON.stringify({
          title: projectTitle.trim(),
          category: projectCategory.trim(),
          status: projectStatus,
          isFeatured: projectIsFeatured,
          isPinned: projectIsPinned,
          timeline: projectDeliveryStatus,
          imageUrl,
          portraitImageUrl,
          landscapeImageUrl,
          previewImages,
          description: projectDescription.trim(),
          details: projectOverview.trim(),
          startDate: projectStartDate,
          endDate: projectEndDate.trim() ? projectEndDate : null,
        }),
      }, token);

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        projects: [mapProject(response.data), ...prev.projects],
      }));
      setStats((prev) => ({ ...prev, projects: prev.projects + 1 }));
      setProjectTitle("");
      setProjectCategory("");
      setProjectDescription("");
      setProjectOverview("");
      setProjectStartDate("");
      setProjectEndDate("");
      setProjectStatus("Draft");
      setProjectDeliveryStatus("Ongoing");
      setProjectIsFeatured(false);
      setProjectIsPinned(false);
      setProjectImageFile(null);
      setProjectImageInputKey((prev) => prev + 1);
      setProjectPortraitImageFile(null);
      setProjectPortraitImageInputKey((prev) => prev + 1);
      setProjectLandscapeImageFile(null);
      setProjectLandscapeImageInputKey((prev) => prev + 1);
      setProjectPreviewImageFiles([]);
      setProjectPreviewImageInputKey((prev) => prev + 1);
      setProjectSearch("");
      setProjectStatusFilter("All");
      setProjectCategoryFilter("All");
      setIsProjectDialogOpen(false);
    } catch (error) {
      showAdminError("projects", error, "Failed to add project.");
    } finally {
      setIsProjectCreating(false);
    }
  };

  const saveProjectEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !token ||
      !editingProject ||
      !projectEditTitle.trim() ||
      !projectEditCategory.trim() ||
      !projectEditDescription.trim()
    ) {
      return;
    }

    setProjectUpdatingId(editingProject.id);
    clearAdminError("projects");
    try {
      const imageUrl = await uploadAdminImage(projectEditImageFile, "projects");
      const portraitImageUrl = await uploadAdminImage(projectEditPortraitImageFile, "projects");
      const landscapeImageUrl = await uploadAdminImage(projectEditLandscapeImageFile, "projects");
      const uploadedPreviewImages = await uploadAdminImages(
        projectEditPreviewImageFiles,
        "projects",
      );
      const previewImages = [...projectEditPreviewImageUrls, ...uploadedPreviewImages];
      const response = await requestJson<{
        data: AdminProjectApi;
      }>(
        `/admin/projects/${editingProject.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: projectEditTitle.trim(),
            category: projectEditCategory.trim(),
            description: projectEditDescription.trim(),
            status: projectEditStatus,
            isFeatured: projectEditIsFeatured,
            isPinned: projectEditIsPinned,
            imageUrl: imageUrl ?? editingProject.imageUrl ?? undefined,
            portraitImageUrl: portraitImageUrl ?? editingProject.portraitImageUrl ?? undefined,
            landscapeImageUrl: landscapeImageUrl ?? editingProject.landscapeImageUrl ?? undefined,
            previewImages,
            timeline: projectEditDeliveryStatus,
            tags: parseProjectListField(projectEditTags),
            highlights: parseProjectListField(projectEditHighlights),
            details: projectEditDetails.trim() || null,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        projects: prev.projects.map((item) =>
          item.id === editingProject.id ? mapProject(response.data) : item,
        ),
      }));
      closeProjectEditor();
    } catch (error) {
      showAdminError("projects", error, "Failed to update project details.");
    } finally {
      setProjectUpdatingId((prev) => (prev === editingProject.id ? null : prev));
    }
  };

  const addService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !serviceName.trim() || !serviceSummary.trim() || isServiceCreating) return;

    setIsServiceCreating(true);
    clearAdminError("services");
    try {
      const imageUrl = await uploadAdminImage(serviceImageFile, "services");
      const response = await requestJson<{
        data: {
          id: string;
          name: string;
          description: string;
          imageUrl?: string | null;
        };
      }>("/admin/services", {
        method: "POST",
        body: JSON.stringify({
          name: serviceName.trim(),
          description: serviceSummary.trim(),
          imageUrl,
        }),
      }, token);

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        services: [mapService(response.data), ...prev.services],
      }));
      setStats((prev) => ({ ...prev, services: prev.services + 1 }));
      setServiceName("");
      setServiceSummary("");
      setServiceImageFile(null);
      setServiceImageInputKey((prev) => prev + 1);
      setServiceSearch("");
      setIsServiceDialogOpen(false);
    } catch (error) {
      showAdminError("services", error, "Failed to add service.");
    } finally {
      setIsServiceCreating(false);
    }
  };

  const openServiceEditor = (service: AdminService) => {
    setEditingService(service);
    setServiceEditName(service.name);
    setServiceEditSummary(service.summary);
    setServiceEditImageFile(null);
    setServiceEditImageInputKey((prev) => prev + 1);
    clearAdminError("services");
  };

  const closeServiceEditor = () => {
    setEditingService(null);
    setServiceEditName("");
    setServiceEditSummary("");
    setServiceEditImageFile(null);
    setServiceEditImageInputKey((prev) => prev + 1);
  };

  const updateService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !token ||
      !editingService ||
      !serviceEditName.trim() ||
      !serviceEditSummary.trim() ||
      serviceSavingId
    ) {
      return;
    }

    setServiceSavingId(editingService.id);
    clearAdminError("services");
    try {
      const imageUrl = await uploadAdminImage(serviceEditImageFile, "services");
      const response = await requestJson<{ data: AdminServiceApi }>(
        `/admin/services/${editingService.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: serviceEditName.trim(),
            description: serviceEditSummary.trim(),
            imageUrl: imageUrl ?? editingService.imageUrl ?? undefined,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        services: prev.services.map((item) =>
          item.id === editingService.id ? mapService(response.data) : item,
        ),
      }));
      closeServiceEditor();
    } catch (error) {
      showAdminError("services", error, "Failed to update service.");
    } finally {
      setServiceSavingId(null);
    }
  };

  const persistBannerOrder = async (nextBanners: AdminBanner[]) => {
    if (!token) {
      throw new Error("Missing admin session.");
    }

    const normalizedBanners = normalizeBannerOrder(nextBanners);
    await Promise.all(
      normalizedBanners.map((banner) =>
        requestJson<{ data: AdminBannerApi }>(
          `/admin/banners/${banner.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ sortOrder: banner.sortOrder }),
          },
          token,
        ),
      ),
    );
    invalidateAdminDataCache();
    return normalizedBanners;
  };

  const clearBannerDragState = () => {
    setDraggedBannerId(null);
    setBannerDropTargetId(null);
  };

  const handleBannerDragStart = (event: ReactDragEvent<HTMLElement>, bannerId: string) => {
    if (!canReorderBanners) {
      event.preventDefault();
      return;
    }

    setDraggedBannerId(bannerId);
    setBannerDropTargetId(bannerId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", bannerId);
  };

  const handleBannerDragOver = (event: ReactDragEvent<HTMLElement>, bannerId: string) => {
    if (!canReorderBanners || draggedBannerId === null || draggedBannerId === bannerId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (bannerDropTargetId !== bannerId) {
      setBannerDropTargetId(bannerId);
    }
  };

  const handleBannerDrop = async (event: ReactDragEvent<HTMLElement>, targetBannerId: string) => {
    event.preventDefault();
    if (!token || !canReorderBanners || !draggedBannerId || draggedBannerId === targetBannerId) {
      clearBannerDragState();
      return;
    }

    const nextBanners = reorderById(content.banners, draggedBannerId, targetBannerId);
    if (nextBanners === content.banners) {
      clearBannerDragState();
      return;
    }

    const normalizedBanners = normalizeBannerOrder(nextBanners);
    clearBannerDragState();
    setIsBannerReordering(true);
    clearAdminError("banners");
    setContent((prev) => ({
      ...prev,
      banners: normalizedBanners,
    }));

    try {
      await persistBannerOrder(nextBanners);
    } catch (error) {
      showAdminError("banners", error, "Failed to save banner order.");
      await fetchAdminData(token, activeUser?.id);
    } finally {
      setIsBannerReordering(false);
    }
  };

  const addBanner = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !bannerTitle.trim() || !bannerSubtitle.trim() || isBannerCreating) return;

    setIsBannerCreating(true);
    clearAdminError("banners");
    try {
      const imageUrl = await uploadAdminImage(bannerImageFile, "banners");
      const response = await requestJson<{
        data: AdminBannerApi;
      }>(
        "/admin/banners",
        {
          method: "POST",
          body: JSON.stringify({
            title: bannerTitle.trim(),
            subtitle: bannerSubtitle.trim(),
            imageUrl,
            sortOrder: content.banners.length,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        banners: [...prev.banners, mapBanner(response.data)],
      }));
      setBannerTitle("");
      setBannerSubtitle("");
      setBannerImageFile(null);
      setBannerImageInputKey((prev) => prev + 1);
      setBannerSearch("");
      setIsBannerDialogOpen(false);
    } catch (error) {
      showAdminError("banners", error, "Failed to add banner.");
    } finally {
      setIsBannerCreating(false);
    }
  };

  const openBannerEditor = (banner: AdminBanner) => {
    setEditingBanner(banner);
    setBannerEditTitle(banner.title);
    setBannerEditSubtitle(banner.subtitle);
    setBannerEditImageFile(null);
    setBannerEditImageInputKey((prev) => prev + 1);
    clearAdminError("banners");
  };

  const closeBannerEditor = () => {
    setEditingBanner(null);
    setBannerEditTitle("");
    setBannerEditSubtitle("");
    setBannerEditImageFile(null);
    setBannerEditImageInputKey((prev) => prev + 1);
  };

  const updateBanner = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !token ||
      !editingBanner ||
      !bannerEditTitle.trim() ||
      !bannerEditSubtitle.trim() ||
      bannerSavingId
    ) {
      return;
    }

    setBannerSavingId(editingBanner.id);
    clearAdminError("banners");
    try {
      const imageUrl = await uploadAdminImage(bannerEditImageFile, "banners");
      const response = await requestJson<{ data: AdminBannerApi }>(
        `/admin/banners/${editingBanner.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: bannerEditTitle.trim(),
            subtitle: bannerEditSubtitle.trim(),
            imageUrl: imageUrl ?? editingBanner.imageUrl ?? undefined,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        banners: prev.banners.map((item) =>
          item.id === editingBanner.id ? mapBanner(response.data) : item,
        ),
      }));
      closeBannerEditor();
    } catch (error) {
      showAdminError("banners", error, "Failed to update banner.");
    } finally {
      setBannerSavingId(null);
    }
  };

  const addWorkExperience = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !token ||
      !workCompany.trim() ||
      !workRole.trim() ||
      !workDuration.trim() ||
      !workLocation.trim() ||
      !workSummary.trim() ||
      isWorkCreating
    ) {
      return;
    }

    setIsWorkCreating(true);
    clearAdminError("workExperiences");
    try {
      const imageUrl = await uploadAdminImage(workImageFile, "work-experiences");
      const response = await requestJson<{ data: AdminWorkExperienceApi }>(
        "/admin/work-experiences",
        {
          method: "POST",
          body: JSON.stringify({
            company: workCompany.trim(),
            role: workRole.trim(),
            duration: workDuration.trim(),
            location: workLocation.trim(),
            summary: workSummary.trim(),
            highlights: parseWorkHighlightsField(workHighlights),
            imageUrl,
            sortOrder: content.workExperiences.length,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        workExperiences: [...prev.workExperiences, mapWorkExperience(response.data)],
      }));
      setWorkCompany("");
      setWorkRole("");
      setWorkDuration("");
      setWorkLocation("");
      setWorkSummary("");
      setWorkHighlights("");
      setWorkImageFile(null);
      setWorkImageInputKey((prev) => prev + 1);
      setWorkSearch("");
      setIsWorkDialogOpen(false);
    } catch (error) {
      showAdminError("workExperiences", error, "Failed to add work experience.");
    } finally {
      setIsWorkCreating(false);
    }
  };

  const openWorkExperienceEditor = (workExperience: AdminWorkExperience) => {
    setEditingWorkExperience(workExperience);
    setWorkEditCompany(workExperience.company);
    setWorkEditRole(workExperience.role);
    setWorkEditDuration(workExperience.duration);
    setWorkEditLocation(workExperience.location);
    setWorkEditSummary(workExperience.summary);
    setWorkEditHighlights(workExperience.highlights.join("\n"));
    setWorkEditImageFile(null);
    setWorkEditImageInputKey((prev) => prev + 1);
    clearAdminError("workExperiences");
  };

  const closeWorkExperienceEditor = () => {
    setEditingWorkExperience(null);
    setWorkEditCompany("");
    setWorkEditRole("");
    setWorkEditDuration("");
    setWorkEditLocation("");
    setWorkEditSummary("");
    setWorkEditHighlights("");
    setWorkEditImageFile(null);
    setWorkEditImageInputKey((prev) => prev + 1);
  };

  const updateWorkExperience = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !token ||
      !editingWorkExperience ||
      !workEditCompany.trim() ||
      !workEditRole.trim() ||
      !workEditDuration.trim() ||
      !workEditLocation.trim() ||
      !workEditSummary.trim() ||
      workSavingId
    ) {
      return;
    }

    setWorkSavingId(editingWorkExperience.id);
    clearAdminError("workExperiences");
    try {
      const imageUrl = await uploadAdminImage(workEditImageFile, "work-experiences");
      const response = await requestJson<{ data: AdminWorkExperienceApi }>(
        `/admin/work-experiences/${editingWorkExperience.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            company: workEditCompany.trim(),
            role: workEditRole.trim(),
            duration: workEditDuration.trim(),
            location: workEditLocation.trim(),
            summary: workEditSummary.trim(),
            highlights: parseWorkHighlightsField(workEditHighlights),
            imageUrl: imageUrl ?? editingWorkExperience.imageUrl ?? undefined,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        workExperiences: prev.workExperiences.map((item) =>
          item.id === editingWorkExperience.id ? mapWorkExperience(response.data) : item,
        ),
      }));
      closeWorkExperienceEditor();
    } catch (error) {
      showAdminError("workExperiences", error, "Failed to update work experience.");
    } finally {
      setWorkSavingId(null);
    }
  };

  const addCertificate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !token ||
      !certTitle.trim() ||
      !certIssuer.trim() ||
      !certDate.trim() ||
      isCertificateCreating
    ) {
      return;
    }

    setIsCertificateCreating(true);
    clearAdminError("certificates");
    try {
      const imageUrl = await uploadAdminImage(certificateImageFile, "certificates");
      const response = await requestJson<{
        data: {
          id: string;
          title: string;
          org: string;
          issueDate: string;
          imageUrl?: string | null;
        };
      }>("/admin/certificates", {
        method: "POST",
        body: JSON.stringify({
          title: certTitle.trim(),
          org: certIssuer.trim(),
          issueDate: certDate,
          imageUrl,
          description: `${certTitle.trim()} from ${certIssuer.trim()}.`,
        }),
      }, token);

      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        certificates: [mapCertificate(response.data), ...prev.certificates],
      }));
      setStats((prev) => ({ ...prev, certificates: prev.certificates + 1 }));
      setCertTitle("");
      setCertIssuer("");
      setCertDate("");
      setCertificateImageFile(null);
      setCertificateImageInputKey((prev) => prev + 1);
      setCertificateSearch("");
      setIsCertificateDialogOpen(false);
    } catch (error) {
      showAdminError("certificates", error, "Failed to add certificate.");
    } finally {
      setIsCertificateCreating(false);
    }
  };

  const addClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !clientName.trim() || !clientEmail.trim()) return;

    setClientSaving(true);
    setClientsNotice("");
    clearAdminError("clients");
    try {
      const imageUrl = await uploadAdminImage(clientImageFile, "clients");
      const response = await requestJson<{ data: AdminClientApi }>(
        "/admin/clients",
        {
          method: "POST",
          body: JSON.stringify({
            name: clientName.trim(),
            email: clientEmail.trim(),
            imageUrl,
            company: clientCompany.trim() || undefined,
            role: clientRole.trim() || undefined,
            notes: clientNotes.trim() || undefined,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setClients((prev) => [mapClient(response.data), ...prev]);
      setClientName("");
      setClientEmail("");
      setClientCompany("");
      setClientRole("");
      setClientNotes("");
      setClientImageFile(null);
      setClientImageInputKey((prev) => prev + 1);
      setIsClientDialogOpen(false);
      setClientsNotice("Client added.");
    } catch (error) {
      showAdminError("clients", error, "Failed to add client.");
    } finally {
      setClientSaving(false);
    }
  };

  const sendClientReviewInvitation = async (id: string) => {
    if (!token) return;
    setClientInvitingId(id);
    setClientsNotice("");
    clearAdminError("clients");
    try {
      const response = await requestJson<AdminClientInvitationResponse>(
        `/admin/clients/${id}/invitations`,
        { method: "POST" },
        token,
      );
      invalidateAdminDataCache();
      if (response.data) {
        const nextClient = mapClient(response.data);
        setClients((prev) =>
          prev.map((client) => (client.id === id ? nextClient : client)),
        );
        if (response.emailDelivery?.status === "failed") {
          setClientsNotice(
            [
              `Invitation link created for ${nextClient.email}, but the email was not sent.`,
              response.emailDelivery.message,
              response.invitation?.reviewUrl
                ? `Manual review link: ${response.invitation.reviewUrl}`
                : "",
            ]
              .filter(Boolean)
              .join(" "),
          );
        } else {
          setClientsNotice(`Review invitation sent to ${nextClient.email}.`);
        }
      } else {
        setClientsNotice(
          response.emailDelivery?.status === "failed"
            ? "Invitation link created, but the email was not sent."
            : "Review invitation sent.",
        );
      }
    } catch (error) {
      showAdminError("clients", error, "Failed to send review invitation.");
    } finally {
      setClientInvitingId((prev) => (prev === id ? null : prev));
    }
  };

  const markContractDraftUnsaved = () => {
    setContractSelectedTemplateId("");
    setContractDraftCreatedId(null);
    setIsContractSendDropdownOpen(false);
  };

  const resetContractDraft = () => {
    void deleteStoredContractDraft().catch(() => undefined);
    setContractTemplateName("");
    setContractTemplateTitle("");
    setContractTemplatePdfFile(null);
    setContractTemplateExistingPdf(null);
    setContractTemplatePdfInputKey((prev) => prev + 1);
    setContractTemplatePageCount(1);
    setContractTemplateActivePage(1);
    setContractTemplateFields([]);
    resetContractFieldHistory();
    setSelectedContractFieldId(null);
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
    setDraggedContractFieldId(null);
    setContractFieldDropTargetId(null);
    setContractImageUploadingFieldId(null);
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setContractSelectedTemplateId("");
    setContractTitle("");
    setContractRecipientName("");
    setContractRecipientEmail("");
    setContractDraftCreatedId(null);
    setIsContractSendDropdownOpen(false);
  };

  const openContractDraft = (template?: AdminContractTemplate) => {
    setActiveSection("contracts");
    clearAdminError("contracts");
    setContractsNotice("");
    setContractTemplatePdfFile(null);
    setContractTemplatePdfInputKey((prev) => prev + 1);
    resetContractFieldHistory();
    setSelectedContractFieldId(null);
    setContractObjectClipboard(null);
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
    setDraggedContractFieldId(null);
    setContractFieldDropTargetId(null);
    setContractImageUploadingFieldId(null);
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setContractDraftCreatedId(null);
    setIsContractSendDropdownOpen(false);

    if (template) {
      setContractTemplateName(template.name);
      setContractTemplateTitle(template.title);
      setContractTemplateExistingPdf(template.pdfDocument);
      setContractTemplatePageCount(template.pageCount);
      setContractTemplateActivePage(1);
      setContractTemplateFields(template.fields);
      setContractSelectedTemplateId(template.id);
      setContractTitle(template.title);
    } else {
      resetContractDraft();
    }

    if (!window.location.pathname.startsWith("/admin/contracts/draft")) {
      window.history.pushState(null, "", "/admin/contracts/draft");
    }
    setIsContractDraftOpen(true);
  };

  const closeContractDraft = () => {
    setActiveSection("contracts");
    setIsContractDraftOpen(false);
    setIsContractSendDropdownOpen(false);
    if (window.location.pathname.startsWith("/admin/contracts/draft")) {
      window.history.pushState(null, "", "/admin");
    }
  };

  const clearContractDraftPdf = () => {
    void deleteStoredContractDraft().catch(() => undefined);
    markContractDraftUnsaved();
    setContractTemplateName("");
    setContractTemplateTitle("");
    setContractTemplatePdfFile(null);
    setContractTemplateExistingPdf(null);
    setContractTemplatePdfInputKey((prev) => prev + 1);
    setContractTemplatePageCount(1);
    setContractTemplateActivePage(1);
    setContractTemplateFields([]);
    resetContractFieldHistory();
    setSelectedContractFieldId(null);
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
    setDraggedContractFieldId(null);
    setContractFieldDropTargetId(null);
    setContractImageUploadingFieldId(null);
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setContractRecipientName("");
    setContractRecipientEmail("");
    setContractTitle("");
    setContractsNotice("");
  };

  const getContractPdfBaseName = (fileName: string) =>
    fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const applyContractPdfFile = (file: File | null) => {
    if (file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setContractsNotice("Please choose a valid PDF file.");
      return;
    }

    const shouldKeepRestoredFields = !contractDraftPdfUrl && contractTemplateFields.length > 0;
    markContractDraftUnsaved();
    setContractTemplatePdfFile(file);
    setContractTemplateExistingPdf(null);
    if (!shouldKeepRestoredFields) {
      setContractTemplateFields([]);
    }
    resetContractFieldHistory();
    setSelectedContractFieldId(null);
    setContractObjectClipboard(null);
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
    setDraggedContractFieldId(null);
    setContractFieldDropTargetId(null);
    setContractImageUploadingFieldId(null);
    setIsContractDrawMenuOpen(false);
    setIsContractDrawModeActive(false);
    setIsContractDrawMenuInteracting(false);
    setIsContractEraserMenuOpen(false);
    setIsContractEraserModeActive(false);
    setIsContractEraserMenuInteracting(false);
    setContractTemplatePageCount(1);
    setContractTemplateActivePage(1);

    if (!file) return;

    const baseName = getContractPdfBaseName(file.name) || "Contract agreement";
    setContractTemplateName(baseName);
    setContractTemplateTitle(baseName);
    setContractTitle((current) => current || baseName);
  };

  const startContractPaletteDrag = (
    event: ReactDragEvent<HTMLElement>,
    type: ContractPdfField["type"],
  ) => {
    stopContractFreehandTools();
    event.dataTransfer.setData("application/x-contract-field", type);
    event.dataTransfer.effectAllowed = "copy";
  };

  const startEditingContractObjectLabel = (field: ContractPdfField, index: number) => {
    setSelectedContractFieldId(field.id);
    setEditingContractObjectLabelId(field.id);
    setContractObjectLabelDraft(getContractFieldObjectLabel(field, index));
  };

  const finishEditingContractObjectLabel = (fieldId: string) => {
    const nextLabel = contractObjectLabelDraft.trim();
    if (nextLabel) {
      recordContractFieldHistory();
      markContractDraftUnsaved();
      setContractTemplateFields((prev) =>
        prev.map((field) =>
          field.id === fieldId ? { ...field, objectLabel: nextLabel } : field,
        ),
      );
    }
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
  };

  const cancelEditingContractObjectLabel = () => {
    setEditingContractObjectLabelId(null);
    setContractObjectLabelDraft("");
  };

  const createContractField = (
    type: ContractPdfField["type"],
    position?: { page: number; x: number; y: number },
  ) => {
    const width =
      type === "textbox"
        ? 0.28
        : type === "signature"
          ? 0.28
          : type === "image"
            ? 0.28
            : type === "draw"
              ? 0.2
              : 0.22;
    const height =
      type === "textbox"
        ? 0.028
        : type === "signature"
          ? 0.06
          : type === "image"
            ? 0.16
            : type === "draw"
              ? 0.08
              : 0.022;
    const page = position?.page ?? Math.min(Math.max(contractTemplateActivePage, 1), contractTemplatePageCount);
    const field: ContractPdfField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      page,
      x: Math.min(Math.max(position ? position.x - width / 2 : type === "textbox" ? 0.2 : 0.12, 0), 1 - width),
      y: Math.min(Math.max(position ? position.y - height / 2 : type === "textbox" ? 0.28 : 0.18, 0), 1 - height),
      width,
      height,
      objectLabel: getContractFieldDefaultObjectLabel({ type }, contractTemplateFields.length),
      label: getContractFieldDefaultLabel(type),
      fontFamily: defaultContractFieldFontFamily,
      fontStyle: defaultContractFieldFontStyle,
      fontColor: defaultContractFieldFontColor,
      backgroundColor: defaultContractFieldBackgroundColor,
      borderColor: defaultContractFieldBorderColor,
      borderWidth: 0,
      textAlign: "left",
      fontSize: 14,
      imageUrl: undefined,
      drawingDataUrl: undefined,
      drawColor: type === "draw" ? contractDrawColor : undefined,
      drawStrokeWidth: type === "draw" ? contractDrawStrokeWidth : undefined,
      required: type === "textbox" || type === "signature",
      locked: false,
    };
    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) => [...prev, field]);
    setSelectedContractFieldId(field.id);
  };

  const createContractDrawingField = (drawing: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    drawingDataUrl: string;
    drawColor: string;
    drawStrokeWidth: number;
    mode?: "draw" | "eraser";
  }) => {
    const isEraser = drawing.mode === "eraser";
    const field: ContractPdfField = {
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "draw",
      page: drawing.page,
      x: drawing.x,
      y: drawing.y,
      width: drawing.width,
      height: drawing.height,
      objectLabel: isEraser
        ? `Eraser ${contractTemplateFields.length + 1}`
        : getContractFieldDefaultObjectLabel(
            { type: "draw" },
            contractTemplateFields.length,
          ),
      label: isEraser ? "Eraser" : getContractFieldDefaultLabel("draw"),
      fontFamily: defaultContractFieldFontFamily,
      fontStyle: defaultContractFieldFontStyle,
      fontColor: defaultContractFieldFontColor,
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
      textAlign: "left",
      fontSize: 14,
      imageUrl: undefined,
      drawingDataUrl: drawing.drawingDataUrl,
      drawColor: drawing.drawColor,
      drawStrokeWidth: drawing.drawStrokeWidth,
      required: false,
      locked: false,
    };

    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) => [...prev, field]);
    setSelectedContractFieldId(field.id);
  };

  const updateSelectedContractField = (patch: Partial<ContractPdfField>) => {
    if (!selectedContractFieldId) return;
    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) =>
      prev.map((field) => {
        if (field.id !== selectedContractFieldId) return field;
        const width = Math.min(Math.max(patch.width ?? field.width, 0.03), 1);
        const height = Math.min(Math.max(patch.height ?? field.height, 0.015), 1);
        return {
          ...field,
          ...patch,
          width,
          height,
          x: Math.min(Math.max(patch.x ?? field.x, 0), 1 - width),
          y: Math.min(Math.max(patch.y ?? field.y, 0), 1 - height),
        };
      }),
    );
  };

  const uploadContractImageField = async (fieldId: string, file: File | null) => {
    if (!file || contractImageUploadingFieldId) return;

    setContractImageUploadingFieldId(fieldId);
    setContractsNotice("");
    clearAdminError("contracts");
    try {
      const imageUrl = await uploadAdminImage(file, "files");
      if (!imageUrl) return;

      recordContractFieldHistory();
      markContractDraftUnsaved();
      setContractTemplateFields((prev) =>
        prev.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                imageUrl,
                label: field.label.trim() || getContractFieldDefaultLabel("image"),
              }
            : field,
        ),
      );
      setContractsNotice("Image attached to object.");
    } catch (error) {
      showAdminError("contracts", error, "Failed to upload contract image.");
    } finally {
      setContractImageUploadingFieldId((current) => (current === fieldId ? null : current));
    }
  };

  const requestContractImageObjectUpload = (fieldId: string) => {
    pendingContractImageUploadFieldIdRef.current = fieldId;
    setSelectedContractFieldId(fieldId);
    contractImageObjectInputRef.current?.click();
  };

  const deleteSelectedContractField = () => {
    if (!selectedContractFieldId) return;
    deleteContractField(selectedContractFieldId);
  };

  const toggleContractFieldLock = (fieldId: string) => {
    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) =>
      prev.map((field) =>
        field.id === fieldId ? { ...field, locked: !field.locked } : field,
      ),
    );
  };

  const createClipboardContractField = (
    source: ContractPdfField,
    targetPage: number,
    fieldIndex: number,
    action: NonNullable<ContractObjectClipboard>["action"],
  ): ContractPdfField => {
    const width = clampAdminNumber(source.width, 0.03, 1);
    const height = clampAdminNumber(source.height, 0.015, 1);
    const offset = source.page === targetPage ? 0.02 : 0;
    const sourceLabel =
      source.objectLabel?.trim() || getContractFieldDefaultObjectLabel(source, fieldIndex);

    return {
      ...source,
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      page: targetPage,
      objectLabel: action === "copy" ? `${sourceLabel} copy` : sourceLabel,
      x: clampAdminNumber(source.x + offset, 0, Math.max(0, 1 - width)),
      y: clampAdminNumber(source.y + offset, 0, Math.max(0, 1 - height)),
      width,
      height,
    };
  };

  const copyContractFieldToClipboard = (
    fieldId: string,
    action: NonNullable<ContractObjectClipboard>["action"] = "copy",
  ) => {
    const sourceIndex = contractTemplateFields.findIndex((field) => field.id === fieldId);
    if (sourceIndex === -1) return;

    const source = contractTemplateFields[sourceIndex];
    const label = getContractFieldObjectLabel(source, sourceIndex);
    setContractObjectClipboard({ field: { ...source, objectLabel: label }, action });

    if (action === "cut") {
      recordContractFieldHistory();
      markContractDraftUnsaved();
      setContractTemplateFields((prev) => prev.filter((field) => field.id !== fieldId));
      setSelectedContractFieldId(null);
      setContractsNotice(`Cut ${label}. Paste it on the target page.`);
      return;
    }

    setSelectedContractFieldId(fieldId);
    setContractsNotice(`Copied ${label}.`);
  };

  const pasteContractFieldFromClipboard = () => {
    if (!contractObjectClipboard) return;

    const targetPage = Math.min(
      Math.max(contractTemplateActivePage, 1),
      Math.max(1, contractTemplatePageCount),
    );
    const pastedField = createClipboardContractField(
      contractObjectClipboard.field,
      targetPage,
      contractTemplateFields.length,
      contractObjectClipboard.action,
    );
    const selectedIndex = selectedContractFieldId
      ? contractTemplateFields.findIndex((field) => field.id === selectedContractFieldId)
      : -1;

    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) => {
      const next = [...prev];
      next.splice(selectedIndex >= 0 ? selectedIndex + 1 : next.length, 0, pastedField);
      return next;
    });
    setSelectedContractFieldId(pastedField.id);
    setContractObjectClipboard((current) =>
      current?.action === "cut" ? { ...current, action: "copy" } : current,
    );
    setContractsNotice(`Pasted object to page ${targetPage}.`);
  };

  const duplicateContractField = (fieldId: string) => {
    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) => {
      const sourceIndex = prev.findIndex((field) => field.id === fieldId);
      if (sourceIndex === -1) return prev;
      const source = prev[sourceIndex];
      const duplicate: ContractPdfField = {
        ...source,
        id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        objectLabel: `${source.objectLabel?.trim() || getContractFieldDefaultObjectLabel(source, sourceIndex)} copy`,
        x: Math.min(source.x + 0.02, 1 - source.width),
        y: Math.min(source.y + 0.02, 1 - source.height),
        locked: false,
      };
      const next = [...prev];
      next.splice(sourceIndex + 1, 0, duplicate);
      setSelectedContractFieldId(duplicate.id);
      return next;
    });
  };

  const deleteContractField = (fieldId: string) => {
    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) => prev.filter((field) => field.id !== fieldId));
    setSelectedContractFieldId((current) => (current === fieldId ? null : current));
  };

  const clearContractFieldDragState = () => {
    setDraggedContractFieldId(null);
    setContractFieldDropTargetId(null);
  };

  const handleContractFieldDragStart = (
    event: ReactDragEvent<HTMLElement>,
    fieldId: string,
  ) => {
    if (editingContractObjectLabelId) {
      event.preventDefault();
      return;
    }

    setDraggedContractFieldId(fieldId);
    setContractFieldDropTargetId(fieldId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", fieldId);
  };

  const handleContractFieldDragOver = (
    event: ReactDragEvent<HTMLElement>,
    fieldId: string,
  ) => {
    if (!draggedContractFieldId || draggedContractFieldId === fieldId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (contractFieldDropTargetId !== fieldId) {
      setContractFieldDropTargetId(fieldId);
    }
  };

  const handleContractFieldDrop = (
    event: ReactDragEvent<HTMLElement>,
    targetFieldId: string,
  ) => {
    event.preventDefault();
    if (!draggedContractFieldId || draggedContractFieldId === targetFieldId) {
      clearContractFieldDragState();
      return;
    }

    recordContractFieldHistory();
    markContractDraftUnsaved();
    setContractTemplateFields((prev) =>
      reorderById(prev, draggedContractFieldId, targetFieldId),
    );
    clearContractFieldDragState();
  };

  useEffect(() => {
    if (!isContractDraftOpen || !contractDraftPdfUrl) return;

    const pdfStage = contractPdfStageRef.current;
    if (!pdfStage) return;

    const handleContractPdfZoom = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      event.stopPropagation();
      setContractPdfZoom((current) =>
        Math.min(
          300,
          Math.max(contractPdfFitZoomRef.current, current + (event.deltaY < 0 ? 10 : -10)),
        ),
      );
    };

    pdfStage.addEventListener("wheel", handleContractPdfZoom, { passive: false });
    return () => pdfStage.removeEventListener("wheel", handleContractPdfZoom);
  }, [contractDraftPdfUrl, isContractDraftOpen]);

  useEffect(() => {
    setContractPdfZoom(100);
    setContractPdfFitZoom(100);
    contractPdfFitZoomRef.current = 100;
  }, [contractDraftPdfUrl]);

  useEffect(() => {
    contractPdfZoomRef.current = contractPdfZoom;
  }, [contractPdfZoom]);

  useEffect(() => {
    if (!isContractDraftOpen || !contractDraftPdfUrl) return;
    const pdfStage = contractPdfStageRef.current;
    if (!pdfStage) return;

    let frame = 0;
    const updateFitZoom = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const page = pdfStage.querySelector<HTMLElement>("[data-contract-pdf-page='1']");
        if (!page || page.offsetHeight === 0) return;

        const previousFit = contractPdfFitZoomRef.current;
        const unscaledPageHeight = page.getBoundingClientRect().height / (contractPdfZoomRef.current / 100);
        const availableHeight = Math.max(1, pdfStage.clientHeight - 32);
        const nextFit = Math.min(100, Math.max(25, Math.floor((availableHeight / unscaledPageHeight) * 100)));
        if (nextFit === previousFit) return;

        contractPdfFitZoomRef.current = nextFit;
        setContractPdfFitZoom(nextFit);
        setContractPdfZoom((current) =>
          current === previousFit || current === 100 ? nextFit : Math.max(nextFit, current),
        );
      });
    };

    const resizeObserver = new ResizeObserver(updateFitZoom);
    const mutationObserver = new MutationObserver(updateFitZoom);
    resizeObserver.observe(pdfStage);
    mutationObserver.observe(pdfStage, { childList: true, subtree: true });
    updateFitZoom();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [contractDraftPdfUrl, isContractDraftOpen]);

  useEffect(() => {
    if (!isContractDraftOpen || !contractDraftPdfUrl) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      );
    };

    const handleContractObjectShortcut = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const usesCommandKey = event.ctrlKey || event.metaKey;
      const isEditingText = isEditableTarget(event.target);

      if ((key === "delete" || key === "backspace") && !isEditingText && selectedContractFieldId) {
        event.preventDefault();
        deleteContractField(selectedContractFieldId);
        return;
      }

      if (!isEditingText && usesCommandKey && key === "c" && selectedContractFieldId) {
        event.preventDefault();
        copyContractFieldToClipboard(selectedContractFieldId, "copy");
        return;
      }

      if (!isEditingText && usesCommandKey && key === "x" && selectedContractFieldId) {
        event.preventDefault();
        copyContractFieldToClipboard(selectedContractFieldId, "cut");
        return;
      }

      if (!isEditingText && usesCommandKey && key === "v" && contractObjectClipboard) {
        event.preventDefault();
        pasteContractFieldFromClipboard();
        return;
      }

      if (!isEditingText && usesCommandKey && key === "d") {
        if (!selectedContractFieldId) return;
        event.preventDefault();
        duplicateContractField(selectedContractFieldId);
        return;
      }

      if (!isEditingText && usesCommandKey && key === "l") {
        if (!selectedContractFieldId) return;
        event.preventDefault();
        toggleContractFieldLock(selectedContractFieldId);
      }
    };

    window.addEventListener("keydown", handleContractObjectShortcut);
    return () => window.removeEventListener("keydown", handleContractObjectShortcut);
  }, [
    contractDraftPdfUrl,
    contractObjectClipboard,
    contractTemplateActivePage,
    contractTemplateFields,
    contractTemplatePageCount,
    isContractDraftOpen,
    selectedContractFieldId,
  ]);

  useEffect(() => {
    if (!isContractDraftOpen || !contractDraftPdfUrl) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      );
    };

    const handleContractPdfArrowScroll = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (isEditableTarget(event.target)) return;

      const pdfStage = contractPdfStageRef.current;
      if (!pdfStage) return;

      event.preventDefault();
      pdfStage.scrollBy({
        top: event.key === "ArrowDown" ? 88 : -88,
        left: 0,
        behavior: "auto",
      });
    };

    window.addEventListener("keydown", handleContractPdfArrowScroll);
    return () => window.removeEventListener("keydown", handleContractPdfArrowScroll);
  }, [contractDraftPdfUrl, isContractDraftOpen]);

  const exportContractPdf = async (mode: ContractPdfExportMode) => {
    if (!contractDraftPdfUrl || contractPdfExporting) return;

    setContractPdfExporting(mode);
    setContractsNotice(mode === "print" ? "Preparing PDF for printing..." : "Preparing PDF download...");
    clearAdminError("contracts");

    try {
      const blob = await createFlattenedContractPdfBlob({
        pdfFile: contractTemplatePdfFile,
        pdfUrl: contractDraftPdfUrl,
        fields: contractTemplateFields,
      });
      const objectUrl = URL.createObjectURL(blob);
      const baseFileName =
        getContractPdfBaseName(contractDraftPdfLabel) ||
        contractTemplateName.trim() ||
        "contract";

      if (mode === "download") {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${baseFileName}-copy.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        setContractsNotice("PDF copy downloaded.");
        return;
      }

      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.src = objectUrl;
      frame.onload = () => {
        window.setTimeout(() => {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        }, 80);
      };
      document.body.appendChild(frame);
      window.setTimeout(() => {
        frame.remove();
        URL.revokeObjectURL(objectUrl);
      }, 60_000);
      setContractsNotice("Print dialog opened.");
    } catch (error) {
      showAdminError("contracts", error, "Failed to export the PDF copy.");
      setContractsNotice("");
    } finally {
      setContractPdfExporting(null);
    }
  };

  const saveContractTemplateDraft = async () => {
    const pdfFileName =
      contractTemplatePdfFile?.name || contractTemplateExistingPdf?.fileName || "";
    const fallbackName = getContractPdfBaseName(pdfFileName) || "Contract agreement";
    const templateName = contractTemplateName.trim() || fallbackName;
    const templateTitle = contractTemplateTitle.trim() || templateName;

    if (
      !token ||
      (!contractTemplatePdfFile && !contractTemplateExistingPdf) ||
      contractTemplateFields.length === 0 ||
      contractTemplateSaving
    ) {
      setContractsNotice("Add a PDF and at least one item before saving.");
      return null;
    }

    setContractTemplateSaving(true);
    setContractsNotice("");
    clearAdminError("contracts");
    try {
      const uploadedPdf = contractTemplatePdfFile
        ? await uploadAdminPdf(contractTemplatePdfFile)
        : null;
      const pdfDocument = uploadedPdf
        ? {
            filePath: uploadedPdf.filePath,
            fileUrl: uploadedPdf.proxyUrl,
            fileName: contractTemplatePdfFile?.name ?? uploadedPdf.filePath,
            mimeType: contractTemplatePdfFile?.type || "application/pdf",
          }
        : contractTemplateExistingPdf;

      if (!pdfDocument) {
        throw new Error("Contract PDF is required.");
      }
      const response = await requestJson<{ data: AdminContractTemplateApi }>(
        "/admin/contracts/templates",
        {
          method: "POST",
          body: JSON.stringify({
            name: templateName,
            title: templateTitle,
            pdfDocument: {
              filePath: pdfDocument.filePath,
              fileUrl: pdfDocument.fileUrl,
              fileName: pdfDocument.fileName,
              mimeType: pdfDocument.mimeType,
            },
            pageCount: contractTemplatePageCount,
            fields: contractTemplateFields,
          }),
        },
        token,
      );
      const nextTemplate = mapContractTemplate(response.data);
      invalidateAdminDataCache();
      setContractTemplates((prev) => [nextTemplate, ...prev]);
      setContractTemplateName(nextTemplate.name);
      setContractTemplateTitle(nextTemplate.title);
      setContractTemplatePdfFile(null);
      setContractTemplateExistingPdf(nextTemplate.pdfDocument);
      setContractTemplatePdfInputKey((prev) => prev + 1);
      setContractTemplatePageCount(nextTemplate.pageCount);
      setContractTemplateActivePage(1);
      setContractTemplateFields(nextTemplate.fields);
      setSelectedContractFieldId(null);
      setContractSelectedTemplateId(nextTemplate.id);
      setContractTitle(nextTemplate.title);
      setContractDraftCreatedId(null);
      setIsContractSendDropdownOpen(false);
      setContractsNotice("Contract layout saved.");
      return nextTemplate;
    } catch (error) {
      showAdminError("contracts", error, "Failed to save contract template.");
      return null;
    } finally {
      setContractTemplateSaving(false);
    }
  };

  const createContract = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resolvedTitle = contractTitle.trim() || contractTemplateTitle.trim();
    if (
      !token ||
      !contractRecipientName.trim() ||
      !resolvedTitle ||
      contractCreating
    ) {
      return;
    }

    setContractCreating(true);
    setContractsNotice("");
    clearAdminError("contracts");
    try {
      let templateId = contractSelectedTemplateId;
      if (!templateId) {
        const savedTemplate = await saveContractTemplateDraft();
        if (!savedTemplate) return;
        templateId = savedTemplate.id;
      }

      const response = await requestJson<{ data: AdminContractApi }>(
        "/admin/contracts",
        {
          method: "POST",
          body: JSON.stringify({
            templateId,
            title: resolvedTitle,
            recipientName: contractRecipientName.trim(),
            recipientEmail: contractRecipientEmail.trim() || undefined,
          }),
        },
        token,
      );
      const nextContract = mapContract(response.data);
      invalidateAdminDataCache();
      setContracts((prev) => [nextContract, ...prev]);
      setContractTemplates((prev) =>
        prev.map((template) =>
          template.id === nextContract.templateId
            ? { ...template, contractCount: template.contractCount + 1 }
            : template,
        ),
      );
      setContractRecipientName("");
      setContractRecipientEmail("");
      setContractSearch("");
      setContractDraftCreatedId(nextContract.id);
      setContractsNotice(`Contract link created for ${nextContract.recipientName}.`);
    } catch (error) {
      showAdminError("contracts", error, "Failed to create contract.");
    } finally {
      setContractCreating(false);
    }
  };

  const copyContractLink = async (contract: AdminContract) => {
    setContractsNotice("");
    try {
      await navigator.clipboard.writeText(contract.contractUrl);
      setContractsNotice(`Copied contract link for ${contract.recipientName}.`);
    } catch (error) {
      showAdminError(
        "contracts",
        error,
        "Failed to copy contract link. Open the link and copy it manually.",
      );
    }
  };

  const sendContractEmail = async (id: string) => {
    if (!token) return;
    setContractSendingId(id);
    setContractsNotice("");
    clearAdminError("contracts");
    try {
      const response = await requestJson<AdminContractEmailResponse>(
        `/admin/contracts/${id}/send`,
        { method: "POST" },
        token,
      );
      const nextContract = mapContract(response.data);
      invalidateAdminDataCache();
      setContracts((prev) =>
        prev.map((contract) => (contract.id === id ? nextContract : contract)),
      );
      if (response.emailDelivery?.status === "failed") {
        setContractsNotice(
          [
            `Contract link is ready for ${nextContract.recipientName}, but the email was not sent.`,
            response.emailDelivery.message,
          ]
            .filter(Boolean)
            .join(" "),
        );
      } else {
        setContractsNotice(`Contract email sent to ${nextContract.recipientEmail}.`);
      }
    } catch (error) {
      showAdminError("contracts", error, "Failed to send contract email.");
    } finally {
      setContractSendingId((prev) => (prev === id ? null : prev));
    }
  };

  const deleteContract = async (id: string) => {
    if (!token) return;
    setContractDeletingId(id);
    setContractsNotice("");
    clearAdminError("contracts");
    try {
      const existingContract = contracts.find((contract) => contract.id === id);
      await requestJson(`/admin/contracts/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setContracts((prev) => prev.filter((contract) => contract.id !== id));
      if (existingContract?.templateId) {
        setContractTemplates((prev) =>
          prev.map((template) =>
            template.id === existingContract.templateId
              ? { ...template, contractCount: Math.max(template.contractCount - 1, 0) }
              : template,
          ),
        );
      }
      setContractsNotice("Contract deleted.");
    } catch (error) {
      showAdminError("contracts", error, "Failed to delete contract.");
    } finally {
      setContractDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const deleteContractTemplate = async (id: string) => {
    if (!token) return;
    setContractTemplateDeletingId(id);
    setContractsNotice("");
    clearAdminError("contracts");
    try {
      await requestJson(`/admin/contracts/templates/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setContractTemplates((prev) => prev.filter((template) => template.id !== id));
      setContracts((prev) =>
        prev.map((contract) =>
          contract.templateId === id ? { ...contract, templateId: null, template: null } : contract,
        ),
      );
      if (contractSelectedTemplateId === id) {
        setContractSelectedTemplateId("");
        setContractTitle("");
      }
      setContractsNotice("Contract template deleted.");
    } catch (error) {
      showAdminError("contracts", error, "Failed to delete contract template.");
    } finally {
      setContractTemplateDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const saveContacts = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setContactsSaving(true);
    setContactsNotice("");
    clearAdminError("contacts");
    try {
      const response = await requestJson<{ data: AdminContactConfig }>(
        "/admin/contacts",
        {
          method: "PUT",
          body: JSON.stringify({
            email: contactEmail.trim() || undefined,
            phone: contactPhone.trim() || undefined,
            instagramUrl: normalizeUrlInput(contactInstagramUrl) || undefined,
            whatsappUrl: normalizeUrlInput(contactWhatsappUrl) || undefined,
            telegramUrl: normalizeUrlInput(contactTelegramUrl) || undefined,
            linkedinUrl: normalizeUrlInput(contactLinkedinUrl) || undefined,
            showEmail: showContactEmail,
            showPhone: showContactPhone,
            showInstagram: showContactInstagram,
            showWhatsapp: showContactWhatsapp,
            showTelegram: showContactTelegram,
            showLinkedin: showContactLinkedin,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setContactConfig(response.data);
      setContactEmail(response.data.email ?? "");
      setContactPhone(response.data.phone ?? "");
      setContactInstagramUrl(response.data.instagramUrl ?? "");
      setContactWhatsappUrl(response.data.whatsappUrl ?? "");
      setContactTelegramUrl(response.data.telegramUrl ?? "");
      setContactLinkedinUrl(response.data.linkedinUrl ?? "");
      setShowContactEmail(response.data.showEmail);
      setShowContactPhone(response.data.showPhone);
      setShowContactInstagram(response.data.showInstagram);
      setShowContactWhatsapp(response.data.showWhatsapp);
      setShowContactTelegram(response.data.showTelegram);
      setShowContactLinkedin(response.data.showLinkedin);
      setContactsNotice("Contacts updated successfully.");
    } catch (error) {
      showAdminError("contacts", error, "Failed to save contacts.");
    } finally {
      setContactsSaving(false);
    }
  };

  const uploadCvAsset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (!cvAtsFile || !cvVisualFile) {
      showAdminError("cv", "Upload both ATS Friendly and Visual Friendly CV documents.");
      return;
    }
    if (!isAllowedCvFile(cvAtsFile) || !isAllowedCvFile(cvVisualFile)) {
      showAdminError("cv", "CV file must be a PDF or DOCX document.");
      return;
    }

    setCvSaving(true);
    setCvNotice("");
    clearAdminError("cv");

    try {
      const uploadDocument = async (file: File) => {
        const contentType = getCvContentType(file);
        const uploadedFile = await uploadAdminFile(file, "files", contentType);

        return {
          filePath: uploadedFile.filePath,
          fileUrl: uploadedFile.proxyUrl,
          fileName: file.name,
          mimeType: contentType,
        };
      };

      const [atsDocument, visualDocument] = await Promise.all([
        uploadDocument(cvAtsFile),
        uploadDocument(cvVisualFile),
      ]);

      const saveResponse = await requestJson<{
        data: AdminCvAsset;
      }>(
        "/admin/cv",
        {
          method: "POST",
          body: JSON.stringify({
            atsDocument,
            visualDocument,
            isActive: cvAssets.length === 0,
          }),
        },
        token,
      );

      invalidateAdminDataCache();
      setCvAssets((prev) => sortCvAssets([saveResponse.data, ...prev]));
      setCvAtsFile(null);
      setCvVisualFile(null);
      setCvAtsInputKey((prev) => prev + 1);
      setCvVisualInputKey((prev) => prev + 1);
      setIsCvDialogOpen(false);
      setCvNotice(
        saveResponse.data.isActive
          ? "CV item submitted and set as active."
          : "CV item submitted successfully.",
      );
    } catch (error) {
      showAdminError("cv", error, "Failed to submit CV.");
    } finally {
      setCvSaving(false);
    }
  };

  const setActiveCvAsset = async (id: string) => {
    if (!token) return;
    setCvActivatingId(id);
    setCvNotice("");
    clearAdminError("cv");

    try {
      const response = await requestJson<{ data: AdminCvAsset }>(
        `/admin/cv/${id}/active`,
        { method: "PATCH" },
        token,
      );
      invalidateAdminDataCache();
      const statusUpdatedAt = response.data.statusUpdatedAt ?? new Date().toISOString();
      setCvAssets((prev) =>
        sortCvAssets(
          prev.map((asset) => ({
            ...asset,
            isActive: asset.id === response.data.id,
            statusUpdatedAt:
              asset.id === response.data.id || asset.isActive
                ? statusUpdatedAt
                : asset.statusUpdatedAt,
          })),
        ),
      );
      setCvNotice(`${response.data.fileName} is now the active CV.`);
    } catch (error) {
      showAdminError("cv", error, "Failed to activate CV.");
    } finally {
      setCvActivatingId((prev) => (prev === id ? null : prev));
    }
  };

  const deleteCvAsset = async (id: string) => {
    if (!token) return;
    setCvDeletingId(id);
    setCvNotice("");
    clearAdminError("cv");

    try {
      await requestJson(`/admin/cv/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setCvAssets((prev) => {
        const remaining = prev.filter((asset) => asset.id !== id);
        if (remaining.some((asset) => asset.isActive)) return sortCvAssets(remaining);
        if (remaining.length === 0) return [];
        const [nextActive, ...rest] = remaining;
        return sortCvAssets([{ ...nextActive, isActive: true }, ...rest]);
      });
      setCvNotice("CV deleted.");
    } catch (error) {
      showAdminError("cv", error, "Failed to delete CV.");
    } finally {
      setCvDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const deleteProject = async (id: string) => {
    if (!token) return;
    clearAdminError("projects");
    setProjectDeletingId(id);
    try {
      await requestJson(`/admin/projects/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        projects: prev.projects.filter((item) => item.id !== id),
      }));
      setStats((prev) => ({ ...prev, projects: Math.max(prev.projects - 1, 0) }));
    } catch (error) {
      showAdminError("projects", error, "Failed to delete project.");
    } finally {
      setProjectDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const updateProjectStatus = async (id: string, nextStatus: ProjectStatus) => {
    if (!token) return;
    clearAdminError("projects");
    setProjectUpdatingId(id);
    try {
      const response = await requestJson<{
        data: AdminProjectApi;
      }>(
        `/admin/projects/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
        token,
      );
      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        projects: prev.projects.map((item) =>
          item.id === id ? mapProject(response.data) : item,
        ),
      }));
    } catch (error) {
      showAdminError("projects", error, "Failed to update project status.");
    } finally {
      setProjectUpdatingId((prev) => (prev === id ? null : prev));
    }
  };

  const updateProjectDisplayFlag = async (
    id: string,
    field: "isFeatured" | "isPinned",
    value: boolean,
  ) => {
    if (!token) return;
    clearAdminError("projects");
    setProjectUpdatingId(id);
    try {
      const response = await requestJson<{
        data: AdminProjectApi;
      }>(
        `/admin/projects/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            [field]: value,
          }),
        },
        token,
      );
      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        projects: prev.projects.map((item) =>
          item.id === id ? mapProject(response.data) : item,
        ),
      }));
    } catch (error) {
      showAdminError(
        "projects",
        error,
        field === "isFeatured"
          ? "Failed to update featured label."
          : "Failed to update pinned label.",
      );
    } finally {
      setProjectUpdatingId((prev) => (prev === id ? null : prev));
    }
  };

  const deleteService = async (id: string) => {
    if (!token) return;
    clearAdminError("services");
    try {
      await requestJson(`/admin/services/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        services: prev.services.filter((item) => item.id !== id),
      }));
      setStats((prev) => ({ ...prev, services: Math.max(prev.services - 1, 0) }));
    } catch (error) {
      showAdminError("services", error, "Failed to delete service.");
    }
  };

  const deleteBanner = async (id: string) => {
    if (!token) return;
    clearAdminError("banners");
    setIsBannerReordering(true);
    try {
      await requestJson(`/admin/banners/${id}`, { method: "DELETE" }, token);
      const remainingBanners = content.banners.filter((item) => item.id !== id);
      const normalizedBanners = await persistBannerOrder(remainingBanners);
      setContent((prev) => ({
        ...prev,
        banners: normalizedBanners,
      }));
    } catch (error) {
      showAdminError("banners", error, "Failed to delete banner.");
      await fetchAdminData(token, activeUser?.id);
    } finally {
      setIsBannerReordering(false);
    }
  };

  const deleteWorkExperience = async (id: string) => {
    if (!token) return;
    clearAdminError("workExperiences");
    try {
      await requestJson(`/admin/work-experiences/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        workExperiences: prev.workExperiences.filter((item) => item.id !== id),
      }));
    } catch (error) {
      showAdminError("workExperiences", error, "Failed to delete work experience.");
    }
  };

  const deleteCertificate = async (id: string) => {
    if (!token) return;
    clearAdminError("certificates");
    try {
      await requestJson(`/admin/certificates/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        certificates: prev.certificates.filter((item) => item.id !== id),
      }));
      setStats((prev) => ({ ...prev, certificates: Math.max(prev.certificates - 1, 0) }));
    } catch (error) {
      showAdminError("certificates", error, "Failed to delete certificate.");
    }
  };

  const deleteClient = async (id: string) => {
    if (!token) return;
    setClientDeletingId(id);
    setClientsNotice("");
    clearAdminError("clients");
    try {
      await requestJson(`/admin/clients/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setClients((prev) => prev.filter((client) => client.id !== id));
      setClientsNotice("Client deleted.");
    } catch (error) {
      showAdminError("clients", error, "Failed to delete client.");
    } finally {
      setClientDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const openReviewEditor = (review: AdminReview) => {
    setEditingReview(review);
    setReviewEditName(review.client);
    setReviewEditRole(review.role ?? "");
    setReviewEditRating(review.rating);
    setReviewEditFeedback(review.excerpt);
    setReviewEditDetail(review.detail ?? "");
  };

  const saveReviewEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editingReview) return;

    setReviewSavingId(editingReview.id);
    clearAdminError("reviews");
    try {
      const response = await requestJson<{ data: AdminReviewApi }>(
        `/admin/reviews/${editingReview.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: reviewEditName.trim(),
            role: reviewEditRole.trim() || undefined,
            rating: reviewEditRating,
            feedback: reviewEditFeedback.trim(),
            detail: reviewEditDetail.trim() || undefined,
          }),
        },
        token,
      );
      invalidateAdminDataCache();
      const nextReview = mapReview(response.data);
      setContent((prev) => ({
        ...prev,
        reviews: prev.reviews.map((review) =>
          review.id === nextReview.id ? nextReview : review,
        ),
      }));
      setEditingReview(null);
    } catch (error) {
      showAdminError("reviews", error, "Failed to save review.");
    } finally {
      setReviewSavingId(null);
    }
  };

  const approveReview = async (id: string) => {
    if (!token) return;
    setReviewApprovingId(id);
    clearAdminError("reviews");
    try {
      const response = await requestJson<{ data: AdminReviewApi }>(
        `/admin/reviews/${id}/approve`,
        { method: "PATCH" },
        token,
      );
      invalidateAdminDataCache();
      const nextReview = mapReview(response.data);
      setContent((prev) => ({
        ...prev,
        reviews: prev.reviews.map((review) =>
          review.id === nextReview.id ? nextReview : review,
        ),
      }));
    } catch (error) {
      showAdminError("reviews", error, "Failed to approve review.");
    } finally {
      setReviewApprovingId((prev) => (prev === id ? null : prev));
    }
  };

  const deleteReview = async (id: string) => {
    if (!token) return;
    setReviewDeletingId(id);
    clearAdminError("reviews");
    try {
      await requestJson(`/admin/reviews/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setContent((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((item) => item.id !== id),
      }));
      setStats((prev) => ({ ...prev, reviews: Math.max(prev.reviews - 1, 0) }));
    } catch (error) {
      showAdminError("reviews", error, "Failed to delete review.");
    } finally {
      setReviewDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const approvePendingAdmin = async (id: string) => {
    if (!token) return;
    setRequestProcessingId(id);
    clearAdminError("requests");
    setRequestsNotice("");
    try {
      await requestJson(`/admin/users/${id}/approve`, { method: "PATCH" }, token);
      invalidateAdminDataCache();
      setPendingAdmins((prev) => prev.filter((user) => user.id !== id));
      setRequestsNotice("Account approved.");
    } catch (error) {
      showAdminError("requests", error, "Failed to approve account.");
    } finally {
      setRequestProcessingId((prev) => (prev === id ? null : prev));
    }
  };

  const rejectPendingAdmin = async (id: string) => {
    if (!token) return;
    setRequestProcessingId(id);
    clearAdminError("requests");
    setRequestsNotice("");
    try {
      await requestJson(`/admin/users/${id}/reject`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setPendingAdmins((prev) => prev.filter((user) => user.id !== id));
      setRequestsNotice("Account request rejected.");
    } catch (error) {
      showAdminError("requests", error, "Failed to reject account.");
    } finally {
      setRequestProcessingId((prev) => (prev === id ? null : prev));
    }
  };

  const resolveErrorLog = async (id: string) => {
    if (!token) return;
    const removedLog = errorLogs.find((log) => log.id === id);
    setErrorLogDeletingId(id);
    clearAdminError("errorLogs");
    try {
      await requestJson(`/admin/error-logs/${id}`, { method: "DELETE" }, token);
      invalidateAdminDataCache();
      setErrorLogs((prev) => prev.filter((log) => log.id !== id));
      setErrorLogStats((prev) => ({
        ...prev,
        openErrors: Math.max(prev.openErrors - 1, 0),
        frontendErrors:
          removedLog?.source === "frontend"
            ? Math.max(prev.frontendErrors - 1, 0)
            : prev.frontendErrors,
        backendErrors:
          removedLog?.source === "backend"
            ? Math.max(prev.backendErrors - 1, 0)
            : prev.backendErrors,
        latestErrorAt:
          errorLogs.filter((log) => log.id !== id)[0]?.createdAt ?? null,
      }));
      if (removedLog) {
        const removedDay = new Date(removedLog.createdAt).toISOString().slice(0, 10);
        setErrorGraph((prev) =>
          prev.map((point) =>
            point.date === removedDay
              ? {
                  ...point,
                  total: Math.max(point.total - 1, 0),
                  frontend:
                    removedLog.source === "frontend"
                      ? Math.max(point.frontend - 1, 0)
                      : point.frontend,
                  backend:
                    removedLog.source === "backend"
                      ? Math.max(point.backend - 1, 0)
                      : point.backend,
                }
              : point,
          ),
        );
      }
    } catch (error) {
      showAdminError("errorLogs", error, "Failed to resolve error log.");
    } finally {
      setErrorLogDeletingId((prev) => (prev === id ? null : prev));
    }
  };

  const contactChannels = [
    {
      label: "Email",
      value: contactEmail.trim(),
      href: contactEmail.trim() ? `mailto:${contactEmail.trim()}` : "",
      icon: Mail,
      tone: "Primary inbox",
      visible: showContactEmail,
      onToggle: () => setShowContactEmail((prev) => !prev),
    },
    {
      label: "Phone",
      value: contactPhone.trim(),
      href: contactPhone.trim() ? `tel:${contactPhone.trim()}` : "",
      icon: PhoneCall,
      tone: "Direct line",
      visible: showContactPhone,
      onToggle: () => setShowContactPhone((prev) => !prev),
    },
    {
      label: "Instagram",
      value: contactInstagramUrl.trim(),
      href: normalizeUrlInput(contactInstagramUrl),
      icon: Instagram,
      logo: instagramLogo,
      tone: "Social profile",
      visible: showContactInstagram,
      onToggle: () => setShowContactInstagram((prev) => !prev),
    },
    {
      label: "WhatsApp",
      value: contactWhatsappUrl.trim(),
      href: normalizeUrlInput(contactWhatsappUrl),
      icon: MessageSquare,
      logo: whatsappLogo,
      tone: "Chat channel",
      visible: showContactWhatsapp,
      onToggle: () => setShowContactWhatsapp((prev) => !prev),
    },
    {
      label: "Telegram",
      value: contactTelegramUrl.trim(),
      href: normalizeUrlInput(contactTelegramUrl),
      icon: Send,
      logo: telegramLogo,
      tone: "Messaging link",
      visible: showContactTelegram,
      onToggle: () => setShowContactTelegram((prev) => !prev),
    },
    {
      label: "LinkedIn",
      value: contactLinkedinUrl.trim(),
      href: normalizeUrlInput(contactLinkedinUrl),
      icon: Linkedin,
      tone: "Professional profile",
      visible: showContactLinkedin,
      onToggle: () => setShowContactLinkedin((prev) => !prev),
    },
  ];
  const configuredContactCount = contactChannels.filter(
    (channel) => channel.value && channel.visible,
  ).length;
  const sessionExpiredDialog = isSessionExpiredDialogOpen ? (
    <div className={styles.adminDialog} role="dialog" aria-modal="true" aria-labelledby="session-expired-title">
      <button
        type="button"
        className={styles.adminDialog__backdrop}
        aria-label="Dismiss session expired dialog"
        onClick={dismissSessionExpiredDialog}
      />
      <div className={styles.adminDialog__panel}>
        <div className={styles.adminDialog__header}>
          <div>
            <h3 id="session-expired-title">Session Expired</h3>
            <p>You may need to re-login to continue.</p>
          </div>
          <button
            type="button"
            className={styles.adminDialog__close}
            aria-label="Dismiss session expired dialog"
            title="Dismiss"
            onClick={dismissSessionExpiredDialog}
          >
            <X size={16} />
          </button>
        </div>
        <div className={styles.adminDialog__actions}>
          <button
            type="button"
            className={styles.projectManager__createButton}
            onClick={dismissSessionExpiredDialog}
          >
            Continue to Login
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (!hydrated) {
    return (
      <div className={styles.admin}>
        <div className={styles.admin__loading}>Loading Writly...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={`${styles.admin} ${theme === "dark" ? styles["admin--dark"] : ""}`}>
        {sessionExpiredDialog}
        <main className={styles.auth}>
          {authError && (
            <div className={styles.authErrorDialog__backdrop} role="presentation">
              <section
                className={styles.authErrorDialog}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="auth-error-title"
                aria-describedby="auth-error-message"
              >
                <span className={styles.authErrorDialog__icon} aria-hidden="true">
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <h2 id="auth-error-title">We couldn&apos;t continue</h2>
                  <p id="auth-error-message">{authError}</p>
                </div>
                <button type="button" onClick={() => setAuthError("")} autoFocus>
                  Try again
                </button>
              </section>
            </div>
          )}
          <section className={styles.auth__story} aria-label="About Writly">
            <a href="/" className={styles.auth__storyBrand}>
              <span className={styles.auth__logoMark}><FileText size={24} /></span>
              <span>Writly</span>
            </a>
            <div className={styles.auth__storyContent}>
              <span className={styles.auth__eyebrow}>Contracts, without the busywork</span>
              <h1>From first draft to final signature.</h1>
              <p>
                Create polished contracts, collect signatures, and keep every agreement
                moving from one focused workspace.
              </p>
              <div className={styles.auth__proof}>
                <span><BadgeCheck size={17} /> Secure by design</span>
                <span><BadgeCheck size={17} /> Built for clear workflows</span>
              </div>
            </div>
            <p className={styles.auth__copyright}>© {new Date().getFullYear()} Writly</p>
          </section>
          <div className={styles.auth__panel}>
            <div className={styles.auth__brand}>
              <div>
                <span className={styles.auth__eyebrow}>
                  {authMode === "signup" ? "Create your workspace" : "Welcome back"}
                </span>
                <h1>
                  {authMode === "signup"
                    ? "Start with Writly"
                    : authMode === "forgot"
                      ? "Reset your password"
                      : authMode === "reset"
                        ? "Choose a new password"
                        : "Sign in to Writly"}
                </h1>
                <p>
                  {authMode === "signup"
                    ? "Create an account to draft, send, and manage contracts."
                    : "Pick up where you left off."}
                </p>
              </div>
            </div>
            {(authMode === "login" || authMode === "signup") && (
              <div className={styles.auth__modeRow}>
                <button
                  type="button"
                  className={`${styles.auth__modeButton} ${
                    authMode === "login" ? styles["auth__modeButton--active"] : ""
                  }`}
                  disabled={isLoginSubmitting || isSignupSubmitting}
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setAuthNotice("");
                    resetAuthFields();
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`${styles.auth__modeButton} ${
                    authMode === "signup" ? styles["auth__modeButton--active"] : ""
                  }`}
                  disabled={isLoginSubmitting || isSignupSubmitting}
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError("");
                    setAuthNotice("");
                    resetAuthFields();
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}

            {(authMode === "login" || authMode === "signup") && (
              <>
                {import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ? (
                  <div
                    ref={googleButtonRef}
                    className={`${styles.auth__google} ${isGoogleSubmitting ? styles["auth__google--loading"] : ""}`}
                    aria-label={`${authMode === "signup" ? "Sign up" : "Sign in"} with Google`}
                  />
                ) : (
                  <p className={styles.auth__googleSetup}>Google sign-in needs configuration.</p>
                )}
                <div className={styles.auth__divider}><span>or continue with email</span></div>
              </>
            )}

            {(authMode === "login" || authMode === "signup") && (
              <form
                className={`${styles.auth__form} ${
                  authMode === "signup" ? styles["auth__form--signup"] : ""
                }`}
                onSubmit={authMode === "login" ? handleLogin : handleSignup}
              >
                {authMode === "signup" && (
                  <label className={styles.auth__field}>
                    <span>Full Name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="ex. Juan Dela Cruz"
                      disabled={isLoginSubmitting || isSignupSubmitting}
                      required
                    />
                  </label>
                )}
                <label className={styles.auth__field}>
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@email.com"
                    disabled={isLoginSubmitting || isSignupSubmitting}
                    required
                  />
                </label>
                <label className={styles.auth__field}>
                  <span>Password</span>
                  <div className={styles.auth__passwordWrap}>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Minimum 8 characters"
                      disabled={isLoginSubmitting || isSignupSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className={styles.auth__passwordToggle}
                      disabled={isLoginSubmitting || isSignupSubmitting}
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                {authMode === "signup" && (
                  <label className={styles.auth__field}>
                    <span>Confirm Password</span>
                    <div className={styles.auth__passwordWrap}>
                      <input
                        type={showSignupConfirmPassword ? "text" : "password"}
                        value={signupConfirmPassword}
                        onChange={(event) => setSignupConfirmPassword(event.target.value)}
                        placeholder="Re-enter password"
                        disabled={isLoginSubmitting || isSignupSubmitting}
                        required
                      />
                      <button
                        type="button"
                        className={styles.auth__passwordToggle}
                        disabled={isLoginSubmitting || isSignupSubmitting}
                        onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                        aria-label={
                          showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"
                        }
                      >
                        {showSignupConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </label>
                )}
                {authNotice && <p className={styles.auth__notice}>{authNotice}</p>}
                <button
                  type="submit"
                  className={styles.auth__submit}
                  disabled={isLoginSubmitting || isSignupSubmitting || isGoogleSubmitting}
                >
                  {authMode === "login" && isLoginSubmitting ? (
                    <>
                      <span className={styles.auth__submitSpinner} aria-hidden="true" />
                      Logging in...
                    </>
                  ) : authMode === "signup" && isSignupSubmitting ? (
                    <>
                      <span className={styles.auth__submitSpinner} aria-hidden="true" />
                      Creating account...
                    </>
                  ) : authMode === "login" ? (
                    "Sign in"
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            )}

            {authMode === "forgot" && (
              <form className={styles.auth__form} onSubmit={handleForgotPassword}>
                <p className={styles.auth__muted}>
                  Enter your admin email and we&apos;ll send you a reset link.
                </p>
                <label className={styles.auth__field}>
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@email.com"
                    required
                  />
                </label>
                {authNotice && <p className={styles.auth__notice}>{authNotice}</p>}
                <button type="submit" className={styles.auth__submit}>
                  Send Reset Link
                </button>
                <button
                  type="button"
                  className={styles.auth__linkButton}
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setAuthNotice("");
                    setSignupConfirmPassword("");
                  }}
                >
                  Back to login
                </button>
              </form>
            )}

            {authMode === "reset" && (
              <form className={styles.auth__form} onSubmit={handleResetPassword}>
                <p className={styles.auth__muted}>
                  Set a new password for your admin account.
                </p>
                <label className={styles.auth__field}>
                  <span>New Password</span>
                  <div className={styles.auth__passwordWrap}>
                    <input
                      type={showResetPassword ? "text" : "password"}
                      value={nextPassword}
                      onChange={(event) => setNextPassword(event.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                    <button
                      type="button"
                      className={styles.auth__passwordToggle}
                      onClick={() => setShowResetPassword((prev) => !prev)}
                      aria-label={showResetPassword ? "Hide new password" : "Show new password"}
                    >
                      {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label className={styles.auth__field}>
                  <span>Confirm Password</span>
                  <div className={styles.auth__passwordWrap}>
                    <input
                      type={showResetConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.auth__passwordToggle}
                      onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                      aria-label={
                        showResetConfirmPassword ? "Hide confirm password" : "Show confirm password"
                      }
                    >
                      {showResetConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                {authNotice && <p className={styles.auth__notice}>{authNotice}</p>}
                <button type="submit" className={styles.auth__submit}>
                  Reset Password
                </button>
                <button
                  type="button"
                  className={styles.auth__linkButton}
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setAuthNotice("");
                    setResetToken("");
                    setSignupConfirmPassword("");
                  }}
                >
                  Back to login
                </button>
              </form>
            )}

          </div>
        </main>
      </div>
    );
  }

  if (isContractDraftOpen) {
    const contractDraftStatusPageCount = Math.max(1, contractTemplatePageCount);
    const contractDraftStatusActivePage = Math.min(
      Math.max(contractTemplateActivePage, 1),
      contractDraftStatusPageCount,
    );

    return (
      <div className={`${styles.admin} ${theme === "dark" ? styles["admin--dark"] : ""}`}>
        {sessionExpiredDialog}
        {adminError?.scope === "global" && (
          <div className={styles.adminErrorOverlay}>
            <AdminErrorPopup
              error={adminError}
              placement="global"
              onClose={() => clearAdminError("global")}
            />
          </div>
        )}
        <main className={styles.contractDraft}>
          {contentBusyState && <AdminBusyOverlay {...contentBusyState} />}
          {renderScopedError("contracts")}

          <header className={styles.contractDraft__topbar}>
            <button
              type="button"
              className={styles.contractDraft__backButton}
              onClick={closeContractDraft}
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <div className={styles.contractDraft__title}>
              <span>Draft</span>
              <div className={styles.contractDraft__titleRow}>
                <h1>{contractDraftPdfLabel}</h1>
                {contractDraftPdfUrl && (
                  <button
                    type="button"
                    className={styles.contractDraft__clearPdfButton}
                    aria-label="Remove selected PDF"
                    title="Remove selected PDF"
                    onClick={clearContractDraftPdf}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            {contractDraftPdfUrl && (
              <div className={styles.contractDraft__objectToolbar} aria-label="Add PDF objects">
                <div className={styles.contractDraft__historyControls} aria-label="Object history">
                  <button
                    type="button"
                    className={styles.contractDraft__historyButton}
                    aria-label="Undo object change"
                    title="Undo"
                    disabled={!canUndoContractFieldChange}
                    onClick={undoContractFieldChange}
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.contractDraft__historyButton}
                    aria-label="Reset all objects"
                    title="Reset objects"
                    disabled={!canResetContractFieldObjects}
                    onClick={resetContractFieldObjects}
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.contractDraft__historyButton}
                    aria-label="Redo object change"
                    title="Redo"
                    disabled={!canRedoContractFieldChange}
                    onClick={redoContractFieldChange}
                  >
                    <Redo2 size={15} />
                  </button>
                </div>
                <span className={styles.contractDraft__objectToolbarDivider} aria-hidden="true" />
                <button
                  type="button"
                  draggable
                  className={styles.contractDraft__objectButton}
                  onDragStart={(event) => startContractPaletteDrag(event, "text")}
                  onClick={() => {
                    stopContractFreehandTools();
                    createContractField("text");
                  }}
                >
                  <Type size={15} />
                  Text
                </button>
                <button
                  type="button"
                  draggable
                  className={styles.contractDraft__objectButton}
                  onDragStart={(event) => startContractPaletteDrag(event, "textbox")}
                  onClick={() => {
                    stopContractFreehandTools();
                    createContractField("textbox");
                  }}
                >
                  <MessageSquare size={15} />
                  Textbox
                </button>
                <button
                  type="button"
                  draggable
                  className={styles.contractDraft__objectButton}
                  onDragStart={(event) => startContractPaletteDrag(event, "signature")}
                  onClick={() => {
                    stopContractFreehandTools();
                    createContractField("signature");
                  }}
                >
                  <Pencil size={15} />
                  Signature
                </button>
                <button
                  type="button"
                  draggable
                  className={styles.contractDraft__objectButton}
                  onDragStart={(event) => startContractPaletteDrag(event, "image")}
                  onClick={() => {
                    stopContractFreehandTools();
                    createContractField("image");
                  }}
                >
                  <ImagePlus size={15} />
                  Image
                </button>
                <div ref={contractDrawToolRef} className={styles.contractDraft__drawTool}>
                  <button
                    type="button"
                    className={`${styles.contractDraft__objectButton} ${
                      isContractDrawModeActive
                        ? styles["contractDraft__objectButton--active"]
                        : ""
                    }`}
                    aria-expanded={isContractDrawMenuOpen}
                    aria-pressed={isContractDrawModeActive}
                    onClick={activateContractDrawTool}
                  >
                    <Brush size={15} />
                    Draw
                  </button>
                  {isContractDrawMenuOpen && (
                    <div
                      className={styles.contractDraft__drawMenu}
                      data-contract-draw-menu="true"
                      onPointerEnter={() => setIsContractDrawMenuInteracting(true)}
                      onPointerLeave={() => setIsContractDrawMenuInteracting(false)}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setIsContractDrawMenuInteracting(true);
                      }}
                      onPointerMove={(event) => event.stopPropagation()}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        setIsContractDrawMenuInteracting(true);
                      }}
                      onPointerCancel={(event) => {
                        event.stopPropagation();
                        setIsContractDrawMenuInteracting(true);
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className={styles.contractDraft__drawMenuSection}>
                        <span>Colors</span>
                        <div className={styles.contractDraft__drawColorGrid}>
                          {contractDrawColorOptions.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={`${styles.contractDraft__drawColorButton} ${
                                contractDrawColor === color
                                  ? styles["contractDraft__drawColorButton--active"]
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                              aria-label={`Use ${color}`}
                              title={color}
                              onClick={() => {
                                setContractDrawColor(color);
                                setIsContractDrawModeActive(true);
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className={styles.contractDraft__drawMenuSection}>
                        <span>Thickness</span>
                        <div className={styles.contractDraft__drawThicknessControl}>
                          <input
                            className={styles.contractDraft__drawThicknessSlider}
                            type="range"
                            min={1}
                            max={16}
                            step={1}
                            value={contractDrawStrokeWidth}
                            aria-label="Pen thickness"
                            onPointerDown={(event) => {
                              event.stopPropagation();
                              setIsContractDrawMenuInteracting(true);
                              event.currentTarget.setPointerCapture(event.pointerId);
                            }}
                            onPointerMove={(event) => event.stopPropagation()}
                            onPointerUp={(event) => {
                              event.stopPropagation();
                              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                              }
                              setIsContractDrawMenuInteracting(true);
                            }}
                            onPointerCancel={(event) => {
                              event.stopPropagation();
                              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                              }
                              setIsContractDrawMenuInteracting(true);
                            }}
                            onChange={(event) => {
                              setContractDrawStrokeWidth(Number(event.target.value));
                              setIsContractDrawModeActive(true);
                            }}
                          />
                          <output>{contractDrawStrokeWidth}px</output>
                        </div>
                        <div className={styles.contractDraft__drawThicknessPreview}>
                          <span className={styles.contractDraft__drawPreviewDotWrap}>
                            <span
                              style={{
                                width: contractDrawStrokeWidth,
                                height: contractDrawStrokeWidth,
                              }}
                            />
                          </span>
                          Preview
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.contractDraft__drawModeToggle}
                        onClick={() => {
                          if (isContractDrawModeActive) {
                            setIsContractDrawModeActive(false);
                            setIsContractDrawMenuOpen(false);
                            setIsContractDrawMenuInteracting(false);
                            return;
                          }
                          setIsContractDrawModeActive(true);
                        }}
                      >
                        {isContractDrawModeActive ? "Stop drawing" : "Start drawing"}
                      </button>
                    </div>
                  )}
                </div>
                <div ref={contractEraserToolRef} className={styles.contractDraft__drawTool}>
                  <button
                    type="button"
                    className={`${styles.contractDraft__objectButton} ${
                      isContractEraserModeActive
                        ? styles["contractDraft__objectButton--active"]
                        : ""
                    }`}
                    aria-expanded={isContractEraserMenuOpen}
                    aria-pressed={isContractEraserModeActive}
                    onClick={activateContractEraserTool}
                  >
                    <Eraser size={15} />
                    Eraser
                  </button>
                  {isContractEraserMenuOpen && (
                    <div
                      className={styles.contractDraft__drawMenu}
                      data-contract-draw-menu="true"
                      onPointerEnter={() => setIsContractEraserMenuInteracting(true)}
                      onPointerLeave={() => setIsContractEraserMenuInteracting(false)}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setIsContractEraserMenuInteracting(true);
                      }}
                      onPointerMove={(event) => event.stopPropagation()}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        setIsContractEraserMenuInteracting(true);
                      }}
                      onPointerCancel={(event) => {
                        event.stopPropagation();
                        setIsContractEraserMenuInteracting(true);
                      }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className={styles.contractDraft__drawMenuSection}>
                        <span>Thickness</span>
                        <div className={styles.contractDraft__drawThicknessControl}>
                          <input
                            className={styles.contractDraft__drawThicknessSlider}
                            type="range"
                            min={1}
                            max={16}
                            step={1}
                            value={contractDrawStrokeWidth}
                            aria-label="Eraser thickness"
                            onPointerDown={(event) => {
                              event.stopPropagation();
                              setIsContractEraserMenuInteracting(true);
                              event.currentTarget.setPointerCapture(event.pointerId);
                            }}
                            onPointerMove={(event) => event.stopPropagation()}
                            onPointerUp={(event) => {
                              event.stopPropagation();
                              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                              }
                              setIsContractEraserMenuInteracting(true);
                            }}
                            onPointerCancel={(event) => {
                              event.stopPropagation();
                              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                                event.currentTarget.releasePointerCapture(event.pointerId);
                              }
                              setIsContractEraserMenuInteracting(true);
                            }}
                            onChange={(event) => {
                              setContractDrawStrokeWidth(Number(event.target.value));
                              setIsContractEraserModeActive(true);
                            }}
                          />
                          <output>{contractDrawStrokeWidth}px</output>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className={styles.contractDraft__actionMenu}>
              {contractDraftPdfUrl && (
                <>
                  <button
                    type="button"
                    className={styles.contractDraft__exportIconButton}
                    aria-label="Print PDF copy"
                    title="Print PDF copy"
                    disabled={Boolean(contractPdfExporting)}
                    onClick={() => void exportContractPdf("print")}
                  >
                    <Printer size={17} />
                  </button>
                  <button
                    type="button"
                    className={styles.contractDraft__exportIconButton}
                    aria-label="Download PDF copy"
                    title="Download PDF copy"
                    disabled={Boolean(contractPdfExporting)}
                    onClick={() => void exportContractPdf("download")}
                  >
                    <Download size={17} />
                  </button>
                </>
              )}
              {isContractDraftSaved ? (
                <>
                  <button
                    type="button"
                    className={styles.contractDraft__saveButton}
                    aria-expanded={isContractSendDropdownOpen}
                    onClick={() => setIsContractSendDropdownOpen((prev) => !prev)}
                  >
                    <Send size={15} />
                    Send to
                    <ChevronDown size={15} />
                  </button>
                  {isContractSendDropdownOpen && (
                    <div className={styles.contractDraft__sendDropdown}>
                      <div className={styles.contractDraft__panelHeader}>
                        <span>Recipient link</span>
                        <strong>{contractDraftCreatedContract ? "Ready" : "Draft"}</strong>
                      </div>

                      <form className={styles.contractDraft__shareForm} onSubmit={createContract}>
                        <label className={styles.projectManager__field}>
                          <span>Recipient name</span>
                          <input
                            type="text"
                            value={contractRecipientName}
                            onChange={(event) => setContractRecipientName(event.target.value)}
                            placeholder="Recipient name"
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Recipient email</span>
                          <input
                            type="email"
                            value={contractRecipientEmail}
                            onChange={(event) => setContractRecipientEmail(event.target.value)}
                            placeholder="Optional for manual link sharing"
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Contract title</span>
                          <input
                            type="text"
                            value={contractTitle}
                            onChange={(event) => setContractTitle(event.target.value)}
                            placeholder="Project Contract Agreement"
                          />
                        </label>
                        <button
                          type="submit"
                          className={styles.tableToolbar__addButton}
                          disabled={
                            contractCreating ||
                            !contractRecipientName.trim() ||
                            !contractDraftPdfUrl ||
                            contractTemplateFields.length === 0
                          }
                        >
                          <Link2 size={14} />
                          {contractCreating ? "Generating..." : "Generate Link"}
                        </button>
                      </form>

                      {contractDraftCreatedContract && (
                        <div className={styles.contractDraft__linkCard}>
                          <span>Contract link</span>
                          <a
                            href={contractDraftCreatedContract.contractUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {contractDraftCreatedContract.contractUrl}
                          </a>
                          <div className={styles.contractDraft__linkActions}>
                            <button
                              type="button"
                              onClick={() => void copyContractLink(contractDraftCreatedContract)}
                            >
                              <Link2 size={13} />
                              Copy
                            </button>
                            <button
                              type="button"
                              disabled={
                                !contractDraftCreatedContract.recipientEmail ||
                                contractSendingId === contractDraftCreatedContract.id
                              }
                              onClick={() => void sendContractEmail(contractDraftCreatedContract.id)}
                            >
                              <Send size={13} />
                              {contractSendingId === contractDraftCreatedContract.id
                                ? "Sending..."
                                : "Email"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className={styles.contractDraft__saveButton}
                  disabled={
                    contractTemplateSaving ||
                    !contractDraftPdfUrl ||
                    contractTemplateFields.length === 0
                  }
                  onClick={() => void saveContractTemplateDraft()}
                >
                  <CheckCircle2 size={15} />
                  {contractTemplateSaving ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </header>

          {(contractsNotice || contractDraftPdfUrl) && (
            <div className={styles.contractDraft__statusBar}>
              <span className={styles.contractDraft__statusMessage}>{contractsNotice}</span>
              {contractDraftPdfUrl && (
                <div className={styles.contractDraft__statusControls}>
                  <button
                    type="button"
                    className={`${styles.contractDraft__objectBorderToggle} ${
                      showContractObjectBorders
                        ? styles["contractDraft__objectBorderToggle--active"]
                        : ""
                    }`}
                    role="switch"
                    aria-checked={showContractObjectBorders}
                    onClick={() => setShowContractObjectBorders((current) => !current)}
                  >
                    <span>Show Object borders</span>
                    <span className={styles.contractDraft__objectBorderToggleTrack}>
                      <span className={styles.contractDraft__objectBorderToggleThumb} />
                    </span>
                  </button>
                  <span className={styles.contractDraft__pageIndicator}>
                    Page {contractDraftStatusActivePage} of {contractDraftStatusPageCount}
                  </span>
                </div>
              )}
            </div>
          )}

          {isLoadingData ? (
            <AdminFormSkeleton fields={6} />
          ) : (
            <div className={styles.contractDraft__layout}>
              <aside className={styles.contractDraft__panel}>
                {!contractDraftPdfUrl ? (
                  <div className={styles.contractDraft__documentFields}>
                    <label
                      className={`${styles.projectManager__field} ${styles.contractDraft__pdfPicker}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "copy";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        applyContractPdfFile(event.dataTransfer.files?.[0] ?? null);
                      }}
                    >
                      <FileText size={34} aria-hidden="true" />
                      <span>PDF document</span>
                      <input
                        key={contractTemplatePdfInputKey}
                        className={styles.contractDraft__pdfInput}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(event) =>
                          applyContractPdfFile(event.target.files?.[0] ?? null)
                        }
                      />
                      <span className={styles.contractDraft__pdfButton}>Upload a PDF file</span>
                    </label>
                  </div>
                ) : (
                  <div className={styles.contractDraft__itemsTab}>
                    <div className={styles.contractDraft__objectsPane}>
                      <div className={styles.contractDraft__panelHeader}>
                        <strong>Objects</strong>
                      </div>

                      <div className={styles.contractDraft__objectsList} aria-label="PDF objects">
                        {contractTemplateFields.length > 0 ? (
                          contractTemplateFields.map((field, index) => (
                            <div
                              key={field.id}
                              className={`${styles.contractDraft__objectItem} ${
                                selectedContractFieldId === field.id
                                  ? styles["contractDraft__objectItem--selected"]
                                  : ""
                              } ${
                                draggedContractFieldId === field.id
                                  ? styles["contractDraft__objectItem--dragging"]
                                  : ""
                              } ${
                                contractFieldDropTargetId === field.id &&
                                draggedContractFieldId !== field.id
                                  ? styles["contractDraft__objectItem--dropTarget"]
                                  : ""
                              }`}
                              onDragOver={(event) => handleContractFieldDragOver(event, field.id)}
                              onDragLeave={() => {
                                if (contractFieldDropTargetId === field.id) {
                                  setContractFieldDropTargetId(null);
                                }
                              }}
                              onDrop={(event) => handleContractFieldDrop(event, field.id)}
                            >
                              <button
                                type="button"
                                className={styles.contractDraft__objectDragHandle}
                                draggable={!editingContractObjectLabelId}
                                aria-label={`Reorder ${getContractFieldObjectLabel(field, index)}`}
                                title="Drag to reorder"
                                onDragStart={(event) =>
                                  handleContractFieldDragStart(event, field.id)
                                }
                                onDragEnd={clearContractFieldDragState}
                              >
                                <GripVertical size={12} />
                              </button>
                              <div
                                className={styles.contractDraft__objectSelect}
                                role="button"
                                tabIndex={0}
                                aria-pressed={selectedContractFieldId === field.id}
                                onClick={() => setSelectedContractFieldId(field.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setSelectedContractFieldId(field.id);
                                  }
                                }}
                              >
                                <span className={styles.contractDraft__objectItemIcon}>
                                  {field.type === "textbox" ? (
                                    <MessageSquare size={14} />
                                  ) : field.type === "signature" ? (
                                    <Pencil size={14} />
                                  ) : field.type === "image" ? (
                                    <ImagePlus size={14} />
                                  ) : getContractFieldTypeLabel(field) === "Eraser" ? (
                                    <Eraser size={14} />
                                  ) : field.type === "draw" ? (
                                    <Brush size={14} />
                                  ) : (
                                    <Type size={14} />
                                  )}
                                </span>
                                <span className={styles.contractDraft__objectItemCopy}>
                                  {editingContractObjectLabelId === field.id ? (
                                    <input
                                      className={styles.contractDraft__objectLabelInput}
                                      value={contractObjectLabelDraft}
                                      autoFocus
                                      aria-label="Object label"
                                      onBlur={() => finishEditingContractObjectLabel(field.id)}
                                      onChange={(event) =>
                                        setContractObjectLabelDraft(event.target.value)
                                      }
                                      onClick={(event) => event.stopPropagation()}
                                      onDoubleClick={(event) => event.stopPropagation()}
                                      onFocus={(event) => event.target.select()}
                                      onKeyDown={(event) => {
                                        event.stopPropagation();
                                        if (event.key === "Enter") {
                                          event.preventDefault();
                                          finishEditingContractObjectLabel(field.id);
                                        }
                                        if (event.key === "Escape") {
                                          event.preventDefault();
                                          cancelEditingContractObjectLabel();
                                        }
                                      }}
                                    />
                                  ) : (
                                    <strong
                                      className={styles.contractDraft__objectLabelText}
                                      title="Double-click to rename"
                                      onDoubleClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        startEditingContractObjectLabel(field, index);
                                      }}
                                    >
                                      {getContractFieldObjectLabel(field, index)}
                                    </strong>
                                  )}
                                  <small>
                                    Page {field.page} /{" "}
                                    {field.type === "signature" &&
                                    (field.drawingDataUrl || field.imageUrl)
                                      ? "Signature drawing"
                                      : getContractFieldTypeLabel(field) === "Eraser"
                                        ? "Eraser stroke"
                                      : field.label || getContractFieldDefaultLabel(field.type)}
                                  </small>
                                </span>
                              </div>
                              <div className={styles.contractDraft__objectActions}>
                                <button
                                  type="button"
                                  aria-label={`${field.locked ? "Unlock" : "Lock"} ${
                                    getContractFieldTypeLabel(field).toLowerCase()
                                  } ${index + 1}`}
                                  title={field.locked ? "Unlock object" : "Lock object"}
                                  onClick={() => toggleContractFieldLock(field.id)}
                                >
                                  {field.locked ? <Unlock size={12} /> : <Lock size={12} />}
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Copy ${
                                    getContractFieldTypeLabel(field).toLowerCase()
                                  } ${index + 1}`}
                                  title="Copy object"
                                  onClick={() => copyContractFieldToClipboard(field.id, "copy")}
                                >
                                  <ClipboardCopy size={12} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Cut ${
                                    getContractFieldTypeLabel(field).toLowerCase()
                                  } ${index + 1}`}
                                  title="Cut object"
                                  onClick={() => copyContractFieldToClipboard(field.id, "cut")}
                                >
                                  <Scissors size={12} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Duplicate ${
                                    getContractFieldTypeLabel(field).toLowerCase()
                                  } ${index + 1}`}
                                  title="Duplicate object"
                                  onClick={() => duplicateContractField(field.id)}
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete ${
                                    getContractFieldTypeLabel(field).toLowerCase()
                                  } ${index + 1}`}
                                  title="Delete object"
                                  onClick={() => deleteContractField(field.id)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={styles.contractDraft__objectsEmpty}>
                            <strong>No objects yet</strong>
                            <span>
                              Use Text, Textbox, Signature, Image, Draw, or Eraser in the appbar to
                              create one.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedContractField && (
                      <div
                        className={`${styles.contractsFieldEditor} ${styles.contractDraft__selectedEditor}`}
                      >
                        <div className={styles.contractsFieldEditor__header}>
                          <div>
                            <span>Selected object</span>
                            <strong>
                              {selectedContractField.locked ? "Locked " : ""}
                              {selectedContractField.type === "textbox"
                                ? "Fillable textbox"
                                : selectedContractField.type === "signature" &&
                                    (selectedContractField.drawingDataUrl ||
                                      selectedContractField.imageUrl)
                                  ? "Signature drawing"
                                  : getContractFieldTypeLabel(selectedContractField) === "Eraser"
                                    ? "Eraser stroke"
                                : getContractFieldTypeLabel(selectedContractField)}
                            </strong>
                          </div>
                          <button type="button" onClick={deleteSelectedContractField}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className={styles.contractDraft__selectedEditorContent}>
                          <label className={styles.projectManager__field}>
                            <span>Label or text</span>
                            <input
                              type="text"
                              value={selectedContractField.label}
                              onChange={(event) =>
                                updateSelectedContractField({ label: event.target.value })
                              }
                            />
                          </label>
                          {selectedContractField.type === "signature" && (
                            <div className={styles.contractDraft__imageFieldControls}>
                              {selectedContractField.drawingDataUrl ||
                              selectedContractField.imageUrl ? (
                                <div className={styles.contractDraft__imagePreview}>
                                  <img
                                    src={
                                      selectedContractField.drawingDataUrl ||
                                      selectedContractField.imageUrl
                                    }
                                    alt={selectedContractField.label || "Signature"}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedContractField({
                                        drawingDataUrl: undefined,
                                        imageUrl: undefined,
                                        required: true,
                                      })
                                    }
                                  >
                                    Remove sender signature
                                  </button>
                                </div>
                              ) : (
                                <p className={styles.contractDraft__imageHint}>
                                  Double-click the signature on the PDF to upload or draw the
                                  sender signature. If empty, the recipient will fill it.
                                </p>
                              )}
                            </div>
                          )}
                          {selectedContractField.type === "image" && (
                            <div className={styles.contractDraft__imageFieldControls}>
                              <label className={styles.projectManager__field}>
                                <span>Attached image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={
                                    contractImageUploadingFieldId === selectedContractField.id
                                  }
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    event.target.value = "";
                                    void uploadContractImageField(selectedContractField.id, file);
                                  }}
                                />
                              </label>
                              {selectedContractField.imageUrl ? (
                                <div className={styles.contractDraft__imagePreview}>
                                  <img
                                    src={selectedContractField.imageUrl}
                                    alt={selectedContractField.label || "Attached image"}
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSelectedContractField({ imageUrl: undefined })
                                    }
                                  >
                                    Remove image
                                  </button>
                                </div>
                              ) : (
                                <p className={styles.contractDraft__imageHint}>
                                  {contractImageUploadingFieldId === selectedContractField.id
                                    ? "Uploading image..."
                                    : "Upload an image to render inside this object."}
                                </p>
                              )}
                            </div>
                          )}
                          <div className={styles.contractsFieldEditor__grid}>
                            <label className={styles.projectManager__field}>
                              <span>Font family</span>
                              <AdminSelect
                                value={
                                  selectedContractField.fontFamily ??
                                  defaultContractFieldFontFamily
                                }
                                ariaLabel="Field font family"
                                options={contractFieldFontFamilyOptions}
                                onChange={(fontFamily) =>
                                  updateSelectedContractField({ fontFamily })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Style</span>
                              <AdminSelect
                                value={
                                  selectedContractField.fontStyle ?? defaultContractFieldFontStyle
                                }
                                ariaLabel="Field font style"
                                options={contractFieldFontStyleOptions}
                                onChange={(fontStyle) => updateSelectedContractField({ fontStyle })}
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Page</span>
                              <AdminSelect
                                value={selectedContractField.page}
                                ariaLabel="Field page"
                                options={Array.from(
                                  { length: contractTemplatePageCount },
                                  (_, index) => ({
                                    value: index + 1,
                                    label: `Page ${index + 1}`,
                                  }),
                                )}
                                onChange={(page) => updateSelectedContractField({ page })}
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Font</span>
                              <input
                                type="number"
                                min={8}
                                max={36}
                                value={selectedContractField.fontSize}
                                onChange={(event) =>
                                  updateSelectedContractField({
                                    fontSize: Number(event.target.value) || 14,
                                  })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Alignment</span>
                              <AdminSelect
                                value={selectedContractField.textAlign ?? "left"}
                                ariaLabel="Field text alignment"
                                options={contractFieldTextAlignOptions}
                                onChange={(textAlign) =>
                                  updateSelectedContractField({ textAlign })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Font color</span>
                              <input
                                className={styles.contractDraft__colorInput}
                                type="color"
                                value={getContractColorInputValue(
                                  selectedContractField.fontColor,
                                  defaultContractFieldFontColor,
                                )}
                                onChange={(event) =>
                                  updateSelectedContractField({ fontColor: event.target.value })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Background</span>
                              <input
                                className={styles.contractDraft__colorInput}
                                type="color"
                                value={getContractColorInputValue(
                                  selectedContractField.backgroundColor,
                                  "#ffffff",
                                )}
                                onChange={(event) =>
                                  updateSelectedContractField({
                                    backgroundColor: event.target.value,
                                  })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Border color</span>
                              <input
                                className={styles.contractDraft__colorInput}
                                type="color"
                                value={getContractColorInputValue(
                                  selectedContractField.borderColor,
                                  defaultContractFieldBorderColor,
                                )}
                                onChange={(event) =>
                                  updateSelectedContractField({ borderColor: event.target.value })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Border</span>
                              <input
                                type="number"
                                min={0}
                                max={12}
                                step={1}
                                value={selectedContractField.borderWidth ?? 0}
                                onChange={(event) =>
                                  updateSelectedContractField({
                                    borderWidth: Number(event.target.value) || 0,
                                  })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Width</span>
                              <input
                                type="number"
                                min={0.03}
                                max={1}
                                step={0.01}
                                value={selectedContractField.width}
                                onChange={(event) =>
                                  updateSelectedContractField({
                                    width:
                                      Number(event.target.value) || selectedContractField.width,
                                  })
                                }
                              />
                            </label>
                            <label className={styles.projectManager__field}>
                              <span>Height</span>
                              <input
                                type="number"
                                min={0.015}
                                max={1}
                                step={0.01}
                                value={selectedContractField.height}
                                onChange={(event) =>
                                  updateSelectedContractField({
                                    height:
                                      Number(event.target.value) || selectedContractField.height,
                                  })
                                }
                              />
                            </label>
                          </div>
                          {(selectedContractField.type === "textbox" ||
                            (selectedContractField.type === "signature" &&
                              !selectedContractField.drawingDataUrl &&
                              !selectedContractField.imageUrl)) && (
                            <label className={styles.projectManager__flag}>
                              <input
                                type="checkbox"
                                checked={selectedContractField.required}
                                onChange={(event) =>
                                  updateSelectedContractField({ required: event.target.checked })
                                }
                              />
                              <span>
                                <strong>Required field</strong>
                                <small>
                                  {selectedContractField.type === "signature"
                                    ? "The recipient must add a signature before saving."
                                    : "The recipient must fill this textbox before saving."}
                                </small>
                              </span>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </aside>

              <section className={styles.contractDraft__pdfStage}>
                <div ref={contractPdfStageRef} className={styles.contractDraft__pdfViewport}>
                <input
                  ref={contractImageObjectInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.contractDraft__hiddenFileInput}
                  onChange={(event) => {
                    const fieldId = pendingContractImageUploadFieldIdRef.current;
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    pendingContractImageUploadFieldIdRef.current = null;
                    if (!fieldId) return;
                    void uploadContractImageField(fieldId, file);
                  }}
                />
                <ContractPdfViewer
                  pdfUrl={contractDraftPdfUrl}
                  fields={contractTemplateFields}
                  mode="edit"
                  selectedFieldId={selectedContractFieldId}
                  onFieldsChange={(fields) => {
                    recordContractFieldHistory();
                    markContractDraftUnsaved();
                    setContractTemplateFields(fields);
                  }}
                  onSelectedFieldIdChange={setSelectedContractFieldId}
                  onActivePageChange={setContractTemplateActivePage}
                  onPageCountChange={setContractTemplatePageCount}
                  onImageUploadRequest={requestContractImageObjectUpload}
                  showObjectBorders={showContractObjectBorders}
                  zoom={contractPdfZoom}
                  onFieldDrop={(type, position) => createContractField(type, position)}
                  drawTool={
                    isContractDrawModeActive && !isContractDrawMenuInteracting
                      ? {
                          color: contractDrawColor,
                          strokeWidth: contractDrawStrokeWidth,
                          mode: "draw",
                        }
                      : isContractEraserModeActive && !isContractEraserMenuInteracting
                        ? {
                            color: contractEraserColor,
                            strokeWidth: contractDrawStrokeWidth,
                            mode: "eraser",
                          }
                        : null
                  }
                  onDrawingCreate={createContractDrawingField}
                />
                </div>
                <div className={styles.contractDraft__zoomControls} aria-label="Document zoom controls">
                  <div className={styles.contractDraft__zoomButtons}>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      disabled={contractPdfZoom >= 300}
                      onClick={() => setContractPdfZoom((current) => Math.min(300, current + 10))}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom out"
                      disabled={contractPdfZoom <= contractPdfFitZoom}
                      onClick={() =>
                        setContractPdfZoom((current) =>
                          Math.max(contractPdfFitZoom, current - 10),
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                  <div className={styles.contractDraft__zoomValue}>
                    <output aria-live="polite">{contractPdfZoom}%</output>
                    <details>
                      <summary aria-label="Open zoom options">
                        <ChevronDown size={13} />
                      </summary>
                      <div className={styles.contractDraft__zoomMenu}>
                        <button
                          type="button"
                          onClick={() => setContractPdfZoom(contractPdfFitZoom)}
                        >
                          Fit to Screen
                        </button>
                        {[125, 150, 200].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setContractPdfZoom(Math.max(contractPdfFitZoom, value))}
                          >
                            {value}%
                          </button>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={`${styles.admin} ${theme === "dark" ? styles["admin--dark"] : ""}`}>
      {sessionExpiredDialog}
      {adminError?.scope === "global" && (
        <div className={styles.adminErrorOverlay}>
          <AdminErrorPopup
            error={adminError}
            placement="global"
            onClose={() => clearAdminError("global")}
          />
        </div>
      )}
      <div
        className={`${styles.admin__shell} ${
          isSidebarCollapsed ? styles["admin__shell--collapsed"] : ""
        }`}
      >
        <aside
          className={`${styles.sidebar} ${
            isSidebarCollapsed ? styles["sidebar--collapsed"] : ""
          }`}
        >
          <div className={styles.sidebar__top}>
            <div className={styles.sidebar__brand}>
              <Shield size={18} />
              <div>
                <p>Portfolio CMS</p>
                <span>{activeUser?.email ?? "Refreshing session..."}</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.sidebar__collapseButton}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!isSidebarCollapsed}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          <nav className={styles.sidebar__nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const badgeCount = sidebarBadgeCounts[item.id] ?? 0;
              const badgeLabel = badgeCount > 99 ? "99+" : String(badgeCount);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.sidebar__navItem} ${
                    activeSection === item.id ? styles["sidebar__navItem--active"] : ""
                  }`}
                  aria-label={item.label}
                  title={isSidebarCollapsed ? item.label : undefined}
                  onClick={() => selectActiveSection(item.id)}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {badgeCount > 0 && (
                    <strong
                      className={styles.sidebar__navBadge}
                      aria-label={`${badgeLabel} ${item.label} ${badgeCount === 1 ? "item" : "items"}`}
                    >
                      {badgeLabel}
                    </strong>
                  )}
                </button>
              );
            })}
          </nav>
          <div className={styles.sidebar__actions}>
            <button
              type="button"
              className={styles.sidebar__actionButton}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a
              className={styles.sidebar__actionButton}
              href="/"
              aria-label="Back to portfolio"
              title="Back to Portfolio"
            >
              <LayoutDashboard size={16} />
            </a>
            <button
              type="button"
              className={styles.sidebar__actionButton}
              aria-label="Sign out"
              title="Sign Out"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        <main className={styles.content}>
          {contentBusyState && <AdminBusyOverlay {...contentBusyState} />}
          {activeSection === "dashboard" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Dashboard</h2>
                <p>Operational overview for portfolio publishing, reviews, traffic, and system health.</p>
              </div>
              {isLoadingData ? (
                <>
                  <AdminKpiSkeleton />
                  <AdminTableSkeleton rows={4} withToolbar={false} />
                </>
              ) : (
                <div className={styles.dashboardView}>
                  <div className={styles.kpiGrid}>
                    <article className={styles.kpiCard}>
                      <h3>Portfolio Visits</h3>
                      <p>{analyticsStats.totalVisits}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Today</h3>
                      <p>{analyticsStats.todayVisits}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Unique Visitors</h3>
                      <p>{analyticsStats.totalUniqueVisitors}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Reviews Waiting</h3>
                      <p>{pendingDashboardReviews.length}</p>
                    </article>
                  </div>

                  <div className={styles.dashboardGrid}>
                    <article className={styles.dashboardPanel}>
                      <div className={styles.dashboardPanel__header}>
                        <div>
                          <span>Active CV</span>
                          <h3>{activeCvAsset ? activeCvAsset.visualFileName : "No active CV"}</h3>
                        </div>
                        <button type="button" onClick={() => setActiveSection("cv")}>
                          <FileText size={15} />
                          Manage
                        </button>
                      </div>
                      {activeCvAsset ? (
                        <div className={styles.dashboardCv}>
                          <div className={styles.dashboardCv__summary}>
                            <div>
                              <span>Downloads</span>
                              <strong>{activeCvAsset.downloadCount}</strong>
                            </div>
                            <p>Updated {new Date(activeCvAsset.updatedAt).toLocaleString()}</p>
                          </div>

                          <div className={styles.dashboardCv__documents}>
                            <div className={styles.dashboardCv__document}>
                              <span>ATS Friendly</span>
                              <strong title={activeAtsCvDocument?.fileName ?? undefined}>
                                {activeAtsCvDocument?.fileName ?? "Set"}
                              </strong>
                            </div>
                            <div className={styles.dashboardCv__document}>
                              <span>Visual Friendly</span>
                              <strong title={activeVisualCvDocument?.fileName ?? undefined}>
                                {activeVisualCvDocument?.fileName ?? "Set"}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <AdminEmptyState
                          title="No active CV"
                          message="Upload and activate a CV so visitors can request downloads."
                        />
                      )}
                    </article>

                    <article className={styles.dashboardPanel}>
                      <div className={styles.dashboardPanel__header}>
                        <div>
                          <span>Reviews Requiring Attention</span>
                          <h3>{pendingDashboardReviews.length} pending</h3>
                        </div>
                        <button type="button" onClick={() => setActiveSection("reviews")}>
                          <MessageSquare size={15} />
                          Review
                        </button>
                      </div>
                      {pendingDashboardReviews.length === 0 ? (
                        <AdminEmptyState
                          title="No pending reviews"
                          message="Submitted reviews that need approval will appear here."
                        />
                      ) : (
                        <div className={styles.dashboardList}>
                          {pendingDashboardReviews.map((review) => (
                            <button
                              key={review.id}
                              type="button"
                              className={styles.dashboardList__row}
                              onClick={() => {
                                setActiveSection("reviews");
                                openReviewEditor(review);
                              }}
                            >
                              <div>
                                <strong>{review.client}</strong>
                                <span>{review.excerpt}</span>
                              </div>
                              <small>{review.rating} Stars</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </article>

                    <article className={styles.dashboardPanel}>
                      <div className={styles.dashboardPanel__header}>
                        <div>
                          <span>Admin Login Logs</span>
                          <h3>Recent visits</h3>
                        </div>
                        <MonitorSmartphone size={18} />
                      </div>
                      {loginLogs.length === 0 ? (
                        <AdminEmptyState
                          title="No login logs yet"
                          message="Successful admin logins will be listed here."
                        />
                      ) : (
                        <div className={styles.dashboardList}>
                          {loginLogs.map((log) => (
                            <div key={log.id} className={styles.dashboardList__row}>
                              <div>
                                <strong>{log.deviceName}</strong>
                                <span>{new Date(log.createdAt).toLocaleString()}</span>
                              </div>
                              <small>Visit</small>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>

                    <article className={styles.dashboardPanel}>
                      <div className={styles.dashboardPanel__header}>
                        <div>
                          <span>Top 3 Error Logs</span>
                          <h3>{errorLogStats.openErrors} open</h3>
                        </div>
                        <button type="button" onClick={() => setActiveSection("errorLogs")}>
                          <AlertTriangle size={15} />
                          Open
                        </button>
                      </div>
                      {dashboardTopErrorLogs.length === 0 ? (
                        <AdminEmptyState
                          title="No error logs"
                          message="The latest frontend and backend errors will appear here."
                        />
                      ) : (
                        <div className={styles.dashboardList}>
                          {dashboardTopErrorLogs.map((log) => (
                            <button
                              key={log.id}
                              type="button"
                              className={styles.dashboardList__row}
                              onClick={() => setActiveSection("errorLogs")}
                            >
                              <div>
                                <strong>{log.message}</strong>
                                <span>{log.path || log.url || "No path recorded"}</span>
                              </div>
                              <small>{log.source}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "analytics" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Analytics</h2>
                <p>Visitor totals and public portfolio traffic for the last 30 days.</p>
              </div>
              {renderScopedError("analytics")}
              {isLoadingData ? (
                <>
                  <AdminKpiSkeleton />
                  <AdminTableSkeleton rows={1} withToolbar={false} />
                </>
              ) : (
                <div className={styles.analyticsView}>
                  <div className={styles.kpiGrid}>
                    <article className={styles.kpiCard}>
                      <h3>Unique Visitors</h3>
                      <p>{analyticsStats.totalUniqueVisitors}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Total Visits</h3>
                      <p>{analyticsStats.totalVisits}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Today</h3>
                      <p>{analyticsStats.todayVisits}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Repeat Visitors</h3>
                      <p>{analyticsStats.repeatVisitors}</p>
                    </article>
                  </div>

                  <div className={styles.analyticsChart}>
                    <div className={styles.analyticsChart__header}>
                      <div>
                        <h3>Visits Over Time</h3>
                        <p>Daily visits and unique visitors from public pages only.</p>
                      </div>
                    </div>
                    <div className={styles.analyticsChart__frame}>
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={visitorGraph} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="visitorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.34} />
                              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="visitorUnique" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.28} />
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) =>
                              new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            }
                          />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={false}
                            labelFormatter={(value) =>
                              new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            }
                            contentStyle={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: 12,
                              color: "var(--foreground)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="visits"
                            name="Visits"
                            stroke="#14b8a6"
                            fill="url(#visitorVisits)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="uniqueVisitors"
                            name="Unique visitors"
                            stroke="#38bdf8"
                            fill="url(#visitorUnique)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "errorLogs" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Error Logs</h2>
                <p>Frontend and backend errors, with spikes over the last 30 days.</p>
              </div>
              {renderScopedError("errorLogs")}
              {isLoadingData ? (
                <>
                  <AdminKpiSkeleton />
                  <AdminTableSkeleton rows={4} withToolbar={false} />
                </>
              ) : (
                <div className={styles.analyticsView}>
                  <div className={styles.kpiGrid}>
                    <article className={styles.kpiCard}>
                      <h3>Open Errors</h3>
                      <p>{errorLogStats.openErrors}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Frontend</h3>
                      <p>{errorLogStats.frontendErrors}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Backend</h3>
                      <p>{errorLogStats.backendErrors}</p>
                    </article>
                    <article className={styles.kpiCard}>
                      <h3>Latest Error</h3>
                      <p className={styles.kpiCard__smallValue}>
                        {errorLogStats.latestErrorAt
                          ? new Date(errorLogStats.latestErrorAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : "None"}
                      </p>
                    </article>
                  </div>

                  <div className={styles.analyticsChart}>
                    <div className={styles.analyticsChart__header}>
                      <div>
                        <h3>Error Spikes</h3>
                        <p>Daily frontend and backend errors.</p>
                      </div>
                    </div>
                    <div className={styles.analyticsChart__frame}>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={errorGraph} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) =>
                              new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            }
                          />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={false}
                            labelFormatter={(value) =>
                              new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            }
                            contentStyle={{
                              background: "var(--card)",
                              border: "1px solid var(--border)",
                              borderRadius: 12,
                              color: "var(--foreground)",
                            }}
                          />
                          <Bar dataKey="frontend" name="Frontend" stackId="errors" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="backend" name="Backend" stackId="errors" fill="#ef4444" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {errorLogs.length === 0 ? (
                    <AdminEmptyState
                      title="No error logs"
                      message="No frontend or backend errors are waiting to be resolved."
                    />
                  ) : (
                    <div className={styles.errorLogList}>
                      {errorLogs.map((log) => (
                        <article key={log.id} className={styles.errorLogItem}>
                          <div className={styles.errorLogItem__meta}>
                            <span className={styles.errorLogItem__source}>{log.source}</span>
                            <span>{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          <div className={styles.errorLogItem__body}>
                            <h4>{log.message}</h4>
                            <p>{log.path || log.url || "No path recorded"}</p>
                            {(log.stack || log.details) && (
                              <details className={styles.errorLogItem__details}>
                                <summary>Technical details</summary>
                                {log.stack && <pre>{log.stack}</pre>}
                                {log.details && <pre>{log.details}</pre>}
                              </details>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.errorLogItem__resolve}
                            disabled={errorLogDeletingId === log.id}
                            onClick={() => void resolveErrorLog(log.id)}
                          >
                            <CheckCircle2 size={15} />
                            {errorLogDeletingId === log.id ? "Resolving..." : "Resolved"}
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {activeSection === "requests" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Account Requests</h2>
                <p>Approve or reject pending admin signup requests.</p>
              </div>
              {renderScopedError("requests")}
              {requestsNotice && <p className={styles.admin__notice}>{requestsNotice}</p>}
              {isLoadingData ? (
                <AdminTableSkeleton rows={3} />
              ) : pendingAdmins.length === 0 ? (
                <AdminEmptyState
                  title="No account requests"
                  message="There are no pending admin signup requests to review right now."
                />
              ) : (
                <>
                  <div className={styles.tableToolbar}>
                    <AdminSearchField
                      value={requestSearch}
                      onChange={setRequestSearch}
                      placeholder="Search name, email, or request date"
                      ariaLabel="Search account requests"
                    />
                  </div>
                  {visiblePendingAdmins.length === 0 ? (
                    <AdminEmptyState
                      title="No matching requests"
                      message="No account requests match your current search."
                    />
                  ) : (
                    <div className={styles.table}>
                      {visiblePendingAdmins.map((request) => (
                        <article key={request.id} className={styles.table__row}>
                          <div>
                            <h4>{request.name}</h4>
                            <p>{request.email}</p>
                            <p>Requested: {new Date(request.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={styles.table__badge}>Pending</span>
                          <div className={styles.table__actions}>
                            <button
                              type="button"
                              className={styles.table__actionApprove}
                              disabled={Boolean(requestProcessingId)}
                              onClick={() => {
                                void approvePendingAdmin(request.id);
                              }}
                            >
                              {requestProcessingId === request.id ? "Approving..." : "Approve"}
                            </button>
                            <button
                              type="button"
                              className={styles.table__actionReject}
                              disabled={Boolean(requestProcessingId)}
                              onClick={() => {
                                void rejectPendingAdmin(request.id);
                              }}
                            >
                              {requestProcessingId === request.id ? "Rejecting..." : "Reject"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === "projects" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Projects</h2>
                <p>Build, filter, publish, and archive your portfolio projects.</p>
              </div>
              {!isProjectDialogOpen && !editingProject && renderScopedError("projects")}

              {isLoadingData ? (
                <AdminProjectSkeleton />
              ) : (
              <div className={styles.projectManager}>
                <div className={styles.projectManager__stats}>
                  <article className={styles.projectManager__statCard}>
                    <h3>Total</h3>
                    <p>{content.projects.length}</p>
                  </article>
                  <article className={styles.projectManager__statCard}>
                    <h3>Published</h3>
                    <p>{projectStatusCounts.Published}</p>
                  </article>
                  <article className={styles.projectManager__statCard}>
                    <h3>Draft</h3>
                    <p>{projectStatusCounts.Draft}</p>
                  </article>
                  <article className={styles.projectManager__statCard}>
                    <h3>Archived</h3>
                    <p>{projectStatusCounts.Archived}</p>
                  </article>
                  <article className={styles.projectManager__statCard}>
                    <h3>Featured</h3>
                    <p>{projectDisplayCounts.featured}/3</p>
                  </article>
                  <article className={styles.projectManager__statCard}>
                    <h3>Pinned</h3>
                    <p>{projectDisplayCounts.pinned}</p>
                  </article>
                </div>

                <div className={styles.projectManager__toolbar}>
                  <AdminSearchField
                    value={projectSearch}
                    onChange={setProjectSearch}
                    placeholder="Search title or category"
                    ariaLabel="Search projects"
                  />
                  <AdminSelect
                    value={projectStatusFilter}
                    ariaLabel="Filter projects by status"
                    options={[
                      { value: "All" as const, label: "All statuses" },
                      ...projectStatusOptions.map((status) => ({
                        value: status,
                        label: status,
                      })),
                    ]}
                    onChange={setProjectStatusFilter}
                  />
                  <AdminSelect
                    value={projectCategoryFilter}
                    ariaLabel="Filter projects by category"
                    options={[
                      { value: "All", label: "All categories" },
                      ...projectCategories.map((category) => ({
                        value: category,
                        label: category,
                      })),
                    ]}
                    onChange={setProjectCategoryFilter}
                  />
                  <button
                    type="button"
                    className={styles.projectManager__clearButton}
                    aria-label="Clear project filters"
                    title="Clear filters"
                    onClick={() => {
                      setProjectSearch("");
                      setProjectStatusFilter("All");
                      setProjectCategoryFilter("All");
                    }}
                  >
                    <X size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.projectManager__addButton}
                    onClick={() => {
                      closeProjectEditor();
                      setIsProjectDialogOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    Add Project
                  </button>
                </div>

                {isProjectDialogOpen && (
                  <div
                    className={styles.adminDialog}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="project-dialog-title"
                  >
                    <button
                      type="button"
                      className={styles.adminDialog__backdrop}
                      aria-label="Close add project dialog"
                      onClick={() => setIsProjectDialogOpen(false)}
                    />
                    <div className={styles.adminDialog__panel}>
                      <div className={styles.adminDialog__header}>
                        <div>
                          <h3 id="project-dialog-title">Add Project</h3>
                          <p>Create a project entry for your portfolio gallery.</p>
                        </div>
                        <button
                          type="button"
                          className={styles.adminDialog__close}
                          aria-label="Close add project dialog"
                          title="Close"
                          onClick={() => setIsProjectDialogOpen(false)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {renderScopedError("projects")}

                      <form className={styles.projectManager__createForm} onSubmit={addProject}>
                        <label className={styles.projectManager__field}>
                          <span>Project title</span>
                          <input
                            type="text"
                            value={projectTitle}
                            onChange={(event) => setProjectTitle(event.target.value)}
                            placeholder="Portfolio redesign"
                            required
                            autoFocus
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Category</span>
                          <input
                            type="text"
                            value={projectCategory}
                            onChange={(event) => setProjectCategory(event.target.value)}
                            placeholder="Web app"
                            required
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Description</span>
                          <textarea
                            value={projectDescription}
                            onChange={(event) => setProjectDescription(event.target.value)}
                            rows={3}
                            placeholder="Short summary shown on project cards and dialogs."
                            required
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Overview</span>
                          <textarea
                            value={projectOverview}
                            onChange={(event) => setProjectOverview(event.target.value)}
                            rows={4}
                            placeholder="Detailed project overview shown in the popup."
                            required
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Start date</span>
                          <input
                            type="date"
                            value={projectStartDate}
                            onChange={(event) => setProjectStartDate(event.target.value)}
                            required
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>End date (optional)</span>
                          <input
                            type="date"
                            value={projectEndDate}
                            onChange={(event) => setProjectEndDate(event.target.value)}
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Publish status</span>
                          <AdminSelect
                            value={projectStatus}
                            ariaLabel="Project status"
                            options={projectStatusOptions.map((status) => ({
                              value: status,
                              label: status,
                            }))}
                            onChange={setProjectStatus}
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Delivery status</span>
                          <AdminSelect
                            value={projectDeliveryStatus}
                            ariaLabel="Project delivery status"
                            options={projectDeliveryStatusOptions.map((status) => ({
                              value: status,
                              label: status,
                            }))}
                            onChange={setProjectDeliveryStatus}
                          />
                        </label>
                        <div className={styles.projectManager__flagGroup}>
                          <label className={styles.projectManager__flag}>
                            <input
                              type="checkbox"
                              checked={projectIsFeatured}
                              onChange={(event) => setProjectIsFeatured(event.target.checked)}
                            />
                            <span>
                              <strong>Featured</strong>
                              <small>Show on homepage Featured Projects. Maximum 3.</small>
                            </span>
                          </label>
                          <label className={styles.projectManager__flag}>
                            <input
                              type="checkbox"
                              checked={projectIsPinned}
                              onChange={(event) => setProjectIsPinned(event.target.checked)}
                            />
                            <span>
                              <strong>Pinned</strong>
                              <small>Show in the Projects page featured rail.</small>
                            </span>
                          </label>
                        </div>
                        <AdminImageField
                          id="project-image"
                          label="Default thumbnail"
                          file={projectImageFile}
                          inputKey={projectImageInputKey}
                          onChange={setProjectImageFile}
                          emptyDescription="Required. Used when portrait or landscape thumbnails are missing."
                        />
                        <AdminImageField
                          id="project-portrait-image"
                          label="Portrait thumbnail"
                          file={projectPortraitImageFile}
                          inputKey={projectPortraitImageInputKey}
                          onChange={setProjectPortraitImageFile}
                          emptyDescription="Optional. Used by tall Featured Project cards."
                        />
                        <AdminImageField
                          id="project-landscape-image"
                          label="Landscape thumbnail"
                          file={projectLandscapeImageFile}
                          inputKey={projectLandscapeImageInputKey}
                          onChange={setProjectLandscapeImageFile}
                          emptyDescription="Optional. Used by wide project cards."
                        />
                        <AdminMultiImageField
                          id="project-preview-images"
                          label="Project preview images"
                          files={projectPreviewImageFiles}
                          inputKey={projectPreviewImageInputKey}
                          onChange={setProjectPreviewImageFiles}
                        />
                        <div className={styles.adminDialog__actions}>
                          <button
                            type="button"
                            className={styles.adminDialog__secondary}
                            onClick={() => setIsProjectDialogOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className={styles.projectManager__createButton}
                            disabled={isProjectCreating || !projectImageFile}
                          >
                            <Plus size={14} />
                            {isProjectCreating ? "Adding..." : "Add Project"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {editingProject && (
                  <div
                    className={styles.adminDialog}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="project-edit-dialog-title"
                  >
                    <button
                      type="button"
                      className={styles.adminDialog__backdrop}
                      aria-label="Close edit project dialog"
                      onClick={closeProjectEditor}
                    />
                    <div
                      className={`${styles.adminDialog__panel} ${styles["adminDialog__panel--wide"]}`}
                    >
                      <div className={styles.adminDialog__header}>
                        <div>
                          <h3 id="project-edit-dialog-title">Edit Project</h3>
                          <p>Update the project details shown in the public project dialog.</p>
                        </div>
                        <button
                          type="button"
                          className={styles.adminDialog__close}
                          aria-label="Close edit project dialog"
                          title="Close"
                          onClick={closeProjectEditor}
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {renderScopedError("projects")}

                      <form
                        className={`${styles.projectManager__createForm} ${styles.projectManager__editForm}`}
                        onSubmit={saveProjectEdit}
                      >
                        <div className={styles.projectManager__editGrid}>
                          <label className={styles.projectManager__field}>
                            <span>Project title</span>
                            <input
                              type="text"
                              value={projectEditTitle}
                              onChange={(event) => setProjectEditTitle(event.target.value)}
                              required
                              autoFocus
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Category</span>
                            <input
                              type="text"
                              value={projectEditCategory}
                              onChange={(event) => setProjectEditCategory(event.target.value)}
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Publish status</span>
                            <AdminSelect
                              value={projectEditStatus}
                              ariaLabel="Project status"
                              options={projectStatusOptions.map((status) => ({
                                value: status,
                                label: status,
                              }))}
                              onChange={setProjectEditStatus}
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Delivery status</span>
                            <AdminSelect
                              value={projectEditDeliveryStatus}
                              ariaLabel="Project delivery status"
                              options={projectDeliveryStatusOptions.map((status) => ({
                                value: status,
                                label: status,
                              }))}
                              onChange={setProjectEditDeliveryStatus}
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Tags</span>
                            <input
                              type="text"
                              value={projectEditTags}
                              onChange={(event) => setProjectEditTags(event.target.value)}
                              placeholder="React, Firebase, n8n"
                            />
                          </label>
                        </div>

                        <label className={styles.projectManager__field}>
                          <span>Description</span>
                          <textarea
                            value={projectEditDescription}
                            onChange={(event) => setProjectEditDescription(event.target.value)}
                            required
                            rows={3}
                            placeholder="Short summary shown on project cards and dialogs."
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Highlights</span>
                          <textarea
                            value={projectEditHighlights}
                            onChange={(event) => setProjectEditHighlights(event.target.value)}
                            rows={4}
                            placeholder="One highlight per line, or separate with commas."
                          />
                        </label>
                        <label className={styles.projectManager__field}>
                          <span>Details</span>
                          <textarea
                            value={projectEditDetails}
                            onChange={(event) => setProjectEditDetails(event.target.value)}
                            rows={5}
                            placeholder="Long-form details shown in the project popup."
                          />
                        </label>
                        <div className={styles.projectManager__flagGroup}>
                          <label className={styles.projectManager__flag}>
                            <input
                              type="checkbox"
                              checked={projectEditIsFeatured}
                              onChange={(event) => setProjectEditIsFeatured(event.target.checked)}
                            />
                            <span>
                              <strong>Featured</strong>
                              <small>Show on homepage Featured Projects. Maximum 3.</small>
                            </span>
                          </label>
                          <label className={styles.projectManager__flag}>
                            <input
                              type="checkbox"
                              checked={projectEditIsPinned}
                              onChange={(event) => setProjectEditIsPinned(event.target.checked)}
                            />
                            <span>
                              <strong>Pinned</strong>
                              <small>Show in the Projects page featured rail.</small>
                            </span>
                          </label>
                        </div>
                        <AdminImageField
                          id="project-edit-image"
                          label="Default thumbnail"
                          file={projectEditImageFile}
                          inputKey={projectEditImageInputKey}
                          onChange={setProjectEditImageFile}
                          existingImageUrl={editingProject.imageUrl}
                          emptyDescription="Required. Used when portrait or landscape thumbnails are missing."
                        />
                        <AdminImageField
                          id="project-edit-portrait-image"
                          label="Portrait thumbnail"
                          file={projectEditPortraitImageFile}
                          inputKey={projectEditPortraitImageInputKey}
                          onChange={setProjectEditPortraitImageFile}
                          existingImageUrl={editingProject.portraitImageUrl}
                          emptyDescription="Optional. Used by tall Featured Project cards."
                        />
                        <AdminImageField
                          id="project-edit-landscape-image"
                          label="Landscape thumbnail"
                          file={projectEditLandscapeImageFile}
                          inputKey={projectEditLandscapeImageInputKey}
                          onChange={setProjectEditLandscapeImageFile}
                          existingImageUrl={editingProject.landscapeImageUrl}
                          emptyDescription="Optional. Used by wide project cards."
                        />
                        <AdminMultiImageField
                          id="project-edit-preview-images"
                          label="Project preview images"
                          files={projectEditPreviewImageFiles}
                          inputKey={projectEditPreviewImageInputKey}
                          onChange={setProjectEditPreviewImageFiles}
                          existingImageUrls={projectEditPreviewImageUrls}
                          onExistingImageUrlsChange={setProjectEditPreviewImageUrls}
                        />
                        <p className={styles.projectManager__editHint}>
                          Preview images shown here are saved with the project. Remove an existing
                          image or add new ones before saving.
                        </p>
                        <div className={styles.adminDialog__actions}>
                          <button
                            type="button"
                            className={styles.adminDialog__secondary}
                            onClick={closeProjectEditor}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className={styles.projectManager__createButton}
                            disabled={projectUpdatingId === editingProject.id}
                          >
                            <Pencil size={14} />
                            {projectUpdatingId === editingProject.id
                              ? "Saving..."
                              : "Save Project"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {visibleProjects.length === 0 ? (
                  <AdminEmptyState
                    title={
                      content.projects.length === 0
                        ? "No projects to load"
                        : "No matching projects"
                    }
                    message={
                      content.projects.length === 0
                        ? "Create your first project to start building the portfolio gallery."
                        : "No projects match your current search and filters."
                    }
                  />
                ) : (
                  <div className={styles.projectManager__list}>
                    {visibleProjects.map((item) => {
                      const isUpdating = projectUpdatingId === item.id;
                      const isDeleting = projectDeletingId === item.id;
                      return (
                        <article key={item.id} className={styles.projectManager__item}>
                          <div className={styles.projectManager__itemContent}>
                            <img
                              src={item.imageUrl || adminImagePlaceholder}
                              alt=""
                              className={styles.projectManager__thumb}
                            />
                            <div>
                              <h4>{item.title}</h4>
                              <div className={styles.projectManager__itemMeta}>
                                <span>{item.category}</span>
                                <span>
                                  {item.previewImages.length} preview image
                                  {item.previewImages.length === 1 ? "" : "s"}
                                </span>
                                {item.isFeatured && <span>Featured</span>}
                                {item.isPinned && <span>Pinned</span>}
                                <span>ID: {item.id.slice(0, 8)}</span>
                                <span>
                                  Updated {new Date(item.updatedAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={styles.projectManager__itemActions}>
                            <span
                              className={`${styles.projectManager__statusPill} ${
                                styles[
                                  `projectManager__statusPill--${item.status.toLowerCase()}`
                                ]
                              }`}
                            >
                              {item.status}
                            </span>
                            <AdminSelect
                              value={item.status}
                              disabled={isUpdating || isDeleting}
                              ariaLabel={`Change status for ${item.title}`}
                              options={projectStatusOptions.map((status) => ({
                                value: status,
                                label: status,
                              }))}
                              onChange={(nextStatus) => {
                                if (nextStatus === item.status) return;
                                void updateProjectStatus(item.id, nextStatus);
                              }}
                            />
                            <button
                              type="button"
                              className={`${styles.projectManager__labelButton} ${
                                item.isFeatured ? styles["projectManager__labelButton--active"] : ""
                              }`}
                              aria-pressed={item.isFeatured}
                              disabled={isUpdating || isDeleting}
                              onClick={() =>
                                void updateProjectDisplayFlag(
                                  item.id,
                                  "isFeatured",
                                  !item.isFeatured,
                                )
                              }
                            >
                              Featured
                            </button>
                            <button
                              type="button"
                              className={`${styles.projectManager__labelButton} ${
                                item.isPinned ? styles["projectManager__labelButton--active"] : ""
                              }`}
                              aria-pressed={item.isPinned}
                              disabled={isUpdating || isDeleting}
                              onClick={() =>
                                void updateProjectDisplayFlag(item.id, "isPinned", !item.isPinned)
                              }
                            >
                              Pinned
                            </button>
                            <button
                              type="button"
                              className={styles.projectManager__iconButton}
                              aria-label={`Edit details for ${item.title}`}
                              title="Edit project details"
                              disabled={isUpdating || isDeleting}
                              onClick={() => openProjectEditor(item)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className={styles.projectManager__deleteButton}
                              disabled={isUpdating || isDeleting}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  `Delete project "${item.title}"?`,
                                );
                                if (!confirmed) return;
                                void deleteProject(item.id);
                              }}
                            >
                              <Trash2 size={14} />
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
            </section>
          )}

          {activeSection === "services" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Services</h2>
                <p>Manage the service catalog shown in the landing page. Fees are negotiated per project scope.</p>
              </div>
              {!isServiceDialogOpen && !editingService && renderScopedError("services")}

              {isLoadingData ? (
                <AdminTableSkeleton rows={3} />
              ) : (
                <>
              <div className={`${styles.tableToolbar} ${styles.tableToolbarWithAction}`}>
                <AdminSearchField
                  value={serviceSearch}
                  onChange={setServiceSearch}
                  placeholder="Search service name or summary"
                  ariaLabel="Search services"
                />
                <button
                  type="button"
                  className={styles.tableToolbar__addButton}
                  onClick={() => setIsServiceDialogOpen(true)}
                >
                  <Plus size={14} />
                  Add Service
                </button>
              </div>

              {isServiceDialogOpen && (
                <div
                  className={styles.adminDialog}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="service-dialog-title"
                >
                  <button
                    type="button"
                    className={styles.adminDialog__backdrop}
                    aria-label="Close add service dialog"
                    onClick={() => setIsServiceDialogOpen(false)}
                  />
                  <div className={styles.adminDialog__panel}>
                    <div className={styles.adminDialog__header}>
                      <div>
                        <h3 id="service-dialog-title">Add Service</h3>
                        <p>Create a service entry for your portfolio catalog.</p>
                      </div>
                      <button
                        type="button"
                        className={styles.adminDialog__close}
                        aria-label="Close add service dialog"
                        title="Close"
                        onClick={() => setIsServiceDialogOpen(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {renderScopedError("services")}

                    <form className={styles.projectManager__createForm} onSubmit={addService}>
                      <label className={styles.projectManager__field}>
                        <span>Service name</span>
                        <input
                          type="text"
                          value={serviceName}
                          onChange={(event) => setServiceName(event.target.value)}
                          placeholder="Automation setup"
                          required
                          autoFocus
                        />
                      </label>
                      <label className={styles.projectManager__field}>
                        <span>Short summary</span>
                        <input
                          type="text"
                          value={serviceSummary}
                          onChange={(event) => setServiceSummary(event.target.value)}
                          placeholder="Workflow setup and documentation"
                          required
                        />
                      </label>
                      <AdminImageField
                        id="service-image"
                        label="Service image"
                        file={serviceImageFile}
                        inputKey={serviceImageInputKey}
                        onChange={setServiceImageFile}
                      />
                      <div className={styles.adminDialog__actions}>
                        <button
                          type="button"
                          className={styles.adminDialog__secondary}
                          onClick={() => setIsServiceDialogOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={styles.projectManager__createButton}
                          disabled={isServiceCreating}
                        >
                          <Plus size={14} />
                          {isServiceCreating ? "Adding..." : "Add Service"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {editingService && (
                <div
                  className={styles.adminDialog}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="service-edit-dialog-title"
                >
                  <button
                    type="button"
                    className={styles.adminDialog__backdrop}
                    aria-label="Close edit service dialog"
                    onClick={closeServiceEditor}
                  />
                  <div className={styles.adminDialog__panel}>
                    <div className={styles.adminDialog__header}>
                      <div>
                        <h3 id="service-edit-dialog-title">Edit Service</h3>
                        <p>Update the service card shown in Intelligent IT Solutions.</p>
                      </div>
                      <button
                        type="button"
                        className={styles.adminDialog__close}
                        aria-label="Close edit service dialog"
                        title="Close"
                        onClick={closeServiceEditor}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {renderScopedError("services")}

                    <form className={styles.projectManager__createForm} onSubmit={updateService}>
                      <label className={styles.projectManager__field}>
                        <span>Service name</span>
                        <input
                          type="text"
                          value={serviceEditName}
                          onChange={(event) => setServiceEditName(event.target.value)}
                          required
                          autoFocus
                        />
                      </label>
                      <label className={styles.projectManager__field}>
                        <span>Short summary</span>
                        <input
                          type="text"
                          value={serviceEditSummary}
                          onChange={(event) => setServiceEditSummary(event.target.value)}
                          required
                        />
                      </label>
                      <AdminImageField
                        id="service-edit-image"
                        label="Replace service image"
                        file={serviceEditImageFile}
                        inputKey={serviceEditImageInputKey}
                        onChange={setServiceEditImageFile}
                      />
                      <div className={styles.adminDialog__actions}>
                        <button
                          type="button"
                          className={styles.adminDialog__secondary}
                          onClick={closeServiceEditor}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={styles.projectManager__createButton}
                          disabled={serviceSavingId === editingService.id}
                        >
                          <Pencil size={14} />
                          {serviceSavingId === editingService.id ? "Saving..." : "Save Service"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {visibleServices.length === 0 ? (
                <AdminEmptyState
                  title={
                    content.services.length === 0
                      ? "No services to load"
                      : "No matching services"
                  }
                  message={
                    content.services.length === 0
                      ? "Create your first service so it can appear in the landing page catalog."
                      : "No services match your current search."
                  }
                />
              ) : (
                <div className={styles.table}>
                  {visibleServices.map((item) => (
                    <article key={item.id} className={styles.table__row}>
                      <div className={styles.table__itemContent}>
                        <img
                          src={item.imageUrl || adminImagePlaceholder}
                          alt=""
                          className={styles.table__thumb}
                        />
                        <div>
                          <h4>{item.name}</h4>
                          <p>{item.summary}</p>
                        </div>
                      </div>
                      <span className={styles.table__badge}>Negotiated</span>
                      <div className={styles.table__actions}>
                        <button
                          type="button"
                          title="Edit service"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => openServiceEditor(item)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => void deleteService(item.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
                </>
              )}
            </section>
          )}

          {activeSection === "banners" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Banners</h2>
                <p>Manage standalone banner content shown after Intelligent IT Solutions.</p>
              </div>
              {!isBannerDialogOpen && !editingBanner && renderScopedError("banners")}

              {isLoadingData ? (
                <AdminTableSkeleton rows={3} />
              ) : (
                <>
                  <div className={`${styles.tableToolbar} ${styles.tableToolbarWithAction}`}>
                    <AdminSearchField
                      value={bannerSearch}
                      onChange={setBannerSearch}
                      placeholder="Search banner title or subtitle"
                      ariaLabel="Search banners"
                    />
                    <button
                      type="button"
                      className={styles.tableToolbar__addButton}
                      onClick={() => setIsBannerDialogOpen(true)}
                    >
                      <Plus size={14} />
                      Add Banner
                    </button>
                  </div>
                  <p className={styles.projectManager__editHint}>
                    {bannerSearch.trim().length > 0
                      ? "Clear search to drag and reorder banners."
                      : "Drag rows to reorder banners in the public sequence."}
                  </p>

                  {isBannerDialogOpen && (
                    <div
                      className={styles.adminDialog}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="banner-dialog-title"
                    >
                      <button
                        type="button"
                        className={styles.adminDialog__backdrop}
                        aria-label="Close add banner dialog"
                        onClick={() => setIsBannerDialogOpen(false)}
                      />
                      <div className={styles.adminDialog__panel}>
                        <div className={styles.adminDialog__header}>
                          <div>
                            <h3 id="banner-dialog-title">Add Banner</h3>
                            <p>Create a banner entry shown after Intelligent IT Solutions.</p>
                          </div>
                          <button
                            type="button"
                            className={styles.adminDialog__close}
                            aria-label="Close add banner dialog"
                            title="Close"
                            onClick={() => setIsBannerDialogOpen(false)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {renderScopedError("banners")}

                        <form className={styles.projectManager__createForm} onSubmit={addBanner}>
                          <label className={styles.projectManager__field}>
                            <span>Banner title</span>
                            <input
                              type="text"
                              value={bannerTitle}
                              onChange={(event) => setBannerTitle(event.target.value)}
                              placeholder="AI Workflow Automation & Process Integration"
                              required
                              autoFocus
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Banner subtitle</span>
                            <textarea
                              value={bannerSubtitle}
                              onChange={(event) => setBannerSubtitle(event.target.value)}
                              placeholder="Smart, scalable services designed to reduce friction."
                              rows={4}
                              required
                            />
                          </label>
                          <AdminImageField
                            id="banner-image"
                            label="Banner image"
                            file={bannerImageFile}
                            inputKey={bannerImageInputKey}
                            onChange={setBannerImageFile}
                          />
                          <div className={styles.adminDialog__actions}>
                            <button
                              type="button"
                              className={styles.adminDialog__secondary}
                              onClick={() => setIsBannerDialogOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className={styles.projectManager__createButton}
                              disabled={isBannerCreating}
                            >
                              <Plus size={14} />
                              {isBannerCreating ? "Adding..." : "Add Banner"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {editingBanner && (
                    <div
                      className={styles.adminDialog}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="banner-edit-dialog-title"
                    >
                      <button
                        type="button"
                        className={styles.adminDialog__backdrop}
                        aria-label="Close edit banner dialog"
                        onClick={closeBannerEditor}
                      />
                      <div className={styles.adminDialog__panel}>
                        <div className={styles.adminDialog__header}>
                          <div>
                            <h3 id="banner-edit-dialog-title">Edit Banner</h3>
                            <p>Update standalone banner content shown after IIS.</p>
                          </div>
                          <button
                            type="button"
                            className={styles.adminDialog__close}
                            aria-label="Close edit banner dialog"
                            title="Close"
                            onClick={closeBannerEditor}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {renderScopedError("banners")}

                        <form className={styles.projectManager__createForm} onSubmit={updateBanner}>
                          <label className={styles.projectManager__field}>
                            <span>Banner title</span>
                            <input
                              type="text"
                              value={bannerEditTitle}
                              onChange={(event) => setBannerEditTitle(event.target.value)}
                              required
                              autoFocus
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Banner subtitle</span>
                            <textarea
                              value={bannerEditSubtitle}
                              onChange={(event) => setBannerEditSubtitle(event.target.value)}
                              rows={4}
                              required
                            />
                          </label>
                          <AdminImageField
                            id="banner-edit-image"
                            label="Replace banner image"
                            file={bannerEditImageFile}
                            inputKey={bannerEditImageInputKey}
                            onChange={setBannerEditImageFile}
                          />
                          <div className={styles.adminDialog__actions}>
                            <button
                              type="button"
                              className={styles.adminDialog__secondary}
                              onClick={closeBannerEditor}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className={styles.projectManager__createButton}
                              disabled={bannerSavingId === editingBanner.id}
                            >
                              <Pencil size={14} />
                              {bannerSavingId === editingBanner.id ? "Saving..." : "Save Banner"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {visibleBanners.length === 0 ? (
                    <AdminEmptyState
                      title={
                        content.banners.length === 0
                          ? "No banners to load"
                          : "No matching banners"
                      }
                      message={
                        content.banners.length === 0
                          ? "Create your first banner to populate the section below Intelligent IT Solutions."
                          : "No banners match your current search."
                      }
                    />
                  ) : (
                    <div className={styles.table}>
                      {visibleBanners.map((item) => (
                        <article
                          key={item.id}
                          className={`${styles.table__row} ${styles["table__row--draggable"]} ${
                            draggedBannerId === item.id ? styles["table__row--dragging"] : ""
                          } ${
                            bannerDropTargetId === item.id &&
                            draggedBannerId !== item.id &&
                            canReorderBanners
                              ? styles["table__row--dragTarget"]
                              : ""
                          }`}
                          draggable={canReorderBanners}
                          onDragStart={(event) => handleBannerDragStart(event, item.id)}
                          onDragOver={(event) => handleBannerDragOver(event, item.id)}
                          onDrop={(event) => void handleBannerDrop(event, item.id)}
                          onDragEnd={clearBannerDragState}
                        >
                          <span
                            className={`${styles.table__dragHandle} ${
                              !canReorderBanners ? styles["table__dragHandle--disabled"] : ""
                            }`}
                            aria-hidden="true"
                          >
                            <GripVertical size={14} />
                          </span>
                          <div className={styles.table__itemContent}>
                            <img
                              src={item.imageUrl || adminImagePlaceholder}
                              alt=""
                              className={styles.table__thumb}
                            />
                            <div>
                              <h4>{item.title}</h4>
                              <p>{item.subtitle}</p>
                            </div>
                          </div>
                          <span className={styles.table__badge}>#{item.sortOrder + 1}</span>
                          <div className={styles.table__actions}>
                            <button
                              type="button"
                              title="Edit banner"
                              aria-label={`Edit ${item.title}`}
                              onClick={() => openBannerEditor(item)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => void deleteBanner(item.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === "workExperiences" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Work Experience</h2>
                <p>Manage professional experience cards shown in the public portfolio.</p>
              </div>
              {!isWorkDialogOpen && !editingWorkExperience && renderScopedError("workExperiences")}

              {isLoadingData ? (
                <AdminTableSkeleton rows={3} />
              ) : (
                <>
                  <div className={`${styles.tableToolbar} ${styles.tableToolbarWithAction}`}>
                    <AdminSearchField
                      value={workSearch}
                      onChange={setWorkSearch}
                      placeholder="Search company, role, location, or summary"
                      ariaLabel="Search work experience"
                    />
                    <button
                      type="button"
                      className={styles.tableToolbar__addButton}
                      onClick={() => setIsWorkDialogOpen(true)}
                    >
                      <Plus size={14} />
                      Add Work Experience
                    </button>
                  </div>

                  {isWorkDialogOpen && (
                    <div
                      className={styles.adminDialog}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="work-dialog-title"
                    >
                      <button
                        type="button"
                        className={styles.adminDialog__backdrop}
                        aria-label="Close add work experience dialog"
                        onClick={() => setIsWorkDialogOpen(false)}
                      />
                      <div className={styles.adminDialog__panel}>
                        <div className={styles.adminDialog__header}>
                          <div>
                            <h3 id="work-dialog-title">Add Work Experience</h3>
                            <p>Create a role card for the public work experience section.</p>
                          </div>
                          <button
                            type="button"
                            className={styles.adminDialog__close}
                            aria-label="Close add work experience dialog"
                            title="Close"
                            onClick={() => setIsWorkDialogOpen(false)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {renderScopedError("workExperiences")}

                        <form className={styles.projectManager__createForm} onSubmit={addWorkExperience}>
                          <label className={styles.projectManager__field}>
                            <span>Company</span>
                            <input
                              type="text"
                              value={workCompany}
                              onChange={(event) => setWorkCompany(event.target.value)}
                              placeholder="Company name"
                              required
                              autoFocus
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Role</span>
                            <input
                              type="text"
                              value={workRole}
                              onChange={(event) => setWorkRole(event.target.value)}
                              placeholder="Software Developer"
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Duration</span>
                            <input
                              type="text"
                              value={workDuration}
                              onChange={(event) => setWorkDuration(event.target.value)}
                              placeholder="2023 - Present"
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Location</span>
                            <input
                              type="text"
                              value={workLocation}
                              onChange={(event) => setWorkLocation(event.target.value)}
                              placeholder="Remote"
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Summary</span>
                            <textarea
                              value={workSummary}
                              onChange={(event) => setWorkSummary(event.target.value)}
                              placeholder="Brief role summary"
                              rows={4}
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Highlights</span>
                            <textarea
                              value={workHighlights}
                              onChange={(event) => setWorkHighlights(event.target.value)}
                              placeholder="One highlight per line"
                              rows={4}
                            />
                          </label>
                          <AdminImageField
                            id="work-image"
                            label="Company image or logo"
                            file={workImageFile}
                            inputKey={workImageInputKey}
                            onChange={setWorkImageFile}
                          />
                          <div className={styles.adminDialog__actions}>
                            <button
                              type="button"
                              className={styles.adminDialog__secondary}
                              onClick={() => setIsWorkDialogOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className={styles.projectManager__createButton}
                              disabled={isWorkCreating}
                            >
                              <Plus size={14} />
                              {isWorkCreating ? "Adding..." : "Add Work Experience"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {editingWorkExperience && (
                    <div
                      className={styles.adminDialog}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="work-edit-dialog-title"
                    >
                      <button
                        type="button"
                        className={styles.adminDialog__backdrop}
                        aria-label="Close edit work experience dialog"
                        onClick={closeWorkExperienceEditor}
                      />
                      <div className={styles.adminDialog__panel}>
                        <div className={styles.adminDialog__header}>
                          <div>
                            <h3 id="work-edit-dialog-title">Edit Work Experience</h3>
                            <p>Update this public work experience card.</p>
                          </div>
                          <button
                            type="button"
                            className={styles.adminDialog__close}
                            aria-label="Close edit work experience dialog"
                            title="Close"
                            onClick={closeWorkExperienceEditor}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {renderScopedError("workExperiences")}

                        <form className={styles.projectManager__createForm} onSubmit={updateWorkExperience}>
                          <label className={styles.projectManager__field}>
                            <span>Company</span>
                            <input
                              type="text"
                              value={workEditCompany}
                              onChange={(event) => setWorkEditCompany(event.target.value)}
                              required
                              autoFocus
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Role</span>
                            <input
                              type="text"
                              value={workEditRole}
                              onChange={(event) => setWorkEditRole(event.target.value)}
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Duration</span>
                            <input
                              type="text"
                              value={workEditDuration}
                              onChange={(event) => setWorkEditDuration(event.target.value)}
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Location</span>
                            <input
                              type="text"
                              value={workEditLocation}
                              onChange={(event) => setWorkEditLocation(event.target.value)}
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Summary</span>
                            <textarea
                              value={workEditSummary}
                              onChange={(event) => setWorkEditSummary(event.target.value)}
                              rows={4}
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Highlights</span>
                            <textarea
                              value={workEditHighlights}
                              onChange={(event) => setWorkEditHighlights(event.target.value)}
                              placeholder="One highlight per line"
                              rows={4}
                            />
                          </label>
                          <AdminImageField
                            id="work-edit-image"
                            label="Replace company image or logo"
                            file={workEditImageFile}
                            inputKey={workEditImageInputKey}
                            onChange={setWorkEditImageFile}
                          />
                          <div className={styles.adminDialog__actions}>
                            <button
                              type="button"
                              className={styles.adminDialog__secondary}
                              onClick={closeWorkExperienceEditor}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className={styles.projectManager__createButton}
                              disabled={workSavingId === editingWorkExperience.id}
                            >
                              <Pencil size={14} />
                              {workSavingId === editingWorkExperience.id
                                ? "Saving..."
                                : "Save Work Experience"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {visibleWorkExperiences.length === 0 ? (
                    <AdminEmptyState
                      title={
                        content.workExperiences.length === 0
                          ? "No work experience to load"
                          : "No matching work experience"
                      }
                      message={
                        content.workExperiences.length === 0
                          ? "Create your first work experience entry for the public portfolio."
                          : "No work experience entries match your current search."
                      }
                    />
                  ) : (
                    <div className={styles.table}>
                      {visibleWorkExperiences.map((item) => (
                        <article key={item.id} className={styles.table__row}>
                          <div className={styles.table__itemContent}>
                            <img
                              src={item.imageUrl || adminImagePlaceholder}
                              alt=""
                              className={styles.table__thumb}
                            />
                            <div>
                              <h4>{item.company}</h4>
                              <p>{item.role} | {item.duration} | {item.location}</p>
                            </div>
                          </div>
                          <span className={styles.table__badge}>#{item.sortOrder + 1}</span>
                          <div className={styles.table__actions}>
                            <button
                              type="button"
                              title="Edit work experience"
                              aria-label={`Edit ${item.company}`}
                              onClick={() => openWorkExperienceEditor(item)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => void deleteWorkExperience(item.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === "certificates" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Certificates</h2>
                <p>Track certificate metadata and display ordering.</p>
              </div>
              {!isCertificateDialogOpen && renderScopedError("certificates")}

              {isLoadingData ? (
                <AdminTableSkeleton rows={3} />
              ) : (
                <>
              <div className={`${styles.tableToolbar} ${styles.tableToolbarWithAction}`}>
                <AdminSearchField
                  value={certificateSearch}
                  onChange={setCertificateSearch}
                  placeholder="Search certificate, issuer, or date"
                  ariaLabel="Search certificates"
                />
                <button
                  type="button"
                  className={styles.tableToolbar__addButton}
                  onClick={() => setIsCertificateDialogOpen(true)}
                >
                  <Plus size={14} />
                  Add Certificate
                </button>
              </div>

              {isCertificateDialogOpen && (
                <div
                  className={styles.adminDialog}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="certificate-dialog-title"
                >
                  <button
                    type="button"
                    className={styles.adminDialog__backdrop}
                    aria-label="Close add certificate dialog"
                    onClick={() => setIsCertificateDialogOpen(false)}
                  />
                  <div className={styles.adminDialog__panel}>
                    <div className={styles.adminDialog__header}>
                      <div>
                        <h3 id="certificate-dialog-title">Add Certificate</h3>
                        <p>Create a certificate entry for your credentials list.</p>
                      </div>
                      <button
                        type="button"
                        className={styles.adminDialog__close}
                        aria-label="Close add certificate dialog"
                        title="Close"
                        onClick={() => setIsCertificateDialogOpen(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {renderScopedError("certificates")}

                    <form
                      className={styles.projectManager__createForm}
                      onSubmit={addCertificate}
                    >
                      <label className={styles.projectManager__field}>
                        <span>Certificate title</span>
                        <input
                          type="text"
                          value={certTitle}
                          onChange={(event) => setCertTitle(event.target.value)}
                          placeholder="Frontend Development"
                          required
                          autoFocus
                        />
                      </label>
                      <label className={styles.projectManager__field}>
                        <span>Issuer</span>
                        <input
                          type="text"
                          value={certIssuer}
                          onChange={(event) => setCertIssuer(event.target.value)}
                          placeholder="KodeGo"
                          required
                        />
                      </label>
                      <label className={styles.projectManager__field}>
                        <span>Issue date</span>
                        <AdminDatePicker value={certDate} onChange={setCertDate} />
                      </label>
                      <AdminImageField
                        id="certificate-image"
                        label="Certificate image"
                        file={certificateImageFile}
                        inputKey={certificateImageInputKey}
                        onChange={setCertificateImageFile}
                      />
                      <div className={styles.adminDialog__actions}>
                        <button
                          type="button"
                          className={styles.adminDialog__secondary}
                          onClick={() => setIsCertificateDialogOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className={styles.projectManager__createButton}
                          disabled={isCertificateCreating}
                        >
                          <Plus size={14} />
                          {isCertificateCreating ? "Adding..." : "Add Certificate"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {visibleCertificates.length === 0 ? (
                <AdminEmptyState
                  title={
                    content.certificates.length === 0
                      ? "No certificates to load"
                      : "No matching certificates"
                  }
                  message={
                    content.certificates.length === 0
                      ? "Add your first certificate to start building the credentials list."
                      : "No certificates match your current search."
                  }
                />
              ) : (
                <div className={styles.table}>
                  {visibleCertificates.map((item) => (
                    <article key={item.id} className={styles.table__row}>
                      <div className={styles.table__itemContent}>
                        <img
                          src={item.imageUrl || adminImagePlaceholder}
                          alt=""
                          className={styles.table__thumb}
                        />
                        <div>
                          <h4>{item.title}</h4>
                          <p>{item.issuer}</p>
                        </div>
                      </div>
                      <span className={styles.table__badge}>{item.date}</span>
                      <button type="button" onClick={() => void deleteCertificate(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
                </>
              )}
            </section>
          )}

          {activeSection === "clients" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Clients</h2>
                <p>Add clients and send one-time review invitations.</p>
              </div>
              {!isClientDialogOpen && renderScopedError("clients")}
              {clientsNotice && <p className={styles.admin__notice}>{clientsNotice}</p>}

              {isLoadingData ? (
                <>
                  <AdminTableSkeleton rows={4} />
                </>
              ) : (
                <>
                  <div className={`${styles.tableToolbar} ${styles.tableToolbarWithAction}`}>
                    <AdminSearchField
                      value={clientSearch}
                      onChange={setClientSearch}
                      placeholder="Search name, email, company, or role"
                      ariaLabel="Search clients"
                    />
                    <button
                      type="button"
                      className={styles.tableToolbar__addButton}
                      onClick={() => setIsClientDialogOpen(true)}
                    >
                      <Plus size={14} />
                      Add Client
                    </button>
                  </div>

                  {isClientDialogOpen && (
                    <div
                      className={styles.adminDialog}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="client-dialog-title"
                    >
                      <button
                        type="button"
                        className={styles.adminDialog__backdrop}
                        aria-label="Close add client dialog"
                        onClick={() => setIsClientDialogOpen(false)}
                      />
                      <div className={styles.adminDialog__panel}>
                        <div className={styles.adminDialog__header}>
                          <div>
                            <h3 id="client-dialog-title">Add Client</h3>
                            <p>Email is required because invitations are sent directly.</p>
                          </div>
                          <button
                            type="button"
                            className={styles.adminDialog__close}
                            aria-label="Close add client dialog"
                            title="Close"
                            onClick={() => setIsClientDialogOpen(false)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {renderScopedError("clients")}

                        <form className={styles.projectManager__createForm} onSubmit={addClient}>
                          <AdminImageField
                            id="client-profile-image"
                            label="Profile image"
                            file={clientImageFile}
                            inputKey={clientImageInputKey}
                            onChange={(file) => {
                              setClientImageFile(file);
                              clearAdminError("clients");
                            }}
                          />
                          <label className={styles.projectManager__field}>
                            <span>Client name</span>
                            <input
                              type="text"
                              value={clientName}
                              onChange={(event) => setClientName(event.target.value)}
                              placeholder="Client name"
                              required
                              autoFocus
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Email address</span>
                            <input
                              type="email"
                              value={clientEmail}
                              onChange={(event) => setClientEmail(event.target.value)}
                              placeholder="client@example.com"
                              required
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Company</span>
                            <input
                              type="text"
                              value={clientCompany}
                              onChange={(event) => setClientCompany(event.target.value)}
                              placeholder="Optional company"
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Role</span>
                            <input
                              type="text"
                              value={clientRole}
                              onChange={(event) => setClientRole(event.target.value)}
                              placeholder="Optional role"
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Notes</span>
                            <textarea
                              value={clientNotes}
                              onChange={(event) => setClientNotes(event.target.value)}
                              placeholder="Optional internal notes"
                              rows={4}
                            />
                          </label>
                          <div className={styles.adminDialog__actions}>
                            <button
                              type="button"
                              className={styles.adminDialog__secondary}
                              onClick={() => setIsClientDialogOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className={styles.projectManager__createButton}
                              disabled={clientSaving}
                            >
                              <Plus size={14} />
                              {clientSaving ? "Adding..." : "Add Client"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {visibleClients.length === 0 ? (
                    <AdminEmptyState
                      title={clients.length === 0 ? "No clients to load" : "No matching clients"}
                      message={
                        clients.length === 0
                          ? "Add a client, then send a one-time invitation for their review."
                          : "No clients match your current search."
                      }
                    />
                  ) : (
                    <div className={styles.table}>
                      {visibleClients.map((client) => {
                        const isInviting = clientInvitingId === client.id;
                        const isDeleting = clientDeletingId === client.id;
                        return (
                          <article key={client.id} className={styles.table__row}>
                            <div className={styles.table__itemContent}>
                              <img
                                src={client.imageUrl || adminImagePlaceholder}
                                alt=""
                                className={styles.table__avatar}
                              />
                              <div>
                                <h4>{client.name}</h4>
                                <p>{client.email}</p>
                                <p>
                                  {[client.company, client.role].filter(Boolean).join(" / ") ||
                                    "No company or role set"}
                                </p>
                                {client.invitation && (
                                  <p>
                                    Invitation expires{" "}
                                    {new Date(client.invitation.expiresAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={styles.table__badge}>
                              {client.invitation ? "Invited" : `${client.reviewCount} Reviews`}
                            </span>
                            <div className={styles.table__actions}>
                              <button
                                type="button"
                                className={styles.table__actionApprove}
                                disabled={isInviting || isDeleting}
                                onClick={() => void sendClientReviewInvitation(client.id)}
                              >
                                {client.invitation ? <RefreshCw size={13} /> : <Send size={13} />}
                                {isInviting
                                  ? "Sending..."
                                  : client.invitation
                                    ? "Resend"
                                    : "Invite"}
                              </button>
                              <button
                                type="button"
                                className={styles.table__actionReject}
                                disabled={isInviting || isDeleting}
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    `Delete client "${client.name}"?`,
                                  );
                                  if (!confirmed) return;
                                  void deleteClient(client.id);
                                }}
                              >
                                <Trash2 size={13} />
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === "contracts" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Contracts</h2>
                <p>Create reusable contract templates, generate signed links, and send them to recipients.</p>
              </div>
              {renderScopedError("contracts")}
              {contractsNotice && <p className={styles.admin__notice}>{contractsNotice}</p>}

              {isLoadingData ? (
                <>
                  <AdminFormSkeleton fields={6} />
                  <AdminTableSkeleton rows={4} />
                </>
              ) : (
                <>
                  <div className={`${styles.tableToolbar} ${styles.tableToolbarWithAction}`}>
                    <AdminSearchField
                      value={contractSearch}
                      onChange={setContractSearch}
                      placeholder="Search title, recipient, template, or status"
                      ariaLabel="Search contracts"
                    />
                    <button
                      type="button"
                      className={styles.tableToolbar__addButton}
                      onClick={() => openContractDraft()}
                    >
                      <Plus size={14} />
                      Draft Contract
                    </button>
                  </div>

                  {contractTemplates.length > 0 && (
                    <div className={styles.contractsTemplates}>
                      <div className={styles.contractsTemplates__header}>
                        <div>
                          <span>Saved templates</span>
                          <strong>{contractTemplates.length} available</strong>
                        </div>
                      </div>
                      {contractTemplates.map((template) => (
                        <article key={template.id} className={styles.contractsTemplateItem}>
                          <div>
                            <h4>{template.name}</h4>
                            <p>{template.title}</p>
                          </div>
                          <span>{template.contractCount} contracts</span>
                          <button
                            type="button"
                            aria-label={`Open ${template.name} in contract draft`}
                            title="Open draft"
                            onClick={() => openContractDraft(template)}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={contractTemplateDeletingId === template.id}
                            onClick={() => {
                              const confirmed = window.confirm(
                                `Delete contract template "${template.name}"? Existing contracts will keep their content.`,
                              );
                              if (!confirmed) return;
                              void deleteContractTemplate(template.id);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className={styles.contractsListHeader}>
                    <div>
                      <span>Contract links</span>
                      <strong>Generated contracts</strong>
                    </div>
                    <span className={styles.contractsToolbarCount}>
                      {visibleContracts.length} of {contracts.length} shown
                    </span>
                  </div>

                  {visibleContracts.length === 0 ? (
                    <AdminEmptyState
                      title={contracts.length === 0 ? "No contracts yet" : "No matching contracts"}
                      message={
                        contracts.length === 0
                          ? "Create a contract link from a template or blank draft."
                          : "No contracts match your current search."
                      }
                    />
                  ) : (
                    <div className={styles.table}>
                      {visibleContracts.map((contract) => {
                        const isSending = contractSendingId === contract.id;
                        const isDeleting = contractDeletingId === contract.id;
                        return (
                          <article key={contract.id} className={styles.table__row}>
                            <div className={styles.contractsTableContent}>
                              <h4>{contract.title}</h4>
                              <p>
                                {contract.recipientName}
                                {contract.recipientEmail ? ` / ${contract.recipientEmail}` : ""}
                              </p>
                              <p>
                                {contract.template?.name ?? "Blank contract"} / Created{" "}
                                {new Date(contract.createdAt).toLocaleString()}
                              </p>
                              <p>
                                {contract.pdfDocument.fileName} / {contract.fields.length} items
                              </p>
                              <a
                                className={styles.contractsLink}
                                href={contract.contractUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {contract.contractUrl}
                              </a>
                            </div>
                            <span className={styles.table__badge}>
                              {contract.submittedAt
                                ? "Submitted"
                                : contract.viewedAt
                                  ? "Viewed"
                                  : contract.sentAt
                                    ? "Sent"
                                    : "Draft Link"}
                            </span>
                            <div className={styles.table__actions}>
                              <button
                                type="button"
                                disabled={isSending || isDeleting}
                                onClick={() => void copyContractLink(contract)}
                              >
                                <Link2 size={13} />
                                Copy
                              </button>
                              <button
                                type="button"
                                className={styles.table__actionApprove}
                                disabled={!contract.recipientEmail || isSending || isDeleting}
                                onClick={() => void sendContractEmail(contract.id)}
                              >
                                <Send size={13} />
                                {isSending ? "Sending..." : "Email"}
                              </button>
                              <button
                                type="button"
                                className={styles.table__actionReject}
                                disabled={isSending || isDeleting}
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    `Delete contract "${contract.title}"?`,
                                  );
                                  if (!confirmed) return;
                                  void deleteContract(contract.id);
                                }}
                              >
                                <Trash2 size={13} />
                                {isDeleting ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === "reviews" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Reviews</h2>
                <p>Edit submitted feedback and approve what appears on the portfolio.</p>
              </div>
              {!editingReview && renderScopedError("reviews")}

              {isLoadingData ? (
                <AdminTableSkeleton rows={4} />
              ) : (
                <>
                  <div className={`${styles.tableToolbar} ${styles.tableToolbarTwoFields}`}>
                    <AdminSearchField
                      value={reviewSearch}
                      onChange={setReviewSearch}
                      placeholder="Search client, email, status, or review"
                      ariaLabel="Search reviews"
                    />
                    <AdminSelect
                      value={reviewStatusFilter}
                      ariaLabel="Filter reviews by status"
                      options={[
                        { value: "All" as const, label: "All statuses" },
                        { value: "Pending" as const, label: "Pending approval" },
                        { value: "Approved" as const, label: "Approved" },
                      ]}
                      onChange={setReviewStatusFilter}
                    />
                  </div>

                  {editingReview && (
                    <div
                      className={styles.adminDialog}
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="review-dialog-title"
                    >
                      <button
                        type="button"
                        className={styles.adminDialog__backdrop}
                        aria-label="Close edit review dialog"
                        onClick={() => setEditingReview(null)}
                      />
                      <div className={styles.adminDialog__panel}>
                        <div className={styles.adminDialog__header}>
                          <div>
                            <h3 id="review-dialog-title">Edit Review</h3>
                            <p>Changes are admin-only. The client review link stays expired.</p>
                          </div>
                          <button
                            type="button"
                            className={styles.adminDialog__close}
                            aria-label="Close edit review dialog"
                            title="Close"
                            onClick={() => setEditingReview(null)}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        {renderScopedError("reviews")}

                        <form className={styles.projectManager__createForm} onSubmit={saveReviewEdit}>
                          <label className={styles.projectManager__field}>
                            <span>Client name</span>
                            <input
                              type="text"
                              value={reviewEditName}
                              onChange={(event) => setReviewEditName(event.target.value)}
                              required
                              autoFocus
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Role or company label</span>
                            <input
                              type="text"
                              value={reviewEditRole}
                              onChange={(event) => setReviewEditRole(event.target.value)}
                              placeholder="Client, Founder, Company"
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Rating</span>
                            <AdminSelect
                              value={reviewEditRating}
                              ariaLabel="Review rating"
                              options={reviewRatingOptions}
                              onChange={setReviewEditRating}
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Feedback excerpt</span>
                            <textarea
                              value={reviewEditFeedback}
                              onChange={(event) => setReviewEditFeedback(event.target.value)}
                              required
                              rows={4}
                            />
                          </label>
                          <label className={styles.projectManager__field}>
                            <span>Detailed feedback</span>
                            <textarea
                              value={reviewEditDetail}
                              onChange={(event) => setReviewEditDetail(event.target.value)}
                              rows={5}
                            />
                          </label>
                          <div className={styles.adminDialog__actions}>
                            <button
                              type="button"
                              className={styles.adminDialog__secondary}
                              onClick={() => setEditingReview(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className={styles.projectManager__createButton}
                              disabled={reviewSavingId === editingReview.id}
                            >
                              <Pencil size={14} />
                              {reviewSavingId === editingReview.id ? "Saving..." : "Save Review"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {visibleReviews.length === 0 ? (
                    <AdminEmptyState
                      title={
                        content.reviews.length === 0
                          ? "No reviews to load"
                          : "No matching reviews"
                      }
                      message={
                        content.reviews.length === 0
                          ? "Reviews appear here after a client submits an invitation link."
                          : "No reviews match your current search and status filter."
                      }
                    />
                  ) : (
                    <div className={styles.table}>
                      {visibleReviews.map((item) => {
                        const isApproving = reviewApprovingId === item.id;
                        const isDeleting = reviewDeletingId === item.id;
                        return (
                          <article key={item.id} className={styles.table__row}>
                            <div>
                              <h4>{item.client}</h4>
                              <p>{item.clientEmail || item.role || "Client review"}</p>
                              <p>{item.excerpt}</p>
                              <p>Submitted: {new Date(item.createdAt).toLocaleString()}</p>
                            </div>
                            <span className={styles.table__badge}>
                              {item.status} / {item.rating} Stars
                            </span>
                            <div className={styles.table__actions}>
                              <button
                                type="button"
                                onClick={() => openReviewEditor(item)}
                                disabled={isApproving || isDeleting}
                              >
                                <Pencil size={13} />
                              </button>
                              {item.status === "Pending" && (
                                <button
                                  type="button"
                                  className={styles.table__actionApprove}
                                  disabled={isApproving || isDeleting}
                                  onClick={() => void approveReview(item.id)}
                                >
                                  <CheckCircle2 size={13} />
                                  {isApproving ? "Approving..." : "Approve"}
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.table__actionReject}
                                disabled={isApproving || isDeleting}
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    item.status === "Pending"
                                      ? `Decline and delete ${item.client}'s review?`
                                      : `Delete ${item.client}'s review?`,
                                  );
                                  if (!confirmed) return;
                                  void deleteReview(item.id);
                                }}
                              >
                                <Trash2 size={13} />
                                {isDeleting
                                  ? "Deleting..."
                                  : item.status === "Pending"
                                    ? "Decline"
                                    : "Delete"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {activeSection === "contacts" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>Contacts</h2>
                <p>Configure contact details shown on the client side.</p>
              </div>
              {renderScopedError("contacts")}

              {isLoadingData ? (
                <AdminFormSkeleton fields={7} />
              ) : (
                <div className={styles.contactsView}>
                  <form className={styles.contactsEditor} onSubmit={saveContacts}>
                    <div className={styles.contactsEditor__intro}>
                      <span className={styles.contactsEditor__eyebrow}>Contact routing</span>
                      <h3>Keep every public contact path current.</h3>
                      <p>
                        Empty fields stay hidden on the portfolio. Add only the channels you
                        actively monitor.
                      </p>
                    </div>

                    <div className={styles.contactsFieldGrid}>
                      <label className={styles.contactsField}>
                        <div className={styles.contactsField__header}>
                          <span>Email</span>
                          <button
                            type="button"
                            onClick={() => setShowContactEmail((prev) => !prev)}
                            aria-label={showContactEmail ? "Hide email contact" : "Show email contact"}
                            title={showContactEmail ? "Hide" : "Show"}
                          >
                            {showContactEmail ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(event) => setContactEmail(event.target.value)}
                          placeholder="you@example.com"
                        />
                      </label>
                      <label className={styles.contactsField}>
                        <div className={styles.contactsField__header}>
                          <span>Phone</span>
                          <button
                            type="button"
                            onClick={() => setShowContactPhone((prev) => !prev)}
                            aria-label={showContactPhone ? "Hide phone contact" : "Show phone contact"}
                            title={showContactPhone ? "Hide" : "Show"}
                          >
                            {showContactPhone ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={contactPhone}
                          onChange={(event) => setContactPhone(event.target.value)}
                          placeholder="+63 900 000 0000"
                        />
                      </label>
                      <label className={styles.contactsField}>
                        <div className={styles.contactsField__header}>
                          <span>Instagram URL</span>
                          <button
                            type="button"
                            onClick={() => setShowContactInstagram((prev) => !prev)}
                            aria-label={
                              showContactInstagram ? "Hide Instagram contact" : "Show Instagram contact"
                            }
                            title={showContactInstagram ? "Hide" : "Show"}
                          >
                            {showContactInstagram ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                        <input
                          type="text"
                          inputMode="url"
                          value={contactInstagramUrl}
                          onChange={(event) => setContactInstagramUrl(event.target.value)}
                          onBlur={(event) => setContactInstagramUrl(normalizeUrlInput(event.target.value))}
                          placeholder="https://instagram.com/username"
                        />
                      </label>
                      <label className={styles.contactsField}>
                        <div className={styles.contactsField__header}>
                          <span>WhatsApp URL</span>
                          <button
                            type="button"
                            onClick={() => setShowContactWhatsapp((prev) => !prev)}
                            aria-label={
                              showContactWhatsapp ? "Hide WhatsApp contact" : "Show WhatsApp contact"
                            }
                            title={showContactWhatsapp ? "Hide" : "Show"}
                          >
                            {showContactWhatsapp ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                        <input
                          type="text"
                          inputMode="url"
                          value={contactWhatsappUrl}
                          onChange={(event) => setContactWhatsappUrl(event.target.value)}
                          onBlur={(event) => setContactWhatsappUrl(normalizeUrlInput(event.target.value))}
                          placeholder="https://wa.me/..."
                        />
                      </label>
                      <label className={styles.contactsField}>
                        <div className={styles.contactsField__header}>
                          <span>Telegram URL</span>
                          <button
                            type="button"
                            onClick={() => setShowContactTelegram((prev) => !prev)}
                            aria-label={
                              showContactTelegram ? "Hide Telegram contact" : "Show Telegram contact"
                            }
                            title={showContactTelegram ? "Hide" : "Show"}
                          >
                            {showContactTelegram ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                        <input
                          type="text"
                          inputMode="url"
                          value={contactTelegramUrl}
                          onChange={(event) => setContactTelegramUrl(event.target.value)}
                          onBlur={(event) => setContactTelegramUrl(normalizeUrlInput(event.target.value))}
                          placeholder="https://t.me/username"
                        />
                      </label>
                      <label className={styles.contactsField}>
                        <div className={styles.contactsField__header}>
                          <span>LinkedIn URL</span>
                          <button
                            type="button"
                            onClick={() => setShowContactLinkedin((prev) => !prev)}
                            aria-label={
                              showContactLinkedin ? "Hide LinkedIn contact" : "Show LinkedIn contact"
                            }
                            title={showContactLinkedin ? "Hide" : "Show"}
                          >
                            {showContactLinkedin ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                        <input
                          type="text"
                          inputMode="url"
                          value={contactLinkedinUrl}
                          onChange={(event) => setContactLinkedinUrl(event.target.value)}
                          onBlur={(event) => setContactLinkedinUrl(normalizeUrlInput(event.target.value))}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </label>
                    </div>

                    <div className={styles.contactsEditor__footer}>
                      <div>
                        <strong>{configuredContactCount} of 6 channels configured</strong>
                        <span>
                          {contactConfig
                            ? `Last updated ${new Date(contactConfig.updatedAt).toLocaleString()}`
                            : "No saved contact configuration yet."}
                        </span>
                      </div>
                      <button type="submit" disabled={contactsSaving}>
                        <Plus size={14} />
                        {contactsSaving ? "Saving..." : "Save Contacts"}
                      </button>
                    </div>
                  </form>

                  <aside className={styles.contactsPreview} aria-label="Contact channel preview">
                    <div className={styles.contactsPreview__header}>
                      <div className={styles.contactsPreview__icon}>
                        <Link2 size={18} />
                      </div>
                      <div>
                        <h3>Live Channel Preview</h3>
                        <p>What the portfolio can load from your contact settings.</p>
                      </div>
                    </div>

                    <div className={styles.contactsChannelList}>
                      {contactChannels.map((channel) => {
                        const Icon = channel.icon;
                        return (
                          <div key={channel.label} className={styles.contactsChannel}>
                            <div className={styles.contactsChannel__icon}>
                              {"logo" in channel ? (
                                <img
                                  src={channel.logo}
                                  alt={`${channel.label} logo`}
                                  className={styles.contactsChannel__logo}
                                />
                              ) : (
                                <Icon size={16} />
                              )}
                            </div>
                            <div>
                              <span>{channel.label}</span>
                              {channel.value ? (
                                !channel.visible ? (
                                  <p>Hidden from public</p>
                                ) : channel.href ? (
                                  <a href={channel.href} target="_blank" rel="noreferrer">
                                    {channel.value}
                                  </a>
                                ) : (
                                  <p>{channel.value}</p>
                                )
                              ) : (
                                <p>Not configured</p>
                              )}
                              <small>{channel.visible ? channel.tone : "Visibility disabled"}</small>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {contactsNotice && <p className={styles.admin__notice}>{contactsNotice}</p>}
                  </aside>
                </div>
              )}
            </section>
          )}

          {activeSection === "cv" && (
            <section className={styles.panel}>
              <div className={styles.panel__header}>
                <h2>CV</h2>
                <p>Upload CV documents, select the active version, and preview what users receive.</p>
              </div>
              {renderScopedError("cv")}

              {isLoadingData ? (
                <>
                  <AdminFormSkeleton fields={2} />
                  <AdminTableSkeleton rows={1} withToolbar={false} />
                </>
              ) : (
                <>
                  {isCvDialogOpen && (
                  <div
                    className={styles.adminDialog}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cv-dialog-title"
                  >
                    <button
                      type="button"
                      className={styles.adminDialog__backdrop}
                      aria-label="Close add CV dialog"
                      onClick={() => setIsCvDialogOpen(false)}
                    />
                    <div className={`${styles.adminDialog__panel} ${styles["adminDialog__panel--wide"]}`}>
                      <div className={styles.adminDialog__header}>
                        <div>
                          <h3 id="cv-dialog-title">Add CV Item</h3>
                          <p>Upload both ATS Friendly and Visual Friendly documents.</p>
                        </div>
                        <button
                          type="button"
                          className={styles.adminDialog__close}
                          aria-label="Close add CV dialog"
                          title="Close"
                          onClick={() => setIsCvDialogOpen(false)}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <form className={styles.cvUpload} onSubmit={uploadCvAsset}>
                        <div className={styles.cvUpload__header}>
                          <span>Create CV item</span>
                          <strong>Upload both document versions</strong>
                          <p>ATS Friendly and Visual Friendly documents are required.</p>
                        </div>

                        <div className={styles.cvUpload__documents}>
                          <div className={styles.cvUpload__documentCard}>
                            <div className={styles.cvUpload__documentIntro}>
                              <span>ATS Friendly</span>
                              <p>Text-first CV for job portals and applicant tracking systems.</p>
                            </div>
                            <div
                              className={`${styles.cvUpload__dropzone} ${
                                cvAtsFile ? styles["cvUpload__dropzone--filled"] : ""
                              }`}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                const nextFile = event.dataTransfer.files?.[0] ?? null;
                                if (nextFile && isAllowedCvFile(nextFile)) {
                                  setCvAtsFile(nextFile);
                                  setCvNotice("");
                                  clearAdminError("cv");
                                } else if (nextFile) {
                                  showAdminError("cv", "CV file must be a PDF or DOCX document.");
                                }
                              }}
                            >
                              <input
                                key={cvAtsInputKey}
                                id="cv-upload-ats"
                                type="file"
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={(event) => {
                                  const nextFile = event.target.files?.[0] ?? null;
                                  setCvAtsFile(nextFile);
                                  setCvNotice("");
                                  clearAdminError("cv");
                                }}
                              />
                              {cvAtsFile ? (
                                <div className={styles.cvUpload__selected} aria-live="polite">
                                  <button
                                    type="button"
                                    className={styles.cvUpload__removeFile}
                                    aria-label="Remove selected ATS CV"
                                    title="Remove ATS CV"
                                    onClick={() => {
                                      setCvAtsFile(null);
                                      setCvAtsInputKey((prev) => prev + 1);
                                      setCvNotice("");
                                      clearAdminError("cv");
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                  <FileText size={22} />
                                  <span>{cvAtsFile.name}</span>
                                  <small>{getCvContentType(cvAtsFile)}</small>
                                </div>
                              ) : (
                                <label htmlFor="cv-upload-ats" className={styles.cvUpload__picker}>
                                  <FileText size={24} />
                                  <strong>Drop ATS CV or upload</strong>
                                  <span>PDF or DOCX only</span>
                                </label>
                              )}
                            </div>
                          </div>

                          <div className={styles.cvUpload__documentCard}>
                            <div className={styles.cvUpload__documentIntro}>
                              <span>Visual Friendly</span>
                              <p>Designed CV for direct sharing, with photos, icons, and QR codes.</p>
                            </div>
                            <div
                              className={`${styles.cvUpload__dropzone} ${
                                cvVisualFile ? styles["cvUpload__dropzone--filled"] : ""
                              }`}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                const nextFile = event.dataTransfer.files?.[0] ?? null;
                                if (nextFile && isAllowedCvFile(nextFile)) {
                                  setCvVisualFile(nextFile);
                                  setCvNotice("");
                                  clearAdminError("cv");
                                } else if (nextFile) {
                                  showAdminError("cv", "CV file must be a PDF or DOCX document.");
                                }
                              }}
                            >
                              <input
                                key={cvVisualInputKey}
                                id="cv-upload-visual"
                                type="file"
                                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={(event) => {
                                  const nextFile = event.target.files?.[0] ?? null;
                                  setCvVisualFile(nextFile);
                                  setCvNotice("");
                                  clearAdminError("cv");
                                }}
                              />
                              {cvVisualFile ? (
                                <div className={styles.cvUpload__selected} aria-live="polite">
                                  <button
                                    type="button"
                                    className={styles.cvUpload__removeFile}
                                    aria-label="Remove selected visual CV"
                                    title="Remove visual CV"
                                    onClick={() => {
                                      setCvVisualFile(null);
                                      setCvVisualInputKey((prev) => prev + 1);
                                      setCvNotice("");
                                      clearAdminError("cv");
                                    }}
                                  >
                                    <X size={14} />
                                  </button>
                                  <FileText size={22} />
                                  <span>{cvVisualFile.name}</span>
                                  <small>{getCvContentType(cvVisualFile)}</small>
                                </div>
                              ) : (
                                <label htmlFor="cv-upload-visual" className={styles.cvUpload__picker}>
                                  <FileText size={24} />
                                  <strong>Drop Visual CV or upload</strong>
                                  <span>PDF or DOCX only</span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className={styles.adminDialog__actions}>
                          <button
                            type="button"
                            className={styles.adminDialog__secondary}
                            onClick={() => setIsCvDialogOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className={styles.projectManager__createButton}
                            disabled={!cvAtsFile || !cvVisualFile || cvSaving}
                          >
                            <Plus size={14} />
                            {cvSaving ? "Submitting..." : "Submit CV"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                  <div className={styles.cvManager}>
                    <div className={styles.cvManager__top}>
                      <aside className={styles.cvPreview}>
                        <div className={styles.cvPreview__header}>
                          <div>
                            <span>Active resume previews</span>
                            <h3>
                              {activeCvAsset ? "ATS and Visual resumes" : "No active CV selected"}
                            </h3>
                            <p>
                              {activeCvAsset
                                ? `Updated ${new Date(activeCvAsset.updatedAt).toLocaleString()}`
                                : "Select an uploaded CV to make it available on the front page."}
                            </p>
                          </div>
                          {activeCvAsset && <span className={styles.cvPreview__badge}>Active</span>}
                        </div>

                        {activeCvAsset && activeCvPreviewDocuments.length > 0 ? (
                          <div className={styles.cvPreview__documents}>
                            {activeCvPreviewDocuments.map((item) => {
                              const isPdf = isPdfCvDocument(item.document);
                              const previewUrl = getCvDocumentPreviewUrl(item.document);
                              return (
                                <a
                                  key={item.label}
                                  className={styles.cvPreview__document}
                                  href={item.document.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Open ${item.label} CV`}
                                >
                                  <div className={styles.cvPreview__documentHeader}>
                                    <div>
                                      <span>{item.label}</span>
                                      <strong>{item.document.fileName}</strong>
                                    </div>
                                    <small>Tap to open</small>
                                  </div>

                                  {previewUrl ? (
                                    <div
                                      className={`${styles.cvPreview__documentViewport} ${
                                        isPdf
                                          ? styles["cvPreview__documentViewport--pdf"]
                                          : styles["cvPreview__documentViewport--office"]
                                      }`}
                                    >
                                      <iframe
                                        title={`Preview ${item.document.fileName}`}
                                        src={previewUrl}
                                        className={`${styles.cvPreview__documentFrame} ${
                                          isPdf
                                            ? styles["cvPreview__documentFrame--pdf"]
                                            : styles["cvPreview__documentFrame--office"]
                                        }`}
                                        loading="lazy"
                                        scrolling="no"
                                      />
                                    </div>
                                  ) : (
                                    <div className={styles.cvPreview__documentFallback}>
                                      <FileText size={40} />
                                      <strong>Document preview</strong>
                                      <p>{item.description}</p>
                                    </div>
                                  )}
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={styles.cvPreview__fallback}>
                            <FileText size={42} />
                            <strong>No active CV</strong>
                            <p>Upload a CV and mark it active so users can view and download it.</p>
                          </div>
                        )}
                      </aside>

                      <aside className={styles.cvListPanel}>
                      <div className={styles.cvListPanel__header}>
                        <div>
                          <span>Uploaded CVs</span>
                          <strong>
                            {cvAssets.length} {cvAssets.length === 1 ? "CV item" : "CV items"}
                          </strong>
                        </div>
                        <div className={styles.cvListPanel__controls}>
                          <button
                            type="button"
                            className={styles.cvListPanel__uploadButton}
                            onClick={() => setIsCvDialogOpen(true)}
                          >
                            <Plus size={14} />
                            Add CV
                          </button>
                          <AdminSelect
                            value={cvSortMode}
                            options={cvSortOptions}
                            onChange={setCvSortMode}
                            ariaLabel="Sort CV list"
                          />
                        </div>
                      </div>

                      {cvAssets.length === 0 ? (
                        <div className={styles.cvList__empty}>
                          <FileText size={42} />
                          <strong>No CVs uploaded</strong>
                          <p>Upload PDF or DOCX files to build your selectable CV list.</p>
                        </div>
                      ) : (
                        <div className={styles.cvList}>
                          {visibleCvAssets.map((asset) => {
                            const isActivating = cvActivatingId === asset.id;
                            const isDeleting = cvDeletingId === asset.id;
                            const uploadedAt = new Date(asset.createdAt).toLocaleString(undefined, {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            return (
                              <article key={asset.id} className={styles.cvList__item}>
                                <div className={styles.cvList__fileIcon}>
                                  <FileText size={18} />
                                </div>
                                <div className={styles.cvList__content}>
                                  <h4>{uploadedAt}</h4>
                                  <p>Uploaded CV item</p>
                                </div>
                                <span
                                  className={styles.cvList__downloadCount}
                                  title={`${asset.downloadCount} total downloads`}
                                  aria-label={`${asset.downloadCount} total downloads`}
                                >
                                  <BarChart3 size={15} />
                                  {asset.downloadCount}
                                </span>
                                <div className={styles.cvList__actions}>
                                  <button
                                    type="button"
                                    className={styles.cvList__iconButton}
                                    aria-label={asset.isActive ? "Active CV" : "Set CV active"}
                                    title={asset.isActive ? "Active CV" : "Set Active"}
                                    disabled={asset.isActive || isActivating || isDeleting}
                                    onClick={() => void setActiveCvAsset(asset.id)}
                                  >
                                    <CheckCircle2 size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className={`${styles.cvList__iconButton} ${styles["cvList__iconButton--danger"]}`}
                                    aria-label="Delete CV item"
                                    title="Delete"
                                    disabled={isActivating || isDeleting}
                                    onClick={() => {
                                      const confirmed = window.confirm(
                                        `Delete CV item uploaded ${uploadedAt}?`,
                                      );
                                      if (!confirmed) return;
                                      void deleteCvAsset(asset.id);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                      </aside>
                    </div>

                    {cvNotice && <p className={styles.admin__notice}>{cvNotice}</p>}

                    <aside className={`${styles.cvAnalytics} ${styles["cvAnalytics--wide"]}`}>
                      <div className={styles.cvAnalytics__header}>
                        <div>
                          <span>Active CV analytics</span>
                          <h3>{activeVisualCvDocument?.fileName ?? "No active CV"}</h3>
                        </div>
                        <BarChart3 size={18} />
                      </div>

                      <div className={styles.cvAnalytics__stats}>
                        <div>
                          <span>Users</span>
                          <strong>{activeCvDownloadPeople.length}</strong>
                        </div>
                        <div>
                          <span>Total</span>
                          <strong>{activeCvAsset?.downloadCount ?? 0}</strong>
                        </div>
                        <div>
                          <span>ATS</span>
                          <strong>{activeAtsDownloadCount}</strong>
                        </div>
                        <div>
                          <span>Visual</span>
                          <strong>{activeVisualDownloadCount}</strong>
                        </div>
                      </div>

                      <div className={styles.cvAnalytics__emails}>
                        <div className={styles.cvAnalytics__emailsHeader}>
                          <span>Downloader emails</span>
                          <small>
                            {activeCvDownloadPeople.length === 0
                              ? "No records"
                              : `${activeCvDownloadPeople.length} unique`}
                          </small>
                        </div>

                        {activeCvDownloadPeople.length === 0 ? (
                          <div className={styles.cvAnalytics__empty}>
                            <Mail size={34} />
                            <strong>No downloads yet</strong>
                            <p>Emails will appear here after users verify and download this CV.</p>
                          </div>
                        ) : (
                          <div className={styles.cvAnalytics__emailList}>
                            {activeCvDownloadPeople.map((person) => (
                              <article key={person.email} className={styles.cvAnalytics__emailItem}>
                                <span>{person.email}</span>
                                <small>
                                  Last download{" "}
                                  {person.latestDownloadAt
                                    ? new Date(person.latestDownloadAt).toLocaleString()
                                    : "unknown"}
                                </small>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    </aside>
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

