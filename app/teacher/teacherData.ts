import type { StageId } from "../data";

export const TEACHER_ACCESS_CODE = "3035";

export type PreviewStep = {
  label: string;
  stage: StageId;
  variant: string;
  summary: string;
};

export const PREVIEW_STEPS: PreviewStep[] = [
  { label: "시작 화면", stage: "access", variant: "boot", summary: "보안 접속과 수사관 역할 부여" },
  { label: "긴급 사건 접수", stage: "access", variant: "alert", summary: "CASE 017 긴급 경고와 사건 제목" },
  { label: "사건 브리핑", stage: "briefing", variant: "briefing", summary: "사건 개요와 최초 관찰 지시" },
  { label: "움직이는 CCTV", stage: "briefing", variant: "cctv", summary: "CAM 03 복도 영상과 인물 동선" },
  { label: "CASE FILE", stage: "case-file", variant: "case-file", summary: "사건 기록과 중요 단서" },
  { label: "FILE NOT FOUND", stage: "case-file", variant: "missing-file", summary: "삭제된 IMG_2048.jpg 경고" },
  { label: "증거폰 E-01 지급", stage: "evidence-intake", variant: "evidence", summary: "봉인 확인과 모둠 증거물 인계" },
  { label: "PIN 퍼즐", stage: "pin", variant: "pin", summary: "축제 개막일 단서와 PIN 1017" },
  { label: "공폰 조사", stage: "phone-search", variant: "phone-search", summary: "12분 제한 실제 공폰 자유 조사" },
  { label: "DF-2048 발견", stage: "dashboard", variant: "trace", summary: "삭제 흔적 코드 등록" },
  { label: "삭제 데이터 분석", stage: "dashboard", variant: "deleted-data", summary: "삭제 상태와 외부 저장매체 흔적" },
  { label: "microSD 복구", stage: "recovery", variant: "micro-sd", summary: "실제 복구 결과와 파일 상태 판단" },
  { label: "메타데이터 분석", stage: "metadata", variant: "metadata", summary: "촬영 시각·기기·위치 교차검증" },
  { label: "메시지 추출 데이터", stage: "dashboard", variant: "messages", summary: "MOBILE EXTRACTION 메시지 기록" },
  { label: "통화기록", stage: "dashboard", variant: "calls", summary: "추출 통화 시각과 통화 시간" },
  { label: "CCTV 정밀 분석", stage: "cctv-analysis", variant: "frame", summary: "프레임 이동·확대·증거 등록" },
  { label: "타임라인", stage: "timeline", variant: "timeline", summary: "발생 시각순 증거 재배열" },
  { label: "증거보드", stage: "evidence-board", variant: "board", summary: "증거 배치와 연결선 작성" },
  { label: "최종 수사보고서", stage: "report", variant: "report", summary: "인물·증거 3개·판단 근거 제출" },
  { label: "사건 재구성", stage: "reconstruction", variant: "reconstruction", summary: "제출 증거 기반 사건 재생" },
  { label: "디지털 포렌식 직업소개", stage: "career", variant: "career", summary: "실제 업무·진로·수사 윤리" },
];

export const PRINTABLES = [
  { label: "증거봉투 라벨", file: "01_evidence_envelope_label.pdf", description: "E-01 MOBILE DEVICE 증거봉투 부착용" },
  { label: "CASE 017 사건 브리핑", file: "02_case_briefing_card.pdf", description: "사건 개요와 수사 원칙이 포함된 브리핑 카드" },
  { label: "증거번호 라벨 E-01~E-14", file: "03_evidence_number_labels.pdf", description: "증거물과 복구 파일 분류용 번호 라벨" },
  { label: "용의자 카드 A~D", file: "04_suspect_cards.pdf", description: "가상 인물 사진·진술·복장·사건 당시 역할" },
  { label: "증거카드 E-01~E-14", file: "05_evidence_cards.pdf", description: "관찰 사실과 다른 증거 연결점을 기록하는 카드" },
  { label: "타임라인 활동지", file: "06_timeline_worksheet.pdf", description: "발생 시각과 확인 사실을 배열하는 활동지" },
  { label: "수사 메모지", file: "07_investigation_notes.pdf", description: "공폰·microSD·웹 추출 결과 조사 메모" },
  { label: "최종 수사보고서", file: "08_final_investigation_report.pdf", description: "증거 3개 이상과 판단 근거를 작성하는 보고서" },
  { label: "교사용 정답자료", file: "09_teacher_answer_key.pdf", description: "실제 순서·핵심 증거·힌트 순서, 학생 배포 금지" },
  { label: "교사용 수업지도안", file: "10_teacher_lesson_guide.pdf", description: "단계별 진행 멘트·학생 활동·힌트·평가" },
] as const;

export const SUSPECT_PROFILES = [
  {
    id: "A",
    name: "한지원",
    role: "축제 회계 봉사",
    statement: "모금함을 행사실에 두고 담당 교사를 찾으러 갔어요.",
    clothing: "회색 바람막이 · 흰 운동화",
    actual: "18:32 모금함을 정상 보관한 인물. CCTV 동선과 진술이 일치합니다.",
    image: "/case017/suspects/suspect-a.jpg",
  },
  {
    id: "B",
    name: "김민수",
    role: "공연 동아리",
    statement: "그 시간에는 체육관 무대에서 공연 준비를 하고 있었어요.",
    clothing: "검은 후드티 · 검은 백팩",
    actual: "1차 의심 인물이나 18:39~18:49 체육관 영상과 위치 기록으로 배제됩니다.",
    image: "/case017/suspects/suspect-b.jpg",
  },
  {
    id: "C",
    name: "박도윤",
    role: "축제 장비 담당",
    statement: "행사실 앞은 지나갔지만 안에는 들어가지 않았어요.",
    clothing: "검은 후드티 · 밝은 운동화 · 반사형 가방끈",
    actual: "결론 인물. 사진·CCTV의 작은 특징과 메시지·통화 흐름이 일치합니다.",
    image: "/case017/suspects/suspect-c.jpg",
  },
  {
    id: "D",
    name: "서유나",
    role: "축제 사진 기록",
    statement: "운동장 부스 사진을 정리하느라 본관에는 가지 않았어요.",
    clothing: "남색 조끼 · 카메라 스트랩",
    actual: "운동장 촬영 파일의 연속 메타데이터로 본관에 없었던 인물입니다.",
    image: "/case017/suspects/suspect-d.jpg",
  },
] as const;

export const ANSWER_TIMELINE = [
  ["18:32:14", "한지원이 모금함을 행사실에 보관", "E-07 CCTV"],
  ["18:40:52", "박도윤이 행사실 관련 메시지를 전송", "E-11 메시지"],
  ["18:42:17", "목격 사진 IMG_2048.jpg 촬영", "E-05 메타데이터"],
  ["18:43:06", "IMG_2048.jpg 삭제 흔적 생성", "E-02 파일시스템"],
  ["18:44:12", "박도윤과 목격자가 38초 통화", "E-12 통화기록"],
  ["18:47:03", "같은 특징의 인물이 행사실 방향으로 진입", "E-07 CCTV"],
] as const;
