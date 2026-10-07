"use client";
import { useMemo, useState, type ReactNode } from "react";
import { Download, Gem, ImagePlus, Palette, Plane, Plus, Quote, Sparkles, Target } from "lucide-react";
import { useLife, uid, type LifeData } from "@/lib/life-store";
import { Button, Empty, Field, Modal, RecordActions, SaveButton } from "./workspace-ui";
import { CategoryManager } from "./record-manager";
import { ImageUpload, MediaImage, resolveMediaUrl } from "./workspace-media";

type BoardItem = LifeData["board"][number];

const kinds = ["Dream", "Goal", "Quote", "Travel", "Career", "Luxury", "Statement"];
const fallbackPhotos = [
  "linear-gradient(135deg,#f6eadf,#c9b7e8 48%,#d6a85c)",
  "linear-gradient(135deg,#f8f1e7,#b9d3d2 48%,#b68d48)",
  "linear-gradient(135deg,#fff7ed,#d8c2f0 52%,#9db9d3)",
  "linear-gradient(135deg,#f7efe4,#f2c6b6 45%,#8ba69a)",
  "linear-gradient(135deg,#fbf4e9,#d2c3aa 42%,#b49458)",
];
const exportPalettes = [
  { bg: "#fbf4ec", ink: "#2f2930", accent: "#8f1f1c" },
  { bg: "#f4efe8", ink: "#221f1f", accent: "#9a6b31" },
  { bg: "#fdfbf6", ink: "#42282c", accent: "#7b1420" },
  { bg: "#efe8f4", ink: "#2d2632", accent: "#7c6590" },
  { bg: "#e9f0eb", ink: "#22342b", accent: "#55745f" },
  { bg: "#871414", ink: "#fff8ef", accent: "#fff8ef" },
];
type CollageTile = { x: number; y: number; w: number; h: number };

function money(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);
}

function boardSeed(items: BoardItem[]) {
  return items.reduce((sum, item, index) => {
    const text = `${item.id}${item.title}${item.url}${item.quote ?? ""}`;
    return sum + Array.from(text).reduce((s, char) => s + char.charCodeAt(0), 0) * (index + 1);
  }, 19);
}

function seeded(seed: number, index: number) {
  const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, tile: CollageTile) {
  const scale = Math.max(tile.w / image.naturalWidth, tile.h / image.naturalHeight);
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.drawImage(image, tile.x + (tile.w - w) / 2, tile.y + (tile.h - h) / 2, w, h);
}

function linesFor(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    while (ctx.measureText(line).width > maxWidth && line.length > 1) {
      let end = line.length;
      while (end > 1 && ctx.measureText(`${line.slice(0, end)}…`).width > maxWidth) end -= 1;
      lines.push(`${line.slice(0, end)}…`);
      line = line.slice(end);
      if (lines.length >= maxLines) break;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  return lines;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number, options: { max: number; min: number; family: string; weight?: string; italic?: boolean; maxLines: number }) {
  for (let size = options.max; size >= options.min; size -= 2) {
    const style = `${options.italic ? "italic " : ""}${options.weight ? `${options.weight} ` : ""}${size}px ${options.family}`;
    ctx.font = style;
    const lineHeight = size * 1.08;
    const lines = linesFor(ctx, text, maxWidth, options.maxLines);
    if (lines.length * lineHeight <= maxHeight) return { font: style, lines, lineHeight };
  }
  const style = `${options.italic ? "italic " : ""}${options.weight ? `${options.weight} ` : ""}${options.min}px ${options.family}`;
  ctx.font = style;
  const lineHeight = options.min * 1.08;
  return { font: style, lines: linesFor(ctx, text, maxWidth, options.maxLines), lineHeight };
}

function collageRows(count: number) {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count === 2) return [1, 1];
  if (count === 3) return [1, 2];
  if (count === 4) return [1, 1, 2];
  const rows: number[] = [];
  let remaining = count;
  const pattern = count <= 8 ? [3, 2, 3] : count <= 15 ? [4, 3, 4, 2, 3] : [4, 5, 3, 4, 5, 3];
  let step = 0;
  while (remaining > 0) {
    let take = Math.min(pattern[step % pattern.length], remaining);
    if (remaining - take === 1 && take > 2) take -= 1;
    rows.push(take);
    remaining -= take;
    step += 1;
  }
  return rows;
}

