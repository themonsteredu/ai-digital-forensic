"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LESSON_STEPS,
  SLIDES,
  TIME_PRESETS,
} from "../data";
import CasePreparationCenter from "./CasePreparationCenter";

type TeacherView = "control" | "guide" | "slides" | "setup";
type GroupRecord = {
  group: number;
  stage: string;
  stageId?: string;
  evidenceCount: number;
  updatedAt?: string;
};

const FLOW_LABELS = [
  "사건 브리핑",
  "증거폰 확보·조사",
  "디지털 증거 등록",
  "삭제 데이터 복구",
  "메타데이터·CCTV",
  "타임라인·증거 보드",
  "최종 수사 결론",
  "직업 설명·윤리",
];

function readGroups(): GroupRecord[] {
  return [1, 2, 3, 4, 5].map((group) => {
    const raw = window.localStorage.getItem(`df-group-${group}`);
    if (raw) {
      try {
        return JSON.parse(raw) as GroupRecord;
      } catch {
        window.localStorage.removeItem(`df-group-${group}`);
      }
    }
    return { group, stage: "접속 대기", evidenceCount: 0 };
  });
}

function FullscreenSlides({
  slide,
  setSlide,
}: {
  slide: number;
  setSlide: (slide: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [title, copy, key] = SLIDES[slide];

  function toggleFullscreen() {
    if (!document.fullscreenElement) stageRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }

  return (
    <div className="teacher-slide-stage" ref={stageRef}>
      <div className="slide-topline">
        <span>DIGITAL FORENSICS LAB · CLASSROOM BRIEFING</span>
        <b>{(slide + 1).toString().padStart(2, "0")} / {SLIDES.length}</b>
      </div>
      <div className={`slide-visual slide-visual-${slide % 5}`}>
        <i />
        <i />
        <i />
        {slide === 7 && (
          <div className="slide-cctv-picture">
            <img src="/assets/cctv-hallway.png" alt="CCTV 분석 예시" />
            <span>FRAME 18:47:06</span>
          </div>
        )}
        {slide === 4 && (
          <div className="slide-recovery-bars">
            <span style={{ width: "94%" }} />
            <span style={{ width: "31%" }} />
            <span style={{ width: "8%" }} />
          </div>
        )}
      </div>
      <div className="slide-copy">
        <span>0{slide + 1}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
        <strong>{key}</strong>
      </div>
      <div className="slide-controls">
        <button type="button" onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0}>
          이전
        </button>
        <button type="button" onClick={toggleFullscreen}>전체화면</button>
        <button
          type="button"
          onClick={() => setSlide(Math.min(SLIDES.length - 1, slide + 1))}
          disabled={slide === SLIDES.length - 1}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default function TeacherConsole() {
  const [authenticated, setAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [view, setView] = useState<TeacherView>("control");
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [duration, setDuration] = useState<keyof typeof TIME_PRESETS>(60);
  const [guideOpen, setGuideOpen] = useState(0);
  const [slide, setSlide] = useState(0);
  const [hintGroup, setHintGroup] = useState(1);
  const [hintText, setHintText] = useState("");
  const [hintSent, setHintSent] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetChecked, setResetChecked] = useState(false);

  const times = useMemo(() => TIME_PRESETS[duration], [duration]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setAuthenticated(window.sessionStorage.getItem("df-teacher-auth") === "true"),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    const update = () => setGroups(readGroups());
    update();
    const timer = window.setInterval(update, 1800);
    window.addEventListener("storage", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", update);
    };
  }, [authenticated]);

  function unlock() {
    if (accessCode.trim().toUpperCase() !== "017-LAB") {
      setAccessError("교사용 접근 코드를 다시 확인하십시오.");
      return;
    }
    window.sessionStorage.setItem("df-teacher-auth", "true");
    setAuthenticated(true);
    setAccessError("");
  }

  function sendHint() {
    if (!hintText.trim()) return;
    window.localStorage.setItem(
      `df-hint-${hintGroup}`,
      JSON.stringify({ text: hintText.trim(), sentAt: new Date().toISOString() }),
    );
    setHintSent(`${hintGroup}모둠에 힌트를 보냈습니다.`);
    setHintText("");
    window.setTimeout(() => setHintSent(""), 2500);
  }

  function resetCase() {
    if (!resetChecked) return;
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("df-")) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
    setGroups(readGroups());
    setResetOpen(false);
    setResetChecked(false);
  }

  if (!authenticated) {
    return (
      <main className="teacher-login">
        <div className="teacher-login-grid" />
        <section>
          <span>INSTRUCTOR ACCESS · CASE 017</span>
          <h1>교사용 수사 통제실</h1>
          <p>학생 화면과 분리된 교사용 전용 접근 경로입니다.</p>
          <label htmlFor="teacher-code">교사용 접근 코드</label>
          <div>
            <input
              id="teacher-code"
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && unlock()}
              placeholder="CASE ACCESS CODE"
            />
            <button type="button" onClick={unlock}>접속</button>
          </div>
          {accessError && <p className="error-message">{accessError}</p>}
          <small>초기 접근 코드: 017-LAB · 수업 전 교사만 확인하십시오.</small>
        </section>
      </main>
    );
  }

  return (
    <main className="teacher-console">
      <aside className="teacher-rail">
        <div className="teacher-brand">
          <span>DF LAB</span>
          <b>교사용 통제실</b>
          <small>CASE 017</small>
        </div>
        <nav aria-label="교사용 메뉴">
          <button type="button" className={view === "control" ? "active" : ""} onClick={() => setView("control")}>
            <span>01</span>진행 관리
          </button>
          <button type="button" className={view === "guide" ? "active" : ""} onClick={() => setView("guide")}>
            <span>02</span>수업지도안
          </button>
          <button type="button" className={view === "slides" ? "active" : ""} onClick={() => setView("slides")}>
            <span>03</span>내장 PPT
          </button>
          <button type="button" className={view === "setup" ? "active" : ""} onClick={() => setView("setup")}>
            <span>04</span>수업 준비
          </button>
        </nav>
        <div className="rail-status">
          <span className="status-dot" />
          <p>교사용 모드</p>
          <b>학생 화면과 분리됨</b>
        </div>
      </aside>

      <div className="teacher-main">
        <header className="teacher-header">
          <div>
            <span>DIGITAL FORENSICS CLASS CONTROL</span>
            <h1>
              {view === "control" && "수업 진행 관리"}
              {view === "guide" && "교사용 수업지도안"}
              {view === "slides" && "디지털 포렌식 내장 PPT"}
              {view === "setup" && "CASE 017 수업 준비센터"}
            </h1>
          </div>
          <div className="teacher-header-actions">
            <label>
              수업시간
              <select value={duration} onChange={(event) => setDuration(Number(event.target.value) as keyof typeof TIME_PRESETS)}>
                {[40, 50, 60, 90].map((value) => <option key={value} value={value}>{value}분형</option>)}
              </select>
            </label>
            <button type="button" className="reset-trigger" onClick={() => setResetOpen(true)}>CASE RESET</button>
          </div>
        </header>

        {view === "control" && (
          <section className="teacher-view control-view">
            <div className="control-overview">
              <div>
                <span>ACTIVE GROUPS</span>
                <strong>{groups.filter((group) => group.stage !== "접속 대기").length} / 5</strong>
              </div>
              <div>
                <span>CLASS MODE</span>
                <strong>{duration} MIN</strong>
              </div>
              <div>
                <span>CASE STATUS</span>
                <strong>IN PROGRESS</strong>
              </div>
            </div>
            <div className="group-monitor">
              <div className="monitor-head">
                <span>모둠</span><span>현재 단계</span><span>확보 증거</span><span>최근 신호</span>
              </div>
              {groups.map((group) => (
                <div key={group.group} className="group-row">
                  <b>{group.group}모둠</b>
                  <div><i /><span>{group.stage}</span></div>
                  <strong>{group.evidenceCount}건</strong>
                  <time>
                    {group.updatedAt
                      ? new Date(group.updatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                      : "대기"}
                  </time>
                </div>
              ))}
            </div>
            <div className="teacher-lower-grid">
              <section className="hint-console">
                <span>GROUP HINT CHANNEL</span>
                <h2>막힌 모둠에 단계형 힌트 보내기</h2>
                <div>
                  <select value={hintGroup} onChange={(event) => setHintGroup(Number(event.target.value))}>
                    {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}모둠</option>)}
                  </select>
                  <textarea
                    value={hintText}
                    onChange={(event) => setHintText(event.target.value)}
                    placeholder="정답이 아닌 관찰 방향을 보내세요. 예: 옷 색 말고 반복되는 작은 특징을 찾아보세요."
                    rows={4}
                  />
                  <button type="button" onClick={sendHint}>선택 모둠에 전송</button>
                </div>
                {hintSent && <p>{hintSent}</p>}
              </section>
              <section className="flow-timing">
                <span>{duration}분형 자동 배분</span>
                <h2>단계별 권장 시간</h2>
                {FLOW_LABELS.map((label, index) => (
                  <div key={label}>
                    <b>{index + 1}</b>
                    <span>{label}</span>
                    <strong>{times[index]}분</strong>
                    <i style={{ width: `${Math.max(10, (times[index] / Math.max(...times)) * 100)}%` }} />
                  </div>
                ))}
              </section>
            </div>
          </section>
        )}

        {view === "guide" && (
          <section className="teacher-view guide-view">
            <div className="guide-summary">
              <div><span>대상</span><b>중학교 1~3학년</b></div>
              <div><span>권장 시간</span><b>60~70분</b></div>
              <div><span>운영 단위</span><b>모둠별 3~5명</b></div>
              <div><span>형태</span><b>온·오프라인 결합</b></div>
            </div>
            <div className="guide-intro-grid">
              <article>
                <span>수업 목표</span>
                <h2>디지털 흔적으로 과거의 사실을 재구성한다.</h2>
                <ul>
                  <li>다양한 디지털 증거의 종류와 특징을 설명한다.</li>
                  <li>삭제 흔적·메타데이터·CCTV·로그를 교차검증한다.</li>
                  <li>디지털 증거의 무결성과 개인정보 윤리를 실천한다.</li>
                  <li>근거를 갖춘 포렌식 감정 결과를 작성한다.</li>
                </ul>
              </article>
              <article>
                <span>준비물</span>
                <h2>모둠별 실물 증거 세트</h2>
                <ul>
                  <li>수업용 공폰 1대 · 충전 80% 이상</li>
                  <li>microSD 1개 · USB 카드 리더기 1개</li>
                  <li>분석용 노트북 또는 크롬북 1대</li>
                  <li>CASE 017 증거봉투 · 기록지 · 필기구</li>
                  <li>복구 결과를 저장할 노트북 내 별도 폴더</li>
                </ul>
              </article>
            </div>
            <div className="lesson-accordion">
              {LESSON_STEPS.map((step, index) => (
                <article key={step.title} className={guideOpen === index ? "open" : ""}>
                  <button type="button" onClick={() => setGuideOpen(index)}>
                    <span>{step.title}</span>
                    <b>{times[index]}분</b>
                  </button>
                  {guideOpen === index && (
                    <div>
                      <dl>
                        <section><dt>교사 진행 멘트·행동</dt><dd>{step.teacher}</dd></section>
                        <section><dt>학생 활동</dt><dd>{step.student}</dd></section>
                        <section><dt>예상 학생 반응</dt><dd>{step.reaction}</dd></section>
                        <section><dt>막혔을 때 힌트</dt><dd>{step.hint}</dd></section>
                        <section><dt>주의사항</dt><dd>{step.caution}</dd></section>
                      </dl>
                    </div>
                  )}
                </article>
              ))}
            </div>
            <div className="guide-final-grid">
              <article>
                <span>평가 기준</span>
                <h2>과정 중심 4개 지표</h2>
                <ol>
                  <li><b>증거 취급 25</b><p>원본 보존, 번호 기록, 개인정보 범위 준수</p></li>
                  <li><b>분석 정확성 30</b><p>시간·파일 상태·메타데이터를 정확히 판독</p></li>
                  <li><b>교차검증 30</b><p>3개 이상 독립 증거를 논리적으로 연결</p></li>
                  <li><b>보고·협업 15</b><p>사실과 추측을 구분해 모둠 결론을 설명</p></li>
                </ol>
              </article>
              <article>
                <span>마무리 질문</span>
                <h2>사건 이후 반드시 묻기</h2>
                <ul>
                  <li>처음 의심한 인물이 왜 바뀌었나요?</li>
                  <li>복구된 사진만으로 결론 낼 수 없는 이유는 무엇인가요?</li>
                  <li>증거를 원본 그대로 보존해야 하는 이유는 무엇인가요?</li>
                  <li>포렌식 수사관에게 컴퓨터 실력 외 어떤 태도가 필요할까요?</li>
                </ul>
              </article>
            </div>
          </section>
        )}

        {view === "slides" && (
          <section className="teacher-view slides-view">
            <div className="slides-sidebar">
              {SLIDES.map(([title], index) => (
                <button type="button" key={title} className={slide === index ? "active" : ""} onClick={() => setSlide(index)}>
                  <span>{(index + 1).toString().padStart(2, "0")}</span>{title}
                </button>
              ))}
            </div>
            <FullscreenSlides slide={slide} setSlide={setSlide} />
          </section>
        )}

        {view === "setup" && (
          <section className="teacher-view setup-view">
            <CasePreparationCenter
              onOpenGuide={() => setView("guide")}
              onOpenSlides={() => setView("slides")}
              onOpenReset={() => setResetOpen(true)}
            />
          </section>
        )}
      </div>

      {resetOpen && (
        <div className="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <section>
            <span>CASE RESET · CONFIRMATION</span>
            <h2 id="reset-title">웹앱의 CASE 017 진행 기록을 초기화합니다.</h2>
            <ul>
              <li>학생 진행상황</li>
              <li>증거 보드와 연결선</li>
              <li>수사 타이머</li>
              <li>최종 제출 결과와 모둠 상태</li>
            </ul>
            <div className="hardware-warning">
              <b>자동 초기화되지 않는 항목</b>
              <p>실제 공폰과 microSD 데이터는 교사가 수업 전 절차에 따라 별도로 재세팅해야 합니다.</p>
            </div>
            <label>
              <input type="checkbox" checked={resetChecked} onChange={(event) => setResetChecked(event.target.checked)} />
              실제 공폰과 microSD를 별도로 재세팅해야 함을 확인했습니다.
            </label>
            <div>
              <button type="button" onClick={() => setResetOpen(false)}>취소</button>
              <button type="button" className="danger" onClick={resetCase} disabled={!resetChecked}>CASE RESET 실행</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
