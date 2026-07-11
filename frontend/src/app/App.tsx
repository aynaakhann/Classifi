import { useState, useRef, useCallback, useEffect } from "react";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard,
  Plus,
  Zap,
  ChevronRight,
  X,
  Upload,
  FileText,
  Image,
  Copy,
  Check,
  ArrowRight,
  Trash2,
  Code2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import exampleImage from "../imports/image-2.png";
import exampleImage2 from "../imports/image-3.png";
import exampleImage3 from "../imports/image-4.png";
import iLikeItImage from "../imports/I_like_it.png";
import image1 from "../imports/image-1.png";
import imageMain from "../imports/image.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = "dashboard" | "create" | "examples" | "classify" | "api";

interface Category {
  id: string;
  name: string;
  examples: string[];
}

interface Classifier {
  id: string;
  name: string;
  categories: Category[];
  lastUsed: string;
  createdAt: string;
}

interface ClassifyResult {
  label: string;
  confidence: number;
  explanation: string;
  alternatives: { label: string; confidence: number }[];
}

const BACKEND_URL = "http://127.0.0.1:8000";
const STORAGE_KEY = "classifi:classifiers";

function loadSavedClassifiers(): Classifier[] {
  if (typeof window === "undefined") return MOCK_CLASSIFIERS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return MOCK_CLASSIFIERS;
    return JSON.parse(stored) as Classifier[];
  } catch {
    return MOCK_CLASSIFIERS;
  }
}

async function runRealClassify(input: string, inputImageUrl: string | null, classifier: Classifier): Promise<ClassifyResult> {
  const formattedExamples = classifier.categories.flatMap(cat =>
    cat.examples.map(ex => {
      const isImage = ex.startsWith("[image]");
      let text = null;
      let image_url = null;
      if (isImage) {
        if (ex.includes(";data=")) {
          image_url = ex.split(";data=")[1];
        } else {
          image_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        }
      } else {
        text = ex;
      }
      return {
        label: cat.name,
        text,
        image_url
      };
    })
  );

  const classes = classifier.categories.map(c => c.name);

  try {
    // Send the locally persisted classifier definition with every request.
    // Backend storage is intentionally in-memory, so a saved backend ID can
    // become stale whenever the API server restarts.
    const payload = {
      classes,
      examples: formattedExamples,
      input: inputImageUrl ? null : input,
      input_image_url: inputImageUrl
    };

    const res = await fetch(`${BACKEND_URL}/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${res.status}`);
    }

    const data = await res.json();
    return {
      label: data.label,
      confidence: data.confidence,
      explanation: data.explanation,
      alternatives: []
    };
  } catch (err: any) {
    console.error("Classification failed:", err);
    return {
      label: "Error",
      confidence: 0.0,
      explanation: `Failed to connect to backend: ${err.message}`,
      alternatives: []
    };
  }
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_CLASSIFIERS: Classifier[] = [
  {
    id: "1",
    name: "Sentiment Analyzer",
    categories: [
      { id: "1a", name: "Positive", examples: ["Great product!", "Love it", "Amazing quality"] },
      { id: "1b", name: "Negative", examples: ["Terrible experience", "Don't buy this", "Waste of money"] },
      { id: "1c", name: "Neutral", examples: ["It arrived on time", "Standard packaging", "Works as expected"] },
    ],
    lastUsed: "2 hours ago",
    createdAt: "2025-07-07",
  },
  {
    id: "2",
    name: "Support Ticket Router",
    categories: [
      { id: "2a", name: "Billing", examples: ["Charge on my card", "Invoice question", "Refund request"] },
      { id: "2b", name: "Technical", examples: ["App won't load", "API returning errors", "Login broken"] },
    ],
    lastUsed: "Yesterday",
    createdAt: "2025-07-05",
  },
  {
    id: "3",
    name: "Content Moderation",
    categories: [
      { id: "3a", name: "Safe", examples: ["Great discussion", "Thanks for sharing", "Interesting perspective"] },
      { id: "3b", name: "Spam", examples: ["Click here to win", "Buy now limited offer", "Free gift just for you"] },
      { id: "3c", name: "Harmful", examples: [] },
    ],
    lastUsed: "3 days ago",
    createdAt: "2025-07-02",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function mockClassify(input: string, classifier: Classifier): Promise<ClassifyResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const cats = classifier.categories;
      const primary = cats[Math.floor(Math.random() * cats.length)];
      const confidence = 0.72 + Math.random() * 0.25;
      const alternatives = cats
        .filter((c) => c.id !== primary.id)
        .map((c) => ({ label: c.name, confidence: parseFloat(((1 - confidence) / (cats.length - 1) * (0.8 + Math.random() * 0.4)).toFixed(2)) }));
      resolve({
        label: primary.name,
        confidence: parseFloat(confidence.toFixed(2)),
        explanation: `The input "${input.slice(0, 40)}${input.length > 40 ? "…" : ""}" closely matches patterns found in the "${primary.name}" category. Key signals include vocabulary and semantic structure similar to your labeled examples. The classifier is ${Math.round(confidence * 100)}% confident based on few-shot inference across ${cats.reduce((s, c) => s + c.examples.length, 0)} labeled examples.`,
        alternatives,
      });
    }, 1200);
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-10 flex-none flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left relative overflow-hidden ${active
          ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
    >
      {active && (
        <>
          {/* Active indicator bar */}
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full bg-primary"
            style={{ boxShadow: "0 0 8px 1px rgba(99, 102, 241, 0.5)" }}
          />
        </>
      )}
      <Icon size={15} className={active ? "text-primary relative z-10" : "text-muted-foreground"} />
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function Badge({
  children,
  color = "primary",
  interactive = false,
  onClick,
}: {
  children: React.ReactNode;
  color?: "primary" | "success" | "warning" | "muted";
  interactive?: boolean;
  onClick?: () => void;
}) {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    muted: "bg-muted text-muted-foreground border-border",
  };
  const interactiveStyles = interactive
    ? "cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30 active:scale-95 transition-all duration-100"
    : "";
  const Tag = onClick || interactive ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono select-none ${colors[color]} ${interactiveStyles}`}
    >
      {children}
    </Tag>
  );
}

function GlassCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl backdrop-blur-sm bg-card border border-border ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        transition: "all 0.2s ease",
      }}
      onMouseEnter={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px) scale(1.01)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 30px rgba(99, 102, 241, 0.15)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(99, 102, 241, 0.3)";
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "";
      } : undefined}
    >
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 font-semibold rounded-xl bg-slate-950 text-white transition-all duration-150 active:scale-[0.98] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 ${sizes[size]} ${className}`}
    >
      {loading && (
        <span className="flex items-center gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="rounded-full"
              style={{
                width: "3px", height: "3px",
                background: "currentColor",
                animation: `thinkingPulse 1.2s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </span>
      )}
      {children}
    </button>
  );
}

function ThinkingPulse({ size = "md", label = "Classifying…" }: { size?: "sm" | "md"; label?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center gap-[4px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full bg-primary"
            style={{
              width: size === "sm" ? "4px" : "5px",
              height: size === "sm" ? "4px" : "5px",
              boxShadow: "0 0 4px rgba(99, 102, 241, 0.7)",
              animation: `thinkingPulse 1.2s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
      {label && (
        <span
          className="font-mono text-muted-foreground"
          style={{
            fontSize: size === "sm" ? "10px" : "11px",
            animation: "thinkingFade 1.2s ease-in-out infinite",
          }}
        >
          {label}
        </span>
      )}
      <style>{`
        @keyframes thinkingPulse {
          0%, 100% { opacity: 0.2; transform: scaleY(0.6); }
          50%       { opacity: 1;   transform: scaleY(1.2); }
        }
        @keyframes thinkingFade {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function PulseDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center flex-shrink-0 ${className}`}>
      {/* ping ring — expands + fades on loop */}
      <span
        className="absolute inline-flex rounded-full animate-ping bg-primary/35"
        style={{
          width: "10px",
          height: "10px",
          animationDuration: "1.6s",
        }}
      />
      {/* solid core */}
      <span
        className="relative inline-flex rounded-full bg-primary"
        style={{
          width: "6px",
          height: "6px",
          boxShadow: "0 0 6px 2px rgba(99, 102, 241, 0.5)",
        }}
      />
    </span>
  );
}

function GhostButton({
  children,
  onClick,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 font-medium rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-150 active:scale-[0.98] ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  className = "",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all duration-150 ${className}`}
    />
  );
}

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-primary" : i === step ? "bg-primary/40" : "bg-secondary"
            }`}
        />
      ))}
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

