"use client";
import { useEffect, useState } from "react";
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
