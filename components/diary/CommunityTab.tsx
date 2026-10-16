"use client";

import { useEffect, useState } from "react";
import { Check, Lock, MessageCircle, Send, UserPlus } from "lucide-react";
import type { DiaryComment, DiaryMember, DiaryMemberRole, DiaryPost } from "@/types/diary";

const ROLE_LABEL: Record<DiaryMemberRole, string> = {
  OWNER: "👑 운영자",
  TEACHER: "🍎 선생님",
  PARENT: "👨‍👩‍👧 학부모",
  STUDENT: "🎒 학생",
};

const GRADE_OPTIONS = ["1학년", "2학년", "3학년"];

export default function CommunityTab({
  diaryId,
  userId,
  membership,
  onShowToast,
}: {
  diaryId: string;
  userId: string;
  membership: DiaryMember | null;
  onShowToast: (msg: string) => void;
}) {
  const isApproved = membership?.status === "APPROVED";
  const isTeacherOrOwner = isApproved && (membership?.role === "TEACHER" || membership?.role === "OWNER");

  const [posts, setPosts] = useState<DiaryPost[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, DiaryComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [pendingMembers, setPendingMembers] = useState<DiaryMember[]>([]);

  const [isPostFormOpen, setIsPostFormOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postMediaUrl, setPostMediaUrl] = useState("");
  const [postTargetGrades, setPostTargetGrades] = useState<string[]>([]);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  const loadPosts = () => {
    if (!isApproved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/t-diary/posts?diary_id=${encodeURIComponent(diaryId)}`)
      .then((res) => res.json())
      .then(async (data) => {
        const list: DiaryPost[] = data.posts || [];
        const visible = isTeacherOrOwner
          ? list
          : list.filter(
              (p) =>
                p.target_grades.includes("ALL") ||
                (membership?.grade_tags.includes("ALL") ?? false) ||
                p.target_grades.some((g) => membership?.grade_tags.includes(g))
            );
        setPosts(visible);

        const entries = await Promise.all(
          visible.map(async (p) => {
            const res = await fetch(`/api/t-diary/comments?post_id=${encodeURIComponent(p.id)}`);
            const d = await res.json();
            return [p.id, d.comments || []] as const;
          })
        );
        setCommentsByPost(Object.fromEntries(entries));
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  };

  const loadPendingMembers = () => {
    if (!isTeacherOrOwner) return;
    fetch(`/api/t-diary/members?diary_id=${encodeURIComponent(diaryId)}`)
      .then((res) => res.json())
      .then((data) => setPendingMembers((data.members || []).filter((m: DiaryMember) => m.status === "PENDING")))
      .catch(() => setPendingMembers([]));
  };

  useEffect(() => {
    loadPosts();
    loadPendingMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryId, isApproved]);

  const handleApproveMember = async (member: DiaryMember) => {
    await fetch("/api/t-diary/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: member.id, status: "APPROVED" }),
    });
    setPendingMembers((prev) => prev.filter((m) => m.id !== member.id));
    onShowToast(`${member.user_id} 님의 가입을 승인했습니다.`);
  };

  const togglePostGrade = (grade: string) => {
    setPostTargetGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;
    setIsSubmittingPost(true);
    try {
      await fetch("/api/t-diary/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diary_id: diaryId,
          author_id: userId,
          author_role: membership?.role || "TEACHER",
          title: postTitle.trim(),
          content: postContent.trim() || null,
          media_urls: postMediaUrl.trim() ? [postMediaUrl.trim()] : [],
          target_grades: postTargetGrades.length ? postTargetGrades : ["ALL"],
        }),
      });
      setPostTitle("");
      setPostContent("");
      setPostMediaUrl("");
      setPostTargetGrades([]);
      setIsPostFormOpen(false);
      loadPosts();
      onShowToast("📝 알림장이 등록되었습니다.");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleSubmitComment = async (postId: string) => {
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return;
    const res = await fetch("/api/t-diary/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId, author_id: userId, content }),
    });
    const data = await res.json();
    if (data.comment) {
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment] }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  if (!isApproved) {
    return (
      <div className="mt-5 rounded-2xl border border-slate-100 p-6 text-center">
        <Lock className="mx-auto h-6 w-6 text-slate-300" />
        <p className="mt-2 text-xs font-bold text-slate-500">
          우리 반 커뮤니티는 승인된 구성원만 열람할 수 있는 폐쇄형 공간입니다.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">가입 신청 후 선생님의 승인을 받으면 전체 피드가 열립니다.</p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {/* 선생님/운영자 전용: 가입 승인 대기 패널 */}
      {isTeacherOrOwner && pendingMembers.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <UserPlus className="h-3.5 w-3.5" />
            가입 승인 대기 ({pendingMembers.length})
          </p>
          <div className="mt-2 space-y-1.5">
            {pendingMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-white p-2 text-xs">
                <span className="text-slate-700">
                  {ROLE_LABEL[m.role]} · {m.grade_tags.join(", ")} · {m.user_id}
                </span>
                <button
                  type="button"
                  onClick={() => handleApproveMember(m)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-blue-700 cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                  승인
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 선생님/운영자 전용: 알림장 작성 */}
      {isTeacherOrOwner && (
        <div className="rounded-2xl border border-slate-100 p-3.5">
          <button
            type="button"
            onClick={() => setIsPostFormOpen((v) => !v)}
            className="text-xs font-bold text-blue-600 cursor-pointer"
          >
            {isPostFormOpen ? "작성 취소" : "+ 알림장 작성"}
          </button>

          {isPostFormOpen && (
            <form onSubmit={handleSubmitPost} className="mt-2.5 space-y-2">
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="제목"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={2}
                placeholder="내용"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 resize-none"
              />
              <input
                type="url"
                value={postMediaUrl}
                onChange={(e) => setPostMediaUrl(e.target.value)}
                placeholder="사진 URL (선택)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <div className="flex flex-wrap gap-1.5">
                {GRADE_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => togglePostGrade(g)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      postTargetGrades.includes(g) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500"
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <span className="text-[10px] text-slate-400 self-center">미선택 시 전체 학년 공개</span>
              </div>
              <button
                type="submit"
                disabled={isSubmittingPost || !postTitle.trim()}
                className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-40 cursor-pointer"
              >
                등록
              </button>
            </form>
          )}
        </div>
      )}

      {/* 피드 */}
      {loading ? (
        <p className="text-center text-xs text-slate-300 py-8">불러오는 중...</p>
      ) : posts.length === 0 ? (
        <p className="text-center text-xs text-slate-300 py-8">아직 등록된 알림장/활동이 없습니다.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="rounded-2xl border border-slate-100 p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span>{ROLE_LABEL[post.author_role]}</span>
              <span>·</span>
              <span>{post.created_at.slice(0, 10)}</span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-900">{post.title}</p>
            {post.content && <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">{post.content}</p>}
            {post.media_urls.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {post.media_urls.map((url, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={idx} src={url} alt={post.title} className="h-32 w-auto shrink-0 rounded-xl object-cover" />
                ))}
              </div>
            )}

            {/* 비밀 댓글 (안심 소통창구) */}
            <div className="mt-3 border-t border-slate-100 pt-2.5 space-y-1.5">
              <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <MessageCircle className="h-3 w-3" />
                비밀 댓글 ({(commentsByPost[post.id] || []).length})
              </p>
              {(commentsByPost[post.id] || []).map((c) => (
                <div key={c.id} className="rounded-lg bg-slate-50/70 px-2.5 py-1.5 text-[11px] text-slate-600">
                  {c.content}
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={commentDrafts[post.id] || ""}
                  onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  placeholder="선생님께만 보이는 비밀 댓글을 남겨보세요"
                  className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleSubmitComment(post.id)}
                  className="rounded-lg bg-slate-900 p-1.5 text-white cursor-pointer"
                  aria-label="댓글 등록"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
