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