function collageTiles(count: number, width: number, height: number) {
  const margin = 10;
  const gap = count <= 4 ? 8 : count <= 12 ? 6 : 4;
  const rows = collageRows(count);
  const availableHeight = height - margin * 2 - gap * Math.max(0, rows.length - 1);
  const baseHeights = rows.map(row => row === 1 ? 1.55 : row === 2 ? 1.04 : row === 3 ? .78 : row === 4 ? .62 : .52);
  const totalBase = baseHeights.reduce((sum, value) => sum + value, 0) || 1;
  const tiles: CollageTile[] = [];
  let y = margin;
  rows.forEach((row, rowIndex) => {
    const rowHeight = availableHeight * (baseHeights[rowIndex] / totalBase);
    const availableWidth = width - margin * 2 - gap * Math.max(0, row - 1);
    const templates: Record<number, number[][]> = {
      1: [[1]],
      2: [[.58, .42], [.42, .58]],
      3: [[.32, .43, .25], [.46, .24, .3], [.27, .31, .42]],
      4: [[.23, .31, .21, .25], [.33, .2, .27, .2], [.2, .26, .34, .2]],
      5: [[.18, .25, .18, .22, .17], [.24, .18, .2, .16, .22]],
    };
    const ratios = templates[row][rowIndex % templates[row].length];
    let x = margin;
    ratios.forEach((ratio, index) => {
      const isLast = index === ratios.length - 1;
      const w = isLast ? width - margin - x : availableWidth * ratio;
      tiles.push({ x, y, w, h: rowHeight });
      x += w + gap;
    });
    y += rowHeight + gap;
  });
  return tiles;
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
  const [flipped, setFlipped] = useState(false);
  const progress = linkedProgress(item, data);
  const target = Number(item.target ?? 0);
  const saved = Number(item.saved ?? 0);
  const currency = item.currency || data.currency;
  const itemKind = (item.kind ?? "").toLowerCase();
  const isQuote = itemKind === "quote" || itemKind === "statement";
  const milestone = progress >= 75;
  return <article className={`le-vision-card le-vision-card-${index % 6} ${isQuote ? "is-quote" : ""} ${milestone ? "is-glowing" : ""} ${flipped ? "is-flipped" : ""}`}>
    <button type="button" className="le-vision-flip" aria-pressed={flipped} aria-label={`${flipped ? "Show image for" : "Show notes for"} ${item.title}`} onClick={() => setFlipped(value => !value)}>
      <div className="le-vision-face le-vision-front">
        {isQuote ? <div className="le-vision-quote-card"><Quote size={24} /><blockquote>{item.quote || item.notes || item.title}</blockquote><p>{item.title}</p></div> : <VisionImage item={item} index={index} progress={progress} />}
      </div>
      <div className="le-vision-face le-vision-back">
        <span className="le-vision-tag">{item.category ?? item.kind ?? "Dream"}</span>
        <h3>{item.title}</h3>
        {item.quote && <blockquote className="le-vision-statement">{item.quote}</blockquote>}
        {item.notes && <p>{item.notes}</p>}
        {target > 0 && <div className="le-vision-money"><span>Saved {money(saved, currency)}</span><strong>{money(target, currency)}</strong></div>}
        {item.goalId && <small>Connected to {data.goals.find(g => g.id === item.goalId)?.title ?? "removed goal"}</small>}
      </div>
    </button>
    <div className="le-vision-card-tools"><RecordActions name={item.title} edit={edit} remove={remove} /></div>
    {(target > 0 || item.goalId) && <div className="le-vision-orbit" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} style={{ "--vision-progress": `${Math.round(progress)}%` } as React.CSSProperties}>
      <span>{Math.round(progress)}%</span>
    </div>}
  </article>;
}

