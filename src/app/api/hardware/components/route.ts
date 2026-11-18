import { NextResponse } from "next/server";
import { pool } from "@/lib/auth";
import { getOwnerContext, hasTrustedMutationOrigin } from "@/lib/server/owner";

export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store, max-age=0"};
const units=["pcs","m","cm","g","kg","ml","l","set","roll"];

export async function GET(){
 const owner=await getOwnerContext();
 if(!owner.ok)return NextResponse.json({error:owner.error},{status:owner.status,headers:noStore});
 try{
  const result=await pool.query(
   "SELECT id,category,name,manufacturer,part_number,description,package,datasheet_url,quantity_on_hand,minimum_stock,unit,storage_location,unit_cost,currency,notes,updated_at,(quantity_on_hand<=minimum_stock) AS low_stock FROM hardware_components WHERE owner_id=$1 ORDER BY category,name LIMIT 500",
   [owner.ownerId]
  );
  const movements=await pool.query("SELECT m.id,m.component_id,c.name AS component_name,c.part_number,m.movement_type,m.quantity_delta,m.reason,m.created_at FROM hardware_stock_movements m JOIN hardware_components c ON c.id=m.component_id AND c.owner_id=m.owner_id WHERE m.owner_id=$1 ORDER BY m.created_at DESC LIMIT 30",[owner.ownerId]);
  return NextResponse.json({components:result.rows,movements:movements.rows},{headers:noStore});
 }catch{return NextResponse.json({error:"Hardware inventory is unavailable. Apply migration 0002 first."},{status:503,headers:noStore});}
}

export async function POST(request:Request){
 if(!hasTrustedMutationOrigin(request))return NextResponse.json({error:"Request origin is not allowed."},{status:403,headers:noStore});
 const owner=await getOwnerContext();if(!owner.ok)return NextResponse.json({error:owner.error},{status:owner.status,headers:noStore});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Valid JSON is required."},{status:400,headers:noStore});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Component details are required."},{status:400,headers:noStore});
 const v=body as Record<string,unknown>;
 const str=(k:string,max:number)=>typeof v[k]==="string"?(v[k] as string).trim().slice(0,max):"";
 const name=str("name",180),part=str("partNumber",120),category=str("category",80)||"Other";
 const manufacturer=str("manufacturer",160),description=str("description",3000),pkg=str("package",80),location=str("storageLocation",160),notes=str("notes",3000);
 const unit=units.includes(String(v.unit))?String(v.unit):"pcs";
 const qty=Number(v.quantityOnHand??0),min=Number(v.minimumStock??0),cost=v.unitCost===""||v.unitCost==null?null:Number(v.unitCost);
 let datasheet:string|null=null;
 if(typeof v.datasheetUrl==="string"&&v.datasheetUrl.trim()){try{const u=new URL(v.datasheetUrl.trim());if(u.protocol!=="https:")throw new Error();datasheet=u.toString();}catch{return NextResponse.json({error:"Datasheet URL must be a valid HTTPS link."},{status:400,headers:noStore});}}
 if(!name||!part||!Number.isFinite(qty)||qty<0||!Number.isFinite(min)||min<0||(cost!==null&&(!Number.isFinite(cost)||cost<0)))return NextResponse.json({error:"Name, part number and non-negative stock values are required."},{status:400,headers:noStore});
 try{
  const result=await pool.query(
   `WITH created AS (
     INSERT INTO hardware_components(owner_id,category,name,manufacturer,part_number,description,package,datasheet_url,quantity_on_hand,minimum_stock,unit,storage_location,unit_cost,currency,notes)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *
   ),
   logged AS (
     INSERT INTO activity_events(owner_id,actor_type,event_type,resource_type,resource_id,summary,details)
     SELECT $1,'owner','hardware_component.created','hardware_component',id::text,
            'Added hardware component: ' || name,
            jsonb_build_object('part_number',part_number,'category',category)
     FROM created
   )
   SELECT * FROM created`,
   [owner.ownerId,category,name,manufacturer,part,description,pkg,datasheet,qty,min,unit,location,cost,str("currency",3).toUpperCase()||"NPR",notes]
  );
  return NextResponse.json({component:result.rows[0]},{status:201,headers:noStore});
 }catch(e){const code=(e as {code?:string})?.code;return NextResponse.json({error:code==="23505"?"That part number already exists in your inventory.":"Component could not be saved."},{status:code==="23505"?409:503,headers:noStore});}
}

export async function PATCH(request:Request){
 if(!hasTrustedMutationOrigin(request))return NextResponse.json({error:"Request origin is not allowed."},{status:403,headers:noStore});
 const owner=await getOwnerContext();if(!owner.ok)return NextResponse.json({error:owner.error},{status:owner.status,headers:noStore});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Valid JSON is required."},{status:400,headers:noStore});}
 if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid stock adjustment."},{status:400,headers:noStore});
 const v=body as Record<string,unknown>,id=typeof v.id==="string"?v.id:"",delta=Number(v.delta);
 if(!/^[0-9a-f-]{36}$/i.test(id)||!Number.isFinite(delta)||delta===0||Math.abs(delta)>1000000)return NextResponse.json({error:"A valid component and non-zero stock adjustment are required."},{status:400,headers:noStore});
 try{
  const reason=typeof v.reason==="string"?v.reason.trim().slice(0,300):"Manual stock adjustment";
  const movementType=delta>0?"stock_in":"stock_out";
  const result=await pool.query(
   "WITH updated AS (UPDATE hardware_components SET quantity_on_hand=quantity_on_hand+$3,updated_at=now() WHERE id=$1 AND owner_id=$2 AND quantity_on_hand+$3>=0 RETURNING id,owner_id,name,part_number,quantity_on_hand,minimum_stock,unit), movement AS (INSERT INTO hardware_stock_movements(owner_id,component_id,movement_type,quantity_delta,reason) SELECT owner_id,id,$4,$3,$5 FROM updated RETURNING id) SELECT updated.*,movement.id AS movement_id FROM updated CROSS JOIN movement",
   [id,owner.ownerId,delta,movementType,reason||"Manual stock adjustment"]
  );
  if(!result.rowCount)return NextResponse.json({error:"Component not found or adjustment would make stock negative."},{status:409,headers:noStore});
  return NextResponse.json({component:result.rows[0]},{headers:noStore});
 }catch{return NextResponse.json({error:"Stock could not be adjusted."},{status:503,headers:noStore});}
}
