"use client";
import { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLife } from "@/lib/life-store";
import { isDemoMode } from "@/lib/app-mode";

const DEFAULT_PRIVATE_BUCKET = "vision-board";
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function database(): Promise<IDBDatabase> { return new Promise((resolve,reject)=>{const request=indexedDB.open("life-edit-images",1);request.onupgradeneeded=()=>request.result.createObjectStore("images");request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}); }
async function saveLocal(file:File) { const db=await database();const key=crypto.randomUUID();await new Promise<void>((resolve,reject)=>{const tx=db.transaction("images","readwrite");tx.objectStore("images").put(file,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();return `local-media:${key}`; }
async function removeLocal(key:string) { const db=await database();await new Promise<void>((resolve,reject)=>{const tx=db.transaction("images","readwrite");tx.objectStore("images").delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close(); }
function privateMediaParts(source:string) {
  const value = source.slice(14);
  const separator = value.indexOf(":");
  if (separator > 0) return { bucket: value.slice(0, separator), path: value.slice(separator + 1) };
  return { bucket: DEFAULT_PRIVATE_BUCKET, path: value };
}
function privateMediaSource(bucket:string,path:string) { return bucket === DEFAULT_PRIVATE_BUCKET ? `private-media:${path}` : `private-media:${bucket}:${path}`; }
export async function resolveMediaUrl(source:string) {
  if(source.startsWith("local-media:")){const db=await database();const blob=await new Promise<Blob>((resolve,reject)=>{const r=db.transaction("images").objectStore("images").get(source.slice(12));r.onsuccess=()=>r.result?resolve(r.result):reject(new Error("Image is unavailable on this device."));r.onerror=()=>reject(r.error);});db.close();return URL.createObjectURL(blob);}
  if(source.startsWith("private-media:")){if(isDemoMode)throw new Error("Private media requires production mode.");const {bucket,path}=privateMediaParts(source);const {data,error}=await createClient().storage.from(bucket).createSignedUrl(path,3600);if(error)throw error;return data.signedUrl;}
  if(source.startsWith("https://"))return source;
  throw new Error("No image selected");
}
export async function uploadMediaFile(file:File,{account,bucket=DEFAULT_PRIVATE_BUCKET,folder=""}:{account:boolean;bucket?:string;folder?:string}) {
  if(!SUPPORTED_IMAGE_TYPES.includes(file.type)||file.size>MAX_IMAGE_BYTES) throw new Error("Choose a JPEG, PNG, or WebP image under 5 MB.");
  const bitmap=await createImageBitmap(file);bitmap.close();
  if(!account)return saveLocal(file);
  const db=createClient();const {data}=await db.auth.getUser();if(!data.user)throw new Error("Please sign in again.");
  const extension=file.type==="image/jpeg"?"jpg":file.type.split("/")[1];
  const cleanFolder=folder.split("/").map(part=>part.trim()).filter(Boolean).join("/");
  const path=`${data.user.id}/${cleanFolder?`${cleanFolder}/`:""}${crypto.randomUUID()}.${extension}`;
  const {error}=await db.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});if(error)throw new Error("Image could not be saved. Try again.");
  return privateMediaSource(bucket,path);
}
export async function deleteMediaSource(source:string) {
  try {
    if(source.startsWith("local-media:")){await removeLocal(source.slice(12));return;}
    if(source.startsWith("private-media:")&&!isDemoMode){const {bucket,path}=privateMediaParts(source);await createClient().storage.from(bucket).remove([path]);}
  } catch { /* Deleting media is best-effort; records remain the source of truth. */ }
}
export function MediaImage({source,alt}:{source:string;alt:string}) {
  const [url,setUrl]=useState("");const [error,setError]=useState("");
  useEffect(()=>{let active=true;let current="";setUrl("");setError("");resolveMediaUrl(source).then(value=>{current=value;if(active)setUrl(value);else if(value.startsWith("blob:"))URL.revokeObjectURL(value);}).catch(()=>{if(active)setError("Image unavailable");});return()=>{active=false;if(current.startsWith("blob:"))URL.revokeObjectURL(current);};},[source]);
  return url?<img className="le-board-image" src={url} alt={alt} loading="lazy" onError={()=>{setError("Image unavailable");setUrl("");}}/>:<div className="le-image-placeholder">{error||"Loading image..."}</div>;
}
export function ImageUpload({value,onChange,onBusy}:{value:string;onChange:(source:string)=>void;onBusy?:(busy:boolean)=>void}) {
  const {account}=useLife();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
  async function upload(file:File) {
    setError("");
    setBusy(true);onBusy?.(true);
    try { onChange(await uploadMediaFile(file,{account})); }
    catch(e){setError(e instanceof Error?e.message:"Image could not be saved. Try again.");}finally{setBusy(false);onBusy?.(false);}
  }
  return <div className="le-field"><label>Upload image<input aria-label="Upload image" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}}/></label>{busy&&<p role="status">Saving image...</p>}{error&&<p role="alert">{error}</p>}{value&&<MediaImage source={value} alt="Selected image"/>}</div>;
}

export function MultiImageUpload({ values, onChange, onBusy, max = 6, label = "Images" }: { values: string[]; onChange: (sources: string[]) => void; onBusy?: (busy: boolean) => void; max?: number; label?: string }) {
  const { account } = useLife();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const incoming = Array.from(files);
    const room = max - values.length;
    if (room <= 0 || incoming.length > room) {
      setError(`You can upload up to ${max} images for one vision item.`);
      return;
    }
    setBusy(true); onBusy?.(true);
    const added: string[] = [];
    const failures: string[] = [];
    for (const file of incoming) {
      try { added.push(await uploadMediaFile(file, { account })); }
      catch (e) { failures.push(`${file.name}: ${e instanceof Error ? e.message : "Image could not be saved. Try again."}`); }
    }
    if (added.length) onChange([...values, ...added].slice(0, max));
    if (failures.length) setError(failures.length === 1 ? failures[0] : `${failures.length} images could not be added. ${failures[0]}`);
    setBusy(false); onBusy?.(false);
  }
  function remove(source: string) {
    onChange(values.filter(item => item !== source));
  }
  return <section className="le-multi-image-upload" aria-label={label}>
    <div className="le-row">
      <div><p className="le-eyebrow">{label}</p><p className="le-muted">Add up to {max} images. They will stay together as one mini collage.</p></div>
      <label className={`le-photo-add ${busy ? "is-busy" : ""}`}><ImagePlus size={16} />{busy ? "Adding..." : "Add images"}<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || values.length >= max} onChange={e => { void add(e.target.files); e.currentTarget.value = ""; }} /></label>
    </div>
    {values.length >= max && <p className="le-muted">Image limit reached.</p>}
    {error && <p role="alert" className="le-error">{error}</p>}
    {values.length > 0 && <div className="le-vision-image-editor-grid">{values.map((source, index) => <figure key={`${source}-${index}`} className="le-vision-image-editor-tile">
      <MediaImage source={source} alt={`Vision image ${index + 1}`} />
      <figcaption><span>Image {index + 1}</span><button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => remove(source)}><X size={15} /></button></figcaption>
    </figure>)}</div>}
  </section>;
}
