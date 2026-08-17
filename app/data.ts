export type StageId =
  | "access"
  | "briefing"
  | "case-file"
  | "evidence-intake"
  | "pin"
  | "phone-search"
  | "dashboard"
  | "recovery"
  | "metadata"
  | "cctv-analysis"
  | "timeline"
  | "evidence-board"
  | "report"
  | "reconstruction"
  | "career";

export const STAGES: Array<{ id: StageId; label: string; mission: string }> = [
  { id: "access", label: "보안 접속", mission: "SYSTEM" },
  { id: "briefing", label: "긴급 브리핑", mission: "CASE 017" },
  { id: "case-file", label: "사건 파일", mission: "MISSION 00" },
  { id: "evidence-intake", label: "증거물 반입", mission: "MISSION 01" },
  { id: "pin", label: "접근 권한 확인", mission: "MISSION 01" },
  { id: "phone-search", label: "증거폰 조사", mission: "MISSION 01" },
  { id: "dashboard", label: "흔적 분석", mission: "MISSION 01" },
  { id: "recovery", label: "삭제 데이터 복구", mission: "MISSION 02" },
  { id: "metadata", label: "메타데이터", mission: "MISSION 03" },
  { id: "cctv-analysis", label: "CCTV 프레임", mission: "MISSION 03" },
  { id: "timeline", label: "시간 재구성", mission: "MISSION 04" },
  { id: "evidence-board", label: "증거 교차검증", mission: "MISSION 04" },
  { id: "report", label: "수사 결론", mission: "FINAL REPORT" },
  { id: "reconstruction", label: "사건 재구성", mission: "CASE REVIEW" },
  { id: "career", label: "직업 연결", mission: "DEBRIEF" },
];

export type EvidenceId =
  | "deleted-trace"
  | "recovered-photo"
  | "metadata"
  | "cctv"
  | "message"
  | "call"
  | "location";

export const EVIDENCE: Record<
  EvidenceId,
  { code: string; title: string; detail: string; type: string }
> = {
  "deleted-trace": {
    code: "E-02",
    title: "삭제 파일 흔적",
    detail: "IMG_2048.jpg · DELETED · 외부 저장매체 사용",
    type: "FILE SYSTEM",
  },
  "recovered-photo": {
    code: "E-03",
    title: "복구된 목격 사진",
    detail: "검은 후드 · 밝은 운동화 · 반사형 가방끈",
    type: "RECOVERED IMAGE",
  },
  metadata: {
    code: "E-05",
    title: "사진 메타데이터",
    detail: "촬영 18:42:17 · 행사실 동쪽 복도",
    type: "EXIF",
  },
  cctv: {
    code: "E-07",
    title: "CCTV 중요 프레임",
    detail: "18:47:06 · 밝은 운동화와 반사형 가방끈",
    type: "VIDEO FRAME",
  },
  message: {
    code: "E-11",
    title: "메시지 기록",
    detail: "18:40:52 · ‘행사실 앞에 둔 것 확인했어.’",
    type: "MESSAGE LOG",
  },
  call: {
    code: "E-12",
    title: "통화 기록",
    detail: "18:44:12 · 목격자와 38초 통화",
    type: "CALL LOG",
  },
  location: {
    code: "E-14",
    title: "위치 기록",
    detail: "용의자 B · 18:39~18:49 체육관 무대",
    type: "LOCATION",
  },
};

export const SUSPECTS = [
  {
    id: "A",
    name: "한지원",
    role: "축제 회계 봉사",
    note: "18:32 행사실 앞 CCTV 포착",
  },
  {
    id: "B",
    name: "김민수",
    role: "공연 동아리",
    note: "검은 후드 소유 · 1차 의심 인물",
  },
  {
    id: "C",
    name: "박도윤",
    role: "축제 장비 담당",
    note: "밝은 운동화 · 반사형 가방끈",
  },
] as const;

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  source: string;
};

export const CORRECT_TIMELINE: TimelineItem[] = [
  {
    id: "a-enter",
    time: "18:32:14",
    title: "지원이 모금함을 행사실에 보관",
    source: "E-07 CCTV",
  },
  {
    id: "message",
    time: "18:40:52",
    title: "도윤의 행사실 관련 메시지 전송",
    source: "E-11 메시지",
  },
  {
    id: "photo",
    time: "18:42:17",
    title: "목격 사진 촬영",
    source: "E-05 메타데이터",
  },
  {
    id: "delete",
    time: "18:43:06",
    title: "IMG_2048.jpg 삭제 흔적 생성",
    source: "E-02 파일시스템",
  },
  {
    id: "call",
    time: "18:44:12",
    title: "도윤과 목격자 38초 통화",
    source: "E-12 통화기록",
  },
  {
    id: "c-enter",
    time: "18:47:03",
    title: "밝은 운동화 인물 행사실 방향 진입",
    source: "E-07 CCTV",
  },
];

