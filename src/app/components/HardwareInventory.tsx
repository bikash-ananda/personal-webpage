"use client";
import { FormEvent,useCallback,useEffect,useState } from "react";
import { CircuitBoard, Plus, RefreshCw, Package, AlertTriangle, ClipboardList, ExternalLink } from "lucide-react";

type Component={id:string;category:string;name:string;manufacturer:string;part_number:string;description:string;package:string;datasheet_url:string|null;quantity_on_hand:string;minimum_stock:string;unit:string;storage_location:string;unit_cost:string|null;currency:string;notes:string;low_stock:boolean};
type Project={id:string;name:string};
type Movement={id:string;component_id:string;component_name:string;part_number:string;movement_type:string;quantity_delta:string;reason:string;created_at:string};
type BomItem={id:string;project_id:string;project_name:string;component_id:string;component_name:string;part_number:string;manufacturer:string;quantity_on_hand:string;unit:string;quantity_required:string;reference_designator:string;notes:string;shortage:string};
const field:React.CSSProperties={width:"100%",minHeight:40,padding:"9px 11px",border:"1px solid var(--line)",borderRadius:8,background:"#0b1322",color:"var(--text)",font:"12px 'DM Sans',sans-serif"};
const btn:React.CSSProperties={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,minHeight:37,padding:"0 12px",border:0,borderRadius:8,background:"var(--mint)",color:"#092018",fontSize:10,fontWeight:700,cursor:"pointer"};
const soft:React.CSSProperties={...btn,background:"var(--panel2)",color:"var(--text)",border:"1px solid var(--line)"};
const categories=["Resistor","Capacitor","Inductor","Diode","Transistor","MOSFET","IC / MCU","Sensor","Connector","Switch","Relay","Power supply","Display","PCB","Motor / Actuator","Wire / Cable","Mechanical","Tool","Other"];
export default function HardwareInventory({ readOnlyPreview = false }: { readOnlyPreview?: boolean }){
 const [components,setComponents]=useState<Component[]>([]),[projects,setProjects]=useState<Project[]>([]),[bom,setBom]=useState<BomItem[]>([]),[movements,setMovements]=useState<Movement[]>([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [showComponent,setShowComponent]=useState(false),[showBom,setShowBom]=useState(false);
 const [name,setName]=useState(""),[category,setCategory]=useState("IC / MCU"),[manufacturer,setManufacturer]=useState(""),[partNumber,setPartNumber]=useState(""),[pkg,setPkg]=useState(""),[description,setDescription]=useState(""),[datasheet,setDatasheet]=useState(""),[qty,setQty]=useState("1"),[minimum,setMinimum]=useState("1"),[unit,setUnit]=useState("pcs"),[location,setLocation]=useState(""),[cost,setCost]=useState(""),[notes,setNotes]=useState("");
 const [projectId,setProjectId]=useState(""),[componentId,setComponentId]=useState(""),[required,setRequired]=useState("1"),[refdes,setRefdes]=useState(""),[bomNotes,setBomNotes]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [a,b,c]=await Promise.all([fetch("/api/hardware/components",{cache:"no-store"}),fetch("/api/projects",{cache:"no-store"}),fetch("/api/hardware/bom",{cache:"no-store"})]);
   const [ad,bd,cd]=await Promise.all([a.json(),b.json(),c.json()]);
   if(!a.ok)throw new Error(ad.error||"Inventory could not be loaded.");
   if(!b.ok)throw new Error(bd.error||"Projects could not be loaded.");
   if(!c.ok)throw new Error(cd.error||"BOM could not be loaded.");
   setComponents(ad.components||[]);setMovements(ad.movements||[]);setProjects(bd.projects||[]);setBom(cd.items||[]);
  }catch(e){setError(e instanceof Error?e.message:"Hardware workspace unavailable.");}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{void load();},[load]);
 async function submitComponent(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setSaving(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/hardware/components",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,category,manufacturer,partNumber,package:pkg,description,datasheetUrl:datasheet,quantityOnHand:Number(qty),minimumStock:Number(minimum),unit,storageLocation:location,unitCost:cost===""?null:Number(cost),currency:"NPR",notes})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Component could not be saved.");
   setNotice("Added "+d.component.name+" to inventory.");setShowComponent(false);setName("");setPartNumber("");setManufacturer("");setDescription("");setDatasheet("");setQty("1");setMinimum("1");setLocation("");setCost("");setNotes("");await load();
  }catch(e){setError(e instanceof Error?e.message:"Save failed.");}finally{setSaving(false);}
 }
 async function adjustStock(id:string,delta:number){
  setError("");try{const r=await fetch("/api/hardware/components",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,delta,reason:delta>0?"Manual stock received":"Manual stock consumed"})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Stock adjustment failed.");await load();}catch(e){setError(e instanceof Error?e.message:"Stock adjustment failed.");}
 }
 async function submitBom(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setSaving(true);setError("");setNotice("");
  try{const r=await fetch("/api/hardware/bom",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId,componentId,quantityRequired:Number(required),referenceDesignator:refdes,notes:bomNotes})});const d=await r.json();if(!r.ok)throw new Error(d.error||"BOM item could not be saved.");setNotice("Component added to project BOM.");setShowBom(false);setRequired("1");setRefdes("");setBomNotes("");await load();}
  catch(e){setError(e instanceof Error?e.message:"BOM save failed.");}finally{setSaving(false);}
 }
 const low=components.filter(c=>Number(c.quantity_on_hand)<=Number(c.minimum_stock)).length;
 return <div style={{maxWidth:1100,marginTop:25}}>{readOnlyPreview ? <section className="panel preview-module"><div className="panel-title">Electronics inventory preview</div><p className="panel-sub">Browse the inventory, stock-control and project BOM interface. Private component records and stock adjustments are hidden until owner sign-in.</p><div className="preview-module-grid"><span>Component catalogue</span><span>Datasheets & MPNs</span><span>Stock level alerts</span><span>Project bill of materials</span><span>Stock movement audit</span></div></section> : <>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:18}}>
   <div><div className="eyebrow">ENGINEERING / ELECTRONICS LAB</div><h2 style={{font:"700 20px Manrope",margin:"7px 0"}}>Component inventory & project BOM</h2><p className="muted" style={{fontSize:11,margin:0}}>Track parts, datasheets, stock and which projects consume each component.</p></div>
   <div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button style={soft} onClick={()=>void load()} disabled={loading}><RefreshCw size={13}/> Refresh</button><button style={soft} onClick={()=>setShowBom(v=>!v)}><ClipboardList size={13}/> Add to BOM</button><button style={btn} onClick={()=>setShowComponent(v=>!v)}><Plus size={13}/> Add component</button></div>
  </div>
  {error&&<div role="alert" className="panel" style={{color:"#f49a9a",fontSize:11,marginBottom:12}}>{error}</div>}
  {notice&&<div role="status" className="panel" style={{color:"var(--mint)",fontSize:11,marginBottom:12}}>{notice}</div>}
  <div className="stats" style={{gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginBottom:15}}>
   <div className="stat"><div className="stat-head">Unique components</div><div className="stat-value">{components.length}</div><div className="stat-foot">Parts in your inventory</div></div>
   <div className="stat"><div className="stat-head">Low stock alerts</div><div className="stat-value" style={{color:low?"#f4c879":"var(--mint)"}}>{low}</div><div className="stat-foot">At or below minimum stock</div></div>
   <div className="stat"><div className="stat-head">BOM lines</div><div className="stat-value">{bom.length}</div><div className="stat-foot">Across your projects</div></div>
  </div>
  {showComponent&&<form className="panel" onSubmit={submitComponent} style={{display:"grid",gap:11,marginBottom:15}}>
   <div className="panel-title">Register an electronic or hardware component</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
    <label className="form-label">Component name<input required maxLength={180} style={field} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. ESP32-WROOM-32"/></label>
    <label className="form-label">Category<select style={field} value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="form-label">Manufacturer<input style={field} value={manufacturer} onChange={e=>setManufacturer(e.target.value)} placeholder="Espressif, TI, ST…"/></label>
    <label className="form-label">Part number / SKU<input required style={field} value={partNumber} onChange={e=>setPartNumber(e.target.value)} placeholder="Exact MPN"/></label>
    <label className="form-label">Package / footprint<input style={field} value={pkg} onChange={e=>setPkg(e.target.value)} placeholder="SMD 0603, DIP-8…"/></label>
    <label className="form-label">Datasheet URL<input type="url" style={field} value={datasheet} onChange={e=>setDatasheet(e.target.value)} placeholder="https://…"/></label>
    <label className="form-label">Quantity on hand<input required type="number" min="0" step="0.001" style={field} value={qty} onChange={e=>setQty(e.target.value)}/></label>
    <label className="form-label">Minimum stock<input required type="number" min="0" step="0.001" style={field} value={minimum} onChange={e=>setMinimum(e.target.value)}/></label>
    <label className="form-label">Unit<select style={field} value={unit} onChange={e=>setUnit(e.target.value)}>{["pcs","m","cm","g","kg","ml","l","set","roll"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="form-label">Storage location<input style={field} value={location} onChange={e=>setLocation(e.target.value)} placeholder="Cabinet A · Drawer 3"/></label>
    <label className="form-label">Unit cost (NPR)<input type="number" min="0" step="0.01" style={field} value={cost} onChange={e=>setCost(e.target.value)} placeholder="Optional"/></label>
   </div>
   <label className="form-label">Description<textarea style={{...field,minHeight:65}} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Voltage, tolerance, ratings, pin count, use…"/></label>
   <label className="form-label">Notes<textarea style={{...field,minHeight:55}} value={notes} onChange={e=>setNotes(e.target.value)}/></label>
   <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" style={soft} onClick={()=>setShowComponent(false)}>Cancel</button><button type="submit" style={btn} disabled={saving}>{saving?"Saving…":"Save component"}</button></div>
  </form>}
  {showBom&&<form className="panel" onSubmit={submitBom} style={{display:"grid",gap:11,marginBottom:15}}>
   <div className="panel-title">Add component to a project bill of materials</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}>
    <label className="form-label">Project<select required style={field} value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Select project…</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label className="form-label">Component<select required style={field} value={componentId} onChange={e=>setComponentId(e.target.value)}><option value="">Select component…</option>{components.map(c=><option key={c.id} value={c.id}>{c.part_number} · {c.name}</option>)}</select></label>
    <label className="form-label">Required quantity<input required type="number" min="0.001" step="0.001" style={field} value={required} onChange={e=>setRequired(e.target.value)}/></label>
    <label className="form-label">Reference designator<input style={field} value={refdes} onChange={e=>setRefdes(e.target.value)} placeholder="R1, C3, U1…"/></label>
   </div>
   <label className="form-label">Notes<input style={field} value={bomNotes} onChange={e=>setBomNotes(e.target.value)} placeholder="Optional assembly notes"/></label>
   {(!projects.length||!components.length)&&<p className="muted" style={{fontSize:10}}>Add at least one project and one component before creating a BOM line.</p>}
   <div style={{display:"flex",justifyContent:"flex-end",gap:8}}><button type="button" style={soft} onClick={()=>setShowBom(false)}>Cancel</button><button type="submit" style={btn} disabled={saving||!projects.length||!components.length}>{saving?"Saving…":"Add BOM item"}</button></div>
  </form>}
  <section className="panel" style={{marginBottom:15}}>
   <div className="panel-head"><div><div className="panel-title"><Package size={14} style={{display:"inline",verticalAlign:"middle",marginRight:7}}/>Component catalogue</div><div className="panel-sub">{loading?"Loading…":components.length+" parts · stock values stored in your private workspace"}</div></div><span className="text-link">INVENTORY</span></div>
   {!loading&&!components.length?<div style={{padding:24,textAlign:"center"}}><CircuitBoard size={23} color="#91baff"/><div className="panel-title" style={{marginTop:9}}>Your component inventory is empty</div><p className="panel-sub">Register ICs, resistors, capacitors, sensors, modules, connectors, tools and hardware parts.</p></div>:components.map(c=><div className="task-row" key={c.id} style={{alignItems:"flex-start"}}>
    <span className="agent-icon"><CircuitBoard size={15}/></span><div style={{minWidth:0,flex:1}}><div className="task-name" style={{fontWeight:700}}>{c.name} <span className="task-meta">· {c.part_number}</span></div><div className="task-meta">{c.category} · {c.manufacturer||"Manufacturer not set"}{c.package?" · "+c.package:""}</div><div className="task-meta">STOCK {Number(c.quantity_on_hand)} {c.unit} · MIN {Number(c.minimum_stock)} · {c.storage_location||"Location not set"}</div>{c.datasheet_url&&<a href={c.datasheet_url} target="_blank" rel="noreferrer" className="text-link" style={{fontSize:10}}>DATASHEET <ExternalLink size={10} style={{display:"inline"}}/></a>}</div>
    <div style={{display:"grid",gap:5,justifyItems:"end"}}>{c.low_stock&&<span className="priority" style={{color:"#f4c879"}}><AlertTriangle size={11} style={{display:"inline"}}/> LOW</span>}<div style={{display:"flex",gap:4}}><button type="button" style={{...soft,minHeight:27,padding:"0 8px"}} aria-label={"Remove one "+c.name} onClick={()=>void adjustStock(c.id,-1)}>−</button><button type="button" style={{...soft,minHeight:27,padding:"0 8px"}} aria-label={"Add one "+c.name} onClick={()=>void adjustStock(c.id,1)}>+</button></div></div>
   </div>)}
  </section>
  <section className="panel" style={{marginBottom:15}}>
   <div className="panel-head"><div><div className="panel-title">Stock movement history</div><div className="panel-sub">Append-only record of manual stock receipts and consumption</div></div><span className="text-link">AUDIT</span></div>
   {!movements.length?<div className="muted" style={{padding:16,fontSize:11}}>No stock movements recorded yet.</div>:movements.map(m=><div className="task-row" key={m.id}><span className="agent-icon"><Package size={14}/></span><div style={{minWidth:0,flex:1}}><div className="task-name" style={{fontWeight:700}}>{m.component_name} · {m.part_number}</div><div className="task-meta">{m.reason} · {new Date(m.created_at).toLocaleString()}</div></div><span className="priority" style={{color:Number(m.quantity_delta)>0?"var(--mint)":"#f4c879"}}>{Number(m.quantity_delta)>0?"+":""}{Number(m.quantity_delta)}</span></div>)}
  </section>
  <section className="panel">
   <div className="panel-head"><div><div className="panel-title"><ClipboardList size={14} style={{display:"inline",verticalAlign:"middle",marginRight:7}}/>Project bill of materials</div><div className="panel-sub">Required quantities compared with current inventory stock</div></div><span className="text-link">BOM</span></div>
   {!bom.length?<div className="muted" style={{padding:20,fontSize:11}}>No BOM items yet. Add components to projects to track requirements and shortages.</div>:bom.map(b=><div className="task-row" key={b.id}><span className="agent-icon"><ClipboardList size={14}/></span><div style={{minWidth:0,flex:1}}><div className="task-name" style={{fontWeight:700}}>{b.project_name} · {b.component_name}</div><div className="task-meta">{b.part_number}{b.reference_designator?" · "+b.reference_designator:""} · Required {Number(b.quantity_required)} {b.unit} · In stock {Number(b.quantity_on_hand)} {b.unit}</div></div><span className="priority" style={{color:Number(b.shortage)>0?"#f4c879":"var(--mint)"}}>{Number(b.shortage)>0?"SHORT "+Number(b.shortage):"AVAILABLE"}</span></div>)}
  </section>
  <p className="muted" style={{fontSize:10,lineHeight:1.7,marginTop:12}}>Inventory, BOM and append-only stock movements are owner-scoped. Purchase orders, suppliers and multi-location stock are planned for a later release.</p>
 </div>;
}
