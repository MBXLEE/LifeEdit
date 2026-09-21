"use client";
import { useMemo, useState } from "react";
import { BrainCircuit, Gem, ImagePlus, Palette, Plane, Plus, Quote, Sparkles } from "lucide-react";
import { useLife, uid, type LifeData } from "@/lib/life-store";
import { Button, Empty, Field, Modal, RecordActions } from "./workspace-ui";
import { CategoryManager } from "./record-manager";
import { ImageUpload, MediaImage } from "./workspace-media";

type BoardItem = LifeData["board"][number];

const kinds = ["Dream", "Goal", "Quote", "Travel", "Career", "Luxury", "Statement"];
const fallbackPhotos = [
  "linear-gradient(135deg,#f6eadf,#c9b7e8 48%,#d6a85c)",
  "linear-gradient(135deg,#f8f1e7,#b9d3d2 48%,#b68d48)",
  "linear-gradient(135deg,#fff7ed,#d8c2f0 52%,#9db9d3)",
  "linear-gradient(135deg,#f7efe4,#f2c6b6 45%,#8ba69a)",
  "linear-gradient(135deg,#fbf4e9,#d2c3aa 42%,#b49458)",
];

function money(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
}

function itemProgress(item: BoardItem) {
  const target = Number(item.target ?? 0);
  if (target > 0) return Math.min(100, Math.max(0, Number(item.saved ?? 0) / target * 100));
  return 0;
}

function linkedProgress(item: BoardItem, data: LifeData) {
  const goal = item.goalId ? data.goals.find(g => g.id === item.goalId) : null;
  return goal ? goal.progress : itemProgress(item);
}

function VisionImage({ item, index, progress }: { item: BoardItem; index: number; progress: number }) {
  return <div className="le-vision-photo" style={{ "--vision-progress": `${Math.round(progress)}%`, "--vision-fallback": fallbackPhotos[index % fallbackPhotos.length] } as React.CSSProperties}>
    {item.url ? <MediaImage source={item.url} alt={item.title} /> : <div className="le-vision-photo-empty"><Sparkles size={22} /><span>{item.kind ?? "Dream"}</span></div>}
  </div>;
}

function VisionCard({ item, index, data, edit, remove }: { item: BoardItem; index: number; data: LifeData; edit: () => void; remove: () => void }) {
  const progress = linkedProgress(item, data);
  const target = Number(item.target ?? 0);
  const saved = Number(item.saved ?? 0);
  const currency = item.currency || data.currency;
  const itemKind = (item.kind ?? "").toLowerCase();
  const isQuote = itemKind === "quote" || itemKind === "statement";
  const milestone = progress >= 75;
  return <article className={`le-vision-card le-vision-card-${index % 6} ${isQuote ? "is-quote" : ""} ${milestone ? "is-glowing" : ""}`}>
    {isQuote ? <div className="le-vision-quote-card"><Quote size={24} /><blockquote>{item.quote || item.notes || item.title}</blockquote><p>{item.title}</p></div> : <VisionImage item={item} index={index} progress={progress} />}
    <div className="le-vision-card-body">
      <div className="le-row">
        <span className="le-vision-tag">{item.category ?? item.kind ?? "Dream"}</span>
        <RecordActions name={item.title} edit={edit} remove={remove} />
      </div>
      <h3>{item.title}</h3>
      {item.quote && !isQuote && <blockquote className="le-vision-statement">{item.quote}</blockquote>}
      {item.notes && !isQuote && <p>{item.notes}</p>}
      {target > 0 && <div className="le-vision-money">
        <span>Saved {money(saved, currency)}</span>
        <strong>{money(target, currency)}</strong>
      </div>}
      {(target > 0 || item.goalId) && <div className="le-vision-orbit" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} style={{ "--vision-progress": `${Math.round(progress)}%` } as React.CSSProperties}>
        <span>{Math.round(progress)}%</span>
      </div>}
      {item.goalId && <small>Connected to {data.goals.find(g => g.id === item.goalId)?.title ?? "removed goal"}</small>}
    </div>
  </article>;
}