export const GROUP_STAGES = [
  "증거폰 조사 중",
  "삭제 데이터 분석",
  "메타데이터 분석",
  "CCTV 프레임 분석",
  "타임라인 작성",
  "최종 보고서 작성",
];

export const TIME_PRESETS = {
  40: [3, 6, 5, 9, 6, 5, 3, 3],
  50: [4, 8, 7, 11, 7, 6, 4, 3],
  60: [5, 9, 8, 14, 9, 8, 4, 3],
  90: [7, 14, 12, 21, 13, 12, 6, 5],
} as const;

export const LESSON_STEPS = [
  {
    title: "1. 사건 브리핑",
    teacher: "조명을 낮추고 ‘지금부터 여러분은 디지털 포렌식 수사관입니다’라고 안내한 뒤 사건을 재생합니다.",
    student: "CCTV를 관찰하고 처음 눈에 들어온 인물·시각·행동을 메모합니다.",
    reaction: "검은 옷 인물을 곧바로 범인이라고 단정하려는 반응이 자주 나옵니다.",
    hint: "‘관찰한 사실’과 ‘추측’을 두 칸으로 나누어 적게 하세요.",
    caution: "아직 용의자 정보를 확정적으로 설명하지 않습니다.",
  },
  {
    title: "2. 증거폰 확보·조사",
    teacher: "증거봉투 번호와 봉인 상태를 함께 확인한 뒤 모둠 대표가 개봉하게 합니다.",
    student: "PIN 단서를 해석하고 실제 공폰의 기본 갤러리, 파일 앱, microSD 존재 여부를 자유롭게 조사합니다.",
    reaction: "교사에게 어느 앱을 열어야 하는지 바로 묻는 경우가 많습니다.",
    hint: "‘사진이 저장된 위치와 파일이 저장된 위치는 같을까?’까지만 안내합니다.",
    caution: "수업용 공폰 외 개인 휴대폰은 조사하지 않습니다.",
  },
  {
    title: "3. 디지털 증거 등록",
    teacher: "공폰에 보이는 자료와 웹 시스템의 모바일 추출 결과가 서로 다른 증거 표현임을 설명합니다.",
    student: "웹 추출 데이터에서 삭제 흔적, 메시지와 통화기록의 시간 및 저장 위치를 판독합니다.",
    reaction: "삭제 흔적을 발견하면 곧바로 사진 내용까지 안다고 생각할 수 있습니다.",
    hint: "‘흔적이 있다는 것’과 ‘내용을 복구한 것’은 다르다고 질문하세요.",
    caution: "추출 결과 화면을 가짜 채팅 앱처럼 설명하지 않습니다.",
  },
  {
    title: "4. microSD 삭제 데이터 복구",
    teacher: "microSD를 분리하고 리더기에 연결하도록 안내한 뒤 지정된 무료 복구 도구의 검색 범위만 확인합니다.",
    student: "읽기 중심으로 검색해 IMG_2048.jpg를 노트북 폴더로 복구하고 DF-2048을 웹 시스템에 등록합니다.",
    reaction: "복구율 숫자가 높으면 내용도 완전하다고 오해할 수 있습니다.",
    hint: "파일 크기, 미리보기, 열림 여부를 각각 확인하게 하세요.",
    caution: "복구 전 저장매체에 새 파일을 쓰지 않습니다. 결과는 노트북의 별도 폴더에 저장합니다.",
  },
  {
    title: "5. 메타데이터·CCTV 분석",
    teacher: "사진의 촬영 시각과 CCTV 시각을 나란히 제시하고 무엇이 일치·불일치하는지 묻습니다.",
    student: "메타데이터와 CCTV 프레임을 확대·비교하여 인상착의의 공통 특징을 등록합니다.",
    reaction: "검은 후드만 보고 B라고 확신했다가 위치 기록에서 혼란을 겪습니다.",
    hint: "옷 색 외에 바꾸기 어려운 작은 특징 두 가지를 찾게 하세요.",
    caution: "메타데이터는 변경될 수 있으므로 단독 증거로 단정하지 않습니다.",
  },
  {
    title: "6. 타임라인·증거 보드",
    teacher: "각 기록의 ‘발생 시각’과 ‘확인 시각’이 다를 수 있음을 짚어 줍니다.",
    student: "증거를 시간순으로 배열하고 서로 지지하거나 충돌하는 기록을 연결합니다.",
    reaction: "사진 삭제를 촬영보다 앞에 놓거나 CCTV 점프 구간을 놓칠 수 있습니다.",
    hint: "초 단위가 표시된 원자료부터 기준점으로 삼게 하세요.",
    caution: "연결선은 ‘관련 있어 보임’이 아니라 연결 이유를 말할 수 있을 때만 만듭니다.",
  },
  {
    title: "7. 최종 수사 결론",
    teacher: "인물 이름보다 결정적 증거 3개의 연결 논리를 먼저 발표하게 합니다.",
    student: "의심 인물, 증거, 사건 순서, 판단 근거를 수사보고서로 제출합니다.",
    reaction: "한 가지 강한 단서만 선택하거나 느낌을 근거로 쓰는 경우가 있습니다.",
    hint: "사진·시간·통신 기록을 최소 하나씩 포함하도록 유도하세요.",
    caution: "수사 결론은 사실 확정이 아니라 확보된 자료에 근거한 판단임을 강조합니다.",
  },
  {
    title: "8. 직업 연결·윤리",
    teacher: "학생이 방금 한 행동을 보존·획득·분석·교차검증·감정 결과 작성의 실제 업무와 연결합니다.",
    student: "복구 가능성의 한계, 무결성, 개인정보 보호 원칙을 한 문장씩 정리합니다.",
    reaction: "포렌식을 삭제 파일 복구 하나로만 이해했던 생각이 바뀝니다.",
    hint: "‘자료를 찾는 능력’보다 ‘정확한 절차’가 왜 중요한지 물어보세요.",
    caution: "실제 타인의 기기나 계정을 허가 없이 조사하면 안 된다는 점을 분명히 합니다.",
  },
];

