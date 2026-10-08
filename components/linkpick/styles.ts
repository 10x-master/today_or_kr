// 여러 컴포넌트가 함께 쓰는 클래스 묶음. (LinkPick 프로젝트에서 이식)

export const card = "rounded-3xl border border-slate-100 bg-white";

// 호버 시 살짝 떠오르며 그림자가 번지는 효과. 클릭 가능한 카드에만 붙인다.
export const liftCard =
  "transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 focus-visible:-translate-y-1 focus-visible:shadow-xl focus-visible:shadow-slate-200/60 outline-none";

export type ButtonSize = "sm" | "md" | "lg";

const buttonSizes: Record<ButtonSize, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-6 py-3.5 text-sm",
  lg: "px-8 py-4 text-base",
};

const pill =
  "inline-flex items-center justify-center rounded-full font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function primaryButtonClass(size: ButtonSize = "md"): string {
  return `${pill} ${buttonSizes[size]} bg-primary text-white hover:bg-primary-hover disabled:bg-slate-300`;
}

export function outlineButtonClass(size: ButtonSize = "sm"): string {
  return `${pill} ${buttonSizes[size]} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`;
}

export const primaryButton = primaryButtonClass("md");
export const outlineButton = outlineButtonClass("sm");

export const badge =
  "inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary";

export const input =
  // 16px 미만이면 iOS에서 입력 시 자동 확대가 발생한다.
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20";

export const fieldLabel = "mb-1.5 block text-sm font-bold text-slate-800";

export const errorText = "mt-1 text-sm font-bold text-red-600";
