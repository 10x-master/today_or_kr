import { Building2, Coins, FileSignature, MapPinned, Mic, Store } from "lucide-react";

const SIX_CORE_SOLUTIONS = [
  { icon: Mic, name: "t.note", desc: "음성 메모 · AI 일정 비서", color: "text-amber-600 bg-amber-50" },
  { icon: Store, name: "t.홈피 & 세일즈", desc: "소상공인 모바일 홈 & CRM", color: "text-emerald-600 bg-emerald-50" },
  { icon: FileSignature, name: "t.sign", desc: "말 한마디로 완성하는 음성 전자계약", color: "text-indigo-600 bg-indigo-50" },
  { icon: MapPinned, name: "t.check", desc: "지오펜싱 출퇴근 · 현장 안심 인증", color: "text-rose-600 bg-rose-50" },
  { icon: Coins, name: "t.refund", desc: "카드 수수료 누수 진단 및 환급", color: "text-blue-600 bg-blue-50" },
  { icon: Building2, name: "아파트 건전성 평가", desc: "K-apt 기반 장기수선충당금·공사비 적정성 진단", color: "text-slate-700 bg-slate-100" },
] as const;

export default function SixCoreSolutionsList({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {SIX_CORE_SOLUTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.name}
            className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2.5"
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 leading-tight">{item.name}</p>
              <p className="text-[11px] text-slate-400 leading-tight truncate">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
