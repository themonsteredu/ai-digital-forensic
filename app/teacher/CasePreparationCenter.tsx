"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

type PrepStepId =
  | "purchase"
  | "setup"
  | "images"
  | "files"
  | "sd"
  | "recovery-test"
  | "printables"
  | "preflight";

const PREP_STEPS: Array<{ id: PrepStepId; label: string; short: string }> = [
  { id: "purchase", label: "공폰 준비", short: "구매·수량" },
  { id: "setup", label: "공폰 초기 세팅", short: "초기 세팅" },
  { id: "images", label: "사건 사진 준비", short: "사진팩" },
  { id: "files", label: "사건 파일 준비", short: "파일팩" },
  { id: "sd", label: "microSD 준비", short: "microSD" },
  { id: "recovery-test", label: "삭제 파일 복구 테스트", short: "복구 테스트" },
  { id: "printables", label: "출력물 준비", short: "출력물" },
  { id: "preflight", label: "수업 전 최종점검", short: "10분 점검" },
];

const PREP_CHECKS_STORAGE_KEY = "df-case017-prep-checks-v1";
const PREP_STEPS_STORAGE_KEY = "df-case017-prep-steps-v1";

const SETUP_ITEMS = [
  ["setup-factory", "STEP 1", "공장초기화된 Android 공폰 준비", "기존 사진, 연락처, 앱 데이터가 없는 수업 전용 기기를 사용합니다."],
  ["setup-account", "STEP 2", "개인 계정 제거 확인", "Google·Samsung 계정이 남아 있지 않은지 확인합니다."],
  ["setup-wifi", "STEP 3", "Wi-Fi 연결 확인", "파일을 내려받을 때만 연결하고 수업 직전에는 알림을 차단합니다."],
  ["setup-pin", "STEP 4", "잠금 PIN 설정", "PIN은 1017로 설정합니다."],
  ["setup-copy-images", "STEP 5", "사건 사진을 공폰에 복사", "사진팩을 DCIM/Camera 폴더에 복사하고 갤러리에서 확인합니다."],
  ["setup-copy-files", "STEP 6", "사건 파일을 공폰에 복사", "Documents와 Download 폴더 구조를 유지합니다."],
  ["setup-sd", "STEP 7", "microSD 삽입", "공폰 1대당 16GB 또는 32GB microSD 1개를 삽입합니다."],
  ["setup-portable", "STEP 8", "휴대용 저장소 확인", "내부 저장소로 통합하지 않고 ‘휴대용 저장소’로 사용합니다."],
] as const;

const PURCHASE_CHECKS = [
  ["purchase-wifi", "Wi-Fi 정상"],
  ["purchase-touch", "터치 정상"],
  ["purchase-screen", "화면 파손 없음"],
  ["purchase-charge", "충전 정상"],
  ["purchase-battery", "배터리 급방전 없음"],
  ["purchase-sd", "microSD 정상 인식"],
  ["purchase-reset", "공장초기화 가능"],
  ["purchase-account", "이전 사용자 계정 잠금 없음"],
  ["purchase-no-sim", "유심 없이 Wi-Fi 사용 가능"],
] as const;

const RECOVERY_TEST_ITEMS = [
  ["recovery-sd", "microSD 인식"],
  ["recovery-reader", "카드리더기 인식"],
  ["recovery-laptop", "노트북 정상 인식"],
  ["recovery-tool", "복구 프로그램 실행"],
  ["recovery-search", "IMG_2048 검색"],
  ["recovery-success", "IMG_2048 복구 성공"],
  ["recovery-open", "복구 파일 정상 열림"],
] as const;

const PHONE_IMAGES = [
  [2039, "학교 축제 준비 모습", "갤러리", "일반 자료"],
  [2040, "운동장 체험 부스", "갤러리", "일반 자료"],
  [2041, "행사실 복도", "갤러리", "보조 단서"],
  [2042, "축제 안내 표지", "갤러리", "일반 자료"],
  [2043, "공연 준비 장면", "갤러리", "알리바이 참고"],
  [2044, "학교 축제 장비", "갤러리", "일반 자료"],
  [2045, "축제 현장 인물 일부", "갤러리", "중요 단서"],
] as const;