export const SLIDES = [
  ["디지털 포렌식이란?", "디지털 흔적으로 과거의 사실을 재구성하는 과학적 조사", "TRACE → VERIFY → EXPLAIN"],
  ["무엇을 조사할까", "스마트폰 · 컴퓨터 · 저장매체 · CCTV · 클라우드", "기기보다 중요한 것은 그 안의 기록"],
  ["데이터는 어떻게 저장될까", "파일 이름, 내용, 위치, 시간정보가 함께 기록된다", "0과 1만 보는 일이 아니다"],
  ["삭제하면 무조건 사라질까", "목록에서는 사라져도 일부 데이터가 남을 수 있다", "단, 항상 복구되는 것은 아니다"],
  ["삭제 데이터 복구", "덮어쓰이지 않은 영역을 찾아 파일 구조를 다시 확인한다", "복구율 ≠ 증거 가치"],
  ["스마트폰 포렌식", "사진·메시지·통화·위치·앱 기록을 절차에 따라 획득한다", "보안 우회가 아니라 증거 보존"],
  ["사진 메타데이터", "촬영 시각 · 기기 · 해상도 · 위치 등 사진 뒤의 정보", "사진 내용과 별도로 검증한다"],
  ["CCTV 분석", "프레임·시각·동선·작은 특징을 반복 비교한다", "스쳐 간 장면이 증거가 된다"],
  ["디지털 증거의 무결성", "처음 확보한 뒤 내용이 바뀌지 않았음을 설명할 수 있어야 한다", "원본 보존 · 사본 분석 · 기록 유지"],
  ["실제 수사 흐름", "식별 → 보존 → 획득 → 분석 → 해석 → 보고", "모든 단계에 기록이 남는다"],
  ["포렌식 수사관의 일", "삭제 흔적·파일·메타데이터·로그를 분석하고 결과를 설명한다", "찾는 사람 + 검증하는 사람"],
  ["관련 직업", "디지털 포렌식 분석가 · 침해사고 대응가 · 사이버수사관 · 보안 컨설턴트", "수사·과학·컴퓨터의 교차점"],
  ["필요한 역량", "관찰력 · 논리적 추론 · 컴퓨터 이해 · 기록 습관 · 협업", "빠른 추측보다 정확한 확인"],
  ["윤리와 개인정보", "허가받은 기기와 자료만 조사하고 필요한 범위만 확인한다", "볼 수 있다고 봐도 되는 것은 아니다"],
  ["오늘의 수사", "흔적을 찾고, 시간을 맞추고, 다른 증거로 검증해 사건을 재구성했다", "삭제 복구가 아니라 과거의 사실을 설명하는 일"],
] as const;