// Shared debounce hook for live classification
function useLiveClassify(classifier: Classifier | undefined, input: string, delay = 680) {
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [inferring, setInferring] = useState(false);
  const [visible, setVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runId = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!input.trim() || !classifier) {
      setResult(null); setVisible(false); setInferring(false);
      return;
    }
    setInferring(true); setVisible(false);
    const id = ++runId.current;
    debounceRef.current = setTimeout(async () => {
      const r = await runRealClassify(input, null, classifier);
      if (runId.current !== id) return;
      setResult(r); setInferring(false);
      requestAnimationFrame(() => setVisible(true));
    }, delay);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, classifier?.id]);

  return { result, inferring, visible };
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function HeroSection({ classifiers, onCreate }: { classifiers: Classifier[]; onCreate: () => void }) {
  const [text, setText] = useState("");
  const [selectedId, setSelectedId] = useState(classifiers[0]?.id ?? "");
  const selected = classifiers.find((c) => c.id === selectedId) ?? classifiers[0];
  const { result, inferring, visible } = useLiveClassify(selected, text, 200);
  const [focused, setFocused] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const classifierSuggestions = selected?.categories
    .flatMap((category) => category.examples)
    .filter((example) => example.trim() && !example.startsWith("[image]")) ?? [];
  const fallbackSuggestions = [
    "This product is amazing!",
    "I need help with my invoice",
    "Click here to claim your prize",
  ];
  const availableSuggestions = classifierSuggestions.length > 0 ? classifierSuggestions : fallbackSuggestions;
  const currentSuggestion = availableSuggestions[suggestionIndex % availableSuggestions.length];

  useEffect(() => {
    setSuggestionIndex(0);
    const interval = window.setInterval(() => {
      setSuggestionIndex((current) => (current + 1) % availableSuggestions.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [selectedId, availableSuggestions.length]);

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 pt-20 sm:pt-10 pb-6 sm:pb-8 overflow-hidden">
      {/* Ambient glow orb behind heading */}
      <div
        className="absolute top-0 left-1/3 w-96 h-40 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(99, 102, 241, 0.1) 0%, transparent 70%)", filter: "blur(20px)" }}
      />

      <div className="relative">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-4">
          <PulseDot />
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">No training required</span>
        </div>

        {/* Headline + CTA row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4 sm:gap-6">
          <div>
            <h1 className="text-3xl sm:text-[32px] font-semibold text-foreground leading-[1.15] tracking-[-0.025em]">
              Build a classifier<br />
              <span style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>
                in seconds
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
              Just examples → instant predictions. No model training, no setup.
            </p>
          </div>
          <div className="hidden lg:block w-[140px]" />
        </div>

        {/* 56px live input bar */}
        {classifiers.length > 0 && (
          <div className="relative">
            <div
              className="flex flex-wrap lg:flex-nowrap items-center w-full rounded-2xl px-4 sm:px-5 py-3 gap-y-2 transition-all duration-250 bg-card"
              style={{
                minHeight: "56px",
                border: focused || text.trim()
                  ? "1px solid rgba(99, 102, 241, 0.5)"
                  : "1px solid rgba(34, 43, 61, 1)",
                boxShadow: focused || text.trim()
                  ? "0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 24px rgba(0,0,0,0.3)"
                  : "0 2px 12px rgba(0,0,0,0.2)",
              }}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mr-3 w-5 flex items-center justify-center">
                {inferring
                  ? <ThinkingPulse size="sm" label="" />
                  : <Zap size={16} className={text.trim() || focused ? "text-primary" : "text-muted-foreground"} style={text.trim() ? { filter: "drop-shadow(0 0 4px rgba(99, 102, 241, 0.5))" } : {}} />
                }
              </div>

              {/* Input */}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Type something to test your classifiers…"
                className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-0 h-full"
              />

              {/* Inline result — slides in from right */}
              <div
                className="order-3 sm:order-none w-full sm:w-auto flex-shrink-0 flex items-center gap-2.5 sm:ml-3 transition-all duration-300"
                style={{ opacity: visible && result ? 1 : 0, transform: visible && result ? "translateX(0)" : "translateX(8px)", pointerEvents: result ? "auto" : "none" }}
              >
                {result && (
                  <>
                    <PulseDot />
                    <span className="text-xs text-muted-foreground font-mono">→</span>
                    <span
                      className="text-sm font-bold font-mono text-primary"
                      style={{ textShadow: "0 0 12px rgba(99, 102, 241, 0.4)" }}
                    >
                      {result.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setText(currentSuggestion)}
                className="order-4 lg:order-none hidden sm:block w-full lg:w-auto lg:max-w-[320px] lg:flex-[0_1_320px] min-w-0 lg:ml-4 text-left lg:text-right whitespace-normal break-words text-[11px] leading-4 text-muted-foreground/60 hover:text-primary transition-colors"
                title={`Try: ${currentSuggestion}`}
              >
                Try: “{currentSuggestion}”
              </button>

              {/* Classifier picker */}
              <div className="flex-shrink-0 ml-2 sm:ml-4 pl-2 sm:pl-4 min-h-6 flex items-center border-l border-border max-w-[42%] lg:max-w-[220px]">
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full min-w-0 max-w-full overflow-hidden text-ellipsis bg-transparent text-[10px] xl:text-[11px] text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer transition-colors appearance-none"
                  style={{ backgroundImage: "none" }}
                >
                  {classifiers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom hairline glow when active */}
            {(focused || text.trim()) && (
              <div
                className="absolute bottom-0 left-8 right-8 h-px pointer-events-none"
                style={{ background: "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)" }}
              />
            )}
          </div>
        )}
      </div>

      {/* Section separator */}
      <div className="mt-8 border-b border-border/30" />
    </div>
  );
}

// ── Featured Panel ────────────────────────────────────────────────────────────

function FeaturedClassifierCard({ classifier, onOpen }: { classifier: Classifier; onOpen: () => void }) {
  const [input, setInput] = useState("");
  const [inferring, setInferring] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);

  // Staggered reveal flags
  const [showLabel, setShowLabel] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number>(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runId = useRef(0);

  const totalExamples = classifier.categories.reduce((s, c) => s + c.examples.length, 0);
  const catColors = ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"];

  // Split explanation into reveal-able lines
  const explanationLines = result
    ? (() => {
      const cat = classifier.categories.find((c) => c.name === result.label);
      const ex0 = cat?.examples[0];
      const ex1 = cat?.examples[1];
      return [
        `→ Matched category: ${result.label} (${Math.round(result.confidence * 100)}% confidence)`,
        ex0 ? `→ Semantically close to: "${ex0.slice(0, 36)}${ex0.length > 36 ? "…" : ""}"` : null,
        ex1 ? `→ Also similar to: "${ex1.slice(0, 32)}${ex1.length > 32 ? "…" : ""}"` : null,
        result.alternatives.length > 0
          ? `→ Runner-up: ${result.alternatives[0].label} (${Math.round(result.alternatives[0].confidence * 100)}%)`
          : null,
      ].filter(Boolean) as string[];
    })()
    : [];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Reset all reveal state on new input
    setResult(null);
    setShowLabel(false);
    setShowBar(false);
    setBarWidth(0);
    setVisibleLines(0);

    if (!input.trim()) { setInferring(false); return; }

    setInferring(true);
    const id = ++runId.current;

    debounceRef.current = setTimeout(async () => {
      const r = await runRealClassify(input, null, classifier);
      if (runId.current !== id) return;

      setResult(r);
      setInferring(false);

      // Step 1 — label pops in immediately
      requestAnimationFrame(() => setShowLabel(true));

      // Step 2 — bar overshoots then settles
      setTimeout(() => {
        setShowBar(true);
        // overshoot: cap at 98% so it never clips visually
        const overshoot = Math.min(r.confidence * 100 + 8, 98);
        setBarWidth(overshoot);
        // settle to actual value after the 0.6s ease-out completes
        setTimeout(() => setBarWidth(r.confidence * 100), 520);
      }, 180);

      // Step 3 — explanation lines stagger in, one per 200ms
      const lineCount = [
        `matched`,
        classifier.categories.find((c) => c.name === r.label)?.examples[0],
        classifier.categories.find((c) => c.name === r.label)?.examples[1],
        r.alternatives[0],
      ].filter(Boolean).length;
      for (let i = 1; i <= lineCount; i++) {
        setTimeout(() => setVisibleLines(i), 380 + i * 200);
      }
    }, 200);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, var(--color-secondary) 0%, var(--color-muted) 100%)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 0 40px rgba(99, 102, 241, 0.08), 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top accent stripe */}
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.5) 40%, rgba(99, 102, 241, 0.3) 70%, transparent 100%)" }} />

      <div className="p-6 lg:p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-[10px] font-mono font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ color: "var(--color-primary)", background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)" }}
              >
                Featured
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">· used {classifier.lastUsed}</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground leading-tight tracking-tight">{classifier.name}</h2>
            <p className="text-[11px] text-primary font-mono mt-1">
              {classifier.categories.length} classes · {totalExamples} labeled examples
            </p>
          </div>
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 text-xs font-semibold transition-all duration-150 px-3 py-1.5 rounded-lg"
            style={{ color: "var(--color-primary)", background: "rgba(99, 102, 241, 0.06)", border: "1px solid rgba(99, 102, 241, 0.15)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99, 102, 241, 0.12)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99, 102, 241, 0.06)"; }}
          >
            Open <ArrowRight size={11} />
          </button>
        </div>

        {/* Category tags — colored dots */}
        <div className="flex flex-wrap gap-2 mb-6">
          {classifier.categories.map((cat, i) => (
            <div
              key={cat.id}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: `${catColors[i % catColors.length]}10`,
                border: `1px solid ${catColors[i % catColors.length]}25`,
                color: catColors[i % catColors.length],
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: catColors[i % catColors.length] }} />
              {cat.name}
              <span className="opacity-50 font-mono text-[10px]">{cat.examples.length}</span>
            </div>
          ))}
        </div>

        {/* Split: input left, output right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Live test input */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-widest mb-1">Live Test</p>
            <div
              className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all duration-200"
              style={{
                background: "rgba(var(--color-background), 0.7)",
                border: input.trim() ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(255,255,255,0.05)",
                boxShadow: input.trim() ? "0 0 0 2px rgba(99, 102, 241, 0.04)" : "none",
              }}
            >
              {inferring
                ? <ThinkingPulse size="sm" label="" />
                : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: input.trim() ? "var(--color-primary)" : "var(--color-muted)" }} />
              }
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`"${classifier.categories[0]?.examples[0] ?? "This product is excellent"}"…`}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none italic"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">Results appear as you type</p>
          </div>

          {/* Output panel */}
          <div
            className="rounded-xl p-4 flex flex-col gap-3 transition-all duration-400"
            style={{
              minHeight: "130px",
              background: showLabel ? "rgba(99, 102, 241, 0.03)" : "var(--color-muted)",
              border: showLabel ? "1px solid rgba(99, 102, 241, 0.1)" : "1px solid var(--color-border)",
            }}
          >
            {/* Idle state */}
            {!result && !inferring && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[11px] text-muted-foreground/40 font-mono italic">awaiting input…</p>
              </div>
            )}

            {/* Inferring — thinking pulse */}
            {inferring && (
              <div className="flex-1 flex items-center">
                <ThinkingPulse />
              </div>
            )}

            {/* Step 1 — Label */}
            {result && (
              <div
                className="flex items-center gap-2 transition-all duration-300"
                style={{ opacity: showLabel ? 1 : 0, transform: showLabel ? "translateY(0)" : "translateY(5px)" }}
              >
                <PulseDot />
                <span
                  className="text-base font-bold font-mono"
                  style={{ color: "var(--color-primary)", textShadow: showLabel ? "0 0 16px rgba(99, 102, 241, 0.35)" : "none" }}
                >
                  {result.label}
                </span>
                <span className="text-xs text-primary font-mono">{Math.round(result.confidence * 100)}%</span>
              </div>
            )}

            {/* Step 2 — Confidence bar grows left → right */}
            {result && (
              <div
                className="transition-all duration-300"
                style={{ opacity: showLabel ? 1 : 0 }}
              >
                <div className="h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div
                    className="h-full rounded-full ease-out"
                    style={{
                      width: showBar ? `${barWidth}%` : "0%",
                      transition: showBar ? "width 0.6s ease-out" : "none",
                      background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                      boxShadow: "0 0 6px rgba(99, 102, 241, 0.5)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Step 3 — Explanation lines, staggered "AI thinking" reveal */}
            {result && explanationLines.length > 0 && (
              <div className="flex flex-col gap-1 mt-0.5">
                {explanationLines.map((line, i) => {
                  const fadeDuration = 200;           // ms — all lines same fade speed
                  const lineDelay = i === 0 ? 0 : i === 1 ? 300 : i === 2 ? 400 : 500;
                  const shown = visibleLines > i;
                  return (
                    <p
                      key={i}
                      className="text-[11px] font-mono leading-snug"
                      style={{
                        color: i === 0 ? "var(--color-primary)" : "var(--color-accent)",
                        opacity: shown ? 1 : 0,
                        transform: shown ? "translateY(0)" : "translateY(3px)",
                        transition: shown
                          ? `opacity ${fadeDuration}ms ease ${lineDelay}ms, transform ${fadeDuration}ms ease ${lineDelay}ms`
                          : "none",
                      }}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Secondary Cards ───────────────────────────────────────────────────────────

function SecondaryClassifierCard({ classifier, onOpen, wide }: { classifier: Classifier; onOpen: () => void; wide?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const totalExamples = classifier.categories.reduce((s, c) => s + c.examples.length, 0);
  const catColors = ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B"];

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group h-48 rounded-3xl p-5 flex flex-col gap-3 cursor-pointer transition-all duration-250"
      style={{
        background: "var(--color-card)",
        border: hovered ? "1px solid rgba(15, 23, 42, 0.12)" : "1px solid var(--color-border)",
        boxShadow: hovered ? "0 18px 38px rgba(15, 23, 42, 0.08)" : "0 10px 24px rgba(15, 23, 42, 0.06)",
        transform: hovered ? "translateY(-2px)" : "none",
        transition: "all 0.2s ease",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight">{classifier.name}</h3>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            {classifier.categories.length} classes · {totalExamples} examples
          </p>
        </div>
        <GripVertical
          size={16}
          className="flex-none text-muted-foreground/45 transition-colors group-hover:text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
        {classifier.categories.slice(0, wide ? 6 : 4).map((cat, i) => (
          <span
            key={cat.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono transition-all duration-150 cursor-pointer"
            style={{
              background: `${catColors[i % catColors.length]}08`,
              border: `1px solid ${catColors[i % catColors.length]}18`,
              color: `${catColors[i % catColors.length]}cc`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.background = `${catColors[i % catColors.length]}15`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.background = `${catColors[i % catColors.length]}08`; }}
          >
            {cat.name}
          </span>
        ))}
        {classifier.categories.length > (wide ? 6 : 4) && (
          <span className="text-[10px] text-muted-foreground font-mono px-1">+{classifier.categories.length - (wide ? 6 : 4)}</span>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-2.5 mt-auto"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <span className="text-[10px] text-muted-foreground font-mono">Used {classifier.lastUsed}</span>
        <span
          className="text-xs flex items-center gap-1 font-semibold transition-colors duration-150"
          style={{ color: hovered ? "var(--color-primary)" : "var(--color-accent)" }}
        >
          Open <ArrowRight size={10} />
        </span>
      </div>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

function DashboardPage({
  classifiers,
  onSelect,
  onCreate,
  onReorder,
}: {
  classifiers: Classifier[];
  onSelect: (c: Classifier) => void;
  onCreate: () => void;
  onReorder: (classifiers: Classifier[]) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const moveClassifier = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIndex = classifiers.findIndex((classifier) => classifier.id === sourceId);
    const targetIndex = classifiers.findIndex((classifier) => classifier.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const reordered = [...classifiers];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onReorder(reordered);
  };

  const moveByOffset = (classifierId: string, offset: number) => {
    const sourceIndex = classifiers.findIndex((classifier) => classifier.id === classifierId);
    const targetIndex = Math.max(0, Math.min(classifiers.length - 1, sourceIndex + offset));
    if (sourceIndex < 0 || sourceIndex === targetIndex) return;
    moveClassifier(classifierId, classifiers[targetIndex].id);
  };

  return (
    <div className="flex flex-col h-full">
      <HeroSection classifiers={classifiers} onCreate={onCreate} />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        {classifiers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Sparkles size={36} className="text-primary/30" />
            <p className="text-sm text-muted-foreground">No classifiers yet.</p>
            <PrimaryButton onClick={onCreate}><Plus size={14} /> Create your first</PrimaryButton>
          </div>
        ) : (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">

            {/* Featured — full width */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <button
                onClick={onCreate}
                className="group h-48 p-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-left text-slate-700 hover:border-slate-400 hover:bg-slate-100 transition-all duration-200"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-slate-900 text-white mb-4">
                  <Plus size={18} />
                </div>
                <h3 className="text-base font-semibold">Create a new classifier</h3>
                <p className="text-sm text-slate-500 mt-2">Add more classifiers and manage them from the dashboard.</p>
              </button>
              {classifiers.map((classifier) => (
                <div
                  key={classifier.id}
                  draggable
                  tabIndex={0}
                  aria-label={`${classifier.name}. Draggable classifier card. Use Shift plus arrow keys to reorder.`}
                  title="Drag to reorder · Shift + arrow keys also work"
                  onDragStart={(event) => {
                    setDraggedId(classifier.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", classifier.id);
                  }}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    if (draggedId) moveClassifier(draggedId, classifier.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDraggedId(null);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                  onKeyDown={(event) => {
                    if (!event.shiftKey) return;
                    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                      event.preventDefault();
                      moveByOffset(classifier.id, -1);
                    }
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      moveByOffset(classifier.id, 1);
                    }
                  }}
                  className={`rounded-3xl outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${draggedId === classifier.id ? "opacity-55" : "opacity-100"}`}
                >
                  <SecondaryClassifierCard classifier={classifier} onOpen={() => onSelect(classifier)} />
                </div>
              ))}
            </div>


          </div>
        )}
      </div>
    </div>
  );
}

function CreatePage({
  onContinue,
  onBack,
}: {
  onContinue: (name: string, categories: string[]) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [categories, setCategories] = useState(["", ""]);

  const addCategory = () => setCategories([...categories, ""]);
  const removeCategory = (i: number) => {
    if (categories.length <= 2) return;
    setCategories(categories.filter((_, idx) => idx !== i));
  };
  const updateCategory = (i: number, v: string) => {
    const next = [...categories];
    next[i] = v;
    setCategories(next);
  };

  const canContinue = name.trim().length > 0 && categories.filter((c) => c.trim().length > 0).length >= 2;

  return (
    <div className="px-4 py-20 sm:p-8 max-w-xl mx-auto">
      <StepBar step={1} total={3} />

      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1 transition-colors">
        <ChevronRight size={12} className="rotate-180" /> Back
      </button>

      <h1 className="text-2xl font-semibold text-foreground mb-1">Create Classifier</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Name your classifier and define the categories it should predict.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Classifier Name
          </label>
          <Input
            value={name}
            onChange={setName}
            placeholder="e.g. Sentiment Analyzer"
            autoFocus
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Categories
            </label>
            <span className="text-xs text-muted-foreground font-mono">{categories.filter(c => c.trim()).length} defined</span>
          </div>

          <div className="space-y-2.5">
            {categories.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-mono text-muted-foreground">{i + 1}</span>
                </div>
                <Input
                  value={cat}
                  onChange={(v) => updateCategory(i, v)}
                  placeholder={`Category ${i + 1}`}
                  className="flex-1"
                />
                <button
                  onClick={() => removeCategory(i)}
                  disabled={categories.length <= 2}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addCategory}
            className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-cyan-300 transition-colors font-medium"
          >
            <Plus size={14} /> Add Category
          </button>
        </div>

        <PrimaryButton
          onClick={() => onContinue(name.trim(), categories.filter((c) => c.trim()))}
          disabled={!canContinue}
          size="lg"
          className="w-full justify-center mt-2"
        >
          Continue to Examples <ArrowRight size={16} />
        </PrimaryButton>
      </div>
    </div>
  );
}

function ExamplesPage({
  classifier,
  onFinish,
  onBack,
}: {
  classifier: Classifier;
  onFinish: (updated: Classifier) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<"text" | "image">("text");
  const [categories, setCategories] = useState<Category[]>(classifier.categories);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addExample = (catId: string) => {
    const val = inputs[catId]?.trim();
    if (!val) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, examples: [...c.examples, val] } : c
      )
    );
    setInputs((prev) => ({ ...prev, [catId]: "" }));
  };

  const removeExample = (catId: string, idx: number) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, examples: c.examples.filter((_, i) => i !== idx) } : c
      )
    );
  };

  const addImageExamples = async (catId: string, files: File[]) => {
    const promises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(`[image]name=${file.name};data=${reader.result as string}`);
        };
        reader.readAsDataURL(file);
      });
    });

    const base64Examples = await Promise.all(promises);

    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId
          ? { ...c, examples: [...c.examples, ...base64Examples] }
          : c
      )
    );
  };

  const handleFileDrop = useCallback(
    (catId: string, e: React.DragEvent) => {
      e.preventDefault();
      setDragging(null);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      addImageExamples(catId, files);
    },
    [categories]
  );

  const totalExamples = categories.reduce((s, c) => s + c.examples.length, 0);
  const readyToFinish = categories.every((c) => c.examples.length >= 1);

  return (
    <div className="px-4 py-20 sm:p-8 max-w-5xl mx-auto">
      <StepBar step={2} total={3} />

      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1 transition-colors">
        <ChevronRight size={12} className="rotate-180" /> Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{classifier.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {totalExamples} examples across {categories.length} classes
          </p>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 border border-border">
          <button
            onClick={() => setMode("text")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${mode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <FileText size={12} /> Text
          </button>
          <button
            onClick={() => setMode("image")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${mode === "image" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Image size={12} /> Image
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-6">
        Add 5–10 examples per category. No training — the AI learns instantly from your examples.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {categories.map((cat) => (
          <GlassCard key={cat.id} className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
              </div>
              <Badge color={cat.examples.length >= 5 ? "success" : cat.examples.length >= 2 ? "warning" : "muted"}>
                {cat.examples.length}/10
              </Badge>
            </div>

            {mode === "text" ? (
              <div className="flex gap-2">
                <input
                  value={inputs[cat.id] || ""}
                  onChange={(e) => setInputs((p) => ({ ...p, [cat.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addExample(cat.id)}
                  placeholder="Enter example… (Enter to add)"
                  className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                <button
                  onClick={() => addExample(cat.id)}
                  className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center flex-shrink-0"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={() => setDragging(cat.id)}
                onDragLeave={() => setDragging(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(cat.id, e)}
                onClick={() => fileRefs.current[cat.id]?.click()}
                className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 ${dragging === cat.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-secondary/50"
                  }`}
              >
                <Upload size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Drop images or click to upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={(el) => { fileRefs.current[cat.id] = el; }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) addImageExamples(cat.id, files);
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
              {cat.examples.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic py-1">No examples yet</p>
              ) : (
                cat.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 group bg-secondary/50 rounded-lg px-3 py-1.5"
                  >
                    {ex.startsWith("[image]") ? (
                      <Image size={10} className="text-primary flex-shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-xs text-foreground truncate flex-1">
                      {ex.startsWith("[image]")
                        ? (ex.includes(";data=") ? ex.split(";data=")[0].replace("[image]name=", "") : ex.replace("[image] ", ""))
                        : ex
                      }
                    </span>
                    <button
                      onClick={() => removeExample(cat.id, i)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      <PrimaryButton
        onClick={() => {
          onFinish({ ...classifier, categories });
          toast.success(`${classifier.name} saved — ready to classify!`);
        }}
        disabled={!readyToFinish}
        size="lg"
        className="mx-auto flex"
      >
        <Zap size={16} />
        Save & Start Classifying
      </PrimaryButton>
      {!readyToFinish && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Add at least 1 example per category to continue
        </p>
      )}
    </div>
  );
}

function ClassifyPage({ classifier }: { classifier: Classifier }) {
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [textInput, setTextInput] = useState("");
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClassifyResult | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canClassify = inputMode === "text" ? textInput.trim().length > 0 : imageName !== null;

  const handleFile = (file: File) => {
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const classify = async () => {
    setLoading(true);
    setResult(null);
    setShowWhy(false);
    const res = await runRealClassify(
      inputMode === "text" ? textInput : "",
      inputMode === "image" ? imageData : null,
      classifier
    );
    setResult(res);
    setLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  return (
    <div className="px-4 py-20 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">{classifier.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {classifier.categories.map((c) => (
            <Badge key={c.id} color="muted">{c.name}</Badge>
          ))}
          <span className="text-xs text-muted-foreground font-mono ml-1">
            · {classifier.categories.reduce((s, c) => s + c.examples.length, 0)} examples
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input panel */}
        <GlassCard className="p-4 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col xs:flex-row gap-3 xs:items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Input</h2>
            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1 border border-border">
              <button
                onClick={() => { setInputMode("text"); setImageName(null); setImageData(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inputMode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
              >
                <FileText size={11} /> Text
              </button>
              <button
                onClick={() => { setInputMode("image"); setTextInput(""); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${inputMode === "image" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
              >
                <Image size={11} /> Image
              </button>
            </div>
          </div>

          {inputMode === "text" ? (
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to classify…"
              rows={5}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
            />
          ) : (
            <div
              onDragEnter={() => setDragOver(true)}
              onDragLeave={() => setDragOver(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
            >
              {imageName ? (
                <>
                  <Image size={20} className="text-primary" />
                  <span className="text-xs text-foreground font-medium">{imageName}</span>
                  <span className="text-xs text-muted-foreground">Click to change</span>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Drop an image or click to upload</span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          )}

          <PrimaryButton onClick={classify} loading={loading} disabled={!canClassify} size="lg" className="w-full justify-center">
            <Zap size={15} />
            {loading ? "Classifying…" : "Classify"}
          </PrimaryButton>
        </GlassCard>

        {/* Output panel */}
        <GlassCard className="p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-foreground">Result</h2>

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
              <ThinkingPulse label="Analyzing…" />
            </div>
          )}

          {!loading && !result && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-8">
              <Sparkles size={32} className="text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Results will appear here</p>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-primary text-primary-foreground">
                  {result.label}
                </span>
                <Badge color={result.confidence > 0.85 ? "success" : result.confidence > 0.7 ? "warning" : "muted"}>
                  {Math.round(result.confidence * 100)}% confident
                </Badge>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground font-mono">Confidence</span>
                  <span className="text-xs font-mono text-foreground">{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              {result.alternatives.length > 0 && (
                <div className="space-y-1.5">
                  {result.alternatives.slice(0, 2).map((alt) => (
                    <div key={alt.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{alt.label}</span>
                        <span className="text-xs font-mono text-muted-foreground">{Math.round(alt.confidence * 100)}%</span>
                      </div>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-muted-foreground/30 rounded-full"
                          style={{ width: `${alt.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-secondary/60 rounded-xl p-4 border border-border">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base">💬</span>
                  <p className="text-xs text-foreground/80 leading-relaxed">{result.explanation}</p>
                </div>
              </div>

              <button
                onClick={() => setShowWhy(!showWhy)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-cyan-300 transition-colors font-medium"
              >
                {showWhy ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                Why this prediction?
              </button>

              {showWhy && (
                <div className="bg-secondary/40 rounded-xl p-4 border border-border text-xs text-muted-foreground leading-relaxed space-y-2">
                  <p>
                    <span className="text-foreground font-medium">Few-shot inference</span> — no model was trained. Classifi
                    sends your input along with your labeled examples directly to the LLM, which uses in-context learning to
                    determine the best match.
                  </p>
                  <p>
                    The model compared your input against {classifier.categories.reduce((s, c) => s + c.examples.length, 0)} examples across{" "}
                    {classifier.categories.length} categories and ranked them by semantic similarity.
                  </p>
                  <p>
                    <span className="text-foreground font-medium">Result:</span> &ldquo;{result.label}&rdquo; with{" "}
                    {Math.round(result.confidence * 100)}% confidence.
                  </p>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function APIPage({ classifier }: { classifier: Classifier }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const endpoint = `POST ${BACKEND_URL}/classifiers/${classifier.id}/classify`;
  const classifierId = classifier.id;

  const requestBody = JSON.stringify(
    {
      input: "This product exceeded my expectations!",
    },
    null,
    2
  );

  const responseBody = JSON.stringify(
    {
      label: classifier.categories[0]?.name ?? "Class A",
      confidence: 0.91,
      explanation: "The input closely matches labeled examples in this category.",
      engine: "amd-self-hosted"
    },
    null,
    2
  );

  const curlExample = `curl -X POST ${BACKEND_URL}/classifiers/${classifierId}/classify \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ input: "Your input text here" })}'`;

  return (
    <div className="px-4 py-20 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-foreground">API Access</h1>
          <Badge color="success">Live</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Integrate <span className="text-foreground font-medium">{classifier.name}</span> into your app with a single HTTP call.
        </p>
      </div>

      <div className="space-y-5">
        {/* Endpoint */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endpoint</span>
            <button
              onClick={() => copy("endpoint", endpoint)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copied === "endpoint" ? <Check size={12} /> : <Copy size={12} />}
              {copied === "endpoint" ? "Copied" : "Copy"}
            </button>
          </div>
          <code className="block overflow-x-auto whitespace-nowrap text-sm font-mono text-primary">{endpoint}</code>
        </GlassCard>

        {/* Request */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Body</span>
            <button
              onClick={() => copy("req", requestBody)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copied === "req" ? <Check size={12} /> : <Copy size={12} />}
              {copied === "req" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="text-xs font-mono text-foreground/80 bg-background rounded-xl p-4 overflow-x-auto leading-relaxed border border-border/50">
            {requestBody}
          </pre>
        </GlassCard>

        {/* Response */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response</span>
            <button
              onClick={() => copy("res", responseBody)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copied === "res" ? <Check size={12} /> : <Copy size={12} />}
              {copied === "res" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="text-xs font-mono text-foreground/80 bg-background rounded-xl p-4 overflow-x-auto leading-relaxed border border-border/50">
            <span className="text-green-400">// 200 OK{"\n"}</span>
            {responseBody}
          </pre>
        </GlassCard>

        {/* cURL */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Code2 size={12} /> cURL Example
            </span>
            <button
              onClick={() => copy("curl", curlExample)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {copied === "curl" ? <Check size={12} /> : <Copy size={12} />}
              {copied === "curl" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="text-xs font-mono text-foreground/80 bg-background rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all border border-border/50">
            {curlExample}
          </pre>
        </GlassCard>

        {/* Auth note */}
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <span className="text-amber-400 mt-0.5">⚠</span>
          <div>
            <p className="text-xs font-semibold text-amber-400 mb-0.5">Authentication Required</p>
            <p className="text-xs text-muted-foreground">
              Pass your API key as <code className="font-mono text-foreground/70">Authorization: Bearer YOUR_API_KEY</code> in the request headers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GPUMetricsPanel() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/gpu-metrics`);
        if (!res.ok) throw new Error("HTTP error");
        const data = await res.json();
        if (active) {
          setMetrics(data);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setMetrics({ available: false, engine: "unreachable" });
          setLoading(false);
        }
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground/60 font-mono">
        Checking inference engine...
      </div>
    );
  }

  const isSelfHosted = metrics?.available && metrics?.engine === "amd-self-hosted";
  const isBackendReachable = metrics?.engine !== "unreachable";

  return (
    <div className="mt-3 flex-none pt-3 border-t border-border/40">
      <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider mb-2 px-1">
        INFERENCE ENGINE
      </p>
      {isSelfHosted ? (
        <div className="px-3 py-2.5 rounded-lg space-y-2" style={{ background: "rgba(16, 185, 129, 0.04)", border: "1px solid rgba(16, 185, 129, 0.12)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-600 font-bold font-mono">● LIVE</span>
            <span className="text-[10px] text-muted-foreground font-mono">AMD MI300X</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <div className="bg-secondary/40 p-1.5 rounded border border-border/30 text-center">
              <p className="text-[9px] text-muted-foreground font-mono leading-none">Throughput</p>
              <p className="text-xs font-bold font-mono text-emerald-400 mt-1">{(metrics.tokens_per_sec ?? 0).toFixed(1)} t/s</p>
            </div>
            <div className="bg-secondary/40 p-1.5 rounded border border-border/30 text-center">
              <p className="text-[9px] text-muted-foreground font-mono leading-none">Queue (R/W)</p>
              <p className="text-xs font-bold font-mono text-emerald-400 mt-1">{metrics.requests_running}/{metrics.requests_waiting}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono mb-1">
              <span>GPU Cache</span>
              <span>{Math.round((metrics.gpu_cache_usage_pct ?? 0) * 100)}%</span>
            </div>
            <div className="h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((metrics.gpu_cache_usage_pct ?? 0) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ) : isBackendReachable ? (
        <div className="px-3 py-2.5 rounded-lg space-y-1.5" style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.18)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-600 font-bold font-mono">● ACTIVE</span>
            <span className="text-[10px] text-muted-foreground font-mono">Fireworks AI</span>
          </div>
          <p className="text-[9px] text-muted-foreground leading-normal font-mono">
            AMD Instinct-powered inference via the Fireworks AI API. Ready to classify text and images.
          </p>
        </div>
      ) : (
        <div className="px-3 py-2.5 rounded-lg space-y-1.5 border border-destructive/20 bg-destructive/[0.04]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-destructive font-bold font-mono">API UNAVAILABLE</span>
            <span className="text-[10px] text-muted-foreground font-mono">Retrying</span>
          </div>
          <p className="text-[9px] text-muted-foreground leading-normal font-mono">
            The Classifi API cannot be reached. Check the backend connection.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [classifiers, setClassifiers] = useState<Classifier[]>(() => loadSavedClassifiers());
  const [activeClassifier, setActiveClassifier] = useState<Classifier | null>(null);
  const [draftClassifier, setDraftClassifier] = useState<Classifier | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024
  );
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === "undefined" ? false : window.innerWidth < 1024
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(classifiers));
    } catch {
      // ignore storage failures
    }
  }, [classifiers]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const handleViewportChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
      setSidebarOpen(!event.matches);
    };
    handleViewportChange(media);
    media.addEventListener("change", handleViewportChange);
    return () => media.removeEventListener("change", handleViewportChange);
  }, []);

  const closeMobileSidebar = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const openClassifier = (c: Classifier) => {
    setActiveClassifier(c);
    setPage("classify");
    closeMobileSidebar();
  };

  const startCreate = () => {
    setDraftClassifier(null);
    setPage("create");
    closeMobileSidebar();
  };

  const handleCreateContinue = (name: string, cats: string[]) => {
    const draft: Classifier = {
      id: genId(),
      name,
      categories: cats.map((c) => ({ id: genId(), name: c, examples: [] })),
      lastUsed: "Just now",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setDraftClassifier(draft);
    setActiveClassifier(draft);
    setPage("examples");
  };

  const handleExamplesFinish = async (updated: Classifier) => {
    const formattedExamples = updated.categories.flatMap(cat =>
      cat.examples.map(ex => {
        const isImage = ex.startsWith("[image]");
        let text = null;
        let image_url = null;
        if (isImage) {
          if (ex.includes(";data=")) {
            image_url = ex.split(";data=")[1];
          } else {
            image_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
          }
        } else {
          text = ex;
        }
        return {
          label: cat.name,
          text,
          image_url
        };
      })
    );

    const payload = {
      name: updated.name,
      classes: updated.categories.map(c => c.name),
      examples: formattedExamples
    };

    const toastId = toast.loading("Publishing classifier to AMD cloud...");

    try {
      const res = await fetch(`${BACKEND_URL}/classifiers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      const published: Classifier = {
        ...updated,
        id: data.id
      };

      setClassifiers((prev) => {
        const exists = prev.find((c) => c.id === updated.id);
        const next = exists ? prev.map((c) => (c.id === updated.id ? published : c)) : [published, ...prev];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setActiveClassifier(published);
      toast.success(`${published.name} published — ready to classify!`, { id: toastId });
      setPage("classify");
    } catch (err: any) {
      console.error("Failed to publish classifier:", err);
      toast.error(`Failed to publish: ${err.message}. Saving locally.`, { id: toastId });
      
      setClassifiers((prev) => {
        const exists = prev.find((c) => c.id === updated.id);
        const next = exists ? prev.map((c) => (c.id === updated.id ? updated : c)) : [updated, ...prev];
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      setActiveClassifier(updated);
      setPage("classify");
    }
  };

  const navItems = [
    { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  ];

  const ensureActiveClassifier = () => {
    if (!activeClassifier) {
      toast.info(classifiers.length > 0 ? "Select a classifier first" : "Create a classifier first");
      return null;
    }
    return activeClassifier;
  };

  return (
    <div
      className="flex min-h-[100dvh] h-[100dvh] overflow-hidden bg-background"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Toaster
        theme="light"
        position="top-right"
        toastOptions={{
          className: "bg-card border border-border text-foreground",
        }}
      />

      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-shrink-0 flex-col border-r border-border/60 bg-sidebar shadow-2xl transition-[transform,width] duration-300 lg:relative lg:z-auto lg:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:overflow-hidden"
        }`}
        style={{ width: isMobile ? "min(19rem, 86vw)" : sidebarOpen ? "15rem" : "0" }}
      >
        <div className="px-5 pt-4 pb-0 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.14)",
              }}
            >
              <Zap size={18} strokeWidth={2.2} className="text-primary-foreground" />
            </div>
            <div className="min-w-0 flex flex-col justify-center gap-0.5">
              <span className="text-[17px] leading-5 font-bold text-foreground tracking-tight">Classifi</span>
              <p className="whitespace-nowrap text-[9px] leading-4 text-muted-foreground font-mono tracking-tight">
                No-code AI classifier
              </p>
            </div>
          </div>
        </div>

        {/* 32px gap then nav */}
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 mt-5 pb-3 flex flex-col gap-0.5">
    <p className="flex-none text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 px-1">Main</p>
    {navItems.map((item) => (
      <SidebarItem
        key={item.id}
        icon={item.icon}
        label={item.label}
        active={page === item.id}
        onClick={() => { setPage(item.id); closeMobileSidebar(); }}
      />
    ))}

          <SidebarItem
            icon={Plus}
            label="New Classifier"
            active={page === "create" || page === "examples"}
            onClick={startCreate}
          />

          <p className="flex-none text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-5 mb-2 px-1">Quick actions</p>
          <SidebarItem
            icon={Zap}
            label="Test Input"
            active={page === "classify" || page === "api"}
            onClick={() => {
              const classifier = ensureActiveClassifier();
              if (classifier) {
                setPage("classify");
                closeMobileSidebar();
              }
            }}
          />
          {classifiers.length > 0 && (
            <div className="mt-3 flex-none pt-3 border-t border-border/40">
              <label htmlFor="sidebar-classifier" className="block text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider mb-1.5 px-1">
                Active classifier
              </label>
              <div className="relative rounded-xl border border-primary/20 bg-primary/[0.04] transition-colors hover:border-primary/40 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
                <select
                  id="sidebar-classifier"
                  value={activeClassifier?.id ?? ""}
                  onChange={(event) => {
                    if (!event.target.value) {
                      setActiveClassifier(null);
                      setPage("dashboard");
                      closeMobileSidebar();
                      return;
                    }
                    const selected = classifiers.find((classifier) => classifier.id === event.target.value);
                    if (selected) openClassifier(selected);
                  }}
                  className="block w-full min-w-0 cursor-pointer appearance-none overflow-hidden text-ellipsis bg-transparent py-2.5 pl-3 pr-8 text-[10px] leading-4 font-medium text-foreground outline-none sm:text-[11px]"
                  aria-label="Change active classifier"
                  title={activeClassifier?.name ?? "No classifier selected"}
                >
                  <option value="">No classifier selected</option>
                  {classifiers.map((classifier) => (
                    <option key={classifier.id} value={classifier.id}>{classifier.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <p className="pointer-events-none break-words px-3 pb-2 text-[9px] leading-4 text-primary font-mono">
                  {activeClassifier ? `${activeClassifier.categories.length} classes · ready to test` : "No classifier selected"}
                </p>
              </div>
            </div>
          )}
          <GPUMetricsPanel />
        </nav>

      </aside>

      {/* Toggle sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
        className={`fixed top-4 z-[60] h-10 bg-secondary border border-border rounded-r-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-all ${sidebarOpen ? "w-8" : "w-10"}`}
        style={{ left: sidebarOpen ? (isMobile ? "min(19rem, 86vw)" : "240px") : "0px" }}
      >
        <ChevronRight size={12} className={`transition-transform duration-300 ${sidebarOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Subtle mesh gradient overlay */}
        <div
          className="pointer-events-none fixed inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(5,178,220,0.08), transparent), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(139,92,246,0.05), transparent)",
          }}
        />
        <div
          className="pointer-events-none fixed bottom-0 left-0 lg:left-60 right-0 h-40 opacity-30"
          style={{
            backgroundImage: "radial-gradient(rgba(5,178,220,0.45) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
            maskImage: "linear-gradient(to top, black, transparent)",
          }}
        />

        {page === "dashboard" && (
          <button
            onClick={startCreate}
            className="hidden sm:inline-flex absolute right-6 lg:right-8 top-7 z-20 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_0_22px_rgba(5,178,220,0.45)] transition-all hover:-translate-y-0.5 hover:bg-sky-300 active:scale-[0.98]"
          >
            <Plus size={14} /> New Classifier
          </button>
        )}

        <div className="relative z-10">
          {page === "dashboard" && (
            <DashboardPage
              classifiers={classifiers}
              onSelect={openClassifier}
              onCreate={startCreate}
              onReorder={setClassifiers}
            />
          )}
          {page === "create" && (
            <CreatePage
              onContinue={handleCreateContinue}
              onBack={() => setPage("dashboard")}
            />
          )}
          {page === "examples" && draftClassifier && (
            <ExamplesPage
              classifier={activeClassifier!}
              onFinish={handleExamplesFinish}
              onBack={() => setPage("create")}
            />
          )}
          {page === "classify" && activeClassifier && (
            <ClassifyPage classifier={activeClassifier} />
          )}
          {page === "api" && activeClassifier && (
            <APIPage classifier={activeClassifier} />
          )}
        </div>
      </main>
    </div>
  );
}
