/**
 * T.홈페이지 B2B 카탈로그 → 견적 요청 → 견적서 발송 → T.싸인 전자계약 → 결제/세금계산서
 * 오프라인 인쇄 다이어리 B2B 도매 플로우 타입 정의.
 */

/** 카테고리는 관리자 콘솔에서 자유롭게 추가/순서변경/노출토글 가능한 동적 데이터 */
export interface DiaryCategory {
  id: string;
  diary_id: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface DiaryProduct {
  id: string;
  diary_id: string;
  /** DiaryCategory.name과 매칭되는 카테고리명 */
  category: string;
  /** 상품 코드 (예: "MO-07") */
  product_code: string;
  name: string;
  spec: string | null;
  /** 공급가(원가) */
  cost_price: number;
  /** 판매가 = cost_price * 2 (200%) */
  sell_price: number;
  /** 제품 썸네일 색상 (실사 이미지 미등록 시 컬러 커버 썸네일 생성용) */
  color_hex: string;
  /** 관리자가 등록한 실제 제품 사진 URL (없으면 color_hex 기반 생성 커버 사용) */
  image_url: string | null;
  /** 실규격 (예: "커버 124×180mm / 123×185mm") */
  cover_size: string;
  /** 내지 페이지 수 */
  page_count: number;
  /** 원단/재질 정보 (예: "이태리 습식 원단") */
  material_info: string;
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
