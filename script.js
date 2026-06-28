const seedAssets = [
  {assetNo:"CLC-IT-00001",type:"Laptop",brand:"Dell",model:"Latitude 5540",serial:"ABC12345",project:"العثيم بارك - الدمام",user:"أحمد محمد",status:"مستخدم",handoverDate:"2026-06-01",notes:""},
  {assetNo:"CLC-IT-00002",type:"Monitor",brand:"Lenovo",model:"ThinkVision 24",serial:"MON9988",project:"العثيم بارك - الدمام",user:"أحمد محمد",status:"مستخدم",handoverDate:"2026-06-01",notes:""},
  {assetNo:"CLC-IT-00003",type:"Printer",brand:"HP",model:"LaserJet M404",serial:"HP445566",project:"مدارس الحياة",user:"مكتب الموقع",status:"متاح بالمخزن",handoverDate:"",notes:""}
];

let assets = JSON.parse(localStorage.getItem("clc_assets") || "null") || seedAssets;
let handovers = JSON.parse(localStorage.getItem("clc_handovers") || "[]");
let maintenance = JSON.parse(localStorage.getItem("clc_maintenance") || "[]");
let role = localStorage.getItem("clc_role") || "user";

function save(){
  localStorage.setItem("clc_assets", JSON.stringify(assets));
  localStorage.setItem("clc_handovers", JSON.stringify(handovers));
  localStorage.setItem("clc_maintenance", JSON.stringify(maintenance));
}

function nextAssetNo(){
  const nums = assets.map(a => parseInt((a.assetNo||"").replace(/\D/g,''))).filter(Boolean);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  return "CLC-IT-" + String(next).padStart(5,"0");
}

function toast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg; t.style.display="block";
  setTimeout(()=>t.style.display="none",2200);
}

function setRole(newRole){
  role = newRole;
  localStorage.setItem("clc_role",role);
  document.querySelectorAll(".admin-only").forEach(el=>el.style.display = role==="admin" ? "" : "none");
  renderAssets();
}

function navigate(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(page).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
  document.querySelector(`[data-page="${page}"]`).classList.add("active");
  document.getElementById("pageTitle").textContent = document.querySelector(`[data-page="${page}"]`).textContent;
}

function renderDashboard(){
  const countType = t => assets.filter(a=>a.type===t).length;
  document.getElementById("totalAssets").textContent = assets.length;
  document.getElementById("totalLaptops").textContent = countType("Laptop");
  document.getElementById("totalDesktops").textContent = countType("Desktop");
  document.getElementById("totalMonitors").textContent = countType("Monitor");
  document.getElementById("totalPrinters").textContent = countType("Printer");
  document.getElementById("totalMaintenance").textContent = assets.filter(a=>a.status==="بالصيانة").length;

  const byProject = {};
  assets.forEach(a=>byProject[a.project]=(byProject[a.project]||0)+1);
  document.getElementById("projectSummary").innerHTML = Object.entries(byProject)
    .map(([p,c])=>`<div><b>${p}</b> — ${c} أصل / جهاز</div>`).join("") || "<div>لا توجد بيانات</div>";
}

function updateFilters(){
  const projects=[...new Set(assets.map(a=>a.project).filter(Boolean))];
  const types=[...new Set(assets.map(a=>a.type).filter(Boolean))];
  const pf=document.getElementById("projectFilter"), tf=document.getElementById("typeFilter");
  const oldP=pf.value, oldT=tf.value;
  pf.innerHTML='<option value="">كل المشاريع</option>'+projects.map(p=>`<option>${p}</option>`).join("");
  tf.innerHTML='<option value="">كل الأنواع</option>'+types.map(t=>`<option>${t}</option>`).join("");
  pf.value=oldP; tf.value=oldT;
}

