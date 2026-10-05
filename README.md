# ModRide

KMUTT Autonomous Golf Cart — เว็บแผนที่ 3D ต้นแบบสำหรับเลือกอาคารปลายทางและแสดงตำแหน่งรถหนึ่งคัน

## ดาวน์โหลดโค้ด

เลือก **Code → Download ZIP** หรือใช้:

```sh
git clone https://github.com/yoodyui/ModRide.git
cd ModRide
```

คู่มือสำหรับนักศึกษาและผู้พัฒนามีรายละเอียดด้านล่าง

## เปิดใช้งาน

1. แตกไฟล์ ZIP (หรือ clone repository) แล้วเปิด Terminal ในโฟลเดอร์ ModRide
2. เครื่องต้องมี Python 3 จากนั้นรัน:

```sh
python3 -m http.server 8000 --directory dist
```

บน Windows ใช้ `py -m http.server 8000 --directory dist` ได้
3. เปิด http://localhost:8000 ในเบราว์เซอร์
4. กด Ctrl+C ใน Terminal เมื่อต้องการปิดเซิร์ฟเวอร์

อย่าเปิด index.html ด้วยการดับเบิลคลิก เพราะแอปโหลดไฟล์ JSON ผ่าน fetch
ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อโหลด MapLibre ฟอนต์ และแผนที่พื้นหลัง
ไม่ต้องมี API key เพื่อเปิดตัวอย่างนี้

## ไฟล์สำคัญ

- dist/index.html: โครงหน้าเว็บ
- dist/refined.css: รูปแบบและ responsive layout
- dist/ant.svg: มาสคอตมดสีส้ม
- dist/modride.js: ค้นหา เลือกอาคาร และรับ telemetry
- dist/campus-map.js: ป้ายชื่อ การคลิก/ไฮไลต์ และอาคาร 3D
- dist/buildings.js: รายชื่ออาคาร
- dist/building-locations.json: พิกัดอ้างอิงและที่มาของข้อมูล
- dist/campus-buildings.geojson: รูปทรงอาคารจาก OSM
- scripts/: เครื่องมือเตรียมข้อมูล (ไม่จำเป็นสำหรับเปิดแอป)
- [F9R-INTEGRATION.md](F9R-INTEGRATION.md): รูปแบบข้อความและแนวทางเชื่อมต่อ F9R

สคริปต์เตรียมข้อมูลใช้ Node.js และ curl; prepare-map-data.mjs ต้องรับไฟล์
OSM API JSON เป็นอาร์กิวเมนต์ ไม่มีไฟล์ดิบดังกล่าวใน ZIP นี้

## ข้อจำกัดสำคัญ

นี่คือ UI ต้นแบบ ไม่ใช่ระบบขับรถ และไม่ส่งคำสั่งควบคุมรถ
ไม่มี telemetry server หรือ GNSS driver รวมอยู่ ต้องพัฒนา/ติดตั้งแยก
ชื่ออาคาร 35 แห่งอ้างอิงเว็บ มจธ.; จับคู่รูปอาคารได้ 20 แห่ง
ป้ายเส้นประยังไม่ยืนยันรูปอาคาร ตำแหน่งทั้งหมดไม่ใช่จุดจอดที่ผ่านการสำรวจ
ความสูงใช้จำนวนชั้น OSM × 3 เมตร หรือค่าจำลอง 9 เมตรเมื่อไม่มีข้อมูล
อย่านำรูปทรง/ความสูง/พิกัดชุดนี้ไปใช้เป็นข้อมูลความปลอดภัยในการขับรถ

## แหล่งข้อมูลและการแบ่งปัน

- รายชื่อและลิงก์นำทาง: https://bgm.kmutt.ac.th/MapNavi/MAPNAVI.html
- รูปอาคาร: © OpenStreetMap contributors https://www.openstreetmap.org/copyright
- แผนที่พื้นหลัง: OpenFreeMap / OpenMapTiles / OpenStreetMap

เก็บข้อความ attribution และปฏิบัติตามเงื่อนไขข้อมูลต้นทางเมื่อเผยแพร่ต่อ
แพ็กเกจนี้ไม่รวม .git, .openai, credential หรือสิทธิ์แก้ไขเว็บส่วนตัวของอาจารย์
การส่ง ZIP ไม่ได้ให้สิทธิ์แก้ไขเว็บที่เผยแพร่อยู่ นักศึกษารันสำเนาในเครื่องตนเองได้
