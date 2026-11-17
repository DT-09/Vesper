import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Brain, CheckCircle2, ChevronRight, Compass, RotateCcw, Sparkles, Target } from "lucide-react";
import "./adaptive-learning.css";

type Stage = "orient" | "diagnose" | "build" | "explain" | "retrieve" | "transfer" | "reflect";
type Session = {
  id: string; topic: string; goal: string; prior: string; diagnostic: string;
  explanation: string; example: string; misconception: string; retrieval: string;
  transfer: string; reflection: string; confidence: number; stage: Stage;
  completed: Stage[]; createdAt: string; updatedAt: string;
};
const KEY = "vesper.adaptive-learning.v1";
const stages: { id: Stage; title: string; purpose: string }[] = [
  { id: "orient", title: "Orient", purpose: "Define what understanding would let you explain, predict or do." },
  { id: "diagnose", title: "Diagnose", purpose: "Expose prior knowledge, assumptions and gaps before studying." },
  { id: "build", title: "Build foundations", purpose: "Identify prerequisites and assemble a source-backed explanation." },
  { id: "explain", title: "Explain", purpose: "Reconstruct the idea in your own words, with an example and a boundary." },
  { id: "retrieve", title: "Retrieve", purpose: "Close your sources and reproduce the central idea from memory." },
  { id: "transfer", title: "Transfer", purpose: "Apply the idea to an unfamiliar case. Understanding must travel." },
  { id: "reflect", title: "Reflect and adapt", purpose: "Use the evidence to choose the next learning move." }
];
const uid = () => globalThis.crypto?.randomUUID?.() || "learn-" + Date.now().toString(36);
const read = (): Session[] => { try { const x = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(x) ? x : []; } catch { return []; } };
const blank = (topic: string, goal: string): Session => ({
  id: uid(), topic, goal, prior: "", diagnostic: "", explanation: "", example: "",
  misconception: "", retrieval: "", transfer: "", reflection: "", confidence: 2,
  stage: "orient", completed: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
});
function recommendation(s: Session) {
  if (!s.diagnostic.trim()) return { title: "Make your starting point visible", detail: "Write what you currently think is true. Include uncertainty; the point is diagnosis, not performance.", action: "diagnose" as Stage };
  if (!s.explanation.trim() || s.explanation.trim().length < 100) return { title: "Strengthen the explanation", detail: "Explain the mechanism step by step. Define each important term and connect the steps causally.", action: "explain" as Stage };
  if (!s.retrieval.trim()) return { title: "Test unaided reconstruction", detail: "Hide your notes. Rebuild the explanation from memory, then compare it with your source and mark omissions.", action: "retrieve" as Stage };
  if (!s.transfer.trim()) return { title: "Test whether the idea transfers", detail: "Choose a new example that was not used in the explanation. Predict what should happen and justify the prediction.", action: "transfer" as Stage };
  if (s.confidence <= 2) return { title: "Repair the weakest prerequisite", detail: "Your confidence is low. Identify the exact step you cannot justify, return to its prerequisite, and rebuild from there.", action: "build" as Stage };
  if (s.confidence === 3) return { title: "Find a counterexample", detail: "Your understanding is developing. Find a case where your explanation might fail, then revise its boundary.", action: "explain" as Stage };
  return { title: "Extend the idea", detail: "Your self-assessment is strong. Derive a consequence, connect another discipline, or investigate a harder case.", action: "reflect" as Stage };
}
export default function AdaptiveLearningStudio() {
  const [sessions, setSessions] = useState<Session[]>(read);
  const [activeId, setActiveId] = useState<string | null>(sessions[0]?.id || null);
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [showCreate, setShowCreate] = useState(sessions.length === 0);
  const active = sessions.find(s => s.id === activeId) || null;
  const next = useMemo(() => active ? recommendation(active) : null, [active]);
  const save = (nextSessions: Session[]) => { setSessions(nextSessions); try { localStorage.setItem(KEY, JSON.stringify(nextSessions)); } catch { /* Storage failure must not interrupt a learning session. */ } };
  const patch = (values: Partial<Session>) => { if (!active) return; const updated = { ...active, ...values, updatedAt: new Date().toISOString() }; save(sessions.map(s => s.id === active.id ? updated : s)); };
  const create = (event: React.FormEvent) => { event.preventDefault(); if (!topic.trim() || !goal.trim()) return; const s = blank(topic.trim(), goal.trim()); save([s, ...sessions]); setActiveId(s.id); setTopic(""); setGoal(""); setShowCreate(false); };
  const markComplete = (stage: Stage) => { if (!active) return; patch({ completed: active.completed.includes(stage) ? active.completed : [...active.completed, stage] }); };
  const currentStage = active ? stages.find(s => s.id === active.stage) || stages[0] : stages[0];
  const field = (label: string, value: string, key: keyof Session, placeholder: string, rows = 4) => (
    <label className="al-field"><span>{label}</span><textarea rows={rows} value={value} onChange={e => patch({ [key]: e.target.value } as Partial<Session>)} placeholder={placeholder} /></label>
  );
  return <div className="al-studio">
    <header className="al-hero"><div><div className="al-kicker"><Brain size={14}/> VESPER / ADAPTIVE LEARNING ENGINE</div><h1>Learn it. <em>Prove it to yourself.</em></h1><p>A structured learning cycle that diagnoses gaps, guides explanation, tests recall and demands transfer. Your work—not time spent reading—is the evidence.</p></div><div className="al-orbit"><Sparkles size={30}/><span>UNDERSTAND<br/>→ RECONSTRUCT<br/>→ TRANSFER</span></div></header>
    <div className="al-layout">
      <aside className="al-rail"><div className="al-rail-head"><span>YOUR LEARNING</span><button onClick={() => setShowCreate(v => !v)}>＋ New</button></div>
        {sessions.map(s => <button key={s.id} className={"al-session "+(s.id === activeId ? "active" : "")} onClick={() => { setActiveId(s.id); setShowCreate(false); }}><b>{s.topic}</b><small>{s.completed.length}/7 stages evidenced</small></button>)}
        {!sessions.length && <p className="al-muted">Your learning sessions will appear here.</p>}
      </aside>
      <main className="al-main">
        {showCreate && <form className="al-create" onSubmit={create}><div className="al-kicker">START WITH AN INTELLECTUAL OBJECTIVE</div><h2>What do you want to learn?</h2><label className="al-field"><span>SUBJECT OR QUESTION</span><input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Derive the chain rule from first principles" required/></label><label className="al-field"><span>WHAT SHOULD YOU BE ABLE TO DO?</span><textarea rows={3} value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g. Explain why it works, derive it, and apply it to unfamiliar functions." required/></label><button className="al-primary" type="submit">Create learning session <ArrowRight size={15}/></button></form>}
        {!showCreate && active && <>
          <div className="al-session-title"><div><div className="al-kicker">ACTIVE LEARNING OBJECTIVE</div><h2>{active.topic}</h2><p>{active.goal}</p></div><span className="al-progress">{active.completed.length}/7 evidenced</span></div>
          <div className="al-progress-track"><i style={{ width: (active.completed.length / 7 * 100) + "%" }}/></div>
          <div className="al-stage-grid">{stages.map((s, i) => <button key={s.id} className={"al-stage "+(active.stage === s.id ? "selected" : "")+(active.completed.includes(s.id) ? " done" : "")} onClick={() => patch({ stage: s.id })}><span>{active.completed.includes(s.id) ? <CheckCircle2 size={15}/> : "0"+(i+1)}</span><b>{s.title}</b><small>{s.purpose}</small></button>)}</div>
          <section className="al-work">
            <div className="al-kicker">STAGE {String(stages.findIndex(s => s.id === currentStage.id)+1).padStart(2,"0")} / {currentStage.title.toUpperCase()}</div><h3>{currentStage.purpose}</h3>
            {currentStage.id === "orient" && <>{field("WHAT DO YOU ALREADY KNOW? (OPTIONAL)", active.prior, "prior", "List relevant ideas, terms, equations or experiences.")}<div className="al-callout">Define success in observable terms. “Know calculus” is vague. “Explain the derivative geometrically and calculate it from the limit definition” is testable.</div></>}
            {currentStage.id === "diagnose" && <>{field("YOUR CURRENT EXPLANATION", active.diagnostic, "diagnostic", "Explain what you think is happening. Include assumptions and uncertainties.")}<div className="al-callout">Do this before opening a source. A wrong starting model is useful evidence: it tells you what needs repair.</div></>}
            {currentStage.id === "build" && <>{field("PREREQUISITES AND SOURCES", active.prior, "prior", "What must you understand first? Record source titles, links and the specific contribution of each.")}{field("KNOWN GAPS OR MISCONCEPTIONS", active.misconception, "misconception", "Which step cannot you yet justify? What alternative explanation might fit?")}</>}
            {currentStage.id === "explain" && <>{field("EXPLAIN THE IDEA IN YOUR OWN WORDS", active.explanation, "explanation", "Build a causal, step-by-step explanation. Define terms. Show the logic, not just the result.", 6)}{field("WORKED EXAMPLE OR DERIVATION", active.example, "example", "Demonstrate the idea with a concrete example, derivation, diagram description or model.")}{field("BOUNDARY / POSSIBLE MISCONCEPTION", active.misconception, "misconception", "Where does this explanation stop working? What is commonly confused?", 3)}</>}
            {currentStage.id === "retrieve" && <>{field("RECONSTRUCT WITHOUT NOTES", active.retrieval, "retrieval", "Close the source. Rebuild the core explanation from memory. Then compare and record omissions.", 6)}<div className="al-callout">Do not copy your original explanation. Retrieval is useful only when you attempt reconstruction before checking.</div></>}
            {currentStage.id === "transfer" && <>{field("UNFAMILIAR APPLICATION", active.transfer, "transfer", "Apply the idea to a new situation. State the prediction, reasoning and result. Explain what changed from the original example.", 6)}</>}
            {currentStage.id === "reflect" && <>{field("WHAT CHANGED IN YOUR THINKING?", active.reflection, "reflection", "What can you now explain? What remains uncertain? What should you investigate next?") }<label className="al-field"><span>SELF-ASSESSED CONFIDENCE (NOT A MASTERY CERTIFICATE)</span><select value={active.confidence} onChange={e => patch({ confidence: Number(e.target.value) })}><option value={1}>1 · I cannot yet explain it</option><option value={2}>2 · I understand parts, with major gaps</option><option value={3}>3 · I can explain the main idea, with uncertainty</option><option value={4}>4 · I can explain and apply it independently</option><option value={5}>5 · I can derive it, challenge it and teach it</option></select></label></>}
            <div className="al-work-actions"><button className="al-secondary" onClick={() => markComplete(currentStage.id)}>Mark evidence recorded <CheckCircle2 size={15}/></button><button className="al-primary" onClick={() => patch({ stage: stages[Math.min(stages.length-1, stages.findIndex(s=>s.id===active.stage)+1)].id })}>Next stage <ChevronRight size={15}/></button></div>
          </section>
          {next && <section className="al-next"><div className="al-kicker"><Target size={13}/> ENGINE RECOMMENDATION · RULE-BASED</div><h3>{next.title}</h3><p>{next.detail}</p><button onClick={() => patch({ stage: next.action })}>Go to recommended stage <ArrowRight size={14}/></button></section>}
        </>}
        {!showCreate && !active && <div className="al-create"><h2>Begin a learning session.</h2><p>Choose a question and define what understanding should enable you to do.</p><button className="al-primary" onClick={() => setShowCreate(true)}>Start learning <ArrowRight size={15}/></button></div>}
      </main>
    </div>
  </div>;
}
