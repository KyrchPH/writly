import { randomUUID } from "crypto";
import {
  MongoClient,
  type ClientSession,
  type Document,
  type Filter,
  type Sort,
} from "mongodb";
import { env } from "../config/env.js";

type Query = Record<string, any>;

const client = new MongoClient(env.DATABASE_URL);
const database = client.db(env.MONGODB_DB_NAME);

const modelNames = [
  "user", "passwordResetToken", "userLoginLog", "project", "service",
  "banner", "workExperience", "certificate", "review", "client",
  "reviewInvitation", "contractTemplate", "contract", "contactConfig",
  "cvAsset", "cvOtp", "cvDownload", "visitor", "visitorEvent", "errorLog",
] as const;

const defaults: Record<string, Query> = {
  user: { isApproved: false },
  project: { previewImages: [], status: "Draft", isFeatured: false, isPinned: false, tags: [], highlights: [] },
  service: { sortOrder: 0, isPublished: true },
  banner: { sortOrder: 0, isPublished: true },
  workExperience: { highlights: [], sortOrder: 0, isPublished: true },
  review: { status: "Pending", isPublished: false },
  contractTemplate: { content: "", pdfFilePath: "", pdfFileUrl: "", pdfFileName: "", pdfMimeType: "application/pdf", pageCount: 1, fields: [] },
  contract: { content: "", pdfFilePath: "", pdfFileUrl: "", pdfFileName: "", pdfMimeType: "application/pdf", pageCount: 1, fields: [], values: {} },
  contactConfig: { showEmail: true, showPhone: true, showInstagram: true, showWhatsapp: true, showTelegram: true, showLinkedin: true },
  cvAsset: { atsFilePath: "", atsFileUrl: "", atsFileName: "", atsMimeType: "application/pdf", visualFilePath: "", visualFileUrl: "", visualFileName: "", visualMimeType: "application/pdf", isActive: false },
  cvOtp: { attempts: 0 },
  cvDownload: { documentType: "Visual" },
  visitor: { visitCount: 0 },
};

const collectionNames: Record<string, string> = {
  user: "users",
  userLoginLog: "userLoginLogs",
};

const collection = (model: string) => database.collection(collectionNames[model] ?? model);
const withoutUndefined = (value: Query) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const mongoFilter = (where: Query = {}): Filter<Document> => {
  const filter: Query = {};
  for (const [key, value] of Object.entries(where)) {
    if (key === "OR") {
      filter.$or = (value as Query[]).map(mongoFilter);
      continue;
    }
    if (key === "AND") {
      filter.$and = (value as Query[]).map(mongoFilter);
      continue;
    }
    if (key === "NOT") {
      filter.$nor = [mongoFilter(value as Query)];
      continue;
    }
    if (!value || typeof value !== "object" || value instanceof Date || Array.isArray(value)) {
      filter[key] = value;
      continue;
    }

    const operators: Query = {};
    for (const [operator, operand] of Object.entries(value)) {
      if (operator === "mode") continue;
      if (operator === "contains") {
        operators.$regex = new RegExp(escapeRegex(String(operand)), (value as Query).mode === "insensitive" ? "i" : "");
      } else if (operator === "startsWith") {
        operators.$regex = new RegExp(`^${escapeRegex(String(operand))}`, (value as Query).mode === "insensitive" ? "i" : "");
      } else if (operator === "endsWith") {
        operators.$regex = new RegExp(`${escapeRegex(String(operand))}$`, (value as Query).mode === "insensitive" ? "i" : "");
      } else if (operator === "not") {
        operators.$ne = operand;
      } else {
        const mongoOperator: Record<string, string> = { gt: "$gt", gte: "$gte", lt: "$lt", lte: "$lte", in: "$in", notIn: "$nin" };
        operators[mongoOperator[operator] ?? operator] = operand;
      }
    }
    filter[key] = operators;
  }
  return filter;
};

const mongoSort = (orderBy: Query | Query[] | undefined): Sort => {
  const entries = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [])
    .flatMap((item) => Object.entries(item))
    .map(([key, direction]) => [key, direction === "desc" ? -1 : 1] as [string, 1 | -1]);
  return Object.fromEntries(entries);
};

const applySelect = (document: Query | null, select?: Query) => {
  if (!document || !select) return document;
  return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, document[key]]));
};

const relatedMany = async (model: string, foreignKey: string, id: string, options: Query, session?: ClientSession) => {
  let cursor = collection(model).find({ [foreignKey]: id }, { session });
  const sort = mongoSort(options?.orderBy);
  if (Object.keys(sort).length) cursor = cursor.sort(sort);
  if (options?.take) cursor = cursor.limit(options.take);
  const results = await cursor.toArray();
  return results.map((item) => applySelect(item, options?.select));
};

