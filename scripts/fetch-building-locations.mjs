import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const only=process.argv.slice(2);
const rows=only.length?JSON.parse(readFileSync('dist/building-locations.json','utf8')).buildings.filter(d=>!only.includes(d.id)):[];
for(const zone of ['S','N'])for(let i=1;i<=(zone==='S'?15:20);i++){
 const id=zone+i,source=`https://bgm.kmutt.ac.th/MapNavi/${id}.html`;
 if(only.length&&!only.includes(id))continue;
 const html=execFileSync('curl',['-fsSL','--max-time','25',source],{encoding:'utf8'});
 const link=html.match(/https:\/\/(?:goo\.gl\/maps|maps\.app\.goo\.gl)\/[^"\s<]+/i)?.[0];
 let coordinates=null,resolved=null;
 if(link){const headers=execFileSync('curl',['-sSI','--max-time','25',link],{encoding:'utf8'});resolved=headers.match(/^location:\s*(.+)/im)?.[1]?.trim();const m=resolved?.match(/!3d(-?[\d.]+)!4d(-?[\d.]+)/);if(m)coordinates=[Number(m[2]),Number(m[1])];}
 rows.push({id,coordinates,source,navigationLink:link,resolved});console.log(id,coordinates);
}
writeFileSync('dist/building-locations.json',JSON.stringify({retrieved:'2026-10-04',note:'Navigation reference points from KMUTT official links, not surveyed pickup locations.',buildings:rows},null,2)+'\n');
