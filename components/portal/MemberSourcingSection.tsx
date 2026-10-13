"use client";

import { useState } from "react";
import {
  Package,
  Plus,
  Link as LinkIcon,
  PhoneCall,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  X,
  Send,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  Crown,
} from "lucide-react";
import CatalogAutoParserModal from "@/components/partners/CatalogAutoParserModal";
import AmbassadorPickKitModal from "@/components/portal/AmbassadorPickKitModal";
import GroupBuyVoteButton from "@/components/commerce/GroupBuyVoteButton";

export interface SourcingItem {
  id: string;
  manufacturer: string;
  category: string;
  title: string;
  supplyPrice: string;
  commissionRate: string;
  commissionAmount: string;
  contactNumber: string;
  orderFormUrl?: string;
  description: string;
  shortsScript: string;
}

const MOCK_SOURCING_ITEMS: SourcingItem[] = [
  {
    id: "src-1",
    manufacturer: "노원 로컬 프레스",
    category: "한정판·굿즈",
    title: "2027 로컬 탁상달력 300부 한정판",
    supplyPrice: "9,900원",
    commissionRate: "15%",
    commissionAmount: "건당 1,485원",
    contactNumber: "02-938-1020",
    orderFormUrl: "https://form.naver.com/response/calendar2027",
    description: "상계·노원 사계절 풍경 일러스트 삽입. 아파트 관리소/부녀회 대량 주문 시 단지명 무료 각인 지원.",
    shortsScript: "[15초 쇼츠 대본] 우리 동네 사계절이 담긴 2027 한정판 로컬 달력! 300부 한정으로 단지 입주민 직거래 9,900원 특판 시작했습니다. 프로필 링크픽에서 지금 확인하세요!",
  },
  {
    id: "src-2",
    manufacturer: "(주)탑소닉 코리아",
    category: "주방·설비 특판",
    title: "탑소닉 초음파 싱크볼 단지 특판",
    supplyPrice: "단지 특판가 (35% OFF)",
    commissionRate: "10%",
    commissionAmount: "건당 약 150,000원",
    contactNumber: "1588-4392",
    orderFormUrl: "https://topsonic.co.kr/b2b-apt",
    description: "초음파 진동으로 세제 없이 과일·채소 잔류농약 세척 및 설거지 단축. 단지 10세대 이상 공구 시 무료 시공.",
    shortsScript: "[15초 쇼츠 대본] 아파트 주방 리모델링 1순위 탑소닉 초음파 싱크볼! 입주민 단체 공구로 35% 할인 직거래 공급됩니다. 엠버서더 픽 전용 링크로 특판 상담 신청하세요!",
  },
  {
    id: "src-3",
    manufacturer: "맥케어 헬스케어",
    category: "시니어·돌봄",
    title: "McKare 비접촉 시니어 안심 모니터링 센서",
    supplyPrice: "3채널 패키지 (월 19,800원)",
    commissionRate: "15%",
    commissionAmount: "구독 건당 월 2,970원",
    contactNumber: "070-8821-4190",
    orderFormUrl: "https://mckare.co.kr/apt-senior",
    description: "카메라 없는 밀리미터파 레이더로 사생활 침해 없이 어르신 낙상 및 활동량 24시간 실시간 감지.",
    shortsScript: "[15초 쇼츠 대본] 카메라 없이도 어르신 안전을 지키는 비접촉 안심 센서! 부모님 댁 낙상 사고 실시간 알림. 단지 독거어르신 케어 특가, 링크픽에서 신청하세요!",
  },
];

