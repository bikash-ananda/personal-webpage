import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store, max-age=0"};

export async function GET(request:Request){
 const owner=await getOwnerContext();if(!owner.ok)return NextResponse.json({error:owner.error},{status:owner.status,headers:noStore});
 const url=new URL(request.url),projectId=url.searchParams.get("projectId");
 if(projectId&&!/^[0-9a-f-]{36}$/i.test(projectId))return NextResponse.json({error:"Invalid project ID."},{status:400,headers:noStore});
 try{
  const result=await pool.query(
   "SELECT b.id,b.project_id,p.name AS project_name,b.component_id,c.name AS component_name,c.part_number,c.manufacturer,c.quantity_on_hand,c.unit,b.quantity_required,b.reference_designator,b.notes, GREATEST(b.quantity_required-c.quantity_on_hand,0) AS shortage FROM project_bom_items b JOIN personal_projects p ON p.id=b.project_id AND p.owner_id=b.owner_id JOIN hardware_components c ON c.id=b.component_id AND c.owner_id=b.owner_id WHERE b.owner_id=$1 AND ($2::uuid IS NULL OR b.project_id=$2) ORDER BY p.name,c.name LIMIT 1000",
   [owner.ownerId,projectId]
  );
  return NextResponse.json({items:result.rows},{headers:noStore});
 }catch{return NextResponse.json({error:"BOM data is unavailable. Apply migration 0002 first."},{status:503,headers:noStore});}
}

export async function POST(request:Request){
 if(!hasTrustedMutationOrigin(request))return NextResponse.json({error:"Request origin is not allowed."},{status:403,headers:noStore});
 const owner=await getOwnerContext();if(!owner.ok)return NextResponse.json({error:owner.error},{status:owner.status,headers:noStore});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Valid JSON is required."},{status:400,headers:noStore});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"BOM item details are required."},{status:400,headers:noStore});
 const v=body as Record<string,unknown>,projectId=typeof v.projectId==="string"?v.projectId:"",componentId=typeof v.componentId==="string"?v.componentId:"",quantity=Number(v.quantityRequired);
 const ref=typeof v.referenceDesignator==="string"?v.referenceDesignator.trim().slice(0,120):"",notes=typeof v.notes==="string"?v.notes.trim().slice(0,2000):"";
 if(!/^[0-9a-f-]{36}$/i.test(projectId)||!/^[0-9a-f-]{36}$/i.test(componentId)||!Number.isFinite(quantity)||quantity<=0||quantity>1000000)return NextResponse.json({error:"Select a project and component, and enter a positive required quantity."},{status:400,headers:noStore});
 try{
  const result=await pool.query(
   "INSERT INTO project_bom_items(owner_id,project_id,component_id,quantity_required,reference_designator,notes) SELECT $1,p.id,c.id,$4,$5,$6 FROM personal_projects p CROSS JOIN hardware_components c WHERE p.id=$2 AND p.owner_id=$1 AND p.archived_at IS NULL AND c.id=$3 AND c.owner_id=$1 RETURNING id,project_id,component_id,quantity_required,reference_designator,notes",
   [owner.ownerId,projectId,componentId,quantity,ref,notes]
  );
  if(!result.rowCount)return NextResponse.json({error:"Project or component was not found in your account."},{status:404,headers:noStore});
  return NextResponse.json({item:result.rows[0]},{status:201,headers:noStore});
 }catch(e){const code=(e as {code?:string})?.code;return NextResponse.json({error:code==="23505"?"This component and reference designator already exist in the project BOM.":"BOM item could not be saved."},{status:code==="23505"?409:503,headers:noStore});}
}