function renderAssets(){
  updateFilters();
  const q=document.getElementById("searchInput")?.value?.trim() || "";
  const project=document.getElementById("projectFilter")?.value || "";
  const type=document.getElementById("typeFilter")?.value || "";
  let rows = assets.filter(a=>{
    const text = Object.values(a).join(" ");
    return (!q || text.includes(q)) && (!project || a.project===project) && (!type || a.type===type);
  });

  document.getElementById("assetsTable").innerHTML = rows.map((a,i)=>{
    const realIndex = assets.indexOf(a);
    return `<tr>
      <td><b>${a.assetNo}</b></td>
      <td>${a.type}</td>
      <td>${a.brand}</td>
      <td>${a.model}</td>
      <td>${a.serial}</td>
      <td>${a.project}</td>
      <td>${a.user}</td>
      <td><span class="badge">${a.status}</span></td>
      <td class="qr">QR-${a.assetNo}</td>
      <td class="admin-only">
        <button class="edit" onclick="editAsset(${realIndex})">تعديل</button>
        <button class="danger" onclick="deleteAsset(${realIndex})">حذف</button>
      </td>
    </tr>`
  }).join("");
  setRole(role);
  renderDashboard();
}

function deleteAsset(i){
  if(role!=="admin"){toast("غير مسموح بالحذف للمستخدم العادي");return;}
  if(confirm("هل تريد حذف هذا الأصل؟")){
    assets.splice(i,1); save(); renderAssets(); toast("تم الحذف");
  }
}

function editAsset(i){
  if(role!=="admin"){toast("غير مسموح بالتعديل");return;}
  const a=assets[i];
  const newUser=prompt("المستخدم الحالي:", a.user);
  if(newUser!==null){a.user=newUser; save(); renderAssets(); toast("تم التعديل");}
}

function renderLogs(){
  document.getElementById("handoverList").innerHTML = handovers.map(h=>`<li><b>${h.date}</b> — ${h.assetNo} من ${h.from||"-"} إلى ${h.to} / ${h.project}</li>`).join("");
  document.getElementById("maintenanceList").innerHTML = maintenance.map(m=>`<li><b>${m.date}</b> — ${m.assetNo}: ${m.issue} — ${m.action||"لم يحدد إجراء"}</li>`).join("");
}

function exportCSV(){
  const header = ["رقم الأصل","نوع الجهاز","الشركة","الموديل","Serial","المشروع","المستخدم","الحالة","تاريخ التسليم","ملاحظات"];
  const lines = [header.join(",")].concat(assets.map(a=>[a.assetNo,a.type,a.brand,a.model,a.serial,a.project,a.user,a.status,a.handoverDate,a.notes].map(v=>`"${String(v||"").replaceAll('"','""')}"`).join(",")));
  const blob = new Blob(["\uFEFF"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="CLC_IT_Assets.csv"; a.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>navigate(btn.dataset.page)));
document.getElementById("roleSelect").value=role;
document.getElementById("roleSelect").addEventListener("change",e=>setRole(e.target.value));

document.getElementById("assetForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target).entries());
  if(assets.some(a=>a.serial===data.serial)){toast("هذا السيريال مسجل من قبل");return;}
  assets.push({assetNo:nextAssetNo(),...data});
  save(); e.target.reset(); renderAssets(); toast("تمت إضافة الأصل بنجاح");
});

document.getElementById("handoverForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target).entries());
  handovers.unshift({date:new Date().toLocaleDateString("ar-SA"),...data});
  const asset=assets.find(a=>a.assetNo===data.assetNo);
  if(asset){asset.user=data.to; asset.project=data.project; asset.status="مستخدم";}
  save(); e.target.reset(); renderLogs(); renderAssets(); toast("تم تسجيل الحركة");
});

document.getElementById("maintenanceForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target).entries());
  maintenance.unshift({date:new Date().toLocaleDateString("ar-SA"),...data});
  const asset=assets.find(a=>a.assetNo===data.assetNo);
  if(asset){asset.status="بالصيانة";}
  save(); e.target.reset(); renderLogs(); renderAssets(); toast("تم تسجيل الصيانة");
});

["searchInput","projectFilter","typeFilter"].forEach(id=>document.getElementById(id).addEventListener("input",renderAssets));
renderAssets();
renderLogs();
setRole(role);
