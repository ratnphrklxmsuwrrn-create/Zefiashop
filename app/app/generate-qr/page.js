'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const QR_ENDPOINT = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=';

function minutesSince(isoString) {
  const created = new Date(isoString).getTime();
  const diffMs = Date.now() - created;
  return Math.max(0, Math.floor(diffMs / 60000));
}

export default function GenerateQrPage() {
  const [tableNumber, setTableNumber] = useState('');
  const [adultCount, setAdultCount] = useState('');
  const [childCount, setChildCount] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [existingSession, setExistingSession] = useState(null); // { id, adult_count, child_count, created_at }
  const [showConfirm, setShowConfirm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const [newSessionResult, setNewSessionResult] = useState(null); // { tableNumber, adultCount, childCount, url }
  const [copied, setCopied] = useState(false);

  function resetToBlankForm() {
    setTableNumber('');
    setAdultCount('');
    setChildCount('');
    setExistingSession(null);
    setNewSessionResult(null);
    setFormError('');
    setConfirmError('');
    setCopied(false);
  }

  async function handleOpenTable(e) {
    e.preventDefault();
    setFormError('');

    const tableNum = Number(tableNumber);
    const adults = Number(adultCount);
    const children = Number(childCount);

    if (!tableNumber || Number.isNaN(tableNum) || tableNum <= 0) {
      setFormError('กรุณากรอกเลขโต๊ะเป็นตัวเลขที่ถูกต้อง');
      return;
    }
    if (adultCount === '' || Number.isNaN(adults) || adults < 0) {
      setFormError('กรุณากรอกจำนวนผู้ใหญ่เป็นตัวเลขที่ถูกต้อง');
      return;
    }
    if (childCount === '' || Number.isNaN(children) || children < 0) {
      setFormError('กรุณากรอกจำนวนเด็กเป็นตัวเลขที่ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      // เช็คว่าโต๊ะนี้มี session ที่ยังเปิดอยู่หรือไม่
      const { data: openSession, error: selectError } = await supabase
        .from('sessions')
        .select('id, adult_count, child_count, created_at')
        .eq('table_number', tableNum)
        .eq('status', 'open')
        .maybeSingle();

      if (selectError) {
        setFormError('เกิดข้อผิดพลาดในการตรวจสอบโต๊ะ: ' + selectError.message);
        return;
      }

      if (openSession) {
        // มี session เปิดค้างอยู่ -> แสดงกล่องเตือนแทนการสร้างแถวใหม่
        setExistingSession(openSession);
        return;
      }

      // ไม่มี session เปิดอยู่ -> สร้างใหม่
      const { error: insertError } = await supabase
        .from('sessions')
        .insert({
          table_number: tableNum,
          adult_count: adults,
          child_count: children,
          status: 'open',
        });

      if (insertError) {
        setFormError('เปิดโต๊ะไม่สำเร็จ: ' + insertError.message);
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/order/${tableNum}`;

      setNewSessionResult({
        tableNumber: tableNum,
        adultCount: adults,
        childCount: children,
        url,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCloseOld() {
    if (!existingSession) return;
    setClosing(true);
    setConfirmError('');
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ status: 'closed' })
        .eq('id', existingSession.id)
        .eq('status', 'open') // กันการกดซ้ำ/ปิดซ้ำ
        .select();

      if (error) {
        setConfirmError('ปิดโต๊ะเดิมไม่สำเร็จ: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        setConfirmError('โต๊ะนี้ถูกปิดไปแล้ว (อาจมีคนกดปิดไปก่อนหน้านี้) กรุณาลองเปิดโต๊ะใหม่อีกครั้ง');
        return;
      }

      // ปิดสำเร็จ: เอากล่องเตือน/กล่องยืนยันออก กลับไปที่ฟอร์มเดิม (ค่าที่กรอกไว้ยังอยู่)
      setShowConfirm(false);
      setExistingSession(null);
    } finally {
      setClosing(false);
    }
  }

  async function handleCopyLink() {
    if (!newSessionResult) return;
    try {
      await navigator.clipboard.writeText(newSessionResult.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setConfirmError('คัดลอกลิงก์ไม่สำเร็จ กรุณาคัดลอกด้วยตนเอง');
    }
  }

  const showSuccess = !!newSessionResult;

  return (
    <main className="wrap">
      {showSuccess ? (
        <div className="card success-card">
          <h1 className="title">เปิดโต๊ะสำเร็จ</h1>
          <img
            className="qr-image"
            src={`${QR_ENDPOINT}${encodeURIComponent(newSessionResult.url)}`}
            alt={`QR code สำหรับโต๊ะ ${newSessionResult.tableNumber}`}
            width={300}
            height={300}
          />
          <p className="summary">
            โต๊ะ {newSessionResult.tableNumber} · ผู้ใหญ่ {newSessionResult.adultCount} · เด็ก{' '}
            {newSessionResult.childCount}
          </p>
          <div className="link-row">
            <span className="link-text">{newSessionResult.url}</span>
            <button type="button" className="btn btn-small" onClick={handleCopyLink}>
              {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกลิงก์'}
            </button>
          </div>
          <button type="button" className="btn btn-fill btn-wide" onClick={resetToBlankForm}>
            เปิดโต๊ะใหม่
          </button>
        </div>
      ) : (
        <>
          <div className="card">
            <h1 className="title">เปิดโต๊ะ</h1>

            <form onSubmit={handleOpenTable} className="form">
              <label className="field">
                <span className="field-label">เลขโต๊ะ</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  className="input"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="เช่น 7"
                  disabled={loading || !!existingSession}
                />
              </label>

              <label className="field">
                <span className="field-label">จำนวนผู้ใหญ่</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="input"
                  value={adultCount}
                  onChange={(e) => setAdultCount(e.target.value)}
                  placeholder="เช่น 2"
                  disabled={loading || !!existingSession}
                />
              </label>

              <label className="field">
                <span className="field-label">จำนวนเด็ก</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  className="input"
                  value={childCount}
                  onChange={(e) => setChildCount(e.target.value)}
                  placeholder="เช่น 1"
                  disabled={loading || !!existingSession}
                />
              </label>

              {formError && <p className="error-text">{formError}</p>}

              <button
                type="submit"
                className="btn btn-fill btn-wide"
                disabled={loading || !!existingSession}
              >
                {loading ? 'กำลังตรวจสอบ...' : 'เปิดโต๊ะ'}
              </button>
            </form>

            {existingSession && (
              <div className="warn-box">
                <p className="warn-title">
                  โต๊ะนี้มีลูกค้าอยู่ระหว่างทานอาหาร กรุณาปิดออเดอร์เดิมก่อน
                </p>
                <button
                  type="button"
                  className="btn btn-warn btn-wide"
                  onClick={() => setShowConfirm(true)}
                >
                  ปิดออเดอร์เดิม
                </button>
              </div>
            )}
          </div>

          {showConfirm && existingSession && (
            <div className="overlay" role="dialog" aria-modal="true">
              <div className="dialog">
                <h2 className="dialog-title">ยืนยันปิดโต๊ะเดิม</h2>
                <ul className="dialog-info">
                  <li>โต๊ะ {tableNumber}</li>
                  <li>
                    ผู้ใหญ่ {existingSession.adult_count} · เด็ก {existingSession.child_count}
                  </li>
                  <li>เปิดมาแล้ว {minutesSince(existingSession.created_at)} นาที</li>
                </ul>

                {confirmError && <p className="error-text">{confirmError}</p>}

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowConfirm(false);
                      setConfirmError('');
                    }}
                    disabled={closing}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="btn btn-warn"
                    onClick={handleConfirmCloseOld}
                    disabled={closing}
                  >
                    {closing ? 'กำลังปิด...' : 'ยืนยันปิดโต๊ะเดิม'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
        }

        .card {
          width: 100%;
          max-width: 420px;
          background: var(--panel);
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 10px 30px rgba(59, 37, 54, 0.1);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .success-card {
          align-items: center;
          text-align: center;
        }

        .title {
          font-family: var(--font-display), cursive;
          font-weight: 400;
          font-size: 2rem;
          margin: 0;
          color: var(--accent);
          text-align: center;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field-label {
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--ink);
        }

        .input {
          font-size: 1.4rem;
          padding: 14px 16px;
          border-radius: 12px;
          border: 2px solid var(--petal-purple);
          background: #fff;
          color: var(--ink);
          font-family: inherit;
        }

        .input:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .input:disabled {
          opacity: 0.6;
        }

        .btn {
          font-family: inherit;
          font-size: 1.15rem;
          font-weight: 500;
          padding: 14px 20px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-wide {
          width: 100%;
        }

        .btn-fill {
          background: var(--accent);
          color: #fff;
        }

        .btn-small {
          font-size: 0.95rem;
          padding: 8px 14px;
          background: var(--petal-blue);
          color: #fff;
          white-space: nowrap;
        }

        .btn-ghost {
          background: transparent;
          color: var(--ink-muted);
          border: 2px solid #ddd;
        }

        .btn-warn {
          background: #e2452c;
          color: #fff;
        }

        .error-text {
          color: #c62828;
          font-size: 1rem;
          margin: 0;
        }

        .warn-box {
          background: #fff1ec;
          border: 2px solid #f0a58a;
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .warn-title {
          margin: 0;
          color: #9a3412;
          font-size: 1.1rem;
          font-weight: 500;
          line-height: 1.5;
        }

        .qr-image {
          border-radius: 16px;
          border: 6px solid #fff;
          box-shadow: 0 6px 20px rgba(59, 37, 54, 0.12);
        }

        .summary {
          font-size: 1.3rem;
          font-weight: 500;
          color: var(--ink);
          margin: 0;
        }

        .link-row {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: var(--bg);
          border-radius: 10px;
          padding: 10px 14px;
        }

        .link-text {
          flex: 1;
          text-align: left;
          font-size: 0.9rem;
          color: var(--ink-muted);
          word-break: break-all;
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(59, 37, 54, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 50;
        }

        .dialog {
          background: #fff;
          border-radius: 18px;
          padding: 28px 26px;
          width: 100%;
          max-width: 380px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
        }

        .dialog-title {
          margin: 0;
          font-size: 1.3rem;
          font-weight: 500;
          color: #9a3412;
        }

        .dialog-info {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 1.1rem;
          color: var(--ink);
        }

        .dialog-actions {
          display: flex;
          gap: 12px;
        }

        .dialog-actions .btn {
          flex: 1;
        }
      `}</style>
    </main>
  );
}
