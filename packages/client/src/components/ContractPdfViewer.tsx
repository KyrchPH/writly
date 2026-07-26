import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent as ReactChangeEvent,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import styles from "./ContractPdfViewer.module.css";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type ContractPdfField = {
  id: string;
  type: "text" | "textbox" | "signature" | "image" | "draw";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  objectLabel?: string;
  label: string;
  fontFamily?: string;
  fontStyle?: "regular" | "bold" | "italic" | "boldItalic";
  fontColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  imageUrl?: string;
  drawingDataUrl?: string;
  drawColor?: string;
  drawStrokeWidth?: number;
  fontSize: number;
  required: boolean;
  locked?: boolean;
};

type ContractPdfViewerProps = {
  pdfUrl: string;
  fields: ContractPdfField[];
  mode: "edit" | "fill" | "preview";
  selectedFieldId?: string | null;
  values?: Record<string, string>;
  onFieldsChange?: (fields: ContractPdfField[]) => void;
  onSelectedFieldIdChange?: (id: string | null) => void;
  onValuesChange?: (values: Record<string, string>) => void;
  onActivePageChange?: (page: number) => void;
  onPageCountChange?: (pageCount: number) => void;
  onImageUploadRequest?: (fieldId: string) => void;
  showObjectBorders?: boolean;
  scrollToPageRequest?: { page: number; requestId: number } | null;
  onFieldDrop?: (
    type: ContractPdfField["type"],
    position: { page: number; x: number; y: number },
  ) => void;
  drawTool?: {
    color: string;
    strokeWidth: number;
    mode?: "draw" | "eraser";
  } | null;
  onDrawingCreate?: (drawing: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    drawingDataUrl: string;
    drawColor: string;
    drawStrokeWidth: number;
    mode?: "draw" | "eraser";
  }) => void;
  zoom?: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const MIN_FIELD_WIDTH = 0.03;
const MIN_FIELD_HEIGHT = 0.015;
const MAX_SIGNATURE_UPLOAD_BYTES = 5 * 1024 * 1024;
const SIGNATURE_PHOTO_MAX_WIDTH = 900;
const SIGNATURE_PHOTO_MAX_HEIGHT = 420;
const SIGNATURE_INK_COLOR = "#111827";
const SIGNATURE_BASE_STROKE_WIDTH = 4;
const CONTRACT_ERASER_COLOR = "#ffffff";
const resizeHandles = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
type ResizeHandle = (typeof resizeHandles)[number];
type SensitiveDrawingPoint = { x: number; y: number; width: number; time: number };
type PointerStrokeSource = {
  pressure: number;
  pointerType: string;
  buttons: number;
  timeStamp: number;
};

const getContractFieldTypeLabel = (field: Pick<ContractPdfField, "type">) => {
  if (
    field.type === "draw" &&
    "drawColor" in field &&
    String(field.drawColor ?? "").toLowerCase() === CONTRACT_ERASER_COLOR
  ) {
    return "Eraser";
  }
  if (field.type === "draw") return "Draw";
  if (field.type === "image") return "Image";
  if (field.type === "signature") return "Signature";
  if (field.type === "textbox") return "Textbox";
  return "Text";
};

const getDrafterSignatureValue = (field: ContractPdfField) =>
  field.type === "signature" ? field.drawingDataUrl?.trim() || field.imageUrl?.trim() || "" : "";

const escapeSvgAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const getSensitiveStrokeWidth = (
  event: PointerStrokeSource,
  baseWidth: number,
  previousPoint: SensitiveDrawingPoint | null,
  currentPoint: Pick<SensitiveDrawingPoint, "x" | "y">,
) => {
  const safeBaseWidth = clamp(baseWidth, 1, 24);
  const maxWidth = Math.max(safeBaseWidth * 2, safeBaseWidth + 1);
  const pressure = Number.isFinite(event.pressure) ? clamp(event.pressure, 0, 1) : 0;
  const hasRealPressure =
    event.pointerType !== "mouse" && pressure > 0 && Math.abs(pressure - 0.5) > 0.01;

  if (hasRealPressure) {
    return clamp(safeBaseWidth * (0.35 + pressure * 1.65), 1, maxWidth);
  }

  if (!previousPoint || event.buttons !== 1) {
    return safeBaseWidth;
  }

  const elapsed = Math.max(event.timeStamp - previousPoint.time, 1);
  const distance = Math.hypot(currentPoint.x - previousPoint.x, currentPoint.y - previousPoint.y);
  const velocity = distance / elapsed;
  const slowStrokeWeight = 1 - clamp(velocity / 1.35, 0, 1);
  const rawWidth = safeBaseWidth * (0.45 + slowStrokeWeight * 1.35);

  return clamp(previousPoint.width * 0.62 + rawWidth * 0.38, 1, maxWidth);
};

const getAverageStrokeWidth = (from: SensitiveDrawingPoint, to: SensitiveDrawingPoint) =>
  (from.width + to.width) / 2;

