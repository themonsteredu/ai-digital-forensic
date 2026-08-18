"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import {
  CORRECT_TIMELINE,
  EVIDENCE,
  GROUP_STAGES,
  STAGES,
  SUSPECTS,
  type EvidenceId,
  type StageId,
  type TimelineItem,
} from "./data";
import { PREVIEW_STEPS } from "./teacher/teacherData";

const STAGE_STATUS: Partial<Record<StageId, string>> = {
  "phone-search": GROUP_STAGES[0],
  dashboard: GROUP_STAGES[1],
  recovery: GROUP_STAGES[1],
  metadata: GROUP_STAGES[2],
  "cctv-analysis": GROUP_STAGES[3],
  timeline: GROUP_STAGES[4],
  "evidence-board": GROUP_STAGES[4],
  report: GROUP_STAGES[5],
  reconstruction: "사건 재구성 확인",
  career: "수사 완료",
};

function classNames(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

function formatTimer(value: number) {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function addClockSeconds(clock: string, seconds: number) {
  const [h, m, s] = clock.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m, s + seconds);
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
}

function cctvClock(time: number) {
  if (time < 7.2) return addClockSeconds("18:32:14", Math.floor(time * 2.42));
  return addClockSeconds("18:47:03", Math.floor((time - 7.2) * 1.5));
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeInOut(value: number) {
  const progress = clamp01(value);
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function segmentProgress(time: number, start: number, end: number) {
  return easeInOut((time - start) / (end - start));
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function actorStyle({
  x,
  bottom,
  scale,
  opacity = 1,
  bob = 0,
  rotate = 0,
}: {
  x: number;
  bottom: number;
  scale: number;
  opacity?: number;
  bob?: number;
  rotate?: number;
}): CSSProperties {
  return {
    left: `${x}%`,
    bottom: `${bottom}%`,
    opacity,
    transform: `translateX(-50%) translateY(${bob}px) scale(${scale}) rotate(${rotate}deg)`,
  };
}

function personAPose(time: number): CSSProperties | null {
  if (time >= 6.85) return null;

  if (time < 0.7) {
    const progress = segmentProgress(time, 0, 0.7);
    return actorStyle({
      x: interpolate(27, 33, progress),
      bottom: interpolate(42, 38, progress),
      scale: interpolate(0.5, 0.6, progress),
      opacity: progress,
      bob: Math.sin(time * 13) * 1.2,
    });
  }

  if (time < 3.05) {
    const progress = segmentProgress(time, 0.7, 3.05);
    return actorStyle({
      x: interpolate(33, 63.5, progress),
      bottom: interpolate(38, 10, progress),
      scale: interpolate(0.6, 1.02, progress),
      bob: Math.sin(time * 13) * 1.5,
      rotate: interpolate(-0.6, 0, progress),
    });
  }

  if (time < 3.6) {
    const progress = segmentProgress(time, 3.05, 3.6);
    return actorStyle({
      x: interpolate(63.5, 67, progress),
      bottom: interpolate(10, 7.8, progress),
      scale: interpolate(1.02, 1.08, progress),
      bob: Math.sin(time * 10) * 0.8,
    });
  }

  if (time < 4.2) {
    return actorStyle({ x: 67, bottom: 7.8, scale: 1.08 });
  }

  const progress = segmentProgress(time, 4.2, 6.85);
  return actorStyle({
    x: interpolate(67, 80.5, progress),
    bottom: interpolate(7.8, 11.5, progress),
    scale: interpolate(1.08, 0.83, progress),
    opacity: interpolate(1, 0.12, clamp01((progress - 0.56) / 0.44)),
    bob: Math.sin(time * 11) * 0.7,
    rotate: interpolate(0, 1.3, progress),
  });
}

function personCPose(time: number): CSSProperties | null {
  if (time < 7.2 || time > 11.4) return null;

  if (time < 8.3) {
    const progress = segmentProgress(time, 7.2, 8.3);
    return actorStyle({
      x: interpolate(82.5, 75, progress),
      bottom: interpolate(12.5, 8.5, progress),
      scale: interpolate(0.8, 1.08, progress),
      opacity: interpolate(0.25, 1, progress),
      bob: Math.sin(time * 11) * 0.8,
      rotate: interpolate(1.2, 0, progress),
    });
  }

  if (time < 10.8) {
    const progress = segmentProgress(time, 8.3, 10.8);
    return actorStyle({
      x: interpolate(75, 45, progress),
      bottom: interpolate(8.5, 18, progress),
      scale: interpolate(1.08, 0.77, progress),
      bob: Math.sin(time * 13) * 1.35,
      rotate: interpolate(0, -0.7, progress),
    });
  }

  const progress = segmentProgress(time, 10.8, 11.4);
  return actorStyle({
    x: interpolate(45, 27, progress),
    bottom: interpolate(18, 30, progress),
    scale: interpolate(0.77, 0.58, progress),
    opacity: interpolate(1, 0.55, progress),
    bob: Math.sin(time * 13) * 1.1,
    rotate: -0.7,
  });
}

function CctvPlayer({
  analysis = false,
  onRegister,
}: {
  analysis?: boolean;
  onRegister?: () => void;
}) {
  const [time, setTime] = useState(analysis ? 8.3 : 0);
  const [playing, setPlaying] = useState(!analysis);
  const [zoomed, setZoomed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const maxTime = 11.7;
  const signalLost = time >= 11.25;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setTime((current) => {
        if (current >= maxTime) {
          setPlaying(false);
          return maxTime;
        }
        return Math.min(maxTime, current + 0.08);
      });
    }, 80);
    return () => window.clearInterval(timer);
  }, [playing]);

  const personA = useMemo(() => personAPose(time), [time]);
  const personC = useMemo(() => personCPose(time), [time]);
  const doorwayActive = (time >= 3.85 && time < 7.2) || (time >= 7.2 && time <= 8.65);

  function registerFrame() {
    const validFrame = time >= 8.6 && time <= 10.7 && zoomed;
    if (!validFrame) {
      setFeedback(
        !zoomed
          ? "인물의 작은 특징을 확인하려면 먼저 화면을 확대하십시오."
          : "18:47:05~18:47:08 사이에서 특징이 가장 선명한 프레임을 찾으십시오.",
      );
      return;
    }
    setFeedback("E-07 중요 프레임이 증거 보관함에 등록되었습니다.");
    onRegister?.();
  }

  return (
    <div className={classNames("cctv-shell", analysis && "cctv-analysis-shell")}>
      <div className="cctv-toolbar">
        <div className="rec-indicator">
          <span /> REC · CAM 03 · EAST CORRIDOR
        </div>
        <time>{cctvClock(time)}</time>
      </div>
      <div className={classNames("cctv-viewport", zoomed && "is-zoomed")}>
        <div className="cctv-scene">
          <img
            className="cctv-hallway"
            src="/assets/cctv-hallway.png"
            alt="행사실 앞 학교 복도 CCTV"
          />
          <div
            className={classNames("cctv-doorway-depth", doorwayActive && "active")}
            aria-hidden="true"
          />
          {personA && (
            <img
              className="cctv-person person-a"
              style={personA}
              src="/assets/cctv-person-a.png"
              alt="복도를 지나가는 인물 A"
            />
          )}
          {personC && (
            <img
              className="cctv-person person-c"
              style={personC}
              src="/assets/cctv-person-c.png"
              alt="검은 후드티를 입고 복도를 지나가는 인물"
            />
          )}
          <div className="cctv-door-occlusion" aria-hidden="true" />
          <div className="cctv-scanlines" />
          <div className="cctv-vignette" />
          <div className={classNames("signal-noise", signalLost && "active")} />
          {signalLost && (
            <div className="signal-lost">
              <strong>SIGNAL LOST</strong>
              <span>CAM 03 / CONNECTION INTERRUPTED</span>
            </div>
          )}
        </div>
      </div>
      {analysis && (
        <div className="cctv-controls">
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "일시정지" : "재생"}
          >
            {playing ? "일시정지" : "재생"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setTime((value) => Math.max(0, value - 0.12));
            }}
          >
            이전 프레임
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setTime((value) => Math.min(maxTime, value + 0.12));
            }}
          >
            다음 프레임
          </button>
          <button
            type="button"
            className={zoomed ? "active" : ""}
            onClick={() => setZoomed((value) => !value)}
          >
            {zoomed ? "원본 배율" : "2배 확대"}
          </button>
          <input
            type="range"
            min="0"
            max={maxTime}
            step="0.05"
            value={time}
            onChange={(event) => {
              setPlaying(false);
              setTime(Number(event.target.value));
            }}
            aria-label="CCTV 재생 위치"
          />
          <button type="button" className="evidence-action" onClick={registerFrame}>
            중요 장면 등록
          </button>
        </div>
      )}
      {feedback && <p className="analysis-feedback">{feedback}</p>}
    </div>
  );
}

