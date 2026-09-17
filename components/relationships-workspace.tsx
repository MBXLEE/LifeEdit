"use client";
import { useState } from "react";
import { useLife,today } from "@/lib/life-store";
import { Heading,Card,Button } from "./workspace-ui";
import { RecordManager,CategoryManager } from "./record-manager";
export function RelationshipsWorkspace() {
  const {data}=useLife();const [settings,setSettings]=useState(false);const due=data.relationships.filter(r=>!r.archived&&r.followUp&&r.followUp<=today());
  return <><Heading section="People who matter" title="Connection, with intention."><Button secondary onClick={()=>setSettings(!settings)}>Relationship types</Button></Heading>{settings&&<CategoryManager categoryKey="relationshipTypes" title="Relationship types"/>}{due.length>0&&<Card><h2>A little time to reconnect.</h2><p className="le-muted mt-4">Check-ins due: {due.map(r=>`${r.name} (${r.followUp})`).join(", ")}</p></Card>}<RecordManager collection="relationships" title="Relationships" singular="relationship" fields={[{key:"name",label:"Name",required:true},{key:"type",label:"Relationship type",type:"select",options:data.relationshipTypes},{key:"importance",label:"Importance level",type:"select",options:["Close circle","Important","Occasional"]},{key:"birthday",label:"Birthday",type:"date"},{key:"lastContact",label:"Last contact date",type:"date"},{key:"followUp",label:"Next check-in date",type:"date"},{key:"conversations",label:"Conversation notes",type:"textarea"},{key:"goal",label:"Shared or monthly connection goal",type:"textarea"},{key:"dateIdeas",label:"Date or catch-up ideas",type:"textarea"},{key:"giftIdeas",label:"Gift ideas",type:"textarea"},{key:"memories",label:"Important memories",type:"textarea"},{key:"notes",label:"Personal notes",type:"textarea"}]}/></>;
}
