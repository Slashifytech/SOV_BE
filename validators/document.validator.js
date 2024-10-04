import { z } from 'zod';

// Zod schema for Document
export const DocumentUploadSchema = z.object({
  documentName: z.string().nonempty("Document name is required"),  // Required document name
  viewUrl: z.string().nonempty("View URL is required")
});