const buildDrawingDataUrl = (
  points: SensitiveDrawingPoint[],
  bounds: { left: number; top: number; width: number; height: number; padding: number },
  color: string,
  strokeWidth: number,
) => {
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const escapedColor = escapeSvgAttribute(color);
  const relativePoints = points.map((point) => ({
    x: point.x - bounds.left,
    y: point.y - bounds.top,
    width: point.width,
    time: point.time,
  }));
  const content =
    relativePoints.length <= 1
      ? `<circle cx="${relativePoints[0]?.x ?? width / 2}" cy="${
          relativePoints[0]?.y ?? height / 2
        }" r="${Math.max((relativePoints[0]?.width ?? strokeWidth) / 2, 1)}" fill="${escapedColor}" />`
      : relativePoints
          .slice(1)
          .map((point, index) => {
            const previousPoint = relativePoints[index];
            return `<line x1="${previousPoint.x.toFixed(2)}" y1="${previousPoint.y.toFixed(
              2,
            )}" x2="${point.x.toFixed(2)}" y2="${point.y.toFixed(
              2,
            )}" stroke="${escapedColor}" stroke-width="${getAverageStrokeWidth(
              previousPoint,
              point,
            ).toFixed(2)}" stroke-linecap="round" />`;
          })
          .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(
    2,
  )}" height="${height.toFixed(2)}" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(
    2,
  )}">${content}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const loadSignatureImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load the selected signature photo."));
    };
    image.src = objectUrl;
  });

const getSignaturePhotoBackground = (data: Uint8ClampedArray, width: number, height: number) => {
  const samples: Array<[number, number, number]> = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 80));
  const pushSample = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    samples.push([data[index], data[index + 1], data[index + 2]]);
  };

  for (let x = 0; x < width; x += step) {
    pushSample(x, 0);
    pushSample(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    pushSample(0, y);
    pushSample(width - 1, y);
  }

  const totals = samples.reduce(
    (sum, sample) => [sum[0] + sample[0], sum[1] + sample[1], sum[2] + sample[2]],
    [0, 0, 0],
  );
  const count = Math.max(samples.length, 1);

  return {
    r: totals[0] / count,
    g: totals[1] / count,
    b: totals[2] / count,
  };
};

const getSignatureLuminosity = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;

const removeSmallSignatureComponents = (
  mask: Uint8Array,
  width: number,
  height: number,
  minimumSize: number,
) => {
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  const component = new Int32Array(mask.length);

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;

    let queueStart = 0;
    let queueEnd = 0;
    let componentSize = 0;
    queue[queueEnd] = start;
    queueEnd += 1;
    visited[start] = 1;

    while (queueStart < queueEnd) {
      const current = queue[queueStart];
      queueStart += 1;
      component[componentSize] = current;
      componentSize += 1;

      const x = current % width;
      const y = Math.floor(current / width);
      const neighbors = [
        x > 0 ? current - 1 : -1,
        x < width - 1 ? current + 1 : -1,
        y > 0 ? current - width : -1,
        y < height - 1 ? current + width : -1,
      ];

      neighbors.forEach((neighbor) => {
        if (neighbor < 0 || !mask[neighbor] || visited[neighbor]) return;
        visited[neighbor] = 1;
        queue[queueEnd] = neighbor;
        queueEnd += 1;
      });
    }

    if (componentSize < minimumSize) {
      for (let index = 0; index < componentSize; index += 1) {
        mask[component[index]] = 0;
      }
    }
  }
};

const getSignatureMaskBounds = (mask: Uint8Array, width: number, height: number) => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;

  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    count += 1;
  }

  return count > 0 ? { minX, minY, maxX, maxY, count } : null;
};