const PREFLIGHT_ITEMS = [
  ["ready-phone-1", "공폰 1 전원"],
  ["ready-phone-2", "공폰 2 전원"],
  ["ready-phone-3", "공폰 3 전원"],
  ["ready-phone-4", "공폰 4 전원"],
  ["ready-phone-5", "공폰 5 전원"],
  ["ready-pin", "PIN 1017 설정"],
  ["ready-images", "사건 사진 복사"],
  ["ready-files", "사건 파일 복사"],
  ["ready-sd", "microSD 삽입"],
  ["ready-delete", "IMG_2048 삭제"],
  ["ready-recovery", "복구 테스트"],
  ["ready-reader", "USB 카드리더기"],
  ["ready-laptop", "노트북"],
  ["ready-print", "출력물"],
  ["ready-cctv", "CCTV 재생"],
  ["ready-student", "학생 화면"],
  ["ready-teacher", "교사 화면"],
] as const;

const PRINTABLES = [
  ["증거봉투 라벨", "01_evidence_envelope_label.pdf"],
  ["CASE 017 사건 브리핑 카드", "02_case_briefing_card.pdf"],
  ["증거번호 라벨 E-01~E-14", "03_evidence_number_labels.pdf"],
  ["용의자 카드", "04_suspect_cards.pdf"],
  ["증거카드", "05_evidence_cards.pdf"],
  ["타임라인 활동지", "06_timeline_worksheet.pdf"],
  ["수사 메모지", "07_investigation_notes.pdf"],
  ["최종 수사보고서", "08_final_investigation_report.pdf"],
  ["교사용 정답표", "09_teacher_answer_key.pdf"],
  ["교사용 수업지도안", "10_teacher_lesson_guide.pdf"],
] as const;

function Checklist({
  items,
  checks,
  onToggle,
  className = "",
}: {
  items: ReadonlyArray<readonly [string, string]>;
  checks: Record<string, boolean>;
  onToggle: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`prep-checklist ${className}`}>
      {items.map(([id, label]) => (
        <label key={id} className={checks[id] ? "checked" : ""}>
          <input type="checkbox" checked={Boolean(checks[id])} onChange={() => onToggle(id)} />
          <span aria-hidden="true">{checks[id] ? "완료" : "대기"}</span>
          <b>{label}</b>
        </label>
      ))}
    </div>
  );
}

