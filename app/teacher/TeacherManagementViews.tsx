"use client";

import Image from "next/image";
import { ANSWER_TIMELINE, PREVIEW_STEPS, PRINTABLES, SUSPECT_PROFILES } from "./teacherData";

type HomeProps = {
  onOpenPreparation: () => void;
  onOpenPreview: () => void;
  onOpenControl: () => void;
  onOpenMaterials: () => void;
  onOpenCaseManagement: () => void;
};

export function TeacherHome({
  onOpenPreparation,
  onOpenPreview,
  onOpenControl,
  onOpenMaterials,
  onOpenCaseManagement,
}: HomeProps) {
  const areas = [
    {
      number: "01",
      eyebrow: "BEFORE CLASS",
      title: "수업 준비",
      description: "공폰과 microSD부터 사건 사진·파일·출력물·최종점검까지 순서대로 준비합니다.",
      items: ["공폰", "microSD", "사건 사진", "사건 파일", "출력물", "수업 전 점검"],
      action: "준비센터 열기",
      onClick: onOpenPreparation,
    },
    {
      number: "02",
      eyebrow: "STUDENT PREVIEW",
      title: "학생 화면 미리보기",
      description: "CASE 017의 모든 학생 화면을 원하는 단계부터 바로 확인합니다.",
      items: ["21개 단계", "진행조건 우회", "예시 결과", "전용 상단바"],
      action: "학생 화면 보기",
      onClick: onOpenPreview,
    },
    {
      number: "03",
      eyebrow: "LIVE CONTROL",
      title: "수업 진행",
      description: "모둠별 현재 단계와 확보 증거를 확인하고 필요한 힌트를 보냅니다.",
      items: ["모둠별 현황", "수업시간", "힌트 제공", "단계별 권장시간"],
      action: "수업 진행 열기",
      onClick: onOpenControl,
    },
    {
      number: "04",
      eyebrow: "CLASS MATERIALS",
      title: "수업자료",
      description: "수업지도안, 내장 PPT, 사건 정답, 타임라인과 출력물을 한곳에서 확인합니다.",
      items: ["수업지도안", "15장 PPT", "교사용 정답", "사건 타임라인"],
      action: "수업자료 보기",
      onClick: onOpenMaterials,
    },
    {
      number: "05",
      eyebrow: "CASE CONTROL",
      title: "사건 관리",
      description: "수업 기록과 준비 상태의 초기화 범위를 확인하고 다음 수업을 준비합니다.",
      items: ["CASE RESET", "준비 상태 초기화", "수업 기록 삭제", "실물 재세팅 안내"],
      action: "사건 관리",
      onClick: onOpenCaseManagement,
    },
  ];

  return (
    <section className="teacher-view teacher-home-view">
      <div className="teacher-home-intro">
        <div>
          <span>DIGITAL FORENSICS INSTRUCTOR DESK</span>
          <h2>수업 준비부터 학생 체험, 출력물, 수업 진행까지 한곳에서 관리합니다.</h2>
        </div>
        <a href="/?group=1" target="_blank" rel="noreferrer">학생 실제 화면 새 창 열기</a>
      </div>
      <div className="teacher-area-grid">
        {areas.map((area) => (
          <article key={area.title} className={`teacher-area-card area-${area.number}`}>
            <header><span>{area.number}</span><small>{area.eyebrow}</small></header>
            <h2>{area.title}</h2>
            <p>{area.description}</p>
            <div>{area.items.map((item) => <span key={item}>{item}</span>)}</div>
            <button type="button" onClick={area.onClick}>{area.action}<b aria-hidden="true">→</b></button>
          </article>
        ))}
      </div>
      <div className="teacher-home-boundary">
        <b>수업 운영 원칙</b>
        <p>공폰은 실제 사진·파일·microSD를 조사하는 수업용 증거물입니다. 메시지와 통화기록은 웹 포렌식 추출 결과로 제공하며 별도 가짜 사건앱은 사용하지 않습니다.</p>
      </div>
    </section>
  );
}

