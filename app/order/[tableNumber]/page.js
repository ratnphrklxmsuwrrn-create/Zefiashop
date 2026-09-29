'use client';

import { use, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

const ADULT_PRICE = 289;
const CHILD_PRICE = 145;
const MAX_CART_ITEMS = 10;
const MAX_QTY_PER_ITEM = 5;

export default function OrderPage({ params }) {
  // Next.js เวอร์ชันนี้ params เป็น Promise เสมอ ต้อง unwrap ด้วย use()
  const { tableNumber } = use(params);
  const tableNum = Number(tableNumber);

  const [phase, setPhase] = useState('loading'); // loading | not_open | ordering | closed
  const [session, setSession] = useState(null); // { id, adult_count, child_count }

  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  const [cartQty, setCartQty] = useState({}); // { [itemId]: quantity }
  const [cartLimitMsg, setCartLimitMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  const [showBillModal, setShowBillModal] = useState(false);
  const [billClosing, setBillClosing] = useState(false);
  const [billError, setBillError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: sess, error: sessError } = await supabase
        .from('sessions')
        .select('id, adult_count, child_count')
        .eq('table_number', tableNum)
        .eq('status', 'open')
        .maybeSingle();

      if (cancelled) return;

      if (sessError || !sess) {
        setPhase('not_open');
        return;
      }

      setSession(sess);

      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from('menu_categories').select('*').order('sort_order'),
        supabase.from('menu_items').select('*'),
      ]);

      if (cancelled) return;

      setCategories(cats || []);
      setAllItems(its || []);
      if (cats && cats.length > 0) {
        setActiveCategoryId(cats[0].id);
      }
      setPhase('ordering');
    }

    if (!Number.isNaN(tableNum)) {
      init();
    } else {
      setPhase('not_open');
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNum]);

  const cartEntries = Object.entries(cartQty).filter(([, q]) => q > 0);
  const cartCount = cartEntries.length;
  const cartTotalQty = cartEntries.reduce((sum, [, q]) => sum + q, 0);

  function flashLimitMsg(msg) {
    setCartLimitMsg(msg);
    setTimeout(() => setCartLimitMsg(''), 2000);
  }

  function increment(item) {
    setOrderSuccessMsg('');
    setCartQty((prev) => {
      const current = prev[item.id] || 0;
      if (current === 0 && cartCount >= MAX_CART_ITEMS) {
        flashLimitMsg(`ตะกร้าเต็มแล้ว (สูงสุด ${MAX_CART_ITEMS} รายการต่อออเดอร์)`);
        return prev;
      }
      if (current >= MAX_QTY_PER_ITEM) {
        flashLimitMsg(`เพิ่มได้สูงสุด ${MAX_QTY_PER_ITEM} ต่อเมนู`);
        return prev;
      }
      return { ...prev, [item.id]: current + 1 };
    });
  }

  function decrement(item) {
    setCartQty((prev) => {
      const current = prev[item.id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: current - 1 };
    });
  }

  async function handleSubmitOrder() {
    if (cartCount === 0 || submitting) return;
    setSubmitting(true);
    setOrderError('');

    const itemsPayload = cartEntries.map(([itemId, quantity]) => {
      const item = allItems.find((i) => String(i.id) === String(itemId));
      return { name: item ? item.name : itemId, quantity };
    });

    const { error } = await supabase.from('orders').insert({
      session_id: session.id,
      table_number: tableNum,
      items: itemsPayload,
      status: 'received',
    });

    if (error) {
      setOrderError('ส่งออเดอร์ไม่สำเร็จ: ' + error.message);
    } else {
      setCartQty({});
      setOrderSuccessMsg('ส่งออเดอร์แล้ว');
      setTimeout(() => setOrderSuccessMsg(''), 3000);
    }
    setSubmitting(false);
  }

  async function handleConfirmBill() {
    if (!session) return;
    setBillClosing(true);
    setBillError('');

    const { data, error } = await supabase
      .from('sessions')
      .update({ status: 'closed' })
      .eq('id', session.id)
      .eq('status', 'open')
      .select();

    if (error) {
      setBillError('ปิดโต๊ะไม่สำเร็จ: ' + error.message);
      setBillClosing(false);
      return;
    }

    if (!data || data.length === 0) {
      setBillError('โต๊ะนี้ถูกปิดไปแล้ว');
      setBillClosing(false);
      return;
    }

    setShowBillModal(false);
    setBillClosing(false);
    setPhase('closed');
  }

  const billTotal = session ? session.adult_count * ADULT_PRICE + session.child_count * CHILD_PRICE : 0;
  const itemsInActiveCategory = allItems.filter((i) => i.category_id === activeCategoryId);

  return (
    <main className="page">
      {phase === 'loading' && (
        <div className="fullscreen-msg">
          <p className="fs-text">กำลังตรวจสอบโต๊ะ...</p>
        </div>
      )}

      {phase === 'not_open' && (
        <div className="fullscreen-msg">
          <p className="fs-emoji">🔔</p>
          <p className="fs-text">โต๊ะนี้ยังไม่เปิดใช้งาน</p>
          <p className="fs-sub">กรุณาแจ้งพนักงาน</p>
        </div>
      )}

      {phase === 'closed' && (
        <div className="fullscreen-msg">
          <p className="fs-emoji">💐</p>
          <p className="fs-text">ขอบคุณที่ใช้บริการ</p>
        </div>
      )}

      {phase === 'ordering' && (
        <>
          <header className="topbar">
            <span className="table-label">โต๊ะ {tableNumber}</span>
            <button type="button" className="bill-btn" onClick={() => setShowBillModal(true)}>
              เรียกเก็บเงิน
            </button>
          </header>

          <nav className="tabs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`tab ${cat.id === activeCategoryId ? 'tab-active' : ''}`}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          {orderSuccessMsg && <div className="toast">{orderSuccessMsg}</div>}
          {cartLimitMsg && <div className="toast toast-warn">{cartLimitMsg}</div>}

          <section className="menu-list">
            {itemsInActiveCategory.length === 0 && (
              <p className="empty-note">ไม่มีเมนูในหมวดนี้</p>
            )}
            {itemsInActiveCategory.map((item) => {
              const qty = cartQty[item.id] || 0;
              return (
                <div key={item.id} className="menu-row">
                  <span className="menu-name">{item.name}</span>
                  {qty === 0 ? (
                    <button type="button" className="add-btn" onClick={() => increment(item)}>
                      +
                    </button>
                  ) : (
                    <div className="stepper">
                      <button type="button" className="step-btn" onClick={() => decrement(item)}>
                        −
                      </button>
                      <span className="step-qty">{qty}</span>
                      <button
                        type="button"
                        className="step-btn"
                        onClick={() => increment(item)}
                        disabled={qty >= MAX_QTY_PER_ITEM}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <div className="cart-spacer" />

          <div className="cart-bar">
            {orderError && <p className="cart-error">{orderError}</p>}
            <div className="cart-bar-inner">
              <span className="cart-summary">
                🛒 ตะกร้า {cartCount} รายการ{cartTotalQty > 0 ? ` (${cartTotalQty} ชิ้น)` : ''}
              </span>
              <button
                type="button"
                className="submit-btn"
                onClick={handleSubmitOrder}
                disabled={cartCount === 0 || submitting}
              >
                {submitting ? 'กำลังส่ง...' : 'ส่งออเดอร์'}
              </button>
            </div>
          </div>

          {showBillModal && (
            <div className="overlay" role="dialog" aria-modal="true">
              <div className="dialog">
                <h2 className="dialog-title">ยืนยันเรียกเก็บเงิน</h2>
                <p className="dialog-line">
                  ผู้ใหญ่ {session.adult_count} ท่าน × {ADULT_PRICE} บาท
                </p>
                <p className="dialog-line">
                  เด็ก {session.child_count} ท่าน × {CHILD_PRICE} บาท
                </p>
                <p className="dialog-total">รวม {billTotal.toLocaleString('th-TH')} บาท</p>

                {billError && <p className="cart-error">{billError}</p>}

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setShowBillModal(false);
                      setBillError('');
                    }}
                    disabled={billClosing}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    className="btn-confirm"
                    onClick={handleConfirmBill}
                    disabled={billClosing}
                  >
                    {billClosing ? 'กำลังปิด...' : 'ยืนยัน'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        .fullscreen-msg {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px;
          text-align: center;
        }

        .fs-emoji {
          font-size: 3rem;
          margin: 0 0 4px;
        }

        .fs-text {
          font-size: 1.6rem;
          font-weight: 500;
          color: var(--ink);
          margin: 0;
        }

        .fs-sub {
          font-size: 1.1rem;
          color: var(--ink-muted);
          margin: 0;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 18px;
          background: var(--panel);
          border-bottom: 1px solid #f0e6ea;
        }

        .table-label {
          font-family: var(--font-display), cursive;
          font-size: 1.5rem;
          color: var(--accent);
        }

        .bill-btn {
          font-family: inherit;
          font-size: 1rem;
          font-weight: 500;
          padding: 10px 16px;
          border-radius: 999px;
          border: none;
          background: var(--ink);
          color: #fff;
        }

        .tabs {
          position: sticky;
          top: 60px;
          z-index: 19;
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 12px 16px;
          background: var(--bg);
          border-bottom: 1px solid #f0e6ea;
          -webkit-overflow-scrolling: touch;
        }

        .tab {
          flex: 0 0 auto;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 500;
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid var(--petal-purple);
          background: #fff;
          color: var(--ink);
          white-space: nowrap;
        }

        .tab-active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }

        .toast {
          margin: 10px 16px 0;
          padding: 12px 16px;
          border-radius: 10px;
          background: var(--petal-green);
          color: #23421c;
          font-weight: 500;
          text-align: center;
        }

        .toast-warn {
          background: #ffe1cc;
          color: #9a3412;
        }

        .menu-list {
          flex: 1;
          padding: 12px 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-note {
          color: var(--ink-muted);
          text-align: center;
          padding: 40px 0;
        }

        .menu-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--panel);
          border-radius: 14px;
          padding: 16px 18px;
          box-shadow: 0 2px 10px rgba(59, 37, 54, 0.06);
        }

        .menu-name {
          font-size: 1.15rem;
          color: var(--ink);
        }

        .add-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: var(--accent);
          color: #fff;
          font-size: 1.5rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .stepper {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .step-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid var(--petal-purple);
          background: #fff;
          color: var(--accent);
          font-size: 1.3rem;
          line-height: 1;
        }

        .step-btn:disabled {
          opacity: 0.4;
        }

        .step-qty {
          min-width: 22px;
          text-align: center;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--ink);
        }

        .cart-spacer {
          height: 96px;
        }

        .cart-bar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
          background: var(--panel);
          border-top: 1px solid #f0e6ea;
          padding: 10px 16px calc(12px + env(safe-area-inset-bottom, 0px));
          box-shadow: 0 -4px 16px rgba(59, 37, 54, 0.08);
        }

        .cart-bar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .cart-summary {
          font-size: 1.05rem;
          font-weight: 500;
          color: var(--ink);
        }

        .cart-error {
          color: #c62828;
          font-size: 0.95rem;
          margin: 0 0 6px;
        }

        .submit-btn {
          font-family: inherit;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 14px 26px;
          border-radius: 999px;
          border: none;
          background: var(--accent);
          color: #fff;
        }

        .submit-btn:disabled {
          opacity: 0.45;
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
          gap: 10px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
        }

        .dialog-title {
          margin: 0 0 6px;
          font-size: 1.3rem;
          font-weight: 500;
          color: var(--ink);
        }

        .dialog-line {
          margin: 0;
          font-size: 1.05rem;
          color: var(--ink-muted);
        }

        .dialog-total {
          margin: 8px 0 4px;
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--accent);
        }

        .dialog-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .btn-ghost,
        .btn-confirm {
          flex: 1;
          font-family: inherit;
          font-size: 1.05rem;
          font-weight: 500;
          padding: 14px 16px;
          border-radius: 12px;
          border: none;
        }

        .btn-ghost {
          background: transparent;
          border: 2px solid #ddd;
          color: var(--ink-muted);
        }

        .btn-confirm {
          background: var(--accent);
          color: #fff;
        }
      `}</style>
    </main>
  );
}
