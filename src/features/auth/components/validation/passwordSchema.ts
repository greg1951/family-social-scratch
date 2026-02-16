import {z} from 'zod';

export const passwordSchema = z
  .string()
  .min(5, "Password should constain at least 5 characters");