const hydrate = async (model: string, document: Query | null, args: Query, session?: ClientSession): Promise<Query | null> => {
  if (!document) return null;
  const result = { ...document };
  const include = args.include;
  if (include) {
    if (model === "client") {
      if (include.invitations) result.invitations = await relatedMany("reviewInvitation", "clientId", result.id, include.invitations, session);
      if (include.reviews) result.reviews = await relatedMany("review", "clientId", result.id, include.reviews, session);
      if (include._count) result._count = { reviews: await collection("review").countDocuments({ clientId: result.id }, { session }) };
    }
    if (model === "review" && include.client) {
      result.client = applySelect(await collection("client").findOne({ id: result.clientId }, { session }), include.client.select);
    }
    if (model === "reviewInvitation" && include.client) {
      result.client = applySelect(await collection("client").findOne({ id: result.clientId }, { session }), include.client.select);
    }
    if (model === "contract" && include.template) {
      result.template = applySelect(await collection("contractTemplate").findOne({ id: result.templateId }, { session }), include.template.select);
    }
    if (model === "contractTemplate" && include._count) {
      result._count = { contracts: await collection("contract").countDocuments({ templateId: result.id }, { session }) };
    }
    if (model === "cvAsset") {
      if (include.downloads) result.downloads = await relatedMany("cvDownload", "cvAssetId", result.id, include.downloads, session);
      if (include._count) result._count = { downloads: await collection("cvDownload").countDocuments({ cvAssetId: result.id }, { session }) };
    }
  }
  return applySelect(result, args.select);
};

const updateParts = (data: Query) => {
  const $set: Query = {};
  const $inc: Query = {};
  for (const [key, value] of Object.entries(withoutUndefined(data))) {
    if (value && typeof value === "object" && !(value instanceof Date) && "increment" in value) $inc[key] = value.increment;
    else $set[key] = value;
  }
  return { ...Object.keys($set).length && { $set }, ...Object.keys($inc).length && { $inc } };
};

const delegate = (model: string, session?: ClientSession) => ({
  async findUnique(args: Query) {
    return hydrate(model, await collection(model).findOne(mongoFilter(args.where), { session }), args, session);
  },
  async findFirst(args: Query = {}) {
    const sort = mongoSort(args.orderBy);
    const doc = await collection(model).find(mongoFilter(args.where), { session }).sort(sort).limit(1).next();
    return hydrate(model, doc, args, session);
  },
  async findMany(args: Query = {}) {
    let cursor = collection(model).find(mongoFilter(args.where), { session });
    const sort = mongoSort(args.orderBy);
    if (Object.keys(sort).length) cursor = cursor.sort(sort);
    if (args.skip) cursor = cursor.skip(args.skip);
    if (args.take) cursor = cursor.limit(args.take);
    return Promise.all((await cursor.toArray()).map((doc) => hydrate(model, doc, args, session)));
  },
  async count(args: Query = {}) {
    return collection(model).countDocuments(mongoFilter(args.where), { session });
  },
  async create(args: Query) {
    const now = new Date();
    const doc = withoutUndefined({ ...defaults[model], id: randomUUID(), createdAt: now, updatedAt: now, ...args.data });
    await collection(model).insertOne(doc, { session });
    return hydrate(model, doc, args, session);
  },
  async update(args: Query) {
    const update = updateParts({ ...args.data, updatedAt: new Date() });
    const result = await collection(model).findOneAndUpdate(mongoFilter(args.where), update, { returnDocument: "after", session });
    if (!result) throw new Error(`${model} record not found.`);
    return hydrate(model, result, args, session);
  },
  async updateMany(args: Query) {
    const result = await collection(model).updateMany(mongoFilter(args.where), updateParts({ ...args.data, updatedAt: new Date() }), { session });
    return { count: result.modifiedCount };
  },
  async upsert(args: Query) {
    const existing = await collection(model).findOne(mongoFilter(args.where), { session });
    return existing
      ? this.update({ where: args.where, data: args.update, include: args.include, select: args.select })
      : this.create({ data: args.create, include: args.include, select: args.select });
  },
  async delete(args: Query) {
    const result = await collection(model).findOneAndDelete(mongoFilter(args.where), { session });
    if (!result) throw new Error(`${model} record not found.`);
    return result;
  },
  async deleteMany(args: Query = {}) {
    const result = await collection(model).deleteMany(mongoFilter(args.where), { session });
    return { count: result.deletedCount };
  },
});

const makeDb = (session?: ClientSession): any => {
  const api: Query = {};
  for (const model of modelNames) api[model] = delegate(model, session);
  api.$connect = () => client.connect();
  api.$disconnect = () => client.close();
  api.$ping = () => database.command({ ping: 1 });
  api.$transaction = async (work: any) => {
    if (Array.isArray(work)) return Promise.all(work);
    const transactionSession = client.startSession();
    try {
      return await transactionSession.withTransaction(() => work(makeDb(transactionSession)));
    } finally {
      await transactionSession.endSession();
    }
  };
  return api;
};

export const db = makeDb();

export const ensureDatabaseIndexes = async () => {
  await Promise.all([
    collection("user").createIndex({ email: 1 }, { unique: true }),
    collection("user").createIndex({ firebaseUid: 1 }, { unique: true, sparse: true }),
    collection("passwordResetToken").createIndex({ tokenHash: 1 }, { unique: true }),
    collection("client").createIndex({ email: 1 }, { unique: true }),
    collection("reviewInvitation").createIndex({ tokenHash: 1 }, { unique: true }),
    collection("visitor").createIndex({ visitorKey: 1 }, { unique: true }),
  ]);
};
