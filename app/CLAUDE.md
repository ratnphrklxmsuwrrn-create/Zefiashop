# CLAUDE.md — บันทึกอ้างอิงสำหรับโปรเจกต์ "Zefir_of_love"

โน้ตนี้มีไว้ให้ Claude (หรือผู้พัฒนา) อ่านก่อนเริ่มทำงานในขั้นตอนถัดไปของโปรเจกต์นี้เสมอ

## Stack

- Next.js (App Router), JavaScript (ไม่ใช่ TypeScript)
- React
- Supabase (`@supabase/supabase-js`) ผ่าน `lib/supabaseClient.js`
- Deploy บน Vercel

## ⚠️ ข้อควรระวังสำคัญ: Dynamic Route params เป็น Promise

โปรเจกต์นี้ใช้ Next.js เวอร์ชันล่าสุด ซึ่ง `params` (และ `searchParams`) ของ Dynamic Route
**ไม่ใช่ object ธรรมดาอีกต่อไป แต่เป็น Promise** ต้อง unwrap ก่อนใช้งานเสมอ

**ในไฟล์ที่เป็น Client Component** ให้ใช้ `use()` จาก React:

```jsx
'use client';
import { use } from 'react';

export default function TablePage({ params }) {
  const { sessionId } = use(params);
  // ...
}
```

**ในไฟล์ที่เป็น Server Component (async function)** ให้ใช้ `await` แทน:

```jsx
export default async function TablePage({ params }) {
  const { sessionId } = await params;
  // ...
}
```

อย่าเขียน `params.sessionId` ตรง ๆ เด็ดขาด เพราะจะพังหรือ warning บนเวอร์ชันนี้
กติกานี้ใช้กับทุกหน้าที่เป็น Dynamic Route (เช่น `/order/[sessionId]`, `/table/[tableNumber]`)
ที่จะสร้างในขั้นตอนถัดไป

## โครงสร้างฐานข้อมูล Supabase (มีอยู่แล้ว — ห้ามสร้างใหม่)

อ้างอิงตารางเหล่านี้ทุกครั้งที่เขียนโค้ด query/insert/update ในโปรเจกต์นี้:

### `sessions` — รอบการนั่งโต๊ะ
| column       | type      | หมายเหตุ                     |
|--------------|-----------|-------------------------------|
| id           | uuid/int  | primary key                   |
| table_number | -         | หมายเลขโต๊ะ                    |
| adult_count  | int       | จำนวนผู้ใหญ่                    |
| child_count  | int       | จำนวนเด็ก                      |
| status       | text      | สถานะของ session               |
| created_at   | timestamp | เวลาที่สร้าง                    |

### `menu_categories` — หมวดหมู่เมนู
| column     | type | หมายเหตุ           |
|------------|------|--------------------|
| id         | -    | primary key        |
| name       | text | ชื่อหมวดหมู่         |
| sort_order | int  | ลำดับการแสดงผล       |

### `menu_items` — รายการเมนู
| column      | type | หมายเหตุ                              |
|-------------|------|----------------------------------------|
| id          | -    | primary key                            |
| category_id | -    | FK ไปยัง `menu_categories.id`           |
| name        | text | ชื่อเมนู                                |

### `orders` — ออเดอร์ที่ลูกค้าสั่ง
| column       | type      | หมายเหตุ                          |
|--------------|-----------|-------------------------------------|
| id           | -         | primary key                         |
| session_id   | -         | FK ไปยัง `sessions.id`               |
| table_number | -         | หมายเลขโต๊ะ (denormalized)           |
| items        | jsonb     | รายการอาหารที่สั่ง                    |
| status       | text      | สถานะออเดอร์                         |
| created_at   | timestamp | เวลาที่สั่ง                           |

## Environment Variables

ต้องตั้งค่าทั้งใน `.env.local` (local dev) และใน Vercel Project Settings > Environment Variables (production):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## หน้าเว็บที่มีอยู่ตอนนี้ (สำหรับทดสอบ deploy)

- `/` — หน้าแรก แสดงชื่อร้านและลิงก์ทดสอบ
- `/generate-qr` — placeholder รอสร้างฟอร์มสร้าง QR โต๊ะจริง
- `/kitchen` — placeholder รอสร้างหน้าแสดงออเดอร์ของครัวจริง
