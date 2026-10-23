const KEY='agrisetu_proto_v1';
const MANDI={'Tomato':1800,'Onion':1500,'Potato':1200,'Paddy':2300,'Wheat':2425,'Arhar (Tur)':7000};
const VEH=['CG04 AB 1234 · Tata Ace (1 T)','CG04 MC 7788 · Pickup (1.5 T)','CG07 XY 4521 · Eicher (4 T)'];
const FLOW=['Order placed · escrow funded','Transporter assigned','Picked up','In transit','Delivered · farmer paid'];
const seed=()=>({role:'farmer',seq:1001,lseq:10,kyc:{farmer:null,buyer:null},orders:[],listings:[
{id:1,crop:'Tomato',qty:40,price:1900,farmer:'Sunita Bai',village:'Dhamtari',km:62,grade:'A',own:0},
{id:2,crop:'Onion',qty:30,price:1550,farmer:'Hemant Verma',village:'Kurud',km:48,grade:'B',own:0},
{id:3,crop:'Paddy',qty:120,price:2250,farmer:'Kisan FPO Gariaband',village:'Gariaband',km:85,grade:'A',own:0},
{id:4,crop:'Potato',qty:60,price:1250,farmer:'Lakhan Sahu',village:'Bilaspur',km:110,grade:'A',own:0},
{id:5,crop:'Arhar (Tur)',qty:25,price:7100,farmer:'Meena Devi',village:'Mungeli',km:95,grade:'B',own:0}]});
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}S=S||seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id),inr=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const now=()=>new Date().toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let K={farmer:{step:1},buyer:{step:1},trans:{step:1}},tt;
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2600)}
function mandi(c){return Math.round(MANDI[c]*(1+Math.sin(Date.now()/36e5)*.02))}
function setRole(r){S.role=r;save();render()}
async function dl(name,data,mime){
 try{const d=await claude.use('downloads');if(d){await d.save({filename:name,data:new Blob([data],{type:mime})});return}}catch(e){if(e&&e.code==='declined')return}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:mime}));a.download=name;a.click();toast('Download started')}

/* ---------- KYC ---------- */
function kycV(r){const k=S.kyc[r],F=r==='farmer';
 if(k)return `<div class="ok"><div class="top row"><div><span class="pill">✔ KYC verified</span><h3 style="margin:6px 0 2px">${esc(k.name)}</h3>
 <p class="mut">${esc(k.org)} · Aadhaar ${k.aadhaar} · UPI ${esc(k.upi)}</p><p class="mut">KYC ID ${k.id} · verified ${k.date}</p>${k.dl?`<p class="mut">🪪 Driving licence ${esc(k.dl)} · valid till ${k.dlExp} · Vehicle ${esc(k.veh)}</p><p class="mut">Licence proof: ${esc(k.dlDoc)}</p>`:''}</div></div>
 <button class="b s" onclick="dlKyc('${r}')">⬇ Download KYC certificate</button></div>`;
 const c=K[r],s=c.step;
 const bar=`<div class="steps">${['Mobile OTP','Identity','Documents'].map((t,i)=>`<div class="st ${s>i+1?'d':''} ${s==i+1?'d':''}"><i></i>${i+1}. ${t}</div>`).join('')}</div>`;
 let b='';
 if(s==1)b=`<label>Full name</label><input id="k_n" value="${esc(c.n||'')}" placeholder="${F?'e.g. Ramesh Sahu':'Contact person'}">
 <label>Mobile number</label><input id="k_m" value="${c.m||''}" maxlength="10" inputmode="numeric" placeholder="10-digit mobile">
 ${c.sent?`<label>Enter OTP <span class="pill w">demo OTP: 1234</span></label><input id="k_o" maxlength="4" inputmode="numeric" placeholder="4-digit OTP"><button class="b" onclick="kycOtp('${r}')">Verify OTP</button>`:`<button class="b" onclick="kycSend('${r}')">Send OTP</button>`}`;
 if(s==2&&r=='trans')b=kycT2(c);else if(s==2)b=`<label>Aadhaar number (12 digits)</label><input id="k_a" value="${c.a||''}" maxlength="12" inputmode="numeric" placeholder="XXXX XXXX XXXX">
 <label>${F?'Village / District':'Business name'}</label><input id="k_g" value="${esc(c.g||'')}" placeholder="${F?'e.g. Dhamtari, Chhattisgarh':'e.g. Sharma Traders'}">
 <label>${F?'Land holding (acres)':'GSTIN (optional)'}</label><input id="k_l" value="${esc(c.l||'')}">
 <label>UPI ID for ${F?'payout':'payments'}</label><input id="k_u" value="${esc(c.u||'')}" placeholder="name@upi">
 <label class="row" style="display:flex;gap:8px;align-items:center;color:var(--ink);font-size:13px"><input type="checkbox" id="k_c" style="width:auto;flex:none" ${c.c?'checked':''}>I consent to Aadhaar e-KYC verification</label>
 <button class="b" onclick="kycId('${r}')">Continue</button>`;
 if(s==3&&r=='trans')b=kycT3(c);else if(s==3)b=`<label>Upload ID proof / selfie (any image or PDF)</label><input type="file" id="k_f" accept="image/*,.pdf" onchange="kycFile('${r}')">
 <p class="mut" id="k_fn">${c.f?'Attached: '+esc(c.f):'No file chosen'}</p><button class="b" id="k_s" onclick="kycSubmit('${r}')">Submit for verification</button>
 <button class="b o" onclick="K.${r}.step=2;drawKyc('${r}')" style="margin-left:6px">Back</button>`;
 return bar+b}
function drawKyc(r){const e=$('kyc');if(e)e.innerHTML=kycV(r)}
function kycSend(r){const c=K[r];c.n=$('k_n').value.trim();c.m=$('k_m').value.trim();
 if(c.n.length<2)return toast('Enter your name');if(!/^[6-9]\d{9}$/.test(c.m))return toast('Enter a valid 10-digit mobile number');
 c.sent=1;drawKyc(r);toast('OTP sent (demo: 1234)')}
function kycOtp(r){if($('k_o').value!=='1234')return toast('Wrong OTP — use 1234');K[r].step=2;drawKyc(r);toast('Mobile verified')}
function kycId(r){const c=K[r];c.a=$('k_a').value.replace(/\s/g,'');c.g=$('k_g').value.trim();c.l=$('k_l').value.trim();c.u=$('k_u').value.trim();c.c=$('k_c').checked;
 if(!/^\d{12}$/.test(c.a))return toast('Aadhaar must be 12 digits');if(!c.g)return toast(r=='farmer'?'Enter village / district':'Enter business name');
 if(!/^[\w.\-]+@[\w]+$/.test(c.u))return toast('Enter a valid UPI ID');if(!c.c)return toast('Please give consent to continue');c.step=3;drawKyc(r)}
function kycFile(r){const f=$('k_f').files[0];if(f){K[r].f=f.name;$('k_fn').textContent='Attached: '+f.name}}
function kycSubmit(r){const c=K[r];if(!c.f)return toast('Attach a document first');const b=$('k_s');b.disabled=true;b.textContent='Verifying with UIDAI (simulated)…';
 setTimeout(()=>{S.kyc[r]={name:c.n,mobile:c.m,org:c.g,aadhaar:'XXXX XXXX '+c.a.slice(-4),upi:c.u,doc:c.f,id:'KYC-'+r[0].toUpperCase()+Math.floor(10000+Math.random()*89999),date:now()};save();toast('KYC verified ✔');render()},1600)}
function dlKyc(r){const k=S.kyc[r];dl(`AgriSetu_KYC_${k.id}.html`,`<!doctype html><meta charset=utf-8><title>KYC Certificate</title><body style="font-family:sans-serif;max-width:560px;margin:40px auto;border:3px solid #2e7d32;padding:28px;border-radius:12px">
<h1 style="color:#1b5e20;letter-spacing:.15em">AGRISETU</h1><h2>KYC Verification Certificate</h2><hr><table cellpadding=6>
<tr><td>Name</td><td><b>${esc(k.name)}</b></td></tr><tr><td>Role</td><td>${r}</td></tr><tr><td>${r=='farmer'?'Village':'Business'}</td><td>${esc(k.org)}</td></tr>
<tr><td>Mobile</td><td>${k.mobile}</td></tr><tr><td>Aadhaar</td><td>${k.aadhaar}</td></tr><tr><td>UPI</td><td>${esc(k.upi)}</td></tr><tr><td>Document</td><td>${esc(k.doc)}</td></tr>${k.dl?`<tr><td>Driving licence</td><td>${esc(k.dl)} (valid till ${k.dlExp})</td></tr><tr><td>Vehicle</td><td>${esc(k.veh)}</td></tr>`:''}
<tr><td>KYC ID</td><td><b>${k.id}</b></td></tr><tr><td>Verified on</td><td>${k.date}</td></tr></table>
<p style="color:#2e7d32;font-weight:bold">✔ Status: VERIFIED</p><p style="font-size:12px;color:#666">Prototype certificate generated by AgriSetu demo. Not a legal document.</p></body>`,'text/html')}

