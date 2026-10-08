"use client";

import { useState } from "react";
import { MessageCircle, Camera, Store, X, CircleCheckBig } from "lucide-react";

export default function KakaoSubmitBanner() {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");

  function openModal() {
    setModalOpen(true);
    setSubmitted(false);
    setName("");
    setPhone("");
    setCategory("");
  }

  function submit() {
    if (!name || !phone) return;
    setSubmitted(true);
  }

  return (
    <section
      id="kakao-submit"
      className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-300">
          <MessageCircle className="h-5.5 w-5.5 text-zinc-900" />
        </span>
        <div>
          <p className="text-sm font-semibold text-yellow-700">주민 자율 참여 제보</p>
          <h3 className="text-lg font-bold text-zinc-900">
            복잡한 가입 없이, 카카오톡 채널로 바로 제보하세요
          </h3>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-zinc-700">
        <Camera className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
        사진과 글만 카카오톡 채널로 보내주시면 복잡한 가입 절차 없이 우리 동네 피드에
        즉시 등록됩니다.
      </p>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-yellow-300 py-3 text-sm font-bold text-zinc-900 hover:bg-yellow-200"
        >
          <MessageCircle className="h-4 w-4" />
          카카오톡 채널로 제보하기
        </button>
        <button
          type="button"
          onClick={openModal}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-800"
        >
          <Store className="h-4 w-4" />
          소상공인/체험 운영자 무료 등록
        </button>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                소상공인/체험 운영자 무료 등록
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="닫기"
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="mt-5 text-center">
                <CircleCheckBig className="mx-auto h-10 w-10 text-emerald-500" />
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  등록 신청이 접수되었습니다
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  담당자가 영업일 기준 1~2일 내 연락드립니다.
                </p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mt-4 w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white"
                >
                  확인
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="업체/체험명"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="연락처"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="업종/카테고리 (예: 소상공인 혜택, 체험 명소)"
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={!name || !phone}
                  className={`mt-1 w-full rounded-xl py-3 text-sm font-bold transition-colors ${
                    name && phone
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  무료 등록 신청하기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
