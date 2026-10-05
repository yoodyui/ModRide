'use strict';
const center = [100.4938, 13.6516];
const statusEl = document.getElementById('vehicleStatus');
const info = document.getElementById('telemetryInfo');
const quality = document.getElementById('fixQuality');
const places = document.getElementById('places');
const searchInput=document.getElementById('search');
const feedback=document.getElementById('searchFeedback');
const card=document.getElementById('selectedCard');
const bookBtn=document.getElementById('bookBtn');
bookBtn.hidden=true;
document.querySelector('.trip').hidden=true;
const sourceLink=document.createElement('a');sourceLink.className='official-link';sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.textContent='ดูอาคารในแผนที่ทางการ มจธ.';card.append(sourceLink);
let selectedBuilding=null;
function searchBuildings(text){
 const q=text.toLowerCase().replace(/^(?:ช่วย|ฉัน|ผม|หนู|อยากจะ|อยาก|ต้องการ|พา|ไปยัง|ไปที่|ไป|ที่|ตึก|อาคาร|\s)+/,'').replace(/(?:หน่อย|ครับ|ค่ะ|คะ|นะ|\s)+$/,'').replace(/\s/g,'');
 if(!q)return campusDirectory;
 // Building codes are exact: N1 must not select N10 through N19.
 if(/^[ns]\d+$/.test(q))return campusDirectory.filter(d=>d.id.toLowerCase()===q);
 return campusDirectory.filter(d=>(d.name+' '+d.aliases).toLowerCase().replace(/\s/g,'').includes(q));
}
function renderBuildings(){
 const matches=searchBuildings(searchInput.value);places.replaceChildren();
 document.getElementById('resultCount').textContent=matches.length+' แห่ง';
 matches.forEach(d=>{const button=document.createElement('button');button.className='place'+(selectedBuilding?.id===d.id?' active':'');button.type='button';button.setAttribute('aria-pressed',String(selectedBuilding?.id===d.id));const code=document.createElement('span');code.className='place-icon';code.textContent=d.id;const text=document.createElement('span');const name=document.createElement('b');name.textContent=d.name;const zone=document.createElement('small');zone.textContent=d.id.startsWith('N')?'โซนเหนือ':'โซนใต้';text.append(name,zone);button.append(code,text);button.onclick=()=>selectBuilding(d);places.append(button);});
 if(!matches.length){const p=document.createElement('p');p.className='empty';p.textContent='ไม่พบอาคาร ลองชื่อ รหัส เช่น N10 หรือคำว่า หอสมุด';places.append(p);}
 return matches;
}
function selectBuilding(d){
 selectedBuilding=d;document.getElementById('selectedName').textContent=d.id+' · '+d.name;
 document.getElementById('selectedStop').textContent=d.sourceConflict?'ชื่อในรายการและป้ายบนภาพของแหล่งข้อมูลไม่ตรงกัน กรุณาตรวจสอบก่อนกำหนดจุดรับ–ส่ง':'ชื่อจากแผนที่ทางการ มจธ. · จุดรับ–ส่งรถยังรอยืนยันพิกัด';
 sourceLink.href=d.source;card.classList.remove('hidden');feedback.textContent='เลือก '+d.id+' แล้ว';renderBuildings();card.scrollIntoView({block:'nearest',behavior:'smooth'});
 if(window.syncBuildingSelection)window.syncBuildingSelection(d);
}
searchInput.addEventListener('input',renderBuildings);
document.getElementById('searchForm').addEventListener('submit',e=>{e.preventDefault();const matches=renderBuildings();if(matches.length===1)selectBuilding(matches[0]);else feedback.textContent=matches.length?'พบหลายอาคาร กรุณาเลือกจากรายการ':'ไม่พบชื่ออาคารนี้';});
feedback.textContent='ค้นหาชื่อ รหัส หรือพิมพ์ เช่น ไปหอสมุด';
renderBuildings();
let map, marker, socket, lastStamp=0, lastReceived=0, threeD=true;
const panel=document.createElement('details');panel.className='connection';
panel.innerHTML='<summary>เชื่อมต่อสัญญาณรถ</summary><form id="connectForm"><label for="streamUrl">Telemetry WebSocket</label><input id="streamUrl" type="url" placeholder="wss://your-server/telemetry" required><button type="submit">เชื่อมต่อ</button><button type="button" id="disconnect">ตัดการเชื่อมต่อ</button></form><p id="connectionStatus" role="status">ยังไม่ได้เชื่อมต่อ</p>';
document.querySelector('.content').append(panel);
const connectionStatus=document.getElementById('connectionStatus');
function stale(message){statusEl.textContent=message;quality.textContent='—';if(marker)marker.getElement().classList.add('stale');}
function acceptTelemetry(d){
  if(d.vehicle_id!=='modride-01')return false;
  if(typeof d.timestamp!=='string')return false;
  const stamp=Date.parse(d.timestamp),age=Date.now()-stamp;
  if(!Number.isFinite(stamp)||age>5000||age< -2000||stamp<=lastStamp)return false;
  if(d.fix_valid!==true){lastStamp=stamp;stale('ตำแหน่งยังไม่พร้อม');return false;}
  if(!Number.isFinite(d.latitude)||!Number.isFinite(d.longitude)||Math.abs(d.latitude)>90||Math.abs(d.longitude)>180)return false;
  lastStamp=stamp;lastReceived=Date.now();
  if(!marker){const el=document.createElement('div');el.className='ant-marker';el.setAttribute('aria-label','ตำแหน่ง ModRide 01');el.innerHTML='<img src="./ant.svg" alt="รถ ModRide" width="32" height="32">';marker=new maplibregl.Marker({element:el,rotationAlignment:'map'}).setLngLat([d.longitude,d.latitude]).addTo(map);map.easeTo({center:[d.longitude,d.latitude],duration:600});}
  marker.setLngLat([d.longitude,d.latitude]);marker.getElement().classList.remove('stale');
  const heading=d.heading_valid===true&&Number.isFinite(d.heading_deg)?d.heading_deg:null;
  // The side-profile mascot faces right; compensate so 0 degrees means north.
  marker.setRotation(heading===null?0:((heading-90)%360+360)%360);
  statusEl.textContent='รับตำแหน่งจากรถ';
  quality.textContent=['rtk_fixed','rtk_float','gnss','dead_reckoning'].includes(d.fix)?d.fix.replaceAll('_',' '):'GNSS';
  const accuracy=Number.isFinite(d.h_acc_m)&&d.h_acc_m>=0?d.h_acc_m.toFixed(2)+' ม.':'—';
  info.textContent=`${d.latitude.toFixed(6)}, ${d.longitude.toFixed(6)} · ±${accuracy}${heading===null?' · ทิศทางไม่พร้อม':''}`;
  return true;
}
try{
 map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/positron',center,zoom:16.3,pitch:48,bearing:-24,antialias:true,attributionControl:true});
 map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
 map.on('load',()=>setupCampusMap(map).catch(()=>{feedback.textContent='โหลดข้อมูลอาคารไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ';}));
 // No fence masks or invented routes. Extrusions use actual OSM footprints.
 document.getElementById('recenter').onclick=()=>map.flyTo({center:marker?marker.getLngLat():center,zoom:16.3,pitch:threeD?48:0,bearing:threeD?-24:0});
 document.getElementById('tilt').onclick=e=>{threeD=!threeD;e.currentTarget.classList.toggle('active',threeD);e.currentTarget.setAttribute('aria-pressed',String(threeD));map.easeTo({pitch:threeD?48:0,bearing:threeD?-24:0,duration:500});};
}catch(e){document.getElementById('map').textContent='โหลดแผนที่ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตและเปิดใหม่';}
document.getElementById('connectForm').addEventListener('submit',e=>{
 e.preventDefault();let url;try{url=new URL(document.getElementById('streamUrl').value);}catch{connectionStatus.textContent='กรุณาระบุ URL ให้ถูกต้อง';return;}
 if(!['wss:','ws:'].includes(url.protocol)||(location.protocol==='https:'&&url.protocol!=='wss:')){connectionStatus.textContent='เว็บ HTTPS ต้องเชื่อมต่อด้วย wss://';return;}
 if(!map){connectionStatus.textContent='กรุณาโหลดแผนที่ให้สำเร็จก่อน';return;}
 if(socket){socket.onclose=null;socket.onmessage=null;socket.close();}
 lastStamp=0;lastReceived=0;stale('กำลังเชื่อมต่อกับรถ');
 socket=new WebSocket(url.href);connectionStatus.textContent='กำลังเชื่อมต่อ…';
 socket.onopen=()=>{connectionStatus.textContent='เชื่อมต่อแล้ว รอข้อมูลตำแหน่ง';};
 socket.onmessage=e=>{try{acceptTelemetry(JSON.parse(e.data));}catch{connectionStatus.textContent='รูปแบบข้อมูลไม่ถูกต้อง';}};
 socket.onerror=()=>{connectionStatus.textContent='เชื่อมต่อไม่สำเร็จ ตรวจสอบเซิร์ฟเวอร์และสิทธิ์เข้าถึง';};
 socket.onclose=()=>{stale('ขาดการเชื่อมต่อ');connectionStatus.textContent='ปิดการเชื่อมต่อแล้ว';};
});
document.getElementById('disconnect').onclick=()=>{if(socket)socket.close();stale('ยังไม่ได้เชื่อมต่อกับรถ');};
setInterval(()=>{if(lastReceived&&Date.now()-lastReceived>5000)stale('ข้อมูลตำแหน่งเกิน 5 วินาที');},1000);