/* ---------- Orders ---------- */
function tracker(o){return `<div class="steps">${FLOW.map((t,i)=>`<div class="st ${o.status>=i?'d':''}"><i></i>${t}</div>`).join('')}</div>`}
function orderCard0(o,who){
 const done=o.status==4;let act='';
 if(who=='farmer'&&o.status>=0&&o.status<2)act=`<p>Pickup code for driver: <span class="code">${o.pickup}</span></p><p class="mut">Share this code only when the transporter arrives.</p>`;
 if(who=='buyer'&&o.status>=1&&!done)act=`<p>Your delivery OTP: <span class="code">${o.otp}</span></p><p class="mut">Give it to the driver only after you receive the produce.</p>`;
 if(who=='trans'){
  if(o.status==0)act=`<label>Select vehicle</label><select id="v_${o.id}">${vehs().map(v=>`<option>${v}</option>`).join('')}</select><button class="b s" onclick="accept(${o.id})">Accept job &amp; assign</button>`;
  if(o.status==1)act=`<label>Pickup code from farmer</label><div class="row"><input id="pc_${o.id}" maxlength="4" inputmode="numeric" placeholder="4-digit code"><button class="b s" onclick="pickup(${o.id})" style="flex:none">Confirm pickup</button></div>`;
  if(o.status==2)act=`<button class="b s" onclick="trip(${o.id})">Start trip</button>`;
  if(o.status==3)act=`<label>Delivery OTP from buyer</label><div class="row"><input id="dc_${o.id}" maxlength="4" inputmode="numeric" placeholder="4-digit OTP"><button class="b s" onclick="deliver(${o.id})" style="flex:none">Complete delivery</button></div>`}
 return `<div class="item"><div class="top"><div><b>#${o.id} · ${o.qty} qtl ${esc(o.crop)}</b><div class="mut">${esc(o.farmer)} (${esc(o.village)}) → ${esc(o.buyer)} · ${o.km} km</div></div>
 <div style="text-align:right"><b>${inr(o.total)}</b><div class="mut">produce ${inr(o.qty*o.price)} + freight ${inr(o.freight)}</div></div></div>
 ${tracker(o)}${o.driver?`<p class="mut">🚚 ${esc(o.driver)}</p>`:''}${done?`<p><span class="pill">Escrow released ${inr(o.qty*o.price)} → farmer’s UPI</span></p>`:''}${act}
 <div class="log">${o.log.slice().reverse().map(l=>l.t+' — '+l.m).join('<br>')}</div>
 ${who!='trans'||done?`<button class="b o s" onclick="dlInv(${o.id})">⬇ Download invoice</button>`:''}</div>`}
