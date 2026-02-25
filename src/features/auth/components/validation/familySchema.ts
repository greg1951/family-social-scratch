import {z} from 'zod';

export const familySchema = z
  .string()
  .min(10, "Family name must be at least 10 characters")
  .max(30, "Family name cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Only lowercase letters, numbers, and underscores are allowed"
  );