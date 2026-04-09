import { z } from "zod";

export const emailSchema = z.string().trim().email("Invalid email");
export const phoneSchema = z.string().trim().min(8, "Phone too short");
export const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

export const coordinatesSchema = z.object({
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

/** Polygon vertices as [lng, lat][] matching seed convention */
export const polygonSchema = z
  .array(z.tuple([z.number().gte(-180).lte(180), z.number().gte(-90).lte(90)]))
  .optional();

export const farmFieldFormSchema = z.object({
  name: z.string().trim().min(1, "Name required"),
  region: z.string().trim().min(1),
  zone: z.string().trim().min(1),
  woreda: z.string().trim().min(1),
  kebele: z.string().trim().min(1),
  country: z.string().trim().min(1),
  elevationM: z.number().nonnegative(),
  sizeHectares: z.number().positive(),
  coffeeVarieties: z.array(z.string().trim().min(1)).min(1),
  farmingType: z.string().trim().min(1),
  coordinates: coordinatesSchema,
  polygon: polygonSchema,
  eudrStatus: z.string().trim().min(1),
  notes: z.string().optional(),
});

export const lotWeightSchema = z.number().positive("Weight must be positive");

export const typedLossRowSchema = z.object({
  type: z.string().trim().min(1),
  weightKg: z.number().positive(),
});

export const rfqDraftSchema = z.object({
  title: z.string().trim().min(1),
  commodity: z.string().trim().min(1),
  form: z.string().trim().min(1),
  targetQuantityKg: z.number().positive(),
  minimumGrade: z.string().trim().min(1),
  originPreference: z.array(z.string()).min(1),
  incoterm: z.string().trim().min(1),
  deliveryWindowStart: z.string().min(1),
  deliveryWindowEnd: z.string().min(1),
});

export const offerDraftSchema = z.object({
  rfqId: z.string().min(1),
  offeredQuantityKg: z.number().positive(),
  pricePerKgUsd: z.number().positive(),
  currency: z.string().min(1),
  linkedLotIds: z.array(z.string()).min(1),
});

export const labResultFormSchema = z.object({
  lotId: z.string().min(1),
  contractId: z.string().optional().default(""),
  sampleCode: z.string().trim().min(1),
  moisturePercent: z.number().min(0).max(100),
  screenSize: z.string().trim().min(1),
  defectCount: z.number().int().min(0),
  cupScore: z.number().min(0).max(100),
  gradeConfirmed: z.string().trim().min(1),
});