export function StudentPreviewDirectory() {
  return (
    <section className="teacher-view preview-directory-view">
      <div className="teacher-section-lead">
        <div>
          <span>TEACHER-ONLY STUDENT VIEW</span>
          <h2>원하는 학생 화면부터 바로 확인</h2>
          <p>교사용 미리보기에서는 이전 미션을 풀지 않아도 단계별 화면과 예시 결과를 점검할 수 있습니다.</p>
        </div>
        <a href="/teacher/preview?step=0">처음부터 보기</a>
      </div>
      <div className="preview-step-list">
        {PREVIEW_STEPS.map((step, index) => (
          <article key={`${step.label}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{step.label}</h3><p>{step.summary}</p></div>
            <small>{step.stage}</small>
            <a href={`/teacher/preview?step=${index}`}>바로 보기</a>
          </article>
        ))}
      </div>
      <div className="preview-mode-note">
        <b>교사용 전용</b>
        <p>정답으로 진행, 자동 등록, 미리보기용 증거 자동 확보, 예시 결과 기능과 상단바는 학생 실제 수사모드에는 표시되지 않습니다.</p>
      </div>
    </section>
  );
}

function printPdf(file: string) {
  const url = `/downloads/case017/printables/${file}`;
  const popup = window.open(url, "_blank");
  if (!popup) return;
  popup.opener = null;
  window.setTimeout(() => {
    popup.focus();
    popup.print();
  }, 1200);
}

export function MaterialsCenter({
  onOpenGuide,
  onOpenSlides,
  onOpenAnswers,
}: {
  onOpenGuide: () => void;
  onOpenSlides: () => void;
  onOpenAnswers: () => void;
}) {
  return (
    <section className="teacher-view materials-view">
      <div className="materials-shortcuts">
        <button type="button" onClick={onOpenGuide}><span>01</span><b>수업지도안</b><small>단계별 멘트·활동·힌트·주의사항</small></button>
        <button type="button" onClick={onOpenSlides}><span>02</span><b>디지털 포렌식 PPT</b><small>15장 내장 발표 화면과 전체화면</small></button>
        <button type="button" onClick={onOpenAnswers}><span>03</span><b>교사용 사건 정답</b><small>실제 순서·핵심 증거·오답·힌트 순서</small></button>
        <a href="/downloads/case017/printables/06_timeline_worksheet.pdf" target="_blank" rel="noreferrer"><span>04</span><b>사건 타임라인</b><small>활동지 미리보기와 출력</small></a>
      </div>

      <div className="print-center-head">
        <div><span>PRINT CENTER</span><h2>CASE 017 출력물 센터</h2><p>빈 링크가 아닌 실제 A4 PDF가 포함되어 있습니다.</p></div>
        <div>
          <button type="button" onClick={() => document.getElementById("case017-print-list")?.scrollIntoView({ behavior: "smooth" })}>전체 출력물 보기</button>
          <a href="/downloads/case017/CASE017_PRINTABLES.zip" download>전체 PDF 다운로드</a>
          <button type="button" onClick={() => printPdf("CASE017_PRINT_ALL.pdf")}>전체 A4 인쇄</button>
        </div>
      </div>
      <div className="print-center-list" id="case017-print-list">
        {PRINTABLES.map((item, index) => (
          <article key={item.file}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><h3>{item.label}</h3><p>{item.description}</p></div>
            <div className="print-item-actions">
              <a href={`/downloads/case017/printables/${item.file}`} target="_blank" rel="noreferrer">미리보기</a>
              <button type="button" onClick={() => printPdf(item.file)}>인쇄</button>
              <a href={`/downloads/case017/printables/${item.file}`} download>PDF 다운로드</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AnswerCenter() {
  return (
    <section className="teacher-view answer-center-view">
      <div className="answer-alert"><span>TEACHER ONLY</span><h2>학생에게 노출하지 않는 CASE 017 사건 정답</h2><p>정답을 먼저 말하기보다 학생이 증거 사이의 충돌을 발견하도록 힌트를 단계적으로 제공하십시오.</p></div>
      <div className="answer-summary-grid">
        <article><span>결론 인물</span><strong>용의자 C · 박도윤</strong><p>사진과 CCTV의 밝은 운동화·반사형 가방끈이 일치합니다.</p></article>
        <article><span>핵심 증거</span><strong>E-03 · E-05 · E-07</strong><p>복구 사진, 메타데이터, CCTV 프레임을 메시지·통화와 함께 해석합니다.</p></article>
        <article><span>배제 근거</span><strong>E-14 · 용의자 B</strong><p>18:39~18:49 체육관 위치와 공연 영상이 B의 알리바이를 지지합니다.</p></article>
      </div>
      <section className="answer-timeline">
        <header><span>ACTUAL SEQUENCE</span><h2>사건의 실제 진행순서</h2></header>
        {ANSWER_TIMELINE.map(([time, detail, source], index) => (
          <div key={time}><b>{String(index + 1).padStart(2, "0")}</b><time>{time}</time><p>{detail}</p><span>{source}</span></div>
        ))}
      </section>
      <div className="suspect-teacher-grid">
        {SUSPECT_PROFILES.map((suspect) => (
          <article key={suspect.id}>
            <Image src={suspect.image} alt={`가상 용의자 ${suspect.id} ${suspect.name}`} width={900} height={1100} sizes="(max-width: 620px) 42vw, 220px" />
            <div><span>용의자 {suspect.id}</span><h3>{suspect.name}</h3><b>{suspect.role}</b><dl><dt>진술</dt><dd>{suspect.statement}</dd><dt>복장</dt><dd>{suspect.clothing}</dd></dl><p><strong>교사용 실제 역할</strong>{suspect.actual}</p></div>
          </article>
        ))}
      </div>
      <div className="answer-guidance-grid">
        <article><span>예상 오답</span><h3>검은 후드만 보고 B를 선택</h3><p>옷 색은 흔하고 바뀔 수 있습니다. 위치 기록과 작은 특징 두 가지를 다시 비교하게 합니다.</p></article>
        <article><span>자주 헷갈리는 지점</span><h3>복구 사진을 곧바로 확정 증거로 판단</h3><p>촬영 시각·위치·CCTV·통신 기록과 일치해야 사건 맥락이 생긴다는 점을 묻습니다.</p></article>
        <article><span>힌트 1</span><h3>사실과 추측 분리</h3><p>“검은 옷을 봤다”와 “B라고 판단했다”를 다른 칸에 적게 합니다.</p></article>
        <article><span>힌트 2</span><h3>작은 특징 비교</h3><p>운동화와 가방끈처럼 여러 화면에 반복되는 특징을 찾게 합니다.</p></article>
        <article><span>힌트 3</span><h3>초 단위 시간 맞추기</h3><p>메타데이터·메시지·통화·CCTV의 초 단위를 타임라인에 놓게 합니다.</p></article>
        <article><span>마지막 힌트</span><h3>반대 증거 찾기</h3><p>현재 가설과 맞지 않는 위치 기록을 먼저 설명한 뒤 결론을 제출하게 합니다.</p></article>
      </div>
    </section>
  );
}

export function CaseManagement({ onReset }: { onReset: (scope: "case" | "prep" | "records") => void }) {
  return (
    <section className="teacher-view case-management-view">
      <div className="case-management-lead"><span>RESTRICTED OPERATIONS</span><h2>초기화 범위를 확인한 뒤 실행하십시오.</h2><p>아래 작업은 모두 교사용 접근코드 3035를 다시 확인한 후에만 실행됩니다.</p></div>
      <div className="case-management-grid">
        <article><span>01</span><h3>CASE RESET</h3><p>학생 진행상황, 증거 보드, 수사 타이머, 제출 결과와 모둠 상태를 초기화합니다.</p><button type="button" onClick={() => onReset("case")}>CASE RESET</button></article>
        <article><span>02</span><h3>수업 준비 상태 초기화</h3><p>준비센터의 단계 완료 및 체크리스트 기록만 초기화합니다.</p><button type="button" onClick={() => onReset("prep")}>준비 상태 초기화</button></article>
        <article><span>03</span><h3>수업 기록 삭제</h3><p>모둠 진행상태와 전송한 힌트 기록을 삭제하고 새 수업을 준비합니다.</p><button type="button" onClick={() => onReset("records")}>수업 기록 삭제</button></article>
      </div>
      <div className="physical-reset-reminder"><b>실물 증거물은 자동 초기화되지 않습니다.</b><p>공폰 사진·파일 재복사, PIN 1017 확인, microSD에 사건팩 복사, IMG_2048.jpg 삭제, 새 파일 저장 중지, 복구 테스트를 교사가 별도로 수행해야 합니다.</p></div>
    </section>
  );
}
