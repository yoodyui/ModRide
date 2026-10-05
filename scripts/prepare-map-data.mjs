import {readFileSync,writeFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(process.argv[2],'utf8'));
const nodes=new Map(data.elements.filter(e=>e.type==='node').map(e=>[e.id,[e.lon,e.lat]]));
const ways=new Map(data.elements.filter(e=>e.type==='way').map(e=>[e.id,e]));
function ring(w){return w?.nodes?.map(id=>nodes.get(id));}
function valid(r){return r?.length>=4&&r.every(Boolean)&&JSON.stringify(r[0])===JSON.stringify(r.at(-1));}
function joinMembers(members){
 const pending=members.map(m=>ways.get(m.ref)?.nodes?.slice()).filter(Boolean),result=[];
 while(pending.length){const r=pending.shift();let changed=true;while(r[0]!==r.at(-1)&&changed){changed=false;for(let i=0;i<pending.length;i++){const p=pending[i];if(p[0]===r.at(-1)||p.at(-1)===r.at(-1)){if(p.at(-1)===r.at(-1))p.reverse();r.push(...p.slice(1));pending.splice(i,1);changed=true;break;}}}result.push(r.map(id=>nodes.get(id)));}return result;
}
const features=[];
for(const e of data.elements){
 if(!e.tags?.building)continue;
 let geometry;
 if(e.type==='way'){const r=ring(e);if(valid(r))geometry={type:'Polygon',coordinates:[r]};}
 if(e.type==='relation'){
  const outer=joinMembers(e.members.filter(m=>m.role==='outer'));
  const inner=joinMembers(e.members.filter(m=>m.role==='inner'));
  if(outer.length===1&&[...outer,...inner].every(valid))geometry={type:'Polygon',coordinates:[...outer,...inner]};
 }
 if(!geometry)continue;
 const h=Number.parseFloat(e.tags.height),levels=Number(e.tags['building:levels']);
 const height=Number.isFinite(h)&&h>0?h:levels>0?levels*3:9;
 features.push({type:'Feature',id:e.id,geometry,properties:{osmId:e.type+'/'+e.id,name:e.tags['name:th']||e.tags.name||'',height,heightSource:h>0?'osm-height':levels>0?'levels-estimate':'display-default',levels:levels||null}});
}
function inside(p,r){let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}
const locations=JSON.parse(readFileSync('dist/building-locations.json','utf8'));
// Match explicit OSM names to the official directory. Do not snap unmatched pins
// to the nearest footprint: several navigation targets fall on other buildings.
const named={S2:378153794,S3:9183623,S4:420044928,S5:420045662,S6:420051710,S7:436983066,S9:651713745,S10:1333533934,S11:420533543,S12:420534334,S13:420534582,S15:436983067,N3:436983064,N4:436983063,N9:346450376,N10:311879209,N11:224982053,N16:1333533935,N17:420534143,N20:436983061};
for(const b of locations.buildings){
 delete b.footprintId;delete b.matchMethod;
 const found=features.filter(f=>f.id===named[b.id]);
 console.log(b.id,found.map(f=>`${f.id}: ${f.properties.name}`));
 if(found.length===1){b.footprintId=found[0].id;found[0].properties.directoryId=b.id;b.matchMethod='osm-name-matched-to-official-directory';
  const r=found[0].geometry.coordinates[0].slice(0,-1);
  b.labelCoordinates=r.reduce((a,p)=>[a[0]+p[0]/r.length,a[1]+p[1]/r.length],[0,0]);
 }
}
writeFileSync('dist/campus-buildings.geojson',JSON.stringify({type:'FeatureCollection',features})+'\n');
writeFileSync('dist/building-locations.json',JSON.stringify(locations,null,2)+'\n');
