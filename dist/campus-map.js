'use strict';
// Directory names, official navigation points and OSM geometry have separate provenance.
async function setupCampusMap(map) {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const [locations,geometry]=await Promise.all(['building-locations.json','campus-buildings.geojson'].map(async url=>{const r=await fetch('./'+url);if(!r.ok)throw new Error(url);return r.json();}));
 const byId=new Map(campusDirectory.map(d=>[d.id,d]));
 const footprints=new Map(geometry.features.map(f=>[f.id,f]));
 const labels=new Map();let hovered=null,selected=null;
 map.fitBounds([[100.4915,13.6485],[100.496,13.6547]],{padding:innerWidth>780?{left:405,right:70,top:100,bottom:90}:{left:35,right:35,top:80,bottom:innerHeight*.5},duration:0});
 map.addSource('campus-buildings',{type:'geojson',data:geometry});
 map.addLayer({id:'campus-3d',type:'fill-extrusion',source:'campus-buildings',paint:{
  'fill-extrusion-height':['get','height'],
  'fill-extrusion-base':0,
  'fill-extrusion-color':['case',['boolean',['feature-state','active'],false],'#f28b42',['boolean',['feature-state','hover'],false],'#ffb574',['==',['get','heightSource'],'levels-estimate'],'#d7c1a8','#dce2df'],
  'fill-extrusion-opacity':0.9,
  'fill-extrusion-color-transition':{duration:reduced?0:180}
 }});
 const legend=document.createElement('details');legend.className='map-legend';
 legend.innerHTML='<summary>อาคาร 3D · ข้อมูลความสูง ⓘ</summary><p>สีทราย: ประมาณจากจำนวนชั้น OSM × 3 ม.<br>สีเทา: ไม่ทราบความสูง ใช้ 9 ม. เพื่อแสดงผล<br>ป้ายเส้นประ: พิกัดนำทางจาก มจธ. ยังไม่จับคู่รูปอาคาร<br>ไม่ใช่ข้อมูลสำรวจหรือจุดจอดรถที่ยืนยันแล้ว</p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">รูปอาคาร © OpenStreetMap contributors</a>';
 document.querySelector('main').append(legend);
 function highlight(id,on){const d=byId.get(id);if(d?.footprintId)map.setFeatureState({source:'campus-buildings',id:d.footprintId},{hover:on});const el=labels.get(id);if(el){el.classList.toggle('hovered',on);el.parentElement.style.zIndex=on?'20':id===selected?'15':'1';}}
 function hover(id){if(hovered)highlight(hovered,false);hovered=id;if(id)highlight(id,true);}
 function describe(d){const f=footprints.get(d.footprintId);let s=f?(f.properties.heightSource==='levels-estimate'?`ความสูงประมาณ ${f.properties.height} ม. (OSM ${f.properties.levels} ชั้น × 3 ม.)`:f.properties.heightSource==='osm-height'?`ความสูงตาม OSM ${f.properties.height} ม.`:'ไม่ทราบความสูงจริง · ใช้ 9 ม. สำหรับแสดงผล'):'พิกัดนำทางจากเว็บ มจธ. · ยังไม่ยืนยันรูปอาคาร';if(d.sourceConflict)s+=' · ชื่อในแหล่งข้อมูลมีข้อขัดแย้ง';return s+' · จุดรับ–ส่งยังไม่ยืนยัน';}
 for(const loc of locations.buildings){const d=byId.get(loc.id);if(!d||!loc.coordinates)continue;Object.assign(d,loc);
  const wrapper=document.createElement('div');wrapper.className='building-pin';
  const button=document.createElement('button');button.type='button';button.className='building-label'+(loc.footprintId?'':' unverified');button.setAttribute('aria-label',d.id+' '+d.name);button.title=d.id+' · '+d.name;
  const code=document.createElement('b');code.textContent=d.id;const name=document.createElement('span');name.textContent=d.name;button.append(code,name);wrapper.append(button);labels.set(d.id,button);
  button.addEventListener('mouseenter',()=>hover(d.id));button.addEventListener('mouseleave',()=>hover(null));button.addEventListener('focus',()=>hover(d.id));button.addEventListener('blur',()=>hover(null));
  button.addEventListener('click',e=>{e.stopPropagation();searchInput.value='';selectBuilding(d);});
  new maplibregl.Marker({element:wrapper,anchor:'bottom'}).setLngLat(loc.labelCoordinates||loc.coordinates).addTo(map);
 }
 window.syncBuildingSelection=d=>{
  if(selected){const old=byId.get(selected);if(old?.footprintId)map.setFeatureState({source:'campus-buildings',id:old.footprintId},{active:false});labels.get(selected)?.classList.remove('selected');}
  selected=d.id;labels.get(d.id)?.classList.add('selected');if(d.footprintId)map.setFeatureState({source:'campus-buildings',id:d.footprintId},{active:true});
  document.getElementById('selectedStop').textContent=describe(d);
  if(d.coordinates)map.easeTo({center:d.labelCoordinates||d.coordinates,zoom:18,padding:innerWidth>780?{left:390,right:40,top:80,bottom:80}:{left:25,right:25,top:80,bottom:innerHeight*.48},duration:reduced?0:700});
 };
 map.on('mousemove','campus-3d',e=>{const id=e.features?.[0]?.properties.directoryId;map.getCanvas().style.cursor=id?'pointer':'';hover(id||null);});
 map.on('mouseleave','campus-3d',()=>{map.getCanvas().style.cursor='';hover(null);});
 map.on('click','campus-3d',e=>{const d=byId.get(e.features?.[0]?.properties.directoryId);if(d){searchInput.value='';selectBuilding(d);}});
 if(selectedBuilding)window.syncBuildingSelection(selectedBuilding);
 return {labels:labels.size,matched:locations.buildings.filter(d=>d.footprintId).length};
}
