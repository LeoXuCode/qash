import { useState, useMemo, useEffect } from "react";

const FALLBACK_RATES = { NOK:1, USD:0.091, EUR:0.085, GBP:0.073, CNY:0.66, SEK:1.01, DKK:0.63, JPY:13.5, KRW:125 };
const SYM = { NOK:"kr", USD:"$", EUR:"€", GBP:"£", CNY:"¥", SEK:"kr", DKK:"kr", JPY:"¥", KRW:"₩" };

async function fetchLiveRates() {
  const res = await fetch("https://api.frankfurter.app/latest?from=NOK&to=USD,EUR,GBP,CNY,SEK,DKK,JPY,KRW");
  const data = await res.json();
  return { NOK:1, ...data.rates };
}

let RATES = { ...FALLBACK_RATES };
const toNOK = (a,c) => a/(RATES[c]||1);
const fromNOK = (a,c) => a*(RATES[c]||1);
const fmt = n => n.toLocaleString("en-US",{maximumFractionDigits:0});
const fmt2 = n => n.toLocaleString("en-US",{maximumFractionDigits:2});
const fmtK = n => n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(0)+"k":fmt(n);

function evalMath(str) {
  if (!str && str !== 0) return str;
  const s = String(str).trim();
  if (s === "") return s;
  if (/[^0-9+\-*/.() ]/.test(s)) return s;
  try {
    const tokens = [];
    let num = "";
    for (let ci = 0; ci < s.length; ci++) {
      const ch = s[ci];
      if (/[0-9.]/.test(ch)) {
        num += ch;
      } else {
        if (num !== "") { tokens.push({ t:"n", v:parseFloat(num) }); num = ""; }
        if (/[+\-*/]/.test(ch)) tokens.push({ t:"op", v:ch });
      }
    }
    if (num !== "") tokens.push({ t:"n", v:parseFloat(num) });
    if (tokens.length === 0) return s;
    const pass1 = [];
    let pi = 0;
    while (pi < tokens.length) {
      if (tokens[pi].t === "op" && (tokens[pi].v === "*" || tokens[pi].v === "/")) {
        const prev = pass1.pop();
        const next = tokens[pi+1];
        if (!prev || !next) return s;
        const rv = tokens[pi].v === "*" ? prev.v * next.v : next.v !== 0 ? prev.v / next.v : null;
        if (rv === null) return s;
        pass1.push({ t:"n", v:rv });
        pi += 2;
      } else {
        pass1.push(tokens[pi]);
        pi++;
      }
    }
    let result = pass1[0] ? pass1[0].v : 0;
    let qi = 1;
    while (qi < pass1.length) {
      const op = pass1[qi];
      const right = pass1[qi+1];
      if (!op || !right) break;
      if (op.v === "+") result += right.v;
      else if (op.v === "-") result -= right.v;
      qi += 2;
    }
    if (!isFinite(result)) return s;
    return String(Math.round(result * 10000) / 10000);
  } catch(err) { return s; }
}

const T = {
  en: {
    appTitle:"Qash", netMonth:"Net this month", batchProfit:"Batch profit",
    otherIncome:"Other income", expenses:"Expenses", inventory:"Inventory (holding)",
    activeBatches:"active batches", holding:"Holding",
    yourBatches:"Your batches", newBatch:"+ New batch", cancel:"Cancel",
    batchName:"Batch name", sold:"Sold", itemLabel:"Item",
    qty:"Qty", buyPerUnit:"Buy price / unit", sellPerUnit:"Sell price / unit",
    addItem:"+ Add another item", addBatch:"Add batch", otherTx:"Other income / expenses",
    add:"+ Add", income:"Income", expense:"Expense", description:"Description",
    amount:"Amount", category:"Category", markSold:"Mark as sold", enterSellPrices:"Enter sell prices",
    sellPerUnitLbl:"Sell price per unit", confirmSale:"Confirm sale", delete:"Delete",
    keep:"Keep", units:"units", totalCost:"Total cost", revenue:"Revenue",
    currentTrajectory:"Current trajectory", perYear:"kr/year", basedOn:"Based on",
    perMonth:"kr/month", annualGrowth:"Annual growth rate", conservative:"Conservative",
    aggressive:"Aggressive", milestones:"Milestones", fiveYear:"5-year projection",
    next:"Next:", yearsAt:"years at", growth:"growth",
    settings:"Settings", language:"Language", defaultCurrency:"Default currency",
    categories:"Categories", manageCategories:"Manage your batch categories",
    addCategory:"+ Add category", categoryName:"Category name", noCat:"No category",
    groupedView:"Category breakdown", allBatches:"All", totalProfit:"Total profit",
    batches:"batches", home:"Home", forecast:"Forecast", calculator:"Tools",
    itemOptional:"Item name (optional)",
    profitCalc:"Profit", currencyConv:"Currency", roiCalc:"ROI", breakEven:"Break-even", basicCalc:"Calculator",
    buyPrice:"Buy price", sellPrice:"Sell price", fees:"Fees / shipping",
    profit:"Profit", margin:"Margin", roi:"ROI", from:"From", to:"To",
    investment:"Investment", returnAmt:"Return",
    fixedCosts:"Fixed costs", variableCost:"Variable cost / unit", pricePerUnit:"Price / unit",
    unitsNeeded:"Units to break even",
  },
  no: {
    appTitle:"Qash", netMonth:"Netto denne måneden", batchProfit:"Batch-profitt",
    otherIncome:"Annen inntekt", expenses:"Utgifter", inventory:"Lager (holding)",
    activeBatches:"aktive batches", holding:"Holding",
    yourBatches:"Dine batches", newBatch:"+ Ny batch", cancel:"Avbryt",
    batchName:"Batch-navn", sold:"Solgt", itemLabel:"Produkt",
    qty:"Ant.", buyPerUnit:"Kjøpspris / enhet", sellPerUnit:"Salgspris / enhet",
    addItem:"+ Legg til produkt", addBatch:"Legg til batch", otherTx:"Annen inntekt / utgift",
    add:"+ Legg til", income:"Inntekt", expense:"Utgift", description:"Beskrivelse",
    amount:"Beløp", category:"Kategori", markSold:"Merk som solgt", enterSellPrices:"Skriv inn salgspriser",
    sellPerUnitLbl:"Salgspris per enhet", confirmSale:"Bekreft salg", delete:"Slett",
    keep:"Behold", units:"enheter", totalCost:"Total kostnad", revenue:"Inntekt",
    currentTrajectory:"Nåværende bane", perYear:"kr/år", basedOn:"Basert på",
    perMonth:"kr/mnd", annualGrowth:"Årlig vekstrate", conservative:"Forsiktig",
    aggressive:"Aggressiv", milestones:"Milepæler", fiveYear:"5-års projeksjon",
    next:"Neste:", yearsAt:"år med", growth:"vekst",
    settings:"Innstillinger", language:"Språk", defaultCurrency:"Standardvaluta",
    categories:"Kategorier", manageCategories:"Administrer batch-kategorier",
    addCategory:"+ Ny kategori", categoryName:"Kategorinavn", noCat:"Ingen kategori",
    groupedView:"Kategori-oversikt", allBatches:"Alle", totalProfit:"Total profitt",
    batches:"batches", home:"Hjem", forecast:"Prognose", calculator:"Tools",
    itemOptional:"Produktnavn (valgfritt)",
    profitCalc:"Profitt", currencyConv:"Valuta", roiCalc:"ROI", breakEven:"Break-even", basicCalc:"Kalkulator",
    buyPrice:"Kjøpspris", sellPrice:"Salgspris", fees:"Avgifter / frakt",
    profit:"Profitt", margin:"Margin", roi:"ROI", from:"Fra", to:"Til",
    investment:"Investering", returnAmt:"Avkastning",
    fixedCosts:"Faste kostnader", variableCost:"Variabel kost / enhet", pricePerUnit:"Pris / enhet",
    unitsNeeded:"Enheter for break-even",
  },
};

