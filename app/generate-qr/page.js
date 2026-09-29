export default function GenerateQrPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '48px 20px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontFamily: 'var(--font-display), cursive', fontWeight: 400 }}>
        สร้าง QR โต๊ะ
      </h1>
      <p style={{ color: 'var(--ink-muted)' }}>
        หน้านี้เป็นตัวยึดตำแหน่ง (placeholder) — จะสร้างฟอร์มสร้าง QR จริงในขั้นตอนถัดไป
      </p>
      <a href="/" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
        กลับหน้าแรก
      </a>
    </main>
  );
}
