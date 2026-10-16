/**
 * 투데이(Today.) 서비스 법적 운영 주체 및 개인정보 보호책임자(CPO) 공통 정보.
 * /terms, /privacy, 로그인 모달/페이지의 약관 동의 [보기] 팝업에서 공통으로 참조한다.
 */

export const LEGAL_OPERATOR_NAME = "중소기업사업전환지원단";

export const PRIVACY_OFFICER_NAME = "최광웅";
export const PRIVACY_OFFICER_CONTACT = "1661-0783";

export const DATA_RETENTION_POLICY_SUMMARY =
  "통신비밀보호법, 전자상거래 등에서의 소비자보호에 관한 법률, 개인정보 보호법 등 관계 법령에 따라 보존이 필요한 경우, 해당 법령에서 정한 법정 최대 보관 기간 동안 안전하게 보관한 후 지체 없이 파기합니다.";

/** 로그인 동의 체크박스의 [보기] 팝업에 노출되는 요약 본문 */
export const TERMS_AGREEMENT_SUMMARY = `제1조 (목적)
본 약관은 ${LEGAL_OPERATOR_NAME}(이하 "운영자")가 제공하는 투데이(Today.) 서비스의 이용 조건과 회원 및 운영자의 권리·의무·책임 사항을 정합니다.

제2조 (회원의 의무)
회원은 서비스 이용 시 관계 법령과 본 약관을 준수해야 하며, 타인의 권리를 침해하거나 서비스 운영을 방해해서는 안 됩니다. 특히 사진·영상·음성 등 미디어 등록 시 제3자의 초상권을 침해하지 않아야 하며, 위반 시 모든 민·형사상 책임은 등록한 회원 본인에게 있습니다.

제3조 (서비스의 제공 및 변경)
운영자는 t.note, t.sign, t.check, t.refund, 비즈홈 등 제반 서비스를 제공하며, 운영상·기술상 필요에 따라 서비스 내용을 변경할 수 있습니다.

자세한 전문은 서비스 이용약관 페이지에서 확인하실 수 있습니다.`;

export const PRIVACY_AGREEMENT_SUMMARY = `수집 항목
카카오/구글 간편로그인을 통한 이메일, 닉네임, 프로필 사진 및 서비스 이용 과정에서 생성되는 접속 기록, 기기 정보.

수집 및 이용 목적
회원 식별 및 본인 확인, 서비스 제공(t.note·t.sign·t.check·t.refund·비즈홈 등), 민원 처리, 중요 고지사항 전달.

보유 및 파기 기준
${DATA_RETENTION_POLICY_SUMMARY}

개인정보 보호책임자(CPO)
${PRIVACY_OFFICER_NAME} / 문의 ${PRIVACY_OFFICER_CONTACT} / 소속 ${LEGAL_OPERATOR_NAME}

자세한 전문은 개인정보 처리방침 페이지에서 확인하실 수 있습니다.`;

export const MARKETING_AGREEMENT_SUMMARY = `투데이(Today.)는 아래와 같은 선택 정보를 카카오 알림톡 등으로 안내해 드릴 수 있습니다.

- t.note·t.sign·t.check·t.refund 등 이용 중인 솔루션의 분석 리포트 및 활용 팁
- 거주/영업 지역 지자체의 정책자금, 행정 고시, 생활 혜택 소식

본 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에 제한이 없습니다. 동의 이후에도 언제든지 설정 메뉴에서 수신을 거부할 수 있습니다.`;
