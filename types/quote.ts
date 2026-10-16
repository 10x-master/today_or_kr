/**
 * T.홈페이지 B2B 카탈로그 → 견적 요청 → 견적서 발송 → T.싸인 전자계약 → 결제/세금계산서
 * 오프라인 인쇄 다이어리 B2B 도매 플로우 타입 정의.
 */

export type DiaryProductCategory = "양장" | "스프링" | "시스템" | "한정특가";

/** 수량 구간별 단가 (예: 100부 이상 2,500원, 200부 이상 2,200원 ...) */
export interface DiaryPriceTier {
  minQty: number;
  unitPrice: number;
}

export interface DiaryProduct {
  id: string;
  diary_id: string;
  category: DiaryProductCategory;
  /** 상품 코드 (예: "MO-07") */
  product_code: string;
  name: string;
  spec: string | null;
  price_tiers: DiaryPriceTier[];
  image_url: string | null;
  created_at: string;
}

export type QuoteStatus = "REQUESTED" | "QUOTED" | "SIGNED" | "PAID";

export interface QuoteItem {
  product_id: string;
  product_code: string;
  product_name: string;
  quantity: number;
  /** 단가 (카탈로그 요청 시점 스냅샷, 관리자가 견적 확정 시 조정 가능) */
  unit_price: number;
}

export interface QuoteRequest {
  id: string;
  diary_id: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  items: QuoteItem[];
  print_options: string | null;
  status: QuoteStatus;
  packaging_fee: number;
  shipping_fee: number;
  /** 상품 금액 합계 (items 기준 자동 계산) */
  subtotal: number;
  /** 최종 공급가 (subtotal + packaging_fee + shipping_fee) */
  final_amount: number;
  admin_memo: string | null;
  t_sign_doc_id: string | null;
  sign_status: "NONE" | "REQUESTED" | "COMPLETED";
  payment_requested: boolean;
  created_at: string;
  updated_at: string;
}