export function VisionWorkspace() {
  const { data, update } = useLife();
  const [draft, setDraft] = useState<BoardItem | null>(null);
  const [category, setCategory] = useState("All");
  const [settings, setSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const categories = useMemo(() => ["All", ...new Set([...data.visionCategories, ...data.board.map(b => b.category ?? "Other")])], [data.board, data.visionCategories]);
  const visible = data.board.filter(b => category === "All" || (b.category ?? "Other") === category);
  const savingsDream = data.savingsGoals.find(g => !g.archived) ?? null;
  const featured = visible[0] ?? data.board[0] ?? null;
  const savedTotal = data.transactions.filter(t => t.type === "Savings").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const whyTitle = featured?.title || savingsDream?.title || data.vision || "the life you are building";
  const closer = savingsDream ? money(savingsDream.saved, savingsDream.currency) : money(savedTotal, data.currency);
  const add = (kind = "Dream") => setDraft({ id: uid(), title: "", url: "", notes: "", category: data.visionCategories.includes(kind) ? kind : data.visionCategories[0] ?? "Dreams", goalId: "", kind, target: 0, saved: 0, currency: data.currency, quote: "", coachNote: "" });
  const coach = featured?.coachNote || (savingsDream ? `At this pace, every contribution is turning ${savingsDream.title} from a someday idea into a dated plan.` : "Choose one small money move today and let it serve the version of you on this board.");

  return <section className="le-vision-experience">
    <div className="le-vision-hero">
      <div>
        <p className="le-eyebrow">Vision board</p>
        <h2>A luxury Pinterest board connected to your future.</h2>
        <p>Collect the places, purchases, work, words, and moments that make your financial discipline feel personal.</p>
      </div>
      <div className="le-vision-actions">
        <select aria-label="Vision category filter" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
        <Button secondary onClick={() => setSettings(!settings)}><Palette size={16} />Categories</Button>
        <Button onClick={() => add()}><Plus size={16} />Add vision item</Button>
      </div>
    </div>
    {settings && <CategoryManager categoryKey="visionCategories" title="Vision categories" />}
    <div className="le-vision-daily">
      <div>
        <span>Today&apos;s Why</span>
        <h3>You are {closer} closer to {whyTitle}.</h3>
        <p>Small choices are becoming visible evidence. Keep going.</p>
      </div>
      <div className="le-vision-coach">
        <BrainCircuit size={20} />
        <p>{coach}</p>
      </div>
    </div>
    {!data.board.length ? <div className="le-vision-empty">
      <div className="le-vision-empty-board">
        <button type="button" onClick={() => add("Travel")}><Plane size={18} />Bali 2027</button>
        <button type="button" onClick={() => add("Luxury")}><Gem size={18} />MacBook Pro</button>
        <button type="button" onClick={() => add("Quote")}><Quote size={18} />Future self note</button>
      </div>
      <Empty title="Start with one image, quote, or dream purchase." action="Create vision item" onClick={() => add()} />
    </div> : <div className="le-vision-canvas" aria-label="Vision board canvas">
      {visible.map((item, index) => <VisionCard key={item.id} item={item} index={index} data={data} edit={() => setDraft(item)} remove={() => update(d => ({ ...d, board: d.board.filter(x => x.id !== item.id) }))} />)}
    </div>}
    {draft && <Modal title="Vision item" close={() => setDraft(null)}><form onSubmit={e => { e.preventDefault(); update(d => ({ ...d, board: [...d.board.filter(b => b.id !== draft.id), draft] })); setDraft(null); }}>
      <Field label="Type"><select value={draft.kind ?? "Dream"} onChange={e => setDraft({ ...draft, kind: e.target.value })}>{kinds.map(kind => <option key={kind}>{kind}</option>)}</select></Field>
      <Field label="Title"><input required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Bali 2027, Paris Trip, New Apartment" /></Field>
      <Field label="Category"><select value={draft.category ?? "Other"} onChange={e => setDraft({ ...draft, category: e.target.value })}>{[...new Set([...data.visionCategories, draft.category ?? "Other"])].map(c => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Vision statement or quote"><textarea rows={3} value={draft.quote ?? ""} onChange={e => setDraft({ ...draft, quote: e.target.value })} placeholder="My future self deserves this." /></Field>
      <Field label="Motivation notes"><textarea rows={4} value={draft.notes ?? ""} onChange={e => setDraft({ ...draft, notes: e.target.value })} placeholder="Why this dream matters to you." /></Field>
      <div className="le-grid-two">
        <Field label="Target amount"><input type="number" min="0" value={draft.target ?? 0} onChange={e => setDraft({ ...draft, target: Number(e.target.value) })} /></Field>
        <Field label="Saved so far"><input type="number" min="0" value={draft.saved ?? 0} onChange={e => setDraft({ ...draft, saved: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Currency"><select value={draft.currency ?? data.currency} onChange={e => setDraft({ ...draft, currency: e.target.value })}>{data.currencies.map(c => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}</select></Field>
      <Field label="Future goal"><select value={draft.goalId ?? ""} onChange={e => setDraft({ ...draft, goalId: e.target.value })}><option value="">No linked goal</option>{data.goals.filter(g => !g.archived || g.id === draft.goalId).map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></Field>
      <Field label="AI dream coach note"><textarea rows={3} value={draft.coachNote ?? ""} onChange={e => setDraft({ ...draft, coachNote: e.target.value })} placeholder="At your current pace, you will reach this goal early." /></Field>
      <ImageUpload value={draft.url} onBusy={setUploading} onChange={url => setDraft(d => d ? { ...d, url } : d)} />
      <Field label="Or image URL (https)"><input type="url" pattern="https://.*" value={draft.url.startsWith("https://") ? draft.url : ""} onChange={e => setDraft({ ...draft, url: e.target.value })} /></Field>
      {draft.url && <Button secondary onClick={() => setDraft({ ...draft, url: "" })}><ImagePlus size={16} />Remove image</Button>}
      <Button type="submit" disabled={uploading}>Save vision item</Button>
    </form></Modal>}
  </section>;
}
