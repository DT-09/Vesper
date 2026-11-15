import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, Check, Clock3, Plus, RotateCcw, Sparkles } from "lucide-react";
import "./recall-practice.css";

type RecallCard = {
  id: string; prompt: string; answer: string; context: string;
  createdAt: string; dueAt: string; interval: number; ease: number;
  repetitions: number; reviews: number; lastGrade?: string;
};
const KEY = "vesper-recall-cards-v1";
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n: number) => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
const uid = () => globalThis.crypto?.randomUUID?.() || "recall-"+Date.now()+"-"+Math.random().toString(36).slice(2);
function readCards(): RecallCard[] {
  try { const value = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(value) ? value.filter((x:any)=>x && typeof x.prompt==="string" && typeof x.answer==="string") : []; }
  catch { return []; }
}
export default function RecallPractice() {
  const [cards,setCards] = useState<RecallCard[]>(readCards);
  const [prompt,setPrompt] = useState(""); const [answer,setAnswer] = useState(""); const [context,setContext] = useState("");
  const [activeId,setActiveId] = useState<string|null>(null); const [revealed,setRevealed] = useState(false);
  const [showAdd,setShowAdd] = useState(false);
  useEffect(()=>{ try { localStorage.setItem(KEY,JSON.stringify(cards)); } catch { /* Browser storage can be unavailable or full. */ } },[cards]);
  const due = useMemo(()=>cards.filter(c=>c.dueAt<=today()).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.createdAt.localeCompare(b.createdAt)),[cards]);
  const active = due.find(c=>c.id===activeId) || due[0] || null;
  const totalReviews = cards.reduce((n,c)=>n+c.reviews,0);
  const mastered = cards.filter(c=>c.interval>=21).length;
  const addCard = () => {
    if(!prompt.trim()||!answer.trim()) return;
    const now = new Date().toISOString();
    const card:RecallCard={id:uid(),prompt:prompt.trim(),answer:answer.trim(),context:context.trim(),createdAt:now,dueAt:today(),interval:0,ease:2.5,repetitions:0,reviews:0};
    setCards(old=>[card,...old]); setPrompt("");setAnswer("");setContext("");setShowAdd(false);setActiveId(card.id);setRevealed(false);
  };
  const grade = (rating:"again"|"hard"|"good"|"easy") => {
    if(!active)return;
    const next={...active};
    if(rating==="again"){next.interval=0;next.repetitions=0;next.dueAt=addDays(0);next.ease=Math.max(1.3,next.ease-.2);}
    else {
      const factors={hard:1.2,good:next.repetitions===0?1:next.repetitions===1?3:next.ease,easy:next.repetitions===0?4:next.ease*1.3};
      next.interval=rating==="hard"?Math.max(1,Math.round(Math.max(1,next.interval)*1.2)):rating==="good"?Math.max(1,Math.round(next.interval===0?1:next.interval===1?3:next.interval*next.ease)):Math.max(4,Math.round(Math.max(1,next.interval)*1.3));
      next.ease=Math.max(1.3,next.ease+(rating==="easy"?.15:rating==="hard"?-.15:0));
      next.repetitions+=1; next.dueAt=addDays(next.interval);
    }
    next.reviews+=1;next.lastGrade=rating;
    setCards(old=>old.map(c=>c.id===active.id?next:c));
    setActiveId(null);setRevealed(false);
  };
  const remove = (id:string) => {setCards(old=>old.filter(c=>c.id!==id));setActiveId(null);setRevealed(false);};
  return <div className="v-recall">
    <header className="v-recall-hero"><div><div className="v-eyebrow">GROWTH STUDIO / RETRIEVAL ENGINE</div><h1>Remember what<br/><em>you can reconstruct.</em></h1><p>Turn important concepts into short retrieval prompts. Test yourself before reopening a source, then schedule the next review from your own recall rating.</p></div><div className="v-recall-orbit"><Brain size={42}/><span>RETRIEVE · CHECK · SPACE</span></div></header>
    <section className="v-recall-stats"><div><span>DUE NOW</span><b>{due.length}</b><small>Cards ready for retrieval</small></div><div><span>KNOWLEDGE CARDS</span><b>{cards.length}</b><small>Your personal recall queue</small></div><div><span>REVIEWS COMPLETED</span><b>{totalReviews}</b><small>Recorded retrieval attempts</small></div><div><span>LONG INTERVAL</span><b>{mastered}</b><small>Cards scheduled 21+ days out</small></div></section>
    <div className="v-recall-layout">
      <section className="v-recall-main">
        <div className="v-recall-section-head"><div><div className="v-eyebrow">TODAY'S RETRIEVAL</div><h2>Can you explain it without looking?</h2></div><button className="v-btn primary" onClick={()=>setShowAdd(v=>!v)}><Plus size={15}/> Add a concept</button></div>
        {showAdd&&<form className="v-recall-form" onSubmit={e=>{e.preventDefault();addCard();}}><label>RETRIEVAL PROMPT<input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. Why does the derivative represent instantaneous rate of change?" required/></label><label>ANSWER / EXPLANATION<textarea value={answer} onChange={e=>setAnswer(e.target.value)} rows={4} placeholder="Write the explanation you expect yourself to reconstruct." required/></label><label>CONTEXT (OPTIONAL)<input value={context} onChange={e=>setContext(e.target.value)} placeholder="Subject, inquiry, lesson or source"/></label><div className="v-recall-form-actions"><span>Keep one idea per card. Write prompts that require explanation, not recognition.</span><button className="v-btn primary" type="submit">Save recall card <ArrowRight size={14}/></button></div></form>}
        {active?<article className="v-recall-card"><div className="v-recall-card-top"><span><Sparkles size={13}/> RETRIEVAL / {due.length} DUE</span><span>{active.context||"INDEPENDENT STUDY"}</span></div><h3>{active.prompt}</h3><p className="v-recall-instruction">Answer aloud or write your explanation before revealing the reference answer.</p>{!revealed?<button className="v-btn primary v-reveal" onClick={()=>setRevealed(true)}>Reveal reference answer <ArrowRight size={14}/></button>:<><div className="v-recall-answer"><span>REFERENCE ANSWER</span><p>{active.answer}</p></div><div className="v-recall-grade-label">How well did you retrieve it?</div><div className="v-recall-grades"><button onClick={()=>grade("again")}><b>Again</b><small>Could not recall</small></button><button onClick={()=>grade("hard")}><b>Hard</b><small>Major gaps</small></button><button onClick={()=>grade("good")}><b>Good</b><small>Mostly correct</small></button><button onClick={()=>grade("easy")}><b>Easy</b><small>Clear and complete</small></button></div></>}</article>:<div className="v-recall-empty"><Check size={24}/><h3>{cards.length?"Your queue is clear.":"Start building durable knowledge."}</h3><p>{cards.length?"No cards are due right now. Your next review is scheduled automatically.":"Add a concept from a lesson or inquiry. Vesper will bring it back for retrieval practice."}</p><button className="v-btn secondary" onClick={()=>setShowAdd(true)}><Plus size={14}/> Create your first card</button></div>}
        <div className="v-recall-method"><div className="v-eyebrow">HOW SCHEDULING WORKS</div><p>Successful retrieval increases the next interval. Difficult retrieval shortens it. “Again” returns the card to today's queue. This is a lightweight local spaced-review scheduler, not a validated assessment of mastery.</p></div>
      </section>
      <aside className="v-recall-side"><div className="v-eyebrow">YOUR KNOWLEDGE FIELD</div><h3>Review history</h3>{cards.length?<div className="v-recall-list">{cards.slice(0,12).map(c=><div className="v-recall-list-item" key={c.id}><div><b>{c.prompt}</b><small>{c.context||"Uncategorised"} · {c.reviews} reviews</small><span>{c.dueAt<=today()?"DUE NOW":"NEXT · "+c.dueAt}</span></div><button onClick={()=>remove(c.id)} aria-label="Delete recall card">×</button></div>)}</div>:<p className="v-recall-muted">Your cards will appear here as you build your recall system.</p>}<div className="v-recall-tip"><Clock3 size={15}/><span>Short, repeated retrieval is more useful than rereading a large amount of material in one sitting.</span></div></aside>
    </div>
  </div>;
}