function SystemHud({
  stage,
  evidenceCount,
  groupId,
}: {
  stage: StageId;
  evidenceCount: number;
  groupId: string;
}) {
  const currentIndex = STAGES.findIndex((item) => item.id === stage);
  const current = STAGES[currentIndex];
  const progress = Math.max(2, Math.round((currentIndex / (STAGES.length - 1)) * 100));
  return (
    <header className="system-hud">
      <div className="hud-case">
        <span className="status-dot" />
        <div>
          <b>CASE 017</b>
          <small>사라진 목격 사진</small>
        </div>
      </div>
      <div className="hud-progress" aria-label={`수사 진행률 ${progress}%`}>
        <div className="hud-progress-label">
          <span>{current.mission}</span>
          <b>{current.label}</b>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="hud-meta">
        <span>{groupId}</span>
        <span>SECURED {evidenceCount.toString().padStart(2, "0")}</span>
      </div>
    </header>
  );
}

function StudentStageNavigation({
  stage,
  onPrevious,
  onFirst,
}: {
  stage: StageId;
  onPrevious: () => void;
  onFirst: () => void;
}) {
  const currentIndex = STAGES.findIndex((item) => item.id === stage);
  const previous = STAGES[currentIndex - 1];

  return (
    <nav className="student-stage-navigation" aria-label="수사 단계 이동">
      <button type="button" onClick={onPrevious} disabled={!previous}>
        <span aria-hidden="true">←</span>
        <b>이전 단계</b>
        <small>{previous?.label ?? "이전 단계 없음"}</small>
      </button>
      <p>확보한 증거와 작성 내용은 그대로 유지됩니다.</p>
      <button type="button" onClick={onFirst}>
        <b>첫 화면</b>
        <small>CASE 017 시작 화면</small>
        <span aria-hidden="true">⌂</span>
      </button>
    </nav>
  );
}

function MissionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mission-heading">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}