const AGE_DATA = {
  "16-19":{med:45000,p25:15000,p75:85000,label:"16–19"},
  "20-24":{med:215000,p25:120000,p75:320000,label:"20–24"},
  "25-29":{med:380000,p25:280000,p75:480000,label:"25–29"},
  "30-34":{med:470000,p25:350000,p75:590000,label:"30–34"},
  "35-39":{med:530000,p25:400000,p75:670000,label:"35–39"},
};
const MILESTONES = [100000,250000,500000,750000,1000000];
const MILESTONE_LABELS = {
  en:["First 100k","Quarter Million","Half a Million","750k","Millionaire"],
  no:["Første 100k","Kvart million","Halv million","750k","Millionær"]
};
const DEFAULT_CATEGORIES = ["Pokémon","Sneakers","Electronics","Clothing","Other"];
const SAMPLE_BATCHES = [];
const SAMPLE_TX = [];

function batchTotals(b) {
  const cost = b.items.reduce((s,it) => s+toNOK(it.buyCost*it.qty,it.buyCur), 0);
  const rev  = b.items.reduce((s,it) => s+toNOK(it.sellPrice*it.qty,it.sellCur), 0);
  return {cost, rev, profit:rev-cost, margin:cost>0?(((rev-cost)/cost)*100).toFixed(0):0};
}

const iStyle = {
  width:"100%", padding:"12px 14px", background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, color:"#e8e8e8",
  fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
};
const sStyle = {...iStyle, appearance:"none"};
const qStyle = {
  padding:"6px 8px", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:8, color:"#e8e8e8", fontSize:13, fontFamily:"inherit", outline:"none", width:52, textAlign:"center",
};

const Card = ({children, style={}}) => (
  <div style={{background:"rgba(255,255,255,0.035)",borderRadius:20,padding:"16px 18px",border:"1px solid rgba(255,255,255,0.06)",...style}}>
    {children}
  </div>
);
const Label = ({children}) => (
  <div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,fontWeight:600}}>{children}</div>
);
const Pill = ({active, color, children, onClick, small}) => (
  <button onClick={onClick} style={{
    padding:small?"6px 12px":"8px 16px", borderRadius:99, cursor:"pointer", fontFamily:"inherit",
    fontSize:small?12:13, fontWeight:600, transition:"all 0.2s",
    background:active?(color+"20"):"rgba(255,255,255,0.04)",
    color:active?color:"#555",
    border:active?("1px solid "+color+"40"):"1px solid transparent",
  }}>{children}</button>
);
const CalcInput = ({label, value, onChange, suffix}) => (
  <div style={{marginBottom:12}}>
    <div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:1,marginBottom:6,fontWeight:600}}>{label}</div>
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <input type="number" value={value} onChange={e => onChange(e.target.value)}
        style={{...iStyle, paddingRight:suffix?40:14}}/>
      {suffix && <span style={{position:"absolute",right:14,color:"#666",fontSize:12}}>{suffix}</span>}
    </div>
  </div>
);
const ResRow = ({label, value, color}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
    <span style={{fontSize:12,color:"#888"}}>{label}</span>
    <span style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:color||"#4ade80"}}>{value}</span>
  </div>
);

const emptyItem = (cur) => ({id:Date.now()+Math.random(), name:"", qty:1, buyCost:"", buyCur:cur||"NOK", sellPrice:"", sellCur:cur||"NOK"});

