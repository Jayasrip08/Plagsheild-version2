function value(text, fallback = '—') {
  if (text === 0) return '0';
  return text || fallback;
}

function money(amount) {
  const n = Number(amount);
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : '—';
}

function when(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function paymentOf(order) {
  return order?.payment || null;
}

export function paymentStatusLabel(order) {
  if (order?.is_b2b) return 'College credit';
  return order?.payment?.status || 'Pending';
}

export function coAuthorLine(order) {
  const list = Array.isArray(order?.co_authors) ? order.co_authors : [];
  if (!list.length) return 'None';
  return list.map((item) => item.name).filter(Boolean).join(', ');
}

export default function SubmissionRecord({ order, variant = 'student' }) {
  if (!order) return null;
  const pay = paymentOf(order);
  const isAdmin = variant === 'admin';

  return (
    <div className="record-grid">
      <section>
        <h4>Manuscript</h4>
        <dl>
          <div><dt>Title</dt><dd>{value(order.paper_title)}</dd></div>
          <div><dt>Type</dt><dd>{value(order.paper_type)}</dd></div>
          <div><dt>Subject</dt><dd>{value(order.subject_area)}</dd></div>
          <div><dt>Purpose</dt><dd>{value(order.purpose)}</dd></div>
          {order.keywords ? <div><dt>Keywords</dt><dd>{order.keywords}</dd></div> : null}
          <div><dt>Package</dt><dd>{value(order.package_label)}</dd></div>
        </dl>
      </section>
      <section>
        <h4>Author</h4>
        <dl>
          <div><dt>Corresponding author</dt><dd>{value(order.author_name)}</dd></div>
          <div><dt>Email</dt><dd>{value(order.author_email)}</dd></div>
          <div><dt>Institution</dt><dd>{value(order.author_institution)}</dd></div>
          <div><dt>Country</dt><dd>{value(order.author_country)}</dd></div>
          <div><dt>Co-authors</dt><dd>{coAuthorLine(order)}</dd></div>
          {isAdmin && (
            <div>
              <dt>Account</dt>
              <dd>
                {order.user_details?.username || '—'}
                <small>{order.user_details?.email}</small>
              </dd>
            </div>
          )}
        </dl>
      </section>
      <section>
        <h4>Payment</h4>
        <dl>
          <div><dt>Payment status</dt><dd>{paymentStatusLabel(order)}</dd></div>
          <div><dt>Amount</dt><dd>{money(pay?.amount || order.price)}</dd></div>
          <div><dt>Razorpay payment ID</dt><dd className="mono-id">{value(pay?.razorpay_payment_id)}</dd></div>
          <div><dt>Razorpay order ID</dt><dd className="mono-id">{value(pay?.razorpay_order_id)}</dd></div>
          <div><dt>Transaction ID</dt><dd className="mono-id">{value(pay?.transaction_id)}</dd></div>
          <div><dt>Method</dt><dd>{value(pay?.method)}</dd></div>
          {pay?.vpa ? <div><dt>UPI VPA</dt><dd>{pay.vpa}</dd></div> : null}
          {pay?.bank ? <div><dt>Bank</dt><dd>{pay.bank}</dd></div> : null}
          {pay?.card_last4 ? <div><dt>Card</dt><dd>**** {pay.card_last4}</dd></div> : null}
          <div><dt>Paid at</dt><dd>{when(pay?.paid_at)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
