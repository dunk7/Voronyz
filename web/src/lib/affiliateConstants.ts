export const AFFILIATE_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
  "Twitch",
  "Other",
] as const;

export const AFFILIATE_AUDIENCE_SIZES = [
  "Under 1,000",
  "1,000 – 5,000",
  "5,000 – 25,000",
  "25,000 – 100,000",
  "100,000+",
] as const;

export type AffiliatePlatform = (typeof AFFILIATE_PLATFORMS)[number];
export type AffiliateAudienceSize = (typeof AFFILIATE_AUDIENCE_SIZES)[number];

export type AffiliateApplicationRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  platform: string;
  handleOrUrl: string;
  audienceSize: string;
  preferredSlug: string | null;
  preferredCode: string | null;
  niche: string;
  pitch: string;
  status: string;
  createdAt: string;
  approvedCode: string | null;
  approvedSlug: string | null;
  approvedAt: string | null;
};
