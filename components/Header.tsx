"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, Bell, MessageCircle } from "lucide-react";

const NAV_LINKS = [
  { label: "로컬 큐레이션", href: "#local-culture" },
  { label: "링크픽 샵", href: "#link-shop" },
  { label: "동네 제보", href: "#kakao-submit" },
  { label: "협회 소개", href: "#about" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [phone, setPhone] = useState("");

  function openModal() {
    setMenuOpen(false);
    setModalOpen(true);
    setSubmitted(false);
    setPhone("");
  }

  function submit() {
    if (!phone) return;
    setSubmitted(true);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
            <Sparkles className="h-4.5 w-4.5 text-zinc-900" />
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            투데이픽 <span className="text-amber-500">Today Pick</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-amber-300"
          >
            <Bell className="h-4 w-4" />내 픽(Pick) 카카오 알림 신청
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 md:hidden"
          aria-label="메뉴 열기"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-1 border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={openModal}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2.5 text-sm font-bold text-zinc-900"
          >
            <Bell className="h-4 w-4" />내 픽(Pick) 카카오 알림 신청
          </button>
        </nav>
      )}

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
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-300">
                  <MessageCircle className="h-4.5 w-4.5 text-zinc-900" />
                </span>
                <h3 className="text-base font-bold text-zinc-900">
                  내 픽(Pick) 카카오 맞춤 알림
                </h3>
              </div>
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
                <p className="text-sm font-semibold text-zinc-900">
                  신청이 완료되었습니다!
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  선택하신 지역·카테고리의 투데이픽 소식을 카카오톡으로 보내드려요.
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
              <>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  선택한 우리 동네와 관심 카테고리의 꿀정보, 축제, 혜택을 카카오톡
                  채널로 매일 맞춤 알림 받아보세요.
                </p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="카카오톡 알림을 받을 휴대폰 번호"
                  className="mt-4 w-full rounded-xl border border-zinc-300 px-3.5 py-3 text-sm text-zinc-900 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={!phone}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-bold transition-colors ${
                    phone
                      ? "bg-yellow-300 text-zinc-900 hover:bg-yellow-200"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  카카오 채널로 맞춤 알림 신청하기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
