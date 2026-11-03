# โอตะม้าซิ่ง Broadcast

แผงควบคุมใน OBS (Custom Browser Dock) กับหน้าจอออกอากาศ (Browser Source) สำหรับ **การ์ดรายชื่อม้า** และ **รายการแข่งขัน** ของโอตะม้าซิ่ง เป็นเว็บ static บน GitHub Pages ไม่มี server ไม่มีล็อกอิน และไม่เกี่ยวกับเกม POG

| หน้า | URL | ใช้ใน OBS เป็น |
| --- | --- | --- |
| Dock | `https://rikinozomu.github.io/otamasing-broadcast/#/dock` | Docks → Custom Browser Docks |
| หน้าจอออกอากาศ | `https://rikinozomu.github.io/otamasing-broadcast/#/overlay` | Sources → Browser ขนาด 1920×1080 (ตัวเดียว) |

## ใช้งาน

- หน้าจอออกอากาศแสดงสิ่งที่ **Active** อยู่ใน dock: "หน้าแรก" (รายการแข่งขันทั้งหมด) หรือการ์ดรายชื่อม้าของรายการหนึ่ง เปลี่ยน Active แล้วมีทรานซิชัน (Wipe / Slide / Fade / ไม่มี)
- แท็บ **รายการแข่งขัน**: ตั้ง Active, นำเข้า/ส่งออก JSON, เพิ่มเอง, ลาก ⠿ เรียงลำดับ, ลบ, ตั้งค่าหน้าแรก (Title, Sub title, BG, ไฮไลต์รายการ), คัดลอก URL
- แท็บ **แก้ไข**: เลือกรายการไหนก็ได้ (ไม่ต้อง Active) แก้ **ข้อมูล** (รูป, ชื่อ, เลขรอบ, เวลา, สนาม, พื้น, ระยะ, เกรด, Class, ไฮไลต์ม้า, ตารางม้า 2–30 ตัว พร้อมธง) และ **สไตล์** ของรายการนั้น (สี DRAW/NO. แบบ JRA / อเมริกา / ไม่มีสี / Custom, ป้ายเกรด, เปิด/ปิดแต่ละส่วน)
- ข้อมูลเก็บใน localStorage ของเบราว์เซอร์ (รูปเก็บใน IndexedDB) ครั้งแรกจะมีข้อมูลตัวอย่างให้ dock กับหน้าจอใน OBS ใช้ที่เก็บเดียวกันจึงซิงก์กันทันที แต่ OBS แยกจาก Chrome ปกติ ถ้าเตรียมข้อมูลใน Chrome ให้ส่งออก JSON แล้วนำเข้าใน OBS
- รูปแบบไฟล์ JSON: [docs/race-json.md](docs/race-json.md), ตัวอย่าง [docs/example-race.json](docs/example-race.json), JSON Schema [schema/race.schema.json](schema/race.schema.json)

## พัฒนา

```bash
npm ci
npm run dev          # http://localhost:5173/#/dock และ #/overlay
npm test             # Vitest (กฎซอง JRA, สี, schema, import/export)
npm run test:e2e     # Playwright เปิด dock + overlay พร้อมกัน
npm run schema       # สร้าง schema/race.schema.json ใหม่จาก src/lib/model.ts
```

ทุก PR รัน CI (typecheck, Vitest, Playwright) และ merge เข้า `main` แล้ว deploy ขึ้น GitHub Pages ให้เอง

ฟอนต์ Otamasing Display / Otamasing Sans (OFL) อยู่ใน `public/fonts` ธงจาก [flag-icons](https://github.com/lipis/flag-icons) (MIT)
