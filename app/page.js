'use client';

export default function Home() {
  return (
    <main className="wrap">
      <div className="hero">
        <svg
          className="bouquet"
          viewBox="0 0 220 220"
          width="150"
          height="150"
          aria-hidden="true"
        >
          {/* กระดาษห่อช่อ */}
          <path
            d="M70 150 L110 210 L150 150 Z"
            fill="#fff"
            stroke="var(--petal-pink)"
            strokeWidth="3"
          />

          {/* ก้าน */}
          <line x1="80" y1="150" x2="70" y2="112" stroke="#b7a08f" strokeWidth="4" strokeLinecap="round" />
          <line x1="110" y1="150" x2="110" y2="100" stroke="#b7a08f" strokeWidth="4" strokeLinecap="round" />
          <line x1="140" y1="150" x2="150" y2="112" stroke="#b7a08f" strokeWidth="4" strokeLinecap="round" />

          {/* ดอกซีเฟีย 4 สี */}
          <g>
            <circle cx="70" cy="95" r="22" fill="var(--petal-pink)" />
            <path d="M70 95 m-22 0 a22 22 0 1 1 44 0" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" />
          </g>
          <g>
            <circle cx="110" cy="78" r="26" fill="var(--petal-blue)" />
            <path d="M110 78 m-26 0 a26 26 0 1 1 52 0" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" />
          </g>
          <g>
            <circle cx="150" cy="95" r="22" fill="var(--petal-purple)" />
            <path d="M150 95 m-22 0 a22 22 0 1 1 44 0" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" />
          </g>
          <g>
            <circle cx="110" cy="112" r="16" fill="var(--petal-green)" />
          </g>

          {/* เกลียวซีเฟียแบบวน */}
          <path d="M60 88 q10 -14 20 0 q10 14 20 0" stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.55" />
          <path d="M100 70 q10 -14 20 0 q10 14 20 0" stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.55" />
          <path d="M140 88 q10 -14 20 0 q10 14 20 0" stroke="#fff" strokeWidth="2.5" fill="none" opacity="0.55" />
        </svg>

        <h1 className="title">Zefir_of_love</h1>
        <p className="subtitle">ระบบสั่งอาหาร / ช่อขนมซีเฟียหน้าโต๊ะ</p>
      </div>

      <div className="links">
        <a className="tile tile-fill" href="/generate-qr">
          <span className="tile-label">สร้าง QR โต๊ะ</span>
          <span className="tile-hint">ตั้งค่าโต๊ะและพิมพ์ QR</span>
        </a>
        <a className="tile tile-outline" href="/kitchen">
          <span className="tile-label">หน้าครัว</span>
          <span className="tile-hint">ดูออเดอร์ที่เข้ามา</span>
        </a>
      </div>

      <p className="footnote">หน้านี้ใช้สำหรับทดสอบว่า deploy สำเร็จ</p>

      <style jsx>{`
        .wrap {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          padding: 48px 20px;
          text-align: center;
        }

        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .bouquet {
          filter: drop-shadow(0 8px 16px rgba(59, 37, 54, 0.12));
        }

        .title {
          font-family: var(--font-display), 'Pacifico', cursive;
          font-weight: 400;
          font-size: clamp(2.4rem, 7vw, 3.6rem);
          margin: 6px 0 0;
          color: var(--accent);
        }

        .subtitle {
          margin: 0;
          font-size: 1.05rem;
          color: var(--ink-muted);
          max-width: 34ch;
        }

        .links {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
        }

        .tile {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 20px 28px;
          border-radius: 999px 16px 16px 999px;
          min-width: 200px;
          transition: transform 0.15s ease;
        }

        .tile:hover,
        .tile:focus-visible {
          transform: translateY(-2px);
        }

        .tile-fill {
          background: var(--accent);
          color: #fff;
        }

        .tile-fill .tile-hint {
          color: rgba(255, 255, 255, 0.85);
        }

        .tile-outline {
          background: var(--panel);
          color: var(--accent-dim);
          border: 1px solid var(--petal-purple);
        }

        .tile-outline .tile-hint {
          color: var(--ink-muted);
        }

        .tile-label {
          font-size: 1.15rem;
          font-weight: 500;
        }

        .tile-hint {
          font-size: 0.9rem;
        }

        .footnote {
          font-size: 0.82rem;
          color: var(--ink-muted);
          opacity: 0.75;
        }
      `}</style>
    </main>
  );
}
