/**
 * t.note (/workspace) 자연어 파서, 음성/오디오 파이프라인 및 일정 연동 타입 정의
 */

export type NoteCategory = "PLACE" | "PERSON" | "WORK" | "TRAVEL";
export type SyncStatus = "SYNCED" | "LOCAL";
export type VoiceInputMode = "voice" | "audio" | "text";

/**
 * 한국어 자연어 파서 파싱 결과 인터페이스
 */
export interface ParsedNoteData {
  title: string;
  scheduled_at: string | null; // ISO 8601 문자열 (예: "2026-10-14T15:00:00.000Z")
  location: string | null;     // 장소 텍스트 (예: "상계주공 14단지 관리소")
  category: NoteCategory;      // 'PLACE' | 'PERSON' | 'WORK' | 'TRAVEL'
  is_todo: boolean;            // 할 일 여부
  raw_text: string;            // 원본 텍스트
  reminder_minutes?: number;   // 기본 10분
}

/**
 * 음성/오디오 처리 상태
 */
export interface AudioProcessingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioFile?: File | null;
  audioDuration?: number;
  transcriptionProgress?: number;
  errorMessage?: string | null;
}

/**
 * t.노트(/t-note) Google Keep 스타일 카드 — DB 테이블 tnote_cards 매핑.
 * 2-Tap(사진+음성) 캡처로 생성되며 LinkPick 숏링크가 자동 결합된다.
 */
export interface TnoteCard {
  id: string;
  tenant_id?: string | null;
  user_id?: string | null;
  card_type: "VOICE" | "LOCATION" | "TODO" | "NOTE";
  title: string;
  content?: string;
  voice_audio_url?: string | null;
  voice_duration_sec?: number | null;
  location_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  todo_items?: Array<{ text: string; done: boolean }>;
  color?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  order_index?: number;
  tags?: string[];
  /** 기본값 true — 본인만 보이는 비공개 카드 */
  is_private?: boolean;
  /** true면 /t-note 공개 피드(투데이노트 숏링크 피드)에 노출 */
  is_public_feed?: boolean;
  /** true면 공개 피드에서 작성자 신원을 숨김 */
  is_anonymous?: boolean;
  photo_url?: string | null;
  youtube_url?: string | null;
  short_link?: string | null;
  sourcing_item?: { id: string; name: string; price: string; emoji: string } | null;
  created_at?: string;
  updated_at?: string;
}