function DownloadButton({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return (
    <a className={`prep-download ${secondary ? "secondary" : ""}`} href={href} download>
      <span>{children}</span>
      <b>DOWNLOAD</b>
    </a>
  );
}

export default function CasePreparationCenter() {
  const [active, setActive] = useState<PrepStepId>("purchase");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<PrepStepId[]>([]);
  const [studentCount, setStudentCount] = useState(25);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setChecks(JSON.parse(window.localStorage.getItem(PREP_CHECKS_STORAGE_KEY) ?? "{}"));
        setCompletedSteps(JSON.parse(window.localStorage.getItem(PREP_STEPS_STORAGE_KEY) ?? "[]"));
      } catch {
        window.localStorage.removeItem(PREP_CHECKS_STORAGE_KEY);
        window.localStorage.removeItem(PREP_STEPS_STORAGE_KEY);
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PREP_CHECKS_STORAGE_KEY, JSON.stringify(checks));
    window.localStorage.setItem(PREP_STEPS_STORAGE_KEY, JSON.stringify(completedSteps));
  }, [checks, completedSteps, hydrated]);

  const activeIndex = PREP_STEPS.findIndex((step) => step.id === active);
  const overallProgress = Math.round((completedSteps.length / PREP_STEPS.length) * 100);
  const readinessCount = PREFLIGHT_ITEMS.filter(([id]) => checks[id]).length;
  const readiness = Math.round((readinessCount / PREFLIGHT_ITEMS.length) * 100);
  const setupCount = SETUP_ITEMS.filter(([id]) => checks[id]).length;
  const recoveryCount = RECOVERY_TEST_ITEMS.filter(([id]) => checks[id]).length;
  const activeStep = PREP_STEPS[activeIndex];
  const recommendedGroups = Math.max(1, Math.ceil(studentCount / 5));
  const sparePhones = Math.max(1, Math.ceil(recommendedGroups / 5));

  function toggleCheck(id: string) {
    setChecks((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleStepComplete() {
    setCompletedSteps((current) =>
      current.includes(active) ? current.filter((id) => id !== active) : [...current, active],
    );
  }

  function move(direction: -1 | 1) {
    const next = Math.max(0, Math.min(PREP_STEPS.length - 1, activeIndex + direction));
    setActive(PREP_STEPS[next].id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="prep-center">
      <div className="prep-principle">
        <div>
          <span>PHYSICAL EVIDENCE FIRST</span>
          <h2>공폰은 웹앱을 대신하는 장치가 아니라 현실의 디지털 증거물입니다.</h2>
          <p>학생은 실제 갤러리와 파일 구조를 조사하고, microSD를 분리해 삭제 파일을 복구합니다.</p>
        </div>
        <div className="prep-role-strip">
          <article><b>실제 공폰</b><p>현장 증거물 · 갤러리 · 파일 앱</p></article>
          <article><b>microSD</b><p>삭제 데이터를 포함한 실제 저장매체</p></article>
          <article><b>웹 포렌식 시스템</b><p>추출 메시지 · 통화 · CCTV · 메타데이터</p></article>
        </div>
        <div className="no-app-pack">
          <b>별도 사건앱팩 없음</b>
          <p>가짜 문자·전화·메모·홈 화면, CASE DEVICE, APK, Android 사건팩, companion app을 설치하지 않습니다.</p>
        </div>
      </div>

      <div className="prep-progress">
        <div><span>CASE 017 준비 흐름</span><b>{completedSteps.length} / {PREP_STEPS.length} 단계</b></div>
        <div className="prep-progress-track"><i style={{ width: `${overallProgress}%` }} /></div>
        <strong>{overallProgress}%</strong>
      </div>

      <div className="prep-workspace">
        <nav className="prep-step-nav" aria-label="CASE 017 수업 준비 단계">
          {PREP_STEPS.map((step, index) => (
            <button
              type="button"
              key={step.id}
              className={`${active === step.id ? "active" : ""} ${completedSteps.includes(step.id) ? "complete" : ""}`}
              onClick={() => setActive(step.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{step.label}</b>
              <i>{completedSteps.includes(step.id) ? "완료" : ""}</i>
            </button>
          ))}
        </nav>

        <div className="prep-panel">
          <header className="prep-panel-head">
            <div><span>STEP {String(activeIndex + 1).padStart(2, "0")}</span><h2>{activeStep.label}</h2></div>
            <b>{activeStep.short}</b>
          </header>

          {active === "purchase" && (
            <div className="prep-section-content">
              <div className="prep-callout blue">
                <b>구매 기준</b>
                <p>Android 9 이상 권장 · microSD 슬롯 · Wi-Fi·터치·충전 정상 · 배터리 1시간 이상 · 저장공간 16GB 이상 · 유심과 Google 계정 불필요 · 동일 기종 여러 대 권장</p>
              </div>
              <div className="device-guide-table" role="table" aria-label="공폰 추천 기종">
                <div className="table-head" role="row"><span>순위</span><span>추천 기종</span><span>microSD</span><span>구매 안내</span></div>
                {[
                  ["1순위", "Samsung Galaxy A30", "지원", "중고 시세 확인"],
                  ["2순위", "Samsung Galaxy A21s", "지원", "중고 시세 확인"],
                  ["3순위", "Samsung Galaxy A12", "지원", "중고 시세 확인"],
                  ["대체", "Galaxy A20 / A10", "구매 전 확인", "중고 시세 확인"],
                ].map((row) => <div role="row" key={row[1]}>{row.map((cell) => <span role="cell" key={cell}>{cell}</span>)}</div>)}
              </div>
              <p className="prep-footnote">가격은 상태·배터리·구성품에 따라 변동됩니다. 중고 시세를 확인하여 구매하고, microSD 트레이 포함 여부와 실제 인식 테스트를 우선하십시오.</p>
              <section className="phone-quantity-calculator">
                <div><span>학생 수</span><label><input type="number" min="4" max="80" value={studentCount} onChange={(event) => setStudentCount(Math.max(4, Math.min(80, Number(event.target.value) || 4)))} /> 명</label></div>
                <dl><div><dt>권장 모둠</dt><dd>{recommendedGroups}개</dd></div><div><dt>권장 공폰</dt><dd>{recommendedGroups}대</dd></div><div><dt>예비 공폰</dt><dd>{sparePhones}대</dd></div><div><dt>총 권장</dt><dd>{recommendedGroups + sparePhones}대</dd></div></dl>
                <p>학생 4~5명당 공폰 1대를 기준으로 계산합니다.</p>
              </section>
              <div className="prep-subsection-head"><span>PURCHASE CHECK</span><h3>공폰 구매 체크리스트</h3></div>
              <Checklist items={PURCHASE_CHECKS} checks={checks} onToggle={toggleCheck} className="two-column" />
              <div className="purchase-test-grid">
                {[
                  ["microSD", "카드 삽입 후 내 파일에서 외장 저장공간이 보이는지 확인"],
                  ["배터리", "화면 켠 상태로 1시간 이상 수업 가능한지 확인"],
                  ["터치", "화면 가장자리와 PIN 키패드가 빠짐없이 눌리는지 확인"],
                  ["초기화", "이전 사용자 계정 잠금 없이 공장 초기화 가능한지 확인"],
                ].map(([title, copy]) => <article key={title}><b>{title}</b><p>{copy}</p></article>)}
              </div>
            </div>
          )}

          {active === "setup" && (
            <div className="prep-section-content">
              <div className="setup-progress-summary"><span>초기 세팅 완료</span><b>{setupCount} / {SETUP_ITEMS.length}</b><i style={{ width: `${(setupCount / SETUP_ITEMS.length) * 100}%` }} /></div>
              <div className="setup-step-list">
                {SETUP_ITEMS.map(([id, step, title, detail]) => (
                  <article key={id} className={checks[id] ? "complete" : ""}>
                    <div><span>{step}</span><h3>{title}</h3><p>{detail}</p>
                      {id === "setup-copy-images" && <div className="setup-step-actions"><button type="button" onClick={() => setActive("images")}>사건 사진 보기</button><a href="/downloads/case017/CASE017_PHONE_IMAGES.zip" download>다운로드</a></div>}
                      {id === "setup-copy-files" && <div className="setup-step-actions"><button type="button" onClick={() => setActive("files")}>사건 파일 보기</button><a href="/downloads/case017/CASE017_PHONE_FILES.zip" download>다운로드</a></div>}
                    </div>
                    <label><input type="checkbox" checked={Boolean(checks[id])} onChange={() => toggleCheck(id)} /><b>{checks[id] ? "완료" : "완료 체크"}</b></label>
                  </article>
                ))}
              </div>
              <div className="pin-display-card"><span>CASE 017 공통 PIN</span><strong>1017</strong><p>교사용 사건 퍼즐의 정답이며 실제 보안 우회를 다루지 않습니다.</p></div>
            </div>
          )}

          {active === "images" && (
            <div className="prep-section-content">
              <DownloadButton href="/downloads/case017/CASE017_PHONE_IMAGES.zip">CASE017_PHONE_IMAGES.zip</DownloadButton>
              <div className="asset-summary"><b>포함 파일 7장</b><p>IMG_2039.jpg부터 IMG_2045.jpg까지 공폰 기본 갤러리의 DCIM/Camera 폴더에 복사합니다. 대부분은 평범한 축제 사진이며 단서는 일부 사진에만 있습니다.</p></div>
              <div className="phone-image-grid detailed">
                {PHONE_IMAGES.map(([number, description, location, importance]) => (
                  <figure key={number}>
                    <Image src={`/case017/phone-images/IMG_${number}.jpg`} alt={`CASE 017 공폰 사진 IMG_${number}`} width={1448} height={1086} sizes="(max-width: 620px) 92vw, 270px" />
                    <figcaption><b>IMG_{number}.jpg</b><p>{description}</p><dl><div><dt>학생에게 보이는 위치</dt><dd>{location}</dd></div><div><dt>사건 중요도</dt><dd>{importance}</dd></div></dl><a href={`/case017/phone-images/IMG_${number}.jpg`} download>개별 다운로드</a></figcaption>
                  </figure>
                ))}
              </div>
              <div className="prep-callout"><b>개인정보 보호</b><p>모든 사진은 가상의 축제 장면으로 제작되었으며 실존 학생·학교·인물 정보, 워터마크, 불필요한 글자를 사용하지 않았습니다.</p></div>
            </div>
          )}

          {active === "files" && (
            <div className="prep-section-content">
              <DownloadButton href="/downloads/case017/CASE017_PHONE_FILES.zip">CASE017_PHONE_FILES.zip</DownloadButton>
              <div className="folder-map">
                <div><span>/Documents</span><b>festival_schedule.pdf</b><p>평범한 축제 운영 일정표</p></div>
                <div><span>/Download</span><b>event_map.jpg</b><p>축제 행사 구역 안내 이미지</p></div>
                <div><span>/DCIM/Camera</span><b>IMG_2039.jpg~IMG_2045.jpg</b><p>사건 사진팩을 별도로 복사</p></div>
              </div>
              <ol className="numbered-instructions">
                <li><b>01</b><p>압축을 해제합니다.</p></li>
                <li><b>02</b><p>Documents와 Download 폴더 구조를 그대로 공폰 내부 저장소에 복사합니다.</p></li>
                <li><b>03</b><p>공폰의 기본 내 파일 또는 My Files에서 두 파일이 열리는지 확인합니다.</p></li>
                <li><b>04</b><p>사건과 무관한 파일도 함께 보이게 하여 학생이 중요도를 판단하게 합니다.</p></li>
              </ol>
            </div>
          )}

          {active === "sd" && (
            <div className="prep-section-content">
              <DownloadButton href="/downloads/case017/CASE017_SD_PACK.zip">CASE017_SD_PACK.zip</DownloadButton>
              <div className="sd-explainer">
                <Image src="/case017/equipment/micro-sd-reader.jpg" alt="microSD와 USB 카드리더기 수업 준비 예시" width={1400} height={900} sizes="(max-width: 620px) 92vw, 480px" />
                <div><span>microSD란?</span><h3>스마트폰에 넣어 사용하는 작은 저장장치입니다.</h3><p>CASE 017에서는 학생이 실제 삭제 파일 복구를 경험하기 위한 증거 저장매체로 사용합니다. USB 카드리더기로 노트북에 연결합니다.</p></div>
              </div>
              <div className="sd-spec"><div><span>권장 용량</span><b>16GB 또는 32GB</b></div><div><span>수량</span><b>공폰 1대당 1개</b></div><div><span>설정</span><b>휴대용 저장소</b></div></div>
              <div className="sd-file-grid">
                {[2039, 2040, 2041, 2042, 2048].map((number) => <span key={number} className={number === 2048 ? "critical" : ""}>IMG_{number}.jpg{number === 2048 && <b>삭제 대상</b>}</span>)}
              </div>
              <ol className="numbered-instructions">
                <li><b>01</b><p>압축을 해제하고 5개 파일을 microSD에 복사합니다.</p></li>
                <li><b>02</b><p>IMG_2048.jpg만 삭제하고 휴지통 기능이 있으면 비웁니다.</p></li>
                <li><b>03</b><p>삭제 이후 microSD에 새 파일을 저장하지 않습니다.</p></li>
                <li><b>04</b><p>수업 전 동일한 카드리더기와 복구 도구로 1회 테스트합니다.</p></li>
              </ol>
              <div className="prep-callout warning"><b>덮어쓰기 주의</b><p>삭제된 데이터 영역에 새 파일이 기록되면 IMG_2048.jpg가 복구되지 않을 수 있습니다.</p></div>
            </div>
          )}

          {active === "recovery-test" && (
            <div className="prep-section-content">
              <div className="setup-progress-summary"><span>복구 테스트</span><b>{recoveryCount} / {RECOVERY_TEST_ITEMS.length}</b><i style={{ width: `${(recoveryCount / RECOVERY_TEST_ITEMS.length) * 100}%` }} /></div>
              <Checklist items={RECOVERY_TEST_ITEMS} checks={checks} onToggle={toggleCheck} className="two-column" />
              <div className="recovery-save-rule"><span>SAVE DESTINATION</span><h3>CASE017_RECOVERED</h3><p>복구 결과는 microSD에 다시 저장하지 말고 노트북의 별도 폴더에 저장합니다.</p></div>
              <div className="prep-callout warning"><b>한 번 성공했다고 끝이 아닙니다.</b><p>실제 수업에 사용할 microSD, 카드리더기, 노트북, 복구 프로그램 조합 그대로 시험하십시오.</p></div>
            </div>
          )}

          {active === "printables" && (
            <div className="prep-section-content">
              <div className="print-actions">
                <DownloadButton href="/downloads/case017/CASE017_PRINTABLES.zip">전체 출력물 다운로드</DownloadButton>
                <a className="prep-download secondary" href="/downloads/case017/printables/CASE017_PRINT_ALL.pdf" target="_blank" rel="noreferrer"><span>전체 A4 인쇄</span><b>OPEN PDF</b></a>
              </div>
              <div className="printable-list">
                {PRINTABLES.map(([label, file], index) => (
                  <a key={file} href={`/downloads/case017/printables/${file}`} target="_blank" rel="noreferrer">
                    <span>{String(index + 1).padStart(2, "0")}</span><b>{label}</b><i>개별 자료 보기</i>
                  </a>
                ))}
              </div>
              <div className="envelope-preview"><span>DIGITAL FORENSICS LAB</span><h3>EVIDENCE E-01</h3><dl><div><dt>증거 종류</dt><dd>MOBILE DEVICE</dd></div><div><dt>압수 위치</dt><dd>행사실 인근</dd></div><div><dt>취급 주의</dt><dd>임의 조작 금지</dd></div></dl></div>
            </div>
          )}

          {active === "preflight" && (
            <div className="prep-section-content">
              <div className={`readiness-gauge ${readiness === 100 ? "ready" : ""}`}>
                <div><span>CASE 017 출강 준비도</span><strong>{readiness}%</strong></div>
                <i><b style={{ width: `${readiness}%` }} /></i>
                <p>{readiness === 100 ? "CASE 017 수업 준비 완료" : `${PREFLIGHT_ITEMS.length - readinessCount}개 필수 항목이 남았습니다.`}</p>
              </div>
              <Checklist items={PREFLIGHT_ITEMS} checks={checks} onToggle={toggleCheck} className="preflight-grid" />
              <button type="button" className="clear-checks" onClick={() => setChecks((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith("ready-"))))}>10분 점검만 초기화</button>
            </div>
          )}

          <footer className="prep-panel-footer">
            <button type="button" onClick={() => move(-1)} disabled={activeIndex === 0}>이전 단계</button>
            <label className={completedSteps.includes(active) ? "complete" : ""}><input type="checkbox" checked={completedSteps.includes(active)} onChange={toggleStepComplete} /><span>{completedSteps.includes(active) ? "이 단계 완료" : "단계 완료 체크"}</span></label>
            <button type="button" onClick={() => move(1)} disabled={activeIndex === PREP_STEPS.length - 1}>다음 단계</button>
          </footer>
        </div>
      </div>
    </section>
  );
}