function BasicCalc() {
  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [done, setDone] = useState(false);

  const press = (val) => {
    if (val === "C") { setDisplay("0"); setExpr(""); setDone(false); return; }
    if (val === "DEL") {
      if (done) { setDisplay("0"); setExpr(""); setDone(false); return; }
      const nx = display.length > 1 ? display.slice(0,-1) : "0";
      setDisplay(nx); setExpr(nx === "0" ? "" : nx); return;
    }
    if (val === "=") {
      const r = evalMath(expr);
      const n = parseFloat(r);
      if (!isNaN(n) && isFinite(n)) { setDisplay(r); setExpr(r); setDone(true); }
      return;
    }
    const isOp = val==="+"|val==="-"|val==="*"|val==="/";
    if (done && !isOp) { setDisplay(val); setExpr(val); setDone(false); return; }
    if (done && isOp) { setDone(false); setDisplay(expr+val); setExpr(expr+val); return; }
    const nx2 = (display==="0" && !isOp) ? val : expr+val;
    setDisplay(nx2); setExpr(nx2);
  };

  const ROWS = [
    [{l:"C",d:"C",t:"del"},{l:"DEL",d:"⌫",t:"del"},{l:"%",d:"%",t:"op"},{l:"/",d:"÷",t:"op"}],
    [{l:"7"},{l:"8"},{l:"9"},{l:"*",d:"×",t:"op"}],
    [{l:"4"},{l:"5"},{l:"6"},{l:"-",t:"op"}],
    [{l:"1"},{l:"2"},{l:"3"},{l:"+",t:"op"}],
    [{l:"0",d:"0",wide:true},{l:".",d:"."},{l:"=",d:"=",t:"eq"}],
  ];

  return (
    <div style={{borderRadius:20,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
      <div style={{background:"rgba(255,255,255,0.035)",padding:"24px 20px 16px",textAlign:"right"}}>
        <div style={{fontSize:12,color:"#555",minHeight:18,fontFamily:"'JetBrains Mono',monospace",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{expr||" "}</div>
        <div style={{fontSize:40,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#e8e8e8",lineHeight:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{display}</div>
      </div>
      <div style={{background:"rgba(255,255,255,0.025)",padding:"12px",display:"flex",flexDirection:"column",gap:8}}>
        {ROWS.map((row, ri) => (
          <div key={ri} style={{display:"grid",gridTemplateColumns:row.some(b => b.wide)?"2fr 1fr 1fr":"1fr 1fr 1fr 1fr",gap:8}}>
            {row.map((btn, bi) => {
              const t = btn.t || "num";
              return (
                <button key={bi} onClick={() => press(btn.l)} style={{
                  padding:"18px 0", borderRadius:14, border:"none", cursor:"pointer",
                  fontFamily:"'JetBrains Mono',monospace", fontWeight:700,
                  fontSize:t==="op"?20:t==="eq"?22:18,
                  background:t==="op"?"rgba(167,139,250,0.15)":t==="eq"?"#4ade80":t==="del"?"rgba(248,113,113,0.12)":"rgba(255,255,255,0.06)",
                  color:t==="op"?"#a78bfa":t==="eq"?"#000":t==="del"?"#f87171":"#e8e8e8",
                  gridColumn:btn.wide?"span 2":"span 1",
                }}>{btn.d!==undefined?btn.d:btn.l}</button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ToolsPage({tr}) {
  const [tab, setTab] = useState(0);
  const [pBuy,setPBuy] = useState(""); const [pSell,setPSell] = useState(""); const [pFees,setPFees] = useState(""); const [pQty,setPQty] = useState("1");
  const pProfit = (+pSell - +pBuy - +pFees) * (+pQty||1);
  const pMargin = +pBuy>0 ? ((+pSell-+pBuy-+pFees)/+pBuy*100) : 0;
  const pRoi    = +pBuy>0 ? (pProfit / (+pBuy*(+pQty||1))*100) : 0;

  const [cAmt,setCAmt] = useState(""); const [cFrom,setCFrom] = useState("CNY"); const [cTo,setCTo] = useState("NOK");
  const cNok = toNOK(+cAmt||0, cFrom);
  const cRes = fromNOK(cNok, cTo);

  const [rInv,setRInv] = useState(""); const [rRet,setRRet] = useState("");
  const rProfit = +rRet - +rInv;
  const rRoi = +rInv>0 ? (rProfit/+rInv*100) : 0;

  const [bFix,setBFix] = useState(""); const [bVar,setBVar] = useState(""); const [bPrc,setBPrc] = useState("");
  const bUnits = (+bPrc-+bVar)>0 ? Math.ceil(+bFix/(+bPrc-+bVar)) : null;

  const TABS = [tr.basicCalc, tr.profitCalc, tr.currencyConv, tr.roiCalc, tr.breakEven];

  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {TABS.map((t,i) => <Pill key={i} small active={tab===i} color="#4ade80" onClick={() => setTab(i)}>{t}</Pill>)}
      </div>

      {tab===0 && <BasicCalc/>}

      {tab===1 && (
        <Card>
          <CalcInput label={tr.buyPrice} value={pBuy} onChange={setPBuy} suffix="kr"/>
          <CalcInput label={tr.sellPrice} value={pSell} onChange={setPSell} suffix="kr"/>
          <CalcInput label={tr.fees} value={pFees} onChange={setPFees} suffix="kr"/>
          <CalcInput label={tr.qty} value={pQty} onChange={setPQty}/>
          {(+pBuy>0||+pSell>0) && (
            <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <ResRow label={tr.profit} value={(pProfit>=0?"+":"")+fmt2(pProfit)+" kr"} color={pProfit>=0?"#4ade80":"#f87171"}/>
              <ResRow label={tr.margin} value={fmt2(pMargin)+"%"} color={pMargin>=0?"#60a5fa":"#f87171"}/>
              <ResRow label={tr.roi} value={fmt2(pRoi)+"%"} color={pRoi>=0?"#a78bfa":"#f87171"}/>
            </div>
          )}
        </Card>
      )}

      {tab===2 && (
        <Card>
          <CalcInput label={tr.amount} value={cAmt} onChange={setCAmt}/>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <div style={{flex:1}}>
              <Label>{tr.from}</Label>
              <select value={cFrom} onChange={e => setCFrom(e.target.value)} style={sStyle}>
                {Object.keys(RATES).map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",paddingTop:28,color:"#555",fontSize:20}}>→</div>
            <div style={{flex:1}}>
              <Label>{tr.to}</Label>
              <select value={cTo} onChange={e => setCTo(e.target.value)} style={sStyle}>
                {Object.keys(RATES).map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
              </select>
            </div>
          </div>
          {+cAmt>0 && (
            <div style={{padding:"20px",borderRadius:14,textAlign:"center",background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.12)"}}>
              <div style={{fontSize:13,color:"#666",marginBottom:8}}>{fmt2(+cAmt)} {cFrom}</div>
              <div style={{fontSize:11,color:"#555",marginBottom:4}}>↓</div>
              <div style={{fontSize:32,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#4ade80"}}>{fmt2(cRes)} {SYM[cTo]}</div>
              {cFrom!=="NOK"&&cTo!=="NOK" && <div style={{fontSize:11,color:"#555",marginTop:8}}>via NOK: {fmt2(cNok)} kr</div>}
            </div>
          )}
        </Card>
      )}

      {tab===3 && (
        <Card>
          <CalcInput label={tr.investment} value={rInv} onChange={setRInv} suffix="kr"/>
          <CalcInput label={tr.returnAmt} value={rRet} onChange={setRRet} suffix="kr"/>
          {(+rInv>0||+rRet>0) && (
            <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              <ResRow label={tr.profit} value={(rProfit>=0?"+":"")+fmt2(rProfit)+" kr"} color={rProfit>=0?"#4ade80":"#f87171"}/>
              <ResRow label={tr.roi} value={fmt2(rRoi)+"%"} color={rRoi>=0?"#a78bfa":"#f87171"}/>
            </div>
          )}
          {+rInv>0&&+rRet>0 && (
            <div style={{marginTop:16,padding:"16px",borderRadius:14,textAlign:"center",background:rRoi>=0?"rgba(74,222,128,0.06)":"rgba(248,113,113,0.06)",border:"1px solid "+(rRoi>=0?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)")}}>
              <div style={{fontSize:40,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:rRoi>=0?"#4ade80":"#f87171"}}>{fmt2(rRoi)}%</div>
              <div style={{fontSize:11,color:"#666",marginTop:4}}>ROI</div>
            </div>
          )}
        </Card>
      )}

      {tab===4 && (
        <Card>
          <CalcInput label={tr.fixedCosts} value={bFix} onChange={setBFix} suffix="kr"/>
          <CalcInput label={tr.variableCost} value={bVar} onChange={setBVar} suffix="kr"/>
          <CalcInput label={tr.pricePerUnit} value={bPrc} onChange={setBPrc} suffix="kr"/>
          {bUnits!==null&&+bFix>0 && (
            <div style={{marginTop:16,padding:"20px",borderRadius:14,textAlign:"center",background:"rgba(96,165,250,0.06)",border:"1px solid rgba(96,165,250,0.12)"}}>
              <div style={{fontSize:11,color:"#666",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>{tr.unitsNeeded}</div>
              <div style={{fontSize:56,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#60a5fa",lineHeight:1}}>{bUnits}</div>
              <div style={{fontSize:11,color:"#555",marginTop:8}}>= {fmt2(bUnits*(+bPrc))} kr revenue</div>
            </div>
          )}
          {+bPrc>0&&+bVar>0&&+bPrc<=+bVar && (
            <div style={{marginTop:12,padding:"12px",borderRadius:12,background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.15)",fontSize:12,color:"#f87171",textAlign:"center"}}>
              Price must be higher than variable cost
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function BatchCard({b, t:tr, onExpand, expanded, onStartSell, sellingId, sellPrices, onSellPriceChange, onConfirmSell, onCancelSell, onDelete, confirmDelete, onConfirmDelete, onCancelDelete}) {
  const totals = batchTotals(b);
  const isExp = expanded===b.id;
  const isSelling = sellingId===b.id;
  return (
    <div style={{background:"rgba(255,255,255,0.035)",borderRadius:20,padding:"16px",border:"1px solid rgba(255,255,255,0.06)",marginBottom:10,cursor:"pointer"}}
      onClick={() => onExpand(b.id)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:600}}>{b.name}</div>
          <div style={{fontSize:11,color:"#555",marginTop:3,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            <span>{b.items.reduce((s,it) => s+it.qty, 0)} {tr.units} · {b.date}</span>
            {b.category && <span style={{padding:"2px 8px",borderRadius:99,fontSize:10,background:"rgba(167,139,250,0.12)",color:"#a78bfa",border:"1px solid rgba(167,139,250,0.2)"}}>{b.category}</span>}
            <span style={{color:"#444"}}>{isExp?"▲":"▼"}</span>
          </div>
        </div>
        {b.status==="sold" ? (
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:totals.profit>=0?"#4ade80":"#f87171"}}>{totals.profit>=0?"+":""}{fmt(totals.profit)} kr</div>
            <div style={{fontSize:10,color:totals.profit>=0?"#4ade8088":"#f8717188",marginTop:2}}>{totals.margin}% margin</div>
          </div>
        ) : (
          <div style={{padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:600,background:"#fbbf2418",color:"#fbbf24",border:"1px solid #fbbf2430"}}>{tr.holding} · {fmt(totals.cost)} kr</div>
        )}
      </div>
      {isExp && (
        <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)"}} onClick={e => e.stopPropagation()}>
          {isSelling && (
            <div style={{padding:"12px",marginBottom:12,borderRadius:12,background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.15)"}}>
              <div style={{fontSize:11,color:"#4ade80",fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>{tr.enterSellPrices}</div>
              {b.items.map((it,i) => (
                <div key={i} style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:"#999",marginBottom:4}}>{it.name||(tr.itemLabel+" "+(i+1))}{it.qty>1?" (×"+it.qty+")":""}</div>
                  <div style={{display:"flex",gap:6}}>
                    <input type="number" placeholder={tr.sellPerUnitLbl} value={(sellPrices[i]&&sellPrices[i].sellPrice)||""}
                      onChange={e => onSellPriceChange(i,"sellPrice",e.target.value)}
                      style={{...iStyle,flex:2,fontSize:13,padding:"10px 12px"}}/>
                    <select value={(sellPrices[i]&&sellPrices[i].sellCur)||"NOK"} onChange={e => onSellPriceChange(i,"sellCur",e.target.value)}
                      style={{...sStyle,flex:1,fontSize:13,padding:"10px 8px"}}>
                      {Object.keys(RATES).map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button onClick={onCancelSell} style={{flex:1,padding:"10px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,background:"none",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{tr.cancel}</button>
                <button onClick={() => onConfirmSell(b.id)} style={{flex:1,padding:"10px",border:"none",borderRadius:10,background:"#4ade80",color:"#000",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>{tr.confirmSale}</button>
              </div>
            </div>
          )}
          {!isSelling && b.items.map((it,i) => {
            const iCost = toNOK(it.buyCost*it.qty,it.buyCur);
            const iRev  = toNOK(it.sellPrice*it.qty,it.sellCur);
            return (
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<b.items.length-1?"1px solid rgba(255,255,255,0.03)":"none"}}>
                <div>
                  <div style={{fontSize:12,color:"#bbb"}}>{it.name||(tr.itemLabel+" "+(i+1))}{it.qty>1?" ×"+it.qty:""}</div>
                  <div style={{fontSize:10,color:"#444",marginTop:1}}>{fmt(it.buyCost)} {SYM[it.buyCur]}/unit{b.status==="sold"?" · "+fmt(it.sellPrice)+" "+SYM[it.sellCur]+"/unit":""}</div>
                </div>
                {b.status==="sold" && (
                  <div style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:(iRev-iCost)>=0?"#4ade80":"#f87171"}}>{(iRev-iCost)>=0?"+":""}{fmt(iRev-iCost)} kr</div>
                )}
              </div>
            );
          })}
          {!isSelling && (
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:11,color:"#888"}}>
              <span>{tr.totalCost}: {fmt(totals.cost)} kr</span>
              {b.status==="sold" && <span>{tr.revenue}: {fmt(totals.rev)} kr</span>}
            </div>
          )}
          {!isSelling && (
            <div style={{display:"flex",gap:8,marginTop:12}}>
              {b.status==="holding" && (
                <button onClick={() => onStartSell(b)} style={{flex:1,padding:"10px",border:"none",borderRadius:10,background:"rgba(74,222,128,0.12)",color:"#4ade80",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{tr.markSold}</button>
              )}
              {confirmDelete===("batch-"+b.id) ? (
                <div style={{flex:1,display:"flex",gap:6}}>
                  <button onClick={onCancelDelete} style={{flex:1,padding:"10px",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,background:"none",color:"#888",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{tr.keep}</button>
                  <button onClick={() => onDelete(b.id)} style={{flex:1,padding:"10px",border:"none",borderRadius:10,background:"rgba(248,113,113,0.2)",color:"#f87171",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{tr.delete}</button>
                </div>
              ) : (
                <button onClick={() => onConfirmDelete("batch-"+b.id)} style={{padding:"10px 16px",border:"none",borderRadius:10,background:"rgba(255,255,255,0.04)",color:"#555",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{tr.delete}</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [lang, setLang] = useState("en");
  const [defaultCur, setDefaultCur] = useState("NOK");
  const [batches, setBatches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qash_batches")||"[]"); } catch(e) { return []; }
  });
  const [txs, setTxs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qash_txs")||"[]"); } catch(e) { return []; }
  });
  const [age, setAge] = useState(20);
  const [growth, setGrowth] = useState(15);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [newCatInput, setNewCatInput] = useState("");
  const [activeCatFilter, setActiveCatFilter] = useState(null);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({name:"",status:"sold",category:"",items:[emptyItem("NOK")]});
  const [showAddTx, setShowAddTx] = useState(false);
  const [txForm, setTxForm] = useState({type:"income",desc:"",amount:"",cur:"NOK",cat:"Work"});
  const [expanded, setExpanded] = useState(null);
  const [sellingBatch, setSellingBatch] = useState(null);
  const [sellPrices, setSellPrices] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchLiveRates()
      .then(r => { RATES=r; setRatesLoaded(true); setTick(n => n+1); })
      .catch(() => setRatesLoaded(false));
  }, []);

  useEffect(() => { try { localStorage.setItem("qash_batches", JSON.stringify(batches)); } catch(e) {} }, [batches]);
  useEffect(() => { try { localStorage.setItem("qash_txs", JSON.stringify(txs)); } catch(e) {} }, [txs]);

  const currentMonth = new Date().toLocaleDateString(lang==="no"?"nb-NO":"en-US",{month:"long",year:"numeric"});
  const tr = T[lang];
  const sortedBatches = useMemo(() => [...batches].sort((a,b) => b.date.localeCompare(a.date)), [batches]);
  const batchProfit = useMemo(() => batches.filter(b => b.status==="sold").reduce((s,b) => s+batchTotals(b).profit, 0), [batches,tick]);
  const holdingValue = useMemo(() => batches.filter(b => b.status==="holding").reduce((s,b) => s+batchTotals(b).cost, 0), [batches,tick]);
  const txIncome  = txs.filter(t => t.type==="income").reduce((s,t) => s+toNOK(t.amount,t.cur), 0);
  const txExpense = txs.filter(t => t.type==="expense").reduce((s,t) => s+toNOK(t.amount,t.cur), 0);
  const totalNet = batchProfit+txIncome-txExpense;
  const annual = totalNet*12;

  const catStats = useMemo(() => {
    const map = {};
    batches.filter(b => b.status==="sold").forEach(b => {
      const key = b.category||tr.noCat;
      if (!map[key]) map[key]={profit:0,count:0,holding:0};
      map[key].profit += batchTotals(b).profit;
      map[key].count++;
    });
    batches.filter(b => b.status==="holding").forEach(b => {
      const key = b.category||tr.noCat;
      if (!map[key]) map[key]={profit:0,count:0,holding:0};
      map[key].holding += batchTotals(b).cost;
    });
    return map;
  }, [batches,tr]);

  const updateItem = (idx,field,val) => setBatchForm(f => ({...f, items:f.items.map((it,i) => i===idx?{...it,[field]:val}:it)}));
  const addItem = () => setBatchForm(f => ({...f, items:[...f.items, emptyItem(defaultCur)]}));
  const removeItem = idx => setBatchForm(f => ({...f, items:f.items.filter((_,i) => i!==idx)}));

  const submitBatch = () => {
    if (!batchForm.name||batchForm.items.every(it => !it.buyCost)) return;
    setBatches(p => [...p, {...batchForm, id:Date.now(), date:new Date().toISOString().slice(0,10),
      items:batchForm.items.filter(it => it.buyCost).map(it => ({...it, qty:+it.qty||1, buyCost:+it.buyCost, sellPrice:+(it.sellPrice||0)}))}]);
    setBatchForm({name:"",status:"sold",category:"",items:[emptyItem(defaultCur)]});
    setShowAddBatch(false);
  };

  const addTx = () => {
    if (!txForm.desc||!txForm.amount) return;
    setTxs(p => [...p, {...txForm, id:Date.now(), amount:+txForm.amount, date:new Date().toISOString().slice(0,10)}]);
    setTxForm({type:"income",desc:"",amount:"",cur:defaultCur,cat:"Work"});
    setShowAddTx(false);
  };

  const deleteBatch = id => { setBatches(p => p.filter(b => b.id!==id)); setConfirmDelete(null); setExpanded(null); setSellingBatch(null); };
  const deleteTx = id => { setTxs(p => p.filter(t => t.id!==id)); setConfirmDelete(null); };

  const startSelling = b => {
    setSellingBatch(b.id); setExpanded(b.id);
    const sp = {};
    b.items.forEach((_,i) => { sp[i]={sellPrice:"",sellCur:defaultCur}; });
    setSellPrices(sp);
  };

  const confirmSell = bId => {
    setBatches(p => p.map(b => b.id!==bId ? b : {...b, status:"sold",
      items:b.items.map((it,i) => ({...it, sellPrice:+((sellPrices[i]&&sellPrices[i].sellPrice)||0), sellCur:(sellPrices[i]&&sellPrices[i].sellCur)||defaultCur}))}));
    setSellingBatch(null); setSellPrices({});
  };

  const toggleExpand = id => { if(sellingBatch===id) return; setExpanded(p => p===id?null:id); };

  const batchProps = {
    t:tr, onExpand:toggleExpand, expanded, onStartSell:startSelling, sellingId:sellingBatch,
    sellPrices, onSellPriceChange:(i,f,v) => setSellPrices(p => ({...p, [i]:{...p[i],[f]:v}})),
    onConfirmSell:confirmSell, onCancelSell:() => { setSellingBatch(null); setSellPrices({}); },
    onDelete:deleteBatch, confirmDelete, onConfirmDelete:setConfirmDelete, onCancelDelete:() => setConfirmDelete(null),
  };

  const predYears = [];
  for (let i=0;i<6;i++) predYears.push({yr:2026+i, age:age+i, val:annual*Math.pow(1+growth/100,i)});
  const nextMilestone = MILESTONES.find(m => m>annual);
  const mlLabels = MILESTONE_LABELS[lang];
  const TABS = [tr.home,"Batches",tr.calculator,tr.forecast];

  const TxRow = ({t}) => (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:13}}>{t.desc}</div>
        <div style={{fontSize:10,color:"#444",marginTop:2}}>{t.cat} · {t.date}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:14,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:t.type==="income"?"#60a5fa":"#f87171"}}>
          {t.type==="income"?"+":"-"}{fmt(t.amount)} {SYM[t.cur]}
        </div>
        {confirmDelete===("tx-"+t.id) ? (
          <div style={{display:"flex",gap:4}}>
            <button onClick={() => setConfirmDelete(null)} style={{background:"none",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"#888",fontSize:10,padding:"4px 8px",cursor:"pointer",fontFamily:"inherit"}}>No</button>
            <button onClick={() => deleteTx(t.id)} style={{background:"rgba(248,113,113,0.2)",border:"none",borderRadius:6,color:"#f87171",fontSize:10,padding:"4px 8px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Yes</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete("tx-"+t.id)} style={{background:"none",border:"none",color:"#444",fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</button>
        )}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#08080c",color:"#ddd",fontFamily:"'DM Sans',sans-serif",maxWidth:480,margin:"0 auto",width:"100%",overflowX:"hidden",paddingTop:"env(safe-area-inset-top)"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>

      <div style={{padding:"24px 20px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,letterSpacing:-0.5}}><span style={{color:"#4ade80"}}>Q</span>{tr.appTitle.slice(1)}</div>
            <div style={{fontSize:11,color:"#555",marginTop:2}}>
              {currentMonth}
              {ratesLoaded && <span style={{marginLeft:8,fontSize:9,color:"#4ade8066"}}>● live rates</span>}
            </div>
          </div>
          <button onClick={() => setTab(4)} style={{background:"none",border:"none",cursor:"pointer",color:tab===4?"#fff":"#555",fontSize:20,lineHeight:1,padding:0,margin:0,display:"block",transform:"translateY(-3px)"}}>&#9881;&#xFE0E;</button>
        </div>
      </div>

      <div style={{display:"flex",padding:"0 20px",gap:4,marginBottom:4}}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)} style={{flex:1,padding:"10px 0 12px",background:"none",border:"none",color:tab===i?"#fff":"#444",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",borderBottom:tab===i?"2px solid #fff":"2px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",whiteSpace:"nowrap"}}>
            {t}
          </button>
        ))}
      </div>

      <div style={{padding:"16px 20px 100px"}}>

        {tab===0 && (
          <div>
            <Card style={{marginBottom:14,padding:"24px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,background:"radial-gradient(circle,"+(totalNet>=0?"#4ade80":"#f87171")+"22 0%,transparent 70%)",pointerEvents:"none"}}/>
              <Label>{tr.netMonth}</Label>
              <div style={{fontSize:38,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:totalNet>=0?"#4ade80":"#f87171",lineHeight:1.1}}>
                {totalNet>=0?"+":""}{fmt(totalNet)} <span style={{fontSize:16,color:"#666"}}>kr</span>
              </div>
            </Card>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{l:tr.batchProfit,v:batchProfit,c:"#4ade80"},{l:tr.otherIncome,v:txIncome,c:"#60a5fa"},{l:tr.expenses,v:txExpense,c:"#f87171"}].map(x => (
                <Card key={x.l} style={{padding:"14px 12px"}}>
                  <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{x.l}</div>
                  <div style={{fontSize:15,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:x.c}}>{fmtK(x.v)}</div>
                </Card>
              ))}
            </div>
            {holdingValue>0 && (
              <Card style={{marginBottom:14,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:1}}>{tr.inventory}</div>
                  <div style={{fontSize:12,color:"#888",marginTop:2}}>{batches.filter(b => b.status==="holding").length} {tr.activeBatches}</div>
                </div>
                <div style={{fontSize:18,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#fbbf24"}}>{fmt(holdingValue)} kr</div>
              </Card>
            )}
            <Label>Batches</Label>
            {sortedBatches.map(b => <BatchCard key={b.id} b={b} {...batchProps}/>)}
            <Label>{tr.otherTx}</Label>
            {txs.map(t => <TxRow key={t.id} t={t}/>)}
          </div>
        )}

        {tab===1 && (
          <div>
            <Label>{tr.groupedView}</Label>
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              <Pill small active={!activeCatFilter} color="#fff" onClick={() => setActiveCatFilter(null)}>{tr.allBatches}</Pill>
              {Object.keys(catStats).map(cat => (
                <Pill key={cat} small active={activeCatFilter===cat} color="#a78bfa" onClick={() => setActiveCatFilter(activeCatFilter===cat?null:cat)}>{cat}</Pill>
              ))}
            </div>
            {activeCatFilter && catStats[activeCatFilter] && (
              <Card style={{marginBottom:16,padding:"16px 18px"}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:"#a78bfa"}}>{activeCatFilter}</div>
                <div style={{display:"flex",gap:24,alignItems:"flex-start"}}>
                  <div style={{display:"flex",flexDirection:"column"}}>
                    <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{tr.totalProfit}</div>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:catStats[activeCatFilter].profit>=0?"#4ade80":"#f87171"}}>{catStats[activeCatFilter].profit>=0?"+":""}{fmt(catStats[activeCatFilter].profit)} kr</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column"}}>
                    <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{tr.batches}</div>
                    <div style={{fontSize:20,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#ddd"}}>{catStats[activeCatFilter].count}</div>
                  </div>
                  {catStats[activeCatFilter].holding>0 && (
                    <div style={{display:"flex",flexDirection:"column"}}>
                      <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{tr.holding}</div>
                      <div style={{fontSize:20,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#fbbf24"}}>{fmt(catStats[activeCatFilter].holding)} kr</div>
                    </div>
                  )}
                </div>
              </Card>
            )}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <Label>{tr.yourBatches}</Label>
              <button onClick={() => { setShowAddBatch(!showAddBatch); setShowAddTx(false); }} style={{padding:"8px 16px",border:"none",borderRadius:99,cursor:"pointer",background:showAddBatch?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.06)",color:"#fff",fontSize:12,fontWeight:600,fontFamily:"inherit"}}>
                {showAddBatch?tr.cancel:tr.newBatch}
              </button>
            </div>
            {showAddBatch && (
              <Card style={{marginBottom:16}}>
                <input placeholder={tr.batchName} value={batchForm.name} onChange={e => setBatchForm(f => ({...f,name:e.target.value}))} style={{...iStyle,marginBottom:10}}/>
                <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                  {["sold","holding"].map(s => (
                    <Pill key={s} active={batchForm.status===s} color={s==="sold"?"#4ade80":"#fbbf24"} onClick={() => setBatchForm(f => ({...f,status:s}))}>{s==="sold"?tr.sold:tr.holding}</Pill>
                  ))}
                </div>
                <div style={{marginBottom:10}}>
                  <Label>{tr.category}</Label>
                  <select value={batchForm.category} onChange={e => setBatchForm(f => ({...f,category:e.target.value}))} style={sStyle}>
                    <option value="" style={{background:"#1a1a1e"}}>{tr.noCat}</option>
                    {categories.map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
                  </select>
                </div>
                <Label>Items</Label>
                {batchForm.items.map((it,idx) => (
                  <div key={it.id} style={{padding:"12px",marginBottom:8,borderRadius:12,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{fontSize:11,color:"#555",fontWeight:600}}>{batchForm.items.length===1 ? tr.batchName : tr.itemLabel+" "+(idx+1)}</div>
                      {batchForm.items.length>1 && <button onClick={() => removeItem(idx)} style={{background:"none",border:"none",color:"#f8717188",fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</button>}
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:6}}>
                      {batchForm.items.length===1 ? (
                        <input placeholder={tr.batchName} value={batchForm.name}
                          onChange={e => setBatchForm(f => ({...f,name:e.target.value}))}
                          style={{...iStyle,flex:1,fontSize:13,padding:"10px 12px"}}/>
                      ) : (
                        <input placeholder={tr.itemOptional} value={it.name}
                          onChange={e => updateItem(idx,"name",e.target.value)}
                          style={{...iStyle,flex:1,fontSize:13,padding:"10px 12px"}}/>
                      )}
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                        <div style={{fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:1}}>{tr.qty}</div>
                        <input type="number" min={1} value={it.qty}
                          onChange={e => updateItem(idx,"qty",e.target.value)}
                          onBlur={e => updateItem(idx,"qty",Math.max(1,+e.target.value||1))}
                          style={qStyle}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:6}}>
                      <input placeholder={tr.buyPerUnit} value={it.buyCost}
                        onChange={e => updateItem(idx,"buyCost",e.target.value)}
                        onBlur={e => updateItem(idx,"buyCost",evalMath(e.target.value))}
                        style={{...iStyle,flex:2,fontSize:13,padding:"10px 12px"}}/>
                      <select value={it.buyCur} onChange={e => updateItem(idx,"buyCur",e.target.value)} style={{...sStyle,flex:1,fontSize:13,padding:"10px 8px"}}>
                        {Object.keys(RATES).map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
                      </select>
                    </div>
                    {batchForm.status==="sold" && (
                      <div style={{display:"flex",gap:6}}>
                        <input placeholder={tr.sellPerUnit} value={it.sellPrice}
                          onChange={e => updateItem(idx,"sellPrice",e.target.value)}
                          onBlur={e => updateItem(idx,"sellPrice",evalMath(e.target.value))}
                          style={{...iStyle,flex:2,fontSize:13,padding:"10px 12px"}}/>
                        <select value={it.sellCur} onChange={e => updateItem(idx,"sellCur",e.target.value)} style={{...sStyle,flex:1,fontSize:13,padding:"10px 8px"}}>
                          {Object.keys(RATES).map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
                {batchForm.items.some(it=>it.buyCost) && (
                  <div style={{padding:"10px 14px",borderRadius:10,marginBottom:8,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",fontSize:12}}>
                    <span style={{color:"#888"}}>Cost: {fmt(batchForm.items.reduce((s,it)=>s+toNOK((+it.buyCost||0)*(+it.qty||1),it.buyCur),0))} kr</span>
                    {batchForm.status==="sold" && (
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:batchForm.items.reduce((s,it)=>s+toNOK((+it.sellPrice||0)*(+it.qty||1),it.sellCur)-toNOK((+it.buyCost||0)*(+it.qty||1),it.buyCur),0)>=0?"#4ade80":"#f87171"}}>
                        {fmt(batchForm.items.reduce((s,it)=>s+toNOK((+it.sellPrice||0)*(+it.qty||1),it.sellCur)-toNOK((+it.buyCost||0)*(+it.qty||1),it.buyCur),0))} kr profit
                      </span>
                    )}
                  </div>
                )}
                <button onClick={addItem} style={{width:"100%",padding:"10px",border:"1px dashed rgba(255,255,255,0.12)",borderRadius:10,background:"none",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:500,marginBottom:12}}>{tr.addItem}</button>
                <button onClick={submitBatch} style={{width:"100%",padding:"14px",border:"none",borderRadius:12,background:"#fff",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{tr.addBatch}</button>
              </Card>
            )}
            {(activeCatFilter?sortedBatches.filter(b => (b.category||tr.noCat)===activeCatFilter):sortedBatches).map(b => <BatchCard key={b.id} b={b} {...batchProps}/>)}
            <div style={{margin:"20px 0 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <Label>{tr.otherTx}</Label>
              <button onClick={() => { setShowAddTx(!showAddTx); setShowAddBatch(false); }} style={{padding:"6px 14px",border:"none",borderRadius:99,cursor:"pointer",background:"rgba(255,255,255,0.06)",color:"#aaa",fontSize:11,fontWeight:600,fontFamily:"inherit"}}>
                {showAddTx?tr.cancel:tr.add}
              </button>
            </div>
            {showAddTx && (
              <Card style={{marginBottom:14}}>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {["income","expense"].map(t => (
                    <Pill key={t} active={txForm.type===t} color={t==="income"?"#60a5fa":"#f87171"} onClick={() => setTxForm(f => ({...f,type:t}))}>{t==="income"?tr.income:tr.expense}</Pill>
                  ))}
                </div>
                <input placeholder={tr.description} value={txForm.desc} onChange={e => setTxForm(f => ({...f,desc:e.target.value}))} style={{...iStyle,marginBottom:8}}/>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <input type="number" placeholder={tr.amount} value={txForm.amount} onChange={e => setTxForm(f => ({...f,amount:e.target.value}))} style={{...iStyle,flex:2}}/>
                  <select value={txForm.cur} onChange={e => setTxForm(f => ({...f,cur:e.target.value}))} style={{...sStyle,flex:1}}>
                    {Object.keys(RATES).map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
                  </select>
                </div>
                <select value={txForm.cat} onChange={e => setTxForm(f => ({...f,cat:e.target.value}))} style={{...sStyle,marginBottom:10}}>
                  {["Work","Freelance","Investment","Personal","Other"].map(c => <option key={c} value={c} style={{background:"#1a1a1e"}}>{c}</option>)}
                </select>
                <button onClick={addTx} style={{width:"100%",padding:"12px",border:"none",borderRadius:12,background:"#fff",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{tr.add.replace("+ ","")}</button>
              </Card>
            )}
            {txs.map(t => <TxRow key={t.id} t={t}/>)}
          </div>
        )}

        {tab===2 && <ToolsPage tr={tr}/>}

        {tab===3 && (
          <div>
            <Card style={{marginBottom:16,padding:"22px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,background:"radial-gradient(circle,#a78bfa22 0%,transparent 70%)",pointerEvents:"none"}}/>
              <Label>{tr.currentTrajectory}</Label>
              <div style={{fontSize:32,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#e2e8f0"}}>
                {fmt(annual)} <span style={{fontSize:14,color:"#666"}}>{tr.perYear}</span>
              </div>
              <div style={{fontSize:12,color:"#555",marginTop:4}}>{tr.basedOn} {fmt(totalNet)} {tr.perMonth}</div>
            </Card>
            <Card style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <Label>{tr.annualGrowth}</Label>
                <div style={{fontSize:24,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#a78bfa"}}>{growth}%</div>
              </div>
              <input type="range" min={0} max={100} value={growth} onChange={e => setGrowth(+e.target.value)} style={{width:"100%",accentColor:"#a78bfa",height:6}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#444",marginTop:4}}>
                <span>{tr.conservative}</span><span>{tr.aggressive}</span>
              </div>
            </Card>
            <Label>{tr.milestones}</Label>
            <Card style={{marginBottom:16}}>
              {MILESTONES.map((m,i) => {
                const reached = annual>=m;
                const progress = Math.min(1,annual/m);
                return (
                  <div key={i} style={{marginBottom:i<MILESTONES.length-1?14:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontSize:13,color:reached?"#fff":"#555",fontWeight:reached?600:400}}>{reached?"✓ ":""}{mlLabels[i]}</span>
                      <span style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:reached?"#4ade80":"#444"}}>{fmtK(m)} kr</span>
                    </div>
                    <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:3,transition:"width 0.5s",width:(progress*100)+"%",background:reached?"linear-gradient(90deg,#4ade80,#22d3ee)":"linear-gradient(90deg,#a78bfa,#a78bfa88)"}}/>
                    </div>
                  </div>
                );
              })}
            </Card>
            <Label>{tr.fiveYear}</Label>
            <Card>
              {predYears.map((p,i) => {
                const max = predYears[5].val||1;
                const w = Math.max(10,(p.val/max)*100);
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<5?10:0}}>
                    <div style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",color:"#555",minWidth:28}}>{p.yr}</div>
                    <div style={{flex:1}}>
                      <div style={{height:28,borderRadius:6,display:"flex",alignItems:"center",paddingLeft:10,width:w+"%",minWidth:80,background:i===0?"rgba(255,255,255,0.08)":("linear-gradient(90deg,rgba(167,139,250,"+(0.1+i*0.04)+"),rgba(34,211,238,"+(0.08+i*0.03)+"))"),border:"1px solid rgba(167,139,250,"+(0.1+i*0.05)+")"}}>
                        <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:i===0?"#888":"#c4b5fd"}}>{fmtK(p.val)} kr</span>
                      </div>
                    </div>
                    <div style={{fontSize:10,color:"#444",minWidth:28}}>{p.age} yr</div>
                  </div>
                );
              })}
              {nextMilestone&&annual>0 && (
                <div style={{marginTop:16,padding:"12px 14px",borderRadius:12,background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.12)",fontSize:12,color:"#a78bfa"}}>
                  {tr.next} <strong>{mlLabels[MILESTONES.indexOf(nextMilestone)]}</strong> — ~{Math.ceil(Math.log(nextMilestone/annual)/Math.log(1+growth/100))} {tr.yearsAt} {growth}% {tr.growth}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab===4 && (
          <div>
            <Label>{tr.language}</Label>
            <Card style={{marginBottom:16}}>
              <div style={{display:"flex",gap:8}}>
                <Pill active={lang==="en"} color="#fff" onClick={() => setLang("en")}>English</Pill>
                <Pill active={lang==="no"} color="#fff" onClick={() => setLang("no")}>Norsk</Pill>
              </div>
            </Card>
            <Label>{tr.defaultCurrency}</Label>
            <Card style={{marginBottom:16}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.keys(RATES).map(c => <Pill key={c} small active={defaultCur===c} color="#60a5fa" onClick={() => setDefaultCur(c)}>{c}</Pill>)}
              </div>
            </Card>
            <Label>{tr.categories}</Label>
            <Card style={{marginBottom:16}}>
              <div style={{fontSize:12,color:"#666",marginBottom:12}}>{tr.manageCategories}</div>
              {categories.map((cat,i) => (
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<categories.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                  <span style={{fontSize:13}}>{cat}</span>
                  <button onClick={() => setCategories(p => p.filter((_,j) => j!==i))} style={{background:"none",border:"none",color:"#444",fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <input placeholder={tr.categoryName} value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&newCatInput.trim()){ setCategories(p => [...p,newCatInput.trim()]); setNewCatInput(""); }}}
                  style={{...iStyle,flex:1,fontSize:13,padding:"10px 12px"}}/>
                <button onClick={() => { if(newCatInput.trim()){ setCategories(p => [...p,newCatInput.trim()]); setNewCatInput(""); }}} style={{padding:"10px 16px",border:"none",borderRadius:12,background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>
                  {tr.addCategory.replace("+ ","")}
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}