import {z} from 'zod';

export const passwordSchema = z
  .string()
  .min(5, "Should be at least 5 characters");