const vectorizeSignatureMask = (
  mask: Uint8Array,
  width: number,
  height: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
) => {
  const padding = 10;
  const left = Math.max(0, bounds.minX - padding);
  const top = Math.max(0, bounds.minY - padding);
  const right = Math.min(width - 1, bounds.maxX + padding);
  const bottom = Math.min(height - 1, bounds.maxY + padding);
  const viewWidth = Math.max(1, right - left + 1);
  const viewHeight = Math.max(1, bottom - top + 1);
  const paths: string[] = [];

  for (let y = top; y <= bottom; y += 1) {
    let runStart = -1;
    for (let x = left; x <= right + 1; x += 1) {
      const isInk = x <= right && Boolean(mask[y * width + x]);
      if (isInk && runStart === -1) {
        runStart = x;
      }
      if ((!isInk || x === right + 1) && runStart !== -1) {
        const startX = runStart - left;
        const endX = x - left;
        paths.push(`M${startX} ${y - top + 0.5}H${endX}`);
        runStart = -1;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${viewHeight}" viewBox="0 0 ${viewWidth} ${viewHeight}"><path d="${paths.join(
    " ",
  )}" stroke="${SIGNATURE_INK_COLOR}" stroke-width="1.35" stroke-linecap="round" fill="none"/></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const extractSignatureFromPhoto = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Upload a clear image file of the signature.");
  }
  if (file.size > MAX_SIGNATURE_UPLOAD_BYTES) {
    throw new Error("Signature photo must be 5 MB or smaller.");
  }

  const image = await loadSignatureImage(file);
  const scale = Math.min(
    1,
    SIGNATURE_PHOTO_MAX_WIDTH / Math.max(image.naturalWidth, 1),
    SIGNATURE_PHOTO_MAX_HEIGHT / Math.max(image.naturalHeight, 1),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Could not prepare the signature photo.");
  }

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const background = getSignaturePhotoBackground(data, width, height);
  const backgroundLuminosity = getSignatureLuminosity(
    background.r,
    background.g,
    background.b,
  );
  const mask = new Uint8Array(width * height);
  let inkCount = 0;

  for (let index = 0; index < mask.length; index += 1) {
    const pixelIndex = index * 4;
    const alpha = data[pixelIndex + 3] / 255;
    if (alpha < 0.2) continue;

    const r = data[pixelIndex];
    const g = data[pixelIndex + 1];
    const b = data[pixelIndex + 2];
    const luminosity = getSignatureLuminosity(r, g, b);
    const colorDistance = Math.hypot(r - background.r, g - background.g, b - background.b);
    const darkerThanBackground = backgroundLuminosity - luminosity;
    const isInk =
      luminosity < 235 &&
      ((backgroundLuminosity > 145 && darkerThanBackground > 34 && colorDistance > 28) ||
        colorDistance > 72 ||
        (luminosity < 105 && darkerThanBackground > 18));

    if (!isInk) continue;
    mask[index] = 1;
    inkCount += 1;
  }

  if (inkCount < 80) {
    throw new Error(
      "Could not detect a clear signature. Use a solid background, no shadow, and dark handwriting.",
    );
  }

  removeSmallSignatureComponents(mask, width, height, Math.max(8, Math.floor(inkCount * 0.0015)));
  const bounds = getSignatureMaskBounds(mask, width, height);
  if (!bounds || bounds.count < 80) {
    throw new Error(
      "Could not isolate the signature. Use a clearer photo with a solid background.",
    );
  }

  return vectorizeSignatureMask(mask, width, height, bounds);
};

function SignatureDialog({
  value,
  label,
  onClose,
  onSave,
}: {
  value: string;
  label: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const lastSignaturePointRef = useRef<SensitiveDrawingPoint | null>(null);
  const [draftValue, setDraftValue] = useState(value);
  const [error, setError] = useState("");
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = SIGNATURE_BASE_STROKE_WIDTH;
    context.strokeStyle = "#111827";
    context.fillStyle = "#111827";
  }, []);

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const getSignaturePoint = (
    event: ReactPointerEvent<HTMLCanvasElement>,
    previousPoint: SensitiveDrawingPoint | null,
  ) => {
    const point = getPoint(event);
    if (!point) return null;

    return {
      ...point,
      width: getSensitiveStrokeWidth(event, SIGNATURE_BASE_STROKE_WIDTH, previousPoint, point),
      time: event.timeStamp,
    };
  };

  const drawSignatureDot = (
    context: CanvasRenderingContext2D,
    point: SensitiveDrawingPoint,
  ) => {
    context.fillStyle = "#111827";
    context.beginPath();
    context.arc(point.x, point.y, Math.max(point.width / 2, 1), 0, Math.PI * 2);
    context.fill();
  };

  const drawSignatureSegment = (
    context: CanvasRenderingContext2D,
    previousPoint: SensitiveDrawingPoint,
    point: SensitiveDrawingPoint,
  ) => {
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#111827";
    context.lineWidth = getAverageStrokeWidth(previousPoint, point);
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const saveCanvasValue = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawnRef.current) return;
    setDraftValue(canvas.toDataURL("image/png"));
    setError("");
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    lastSignaturePointRef.current = null;
    setDraftValue("");
    setError("");
  };

  const handleCanvasPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getSignaturePoint(event, null);
    if (!canvas || !context || !point) return;

    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    hasDrawnRef.current = true;
    lastSignaturePointRef.current = point;
    drawSignatureDot(context, point);
  };

  const handleCanvasPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const context = canvasRef.current?.getContext("2d");
    const previousPoint = lastSignaturePointRef.current;
    const point = getSignaturePoint(event, previousPoint);
    if (!context || !point) return;

    event.preventDefault();
    if (previousPoint) {
      const distance = Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
      if (distance < 0.8) return;
      drawSignatureSegment(context, previousPoint, point);
    } else {
      drawSignatureDot(context, point);
    }
    lastSignaturePointRef.current = point;
  };

  const handleCanvasPointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastSignaturePointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    saveCanvasValue();
  };

  const handleSignatureUpload = async (event: ReactChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    setIsProcessingUpload(true);
    setError("");
    try {
      const extractedSignature = await extractSignatureFromPhoto(file);
      setDraftValue(extractedSignature);
      setError("");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not extract the signature from this photo.",
      );
    } finally {
      setIsProcessingUpload(false);
    }
  };

  return createPortal(
    <div className={styles.viewer__signatureDialogBackdrop} role="presentation">
      <section
        className={styles.viewer__signatureDialog}
        role="dialog"
        aria-modal="true"
        aria-label={label || "Signature"}
      >
        <div className={styles.viewer__signatureDialogHeader}>
          <div>
            <strong>{label || "Add your signature"}</strong>
          </div>
          <button type="button" aria-label="Close signature dialog" title="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.viewer__signatureCanvasPanel}>
          <div className={styles.viewer__signatureCanvasHeader}>
            <strong>Draw your signature</strong>
            <span>Use your mouse, trackpad, or finger</span>
          </div>
          <canvas
            ref={canvasRef}
            className={styles.viewer__signatureCanvas}
            width={640}
            height={220}
            aria-label="Draw signature"
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerCancel={handleCanvasPointerUp}
          />
        </div>
        <p className={styles.viewer__signatureHint}>
          Prefer a photo? Upload dark handwriting on a plain, well-lit background and Writly will
          remove the background automatically.
        </p>

        {draftValue && (
          <div className={styles.viewer__signaturePreview}>
            <span>Current signature</span>
            <img src={draftValue} alt="Signature preview" />
          </div>
        )}

        {error && <p className={styles.viewer__signatureError}>{error}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          className={styles.viewer__signatureFileInput}
          onChange={handleSignatureUpload}
        />
        <div className={styles.viewer__signatureDialogActions}>
          <button type="button" onClick={clearCanvas}>
            Clear
          </button>
          <button
            type="button"
            disabled={isProcessingUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessingUpload ? "Extracting..." : "Upload Photo"}
          </button>
          <button
            type="button"
            className={styles.viewer__signaturePrimaryAction}
            disabled={!draftValue || isProcessingUpload}
            onClick={() => onSave(draftValue)}
          >
            Use Signature
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function SignatureField({
  field,
  value,
  style,
  onChange,
}: {
  field: ContractPdfField;
  value: string;
  style: CSSProperties;
  onChange: (value: string) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const label = field.label || "Signature";

  return (
    <div
      className={styles.viewer__signatureInput}
      style={style}
      data-contract-field-object="true"
    >
      <button
        type="button"
        className={styles.viewer__signatureTrigger}
        onClick={() => setIsDialogOpen(true)}
      >
        {value ? (
          <span className={styles.viewer__signatureImageFrame}>
            <img src={value} alt={label} />
          </span>
        ) : (
          <span>
            <strong>{label}</strong>
            <small>Upload photo or draw</small>
          </span>
        )}
      </button>
      {isDialogOpen && (
        <SignatureDialog
          value={value}
          label={label}
          onClose={() => setIsDialogOpen(false)}
          onSave={(nextValue) => {
            onChange(nextValue);
            setIsDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

function ContractPdfPage({
  pdf,
  pageNumber,
  fields,
  mode,
  selectedFieldId,
  values,
  onFieldsChange,
  onSelectedFieldIdChange,
  onValuesChange,
  onPageVisibilityChange,
  onImageUploadRequest,
  onFieldDrop,
  drawTool,
  onDrawingCreate,
  scrollToPageRequest,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  fields: ContractPdfField[];
  mode: ContractPdfViewerProps["mode"];
  selectedFieldId?: string | null;
  values: Record<string, string>;
  onFieldsChange?: (fields: ContractPdfField[]) => void;
  onSelectedFieldIdChange?: (id: string | null) => void;
  onValuesChange?: (values: Record<string, string>) => void;
  onPageVisibilityChange?: (pageNumber: number, ratio: number) => void;
  onImageUploadRequest?: ContractPdfViewerProps["onImageUploadRequest"];
  onFieldDrop?: ContractPdfViewerProps["onFieldDrop"];
  drawTool?: ContractPdfViewerProps["drawTool"];
  onDrawingCreate?: ContractPdfViewerProps["onDrawingCreate"];
  scrollToPageRequest?: ContractPdfViewerProps["scrollToPageRequest"];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const drawingPointerIdRef = useRef<number | null>(null);
  const drawingPointsRef = useRef<SensitiveDrawingPoint[]>([]);
  const drawingRectRef = useRef<DOMRect | null>(null);
  const lastTextTapRef = useRef<{ fieldId: string; time: number } | null>(null);
  const cancelInlineTextEditRef = useRef(false);
  const [pageSize, setPageSize] = useState({ width: 612, height: 792 });
  const [drawingCursorPoint, setDrawingCursorPoint] = useState<{
    x: number;
    y: number;
    width: number;
  } | null>(null);
  const [editingSignatureField, setEditingSignatureField] =
    useState<ContractPdfField | null>(null);
  const [editingTextField, setEditingTextField] = useState<{
    fieldId: string;
    value: string;
    originalValue: string;
  } | null>(null);
  const [drawingPreviewPoints, setDrawingPreviewPoints] = useState<SensitiveDrawingPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;

    const renderPage = async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;

      const baseViewport = page.getViewport({ scale: 1 });
      setPageSize({ width: baseViewport.width, height: baseViewport.height });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
      const viewport = page.getViewport({ scale });
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      renderTask = page.render({ canvasContext: context, viewport });
      await renderTask.promise.catch((error: unknown) => {
        if (!cancelled && error instanceof Error && error.name !== "RenderingCancelledException") {
          throw error;
        }
      });
    };

    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdf]);

  useEffect(() => {
    if (!onPageVisibilityChange) return;
    const pageElement = pageRef.current;
    if (!pageElement) return;

    if (typeof IntersectionObserver === "undefined") {
      onPageVisibilityChange(pageNumber, 1);
      return () => onPageVisibilityChange(pageNumber, 0);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onPageVisibilityChange(pageNumber, entry.isIntersecting ? entry.intersectionRatio : 0);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );

    observer.observe(pageElement);
    return () => {
      observer.disconnect();
      onPageVisibilityChange(pageNumber, 0);
    };
  }, [onPageVisibilityChange, pageNumber]);

  useEffect(() => {
    if (scrollToPageRequest?.page !== pageNumber) return;
    pageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [pageNumber, scrollToPageRequest]);

  const startDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    field: ContractPdfField,
  ) => {
    if (mode !== "edit" || !onFieldsChange) return;
    const pageElement = pageRef.current;
    if (!pageElement) return;

    event.preventDefault();
    onSelectedFieldIdChange?.(field.id);
    if (field.locked) return;

    const rect = pageElement.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / rect.width - field.x;
    const offsetY = (event.clientY - rect.top) / rect.height - field.y;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentRect = pageElement.getBoundingClientRect();
      const nextX = (moveEvent.clientX - currentRect.left) / currentRect.width - offsetX;
      const nextY = (moveEvent.clientY - currentRect.top) / currentRect.height - offsetY;
      onFieldsChange(
        fields.map((item) =>
          item.id === field.id
            ? {
                ...item,
                x: clamp(nextX, 0, 1 - item.width),
                y: clamp(nextY, 0, 1 - item.height),
              }
            : item,
        ),
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  const startResize = (
    event: ReactPointerEvent<HTMLSpanElement>,
    field: ContractPdfField,
    handle: ResizeHandle,
  ) => {
    if (mode !== "edit" || !onFieldsChange || field.locked) return;
    const pageElement = pageRef.current;
    if (!pageElement) return;

    event.preventDefault();
    event.stopPropagation();
    onSelectedFieldIdChange?.(field.id);

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const startX = field.x;
    const startY = field.y;
    const startWidth = field.width;
    const startHeight = field.height;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentRect = pageElement.getBoundingClientRect();
      const deltaX = (moveEvent.clientX - startClientX) / currentRect.width;
      const deltaY = (moveEvent.clientY - startClientY) / currentRect.height;

      let nextX = startX;
      let nextY = startY;
      let nextWidth = startWidth;
      let nextHeight = startHeight;

      if (handle.includes("e")) {
        nextWidth = clamp(startWidth + deltaX, MIN_FIELD_WIDTH, 1 - startX);
      }

      if (handle.includes("s")) {
        nextHeight = clamp(startHeight + deltaY, MIN_FIELD_HEIGHT, 1 - startY);
      }

      if (handle.includes("w")) {
        nextX = clamp(startX + deltaX, 0, startX + startWidth - MIN_FIELD_WIDTH);
        nextWidth = startWidth + startX - nextX;
      }

      if (handle.includes("n")) {
        nextY = clamp(startY + deltaY, 0, startY + startHeight - MIN_FIELD_HEIGHT);
        nextHeight = startHeight + startY - nextY;
      }

      onFieldsChange(
        fields.map((item) =>
          item.id === field.id
            ? {
                ...item,
                x: nextX,
                y: nextY,
                width: nextWidth,
                height: nextHeight,
              }
            : item,
        ),
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  const pageFields = fields.filter((field) => field.page === pageNumber);
  const canDropNewField = mode === "edit" && Boolean(onFieldDrop);

  const beginInlineTextEdit = (field: ContractPdfField) => {
    if (
      mode !== "edit" ||
      (field.type !== "text" && field.type !== "textbox") ||
      field.locked ||
      !onFieldsChange
    ) {
      return;
    }
    cancelInlineTextEditRef.current = false;
    onSelectedFieldIdChange?.(field.id);
    setEditingTextField({
      fieldId: field.id,
      value: field.label,
      originalValue: field.label,
    });
  };

  const saveInlineTextEdit = () => {
    if (!editingTextField || !onFieldsChange) return;
    if (cancelInlineTextEditRef.current) {
      cancelInlineTextEditRef.current = false;
      setEditingTextField(null);
      return;
    }
    const nextValue = editingTextField.value.trim()
      ? editingTextField.value
      : editingTextField.originalValue;
    onFieldsChange(
      fields.map((field) =>
        field.id === editingTextField.fieldId
          ? { ...field, label: nextValue }
          : field,
      ),
    );
    setEditingTextField(null);
  };

  const cancelInlineTextEdit = () => {
    cancelInlineTextEditRef.current = true;
    setEditingTextField(null);
  };

  const selectOrEditTextField = (field: ContractPdfField) => {
    onSelectedFieldIdChange?.(field.id);
    if ((field.type !== "text" && field.type !== "textbox") || field.locked) return;
    const now = Date.now();
    const previousTap = lastTextTapRef.current;
    if (previousTap?.fieldId === field.id && now - previousTap.time <= 360) {
      lastTextTapRef.current = null;
      beginInlineTextEdit(field);
      return;
    }
    lastTextTapRef.current = { fieldId: field.id, time: now };
  };

  const handleDragOver = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!canDropNewField) return;
    if (!event.dataTransfer.types.includes("application/x-contract-field")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    if (!canDropNewField) return;
    const type = event.dataTransfer.getData("application/x-contract-field");
    if (
      type !== "text" &&
      type !== "textbox" &&
      type !== "signature" &&
      type !== "image" &&
      type !== "draw"
    ) {
      return;
    }
    const pageElement = pageRef.current;
    if (!pageElement) return;

    event.preventDefault();
    const rect = pageElement.getBoundingClientRect();
    onFieldDrop?.(type, {
      page: pageNumber,
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    });
  };

  const canDrawOnPage = mode === "edit" && Boolean(drawTool && onDrawingCreate);

  useEffect(() => {
    if (!canDrawOnPage) {
      setDrawingCursorPoint(null);
    }
  }, [canDrawOnPage]);

  const isPointerInsideDrawMenu = (clientX: number, clientY: number) =>
    Array.from(document.querySelectorAll<HTMLElement>("[data-contract-draw-menu='true']")).some(
      (menu) => {
        const rect = menu.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      },
    );

  const isDrawBlockedTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        "[data-contract-field-object='true'], button, a, input, select, textarea, [role='button']",
      ),
    );

  const getDrawingPoint = (
    event: ReactPointerEvent<HTMLDivElement>,
    rect = pageRef.current?.getBoundingClientRect(),
    previousPoint: SensitiveDrawingPoint | null = null,
  ) => {
    if (!rect || !drawTool) return null;
    const point = {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };

    return {
      ...point,
      width: getSensitiveStrokeWidth(event, drawTool.strokeWidth, previousPoint, point),
      time: event.timeStamp,
    };
  };

  const updateDrawingCursorPoint = (
    event: ReactPointerEvent<HTMLDivElement>,
    rect = pageRef.current?.getBoundingClientRect(),
    previousPoint: SensitiveDrawingPoint | null = null,
  ) => {
    if (!canDrawOnPage) return null;
    const point = getDrawingPoint(event, rect, previousPoint);
    if (point) {
      setDrawingCursorPoint(point);
    }
    return point;
  };

  const handlePagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrawOnPage || !drawTool) return;
    if (event.defaultPrevented || event.button !== 0 || event.buttons !== 1) return;
    if (isPointerInsideDrawMenu(event.clientX, event.clientY)) {
      setDrawingCursorPoint(null);
      return;
    }
    const target = event.target;
    if (isDrawBlockedTarget(target)) {
      setDrawingCursorPoint(null);
      return;
    }

    const pageElement = pageRef.current;
    if (!pageElement) return;
    const rect = pageElement.getBoundingClientRect();
    const point = updateDrawingCursorPoint(event, rect);
    if (!point) return;

    event.preventDefault();
    pageElement.setPointerCapture(event.pointerId);
    drawingPointerIdRef.current = event.pointerId;
    drawingRectRef.current = rect;
    drawingPointsRef.current = [point];
    setDrawingPreviewPoints([
      {
        x: rect.width ? point.x / rect.width : 0,
        y: rect.height ? point.y / rect.height : 0,
        width: point.width,
        time: point.time,
      },
    ]);
  };

  const handlePagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isPointerInsideDrawMenu(event.clientX, event.clientY)) {
      setDrawingCursorPoint(null);
      return;
    }
    if (isDrawBlockedTarget(event.target)) {
      setDrawingCursorPoint(null);
      return;
    }
    const previousPoint = drawingPointsRef.current[drawingPointsRef.current.length - 1] ?? null;
    if (canDrawOnPage) {
      updateDrawingCursorPoint(event, drawingRectRef.current ?? undefined, previousPoint);
    }
    if (drawingPointerIdRef.current !== event.pointerId || !drawTool) return;
    const rect = drawingRectRef.current ?? pageRef.current?.getBoundingClientRect();
    const point = getDrawingPoint(event, rect ?? undefined, previousPoint);
    if (!point || !rect) return;

    event.preventDefault();
    const distance = previousPoint
      ? Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
      : Infinity;
    if (distance < 1.4) return;

    drawingPointsRef.current = [...drawingPointsRef.current, point];
    setDrawingPreviewPoints((current) => [
      ...current,
      {
        x: rect.width ? point.x / rect.width : 0,
        y: rect.height ? point.y / rect.height : 0,
        width: point.width,
        time: point.time,
      },
    ]);
  };

  const handlePagePointerLeave = () => {
    if (drawingPointerIdRef.current === null) {
      setDrawingCursorPoint(null);
    }
  };

  const finishPageDrawing = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drawingPointerIdRef.current !== event.pointerId || !drawTool || !onDrawingCreate) return;

    const pageElement = pageRef.current;
    const rect = drawingRectRef.current ?? pageElement?.getBoundingClientRect();
    const points = drawingPointsRef.current;
    drawingPointerIdRef.current = null;
    drawingPointsRef.current = [];
    drawingRectRef.current = null;
    setDrawingPreviewPoints([]);

    if (pageElement?.hasPointerCapture(event.pointerId)) {
      pageElement.releasePointerCapture(event.pointerId);
    }
    if (!rect || points.length === 0) return;

    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const maxStrokeWidth = Math.max(drawTool.strokeWidth, ...points.map((point) => point.width));
    const padding = Math.max(maxStrokeWidth * 1.5, 4);
    const left = clamp(minX - padding, 0, rect.width);
    const top = clamp(minY - padding, 0, rect.height);
    const right = clamp(maxX + padding, left + 1, rect.width);
    const bottom = clamp(maxY + padding, top + 1, rect.height);
    const widthPx = Math.max(right - left, padding * 2);
    const heightPx = Math.max(bottom - top, padding * 2);
    const x = clamp(left / rect.width, 0, 1);
    const y = clamp(top / rect.height, 0, 1);
    const width = clamp(widthPx / rect.width, MIN_FIELD_WIDTH, 1 - x);
    const height = clamp(heightPx / rect.height, MIN_FIELD_HEIGHT, 1 - y);

    onDrawingCreate({
      page: pageNumber,
      x,
      y,
      width,
      height,
      drawingDataUrl: buildDrawingDataUrl(
        points,
        {
          left,
          top,
          width: width * rect.width,
          height: height * rect.height,
          padding,
        },
        drawTool.color,
        drawTool.strokeWidth,
      ),
      drawColor: drawTool.color,
      drawStrokeWidth: drawTool.strokeWidth,
      mode: drawTool.mode ?? "draw",
    });
  };

  return (
    <section className={styles.viewer__pageWrap}>
      <div
        ref={pageRef}
        data-contract-pdf-page={pageNumber}
        className={`${styles.viewer__page} ${
          canDrawOnPage ? styles["viewer__page--drawing"] : ""
        }`}
        style={{ aspectRatio: `${pageSize.width} / ${pageSize.height}` }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPointerDown={handlePagePointerDown}
        onPointerMove={handlePagePointerMove}
        onPointerUp={finishPageDrawing}
        onPointerCancel={finishPageDrawing}
        onPointerLeave={handlePagePointerLeave}
      >
        <canvas ref={canvasRef} className={styles.viewer__canvas} />
        <div className={styles.viewer__overlay}>
          {canDrawOnPage && drawTool && drawingCursorPoint && (
            <span
              className={styles.viewer__drawingCursor}
              style={{
                left: drawingCursorPoint.x,
                top: drawingCursorPoint.y,
                width: drawingCursorPoint.width,
                height: drawingCursorPoint.width,
                backgroundColor: drawTool.color,
              }}
            />
          )}
          {drawingPreviewPoints.length > 1 && drawTool && (
            <svg
              className={styles.viewer__drawingPreview}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {drawingPreviewPoints.slice(1).map((point, index) => {
                const previousPoint = drawingPreviewPoints[index];
                return (
                  <line
                    key={`${point.x}-${point.y}-${index}`}
                    x1={(previousPoint.x * 100).toFixed(2)}
                    y1={(previousPoint.y * 100).toFixed(2)}
                    x2={(point.x * 100).toFixed(2)}
                    y2={(point.y * 100).toFixed(2)}
                    stroke={drawTool.color}
                    strokeWidth={getAverageStrokeWidth(previousPoint, point)}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          )}
          {pageFields.map((field, fieldIndex) => {
            const fieldStyle: CSSProperties = {
              left: `${field.x * 100}%`,
              top: `${field.y * 100}%`,
              width: `${field.width * 100}%`,
              height: `${field.height * 100}%`,
              fontFamily: field.fontFamily || "Arial, sans-serif",
              fontWeight:
                field.fontStyle === "bold" || field.fontStyle === "boldItalic"
                  ? 700
                  : 400,
              fontStyle:
                field.fontStyle === "italic" || field.fontStyle === "boldItalic"
                  ? "italic"
                  : "normal",
              color: field.fontColor || "#111827",
              backgroundColor: field.backgroundColor || "transparent",
              borderColor: field.borderColor || "transparent",
              borderStyle: "solid",
              borderWidth: `${field.borderWidth ?? 0}px`,
              fontSize: `calc(${field.fontSize}px * var(--viewer-zoom, 1))`,
              textAlign: field.textAlign || "left",
            };

            const objectLabel =
              field.objectLabel?.trim() ||
              `${getContractFieldTypeLabel(field)} ${fieldIndex + 1}`;
            const drafterSignatureValue = getDrafterSignatureValue(field);
            if (mode === "fill" && field.type === "textbox") {
              return (
                <textarea
                  key={field.id}
                  className={styles.viewer__input}
                  style={fieldStyle}
                  data-contract-field-object="true"
                  value={values[field.id] ?? ""}
                  required={field.required}
                  aria-label={field.label || "Document field"}
                  placeholder={field.label || "Type here"}
                  onChange={(event) =>
                    onValuesChange?.({
                      ...values,
                      [field.id]: event.target.value,
                    })
                  }
                />
              );
            }

            if (mode === "fill" && field.type === "signature" && !drafterSignatureValue) {
              return (
                <SignatureField
                  key={field.id}
                  field={field}
                  style={fieldStyle}
                  value={values[field.id] ?? ""}
                  onChange={(nextValue) =>
                    onValuesChange?.({
                      ...values,
                      [field.id]: nextValue,
                    })
                  }
                />
              );
            }

            const content =
              field.type === "signature" && mode === "edit" && !drafterSignatureValue
                ? "Double-click to add your signature"
                : field.label ||
                  (field.type === "textbox"
                    ? "Text field"
                    : field.type === "signature"
                      ? "Signature"
                      : field.type === "image"
                        ? "Image"
                        : field.type === "draw"
                          ? "Drawing"
                          : "Text");
            if (mode === "edit") {
              if (
                (field.type === "text" || field.type === "textbox") &&
                editingTextField?.fieldId === field.id
              ) {
                return (
                  <textarea
                    key={field.id}
                    autoFocus
                    data-contract-field-object="true"
                    className={styles.viewer__inlineTextEditor}
                    style={{ ...fieldStyle, backgroundColor: "transparent" }}
                    value={editingTextField.value}
                    aria-label={`Edit ${objectLabel}`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      setEditingTextField({
                        fieldId: field.id,
                        value: event.target.value,
                        originalValue: editingTextField.originalValue,
                      })
                    }
                    onBlur={saveInlineTextEdit}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        saveInlineTextEdit();
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        cancelInlineTextEdit();
                      }
                    }}
                  />
                );
              }

              return (
                <button
                  key={field.id}
                  type="button"
                  data-contract-field-object="true"
                  className={`${styles.viewer__field} ${
                    field.type === "textbox" ? styles["viewer__field--textbox"] : ""
                  } ${field.type === "signature" ? styles["viewer__field--signature"] : ""} ${
                    field.type === "image" ? styles["viewer__field--image"] : ""
                  } ${field.type === "draw" ? styles["viewer__field--draw"] : ""
                  } ${
                    field.type === "draw" &&
                    String(field.drawColor ?? "").toLowerCase() === CONTRACT_ERASER_COLOR
                      ? styles["viewer__field--eraser"]
                      : ""
                  } ${
                    selectedFieldId === field.id ? styles["viewer__field--selected"] : ""
                  } ${field.locked ? styles["viewer__field--locked"] : ""}`}
                  style={fieldStyle}
                  onPointerDown={(event) => startDrag(event, field)}
                  onClick={() => selectOrEditTextField(field)}
                  onDoubleClick={(event) => {
                    if (field.locked) return;
                    if (field.type === "text" || field.type === "textbox") {
                      event.preventDefault();
                      event.stopPropagation();
                      beginInlineTextEdit(field);
                      return;
                    }
                    if (field.type === "image") {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelectedFieldIdChange?.(field.id);
                      onImageUploadRequest?.(field.id);
                      return;
                    }
                    if (field.type !== "signature") return;
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectedFieldIdChange?.(field.id);
                    setEditingSignatureField(field);
                  }}
                >
                  <span className={styles.viewer__objectLabel}>{objectLabel}</span>
                  <span className={styles.viewer__fieldContent}>
                    {field.type === "image" && field.imageUrl ? (
                      <img src={field.imageUrl} alt={field.label || "Image object"} />
                    ) : field.type === "image" ? (
                      <span className={styles.viewer__imagePlaceholder}>
                        <span aria-hidden="true" />
                        <strong>Double click to upload photo</strong>
                      </span>
                    ) : field.type === "signature" && drafterSignatureValue ? (
                      <img src={drafterSignatureValue} alt={field.label || "Signature"} />
                    ) : field.type === "draw" && field.drawingDataUrl ? (
                      <img src={field.drawingDataUrl} alt={field.label || "Drawing object"} />
                    ) : (
                      content
                    )}
                  </span>
                  {!field.locked &&
                    resizeHandles.map((handle) => (
                      <span
                        key={handle}
                        aria-hidden="true"
                        className={`${styles.viewer__resizeHandle} ${
                          styles[`viewer__resizeHandle--${handle}`]
                        }`}
                        onPointerDown={(event) => startResize(event, field, handle)}
                      />
                    ))}
                </button>
              );
            }

            return (
              <div
                key={field.id}
                className={`${styles.viewer__staticText} ${
                  field.type === "textbox" ? styles["viewer__staticText--textbox"] : ""
                } ${field.type === "signature" ? styles["viewer__staticText--signature"] : ""} ${
                  field.type === "image" ? styles["viewer__staticText--image"] : ""
                } ${field.type === "draw" ? styles["viewer__staticText--draw"] : ""
                }`}
                style={fieldStyle}
              >
                {field.type === "image" && field.imageUrl ? (
                  <img src={field.imageUrl} alt={field.label || "Image object"} />
                ) : field.type === "signature" && drafterSignatureValue ? (
                  <img src={drafterSignatureValue} alt={field.label || "Signature"} />
                ) : field.type === "draw" && field.drawingDataUrl ? (
                  <img src={field.drawingDataUrl} alt={field.label || "Drawing object"} />
                ) : field.type === "signature" && values[field.id] ? (
                  <img src={values[field.id]} alt={content} />
                ) : field.type === "textbox" ? (
                  values[field.id] || content
                ) : (
                  content
                )}
              </div>
            );
          })}
          {mode === "edit" && editingSignatureField && (
            <SignatureDialog
              value={getDrafterSignatureValue(editingSignatureField)}
              label={editingSignatureField.label || "Signature"}
              onClose={() => setEditingSignatureField(null)}
              onSave={(nextValue) => {
                onFieldsChange?.(
                  fields.map((field) =>
                    field.id === editingSignatureField.id
                      ? {
                          ...field,
                          drawingDataUrl: nextValue,
                          imageUrl: undefined,
                          required: false,
                        }
                      : field,
                  ),
                );
                onSelectedFieldIdChange?.(editingSignatureField.id);
                setEditingSignatureField(null);
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export function ContractPdfViewer({
  pdfUrl,
  fields,
  mode,
  selectedFieldId = null,
  values = {},
  onFieldsChange,
  onSelectedFieldIdChange,
  onValuesChange,
  onActivePageChange,
  onPageCountChange,
  onImageUploadRequest,
  showObjectBorders = true,
  scrollToPageRequest = null,
  onFieldDrop,
  drawTool = null,
  onDrawingCreate,
  zoom = 100,
}: ContractPdfViewerProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const visiblePagesRef = useRef<Map<number, number>>(new Map());
  const activePageRef = useRef(1);

  const handlePageVisibilityChange = useCallback(
    (pageNumber: number, ratio: number) => {
      if (ratio > 0) {
        visiblePagesRef.current.set(pageNumber, ratio);
      } else {
        visiblePagesRef.current.delete(pageNumber);
      }

      let nextActivePage = activePageRef.current;
      let bestRatio = -1;
      visiblePagesRef.current.forEach((visibleRatio, visiblePage) => {
        if (visibleRatio > bestRatio) {
          bestRatio = visibleRatio;
          nextActivePage = visiblePage;
        }
      });

      if (bestRatio > 0 && nextActivePage !== activePageRef.current) {
        activePageRef.current = nextActivePage;
        onActivePageChange?.(nextActivePage);
      }
    },
    [onActivePageChange],
  );

  useEffect(() => {
    let cancelled = false;
    setPdf(null);
    setError("");
    visiblePagesRef.current.clear();
    activePageRef.current = 1;
    onActivePageChange?.(1);

    if (!pdfUrl) return;

    const task = getDocument(pdfUrl);
    void task.promise
      .then((document) => {
        if (cancelled) return;
        setPdf(document);
        onPageCountChange?.(document.numPages);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load this PDF.");
        }
      });

    return () => {
      cancelled = true;
      task.destroy();
    };
  }, [onActivePageChange, onPageCountChange, pdfUrl]);

  if (!pdfUrl) {
    return (
      <div className={styles.viewer__empty}>
        <strong>No PDF selected</strong>
        <span>Upload a PDF to start placing document fields.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.viewer__empty}>
        <strong>{error}</strong>
        <a href={pdfUrl} target="_blank" rel="noreferrer">
          Open PDF
        </a>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className={styles.viewer__empty}>
        <strong>Loading PDF</strong>
        <span>Preparing the document pages.</span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.viewer} ${
        showObjectBorders ? "" : styles["viewer--objectBordersHidden"]
      }`}
      style={{ "--viewer-zoom": zoom / 100 } as CSSProperties}
      aria-label="Document page view"
    >
      <div className={styles.viewer__pages}>
        {Array.from({ length: pdf.numPages }, (_, index) => (
          <ContractPdfPage
            key={`${pdfUrl}-${index + 1}`}
            pdf={pdf}
            pageNumber={index + 1}
            fields={fields}
            mode={mode}
            selectedFieldId={selectedFieldId}
            values={values}
            onFieldsChange={onFieldsChange}
            onSelectedFieldIdChange={onSelectedFieldIdChange}
            onValuesChange={onValuesChange}
            onPageVisibilityChange={handlePageVisibilityChange}
            onImageUploadRequest={onImageUploadRequest}
            onFieldDrop={onFieldDrop}
            drawTool={drawTool}
            onDrawingCreate={onDrawingCreate}
            scrollToPageRequest={scrollToPageRequest}
          />
        ))}
      </div>
    </div>
  );
}
