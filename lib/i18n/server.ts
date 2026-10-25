import "server-only";
import { cache } from "react";
import { getDictionary } from "./dictionaries";

// Translations for server components; client components use `useTranslations`.
export const tServer = cache(getDictionary);
