export type AdminSubmission = {
  id: string;
  name: string;
  email: string | null;
  customizationRequest: string | null;
  originalFileName: string;
  storageKey: string;
  sizeBytes: number;
  sizeMb: number;
  createdAt: string;
};