function ev(o,m){o.log.push({t:now(),m})}
const gO=id=>S.orders.find(o=>o.id==id);
function accept(id){const o=gO(id);o.driver=$('v_'+id).value;o.status=1;ev(o,'Transporter assigned: '+o.driver);save();toast('Job accepted — vehicle assigned');render()}
function pickup(id){const o=gO(id);if($('pc_'+id).value!==o.pickup)return toast('Incorrect pickup code');o.status=2;ev(o,'Produce picked up from farm');save();toast('Pickup confirmed');render()}
function trip(id){const o=gO(id);o.status=3;ev(o,'In transit to buyer');save();toast('Trip started');render()}
function deliver(id){const o=gO(id);if($('dc_'+id).value!==o.otp)return toast('Incorrect delivery OTP');o.status=4;ev(o,'Delivered · OTP verified · escrow released to farmer');save();toast('Delivered — farmer paid ✔');render()}
function dlInv(id){const o=gO(id);dl(`AgriSetu_Invoice_${o.id}.html`,`<!doctype html><meta charset=utf-8><body style="font-family:sans-serif;max-width:600px;margin:40px auto"><h1 style="color:#1b5e20">AGRISETU — Invoice #${o.id}</h1><p>${o.date}</p>
<table border=1 cellpadding=8 style="border-collapse:collapse;width:100%"><tr><th>Item</th><th>Qty (qtl)</th><th>Rate</th><th>Amount</th></tr><tr><td>${esc(o.crop)}</td><td>${o.qty}</td><td>${inr(o.price)}</td><td>${inr(o.qty*o.price)}</td></tr>
<tr><td colspan=3>Freight (${o.km} km)</td><td>${inr(o.freight)}</td></tr><tr><td colspan=3><b>Total (paid to escrow)</b></td><td><b>${inr(o.total)}</b></td></tr></table>
<p>Seller: ${esc(o.farmer)}, ${esc(o.village)}<br>Buyer: ${esc(o.buyer)}<br>Transporter: ${esc(o.driver||'Not yet assigned')}<br>UPI ref: ${o.upi}<br>Status: <b>${FLOW[o.status]}</b></p><p style="font-size:12px;color:#666">Prototype invoice.</p></body>`,'text/html')}
function dlCsv(who){const rows=who=='farmer'?S.orders.filter(o=>o.own):S.orders;
 const c='Order,Crop,Qty(qtl),Rate,Produce,Freight,Total,Farmer,Buyer,Driver,Status,Date\n'+rows.map(o=>[o.id,o.crop,o.qty,o.price,o.qty*o.price,o.freight,o.total,o.farmer,o.buyer,o.driver||'',FLOW[o.status],o.date].map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
 if(!rows.length)return toast('No orders to export yet');dl('AgriSetu_orders.csv',c,'text/csv')}

/* ---------- Farmer ---------- */
function fairness(c,p){const m=mandi(c),d=(p-m)/m*100;return d>8?['w',`${d.toFixed(0)}% above mandi — may be hard to sell`]:d<-8?['r',`${Math.abs(d).toFixed(0)}% below mandi — you can ask more`]:['',`Fair price (${d>=0?'+':''}${d.toFixed(0)}% vs mandi)`]}
function priceHint(){const c=$('l_c').value,p=+$('l_p').value,e=$('l_h');if(!p){e.innerHTML=`Live mandi rate (Agmarknet): <b>${inr(mandi(c))}</b>/qtl`;return}const f=fairness(c,p);e.innerHTML=`Mandi ${inr(mandi(c))}/qtl · <span class="pill ${f[0]}">${f[1]}</span>`}
function addListing(){const c=$('l_c').value,q=+$('l_q').value,p=+$('l_p').value;if(!(q>0&&p>0))return toast('Enter quantity and price');
 const k=S.kyc.farmer;S.listings.unshift({id:S.lseq++,crop:c,qty:q,price:p,farmer:k.name,village:k.org,km:30+Math.floor(Math.random()*90),grade:$('l_g').value,own:1});save();toast('Produce listed — buyers can see it now');render()}
function delL(id){S.listings=S.listings.filter(l=>l.id!=id);save();render()}
function farmerV(){const ok=!!S.kyc.farmer,mine=S.listings.filter(l=>l.own),os=S.orders.filter(o=>o.own);
 return `<div class="card"><h2>🌾 Farmer dashboard</h2><p class="mut">Complete KYC once, then list produce, get a fair-price check and track every order to payout.</p>
 <div class="stat" style="margin-top:10px"><div><b>${mine.length}</b>Listings</div><div><b>${os.length}</b>Orders</div><div><b>${inr(os.filter(o=>o.status==4).reduce((a,o)=>a+o.qty*o.price,0))}</b>Received</div></div></div>
 ${mandiV('farmer')}<div class="card"><h3>Step 1 · KYC verification</h3><div id="kyc">${kycV('farmer')}</div></div>
 <div class="grid"><div class="card ${ok?'':'lock'}"><h3>Step 2 · List your produce ${ok?'':'🔒'}</h3>${ok?'':'<p class="mut">Complete KYC to unlock.</p>'}
 <label>Crop</label><select id="l_c" onchange="priceHint()">${Object.keys(MANDI).map(c=>`<option>${c}</option>`).join('')}</select>
 <div class="row"><div><label>Quantity (quintal)</label><input id="l_q" type="number" min="1" value="20"></div><div><label>Your price (₹/qtl)</label><input id="l_p" type="number" min="1" oninput="priceHint()"></div></div>
 <label>Quality grade</label><select id="l_g"><option>A</option><option>B</option><option>C</option></select><p class="mut" id="l_h" style="margin-top:8px"></p>
 <button class="b" onclick="addListing()">List produce</button></div>
 <div class="card"><h3>My listings</h3>${mine.length?mine.map(l=>`<div class="item"><div class="top"><b>${esc(l.crop)} · Grade ${l.grade}</b><b>${inr(l.price)}/qtl</b></div><div class="mut">${l.qty} qtl available</div><button class="b o s" onclick="delL(${l.id})">Remove</button></div>`).join(''):'<p class="mut">Nothing listed yet.</p>'}</div></div>
 <div class="card"><div class="row"><h3 style="flex:3">Step 3 · Orders on my produce</h3><button class="b o s" style="flex:none;margin:0" onclick="dlCsv('farmer')">⬇ Export CSV</button></div>${os.length?os.slice().reverse().map(o=>orderCard(o,'farmer')).join(''):'<p class="mut">No orders yet. Switch to the Buyer tab to place one.</p>'}</div>`}

/* ---------- Buyer ---------- */
let sort='match',fcrop='';
function score(l){return l.price/MANDI[l.crop]*100+l.km*.3}
function setF(){sort=$('s_o').value;fcrop=$('s_c').value;render()}
function order(id){const l=S.listings.find(x=>x.id==id),q=+$('q_'+id).value;if(!(q>0&&q<=l.qty))return toast('Quantity must be between 1 and '+l.qty);
 const fr=Math.max(400,Math.round(l.km*q*.9/10)*10),tot=q*l.price+fr;if(!confirm(`Pay ${inr(tot)} into escrow via UPI?\n(Produce ${inr(q*l.price)} + freight ${inr(fr)})\n\nMoney is released to the farmer only after delivery.`))return;
 const id2=S.seq++;S.orders.push({id:id2,crop:l.crop,qty:q,price:l.price,farmer:l.farmer,village:l.village,km:l.km,freight:fr,total:tot,buyer:S.kyc.buyer.org,own:l.own,status:0,driver:null,
 pickup:String(1000+Math.floor(Math.random()*9000)),otp:String(1000+Math.floor(Math.random()*9000)),upi:'UPI'+Date.now().toString().slice(-9),date:now(),log:[{t:now(),m:'Order placed · '+inr(tot)+' held in escrow'}]});
 l.qty-=q;if(l.qty<=0)S.listings=S.listings.filter(x=>x.id!=id);save();toast('Order placed — payment in escrow');render()}
function buyerV(){const ok=!!S.kyc.buyer;let ls=S.listings.filter(l=>l.qty>0&&(!fcrop||l.crop==fcrop));
 ls.sort((a,b)=>sort=='price'?a.price/MANDI[a.crop]-b.price/MANDI[b.crop]:sort=='dist'?a.km-b.km:score(a)-score(b));const os=S.orders.filter(o=>S.kyc.buyer&&o.buyer==S.kyc.buyer.org);
 return `<div class="card"><h2>🛒 Buyer portal</h2><p class="mut">Browse verified farmer listings ranked by price and distance. Pay into escrow; funds release only after delivery OTP.</p></div>
 ${mandiV('buyer')}<div class="card"><h3>Step 1 · Buyer KYC</h3><div id="kyc">${kycV('buyer')}</div></div>
 <div class="card ${ok?'':'lock'}"><h3>Step 2 · Marketplace ${ok?'':'🔒 complete KYC to order'}</h3>
 <div class="row"><div><label>Sort by</label><select id="s_o" onchange="setF()"><option value="match" ${sort=='match'?'selected':''}>Best match (price + distance)</option><option value="price" ${sort=='price'?'selected':''}>Lowest vs mandi</option><option value="dist" ${sort=='dist'?'selected':''}>Nearest</option></select></div>
 <div><label>Crop</label><select id="s_c" onchange="setF()"><option value="">All crops</option>${Object.keys(MANDI).map(c=>`<option ${fcrop==c?'selected':''}>${c}</option>`).join('')}</select></div></div>
 ${ls.map((l,i)=>{const f=fairness(l.crop,l.price);return `<div class="item"><div class="top"><div><b>${esc(l.crop)} · Grade ${l.grade}</b> ${i==0&&sort=='match'?'<span class="pill">★ Best match</span>':''}${l.own?' <span class="pill w">Your farmer</span>':''}
 <div class="mut">${esc(l.farmer)} · ${esc(l.village)} · ${l.km} km · ${l.qty} qtl left</div></div><div style="text-align:right"><b>${inr(l.price)}/qtl</b><div class="mut">mandi ${inr(mandi(l.crop))}</div></div></div>
 <div class="row" style="margin-top:6px"><span class="pill ${f[0]}" style="flex:none">${f[1]}</span><input id="q_${l.id}" type="number" min="1" max="${l.qty}" value="${Math.min(10,l.qty)}" style="max-width:90px;flex:none" oninput="fe(${l.id})"><button class="b s" style="flex:none;margin:0" onclick="order(${l.id})">Order &amp; pay</button></div><div class="mut" id="fe_${l.id}" style="margin-top:6px">${feTxt(l.km,Math.min(10,l.qty))}</div></div>`}).join('')||'<p class="mut">No listings match.</p>'}</div>
 <div class="card"><div class="row"><h3 style="flex:3">Step 3 · My orders</h3><button class="b o s" style="flex:none;margin:0" onclick="dlCsv('buyer')">⬇ Export CSV</button></div>${os.length?os.slice().reverse().map(o=>orderCard(o,'buyer')).join(''):'<p class="mut">No orders yet.</p>'}</div>`}

/* ---------- Transporter ---------- */
function transV(){const open=S.orders.filter(o=>o.status==0&&o.appr!='pending'&&o.appr!='rejected'&&o.tm!='self'),mine=S.orders.filter(o=>o.status>0);
 return notesV('trans')+`<div class="card"><h2>🚚 Transporter app</h2><p class="mut">Accept funded orders, collect the farmer’s pickup code, and complete delivery with the buyer’s OTP.</p>
 <div class="stat" style="margin-top:10px"><div><b>${open.length}</b>Open jobs</div><div><b>${mine.filter(o=>o.status<4).length}</b>Active</div><div><b>${inr(mine.filter(o=>o.status==4).reduce((a,o)=>a+o.freight,0))}</b>Freight earned</div></div></div>
 <div class="card"><h3>Open jobs (escrow funded)</h3>${open.length?open.map(o=>orderCard(o,'trans')).join(''):'<p class="mut">No open jobs. Place an order from the Buyer tab.</p>'}</div>
 <div class="card"><div class="row"><h3 style="flex:3">My jobs</h3><button class="b o s" style="flex:none;margin:0" onclick="dlCsv('trans')">⬇ Export CSV</button></div>${mine.length?mine.slice().reverse().map(o=>orderCard(o,'trans')).join(''):'<p class="mut">No assigned jobs yet.</p>'}</div>`}

function render(){norm();$('tabs').innerHTML=[['farmer','Farmer'],['buyer','Buyer'],['trans','Transporter'],['fpo','FPO']].map(t=>`<button class="tab ${S.role==t[0]?'on':''}" onclick="setRole('${t[0]}')">${t[1]}</button>`).join('')+`<button class="tab" onclick="if(confirm('Reset all demo data?')){const L=S.lang;localStorage.removeItem(KEY);S=seed();S.lang=L;K={farmer:{step:1},buyer:{step:1},trans:{step:1}};render()}">Reset</button>`;
 $('app').innerHTML=(S.role=='farmer'?farmerV():S.role=='buyer'?buyerV():S.role=='fpo'?fpoV():transV())+`<p class="mut" style="text-align:center">Prototype · simulated OTP (1234), UPI escrow and mandi prices. Demo flow: Farmer KYC → list → Buyer KYC → order → Transporter accept → pickup → deliver.</p>`;
 if(S.role=='farmer'&&S.kyc.farmer)priceHint();window.scrollTo(0,0)}

/* ---------- v2 additions ---------- */
const LB={farmer:'Farmer',buyer:'Buyer',trans:'Transporter',fpo:'FPO',platform:'AgriSetu platform'};
const FQ={q:'',s:'all',open:null},RV={r:5};
const seedFpo=()=>({name:'Kisan FPO Gariaband',reg:'FPO-CG-0231',seq:7,members:[
{id:1,name:'Ramesh Sahu',village:'Dhamtari',mobile:'9876501234',land:4.5,crops:'Paddy',joined:'12 Jun 2024',status:'Active',kyc:1},
{id:2,name:'Sunita Bai',village:'Dhamtari',mobile:'9876505678',land:3,crops:'Tomato',joined:'03 Aug 2024',status:'Active',kyc:1},
{id:3,name:'Hemant Verma',village:'Kurud',mobile:'9425011223',land:5,crops:'Onion',joined:'21 Nov 2024',status:'Active',kyc:1},
{id:4,name:'Meena Devi',village:'Mungeli',mobile:'9301144556',land:2.5,crops:'Arhar (Tur)',joined:'15 Jan 2025',status:'Active',kyc:1},
{id:5,name:'Lakhan Sahu',village:'Bilaspur',mobile:'9770088990',land:6,crops:'Potato',joined:'02 Mar 2025',status:'Inactive',kyc:1},
{id:6,name:'Kavita Yadav',village:'Gariaband',mobile:'9893012345',land:1.8,crops:'Wheat',joined:'18 Sep 2025',status:'Active',kyc:0}]});
const seedRv=()=>[{by:'buyer',to:'farmer',r:5,t:'Fresh tomatoes, exactly as described.',who:'Sharma Traders',d:'14 Oct'},{by:'farmer',to:'buyer',r:4,t:'Paid on time through escrow.',who:'Sunita Bai',d:'12 Oct'},{by:'buyer',to:'trans',r:5,t:'Delivered early and handled the crates carefully.',who:'Sharma Traders',d:'13 Oct'},{by:'farmer',to:'trans',r:4,t:'Polite driver, pickup code process was smooth.',who:'Hemant Verma',d:'11 Oct'},{by:'farmer',to:'fpo',r:5,t:'Fair price and quick payout via the FPO.',who:'Lakhan Sahu',d:'10 Oct'},{by:'fpo',to:'buyer',r:4,t:'Bulk order handled smoothly.',who:'Kisan FPO',d:'09 Oct'},{by:'buyer',to:'platform',r:5,t:'Escrow gives real confidence.',who:'Sharma Traders',d:'08 Oct'}];
function norm(){S.kyc=S.kyc||{};if(S.kyc.trans===undefined)S.kyc.trans=null;S.fpo=S.fpo||seedFpo();S.reviews=S.reviews||seedRv()}
function vehs(){return S.kyc.trans?[S.kyc.trans.veh+' · My registered vehicle',...VEH]:VEH}
/* popup: payment done / thank you / success */
function ok(t,m,rows,btns){$('mod').innerHTML=`<div class="mcard"><div class="tick">✔</div><h2>${esc(t)}</h2><p class="mut">${esc(m)}</p>${rows?`<table class="mt">${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>`:''}<div class="row">${(btns||[]).map(b=>`<button class="b o s" onclick="cm();${b[1]}">${esc(b[0])}</button>`).join('')}<button class="b s" onclick="cm()">Done</button></div></div>`;$('mod').style.display='flex'}
function busy(m){$('mod').innerHTML=`<div class="mcard"><div class="spin"></div><h2>${esc(m)}</h2><p class="mut">Please do not close this page</p></div>`;$('mod').style.display='flex'}
function cm(){$('mod').style.display='none';$('mod').innerHTML=''}
/* distance based delivery charge */
function frt(km,q){const trips=Math.ceil(q/40),pq=q/trips,v=pq<=10?['Tata Ace (1 T)',14]:pq<=15?['Pickup (1.5 T)',18]:['Eicher (4 T)',28],base=250;return{trips,veh:v[0],rate:v[1],base,t:trips*(base+km*v[1])}}
function feTxt(km,q){if(!(q>0))return '';const f=frt(km,q);return `🚚 Delivery ≈ ${inr(Math.round(f.t/10)*10)} · ${km} km × ${inr(f.rate)}/km + ${inr(f.base)} loading${f.trips>1?' × '+f.trips+' trips':''} (${f.veh})`}
function fe(id){const l=S.listings.find(x=>x.id==id);$('fe_'+id).textContent=feTxt(l.km,+$('q_'+id).value)}
function order(id){const l=S.listings.find(x=>x.id==id),q=+$('q_'+id).value;if(!S.kyc.buyer)return toast('Complete buyer KYC first');if(!(q>0&&q<=l.qty))return toast('Quantity must be between 1 and '+l.qty);
 const f=frt(l.km,q),fr=Math.round(f.t/10)*10,tot=q*l.price+fr;
 if(!confirm(`Pay ${inr(tot)} into escrow via UPI?\n(Produce ${inr(q*l.price)} + delivery ${inr(fr)} for ${l.km} km)\n\nMoney is released to the farmer only after delivery.`))return;
 busy('Processing UPI payment…');
 setTimeout(()=>{const n=S.seq++,o={id:n,crop:l.crop,qty:q,price:l.price,farmer:l.farmer,village:l.village,km:l.km,freight:fr,fr:f,total:tot,fpo:l.fpo||0,appr:'pending',tm:null,buyer:S.kyc.buyer.org,own:l.own,status:0,driver:null,pickup:String(1000+Math.floor(Math.random()*9000)),otp:String(1000+Math.floor(Math.random()*9000)),upi:'UPI'+Date.now().toString().slice(-9),date:now(),log:[{t:now(),m:'Order placed · '+inr(tot)+' held in escrow'}]};
 S.orders.push(o);note(l.fpo?'fpo':l.own?'farmer':'','New order request #'+n+': '+q+' qtl '+l.crop+' from '+o.buyer+' ('+inr(q*l.price)+'). Please approve or reject, and tell us if you need transportation.');if(!l.own&&!l.fpo)setTimeout(()=>{if(gO(n)&&gO(n).appr=='pending')approve(n,'platform',true)},5000);l.qty-=q;if(l.qty<=0)S.listings=S.listings.filter(x=>x.id!=id);save();render();
 ok('Thank you for your order!','Payment done — your money is held safely in escrow. Your order has been sent to the farmer for approval.',[['Order','#'+n],['Produce',q+' qtl '+l.crop+' · '+inr(q*l.price)],['Delivery ('+l.km+' km)',inr(fr)],['Total paid',inr(tot)],['UPI ref',o.upi],['Status','⏳ Waiting for farmer approval']],[['⬇ Invoice','dlInv('+n+')']])},1400)}
function orderCard(o,who){const hold=o.appr=='pending'||o.appr=='rejected'||(o.appr=='approved'&&o.tm=='self'&&o.status<4),h=orderCard0(hold?{...o,status:-1}:o,who);let x=apprX(o,who);
 if(o.fr)x+=`<p class="mut">📍 Delivery charge: ${inr(o.fr.base)} loading + ${o.km} km × ${inr(o.fr.rate)}/km${o.fr.trips>1?' × '+o.fr.trips+' trips':''} = ${inr(o.freight)}</p>`;
 if(o.status==4)x+=`<button class="b s" onclick="rate(${o.id})">★ Rate this order</button>`;return h.replace('<div class="log">',x+'<div class="log">')}
/* transporter KYC + driving licence */
function kycT2(c){return `<label>Aadhaar number (12 digits)</label><input id="k_a" value="${c.a||''}" maxlength="12" inputmode="numeric" placeholder="XXXX XXXX XXXX">
<label>Base city / district</label><input id="k_g" value="${esc(c.g||'')}" placeholder="e.g. Raipur, Chhattisgarh">
<div class="row"><div><label>Driving licence no.</label><input id="k_dl" value="${esc(c.dl||'')}" placeholder="CG04 20190012345"></div><div><label>Licence valid till</label><input id="k_dx" type="date" value="${c.dx||''}"></div></div>
<label>Vehicle registration no.</label><input id="k_vh" value="${esc(c.vh||'')}" placeholder="CG04 AB 1234">
<label>UPI ID for freight payout</label><input id="k_u" value="${esc(c.u||'')}" placeholder="name@upi">
<label class="row" style="display:flex;gap:8px;align-items:center;color:var(--ink);font-size:13px"><input type="checkbox" id="k_c" style="width:auto;flex:none" ${c.c?'checked':''}>I consent to Aadhaar e-KYC and driving licence verification</label><button class="b" onclick="kycId('trans')">Continue</button>`}
function kycT3(c){return `<label>Upload ID proof / selfie</label><input type="file" id="k_f" accept="image/*,.pdf" onchange="kycFile('trans')"><p class="mut" id="k_fn">${c.f?'Attached: '+esc(c.f):'No file chosen'}</p>
<label>Upload driving licence photo (proof)</label><input type="file" id="k_d" accept="image/*,.pdf" onchange="kycDl()"><p class="mut" id="k_dn">${c.df?'Attached: '+esc(c.df):'No file chosen'}</p>
<button class="b" id="k_s" onclick="kycSubmit('trans')">Submit for verification</button><button class="b o" onclick="K.trans.step=2;drawKyc('trans')" style="margin-left:6px">Back</button>`}
function kycDl(){const f=$('k_d').files[0];if(f){K.trans.df=f.name;$('k_dn').textContent='Attached: '+f.name}}
{const _ki=kycId;kycId=function(r){if(r!='trans')return _ki(r);const c=K.trans,g=i=>$(i).value.trim();c.a=g('k_a').replace(/\s/g,'');c.g=g('k_g');c.dl=g('k_dl').toUpperCase();c.dx=$('k_dx').value;c.vh=g('k_vh').toUpperCase();c.u=g('k_u');c.c=$('k_c').checked;
 if(!/^\d{12}$/.test(c.a))return toast('Aadhaar must be 12 digits');if(!c.g)return toast('Enter base city / district');
 if(!/^[A-Z]{2}\d{13}$/.test(c.dl.replace(/[\s-]/g,'')))return toast('Enter a valid driving licence number (e.g. CG04 20190012345)');
 if(!c.dx||new Date(c.dx)<=new Date())return toast('Licence is expired or expiry date is missing');
 if(!/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(c.vh.replace(/\s/g,'')))return toast('Enter a valid vehicle number (e.g. CG04 AB 1234)');
 if(!/^[\w.\-]+@[\w]+$/.test(c.u))return toast('Enter a valid UPI ID');if(!c.c)return toast('Please give consent to continue');c.step=3;drawKyc('trans')}}
{const _ks=kycSubmit;kycSubmit=function(r){if(r!='trans'){_ks(r);setTimeout(()=>{const k=S.kyc[r];if(k)ok('KYC verified!','Your identity is verified. '+(r=='farmer'?'You can now list your produce.':'You can now place orders.'),[['Name',k.name],['KYC ID',k.id]],[['⬇ Certificate',"dlKyc('"+r+"')"]])},1800);return}
 const c=K.trans;if(!c.f)return toast('Attach your ID proof first');if(!c.df)return toast('Attach your driving licence photo first');const b=$('k_s');b.disabled=true;b.textContent='Verifying licence with Parivahan (simulated)…';
 setTimeout(()=>{const k=S.kyc.trans={name:c.n,mobile:c.m,org:c.g,aadhaar:'XXXX XXXX '+c.a.slice(-4),upi:c.u,doc:c.f,dl:c.dl,dlExp:c.dx,dlDoc:c.df,veh:c.vh,id:'KYC-T'+Math.floor(10000+Math.random()*89999),date:now()};save();render();
 ok('KYC & licence verified!','Welcome aboard, '+k.name+'. You can now accept delivery jobs.',[['KYC ID',k.id],['Licence',k.dl],['Valid till',k.dlExp],['Vehicle',k.veh]],[['⬇ Certificate',"dlKyc('trans')"]])},1600)}}
{const _a=accept;accept=function(id){const t=S.kyc.trans;if(!t)return toast('Complete KYC & licence verification first');if(new Date(t.dlExp)<=new Date())return toast('Your driving licence has expired');const o=gO(id);_a(id);
 if(o.status==1){o.driver+=' · '+t.name;ev(o,'Driver '+t.name+' · licence '+t.dl+' verified');save();render();ok('Job accepted ✔','Driver and vehicle assigned. Collect the 4-digit pickup code from the farmer.',[['Order','#'+id],['Driver',t.name],['Licence',t.dl],['Delivery charge',inr(o.freight)]])}}}
function wrap(n,fn){const f=window[n];window[n]=function(id){const o=gO(id),s=o&&o.status;f(id);if(o&&o.status!=s)fn(o)}}
wrap('pickup',o=>ok('Pickup confirmed ✔','Produce collected from the farm. Tap “Start trip” when you leave.',[['Order','#'+o.id],['Produce',o.qty+' qtl '+o.crop]]));
wrap('trip',o=>ok('Trip started','The buyer can now see the order as in transit. Ask for the delivery OTP on arrival.',[['Destination',o.buyer],['Distance',o.km+' km']]));
wrap('deliver',o=>ok('Delivery complete — payment released!','Thank you! The farmer has been paid and your delivery charge is earned.',[['Farmer paid',inr(o.qty*o.price)],['Your delivery charge',inr(o.freight)],['Order','#'+o.id]],[['★ Rate this order','rate('+o.id+')']]));
{const _al=addListing;addListing=function(){const n=S.listings.length;_al();if(S.listings.length>n){const l=S.listings[0];ok('Produce listed!','Buyers can see your listing now.',[['Crop',l.crop+' · Grade '+l.grade],['Quantity',l.qty+' qtl'],['Price',inr(l.price)+'/qtl']])}}}
function transV(){const k=!!S.kyc.trans,open=S.orders.filter(o=>o.status==0),mine=S.orders.filter(o=>o.status>0);
 return `<div class="card"><h2>🚚 Transporter app</h2><p class="mut">Verify KYC and driving licence, accept funded orders, collect the farmer’s pickup code, and deliver with the buyer’s OTP.</p>
 <div class="stat" style="margin-top:10px"><div><b>${open.length}</b>Open jobs</div><div><b>${mine.filter(o=>o.status<4).length}</b>Active</div><div><b>${inr(mine.filter(o=>o.status==4).reduce((a,o)=>a+o.freight,0))}</b>Freight earned</div></div></div>
 <div class="card"><h3>Step 1 · KYC &amp; driving licence</h3><div id="kyc">${kycV('trans')}</div></div>
 <div class="card ${k?'':'lock'}"><h3>Step 2 · Open jobs (escrow funded) ${k?'':'🔒 complete KYC + licence to accept'}</h3>${open.length?open.map(o=>orderCard(o,'trans')).join(''):'<p class="mut">No open jobs. Place an order from the Buyer tab.</p>'}</div>
 <div class="card"><div class="row"><h3 style="flex:3">My jobs</h3><button class="b o s" style="flex:none;margin:0" onclick="dlCsv('trans')">⬇ Export CSV</button></div>${mine.length?mine.slice().reverse().map(o=>orderCard(o,'trans')).join(''):'<p class="mut">No assigned jobs yet.</p>'}</div>`+reviewV('trans')}
/* mandi vs price comparison */
function mandiV(role){const B=role=='buyer',t=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
 const rows=Object.keys(MANDI).map(c=>{const m=mandi(c),y=Math.round(MANDI[c]*(1+Math.sin((Date.now()-864e5)/36e5)*.02)),ch=m-y,ls=S.listings.filter(l=>l.crop==c&&l.qty>0),avg=ls.length?ls.reduce((a,l)=>a+l.price,0)/ls.length:0,
 mine=role=='farmer'?ls.filter(l=>l.own):role=='fpo'?ls.filter(l=>l.fpo):ls,p=B?(ls.length?Math.min(...ls.map(l=>l.price)):0):(mine.length?mine.reduce((a,l)=>a+l.price,0)/mine.length:0),d=p?(p-m)/m*100:0,
 cls=!p?'':B?(d>8?'w':''):(d>8?'w':d<-8?'r':''),msg=!p?(B?'No listings':'List to compare'):B?(d<=0?`${Math.abs(d).toFixed(1)}% below mandi · save ${inr(m-p)}/qtl`:`${d.toFixed(1)}% above mandi`):fairness(c,p)[1];
 return `<tr><td><b>${c}</b></td><td>${inr(m)} <span class="${ch>=0?'up':'dn'}">${ch>=0?'▲':'▼'}${Math.abs(ch)}</span></td><td>${avg?inr(avg):'–'}</td><td>${p?inr(p):'–'}</td><td><span class="pill ${cls}">${msg}</span></td></tr>`}).join('');
 return `<div class="card"><h3>📊 Mandi price vs ${B?'marketplace':'your'} price</h3><p class="mut">Agmarknet rates (simulated) · updated ${t}</p><div style="overflow-x:auto"><table class="mt2"><tr><th>Crop</th><th>Mandi ₹/qtl</th><th>Market avg</th><th>${B?'Best listed':role=='fpo'?'FPO price':'My price'}</th><th>Comparison</th></tr>${rows}</table></div></div>`}
/* reviews for every portal */
const stars=r=>[1,2,3,4,5].map(i=>`<span class="star ${i<=r?'on':''}" onclick="setStar(${i})">★</span>`).join('');
function setStar(i){RV.r=i;$('rv_s').innerHTML=stars(i)}
const rvItem=x=>`<div class="item"><div class="top"><b>${esc(x.who)} → ${LB[x.to]}</b><span class="pill w">${'★'.repeat(x.r)}</span></div><p>${esc(x.t)}</p><div class="mut">${esc(x.d)}</div></div>`;
function reviewV(role){const to=Object.keys(LB).filter(k=>k!=role),got=S.reviews.filter(x=>x.to==role),mine=S.reviews.filter(x=>x.by==role),pf=S.reviews.filter(x=>x.to=='platform'),dn=S.orders.filter(o=>o.status==4);
 const av=a=>a.length?(a.reduce((s,x)=>s+x.r,0)/a.length).toFixed(1)+'★':'–';
 return `<div class="card" id="rv"><h3>⭐ Reviews &amp; ratings</h3><div class="stat"><div><b>${av(got)}</b>Your rating</div><div><b>${got.length}</b>Received</div><div><b>${mine.length}</b>Written</div><div><b>${av(pf)}</b>AgriSetu</div></div>
 <div class="row"><div><label>Review for</label><select id="rv_t">${to.map(k=>`<option value="${k}">${LB[k]}</option>`).join('')}</select></div><div><label>Order (optional)</label><select id="rv_o"><option value="">General</option>${dn.map(o=>`<option value="${o.id}">#${o.id} · ${esc(o.crop)}</option>`).join('')}</select></div></div>
 <label>Your rating</label><div id="rv_s">${stars(RV.r)}</div><label>Comment</label><input id="rv_c" maxlength="140" placeholder="Share your experience"><button class="b" onclick="addRv('${role}')">Submit review</button>
 <h3 style="margin-top:16px">Reviews about ${LB[role]}</h3>${got.length?got.slice().reverse().map(rvItem).join(''):'<p class="mut">No reviews yet.</p>'}${mine.length?'<h3 style="margin-top:16px">Reviews I wrote</h3>'+mine.slice().reverse().map(rvItem).join(''):''}</div>`}
function addRv(role){const t=$('rv_t').value,o=$('rv_o').value,c=$('rv_c').value.trim();if(c.length<3)return toast('Please write a short comment');
 const nm=role=='fpo'?S.fpo.name:(S.kyc[role]||{}).name;S.reviews.push({by:role,to:t,r:RV.r,t:c,who:nm||'Demo '+LB[role],d:now().split(',')[0]+(o?' · order #'+o:'')});const r=RV.r;RV.r=5;save();render();
 ok('Thank you for your review!','Your review for '+LB[t]+' was submitted.',[['Rating','★'.repeat(r)],['Comment',c]])}
function rate(id){const s=$('rv_o');if(s)s.value=id;const e=$('rv');if(e)e.scrollIntoView({behavior:'smooth'});toast('Order #'+id+' selected — write your review below')}
{const f=farmerV;farmerV=()=>notesV('farmer')+f()+reviewV('farmer');const b=buyerV;buyerV=()=>notesV('buyer')+b()+reviewV('buyer')}
/* FPO portal */
function fpoRows(){const q=FQ.q.toLowerCase(),ms=S.fpo.members.filter(m=>(FQ.s=='all'||m.status==FQ.s)&&(m.name+m.village+m.mobile+m.crops).toLowerCase().includes(q));
 return ms.map(m=>{const ls=S.listings.filter(l=>l.mid==m.id),op=FQ.open==m.id;return `<div class="item"><div class="top"><div><b>${esc(m.name)}</b> <span class="pill ${m.status=='Active'?'':'r'}">${m.status}</span> <span class="pill ${m.kyc?'':'w'}">${m.kyc?'KYC ✔':'KYC pending'}</span><div class="mut">${esc(m.village)} · 📞 ${m.mobile} · ${m.land} acres · ${esc(m.crops)}</div></div><button class="b o s" style="flex:none;margin:0" onclick="fpoOpen(${m.id})">${op?'Hide':'Details'}</button></div>
 ${op?`<div class="ok" style="margin-top:8px"><p>Member ID FPO-M${m.id} · joined ${m.joined}</p><p>Listed via FPO: ${ls.length?ls.map(l=>`${l.qty} qtl ${esc(l.crop)} @ ${inr(l.price)}`).join(', '):'nothing yet'}</p>
 <div class="row" style="flex-wrap:wrap">${m.kyc?'':`<button class="b s" style="flex:none" onclick="fpoKyc(${m.id})">Verify KYC</button>`}<button class="b o s" style="flex:none" onclick="fpoTog(${m.id})">${m.status=='Active'?'Deactivate':'Activate'}</button><button class="b o s" style="flex:none" onclick="fpoDel(${m.id})">Remove</button></div>
 <h3 style="margin-top:12px">List produce for ${esc(m.name)}</h3><div class="row"><select id="fc_${m.id}">${Object.keys(MANDI).map(c=>`<option ${c==m.crops?'selected':''}>${c}</option>`).join('')}</select><input id="fq_${m.id}" type="number" min="1" value="20" placeholder="Qty (qtl)"><input id="fp_${m.id}" type="number" min="1" placeholder="₹/qtl"></div><button class="b s" onclick="fpoList(${m.id})">List produce</button></div>`:''}</div>`}).join('')||'<p class="mut">No members match.</p>'}
function drawF(){$('fl').innerHTML=fpoRows();applyLang()}
function fpoOpen(id){FQ.open=FQ.open==id?null:id;drawF()}
const gM=id=>S.fpo.members.find(m=>m.id==id);
function fpoTog(id){const m=gM(id);m.status=m.status=='Active'?'Inactive':'Active';save();render();toast(m.name+' is now '+m.status)}
function fpoKyc(id){const m=gM(id);m.kyc=1;save();render();ok('Member KYC verified','KYC of '+m.name+' is now marked verified. You can list produce for them.')}
function fpoDel(id){const m=gM(id);if(!confirm('Remove '+m.name+' from the FPO?'))return;S.fpo.members=S.fpo.members.filter(x=>x.id!=id);S.listings=S.listings.filter(l=>l.mid!=id);FQ.open=null;save();render();toast(m.name+' removed from FPO')}
function fpoAdd(){const n=$('fm_n').value.trim(),m=$('fm_m').value.trim(),v=$('fm_v').value.trim(),l=+$('fm_l').value,c=$('fm_c').value;
 if(n.length<2)return toast('Enter member name');if(!/^[6-9]\d{9}$/.test(m))return toast('Enter a valid 10-digit mobile number');if(!v)return toast('Enter village');if(!(l>0))return toast('Enter land holding in acres');
 if(S.fpo.members.some(x=>x.mobile==m))return toast('A member with this mobile already exists');
 const d=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}),id=S.fpo.seq++;S.fpo.members.push({id,name:n,village:v,mobile:m,land:l,crops:c,joined:d,status:'Active',kyc:0});FQ.open=id;save();render();
 ok('Member added successfully!',n+' is now part of '+S.fpo.name+'. Verify KYC to start listing produce.',[['Member ID','FPO-M'+id],['Village',v],['Land',l+' acres'],['Main crop',c]])}
function fpoList(id){const m=gM(id),c=$('fc_'+id).value,q=+$('fq_'+id).value,p=+$('fp_'+id).value;if(!m.kyc)return toast('Verify member KYC first');if(m.status!='Active')return toast('Activate the member first');if(!(q>0&&p>0))return toast('Enter quantity and price');
 S.listings.unshift({id:S.lseq++,crop:c,qty:q,price:p,farmer:m.name+' (FPO)',village:m.village,km:30+Math.floor(Math.random()*90),grade:'A',own:0,fpo:1,mid:id});save();render();
 ok('Produce listed for member!','Buyers can now see this listing.',[['Member',m.name],['Crop',q+' qtl '+c],['Price',inr(p)+'/qtl'],['Mandi today',inr(mandi(c))+'/qtl']])}
function fpoCsv(){const r='ID,Name,Village,Mobile,Land(acres),Crop,Joined,Status,KYC\n'+S.fpo.members.map(m=>[m.id,m.name,m.village,m.mobile,m.land,m.crops,m.joined,m.status,m.kyc?'Verified':'Pending'].map(x=>`"${x}"`).join(',')).join('\n');dl('FPO_members.csv',r,'text/csv')}
function fpoV(){const F=S.fpo,ms=F.members;return notesV('fpo')+`<div class="card"><h2>🤝 ${esc(F.name)}</h2><p class="mut">Registration ${F.reg} · manage members, verify KYC and sell produce on their behalf.</p>
 <div class="stat" style="margin-top:10px"><div><b>${ms.length}</b>Members</div><div><b>${ms.filter(m=>m.status=='Active').length}</b>Active</div><div><b>${ms.reduce((a,m)=>a+m.land,0).toFixed(1)}</b>Total acres</div><div><b>${S.listings.filter(l=>l.fpo).reduce((a,l)=>a+l.qty,0)}</b>Qtl listed</div></div></div>
 ${mandiV('fpo')}
 <div class="card"><h3>➕ Add member</h3><div class="row"><div><label>Full name</label><input id="fm_n"></div><div><label>Mobile number</label><input id="fm_m" maxlength="10" inputmode="numeric"></div></div>
 <div class="row"><div><label>Village</label><input id="fm_v"></div><div><label>Land (acres)</label><input id="fm_l" type="number" min="0.1" step="0.1"></div><div><label>Main crop</label><select id="fm_c">${Object.keys(MANDI).map(c=>`<option>${c}</option>`).join('')}</select></div></div><button class="b" onclick="fpoAdd()">Add member</button></div>
 <div class="card"><div class="row"><h3 style="flex:3">Members</h3><button class="b o s" style="flex:none;margin:0" onclick="fpoCsv()">⬇ Export CSV</button></div>
 <div class="row"><input id="fs" placeholder="Search name, village, mobile…" value="${esc(FQ.q)}" oninput="FQ.q=this.value;drawF()"><select onchange="FQ.s=this.value;drawF()">${['all','Active','Inactive'].map(s=>`<option ${FQ.s==s?'selected':''} value="${s}">${s=='all'?'All members':s}</option>`).join('')}</select></div><div id="fl">${fpoRows()}</div></div><div class="card"><h3>Orders on member produce</h3>${(()=>{const os=S.orders.filter(o=>o.fpo);return os.length?os.slice().reverse().map(o=>orderCard(o,'farmer')).join(''):'<p class="mut">No orders yet.</p>'})()}</div>`+reviewV('fpo')}

/* approval flow: buyer order -> seller approves + chooses transport */
FLOW[-1]='Awaiting approval / rejected';
function note(to,m){if(!to)return;S.notes=S.notes||[];S.notes.push({to,m,t:now()});save()}
function notesV(role){const n=(S.notes||[]).filter(x=>x.to==role);return n.length?`<div class="card"><div class="row"><h3 style="flex:3">🔔 Messages (${n.length})</h3><button class="b o s" style="flex:none;margin:0" onclick="clrNotes('${role}')">Mark all read</button></div>${n.slice().reverse().map(x=>`<div class="item"><div>${esc(x.m)}</div><div class="log">${x.t}</div></div>`).join('')}</div>`:''}
function clrNotes(r){S.notes=(S.notes||[]).filter(x=>x.to!=r);save();render()}
function apprX(o,who){if(!o.appr)return '';const id=o.id;
 if(o.appr=='pending')return who=='buyer'?`<p><span class="pill w">⏳ Waiting for farmer approval</span></p><p class="mut">Your money is safe in escrow. You will get a message once the farmer decides.</p>`:who=='farmer'?`<div class="ok" style="margin-top:8px"><b>📩 New order request</b><p>${esc(o.buyer)} wants ${o.qty} qtl ${esc(o.crop)} (${inr(o.qty*o.price)}). Do you need transportation?</p>
 <label style="color:var(--ink);font-size:14px"><input type="radio" name="tm_${id}" value="platform" style="width:auto"> Yes — book an AgriSetu transporter (${inr(o.freight)}, paid by buyer)</label>
 <label style="color:var(--ink);font-size:14px"><input type="radio" name="tm_${id}" value="self" style="width:auto"> No — buyer collects / I arrange it (delivery charge refunded to buyer)</label>
 <div class="row"><button class="b s" onclick="approve(${id})">✔ Approve order</button><button class="b o s" onclick="reject(${id})">✖ Reject</button></div></div>`:'';
 if(o.appr=='rejected')return `<p><span class="pill r">✖ Rejected · ${inr(o.total)} refunded to buyer</span></p>`;
 let x=`<p><span class="pill">✔ Approved · ${o.tm=='platform'?'AgriSetu transport':'No transport (self-arranged)'}</span></p>`;
 if(o.tm=='self'&&o.status<4){if(who=='buyer')x+=`<p>Your handover code: <span class="code">${o.otp}</span></p><p class="mut">Give it to the farmer only when you receive the produce. Delivery charge refunded: ${inr(o.refund)}.</p>`;if(who=='farmer')x+=`<label>Handover code from buyer</label><div class="row"><input id="hc_${id}" maxlength="4" inputmode="numeric" placeholder="4-digit code"><button class="b s" onclick="handover(${id})" style="flex:none">Complete handover</button></div>`}
 return x}
function approve(id,tm,auto){const o=gO(id);if(!o||o.appr!='pending')return;
 if(tm===undefined){const r=document.querySelector('input[name="tm_'+id+'"]:checked');if(!r)return toast('Choose whether you need transportation');tm=r.value}
 o.appr='approved';o.tm=tm;if(tm=='self'){o.total-=o.freight;o.refund=o.freight;o.freight=0;o.fr=null}
 ev(o,'Order approved by '+o.farmer+' · '+(tm=='platform'?'AgriSetu transporter requested':'transport self-arranged · delivery charge refunded'));
 note('buyer','Order #'+id+' approved by '+o.farmer+'. '+(tm=='platform'?'A transporter will be assigned shortly.':'No transport booked — collect it from the farmer. Delivery charge '+inr(o.refund)+' refunded.'));
 if(tm=='platform')note('trans','New funded job: order #'+id+' · '+o.km+' km · '+inr(o.freight));
 save();render();if(!auto)ok('Order approved ✔',tm=='platform'?'Transport request sent to AgriSetu transporters. Keep the pickup code ready.':'Self-arranged. Share nothing yet — the buyer will give you a handover code on collection.',[['Order','#'+id],['Transport',tm=='platform'?'AgriSetu transporter':'Not needed'],['Refunded to buyer',tm=='self'?inr(o.refund):'–']])}
function reject(id){const o=gO(id);if(!confirm('Reject order #'+id+'? The buyer will be refunded in full.'))return;o.appr='rejected';o.status=-1;ev(o,'Order rejected by seller · '+inr(o.total)+' refunded to buyer');note('buyer','Order #'+id+' was rejected by '+o.farmer+'. '+inr(o.total)+' refunded to you.');save();render();ok('Order rejected','The buyer has been notified and refunded in full.',[['Order','#'+id],['Refunded',inr(o.total)]])}
function handover(id){const o=gO(id);if($('hc_'+id).value!==o.otp)return toast('Incorrect handover code');o.status=4;ev(o,'Handed over to buyer · code verified · escrow released to farmer');note('buyer','Order #'+id+' handover complete. Thank you!');save();render();ok('Handover complete — payment released!','The farmer has been paid.',[['Order','#'+id],['Farmer paid',inr(o.qty*o.price)]],[['★ Rate this order','rate('+id+')']])}
/* ---------- Language (English / हिन्दी) ---------- */
const HI=[['A direct digital bridge from farm to buyer','खेत से खरीदार तक सीधा डिजिटल पुल'],['Farmer','किसान'],['Buyer','खरीदार'],['Transporter','ट्रांसपोर्टर'],['Reset','रीसेट'],
['Mobile OTP','मोबाइल OTP'],['Identity','पहचान'],['Documents','दस्तावेज़'],['Full name','पूरा नाम'],['Mobile number','मोबाइल नंबर'],['Enter OTP','OTP दर्ज करें'],['demo OTP: 1234','डेमो OTP: 1234'],['Verify OTP','OTP सत्यापित करें'],['Send OTP','OTP भेजें'],
['Aadhaar number (12 digits)','आधार नंबर (12 अंक)'],['Village / District','गाँव / ज़िला'],['Business name','व्यवसाय का नाम'],['Land holding (acres)','ज़मीन (एकड़)'],['GSTIN (optional)','GSTIN (वैकल्पिक)'],['UPI ID for payout','भुगतान पाने हेतु UPI ID'],['UPI ID for payments','भुगतान हेतु UPI ID'],
['I consent to Aadhaar e-KYC verification','मैं आधार e-KYC सत्यापन के लिए सहमति देता/देती हूँ'],['Continue','आगे बढ़ें'],['Upload ID proof / selfie (any image or PDF)','पहचान प्रमाण / सेल्फ़ी अपलोड करें (इमेज या PDF)'],['No file chosen','कोई फ़ाइल नहीं चुनी'],['Attached: ','संलग्न: '],['Submit for verification','सत्यापन हेतु जमा करें'],['Back','वापस'],
['Verifying with UIDAI (simulated)…','UIDAI से सत्यापन हो रहा है (डेमो)…'],['✔ KYC verified','✔ KYC सत्यापित'],['Aadhaar ','आधार '],['KYC ID','KYC आईडी'],['verified ','सत्यापित '],['⬇ Download KYC certificate','⬇ KYC प्रमाणपत्र डाउनलोड करें'],
['e.g. Ramesh Sahu','जैसे रमेश साहू'],['Contact person','संपर्क व्यक्ति'],['10-digit mobile','10 अंकों का मोबाइल'],['4-digit OTP','4 अंकों का OTP'],['4-digit code','4 अंकों का कोड'],['e.g. Dhamtari, Chhattisgarh','जैसे धमतरी, छत्तीसगढ़'],['e.g. Sharma Traders','जैसे शर्मा ट्रेडर्स'],
['Order placed · escrow funded','ऑर्डर दिया · एस्क्रो में राशि जमा'],['Transporter assigned: ','ट्रांसपोर्टर नियुक्त: '],['Transporter assigned','ट्रांसपोर्टर नियुक्त'],['Picked up','माल उठाया गया'],['In transit to buyer','खरीदार तक रास्ते में'],['In transit','रास्ते में'],['Delivered · farmer paid','डिलीवर · किसान को भुगतान'],
['Delivered · OTP verified · escrow released to farmer','डिलीवर · OTP सत्यापित · एस्क्रो किसान को जारी'],['Produce picked up from farm','खेत से उपज उठाई गई'],['Order placed · ','ऑर्डर दिया · '],[' held in escrow',' एस्क्रो में जमा'],
['Pickup code for driver:','ड्राइवर के लिए पिकअप कोड:'],['Share this code only when the transporter arrives.','यह कोड तभी बताएँ जब ट्रांसपोर्टर पहुँच जाए।'],['Your delivery OTP:','आपका डिलीवरी OTP:'],['Give it to the driver only after you receive the produce.','माल मिलने के बाद ही ड्राइवर को दें।'],
['Select vehicle','वाहन चुनें'],['Accept job & assign','काम स्वीकारें और वाहन लगाएँ'],['Pickup code from farmer','किसान से पिकअप कोड'],['Confirm pickup','पिकअप की पुष्टि करें'],['Start trip','यात्रा शुरू करें'],['Delivery OTP from buyer','खरीदार से डिलीवरी OTP'],['Complete delivery','डिलीवरी पूरी करें'],
['Escrow released','एस्क्रो जारी'],[' → farmer’s UPI',' → किसान के UPI में'],['⬇ Download invoice','⬇ चालान डाउनलोड करें'],['produce ','उपज '],['freight','भाड़ा'],['Freight earned','भाड़ा कमाई'],
['🌾 Farmer dashboard','🌾 किसान डैशबोर्ड'],['Complete KYC once, then list produce, get a fair-price check and track every order to payout.','एक बार KYC पूरा करें, फिर उपज सूचीबद्ध करें, उचित मूल्य जाँच पाएँ और भुगतान तक हर ऑर्डर ट्रैक करें।'],['Listings','लिस्टिंग'],['Orders on my produce','मेरी उपज पर ऑर्डर'],['Orders','ऑर्डर'],['Received','प्राप्त'],
['Step 1 · KYC verification','चरण 1 · KYC सत्यापन'],['Step 2 · List your produce','चरण 2 · अपनी उपज सूचीबद्ध करें'],['Step 3 · Orders on my produce','चरण 3 · मेरी उपज पर ऑर्डर'],['Complete KYC to unlock.','अनलॉक करने के लिए KYC पूरा करें।'],['Crop','फ़सल'],['Quantity (quintal)','मात्रा (क्विंटल)'],['Your price (₹/qtl)','आपका मूल्य (₹/क्विंटल)'],['Quality grade','गुणवत्ता ग्रेड'],['List produce','उपज सूचीबद्ध करें'],['My listings','मेरी लिस्टिंग'],[' available',' उपलब्ध'],['Remove','हटाएँ'],['Nothing listed yet.','अभी कुछ सूचीबद्ध नहीं है।'],
['⬇ Export CSV','⬇ CSV निर्यात करें'],['No orders yet. Switch to the Buyer tab to place one.','अभी कोई ऑर्डर नहीं। ऑर्डर देने के लिए खरीदार टैब पर जाएँ।'],['Live mandi rate (Agmarknet):','लाइव मंडी भाव (Agmarknet):'],['above mandi — may be hard to sell','मंडी से ऊपर — बिकना कठिन हो सकता है'],['below mandi — you can ask more','मंडी से कम — आप अधिक माँग सकते हैं'],['Fair price (','उचित मूल्य ('],['vs mandi)','बनाम मंडी)'],['mandi','मंडी'],['Mandi','मंडी'],['Grade','ग्रेड'],['qtl','क्विंटल'],['km','किमी'],
['🛒 Buyer portal','🛒 खरीदार पोर्टल'],['Browse verified farmer listings ranked by price and distance. Pay into escrow; funds release only after delivery OTP.','सत्यापित किसानों की लिस्टिंग मूल्य और दूरी के अनुसार देखें। एस्क्रो में भुगतान करें; डिलीवरी OTP के बाद ही राशि जारी होगी।'],['Step 1 · Buyer KYC','चरण 1 · खरीदार KYC'],['Step 2 · Marketplace','चरण 2 · बाज़ार'],['🔒 complete KYC to order','🔒 ऑर्डर के लिए KYC पूरा करें'],['Sort by','क्रमबद्ध करें'],['Best match (price + distance)','सर्वश्रेष्ठ मिलान (मूल्य + दूरी)'],['Lowest vs mandi','मंडी भाव से सबसे कम'],['Nearest','सबसे नज़दीक'],['All crops','सभी फ़सलें'],['★ Best match','★ सर्वश्रेष्ठ मिलान'],['Your farmer','आपका किसान'],[' left',' शेष'],['Order & pay','ऑर्डर करें व भुगतान करें'],['No listings match.','कोई लिस्टिंग नहीं मिली।'],['Step 3 · My orders','चरण 3 · मेरे ऑर्डर'],['No orders yet.','अभी कोई ऑर्डर नहीं।'],
['🚚 Transporter app','🚚 ट्रांसपोर्टर ऐप'],['Accept funded orders, collect the farmer’s pickup code, and complete delivery with the buyer’s OTP.','राशि जमा हो चुके ऑर्डर स्वीकारें, किसान से पिकअप कोड लें और खरीदार के OTP से डिलीवरी पूरी करें।'],['Open jobs (escrow funded)','खुले काम (एस्क्रो में राशि जमा)'],['Open jobs','खुले काम'],['Active','सक्रिय'],['No open jobs. Place an order from the Buyer tab.','कोई खुला काम नहीं। खरीदार टैब से ऑर्डर दें।'],['My jobs','मेरे काम'],['No assigned jobs yet.','अभी कोई काम नहीं सौंपा गया।'],
['Prototype · simulated OTP (1234), UPI escrow and mandi prices. Demo flow: Farmer KYC → list → Buyer KYC → order → Transporter accept → pickup → deliver.','प्रोटोटाइप · OTP (1234), UPI एस्क्रो और मंडी भाव डेमो हैं। क्रम: किसान KYC → लिस्टिंग → खरीदार KYC → ऑर्डर → ट्रांसपोर्टर स्वीकार → पिकअप → डिलीवरी।'],
['Enter your name','अपना नाम दर्ज करें'],['Enter a valid 10-digit mobile number','सही 10 अंकों का मोबाइल नंबर दर्ज करें'],['OTP sent (demo: 1234)','OTP भेजा गया (डेमो: 1234)'],['Wrong OTP — use 1234','गलत OTP — 1234 डालें'],['Mobile verified','मोबाइल सत्यापित'],['Aadhaar must be 12 digits','आधार 12 अंकों का होना चाहिए'],['Enter village / district','गाँव / ज़िला दर्ज करें'],['Enter business name','व्यवसाय का नाम दर्ज करें'],['Enter a valid UPI ID','सही UPI ID दर्ज करें'],['Please give consent to continue','आगे बढ़ने के लिए सहमति दें'],['Attach a document first','पहले दस्तावेज़ संलग्न करें'],['KYC verified ✔','KYC सत्यापित ✔'],['Enter quantity and price','मात्रा और मूल्य दर्ज करें'],['Produce listed — buyers can see it now','उपज सूचीबद्ध — अब खरीदार इसे देख सकते हैं'],['Quantity must be between 1 and ','मात्रा 1 से इतनी के बीच होनी चाहिए: '],['Order placed — payment in escrow','ऑर्डर दिया गया — भुगतान एस्क्रो में'],['Job accepted — vehicle assigned','काम स्वीकार — वाहन नियुक्त'],['Incorrect pickup code','पिकअप कोड गलत है'],['Pickup confirmed','पिकअप की पुष्टि हुई'],['Trip started','यात्रा शुरू'],['Incorrect delivery OTP','डिलीवरी OTP गलत है'],['Delivered — farmer paid ✔','डिलीवर — किसान को भुगतान ✔'],['No orders to export yet','निर्यात के लिए अभी कोई ऑर्डर नहीं'],['Download started','डाउनलोड शुरू'],['Reset all demo data?','सारा डेमो डेटा रीसेट करें?'],['Pay ','भुगतान: '],['into escrow via UPI?','एस्क्रो में UPI से जमा करें?'],['(Produce ','(उपज '],['Money is released to the farmer only after delivery.','राशि डिलीवरी के बाद ही किसान को दी जाएगी।'],
['Tomato','टमाटर'],['Onion','प्याज़'],['Potato','आलू'],['Paddy','धान'],['Wheat','गेहूँ'],['Arhar (Tur)','अरहर (तुअर)']].sort((a,b)=>b[0].length-a[0].length);
function tr(s){if(S.lang!=='hi')return s;for(const[e,h]of HI)if(s.includes(e))s=s.split(e).join(h);return s}
function applyLang(){const hi=S.lang==='hi';document.documentElement.lang=hi?'hi':'en';
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),ns=[];let n;while(n=w.nextNode())ns.push(n);
 ns.forEach(n=>{if(n.parentNode.closest('script,#toast,#lang'))return;if(n._o===undefined)n._o=n.nodeValue;n.nodeValue=hi?tr(n._o):n._o});
 document.querySelectorAll('[placeholder]').forEach(e=>{if(e._p===undefined)e._p=e.placeholder;e.placeholder=hi?tr(e._p):e._p});
 $('lang').style.display=S.lang?'none':'flex'}
function setLang(l){S.lang=l;save();render()}
const _R=render;render=function(){_R();$('tabs').insertAdjacentHTML('beforeend',`<button class="tab" onclick="setLang('${S.lang=='hi'?'en':'hi'}')">${S.lang=='hi'?'English':'हिन्दी'}</button>`);applyLang()};
const _D=drawKyc;drawKyc=function(r){_D(r);applyLang()};
const _P=priceHint;priceHint=function(){_P();applyLang()};
const _K=kycFile;kycFile=function(r){_K(r);applyLang()};
const _T=toast;toast=m=>_T(tr(m));
const _C=window.confirm.bind(window);window.confirm=m=>_C(tr(m));
render();