function EvidenceRoleGuide() {
  return (
    <div className="evidence-role-guide" aria-label="공폰, 웹앱, microSD 역할 구분">
      <article className="physical-device-role">
        <span>01 · 실제 공폰</span>
        <h2>갤러리·내 파일을 조사</h2>
        <p>
          PIN 1017로 열고 사진, Documents, Download, DCIM과 microSD 존재 여부를
          확인합니다. 메시지 앱과 통화 앱은 열지 않습니다.
        </p>
      </article>
      <article className="web-system-role">
        <span>02 · 웹 포렌식 시스템</span>
        <h2>추출된 메시지·통화를 분석</h2>
        <p>
          실제 수사의 모바일 추출 결과를 모의한 CASE 017 기록입니다. 공폰에 가짜
          메시지 앱을 설치하거나 학생이 대화를 만드는 활동이 아닙니다.
        </p>
      </article>
      <article className="sd-media-role">
        <span>03 · 실제 microSD</span>
        <h2>삭제 사진을 직접 복구</h2>
        <p>
          교사 안내에 따라 공폰에서 분리한 뒤 카드리더기로 노트북에 연결하여
          IMG_2048.jpg를 복구합니다.
        </p>
      </article>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  tone = "blue",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "blue" | "amber" | "red";
}) {
  return (
    <button
      type="button"
      className={`primary-button ${tone}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      <i aria-hidden="true">→</i>
    </button>
  );
}

function AccessScreen({
  onComplete,
  teacherPreview = false,
  previewVariant = "",
}: {
  onComplete: () => void;
  teacherPreview?: boolean;
  previewVariant?: string;
}) {
  const [progress, setProgress] = useState(previewVariant === "alert" ? 100 : teacherPreview ? 28 : 0);
  const complete = progress >= 100;

  useEffect(() => {
    if (teacherPreview) return;
    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(100, value + (value < 64 ? 2 : 1)));
    }, 48);
    return () => window.clearInterval(timer);
  }, [teacherPreview]);

  return (
    <main className="access-screen">
      {!teacherPreview && <Link className="teacher-entry-link" href="/teacher">교사용</Link>}
      <div className="access-grid" />
      <div className="access-corners" aria-hidden="true" />
      <section className={classNames("access-console", complete && "complete")}>
        <span className="lab-index">디지털 증거 분석 시스템 · STUDENT ACCESS</span>
        <div className="access-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <span className="access-system-label">
          DIGITAL FORENSICS LAB · SECURE ACCESS SYSTEM
        </span>
        <h1>디지털 포렌식 수사실</h1>
        <p className="access-role">오늘부터 당신은 디지털 포렌식 수사관입니다.</p>
        {!complete ? (
          <div className="access-progress">
            <div>
              <span>{progress < 82 ? "접속 확인 중…" : "증거 보관 서버 동기화 중…"}</span>
              <b>{progress}%</b>
            </div>
            <div className="access-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <ul>
              <li className={progress > 18 ? "done" : ""}>IDENTITY CHANNEL</li>
              <li className={progress > 46 ? "done" : ""}>EVIDENCE VAULT</li>
              <li className={progress > 77 ? "done" : ""}>CASE DATABASE</li>
            </ul>
          </div>
        ) : (
          <div className="case-alert">
            <div className="case-alert-title">
              <span>CASE 017</span>
              <strong>사라진 목격 사진</strong>
            </div>
            <div className="alert-line">
              <span>PRIORITY 01</span>
              <b>긴급 사건이 접수되었습니다.</b>
            </div>
            <PrimaryButton tone="red" onClick={onComplete}>
              사건 파일 열기
            </PrimaryButton>
          </div>
        )}
      </section>
      <footer>AUTHORIZED TRAINING ENVIRONMENT · FICTIONAL CASE DATA</footer>
    </main>
  );
}

function TeacherPreviewBar({
  step,
  onStep,
  onShortcut,
}: {
  step: number;
  onStep: (step: number) => void;
  onShortcut: () => void;
}) {
  const current = PREVIEW_STEPS[step];
  const shortcut = current.variant === "pin"
    ? "정답으로 진행"
    : ["trace", "deleted-data", "messages", "calls", "frame"].includes(current.variant)
      ? "자동 등록"
      : ["board", "report"].includes(current.variant)
        ? "미리보기용 증거 자동 확보"
        : current.variant === "reconstruction"
          ? "예시 결과 보기"
          : "다음 단계 준비";

  return (
    <header className="teacher-preview-bar">
      <div><span>교사용 미리보기 · CASE 017</span><b>{String(step + 1).padStart(2, "0")} / {PREVIEW_STEPS.length} · {current.label}</b></div>
      <nav aria-label="교사용 미리보기 이동">
        <button type="button" onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0}>이전 단계</button>
        <button type="button" onClick={() => onStep(Math.min(PREVIEW_STEPS.length - 1, step + 1))} disabled={step === PREVIEW_STEPS.length - 1}>다음 단계</button>
        <label><span>단계 목록</span><select value={step} onChange={(event) => onStep(Number(event.target.value))}>{PREVIEW_STEPS.map((item, index) => <option value={index} key={`${item.label}-${index}`}>{index + 1}. {item.label}</option>)}</select></label>
        <button type="button" onClick={() => onStep(0)}>처음부터 보기</button>
        <Link href="/teacher">교사용으로 돌아가기</Link>
      </nav>
      <button type="button" className="preview-shortcut" onClick={onShortcut}>{shortcut}</button>
    </header>
  );
}

type Position = { x: number; y: number };

const DESKTOP_BOARD_POSITIONS: Record<string, Position> = {
  "deleted-trace": { x: 7, y: 12 },
  "recovered-photo": { x: 34, y: 6 },
  metadata: { x: 69, y: 11 },
  location: { x: 70, y: 58 },
  message: { x: 39, y: 69 },
  call: { x: 6, y: 59 },
  cctv: { x: 74, y: 34 },
  "suspect-C": { x: 42, y: 38 },
};

const COMPACT_BOARD_POSITIONS: Record<string, Position> = {
  "deleted-trace": { x: 3, y: 7 },
  message: { x: 53, y: 7 },
  call: { x: 3, y: 24 },
  "recovered-photo": { x: 53, y: 24 },
  metadata: { x: 3, y: 42 },
  location: { x: 53, y: 42 },
  cctv: { x: 3, y: 60 },
  "suspect-C": { x: 53, y: 60 },
};

export default function ForensicsExperience({ teacherPreview = false }: { teacherPreview?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [previewAuthorized, setPreviewAuthorized] = useState(!teacherPreview);
  const [previewStep, setPreviewStep] = useState(0);
  const [stage, setStage] = useState<StageId>("access");
  const [evidenceIds, setEvidenceIds] = useState<EvidenceId[]>([]);
  const [groupId, setGroupId] = useState("E-01");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [searchStarted, setSearchStarted] = useState(false);
  const [searchTime, setSearchTime] = useState(720);
  const [phoneFindings, setPhoneFindings] = useState({ gallery: false, files: false, storage: false });
  const [traceCode, setTraceCode] = useState("");
  const [traceError, setTraceError] = useState("");
  const [logsRegistered, setLogsRegistered] = useState(false);
  const [recoveryName, setRecoveryName] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryProgress, setRecoveryProgress] = useState(0);
  const [recoveryCodeVerified, setRecoveryCodeVerified] = useState(false);
  const [crossChecked, setCrossChecked] = useState(false);
  const [cctvRegistered, setCctvRegistered] = useState(false);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
    CORRECT_TIMELINE[2],
    CORRECT_TIMELINE[0],
    CORRECT_TIMELINE[4],
    CORRECT_TIMELINE[1],
    CORRECT_TIMELINE[5],
    CORRECT_TIMELINE[3],
  ]);
  const [timelineFeedback, setTimelineFeedback] = useState("");
  const [timelineVerified, setTimelineVerified] = useState(false);
  const [draggedTimelineId, setDraggedTimelineId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkStart, setLinkStart] = useState<string | null>(null);
  const [connections, setConnections] = useState<Array<[string, string]>>([]);
  const [boardReady, setBoardReady] = useState(false);
  const [suspect, setSuspect] = useState("");
  const [reportEvidence, setReportEvidence] = useState<EvidenceId[]>([]);
  const [rationale, setRationale] = useState("");
  const [reportError, setReportError] = useState("");
  const [reconstructionBeat, setReconstructionBeat] = useState(0);
  const [teacherHint, setTeacherHint] = useState<{ text: string; sentAt: string } | null>(null);
  const [positions, setPositions] = useState<Record<string, Position>>(
    DESKTOP_BOARD_POSITIONS,
  );
  const [compactPositions, setCompactPositions] = useState<Record<string, Position>>(
    COMPACT_BOARD_POSITIONS,
  );
  const [compactBoard, setCompactBoard] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  const currentIndex = STAGES.findIndex((item) => item.id === stage);
  const reportIsValid =
    suspect === "C" &&
    reportEvidence.length >= 3 &&
    rationale.trim().length >= 20 &&
    reportEvidence.filter((id) =>
      ["recovered-photo", "metadata", "cctv", "message", "call"].includes(id),
    ).length >= 2;
  const boardPositions = compactBoard ? compactPositions : positions;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
      if (teacherPreview) {
        const authorized = window.sessionStorage.getItem("df-teacher-auth") === "true";
        setPreviewAuthorized(authorized);
        return;
      }
      const savedStage = window.localStorage.getItem("df-stage") as StageId | null;
      const savedEvidence = window.localStorage.getItem("df-evidence");
      const savedGroup = window.localStorage.getItem("df-group-id");
      const requestedGroup = new URLSearchParams(window.location.search).get("group");
      if (savedStage && STAGES.some((item) => item.id === savedStage)) setStage(savedStage);
      if (savedEvidence) {
        try {
          setEvidenceIds(JSON.parse(savedEvidence));
        } catch {
          window.localStorage.removeItem("df-evidence");
        }
      }
      const groupNumber = requestedGroup ? Number(requestedGroup) : 0;
      if (groupNumber >= 1 && groupNumber <= 5) {
        setGroupId(`E-0${groupNumber}`);
      } else if (savedGroup) {
        setGroupId(savedGroup);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [teacherPreview]);

  useEffect(() => {
    if (!mounted || teacherPreview) return;
    window.localStorage.setItem("df-stage", stage);
    window.localStorage.setItem("df-evidence", JSON.stringify(evidenceIds));
    window.localStorage.setItem("df-group-id", groupId);
    const groupNumber = Number(groupId.slice(-1));
    window.localStorage.setItem(
      `df-group-${groupNumber}`,
      JSON.stringify({
        group: groupNumber,
        stage: STAGE_STATUS[stage] ?? STAGES[currentIndex]?.label ?? "대기",
        stageId: stage,
        evidenceCount: evidenceIds.length,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, [currentIndex, evidenceIds, groupId, mounted, stage, teacherPreview]);

  useEffect(() => {
    if (!mounted || teacherPreview) return;
    const groupNumber = Number(groupId.slice(-1));
    const readHint = () => {
      const raw = window.localStorage.getItem(`df-hint-${groupNumber}`);
      if (!raw) return;
      try {
        const next = JSON.parse(raw) as { text: string; sentAt: string };
        setTeacherHint((current) => (current?.sentAt === next.sentAt ? current : next));
      } catch {
        window.localStorage.removeItem(`df-hint-${groupNumber}`);
      }
    };
    readHint();
    const timer = window.setInterval(readHint, 1600);
    window.addEventListener("storage", readHint);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", readHint);
    };
  }, [groupId, mounted, teacherPreview]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 620px)");
    const syncBoardLayout = () => setCompactBoard(query.matches);
    syncBoardLayout();
    query.addEventListener("change", syncBoardLayout);
    return () => query.removeEventListener("change", syncBoardLayout);
  }, []);

  useEffect(() => {
    if (!searchStarted || stage !== "phone-search" || searchTime <= 0) return;
    const timer = window.setInterval(() => setSearchTime((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [searchStarted, searchTime, stage]);

  useEffect(() => {
    if (recoveryProgress <= 0 || recoveryProgress >= 94) return;
    const timer = window.setInterval(() => {
      setRecoveryProgress((value) => Math.min(94, value + (value < 23 ? 3 : value < 61 ? 4 : 2)));
    }, 70);
    return () => window.clearInterval(timer);
  }, [recoveryProgress]);

  useEffect(() => {
    if (stage !== "reconstruction") return;
    const timer = window.setInterval(
      () => setReconstructionBeat((value) => Math.min(6, value + 1)),
      1700,
    );
    return () => window.clearInterval(timer);
  }, [stage]);

  function addEvidence(...ids: EvidenceId[]) {
    setEvidenceIds((current) => Array.from(new Set([...current, ...ids])));
  }

  function applyPreviewStep(index: number) {
    const preview = PREVIEW_STEPS[index];
    const allEvidence = Object.keys(EVIDENCE) as EvidenceId[];
    setStage(preview.stage);
    setGroupId("E-01");
    setPin(preview.stage === "pin" ? "1017" : "");
    setPinError("");
    setSearchStarted(preview.stage === "phone-search");
    setSearchTime(720);
    setPhoneFindings(preview.stage === "phone-search" ? { gallery: true, files: true, storage: true } : { gallery: false, files: false, storage: false });
    setTraceCode(["trace", "deleted-data"].includes(preview.variant) ? "DF-2048" : "");
    setTraceError("");
    setLogsRegistered(["messages", "calls"].includes(preview.variant));
    setRecoveryName(preview.stage === "recovery" ? "IMG_2048.JPG" : "");
    setRecoveryError("");
    setRecoveryProgress(preview.stage === "recovery" ? 94 : 0);
    setRecoveryCodeVerified(["deleted-data", "micro-sd"].includes(preview.variant));
    setCrossChecked(["metadata", "frame", "timeline", "board", "report", "reconstruction", "career"].includes(preview.variant));
    setCctvRegistered(["frame", "timeline", "board", "report", "reconstruction", "career"].includes(preview.variant));
    setTimelineItems(["timeline", "board", "report", "reconstruction", "career"].includes(preview.variant) ? CORRECT_TIMELINE : [CORRECT_TIMELINE[2], CORRECT_TIMELINE[0], CORRECT_TIMELINE[4], CORRECT_TIMELINE[1], CORRECT_TIMELINE[5], CORRECT_TIMELINE[3]]);
    setTimelineVerified(["timeline", "board", "report", "reconstruction", "career"].includes(preview.variant));
    setTimelineFeedback(preview.variant === "timeline" ? "미리보기용 정답 순서가 자동 적용되었습니다." : "");
    setConnections(["board", "report", "reconstruction", "career"].includes(preview.variant) ? [["recovered-photo", "metadata"], ["metadata", "cctv"], ["message", "suspect-C"]] : []);
    setBoardReady(["board", "report", "reconstruction", "career"].includes(preview.variant));
    setEvidenceIds(
      ["trace", "deleted-data"].includes(preview.variant)
        ? ["deleted-trace", "recovered-photo"]
        : ["messages"].includes(preview.variant)
          ? ["deleted-trace", "recovered-photo", "message"]
          : ["calls"].includes(preview.variant)
            ? ["deleted-trace", "recovered-photo", "message", "call"]
            : ["micro-sd", "metadata", "frame", "timeline", "board", "report", "reconstruction", "career"].includes(preview.variant)
              ? allEvidence
              : [],
    );
    const completeReport = ["report", "reconstruction", "career"].includes(preview.variant);
    setSuspect(completeReport ? "C" : "");
    setReportEvidence(completeReport ? ["recovered-photo", "metadata", "cctv", "message", "call"] : []);
    setRationale(completeReport ? "복구 사진의 작은 특징과 메타데이터 촬영 시각이 CCTV 프레임, 메시지, 통화기록의 시간 흐름과 일치합니다." : "");
    setReportError("");
    setReconstructionBeat(preview.variant === "reconstruction" ? 6 : 0);
    window.history.replaceState(null, "", `/teacher/preview?step=${index}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!mounted || !teacherPreview || !previewAuthorized) return;
    const timer = window.setTimeout(() => {
      const requested = Number(new URLSearchParams(window.location.search).get("step") ?? "0");
      const nextStep = Number.isFinite(requested)
        ? Math.max(0, Math.min(PREVIEW_STEPS.length - 1, requested))
        : 0;
      setPreviewStep(nextStep);
      applyPreviewStep(nextStep);
    }, 0);
    return () => window.clearTimeout(timer);
    // The preview seed is intentionally applied once after authorization.
  }, [mounted, previewAuthorized, teacherPreview]);

  function openPreviewStep(index: number) {
    const next = Math.max(0, Math.min(PREVIEW_STEPS.length - 1, index));
    setPreviewStep(next);
    applyPreviewStep(next);
  }

  function applyPreviewShortcut() {
    const preview = PREVIEW_STEPS[previewStep];
    if (preview.variant === "pin") setPin("1017");
    if (["trace", "deleted-data"].includes(preview.variant)) {
      setTraceCode("DF-2048");
      setRecoveryCodeVerified(true);
      addEvidence("deleted-trace", "recovered-photo");
    }
    if (["messages", "calls"].includes(preview.variant)) {
      setLogsRegistered(true);
      addEvidence("message", "call");
    }
    if (preview.variant === "frame") {
      setCctvRegistered(true);
      addEvidence("cctv");
    }
    if (["board", "report"].includes(preview.variant)) {
      setEvidenceIds(Object.keys(EVIDENCE) as EvidenceId[]);
      setConnections([["recovered-photo", "metadata"], ["metadata", "cctv"], ["message", "suspect-C"]]);
      setBoardReady(true);
      if (preview.variant === "report") {
        setSuspect("C");
        setReportEvidence(["recovered-photo", "metadata", "cctv", "message", "call"]);
        setRationale("복구 사진의 작은 특징과 메타데이터 촬영 시각이 CCTV 프레임, 메시지, 통화기록의 시간 흐름과 일치합니다.");
      }
    }
    if (preview.variant === "reconstruction") setReconstructionBeat(6);
    if (!["trace", "deleted-data", "messages", "calls", "frame", "board", "report", "reconstruction"].includes(preview.variant)) {
      openPreviewStep(Math.min(PREVIEW_STEPS.length - 1, previewStep + 1));
    }
  }

  function go(next: StageId) {
    if (teacherPreview) {
      const nextPreview = PREVIEW_STEPS.findIndex((item, index) => index > previewStep && item.stage === next);
      openPreviewStep(nextPreview >= 0 ? nextPreview : Math.min(PREVIEW_STEPS.length - 1, previewStep + 1));
      return;
    }
    setStage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goPrevious() {
    if (currentIndex <= 0) return;
    go(STAGES[currentIndex - 1].id);
  }

  function goFirst() {
    go("access");
  }

  function submitPin() {
    if (pin === "1017") {
      setPinError("");
      go("phone-search");
    } else {
      setPinError("단서의 날짜를 네 자리 숫자로 다시 해석하십시오.");
      setPin("");
    }
  }

  function submitTraceCode() {
    if (traceCode.trim().toUpperCase() !== "DF-2048") {
      setTraceError("복구 결과의 증거 코드 문자·하이픈·숫자를 다시 확인하십시오.");
      return;
    }
    setTraceError("");
    setRecoveryCodeVerified(true);
    addEvidence("deleted-trace", "recovered-photo");
  }

  function startRecovery() {
    if (recoveryName.trim().toUpperCase() !== "IMG_2048.JPG") {
      setRecoveryError("복구 도구에서 실제로 확인한 파일명을 다시 입력하십시오.");
      return;
    }
    setRecoveryError("");
    setRecoveryProgress(1);
  }

  function moveTimeline(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= timelineItems.length) return;
    const next = [...timelineItems];
    [next[index], next[target]] = [next[target], next[index]];
    setTimelineItems(next);
    setTimelineFeedback("");
  }

  function verifyTimeline() {
    const mismatch = timelineItems.findIndex(
      (item, index) => item.id !== CORRECT_TIMELINE[index].id,
    );
    if (mismatch === -1) {
      setTimelineVerified(true);
      setTimelineFeedback("시간 흐름과 증거 발생 순서가 일치합니다. 타임라인이 봉인되었습니다.");
      return;
    }
    const item = timelineItems[mismatch];
    setTimelineFeedback(
      `${item.source}의 시간이 앞뒤 기록과 일치하지 않습니다. 원자료의 초 단위를 다시 비교하십시오.`,
    );
  }

  function onTimelineDrop(targetId: string) {
    if (!draggedTimelineId || draggedTimelineId === targetId) return;
    const draggedIndex = timelineItems.findIndex((item) => item.id === draggedTimelineId);
    const targetIndex = timelineItems.findIndex((item) => item.id === targetId);
    const next = [...timelineItems];
    const [dragged] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, dragged);
    setTimelineItems(next);
    setDraggedTimelineId(null);
    setTimelineFeedback("");
  }

  function handleBoardPointerDown(id: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (linkMode || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const current = boardPositions[id];
    dragRef.current = {
      id,
      offsetX: event.clientX - (rect.left + (current.x / 100) * rect.width),
      offsetY: event.clientY - (rect.top + (current.y / 100) * rect.height),
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleBoardPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left - dragRef.current.offsetX) / rect.width) * 100;
    const y = ((event.clientY - rect.top - dragRef.current.offsetY) / rect.height) * 100;
    dragRef.current.moved = true;
    const updatePositions = compactBoard ? setCompactPositions : setPositions;
    updatePositions((current) => ({
      ...current,
      [dragRef.current!.id]: {
        x: Math.max(0, Math.min(compactBoard ? 56 : 79, x)),
        y: Math.max(0, Math.min(77, y)),
      },
    }));
  }

  function selectBoardNode(id: string) {
    if (!linkMode || dragRef.current?.moved) return;
    if (!linkStart) {
      setLinkStart(id);
      return;
    }
    if (linkStart !== id) {
      const duplicate = connections.some(
        ([a, b]) => (a === linkStart && b === id) || (a === id && b === linkStart),
      );
      if (!duplicate) setConnections((current) => [...current, [linkStart, id]]);
    }
    setLinkStart(null);
  }

  function connectionStyle(from: string, to: string) {
    const start = boardPositions[from];
    const end = boardPositions[to];
    const nodeCenterX = compactBoard ? 21 : 10;
    const x1 = start.x + nodeCenterX;
    const y1 = start.y + 8;
    const x2 = end.x + nodeCenterX;
    const y2 = end.y + 8;
    const dx = x2 - x1;
    const dy = y2 - y1;
    return {
      left: `${x1}%`,
      top: `${y1}%`,
      width: `${Math.sqrt(dx * dx + dy * dy)}%`,
      transform: `rotate(${Math.atan2(dy, dx)}rad)`,
    };
  }

  function submitReport() {
    if (!suspect) {
      setReportError("의심 인물을 선택하십시오.");
      return;
    }
    if (reportEvidence.length < 3) {
      setReportError("서로 다른 결정적 증거를 최소 3개 선택하십시오.");
      return;
    }
    if (rationale.trim().length < 20) {
      setReportError("증거 사이의 연결이 드러나도록 판단 근거를 조금 더 구체적으로 작성하십시오.");
      return;
    }
    setReportError("");
    setReconstructionBeat(0);
    go("reconstruction");
  }

  if (!mounted) return <main className="boot-blank" />;
  if (teacherPreview && !previewAuthorized) {
    return <main className="preview-auth-required"><section><span>TEACHER ACCESS REQUIRED</span><h1>교사용 관리센터 로그인이 필요합니다.</h1><p>학생 단계별 미리보기는 교사용 인증 후에만 열립니다.</p><Link href="/teacher">교사용 로그인으로 이동</Link></section></main>;
  }
  if (stage === "access") return (
    <>
      {teacherPreview && <TeacherPreviewBar step={previewStep} onStep={openPreviewStep} onShortcut={applyPreviewShortcut} />}
      <AccessScreen key={teacherPreview ? PREVIEW_STEPS[previewStep]?.variant : "student-access"} onComplete={() => go("briefing")} teacherPreview={teacherPreview} previewVariant={PREVIEW_STEPS[previewStep]?.variant} />
    </>
  );

  return (
    <main className={classNames("forensics-app", teacherPreview && "teacher-preview-active", !teacherPreview && "has-stage-navigation")}>
      {teacherPreview && <TeacherPreviewBar step={previewStep} onStep={openPreviewStep} onShortcut={applyPreviewShortcut} />}
      <div className="ambient-grid" />
      <SystemHud stage={stage} evidenceCount={evidenceIds.length} groupId={groupId} />
      {!teacherPreview && (
        <StudentStageNavigation
          stage={stage}
          onPrevious={goPrevious}
          onFirst={goFirst}
        />
      )}
      {teacherHint && (
        <aside className="teacher-hint-toast" aria-live="polite">
          <div>
            <span>수사본부 힌트 · {groupId}</span>
            <p>{teacherHint.text}</p>
          </div>
          <button type="button" onClick={() => setTeacherHint(null)} aria-label="힌트 닫기">닫기</button>
        </aside>
      )}

      {stage === "briefing" && (
        <section className="scene briefing-scene">
          <div className="briefing-copy">
            <span className="priority-label">URGENT INCIDENT BRIEFING</span>
            <h1>
              CASE 017
              <small>사라진 목격 사진</small>
            </h1>
            <p>학교 축제가 끝난 저녁, 행사실에서 축제 수익금 모금함이 사라졌다.</p>
            <div className="briefing-facts">
              <div>
                <span>발생 장소</span>
                <b>본관 2층 행사실</b>
              </div>
              <div>
                <span>신고 시각</span>
                <b>19:02</b>
              </div>
              <div>
                <span>확보 영상</span>
                <b>CAM 03</b>
              </div>
            </div>
          </div>
          <div className="briefing-video">
            <CctvPlayer />
            <div className="briefing-caption">
              <span>관찰 지시</span>
              <p>인물, 시각, 동선을 기억하십시오. 이 영상은 이후 분석 단계에서 다시 제공됩니다.</p>
            </div>
          </div>
          <PrimaryButton tone="amber" onClick={() => go("case-file")}>
            사건 파일 열람
          </PrimaryButton>
        </section>
      )}

      {stage === "case-file" && (
        <section className="scene case-file-scene">
          <div className="case-folder">
            <div className="folder-tab">CASE FILE 017 · CONFIDENTIAL</div>
            <div className="case-paper">
              <div className="paper-header">
                <div>
                  <span>사건 분류</span>
                  <b>DIGITAL EVIDENCE / THEFT</b>
                </div>
                <strong>017</strong>
              </div>
              <h1>사라진 목격 사진</h1>
              <p className="case-summary">
                오늘 오후 7시경 학교 축제 수익금이 보관되어 있던 행사실의 모금함이
                사라졌다.
              </p>
              <div className="case-key-clue">
                <span>중요 단서 01</span>
                <p>사건 직전 한 학생이 행사실 근처에서 사진 한 장을 촬영했다.</p>
              </div>
              <div className="missing-photo">
                <div className="broken-image">
                  <span>IMG_2048.jpg</span>
                  <strong>FILE NOT FOUND</strong>
                  <small>ERROR 0x0017 · SOURCE REMOVED</small>
                </div>
                <div className="missing-warning">
                  <span>삭제 확인</span>
                  <b>목격자의 스마트폰에서 해당 사진이 삭제된 사실이 확인되었습니다.</b>
                </div>
              </div>
              <div className="paper-stamp">RESTRICTED</div>
            </div>
          </div>
          <PrimaryButton onClick={() => go("evidence-intake")}>
            증거물 인계 요청
          </PrimaryButton>
        </section>
      )}

      {stage === "evidence-intake" && (
        <section className="scene evidence-intake-scene">
          <MissionHeading
            eyebrow="MISSION 01 · EVIDENCE INTAKE"
            title="증거물을 인계받으십시오."
            description="봉인 상태와 증거물 번호를 확인한 뒤에만 개봉하십시오."
          />
          <div className="evidence-bag-wrap">
            <div className="evidence-bag">
              <div className="bag-seal">SEALED · CHAIN OF CUSTODY</div>
              <div className="bag-document">
                <span>CASE 017</span>
                <h2>EVIDENCE</h2>
                <strong>{groupId}</strong>
                <dl>
                  <div>
                    <dt>증거 종류</dt>
                    <dd>MOBILE DEVICE</dd>
                  </div>
                  <div>
                    <dt>압수 위치</dt>
                    <dd>행사실 인근</dd>
                  </div>
                  <div>
                    <dt>취급 등급</dt>
                    <dd>TRAINING / CONTROLLED</dd>
                  </div>
                </dl>
                <p>개봉 전 임의 조작 금지</p>
              </div>
              <div className="phone-silhouette" aria-hidden="true">
                <span />
              </div>
            </div>
            <div className="evidence-side-panel">
              <span>모둠별 증거물 번호</span>
              <div className="evidence-number-grid">
                {[1, 2, 3, 4, 5].map((number) => {
                  const id = `E-0${number}`;
                  return (
                    <button
                      type="button"
                      key={id}
                      className={groupId === id ? "selected" : ""}
                      onClick={() => setGroupId(id)}
                    >
                      {id}
                    </button>
                  );
                })}
              </div>
              <ol>
                <li>봉투의 CASE 번호 확인</li>
                <li>봉인선 훼손 여부 확인</li>
                <li>모둠 증거물 번호 대조</li>
                <li>대표 수사관 1인이 개봉</li>
              </ol>
              <div className="ethics-note">
                E-01은 실제 갤러리·파일 구조·microSD를 조사하는 수업용 현장 증거물입니다. 개인 기기는 조사하지 않습니다.
              </div>
            </div>
          </div>
          <PrimaryButton tone="amber" onClick={() => go("pin")}>
            봉인 확인 및 개봉
          </PrimaryButton>
        </section>
      )}

      {stage === "pin" && (
        <section className="scene pin-scene">
          <div className="witness-statement">
            <span>WITNESS STATEMENT · 017-W3</span>
            <blockquote>
              <p>“휴대폰 비밀번호요?”</p>
              <p>“제가 절대 잊어버리지 않는 숫자로 해놨어요.”</p>
              <strong>“축제 개막일이에요.”</strong>
            </blockquote>
            <div className="festival-record">
              <span>교내 행사 기록</span>
              <b>학교 축제</b>
              <strong>10월 17일 개막</strong>
            </div>
            <p className="legal-note">
              이 단계는 교사가 설정한 수업용 PIN 퍼즐입니다. 실제 보안 우회 방법을 다루지 않습니다.
            </p>
          </div>
          <div className="pin-terminal">
            <span>DEVICE ACCESS · {groupId}</span>
            <h1>네 자리 PIN을 입력하십시오.</h1>
            <div className="pin-display" aria-label={`입력한 숫자 ${pin.length}자리`}>
              {[0, 1, 2, 3].map((index) => (
                <i key={index} className={pin.length > index ? "filled" : ""} />
              ))}
            </div>
            <div className="keypad">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <button
                  type="button"
                  key={number}
                  onClick={() => pin.length < 4 && setPin((value) => value + number)}
                >
                  {number}
                </button>
              ))}
              <button type="button" onClick={() => setPin("")}>초기화</button>
              <button type="button" onClick={() => pin.length < 4 && setPin((value) => value + "0")}>
                0
              </button>
              <button type="button" onClick={() => setPin((value) => value.slice(0, -1))}>지우기</button>
            </div>
            {pinError && <p className="error-message">{pinError}</p>}
            <PrimaryButton onClick={submitPin} disabled={pin.length !== 4}>
              접근 승인 요청
            </PrimaryButton>
          </div>
        </section>
      )}

      {stage === "phone-search" && (
        <section className="scene search-scene">
          {!searchStarted ? (
            <div className="search-brief">
              <span>FIELD INVESTIGATION · MOBILE DEVICE</span>
              <h1>실제 증거폰 조사</h1>
              <p>
                디지털 증거는 웹 화면 속 데이터에만 존재하지 않습니다. 증거물 E-01의 실제
                저장매체와 파일 구조를 조사하여 사건과 관련된 자료를 확보하십시오.
              </p>
              <div className="search-rule">
                <b>공폰에서는 메시지나 통화기록을 찾지 않습니다.</b>
                <span>기본 갤러리, 내 파일, microSD 존재 여부만 실제로 조사하십시오.</span>
              </div>
              <EvidenceRoleGuide />
              <div className="timer-preview">
                <span>제한시간</span>
                <strong>12:00</strong>
              </div>
              <PrimaryButton tone="amber" onClick={() => setSearchStarted(true)}>
                수사 시작
              </PrimaryButton>
            </div>
          ) : (
            <div className="search-active">
              <div className="search-command">
                <span>현장 조사 진행 중</span>
                <h1>실제 공폰의 갤러리, 파일 앱, 저장매체를 조사하십시오.</h1>
                <p>발견한 파일은 임의로 수정하거나 삭제하지 말고 이름·위치·존재 여부만 기록하십시오.</p>
              </div>
              <div className="active-role-reminder">
                <span>지금 사용하는 것 · 실제 공폰</span>
                <strong>갤러리·내 파일·microSD만 확인</strong>
                <p>메시지와 통화기록은 공폰에서 보지 않습니다. 다음 웹 분석 단계에서 확인합니다.</p>
              </div>
              <div className={classNames("countdown", searchTime < 120 && "warning")}>
                <span>TIME REMAINING</span>
                <strong>{formatTimer(searchTime)}</strong>
                <div className="countdown-track">
                  <span style={{ width: `${(searchTime / 720) * 100}%` }} />
                </div>
              </div>
              <div className="investigation-notes">
                <div>
                  <span>수사 원칙 01</span>
                  <p>기본 갤러리에서 IMG_2039~IMG_2045를 자유롭게 살펴봅니다.</p>
                </div>
                <div>
                  <span>수사 원칙 02</span>
                  <p>내 파일에서 Documents, Download, DCIM 위치를 확인합니다.</p>
                </div>
                <div>
                  <span>수사 원칙 03</span>
                  <p>결정적 사진의 부재와 외부 저장매체 존재를 구분해 기록합니다.</p>
                </div>
              </div>
              <div className="physical-search-list">
                {[
                  ["gallery", "실제 갤러리의 사진과 파일명을 확인했습니다."],
                  ["files", "실제 파일 앱의 Documents, Download, DCIM을 확인했습니다."],
                  ["storage", "결정적 사진이 보이지 않으며 microSD가 있음을 확인했습니다."],
                ].map(([id, label]) => (
                  <label key={id} className={phoneFindings[id as keyof typeof phoneFindings] ? "checked" : ""}>
                    <input
                      type="checkbox"
                      checked={phoneFindings[id as keyof typeof phoneFindings]}
                      onChange={() => setPhoneFindings((current) => ({ ...current, [id]: !current[id as keyof typeof current] }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="physical-web-boundary">
                <b>공폰 조사 완료</b>
                <p>
                  공폰에서는 갤러리·내 파일·microSD만 확인했습니다. 메시지와 통화기록은
                  공폰에서 찾거나 조작하지 않습니다. 다음 화면에서 웹에 미리 준비된
                  포렌식 추출 결과를 분석합니다.
                </p>
              </div>
              <PrimaryButton
                onClick={() => go("dashboard")}
                disabled={!Object.values(phoneFindings).every(Boolean)}
              >
                웹에 준비된 추출 데이터 분석
              </PrimaryButton>
            </div>
          )}
        </section>
      )}

      {stage === "dashboard" && (
        <section className="scene dashboard-scene">
          <MissionHeading
            eyebrow="MOBILE EXTRACTION · FORENSIC ANALYSIS"
            title="웹에 제공된 모바일 추출 결과를 분석하십시오."
            description="공폰의 메시지 앱을 여는 단계가 아닙니다. 실제 수사에서 추출 도구가 만드는 분석 결과를 모의한 CASE 017 데이터가 이 웹앱에 미리 제공됩니다."
          />
          <EvidenceRoleGuide />
          <div className="analysis-console">
            <aside className="console-index">
              <span>ACQUIRED SOURCE</span>
              <strong>{groupId}</strong>
              <dl>
                <div><dt>DEVICE</dt><dd>Samsung Galaxy</dd></div>
                <div><dt>MODE</dt><dd>LOGICAL EXTRACTION</dd></div>
                <div><dt>INTEGRITY</dt><dd>BASELINE RECORDED</dd></div>
              </dl>
            </aside>
            <div className="console-main">
              <div className="deleted-file-row">
                <span>DF-2048</span>
                <div>
                  <b>IMG_2048.jpg</b>
                  <small>/storage/32E1-17AF/DCIM/Camera</small>
                </div>
                <strong>DELETED</strong>
              </div>
              <div className="binary-strip" aria-hidden="true">
                49 4D 47 5F 32 30 34 38 · 00 FF D8 · 3A 17 8C 0F · UNALLOCATED
              </div>
              <div className="analysis-findings">
                <div>
                  <span>원본 데이터</span>
                  <b>일부 확인</b>
                </div>
                <div>
                  <span>외부 저장매체</span>
                  <b>사용 흔적 발견</b>
                </div>
                <div>
                  <span>추가 분석</span>
                  <b>필요</b>
                </div>
              </div>
              <div className="correlated-logs">
                <div className="log-title">
                  <span>웹 포렌식 보고서 · 통신 기록</span>
                  <b>18:27~18:45</b>
                </div>
                <div className="web-extraction-notice">
                  <strong>공폰 화면이 아닙니다.</strong>
                  <p>
                    공폰에 이 메시지·통화 내역을 넣지 않습니다. 학생은 웹에 제공된 추출
                    보고서에서 시간과 상대방만 읽고 CCTV·사진과 교차검증합니다.
                  </p>
                </div>
                <div className={classNames("extraction-record-groups", logsRegistered && "revealed")}>
                  <section className="extraction-record-set">
                    <header><span>WEB FORENSIC REPORT</span><b>MESSAGE RECORD</b><small>공폰 화면 아님</small></header>
                    {[
                      ["18:27", "C", "행사실 쪽에 사람 있어?"],
                      ["18:31", "B", "나 지금 체육관이야."],
                      ["18:36", "C", "사진 찍었어?"],
                      ["18:38", "목격자", "응. 근데 이상한 사람이 있었어."],
                      ["18:40:52", "C", "행사실 앞에 둔 것 확인했어."],
                      ["18:41", "C", "그 사진 누구한테 보냈어?"],
                    ].map(([time, sender, message]) => (
                      <div className="extraction-record-row" key={`${time}-${sender}`}><time>{time}</time><b>{sender}</b><p>{message}</p></div>
                    ))}
                  </section>
                  <section className="extraction-record-set">
                    <header><span>WEB FORENSIC REPORT</span><b>CALL RECORD</b><small>공폰 화면 아님</small></header>
                    {[
                      ["18:29", "B → 친구", "2분 14초"],
                      ["18:41", "C → 목격자", "43초"],
                      ["18:44:12", "C → 목격자", "38초"],
                      ["18:45", "C → 미확인 번호", "1분 02초"],
                    ].map(([time, target, duration]) => (
                      <div className="extraction-record-row" key={`${time}-${target}`}><time>{time}</time><b>{target}</b><p>{duration}</p></div>
                    ))}
                  </section>
                </div>
                {!logsRegistered && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogsRegistered(true);
                      addEvidence("deleted-trace", "message", "call");
                    }}
                  >
                    웹 추출 보고서 열기
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="mission-unlock">
            <span>MISSION 02 UNLOCKED</span>
            <h2>삭제된 데이터를 복구하십시오.</h2>
            <p>웹앱이 복구를 대신하지 않습니다. 수업용 microSD를 직접 분석해야 합니다.</p>
          </div>
          <PrimaryButton onClick={() => go("recovery")} disabled={!logsRegistered}>
            microSD 분석 절차 시작
          </PrimaryButton>
        </section>
      )}

      {stage === "recovery" && (
        <section className="scene recovery-scene">
          <MissionHeading
            eyebrow="MISSION 02 · DELETE DATA RECOVERY"
            title="현재 파일과 삭제 흔적을 구분하십시오."
            description="microSD를 리더기에 연결하고 지정된 복구 도구에서 직접 검색한 결과를 이 시스템과 대조하십시오."
          />
          <div className="recovery-layout">
            <aside className="offline-procedure">
              <span>OFFLINE PROCEDURE</span>
              <ol>
                <li><b>01</b><p>공폰 전원을 끄고 교사 안내에 따라 microSD를 분리</p></li>
                <li><b>02</b><p>USB 카드 리더기로 분석 노트북에 연결</p></li>
                <li><b>03</b><p>지정된 복구 도구에서 해당 드라이브만 검색</p></li>
                <li><b>04</b><p>복구 파일은 microSD가 아닌 별도 폴더에 저장</p></li>
              </ol>
              <div className="write-warning">
                분석 전 저장매체에 새 파일을 쓰면 기존 데이터가 덮어쓰일 수 있습니다.
              </div>
            </aside>
            <div className="recovery-terminal">
              <div className="recovery-header">
                <div>
                  <span>SOURCE</span>
                  <b>microSD · 32E1-17AF</b>
                </div>
                <strong>READ ONLY</strong>
              </div>
              <div className="file-state-list">
                <div><span>IMG_2039.jpg</span><i style={{ width: "100%" }} /><b>현재 파일 · 정상 열림</b></div>
                <div><span>IMG_2040.jpg</span><i style={{ width: "100%" }} /><b>현재 파일 · 정상 열림</b></div>
                <div><span>IMG_2041.jpg</span><i style={{ width: "100%" }} /><b>현재 파일 · 정상 열림</b></div>
                <div><span>IMG_2042.jpg</span><i style={{ width: "100%" }} /><b>현재 파일 · 정상 열림</b></div>
                <div className={recoveryProgress > 0 ? "active" : ""}>
                  <span>IMG_2048.jpg</span>
                  <i style={{ width: `${recoveryProgress}%` }} />
                  <b>{recoveryProgress > 0 ? `${recoveryProgress}%` : "분석 대기"}</b>
                </div>
              </div>
              <div className="recovery-entry">
                <label htmlFor="recovery-file">복구 도구에서 확인한 결정적 파일명</label>
                <div>
                  <input
                    id="recovery-file"
                    value={recoveryName}
                    onChange={(event) => setRecoveryName(event.target.value)}
                    placeholder="IMG_0000.jpg"
                  />
                  <button type="button" onClick={startRecovery}>복구 결과 대조</button>
                </div>
                {recoveryError && <p className="error-message">{recoveryError}</p>}
              </div>
              {recoveryProgress > 0 && (
                <div className="recovered-preview">
                  <div
                    className="recovered-image"
                    style={{
                      filter: `blur(${Math.max(0, 12 - recoveryProgress / 8)}px) grayscale(.72)`,
                      opacity: Math.max(0.3, recoveryProgress / 100),
                    }}
                  >
                    <img src="/case017/sd-pack/IMG_2048.jpg" alt="microSD에서 복구한 행사실 복도 목격 사진" />
                  </div>
                  <div>
                    <span>RECOVERED ARTIFACT</span>
                    <b>IMG_2048.jpg</b>
                    <p>
                      복구된 이미지에 검은 후드티를 입은 인물이 보입니다. 그러나 이 사진만으로
                      인물을 확정할 수 없습니다.
                    </p>
                  </div>
                </div>
              )}
              {recoveryProgress >= 94 && (
                <div className={classNames("trace-entry", "recovery-code-entry", recoveryCodeVerified && "verified")}>
                  <label htmlFor="trace-code">복구 결과의 증거 코드를 웹 시스템에 등록하십시오.</label>
                  <div>
                    <input
                      id="trace-code"
                      value={traceCode}
                      onChange={(event) => setTraceCode(event.target.value)}
                      placeholder="DF-0000"
                      autoComplete="off"
                      disabled={recoveryCodeVerified}
                    />
                    <button type="button" onClick={submitTraceCode} disabled={recoveryCodeVerified}>
                      {recoveryCodeVerified ? "등록 완료" : "증거 코드 등록"}
                    </button>
                  </div>
                  {traceError && <p className="error-message">{traceError}</p>}
                  {recoveryCodeVerified && <p className="success-message">DF-2048이 E-02·E-03 증거로 등록되었습니다.</p>}
                </div>
              )}
            </div>
          </div>
          <div className="recovery-principle">
            <b>기억할 원칙</b>
            <p>삭제했다고 항상 복구되는 것도, 복구됐다고 곧바로 범죄 증거가 되는 것도 아닙니다.</p>
          </div>
          <PrimaryButton onClick={() => go("metadata")} disabled={recoveryProgress < 94 || !recoveryCodeVerified}>
            복구 파일 메타데이터 분석
          </PrimaryButton>
        </section>
      )}

      {stage === "metadata" && (
        <section className="scene metadata-scene">
          <MissionHeading
            eyebrow="MISSION 03 · METADATA CORRELATION"
            title="사진 뒤에 남은 시간을 읽으십시오."
            description="사진 내용과 메타데이터는 서로 다른 증거입니다. 다른 기록과 일치하는지 확인해야 합니다."
          />
          <div className="metadata-workbench">
            <div className="photo-inspector">
              <div className="photo-frame">
                <img src="/case017/sd-pack/IMG_2048.jpg" alt="복구된 행사실 복도 목격 사진" />
                <div className="focus-box"><span>SUBJECT 01</span></div>
              </div>
              <div className="photo-hypothesis">
                <span>초기 가설</span>
                <p>검은 후드티를 자주 입는 용의자 B가 사진 속 인물일 가능성이 있다.</p>
              </div>
            </div>
            <div className="metadata-panel">
              <div className="meta-file">
                <span>IMG_2048.jpg</span>
                <b>JPEG · RECOVERED</b>
              </div>
              <dl>
                <div><dt>촬영 시각</dt><dd>18:42:17</dd></div>
                <div><dt>수정 시각</dt><dd>18:42:17</dd></div>
                <div><dt>해상도</dt><dd>4032 × 3024</dd></div>
                <div><dt>촬영 기기</dt><dd>Samsung Galaxy</dd></div>
                <div><dt>ISO</dt><dd>160</dd></div>
                <div><dt>셔터속도</dt><dd>1/60</dd></div>
                <div><dt>위치</dt><dd>본관 2층 · 행사실 동쪽 복도</dd></div>
              </dl>
              <div className="floor-map">
                <span className="hallway-line" />
                <i className="room room-1">행사실</i>
                <i className="room room-2">계단</i>
                <b>PHOTO 18:42:17</b>
              </div>
            </div>
          </div>
          <div className={classNames("cross-check", crossChecked && "complete")}>
            <div>
              <span>CROSS CHECK 01</span>
              <h2>용의자 B의 위치 기록과 비교</h2>
            </div>
            {!crossChecked ? (
              <button
                type="button"
                onClick={() => {
                  setCrossChecked(true);
                  addEvidence("metadata", "location");
                }}
              >
                위치 기록 조회
              </button>
            ) : (
              <div className="location-result">
                <strong>가설 충돌</strong>
                <p>용의자 B의 기기는 18:39~18:49 체육관 무대에 머물렀고 공연 영상에도 같은 시각 등장합니다.</p>
                <b>검은 후드만으로 B를 특정할 수 없습니다.</b>
              </div>
            )}
          </div>
          <PrimaryButton onClick={() => go("cctv-analysis")} disabled={!crossChecked}>
            CCTV에서 다른 특징 찾기
          </PrimaryButton>
        </section>
      )}

      {stage === "cctv-analysis" && (
        <section className="scene cctv-analysis-scene">
          <MissionHeading
            eyebrow="MISSION 03 · FRAME ANALYSIS"
            title="브리핑 영상을 프레임 단위로 다시 분석하십시오."
            description="18:47 전후 인물의 옷 색이 아닌 작은 특징을 찾아 중요 장면으로 등록하십시오."
          />
          <div className="frame-lab">
            <CctvPlayer
              analysis
              onRegister={() => {
                setCctvRegistered(true);
                addEvidence("cctv");
              }}
            />
            <aside className="frame-notes">
              <span>FRAME COMPARISON</span>
              <h2>사진과 영상의 공통 특징</h2>
              <div className="feature-list">
                <div><b>01</b><p>밝은 캔버스 운동화</p></div>
                <div><b>02</b><p>오른쪽 어깨의 좁은 반사형 가방끈</p></div>
                <div><b>03</b><p>검은 후드티</p></div>
              </div>
              <div className="suspect-shift">
                <span>새로운 가설</span>
                <p>이 두 가지 작은 특징은 용의자 C의 압수 목록과 일치합니다.</p>
              </div>
            </aside>
          </div>
          <PrimaryButton onClick={() => go("timeline")} disabled={!cctvRegistered}>
            사건 시간 재구성
          </PrimaryButton>
        </section>
      )}

      {stage === "timeline" && (
        <section className="scene timeline-scene">
          <MissionHeading
            eyebrow="MISSION 04 · TEMPORAL RECONSTRUCTION"
            title="증거를 실제 발생 시간순으로 정렬하십시오."
            description="카드를 끌어 놓거나 이동 버튼을 사용하십시오. 기록의 확인 시각이 아니라 사건 발생 시각이 기준입니다."
          />
          <div className="timeline-workspace">
            <div className="timeline-axis" />
            {timelineItems.map((item, index) => (
              <article
                key={item.id}
                className={classNames(
                  "timeline-record",
                  draggedTimelineId === item.id && "dragging",
                )}
                draggable={!timelineVerified}
                onDragStart={() => setDraggedTimelineId(item.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onTimelineDrop(item.id)}
              >
                <div className="timeline-order">{(index + 1).toString().padStart(2, "0")}</div>
                <time>{item.time}</time>
                <div>
                  <h2>{item.title}</h2>
                  <span>{item.source}</span>
                </div>
                <div className="timeline-move">
                  <button type="button" onClick={() => moveTimeline(index, -1)} disabled={timelineVerified}>위</button>
                  <button type="button" onClick={() => moveTimeline(index, 1)} disabled={timelineVerified}>아래</button>
                </div>
              </article>
            ))}
          </div>
          {timelineFeedback && (
            <p className={classNames("timeline-feedback", timelineVerified && "success")}>
              {timelineFeedback}
            </p>
          )}
          {!timelineVerified ? (
            <PrimaryButton onClick={verifyTimeline}>시간 일치 여부 분석</PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => go("evidence-board")}>증거 보드 열기</PrimaryButton>
          )}
        </section>
      )}

      {stage === "evidence-board" && (
        <section className="scene board-scene">
          <MissionHeading
            eyebrow="MISSION 04 · EVIDENCE CORRELATION BOARD"
            title="증거를 배치하고 연결 관계를 만드십시오."
            description="카드는 자유롭게 이동할 수 있습니다. 연결 이유를 설명할 수 있는 증거끼리 선을 만드십시오."
          />
          <div className="board-tools">
            <button
              type="button"
              className={linkMode ? "active" : ""}
              onClick={() => {
                setLinkMode((value) => !value);
                setLinkStart(null);
              }}
            >
              {linkMode ? "연결 모드 종료" : "연결선 만들기"}
            </button>
            <button type="button" onClick={() => setConnections([])}>연결선 초기화</button>
            <span>
              {linkMode
                ? linkStart
                  ? "두 번째 증거를 선택하십시오."
                  : "첫 번째 증거를 선택하십시오."
                : "카드를 끌어 사건 구조를 정리하십시오."}
            </span>
          </div>
          <div
            className="evidence-board"
            ref={boardRef}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={() => {
              dragRef.current = null;
            }}
            onPointerLeave={() => {
              dragRef.current = null;
            }}
          >
            <div className="board-label">CASE 017 · INTERNAL REVIEW ONLY</div>
            {connections.map(([from, to]) => (
              <span
                key={`${from}-${to}`}
                className="connection-line"
                style={connectionStyle(from, to)}
              />
            ))}
            {[...evidenceIds, "suspect-C"].map((id, index) => {
              const position = boardPositions[id] ?? { x: 10 + index * 8, y: 10 + index * 7 };
              const evidence = id === "suspect-C" ? null : EVIDENCE[id as EvidenceId];
              return (
                <button
                  type="button"
                  key={id}
                  className={classNames(
                    "board-node",
                    id === "suspect-C" && "suspect-node",
                    linkStart === id && "link-selected",
                  )}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  onPointerDown={(event) => handleBoardPointerDown(id, event)}
                  onClick={() => selectBoardNode(id)}
                >
                  <i aria-hidden="true" />
                  {evidence ? (
                    <>
                      <span>{evidence.code} · {evidence.type}</span>
                      <b>{evidence.title}</b>
                      <p>{evidence.detail}</p>
                    </>
                  ) : (
                    <>
                      <span>PERSON OF INTEREST</span>
                      <b>용의자 C · 박도윤</b>
                      <p>밝은 운동화 · 반사형 가방끈 · 장비 담당</p>
                    </>
                  )}
                </button>
              );
            })}
            <div className="board-question">
              <span>핵심 질문</span>
              <b>사진 속 인물과 18:47 CCTV 인물이 동일하다는 판단을 무엇이 뒷받침하는가?</b>
            </div>
          </div>
          <div className="board-confirm">
            <label>
              <input
                type="checkbox"
                checked={boardReady}
                onChange={(event) => setBoardReady(event.target.checked)}
              />
              <span>모둠원이 연결선마다 근거를 한 문장으로 설명했습니다.</span>
            </label>
            <small>권장: 최소 3개의 연결선을 만든 뒤 결론 단계로 이동하십시오.</small>
          </div>
          <PrimaryButton
            onClick={() => go("report")}
            disabled={!boardReady || connections.length < 3}
          >
            최종 수사보고서 작성
          </PrimaryButton>
        </section>
      )}

      {stage === "report" && (
        <section className="scene report-scene">
          <MissionHeading
            eyebrow="FINAL REPORT · CASE 017"
            title="증거가 말하는 사건을 설명하십시오."
            description="인물을 고르는 것보다 왜 그렇게 판단했는지 증거의 연결을 기록하는 것이 중요합니다."
          />
          <div className="report-document">
            <div className="report-header">
              <div>
                <span>DIGITAL FORENSIC EXAMINATION REPORT</span>
                <h2>최종 수사보고서</h2>
              </div>
              <strong>CASE 017</strong>
            </div>
            <section className="report-section">
              <span className="report-number">01</span>
              <div>
                <h3>의심 인물</h3>
                <div className="suspect-options">
                  {SUSPECTS.map((item) => (
                    <label key={item.id} className={suspect === item.id ? "selected" : ""}>
                      <input
                        type="radio"
                        name="suspect"
                        value={item.id}
                        checked={suspect === item.id}
                        onChange={() => setSuspect(item.id)}
                      />
                      <b>용의자 {item.id} · {item.name}</b>
                      <span>{item.role}</span>
                      <small>{item.note}</small>
                    </label>
                  ))}
                </div>
              </div>
            </section>
            <section className="report-section">
              <span className="report-number">02</span>
              <div>
                <h3>결정적 증거 3개 이상 선택</h3>
                <div className="report-evidence-list">
                  {evidenceIds.map((id) => {
                    const item = EVIDENCE[id];
                    const checked = reportEvidence.includes(id);
                    return (
                      <label key={id} className={checked ? "selected" : ""}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setReportEvidence((current) =>
                              checked ? current.filter((value) => value !== id) : [...current, id],
                            )
                          }
                        />
                        <span>{item.code}</span>
                        <b>{item.title}</b>
                        <small>{item.detail}</small>
                      </label>
                    );
                  })}
                </div>
              </div>
            </section>
            <section className="report-section">
              <span className="report-number">03</span>
              <div>
                <h3>사건 발생 순서</h3>
                <div className="report-timeline">
                  {CORRECT_TIMELINE.map((item) => (
                    <span key={item.id}><time>{item.time}</time>{item.title}</span>
                  ))}
                </div>
              </div>
            </section>
            <section className="report-section">
              <span className="report-number">04</span>
              <div>
                <label htmlFor="rationale">나의 판단 근거</label>
                <textarea
                  id="rationale"
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                  placeholder="사진, 시간, 통신기록이 서로 어떻게 연결되는지 근거를 작성하십시오."
                  rows={5}
                />
                <small>{rationale.trim().length}자 · 권장 80자 이상</small>
              </div>
            </section>
            <div className="integrity-declaration">
              이 결론은 수업용 가상 증거에 대한 분석 결과이며, 단일 자료가 아닌 교차검증을 바탕으로 작성되었습니다.
            </div>
          </div>
          {reportError && <p className="error-message report-error">{reportError}</p>}
          <PrimaryButton tone="amber" onClick={submitReport}>수사 결론 봉인 및 제출</PrimaryButton>
        </section>
      )}

      {stage === "reconstruction" && (
        <section className="scene reconstruction-scene">
          <div className="reconstruction-title">
            <span>CASE REVIEW · EVIDENCE-BASED RECONSTRUCTION</span>
            <h1>제출한 증거로 사건을 다시 재생합니다.</h1>
          </div>
          <div className="reconstruction-stage">
            <div className="reconstruction-visual">
              <img src="/assets/cctv-hallway.png" alt="사건이 발생한 행사실 복도" />
              {reconstructionBeat >= 1 && reconstructionBeat < 6 && (
                <img
                  className={classNames("reconstruction-person", reconstructionBeat >= 5 && "identified")}
                  src={reconstructionBeat === 1 ? "/assets/cctv-person-a.png" : "/assets/cctv-person-c.png"}
                  alt="사건 재구성 속 인물"
                />
              )}
              <div className="reconstruction-overlay">
                <time>{CORRECT_TIMELINE[Math.min(reconstructionBeat, 5)]?.time}</time>
                <span>RECONSTRUCTION {reconstructionBeat + 1}/7</span>
              </div>
            </div>
            <div className="reconstruction-log">
              {[
                ["18:32:14", "CCTV", "지원이 모금함을 행사실에 보관한 뒤 복도를 떠났습니다."],
                ["18:40:52", "MESSAGE", "도윤은 모금함이 행사실 앞에 있다는 사실을 확인했습니다."],
                ["18:42:17", "PHOTO", "목격 사진에 검은 후드, 밝은 운동화, 반사형 가방끈이 기록됐습니다."],
                ["18:43:06", "FILE SYSTEM", "곧이어 IMG_2048.jpg의 삭제 흔적이 생성됐습니다."],
                ["18:44:12", "CALL + LOCATION", "목격자와 통화가 있었고, 동시에 민수는 체육관에 있었습니다."],
                ["18:47:03", "CCTV FRAME", "사진과 같은 작은 특징을 가진 도윤이 행사실 방향으로 진입했습니다."],
              ].map(([time, type, copy], index) => (
                <div key={time} className={reconstructionBeat >= index ? "active" : ""}>
                  <time>{time}</time>
                  <span>{type}</span>
                  <p>{copy}</p>
                </div>
              ))}
            </div>
          </div>
          {reconstructionBeat >= 6 && (
            reportIsValid ? (
              <div className="case-resolved">
                <span>CASE RECONSTRUCTION COMPLETE</span>
                <h2>실제 사건은 이렇게 일어났습니다.</h2>
                <p>
                  박도윤은 행사실 위치를 메시지로 확인한 뒤 현장에 접근했고, 목격 사진 삭제에
                  관여한 후 모금함을 행사실 밖으로 무단 반출했습니다. 사진의 작은 특징,
                  메타데이터, CCTV, 메시지와 통화 기록이 같은 시간 흐름을 가리킵니다.
                </p>
                <strong>결론의 핵심은 인상착의 하나가 아니라 서로 독립된 증거의 일치입니다.</strong>
                <PrimaryButton onClick={() => go("career")}>수사 감정 결과 확인</PrimaryButton>
              </div>
            ) : (
              <div className="case-conflict">
                <span>CONCLUSION ON HOLD</span>
                <h2>선택한 결론과 증거 사이에 설명되지 않은 충돌이 있습니다.</h2>
                <p>
                  검은 후드만으로 인물을 특정할 수 없습니다. 위치 기록, 사진의 작은 특징,
                  CCTV 시각, 통신 기록을 다시 연결하십시오.
                </p>
                <PrimaryButton tone="red" onClick={() => go("evidence-board")}>
                  증거 보드 재분석
                </PrimaryButton>
              </div>
            )
          )}
        </section>
      )}

      {stage === "career" && (
        <section className="scene career-scene">
          <div className="career-hero">
            <span>CASE 017 · CLOSED</span>
            <h1>방금 여러분이 한 일이<br />디지털 포렌식 수사관의 일입니다.</h1>
            <p>
              삭제 파일 하나를 찾은 것이 아니라 여러 디지털 흔적의 시간을 맞추고,
              서로 검증해 과거의 사건을 재구성했습니다.
            </p>
          </div>
          <div className="career-process">
            {[
              ["01", "증거 보존", "원본을 바꾸지 않고 증거물과 취급 과정을 기록"],
              ["02", "데이터 획득", "허가받은 범위에서 분석 가능한 자료를 확보"],
              ["03", "흔적 분석", "삭제 파일, 로그, 메타데이터, 프레임을 확인"],
              ["04", "교차검증", "서로 다른 기록의 시간과 내용을 비교"],
              ["05", "결과 작성", "확인한 사실과 한계를 이해하기 쉽게 설명"],
            ].map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span>
                <h2>{title}</h2>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <div className="career-debrief">
            <div>
              <span>CORE SKILLS</span>
              <h2>필요한 역량</h2>
              <p>관찰력 · 논리적 추론 · 컴퓨터 이해 · 기록 습관 · 협업 · 설명하는 힘</p>
            </div>
            <div>
              <span>RELATED CAREERS</span>
              <h2>연결되는 진로</h2>
              <p>디지털 포렌식 분석가 · 사이버수사관 · 침해사고 대응가 · 정보보안 컨설턴트</p>
            </div>
          </div>
          <div className="ethics-manifesto">
            <span>FORENSIC ETHICS</span>
            <h2>볼 수 있다고, 봐도 되는 것은 아닙니다.</h2>
            <div>
              <p>허가받은 수업용 기기와 자료만 조사한다.</p>
              <p>복구 가능성과 증거 가치를 구분한다.</p>
              <p>개인정보를 필요한 범위 이상 열람하지 않는다.</p>
              <p>빠른 결론보다 정확한 절차와 기록을 우선한다.</p>
            </div>
          </div>
          <div className="completion-badge">
            <span>DIGITAL FORENSICS LAB</span>
            <strong>CASE 017 INVESTIGATION COMPLETE</strong>
            <p>{groupId} · 확보 증거 {evidenceIds.length}건 · 타임라인 검증 완료</p>
          </div>
        </section>
      )}
    </main>
  );
}
