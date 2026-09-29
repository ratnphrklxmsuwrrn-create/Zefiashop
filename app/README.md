# Zefir_of_love — ระบบสั่งอาหารบุฟเฟต์

โปรเจกต์ Next.js (App Router, JavaScript) สำหรับระบบสั่งอาหารหน้าโต๊ะของร้าน "Zefir_of_love"
เชื่อมต่อกับ Supabase และ deploy บน Vercel

> **สำคัญ:** ก่อนแก้ไขหรือพัฒนาต่อในโปรเจกต์นี้ อ่าน [`CLAUDE.md`](./CLAUDE.md) ก่อนเสมอ
> โดยเฉพาะเรื่อง `params` ของ Dynamic Route ที่เป็น Promise และโครงสร้างฐานข้อมูลที่มีอยู่แล้ว

## เริ่มต้นใช้งาน (Local Development)

1. ติดตั้ง dependencies:

   ```bash
   npm install
   ```

2. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ค่า Supabase ของโปรเจกต์:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. รันเซิร์ฟเวอร์สำหรับพัฒนา:

   ```bash
   npm run dev
   ```

   เปิด [http://localhost:3000](http://localhost:3000)

## Deploy บน Vercel

1. Push โปรเจกต์นี้ขึ้น GitHub
2. Import repository เข้า Vercel
3. ตั้งค่า Environment Variables บน Vercel (Project Settings > Environment Variables) ให้ตรงกับ `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy แล้วตรวจสอบว่าหน้าแรก (`/`), `/generate-qr`, และ `/kitchen` เปิดได้ปกติ

## โครงสร้างโปรเจกต์

```
zefir-of-love/
├── app/
│   ├── layout.js          # Root layout + ฟอนต์
│   ├── globals.css        # Design tokens และสไตล์พื้นฐาน
│   ├── page.js             # หน้าแรก
│   ├── generate-qr/
│   │   └── page.js         # placeholder หน้าสร้าง QR โต๊ะ
│   └── kitchen/
│       └── page.js         # placeholder หน้าครัว
├── lib/
│   └── supabaseClient.js   # Supabase client
├── next.config.js
├── package.json
├── .gitignore
├── .env.local.example
├── CLAUDE.md               # โน้ตอ้างอิงสำหรับ Claude/นักพัฒนา
└── README.md
```

## ฐานข้อมูล

โปรเจกต์นี้เชื่อมต่อกับตารางที่มีอยู่แล้วใน Supabase: `sessions`, `menu_categories`,
`menu_items`, `orders` — ดูรายละเอียดคอลัมน์ทั้งหมดใน [`CLAUDE.md`](./CLAUDE.md)
