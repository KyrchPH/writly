import type { Response } from "express";
import { z } from "zod";

export const optionalUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;

    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) || /^(mailto:|tel:)/i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed.replace(/^\/+/, "")}`;
  },
  z.string().url().optional(),
);

export const optionalTextSchema = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().max(max).optional(),
  );

export const sendValidationError = (
  res: Response,
  message: string,
  error: z.ZodError,
) => {
  res.status(400).json({
    message,
    errors: error.flatten(),
  });
};

export const normalizeRouteParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