export function VisionWorkspace({ goalsView }: { goalsView?: ReactNode }) {
  const { data, update } = useLife();
  const [draft, setDraft] = useState<BoardItem | null>(null);
  const [view, setView] = useState<"vision" | "goals">("vision");
  const [category, setCategory] = useState("All");
  const [settings, setSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png"|"jpeg">("png");
  const [exportStatus, setExportStatus] = useState("");
  const categories = useMemo(() => ["All", ...new Set([...data.visionCategories, ...data.board.map(b => b.category ?? "Other")])], [data.board, data.visionCategories]);
  const visible = data.board.filter(b => category === "All" || (b.category ?? "Other") === category);
  const add = (kind = "Dream") => setDraft({ id: uid(), title: "", url: "", notes: "", category: data.visionCategories.includes(kind) ? kind : data.visionCategories[0] ?? "Dreams", goalId: "", kind, target: 0, saved: 0, currency: data.currency, quote: "", coachNote: "" });
  const loadImage = async (source: string) => {
    if (!source) return null;
    try {
      const url = await resolveMediaUrl(source);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Image unavailable"));
        image.src = url;
      });
    } catch { return null; }
  };
  function drawQuoteTile(ctx: CanvasRenderingContext2D, item: BoardItem, tile: CollageTile, index: number, seed: number) {
    const palette = exportPalettes[(index + Math.floor(seeded(seed, index) * exportPalettes.length)) % exportPalettes.length];
    const text = item.quote || item.notes || item.title || "My future is already becoming visible.";
    ctx.save();
    roundedRect(ctx, tile.x, tile.y, tile.w, tile.h, 10);
    ctx.clip();
    ctx.fillStyle = palette.bg;
    ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = palette.bg === "#871414" ? .12 : .08;
    ctx.fillRect(tile.x, tile.y, tile.w, Math.max(10, tile.h * .08));
    ctx.globalAlpha = 1;
    const pad = Math.max(18, Math.min(44, tile.w * .1));
    const maxLines = tile.h > 420 ? 7 : tile.h > 300 ? 5 : 4;
    const fit = fitText(ctx, text, tile.w - pad * 2, tile.h - pad * 2, { max: Math.min(86, tile.w / 5.8), min: 24, family: index % 3 === 0 ? "Georgia" : "Times New Roman", weight: index % 3 === 1 ? "700" : undefined, italic: index % 4 === 1, maxLines });
    ctx.font = fit.font;
    ctx.fillStyle = palette.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const total = fit.lines.length * fit.lineHeight;
    let y = tile.y + tile.h / 2 - total / 2 + fit.lineHeight / 2;
    fit.lines.forEach(line => {
      ctx.fillText(line, tile.x + tile.w / 2, y);
      y += fit.lineHeight;
    });
    if (item.title && item.title !== text && tile.h > 270) {
      ctx.font = "700 16px Arial";
      ctx.globalAlpha = .72;
      ctx.fillText(item.title.toUpperCase(), tile.x + tile.w / 2, tile.y + tile.h - pad / 1.7);
    }
    ctx.restore();
  }
  function drawImageTile(ctx: CanvasRenderingContext2D, item: BoardItem, image: HTMLImageElement | null, tile: CollageTile, index: number, seed: number) {
    ctx.save();
    roundedRect(ctx, tile.x, tile.y, tile.w, tile.h, 10);
    ctx.clip();
    if (image) {
      drawCover(ctx, image, tile);
    } else {
      const gradient = ctx.createLinearGradient(tile.x, tile.y, tile.x + tile.w, tile.y + tile.h);
      const palette = exportPalettes[(index + 2) % exportPalettes.length];
      gradient.addColorStop(0, palette.bg);
      gradient.addColorStop(1, index % 2 ? "#d8c2f0" : "#c9dcd4");
      ctx.fillStyle = gradient;
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
    }
    const caption = item.quote || (item.notes && tile.w > 245 ? item.notes : "");
    if (caption && tile.h > 190 && tile.w > 170) {
      const gradient = ctx.createLinearGradient(0, tile.y + tile.h * .56, 0, tile.y + tile.h);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(18,15,18,.58)");
      ctx.fillStyle = gradient;
      ctx.fillRect(tile.x, tile.y + tile.h * .46, tile.w, tile.h * .54);
      const pad = Math.max(14, Math.min(24, tile.w * .08));
      const fit = fitText(ctx, caption, tile.w - pad * 2, tile.h * .22, { max: Math.min(34, tile.w / 8), min: 15, family: "Georgia", italic: true, maxLines: tile.h > 360 ? 3 : 2 });
      ctx.font = fit.font;
      ctx.fillStyle = "#fffaf2";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      let y = tile.y + tile.h - pad - (fit.lines.length - 1) * fit.lineHeight;
      fit.lines.forEach(line => {
        ctx.fillText(line, tile.x + pad, y);
        y += fit.lineHeight;
      });
    } else if (!image && item.title) {
      const pad = Math.max(16, Math.min(34, tile.w * .1));
      const fit = fitText(ctx, item.title, tile.w - pad * 2, tile.h - pad * 2, { max: Math.min(58, tile.w / 5.5), min: 22, family: "Georgia", maxLines: 5 });
      ctx.font = fit.font;
      ctx.fillStyle = "#2e2830";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let y = tile.y + tile.h / 2 - (fit.lines.length * fit.lineHeight) / 2 + fit.lineHeight / 2;
      fit.lines.forEach(line => {
        ctx.fillText(line, tile.x + tile.w / 2, y);
        y += fit.lineHeight;
      });
    }
    if (seeded(seed, index) > .78 && tile.w > 180 && tile.h > 220) {
      ctx.globalAlpha = .08;
      ctx.fillStyle = "#fffaf2";
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  async function exportBoard() {
    if (!data.board.length) { setExportStatus("Add at least one vision item before exporting."); return; }
    if (exporting) return;
    setExporting(true);
    setExportStatus("Creating collage...");
    try {
      const items = data.board;
      const width = 1080;
      const height = 1620;
      const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#fbf7ef";
      ctx.fillRect(0, 0, width, height);
      const seed = boardSeed(items);
      const tiles = collageTiles(items.length, width, height);
      const images = await Promise.all(items.map(item => item.url ? loadImage(item.url) : Promise.resolve(null)));
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const hasTextOnlyIntent = !item.url || ["quote", "statement"].includes((item.kind ?? "").toLowerCase());
        if (hasTextOnlyIntent && !images[i]) drawQuoteTile(ctx, item, tiles[i], i, seed);
        else drawImageTile(ctx, item, images[i], tiles[i], i, seed);
      }
      ctx.save();
      ctx.globalAlpha = .34;
      ctx.fillStyle = "#5b514b";
      ctx.font = "500 13px Georgia";
      ctx.textAlign = "right";
      ctx.fillText("The Life Edit", width - 18, height - 18);
      ctx.restore();
      const mime = exportFormat === "png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, .95));
      if (!blob) throw new Error("Could not create export.");
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `life-edit-vision-board.${exportFormat === "png" ? "png" : "jpg"}`; a.click(); URL.revokeObjectURL(url); setExportStatus("Pinterest-style vision board downloaded.");
    } catch {
      setExportStatus("Could not create the collage. Check your images and try again.");
    } finally {
      setExporting(false);
    }
  }

  return <section className="le-vision-experience">
    <div className="le-vision-hero">
      <div>
        <p className="le-eyebrow">Vision board</p>
        <h2>A luxury board connected to your future.</h2>
        <p>Collect the places, purchases, work, words, and moments that make your financial discipline feel personal.</p>
      </div>
      <div className="le-vision-actions">
        {goalsView && <div className="le-vision-toggle" role="tablist" aria-label="Vision and goals view"><button type="button" role="tab" aria-selected={view === "vision"} onClick={() => setView("vision")}><ImagePlus size={15}/>Vision board</button><button type="button" role="tab" aria-selected={view === "goals"} onClick={() => setView("goals")}><Target size={15}/>Goals</button></div>}
        {view === "vision" && <><select aria-label="Vision category filter" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
          <select aria-label="Vision export format" value={exportFormat} onChange={e => setExportFormat(e.target.value as "png"|"jpeg")}><option value="png">PNG</option><option value="jpeg">JPG</option></select>
          <Button secondary disabled={exporting} onClick={() => void exportBoard()}><Download size={16} />{exporting ? "Creating..." : "Export collage"}</Button>
          <Button secondary onClick={() => setSettings(!settings)}><Palette size={16} />Categories</Button>
          <Button onClick={() => add()}><Plus size={16} />Add vision item</Button></>}
      </div>
    </div>
    {exportStatus && <p role="status" className="le-export-status">{exportStatus}</p>}
    {view === "goals" && goalsView ? goalsView : <><div className="le-vision-flow-copy"><p>Tap a card to flip it and read what is behind the image.</p></div>{settings && <CategoryManager categoryKey="visionCategories" title="Vision categories" />}
    {!data.board.length ? <div className="le-vision-empty">
      <div className="le-vision-empty-board">
        <button type="button" onClick={() => add("Travel")}><Plane size={18} />Bali 2027</button>
        <button type="button" onClick={() => add("Luxury")}><Gem size={18} />MacBook Pro</button>
        <button type="button" onClick={() => add("Quote")}><Quote size={18} />Future self note</button>
      </div>
      <Empty title="Start with one image, quote, or dream purchase." action="Create vision item" onClick={() => add()} />
    </div> : <div className="le-vision-canvas" aria-label="Vision board canvas">
      {visible.map((item, index) => <VisionCard key={item.id} item={item} index={index} data={data} edit={() => setDraft(item)} remove={() => update(d => ({ ...d, board: d.board.filter(x => x.id !== item.id) }))} />)}
    </div>}</>}
    {draft && <Modal title="Vision item" close={() => setDraft(null)}><form onSubmit={e => { e.preventDefault(); update(d => ({ ...d, board: [...d.board.filter(b => b.id !== draft.id), draft] })); setDraft(null); }}>
      <Field label="Type"><select value={draft.kind ?? "Dream"} onChange={e => setDraft({ ...draft, kind: e.target.value })}>{kinds.map(kind => <option key={kind}>{kind}</option>)}</select></Field>
      <Field label="Title"><input required value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Bali 2027, Paris Trip, New Apartment" /></Field>
      <Field label="Category"><select value={draft.category ?? "Other"} onChange={e => setDraft({ ...draft, category: e.target.value })}>{[...new Set([...data.visionCategories, draft.category ?? "Other"])].map(c => <option key={c}>{c}</option>)}</select></Field>
      <Field label="Vision statement or quote"><textarea rows={3} value={draft.quote ?? ""} onChange={e => setDraft({ ...draft, quote: e.target.value })} placeholder="My future self deserves this." /></Field>
      <Field label="Motivation notes"><textarea rows={4} value={draft.notes ?? ""} onChange={e => setDraft({ ...draft, notes: e.target.value })} placeholder="Why this dream matters to you." /></Field>
      <div className="le-grid-two">
        <Field label="Target amount"><input type="number" min="0" value={Number(draft.target ?? 0) > 0 ? draft.target : ""} placeholder="0" onChange={e => setDraft({ ...draft, target: e.target.value === "" ? 0 : Number(e.target.value) })} /></Field>
        <Field label="Saved so far"><input type="number" min="0" value={Number(draft.saved ?? 0) > 0 ? draft.saved : ""} placeholder="0" onChange={e => setDraft({ ...draft, saved: e.target.value === "" ? 0 : Number(e.target.value) })} /></Field>
      </div>
      <Field label="Currency"><select value={draft.currency ?? data.currency} onChange={e => setDraft({ ...draft, currency: e.target.value })}>{data.currencies.map(c => <option key={c.code} value={c.code}>{c.code} · {c.name}</option>)}</select></Field>
      <Field label="Future goal"><select value={draft.goalId ?? ""} onChange={e => setDraft({ ...draft, goalId: e.target.value })}><option value="">No linked goal</option>{data.goals.filter(g => !g.archived || g.id === draft.goalId).map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></Field>
      <Field label="AI dream coach note"><textarea rows={3} value={draft.coachNote ?? ""} onChange={e => setDraft({ ...draft, coachNote: e.target.value })} placeholder="At your current pace, you will reach this goal early." /></Field>
      <ImageUpload value={draft.url} onBusy={setUploading} onChange={url => setDraft(d => d ? { ...d, url } : d)} />
      <Field label="Or image URL (https)"><input type="url" pattern="https://.*" value={draft.url.startsWith("https://") ? draft.url : ""} onChange={e => setDraft({ ...draft, url: e.target.value })} /></Field>
      {draft.url && <Button secondary onClick={() => setDraft({ ...draft, url: "" })}><ImagePlus size={16} />Remove image</Button>}
      <SaveButton disabled={uploading}>Save vision item</SaveButton>
    </form></Modal>}
  </section>;
}