export default function MemberSourcingSection() {
  const [items, setItems] = useState<SourcingItem[]>(MOCK_SOURCING_ITEMS);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAutoParserModalOpen, setIsAutoParserModalOpen] = useState(false);
  const [registerTab, setRegisterTab] = useState<"single" | "bulk">("single");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCallItem, setActiveCallItem] = useState<SourcingItem | null>(null);
  const [bulkSuccessToast, setBulkSuccessToast] = useState<string | null>(null);
  const [selectedAmbassadorItem, setSelectedAmbassadorItem] = useState<SourcingItem | null>(null);
  const [isAmbassadorKitOpen, setIsAmbassadorKitOpen] = useState(false);

  // 공급 폼 등록 상태
  const [newTitle, setNewTitle] = useState("");
  const [newManufacturer, setNewManufacturer] = useState("");
  const [newSupplyPrice, setNewSupplyPrice] = useState("");
  const [newCommissionRate, setNewCommissionRate] = useState("15%");
  const [newContact, setNewContact] = useState("");
  const [newOrderUrl, setNewOrderUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // LinkPick 복사 & 대본 복사 핸들러
  const handleCopyLinkPickAndScript = (item: SourcingItem) => {
    const textToCopy = `${item.shortsScript}\n\n[주문 및 상담 링크]: ${item.orderFormUrl || item.contactNumber}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy);
    }
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2500);
  };

  // 일괄 등록 콜백 (CatalogAutoParserModal에서 완료 시)
  const handleImportBulkItems = (newItems: SourcingItem[]) => {
    setItems((prev) => [...newItems, ...prev]);
    setBulkSuccessToast(`✓ ${newItems.length}개 상품이 소싱 룸에 일괄 적재되었습니다.`);
    setTimeout(() => {
      setBulkSuccessToast(null);
    }, 3500);
  };

  // 신규 제조 회원사 아이템 등록
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newManufacturer.trim() || !newContact.trim()) return;

    const newItem: SourcingItem = {
      id: `src-${Date.now()}`,
      title: newTitle.trim(),
      manufacturer: newManufacturer.trim(),
      category: "제조 직거래",
      supplyPrice: newSupplyPrice.trim() || "직거래 협의",
      commissionRate: newCommissionRate,
      commissionAmount: `공급가 대비 ${newCommissionRate}`,
      contactNumber: newContact.trim(),
      orderFormUrl: newOrderUrl.trim() || undefined,
      description: newDesc.trim() || "제조사 직접 공급 정품.",
      shortsScript: `[15초 쇼츠 대본] ${newManufacturer}에서 직접 공급하는 ${newTitle}! 단지 주민 한정 직거래로 만나보세요. 링크픽에서 바로 확인 가능합니다!`,
    };

    setItems((prev) => [newItem, ...prev]);
    setRegisterSuccess(true);
    setTimeout(() => {
      setRegisterSuccess(false);
      setIsRegisterModalOpen(false);
      setNewTitle("");
      setNewManufacturer("");
      setNewSupplyPrice("");
      setNewContact("");
      setNewOrderUrl("");
      setNewDesc("");
    }, 1800);
  };

  return (
    <section className="bg-white py-2.5 px-3 border-b border-slate-100 space-y-2">
      {/* 1. 상단 섹션 타이틀 & 제조사 등록 CTA */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white">
            <Package className="h-3.5 w-3.5" />
          </span>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>회원사 아이템 소싱 룸</span>
            <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[10px] font-medium">
              제조 공급 ➔ 엠버서더 중개
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAutoParserModalOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 px-2 py-1 text-[11px] font-medium text-indigo-700 transition-colors cursor-pointer"
            title="엑셀, PDF, 전단지 파일로 수십 개 상품 자동 추출"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600" />
            <span>파일 일괄 등록 (AI)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRegisterTab("single");
              setIsRegisterModalOpen(true);
            }}
            className="flex items-center gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-900 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-amber-700" />
            <span>공급 폼 등록</span>
          </button>
        </div>
      </div>

      {/* 일괄 적재 토스트 알림 */}
      {bulkSuccessToast && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800 font-medium flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{bulkSuccessToast}</span>
        </div>
      )}

      {/* 2. 소싱 아이템 3종 콤팩트 카드 리스트 */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl bg-slate-50/70 p-2.5 space-y-1.5 transition-colors"
          >
            {/* 상단 라인: 제조사, 카테고리, 수수료율 뱃지 */}
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-medium text-slate-900 truncate">
                  {item.title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                  ({item.manufacturer})
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-medium text-rose-700">
                  수수료 {item.commissionRate}
                </span>
                <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[10px] font-normal text-slate-700">
                  {item.supplyPrice}
                </span>
              </div>
            </div>

            {/* 본문 팩트 설명 */}
            <p className="text-[11px] font-normal text-slate-600 line-clamp-1 leading-normal">
              {item.description}
            </p>

            {/* 단지 공동구매 요청(투표) 및 실시간 신청 집계 게이지 바 */}
            <GroupBuyVoteButton
              itemId={item.id}
              itemTitle={item.title}
              apartmentName="상계주공 14단지"
              orderFormUrl={item.orderFormUrl}
            />

            {/* 하단 액션 버튼 2종: [회원사 직거래 상담], [엠버서더 픽 & 쇼츠 킷] */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 gap-2 text-xs">
              <span className="text-[10px] font-normal text-slate-400 truncate">
                중개 수익: <strong className="font-medium text-slate-700">{item.commissionAmount}</strong>
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveCallItem(item)}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-800 transition-colors cursor-pointer"
                  title="회원사 직통 전화 및 상담 주문폼 링크"
                >
                  <PhoneCall className="h-3 w-3 text-slate-700" />
                  <span>회원사 직거래 상담</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAmbassadorItem(item);
                    setIsAmbassadorKitOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-2 py-1 text-[11px] font-medium text-slate-950 transition-colors cursor-pointer shadow-2xs"
                  title="15초 쇼츠 대본, AI 영상 프롬프트, 리퍼럴 딥링크 배포 킷 열기"
                >
                  <Crown className="h-3 w-3 text-slate-950" />
                  <span>👑 엠버서더 픽 & 쇼츠 킷</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 직거래 상담 안내 팝업 모달 */}
      {activeCallItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-4 text-slate-900 shadow-2xl space-y-3 border border-slate-100">
            <button
              type="button"
              onClick={() => setActiveCallItem(null)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-amber-400 font-medium">
                📞
              </span>
              <div>
                <p className="text-[10px] font-normal text-slate-400">
                  {activeCallItem.manufacturer}
                </p>
                <h3 className="text-xs font-medium text-slate-900 leading-snug">
                  {activeCallItem.title}
                </h3>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-2.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-normal text-slate-500">공급가</span>
                <span className="font-medium text-slate-900">{activeCallItem.supplyPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-normal text-slate-500">엠버서더 혜택</span>
                <span className="font-medium text-rose-600">수수료 {activeCallItem.commissionRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-normal text-slate-500">직거래 직통 번호</span>
                <a
                  href={`tel:${activeCallItem.contactNumber}`}
                  className="font-medium text-indigo-600 underline"
                >
                  {activeCallItem.contactNumber}
                </a>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <a
                href={`tel:${activeCallItem.contactNumber}`}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 py-2 text-xs font-medium text-white transition-colors"
              >
                <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
                <span>전화 연결</span>
              </a>
              {activeCallItem.orderFormUrl && (
                <a
                  href={activeCallItem.orderFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 py-2 text-xs font-medium text-indigo-800 transition-colors"
                >
                  <span>주문폼 열기</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. 신규 제조 회원사 공급 폼 등록 모달 */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4.5 text-slate-900 shadow-2xl space-y-3 border border-slate-100">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute right-3.5 top-3.5 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div>
              <span className="rounded bg-amber-50 text-amber-800 px-2 py-0.5 text-[10px] font-medium">
                PG 없는 자율 직거래
              </span>
              <h3 className="text-sm font-medium text-slate-900 mt-1">
                제조 회원사 공급 아이템 등록
              </h3>
              <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                제조/유통사가 공급가를 직접 설정하고 유통 엠버서더에게 판매 중개 수수료를 제공합니다.
              </p>
            </div>

            {/* 등록 방식 탭 분기 (직접 1건 등록 vs 파일로 일괄 등록) */}
            <div className="flex border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setRegisterTab("single")}
                className={`pb-1.5 px-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
                  registerTab === "single"
                    ? "border-amber-500 text-amber-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                ✏️ 직접 1건 등록
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setIsAutoParserModalOpen(true);
                }}
                className="pb-1.5 px-2.5 font-medium border-b-2 border-transparent text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                <FileSpreadsheet className="h-3 w-3" />
                <span>📄 파일로 일괄 등록 (엑셀/카탈로그/PDF)</span>
              </button>
            </div>

            {registerSuccess ? (
              <div className="rounded-xl bg-emerald-50 p-3.5 text-center space-y-1 animate-in zoom-in-95">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-medium text-emerald-900">
                  아이템이 소싱 룸에 등록되었습니다!
                </p>
                <p className="text-[11px] font-normal text-emerald-700">
                  지역 엠버서더들의 LinkPick과 15초 쇼츠 채널에 노출됩니다.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      공급 상품명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: 친환경 아파트 방충망 키트"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      제조/공급사 상호명 *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="예: (주)에코홈텍"
                      value={newManufacturer}
                      onChange={(e) => setNewManufacturer(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      공급가 / 단지 특판가
                    </label>
                    <input
                      type="text"
                      placeholder="예: 29,000원 또는 특판가"
                      value={newSupplyPrice}
                      onChange={(e) => setNewSupplyPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      엠버서더 중개 수수료율
                    </label>
                    <select
                      value={newCommissionRate}
                      onChange={(e) => setNewCommissionRate(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="10%">10%</option>
                      <option value="15%">15% (권장)</option>
                      <option value="20%">20%</option>
                      <option value="25%">25%</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      직거래 연락처 (전화번호) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="010-0000-0000"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-normal text-slate-500 mb-1">
                      네이버폼 / 결제계좌 링크
                    </label>
                    <input
                      type="url"
                      placeholder="https://form.naver.com/..."
                      value={newOrderUrl}
                      onChange={(e) => setNewOrderUrl(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-normal text-slate-500 mb-1">
                    상품 핵심 특징 (1줄 요약)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="예: 단지 공구 시 20% 추가 할인, 자율 시공 가능한 고강도 메쉬 망."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 py-2 text-xs font-medium text-slate-950 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>소싱 룸에 공급 아이템 등록하기</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. 엑셀/PDF/AI 카탈로그 자동 파서 모달 */}
      <CatalogAutoParserModal
        isOpen={isAutoParserModalOpen}
        onClose={() => setIsAutoParserModalOpen(false)}
        onImportItems={handleImportBulkItems}
        defaultManufacturer={newManufacturer || "투데이 제휴 회원사"}
      />

      {/* 6. 엠버서더 1-Click 쇼츠 스크립트 & 리퍼럴 딥링크 배포 킷 모달 */}
      <AmbassadorPickKitModal
        isOpen={isAmbassadorKitOpen}
        onClose={() => setIsAmbassadorKitOpen(false)}
        item={selectedAmbassadorItem}
      />
    </section>
  );
}
