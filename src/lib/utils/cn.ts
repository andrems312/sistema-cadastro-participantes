import { clsx, type ClassValue } from "clsx";

/** Junta classes condicionalmente (atalho para clsx). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
