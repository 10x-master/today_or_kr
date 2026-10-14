/**
 * 티홈페이지(t.homepage) & 로컬 구인(Today Local Job Board) 타입 규격
 * (Supabase tenants, job_postings, job_applicants 스키마 100% 호환)
 */

import type { LinkPickDeskItem } from "./desk";

export type TenantBusinessType =
  | "STORE"
  | "CLINIC"
  | "FACTORY"
  | "DISTRIBUTOR"
  | "APARTMENT"
  | "RESTAURANT"
  | "CAFE"
  | "SERVICE"
  | "GYM";

export interface TenantProfile {
  id: string;
  slug: string;
  name: string;
  business_type: TenantBusinessType;
  category_name: string;
  verified: boolean;
  biz_reg_number: string;
  representative_name: string;
  tel: string;
  road_address: string;
  detail_address?: string;
  dong: string;
  district_code: string;
  lat: number;
  lng: number;
  video_url?: string;
  video_poster?: string;
  short_intro: string;
  operating_hours: string;
  tags: string[];
  owner_user_id?: string;
  linkpick_items?: LinkPickDeskItem[];
}

export type JobEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "DISPATCH";

export type JobRoleCategory =
  | "HALL"
  | "KITCHEN"
  | "PATROL"
  | "MAINTENANCE"
  | "BARISTA"
  | "DESK"
  | "LOGISTICS"
  | "OTHER";

export type JobSalaryType = "HOURLY" | "MONTHLY" | "ANNUAL" | "PER_CASE";

export interface JobPostingItem {
  id: string;
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  business_type: TenantBusinessType;
  category_name: string;
  title: string;
  employment_type: JobEmploymentType;
  role_category: JobRoleCategory;
  salary_type: JobSalaryType;
  salary_amount: number;
  salary_text: string;
  work_schedule: string;
  work_address: string;
  dong: string;
  district_code: string;
  distance_text: string;
  description: string;
  requirements: string;
  is_syndicated_to_local: boolean;
  status: "OPEN" | "CLOSED" | "PAUSED";
  applicant_count: number;
  created_at: string;
}

export interface JobApplicantSubmission {
  id: string;
  job_posting_id: string;
  tenant_id: string;
  tenant_name: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_intro: string;
  pipeline_stage: "APPLIED" | "SCREENING" | "INTERVIEW" | "HIRED";
  applied_at: string;
}
