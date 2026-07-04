import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, Users, UserPlus, Wallet, Search, Pencil, Trash2, Printer, X,
  ChevronRight, Phone, MapPin, Building2, Receipt, TrendingUp, Settings,
  Check, AlertTriangle, ArrowLeft, Plus, FileText, Banknote, CreditCard,
  ClipboardList, Landmark, ShieldCheck
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Helpers                                                                 */
/* ---------------------------------------------------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const fmt = (n) => {
  const num = Math.round(Number(n) || 0);
  return "Rs. " + num.toLocaleString("en-PK");
};

const fmtNum = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString("en-PK");
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

function computeFinancials(customer) {
  const actual = Number(customer.actualAmount) || 0;
  const area = Number(customer.area) || 0;
  const dev = actual * 0.15;
  const total = actual + dev;
  const rate = area > 0 ? actual / area : 0;
  return { actual, area, dev, total, rate };
}

/* ---------------------------------------------------------------------- */
/* Storage                                                                 */
/* ---------------------------------------------------------------------- */

async function storageGet(key, fallback) {
  try {
    const res = await window.storage.get(key);
    if (res && typeof res.value === "string") return JSON.parse(res.value);
    return fallback;
  } catch (e) {
    return fallback;
  }
}

async function storageSet(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value));
  } catch (e) {
    /* silent - keep working in-memory */
  }
}

/* ---------------------------------------------------------------------- */
/* Small building blocks                                                  */
/* ---------------------------------------------------------------------- */

function Seal({ size = 56, initials = "HS" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="seal-svg">
      <circle cx="50" cy="50" r="46" className="seal-ring-outer" />
      <circle cx="50" cy="50" r="38" className="seal-ring-inner" />
      <g transform="translate(50,44)">
        <path d="M -16 4 L 0 -14 L 16 4 L 16 20 L -16 20 Z" className="seal-house" />
        <rect x="-4" y="8" width="8" height="12" className="seal-door" />
      </g>
      <text x="50" y="80" textAnchor="middle" className="seal-text">{initials}</text>
    </svg>
  );
}

function Field({ label, children, required, hint }) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {required && <span className="req">*</span>}
      </span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function StatCard({ icon, label, value, tone }) {
  return (
    <div className={`stat-card tone-${tone || "default"}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ remaining }) {
  if (remaining <= 0) return <span className="badge badge-clear">Cleared</span>;
  return <span className="badge badge-active">Active</span>;
}

function ConfirmDialog({ data, onClose }) {
  if (!data) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon"><AlertTriangle size={22} /></div>
        <h3>{data.title || "Are you sure?"}</h3>
        <p>{data.message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              data.onConfirm();
              onClose();
            }}
          >
            {data.confirmLabel || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast-wrap">
      <div className={`toast toast-${toast.type || "success"}`}>
        <Check size={16} />
        <span>{toast.text}</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Customer Form (Add / Edit)                                             */
/* ---------------------------------------------------------------------- */

function CustomerForm({ initial, onCancel, onSave, isEdit }) {
  const [f, setF] = useState(
    initial || {
      name: "", fatherName: "", caste: "", address: "", contact: "", cnic: "",
      plotNumber: "", area: "", actualAmount: "",
      tokenAmount: "", tokenMethod: "Cash", tokenDate: todayISO(), receiverName: "",
    }
  );
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { dev, total, rate } = computeFinancials(f);

  const submit = (e) => {
    e.preventDefault();
    if (!f.name || !f.plotNumber || !f.area || !f.actualAmount) return;
    onSave(f);
  };

  return (
    <form className="panel" onSubmit={submit}>
      <div className="panel-head">
        <h2>{isEdit ? "Edit Customer Record" : "New Customer Registration"}</h2>
        <p className="muted">Every field feeds directly into the plot ledger and future pay slips.</p>
      </div>

      <div className="section-label">Personal Details</div>
      <div className="grid-2">
        <Field label="Customer Name" required>
          <input value={f.name} onChange={set("name")} placeholder="e.g. Muhammad Aslam" required />
        </Field>
        <Field label="Father Name">
          <input value={f.fatherName} onChange={set("fatherName")} placeholder="e.g. Ghulam Rasool" />
        </Field>
        <Field label="Caste">
          <input value={f.caste} onChange={set("caste")} placeholder="e.g. Soomro" />
        </Field>
        <Field label="CNIC Number">
          <input value={f.cnic} onChange={set("cnic")} placeholder="42101-1234567-1" />
        </Field>
        <Field label="Contact Number" required>
          <input value={f.contact} onChange={set("contact")} placeholder="03XX-XXXXXXX" required />
        </Field>
        <Field label="Address">
          <input value={f.address} onChange={set("address")} placeholder="House / street / area" />
        </Field>
      </div>

      <div className="section-label">Plot &amp; Pricing</div>
      <div className="grid-2">
        <Field label="Plot Number" required>
          <input value={f.plotNumber} onChange={set("plotNumber")} placeholder="e.g. B-114" required />
        </Field>
        <Field label="Plot Area (sq. ft)" required>
          <input type="number" min="0" value={f.area} onChange={set("area")} placeholder="e.g. 1200" required />
        </Field>
        <Field label="Plot Actual Amount (Rs.)" required>
          <input type="number" min="0" value={f.actualAmount} onChange={set("actualAmount")} placeholder="e.g. 1800000" required />
        </Field>
        <Field label="Rate per Sq. Ft" hint="Calculated automatically">
          <input value={rate ? fmtNum(Math.round(rate)) : ""} disabled className="disabled" />
        </Field>
      </div>

      <div className="calc-strip">
        <div><span>Actual Amount</span><b>{fmt(f.actualAmount)}</b></div>
        <div className="plus">+</div>
        <div><span>Development Charges (15%)</span><b>{fmt(dev)}</b></div>
        <div className="eq">=</div>
        <div className="total"><span>Total Payable</span><b>{fmt(total)}</b></div>
      </div>

      {!isEdit && (
        <>
          <div className="section-label">Opening Payment <span className="optional">(optional — token / advance received today)</span></div>
          <div className="grid-2">
            <Field label="Amount Received Now">
              <input type="number" min="0" value={f.tokenAmount} onChange={set("tokenAmount")} placeholder="0" />
            </Field>
            <Field label="Payment Method">
              <select value={f.tokenMethod} onChange={set("tokenMethod")}>
                <option>Cash</option>
                <option>Cheque</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={f.tokenDate} onChange={set("tokenDate")} />
            </Field>
            <Field label="Received By">
              <input value={f.receiverName} onChange={set("receiverName")} placeholder="Receiver's name" />
            </Field>
          </div>
        </>
      )}

      <div className="panel-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary"><Check size={16} /> {isEdit ? "Save Changes" : "Register Customer"}</button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* Customer List                                                          */
/* ---------------------------------------------------------------------- */

function CustomerList({ customers, onOpen, onAdd }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.plotNumber || "").toLowerCase().includes(s) ||
        (c.contact || "").includes(s) ||
        (c.cnic || "").includes(s)
    );
  }, [q, customers]);

  return (
    <div className="panel">
      <div className="panel-head row-between">
        <div>
          <h2>Customer Records</h2>
          <p className="muted">{customers.length} registered plot holder{customers.length === 1 ? "" : "s"}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}><Plus size={16} /> New Registration</button>
      </div>

      <div className="search-bar">
        <Search size={16} />
        <input placeholder="Search by name, plot number, CNIC or contact…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={34} />
          <p>{customers.length === 0 ? "No customers registered yet. Start with a New Registration." : "No matching records found."}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plot</th>
                <th>Total Amount</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => onOpen(c.id)} className="clickable-row">
                  <td>
                    <div className="cell-name">{c.name}</div>
                    <div className="cell-sub">{c.contact}</div>
                  </td>
                  <td>
                    <div className="cell-name mono">{c.plotNumber}</div>
                    <div className="cell-sub">{fmtNum(c.area)} sq.ft</div>
                  </td>
                  <td className="mono">{fmt(c.total)}</td>
                  <td className="mono positive">{fmt(c.paid)}</td>
                  <td className="mono negative">{fmt(c.remaining)}</td>
                  <td><StatusBadge remaining={c.remaining} /></td>
                  <td className="cell-arrow"><ChevronRight size={18} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Customer Detail                                                        */
/* ---------------------------------------------------------------------- */

function CustomerDetail({ customer, payments, onBack, onEdit, onDelete, onAddPayment, onShowSlip }) {
  const { actual, dev, total, rate, area } = computeFinancials(customer);
  const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const remaining = total - paid;
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <div className="panel">
      <button className="link-back" onClick={onBack}><ArrowLeft size={16} /> Back to records</button>

      <div className="detail-head">
        <div className="detail-title">
          <div className="avatar-circle">{customer.name.trim().charAt(0).toUpperCase() || "?"}</div>
          <div>
            <h2>{customer.name}</h2>
            <p className="muted">S/O {customer.fatherName || "—"} · {customer.caste || "—"}</p>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-ghost" onClick={onEdit}><Pencil size={15} /> Edit</button>
          <button className="btn btn-danger-outline" onClick={onDelete}><Trash2 size={15} /> Delete</button>
          <button className="btn btn-primary" onClick={onAddPayment}><Wallet size={15} /> Collect Payment</button>
        </div>
      </div>

      <div className="grid-2 info-grid">
        <div className="info-line"><MapPin size={14} /> {customer.address || "No address on file"}</div>
        <div className="info-line"><Phone size={14} /> {customer.contact}</div>
        <div className="info-line"><CreditCard size={14} /> {customer.cnic || "CNIC not recorded"}</div>
        <div className="info-line"><Building2 size={14} /> Plot {customer.plotNumber} · {fmtNum(area)} sq.ft</div>
      </div>

      <div className="calc-strip">
        <div><span>Actual Amount</span><b>{fmt(actual)}</b></div>
        <div className="plus">+</div>
        <div><span>Development (15%)</span><b>{fmt(dev)}</b></div>
        <div className="eq">=</div>
        <div className="total"><span>Total Payable</span><b>{fmt(total)}</b></div>
      </div>

      <div className="progress-block">
        <div className="progress-row">
          <span className="mono positive">{fmt(paid)} paid</span>
          <span className="mono negative">{fmt(remaining)} remaining</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: progress + "%" }} /></div>
        <div className="progress-caption">{progress}% of total plot value collected · rate {fmtNum(Math.round(rate))}/sq.ft</div>
      </div>

      <div className="section-label">Payment History</div>
      {payments.length === 0 ? (
        <div className="empty-state small">
          <Receipt size={26} />
          <p>No payments recorded yet.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Slip #</th><th>Date</th><th>Type</th><th>Method</th><th>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {[...payments].sort((a, b) => (a.date < b.date ? 1 : -1)).map((p) => (
                <tr key={p.id}>
                  <td className="mono">#{p.slipNumber}</td>
                  <td>{fmtDate(p.date)}</td>
                  <td><span className={`tag tag-${p.type.toLowerCase()}`}>{p.type}</span></td>
                  <td>{p.method}</td>
                  <td className="mono positive">{fmt(p.amount)}</td>
                  <td>
                    <button className="btn-icon" title="View slip" onClick={() => onShowSlip(p)}>
                      <Printer size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Collect Payment                                                        */
/* ---------------------------------------------------------------------- */

function CollectPayment({ customers, onSubmit }) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Installment");
  const [method, setMethod] = useState("Cash");
  const [date, setDate] = useState(todayISO());
  const [receiver, setReceiver] = useState("");

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          (c.plotNumber || "").toLowerCase().includes(s) ||
          (c.contact || "").includes(s)
      )
      .slice(0, 8);
  }, [q, customers]);

  const submit = (e) => {
    e.preventDefault();
    if (!selected || !amount || Number(amount) <= 0) return;
    onSubmit(selected.id, { amount: Number(amount), type, method, date, receiverName: receiver });
    setAmount("");
    setReceiver("");
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Collect Installment</h2>
        <p className="muted">Search a customer, record the amount received, and print their pay slip.</p>
      </div>

      {!selected ? (
        <>
          <div className="search-bar">
            <Search size={16} />
            <input autoFocus placeholder="Search customer by name, plot number or contact…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {q && (
            <div className="search-results">
              {results.length === 0 ? (
                <div className="empty-state small"><p>No customer matches "{q}".</p></div>
              ) : (
                results.map((c) => (
                  <div key={c.id} className="result-row" onClick={() => setSelected(c)}>
                    <div className="avatar-circle small">{c.name.charAt(0).toUpperCase()}</div>
                    <div className="result-info">
                      <div className="cell-name">{c.name}</div>
                      <div className="cell-sub">Plot {c.plotNumber} · {c.contact}</div>
                    </div>
                    <div className="mono negative">{fmt(c.remaining)} due</div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <form onSubmit={submit}>
          <div className="selected-customer">
            <div className="avatar-circle">{selected.name.charAt(0).toUpperCase()}</div>
            <div className="result-info">
              <div className="cell-name">{selected.name}</div>
              <div className="cell-sub">Plot {selected.plotNumber} · Total {fmt(selected.total)}</div>
            </div>
            <button type="button" className="btn btn-ghost small" onClick={() => setSelected(null)}>Change</button>
          </div>

          <div className="calc-strip compact">
            <div><span>Total Payable</span><b>{fmt(selected.total)}</b></div>
            <div><span>Paid So Far</span><b className="positive">{fmt(selected.paid)}</b></div>
            <div><span>Remaining</span><b className="negative">{fmt(selected.remaining)}</b></div>
          </div>

          <div className="grid-2">
            <Field label="Amount Received" required>
              <input type="number" min="1" autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required />
            </Field>
            <Field label="Payment Type">
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option>Installment</option>
                <option>Advance</option>
                <option>Token</option>
              </select>
            </Field>
            <Field label="Payment Method">
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>Cash</option>
                <option>Cheque</option>
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Received By">
              <input value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="Receiver's name" />
            </Field>
          </div>

          <div className="panel-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>Back to search</button>
            <button type="submit" className="btn btn-primary"><Receipt size={16} /> Record &amp; Generate Slip</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Pay Slip                                                                */
/* ---------------------------------------------------------------------- */

function PaySlip({ payment, customer, societyName, onClose }) {
  if (!payment || !customer) return null;
  const { actual, dev, total, rate, area } = computeFinancials(customer);
  const paidBefore = payment.paidBeforeThis ?? 0;
  const remainingAfter = total - paidBefore - Number(payment.amount || 0);

  return (
    <div className="overlay">
      <div className="slip-shell">
        <div className="no-print slip-toolbar">
          <button className="btn btn-ghost" onClick={onClose}><X size={16} /> Close</button>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={16} /> Print Slip</button>
        </div>

        <div className="print-area slip-paper">
          <div className="slip-watermark">OFFICE COPY</div>
          <div className="perforation" />

          <div className="slip-header">
            <Seal size={54} initials="HS" />
            <div className="slip-title">
              <h1>{societyName}</h1>
              <p>Official Payment Receipt</p>
            </div>
            <div className="slip-meta">
              <div><span>Slip No.</span><b>#{payment.slipNumber}</b></div>
              <div><span>Date</span><b>{fmtDate(payment.date)}</b></div>
            </div>
          </div>

          <div className="slip-divider" />

          <div className="slip-grid">
            <div>
              <div className="slip-label">Customer Name</div>
              <div className="slip-value">{customer.name}</div>
            </div>
            <div>
              <div className="slip-label">Father Name</div>
              <div className="slip-value">{customer.fatherName || "—"}</div>
            </div>
            <div>
              <div className="slip-label">Caste</div>
              <div className="slip-value">{customer.caste || "—"}</div>
            </div>
            <div>
              <div className="slip-label">CNIC Number</div>
              <div className="slip-value mono">{customer.cnic || "—"}</div>
            </div>
            <div className="span-2">
              <div className="slip-label">Address</div>
              <div className="slip-value">{customer.address || "—"}</div>
            </div>
            <div>
              <div className="slip-label">Mobile Number</div>
              <div className="slip-value mono">{customer.contact}</div>
            </div>
            <div>
              <div className="slip-label">Payment Method</div>
              <div className="slip-value">{payment.method}</div>
            </div>
          </div>

          <div className="slip-divider" />

          <div className="slip-grid">
            <div>
              <div className="slip-label">Plot Number</div>
              <div className="slip-value mono">{customer.plotNumber}</div>
            </div>
            <div>
              <div className="slip-label">Total Area</div>
              <div className="slip-value mono">{fmtNum(area)} sq.ft</div>
            </div>
            <div>
              <div className="slip-label">Rate per Sq.ft</div>
              <div className="slip-value mono">{fmtNum(Math.round(rate))}</div>
            </div>
            <div>
              <div className="slip-label">Plot Actual Amount</div>
              <div className="slip-value mono">{fmt(actual)}</div>
            </div>
            <div>
              <div className="slip-label">Development Charges (15%)</div>
              <div className="slip-value mono">{fmt(dev)}</div>
            </div>
            <div>
              <div className="slip-label">Total Amount (incl. 15%)</div>
              <div className="slip-value mono">{fmt(total)}</div>
            </div>
          </div>

          <div className="slip-divider" />

          <div className="slip-payment-box">
            <div>
              <div className="slip-label">Payment Type</div>
              <div className="slip-value tag-inline">{payment.type}</div>
            </div>
            <div className="slip-amount-box">
              <div className="slip-label">Amount Paid Now</div>
              <div className="slip-amount">{fmt(payment.amount)}</div>
            </div>
          </div>

          <div className="slip-grid">
            <div>
              <div className="slip-label">Previously Paid</div>
              <div className="slip-value mono positive">{fmt(paidBefore)}</div>
            </div>
            <div>
              <div className="slip-label">Balance Remaining</div>
              <div className="slip-value mono negative">{fmt(remainingAfter)}</div>
            </div>
          </div>

          <div className="slip-signatures">
            <div className="sig-block">
              <div className="sig-line" />
              <span>Receiver's Signature{payment.receiverName ? ` — ${payment.receiverName}` : ""}</span>
            </div>
            <div className="sig-block">
              <div className="sig-line" />
              <span>Customer's Signature</span>
            </div>
          </div>

          <div className="slip-footer">This is a system-generated receipt. Please retain for your records.</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                               */
/* ---------------------------------------------------------------------- */

function Dashboard({ customers, payments, societyName, onGoAdd, onGoPay }) {
  const totalCustomers = customers.length;
  const totalValue = customers.reduce((s, c) => s + c.total, 0);
  const totalCollected = customers.reduce((s, c) => s + c.paid, 0);
  const totalOutstanding = totalValue - totalCollected;
  const recent = [...payments].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  const cleared = customers.filter((c) => c.remaining <= 0).length;

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{societyName} — Overview</h2>
        <p className="muted">A snapshot of every plot, payment and pending balance across the society.</p>
      </div>

      <div className="stat-grid">
        <StatCard icon={<Users size={20} />} label="Registered Customers" value={totalCustomers} />
        <StatCard icon={<Landmark size={20} />} label="Total Plot Value" value={fmt(totalValue)} />
        <StatCard icon={<TrendingUp size={20} />} label="Total Collected" value={fmt(totalCollected)} tone="positive" />
        <StatCard icon={<Wallet size={20} />} label="Outstanding Balance" value={fmt(totalOutstanding)} tone="negative" />
      </div>

      <div className="dash-lower">
        <div className="dash-col">
          <div className="section-label">Recent Payments</div>
          {recent.length === 0 ? (
            <div className="empty-state small"><Receipt size={26} /><p>No payments recorded yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Customer</th><th>Slip #</th><th>Date</th><th>Amount</th></tr></thead>
                <tbody>
                  {recent.map((p) => {
                    const c = customers.find((c) => c.id === p.customerId);
                    return (
                      <tr key={p.id}>
                        <td>{c ? c.name : "—"}</td>
                        <td className="mono">#{p.slipNumber}</td>
                        <td>{fmtDate(p.date)}</td>
                        <td className="mono positive">{fmt(p.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="dash-col narrow">
          <div className="section-label">Quick Actions</div>
          <button className="action-tile" onClick={onGoAdd}>
            <UserPlus size={20} />
            <div><b>New Registration</b><span>Add a new plot customer</span></div>
          </button>
          <button className="action-tile" onClick={onGoPay}>
            <Wallet size={20} />
            <div><b>Collect Payment</b><span>Search and record installment</span></div>
          </button>
          <div className="mini-stat">
            <ShieldCheck size={18} />
            <span><b>{cleared}</b> of {totalCustomers} plots fully cleared</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* App                                                                     */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [nextSlip, setNextSlip] = useState(1001);
  const [societyName, setSocietyName] = useState("Abdullah Housing  Sceme");
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [activeCustomerId, setActiveCustomerId] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [slipData, setSlipData] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await storageGet("customers-data", { customers: [] });
      const l = await storageGet("ledger-data", { payments: [], nextSlip: 1001, societyName: "Abdullah Housing  Sceme" });
      setCustomers(c.customers || []);
      setPayments(l.payments || []);
      setNextSlip(l.nextSlip || 1001);
      if (l.societyName) setSocietyName(l.societyName);
      setLoaded(true);
    })();
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2600);
  };

  const persistCustomers = (list) => storageSet("customers-data", { customers: list });
  const persistLedger = (list, next, name) => storageSet("ledger-data", { payments: list, nextSlip: next, societyName: name });

  const customersWithFinancials = useMemo(() => {
    return customers.map((c) => {
      const { total } = computeFinancials(c);
      const paid = payments.filter((p) => p.customerId === c.id).reduce((s, p) => s + Number(p.amount || 0), 0);
      return { ...c, total, paid, remaining: total - paid };
    });
  }, [customers, payments]);

  const activeCustomer = customersWithFinancials.find((c) => c.id === activeCustomerId) || null;
  const activePayments = payments.filter((p) => p.customerId === activeCustomerId);

  /* ---- customer CRUD ---- */

  const addCustomer = (form) => {
    const record = {
      id: uid(),
      name: form.name.trim(),
      fatherName: form.fatherName.trim(),
      caste: form.caste.trim(),
      address: form.address.trim(),
      contact: form.contact.trim(),
      cnic: form.cnic.trim(),
      plotNumber: form.plotNumber.trim(),
      area: Number(form.area) || 0,
      actualAmount: Number(form.actualAmount) || 0,
      createdAt: todayISO(),
    };
    const newCustomers = [...customers, record];
    setCustomers(newCustomers);
    persistCustomers(newCustomers);

    let newPayments = payments;
    let newNext = nextSlip;
    if (Number(form.tokenAmount) > 0) {
      const p = {
        id: uid(),
        customerId: record.id,
        slipNumber: nextSlip,
        date: form.tokenDate || todayISO(),
        method: form.tokenMethod || "Cash",
        type: "Token",
        amount: Number(form.tokenAmount),
        receiverName: form.receiverName || "",
      };
      newPayments = [...payments, p];
      newNext = nextSlip + 1;
      setPayments(newPayments);
      setNextSlip(newNext);
      persistLedger(newPayments, newNext, societyName);
    }
    showToast("Customer registered successfully");
    setPage("customers");
  };

  const updateCustomer = (form) => {
    const updated = customers.map((c) =>
      c.id === editingCustomer.id
        ? {
            ...c,
            name: form.name.trim(),
            fatherName: form.fatherName.trim(),
            caste: form.caste.trim(),
            address: form.address.trim(),
            contact: form.contact.trim(),
            cnic: form.cnic.trim(),
            plotNumber: form.plotNumber.trim(),
            area: Number(form.area) || 0,
            actualAmount: Number(form.actualAmount) || 0,
          }
        : c
    );
    setCustomers(updated);
    persistCustomers(updated);
    setEditingCustomer(null);
    showToast("Record updated");
    setPage("detail");
  };

  const deleteCustomer = (id) => {
    const updated = customers.filter((c) => c.id !== id);
    const updatedPayments = payments.filter((p) => p.customerId !== id);
    setCustomers(updated);
    setPayments(updatedPayments);
    persistCustomers(updated);
    persistLedger(updatedPayments, nextSlip, societyName);
    showToast("Customer record deleted");
    setPage("customers");
    setActiveCustomerId(null);
  };

  /* ---- payments ---- */

  const addPayment = (customerId, data) => {
    const cust = customersWithFinancials.find((c) => c.id === customerId);
    const paidBefore = cust ? cust.paid : 0;
    const p = {
      id: uid(),
      customerId,
      slipNumber: nextSlip,
      date: data.date || todayISO(),
      method: data.method,
      type: data.type,
      amount: Number(data.amount),
      receiverName: data.receiverName || "",
      paidBeforeThis: paidBefore,
    };
    const newPayments = [...payments, p];
    const newNext = nextSlip + 1;
    setPayments(newPayments);
    setNextSlip(newNext);
    persistLedger(newPayments, newNext, societyName);
    showToast("Payment recorded — slip ready");
    setSlipData(p);
  };

  /* ---- render helpers ---- */

  const goDashboard = () => { setPage("dashboard"); setActiveCustomerId(null); };
  const goCustomers = () => { setPage("customers"); setActiveCustomerId(null); };
  const goAdd = () => { setEditingCustomer(null); setPage("add"); };
  const goPay = () => setPage("pay");
  const openCustomer = (id) => { setActiveCustomerId(id); setPage("detail"); };

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: <Home size={18} />, onClick: goDashboard },
    { key: "customers", label: "Customer Records", icon: <Users size={18} />, onClick: goCustomers },
    { key: "add", label: "New Registration", icon: <UserPlus size={18} />, onClick: goAdd },
    { key: "pay", label: "Collect Payment", icon: <Wallet size={18} />, onClick: goPay },
  ];

  if (!loaded) {
    return (
      <div className="app-shell loading-shell">
        <Seal size={64} initials="HS" />
        <p>Opening the ledger…</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <style>{CSS}</style>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <Seal size={44} initials="HS" />
          <div>
            <div className="brand-name">{societyName}</div>
            <div className="brand-sub">Plot &amp; Ledger Manager</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${page === n.key || (page === "detail" && n.key === "customers") ? "active" : ""}`}
              onClick={n.onClick}
            >
              {n.icon} <span>{n.label}</span>
            </button>
          ))}
        </nav>

        <button className="nav-item settings-item" onClick={() => setShowSettings(true)}>
          <Settings size={18} /> <span>Society Settings</span>
        </button>
        <div className="sidebar-foot">Registered plots stay saved on this device.</div>
      </aside>

      <main className="main-area">
        {page === "dashboard" && (
          <Dashboard customers={customersWithFinancials} payments={payments} societyName={societyName} onGoAdd={goAdd} onGoPay={goPay} />
        )}

        {page === "customers" && (
          <CustomerList customers={customersWithFinancials} onOpen={openCustomer} onAdd={goAdd} />
        )}

        {page === "add" && !editingCustomer && (
          <CustomerForm onCancel={goCustomers} onSave={addCustomer} isEdit={false} />
        )}

        {page === "add" && editingCustomer && (
          <CustomerForm
            initial={editingCustomer}
            isEdit
            onCancel={() => { setEditingCustomer(null); setPage("detail"); }}
            onSave={updateCustomer}
          />
        )}

        {page === "detail" && activeCustomer && (
          <CustomerDetail
            customer={activeCustomer}
            payments={activePayments}
            onBack={goCustomers}
            onEdit={() => { setEditingCustomer(activeCustomer); setPage("add"); }}
            onDelete={() =>
              setConfirmData({
                title: "Delete this customer?",
                message: `This will permanently remove ${activeCustomer.name}'s record and all payment history. This cannot be undone.`,
                confirmLabel: "Delete Record",
                onConfirm: () => deleteCustomer(activeCustomer.id),
              })
            }
            onAddPayment={goPay}
            onShowSlip={(p) => setSlipData(p)}
          />
        )}

        {page === "pay" && (
          <CollectPayment customers={customersWithFinancials} onSubmit={addPayment} />
        )}
      </main>

      <ConfirmDialog data={confirmData} onClose={() => setConfirmData(null)} />
      <Toast toast={toast} />

      {slipData && (
        <PaySlip
          payment={slipData}
          customer={customers.find((c) => c.id === slipData.customerId)}
          societyName={societyName}
          onClose={() => setSlipData(null)}
        />
      )}

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>Society Settings</h3>
            <Field label="Society Name">
              <input
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                onBlur={() => persistLedger(payments, nextSlip, societyName)}
              />
            </Field>
            <div className="confirm-actions">
              <button
                className="btn btn-primary"
                onClick={() => { persistLedger(payments, nextSlip, societyName); setShowSettings(false); showToast("Settings saved"); }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Styles                                                                  */
/* ---------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

:root{
  --ink:#1B2A4A;
  --ink-soft:#324268;
  --paper:#F3ECDA;
  --card:#FFFDF8;
  --brass:#B8863B;
  --brass-dark:#96692A;
  --stamp:#A13D2B;
  --sage:#4F7A5B;
  --slate:#6E6553;
  --rule:#DED0AC;
}

*{ box-sizing: border-box; }

.app-shell{
  display:flex;
  min-height:100vh;
  width:100%;
  background:var(--paper);
  background-image:
    repeating-linear-gradient(to bottom, rgba(27,42,74,0.045) 0px, rgba(27,42,74,0.045) 1px, transparent 1px, transparent 34px);
  font-family:'IBM Plex Sans', sans-serif;
  color:var(--ink);
}

.loading-shell{
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:14px;
  width:100%;
}
.loading-shell p{ color:var(--slate); font-style:italic; }

h1,h2,h3{ font-family:'Zilla Slab', serif; margin:0; color:var(--ink); }
.muted{ color:var(--slate); font-size:13px; margin:4px 0 0; }
.mono{ font-family:'IBM Plex Mono', monospace; }
.positive{ color:var(--sage); }
.negative{ color:var(--stamp); }

/* ---- Sidebar ---- */
.sidebar{
  width:250px;
  min-width:250px;
  background:var(--ink);
  color:#EDE6D3;
  display:flex;
  flex-direction:column;
  padding:22px 16px;
  gap:18px;
}
.sidebar-brand{ display:flex; align-items:center; gap:10px; padding:0 4px 14px; border-bottom:1px solid rgba(237,230,211,0.15); }
.brand-name{ font-family:'Zilla Slab', serif; font-weight:600; font-size:15px; line-height:1.25; color:#F5EFDD; }
.brand-sub{ font-size:11px; color:#B9AE8D; margin-top:2px; }

.sidebar-nav{ display:flex; flex-direction:column; gap:4px; margin-top:4px; }
.nav-item{
  display:flex; align-items:center; gap:10px;
  background:transparent; border:none; color:#D8CFB4;
  font-family:'IBM Plex Sans', sans-serif; font-size:13.5px; font-weight:500;
  padding:10px 12px; border-radius:8px; cursor:pointer; text-align:left;
  transition:background .15s ease, color .15s ease;
}
.nav-item:hover{ background:rgba(184,134,59,0.15); color:#F5EFDD; }
.nav-item.active{ background:var(--brass); color:#241a0d; font-weight:600; }
.settings-item{ margin-top:auto; }
.sidebar-foot{ font-size:11px; color:#93876A; padding:6px 4px 0; line-height:1.4; }

/* ---- Main ---- */
.main-area{ flex:1; padding:32px 40px; overflow-y:auto; }

.panel{
  background:var(--card);
  border:1px solid var(--rule);
  border-radius:14px;
  padding:28px 32px 32px;
  box-shadow:0 2px 10px rgba(27,42,74,0.06);
  max-width:1080px;
  margin:0 auto;
}
.panel-head{ margin-bottom:20px; }
.row-between{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; }

.section-label{
  font-family:'Zilla Slab', serif; font-weight:600; font-size:13px;
  text-transform:uppercase; letter-spacing:0.06em; color:var(--brass-dark);
  border-bottom:1px solid var(--rule); padding-bottom:6px; margin:24px 0 14px;
}
.section-label .optional{ text-transform:none; letter-spacing:0; font-weight:400; color:var(--slate); font-size:12px; }

/* ---- Forms ---- */
.grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:14px 18px; }
.field{ display:flex; flex-direction:column; gap:6px; font-size:13px; }
.field-label{ font-weight:600; color:var(--ink-soft); }
.req{ color:var(--stamp); }
.field-hint{ font-size:11px; color:var(--slate); }
.field input, .field select{
  border:1px solid var(--rule); background:#fff; border-radius:8px;
  padding:9px 11px; font-size:13.5px; font-family:'IBM Plex Sans', sans-serif; color:var(--ink);
}
.field input:focus, .field select:focus{ outline:2px solid var(--brass); outline-offset:1px; }
.field input.disabled{ background:#F1ECDD; color:var(--slate); }

.calc-strip{
  display:flex; align-items:center; gap:14px; flex-wrap:wrap;
  background:#F7F1E1; border:1px dashed var(--rule); border-radius:10px;
  padding:14px 18px; margin-top:18px;
}
.calc-strip.compact{ margin-top:0; margin-bottom:18px; }
.calc-strip > div{ display:flex; flex-direction:column; font-size:12px; color:var(--slate); }
.calc-strip b{ font-family:'IBM Plex Mono', monospace; font-size:14.5px; color:var(--ink); margin-top:2px; }
.calc-strip .plus, .calc-strip .eq{ font-family:'Zilla Slab', serif; font-size:18px; color:var(--brass-dark); }
.calc-strip .total b{ color:var(--stamp); }

.panel-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:26px; }

/* ---- Buttons ---- */
.btn{
  display:inline-flex; align-items:center; gap:7px;
  font-family:'IBM Plex Sans', sans-serif; font-weight:600; font-size:13.5px;
  border-radius:8px; padding:9px 16px; cursor:pointer; border:1px solid transparent;
  transition:transform .1s ease, box-shadow .15s ease;
}
.btn:active{ transform:translateY(1px); }
.btn-primary{ background:var(--brass); color:#241a0d; }
.btn-primary:hover{ background:var(--brass-dark); }
.btn-ghost{ background:transparent; color:var(--ink-soft); border-color:var(--rule); }
.btn-ghost:hover{ background:#F1EAD7; }
.btn-ghost.small{ padding:5px 10px; font-size:12px; }
.btn-danger{ background:var(--stamp); color:#fff; }
.btn-danger-outline{ background:transparent; color:var(--stamp); border-color:var(--stamp); }
.btn-danger-outline:hover{ background:rgba(161,61,43,0.08); }
.btn-icon{ background:transparent; border:1px solid var(--rule); border-radius:6px; padding:5px 7px; cursor:pointer; color:var(--ink-soft); }
.btn-icon:hover{ background:#F1EAD7; }

/* ---- Search ---- */
.search-bar{
  display:flex; align-items:center; gap:8px; background:#fff;
  border:1px solid var(--rule); border-radius:10px; padding:10px 14px; color:var(--slate);
}
.search-bar input{ border:none; outline:none; flex:1; font-size:13.5px; font-family:'IBM Plex Sans', sans-serif; color:var(--ink); background:transparent; }

.search-results{ margin-top:10px; display:flex; flex-direction:column; gap:6px; }
.result-row{
  display:flex; align-items:center; gap:12px; padding:10px 12px;
  border:1px solid var(--rule); border-radius:10px; cursor:pointer; background:#fff;
}
.result-row:hover{ border-color:var(--brass); }
.result-info{ flex:1; }
.selected-customer{
  display:flex; align-items:center; gap:12px; background:#F7F1E1;
  border:1px solid var(--rule); border-radius:10px; padding:12px 14px; margin-bottom:16px;
}

/* ---- Table ---- */
.table-wrap{ overflow-x:auto; margin-top:6px; }
.table{ width:100%; border-collapse:collapse; font-size:13.5px; }
.table thead th{
  text-align:left; font-family:'Zilla Slab', serif; font-weight:600; font-size:12px;
  text-transform:uppercase; letter-spacing:0.04em; color:var(--slate);
  border-bottom:2px solid var(--rule); padding:8px 10px;
}
.table tbody td{ padding:10px; border-bottom:1px solid var(--rule); vertical-align:middle; }
.clickable-row{ cursor:pointer; }
.clickable-row:hover{ background:#F7F1E1; }
.cell-name{ font-weight:600; }
.cell-sub{ font-size:11.5px; color:var(--slate); margin-top:2px; }
.cell-arrow{ color:var(--slate); text-align:right; }

.badge{ font-size:11px; font-weight:600; padding:4px 9px; border-radius:20px; }
.badge-clear{ background:rgba(79,122,91,0.15); color:var(--sage); }
.badge-active{ background:rgba(184,134,59,0.18); color:var(--brass-dark); }

.tag{ font-size:11px; font-weight:600; padding:3px 9px; border-radius:6px; background:#EFE7CF; color:var(--ink-soft); }
.tag-advance{ background:#E4EEE5; color:var(--sage); }
.tag-token{ background:#EEE3F2; color:#6B3F8C; }
.tag-installment{ background:#EFE7CF; color:var(--brass-dark); }

.empty-state{ display:flex; flex-direction:column; align-items:center; gap:8px; padding:44px 10px; color:var(--slate); text-align:center; }
.empty-state.small{ padding:20px 10px; }
.empty-state svg{ color:var(--brass); opacity:0.6; }

/* ---- Stat cards ---- */
.stat-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.stat-card{
  display:flex; align-items:center; gap:12px;
  background:#F7F1E1; border:1px solid var(--rule); border-radius:12px; padding:16px;
}
.stat-icon{ width:38px; height:38px; border-radius:10px; background:var(--ink); color:#F0E7CE; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.tone-positive .stat-icon{ background:var(--sage); }
.tone-negative .stat-icon{ background:var(--stamp); }
.stat-value{ font-family:'IBM Plex Mono', monospace; font-weight:600; font-size:16px; color:var(--ink); }
.stat-label{ font-size:11.5px; color:var(--slate); margin-top:2px; }

.dash-lower{ display:grid; grid-template-columns:2fr 1fr; gap:24px; margin-top:26px; }
.dash-col.narrow{ display:flex; flex-direction:column; gap:10px; }
.action-tile{
  display:flex; align-items:center; gap:12px; text-align:left;
  background:#fff; border:1px solid var(--rule); border-radius:10px; padding:14px;
  cursor:pointer; color:var(--ink);
}
.action-tile:hover{ border-color:var(--brass); }
.action-tile svg{ color:var(--brass-dark); flex-shrink:0; }
.action-tile b{ display:block; font-size:13.5px; }
.action-tile span{ display:block; font-size:11.5px; color:var(--slate); margin-top:1px; }
.mini-stat{ display:flex; align-items:center; gap:10px; background:#F7F1E1; border:1px dashed var(--rule); border-radius:10px; padding:12px 14px; font-size:12.5px; color:var(--slate); }
.mini-stat svg{ color:var(--sage); }

/* ---- Detail page ---- */
.link-back{ display:inline-flex; align-items:center; gap:6px; background:none; border:none; color:var(--slate); font-size:13px; cursor:pointer; margin-bottom:14px; padding:0; }
.link-back:hover{ color:var(--ink); }
.detail-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:18px; }
.detail-title{ display:flex; align-items:center; gap:14px; }
.detail-actions{ display:flex; gap:8px; flex-wrap:wrap; }
.avatar-circle{
  width:52px; height:52px; border-radius:50%; background:var(--ink); color:#F0E7CE;
  display:flex; align-items:center; justify-content:center; font-family:'Zilla Slab', serif; font-weight:700; font-size:20px; flex-shrink:0;
}
.avatar-circle.small{ width:38px; height:38px; font-size:15px; }
.info-grid{ margin:16px 0 4px; }
.info-line{ display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ink-soft); }
.info-line svg{ color:var(--brass); flex-shrink:0; }

.progress-block{ margin-top:20px; }
.progress-row{ display:flex; justify-content:space-between; font-size:13px; font-weight:600; margin-bottom:6px; }
.progress-track{ height:8px; background:#EAE1C7; border-radius:6px; overflow:hidden; }
.progress-fill{ height:100%; background:var(--sage); border-radius:6px; }
.progress-caption{ font-size:11.5px; color:var(--slate); margin-top:5px; }

/* ---- Seal ---- */
.seal-svg{ flex-shrink:0; }
.seal-ring-outer{ fill:none; stroke:var(--brass); stroke-width:2.5; stroke-dasharray:3 3; }
.seal-ring-inner{ fill:none; stroke:var(--brass); stroke-width:1.4; }
.seal-house{ fill:var(--ink); }
.seal-door{ fill:var(--brass); }
.seal-text{ font-family:'Zilla Slab', serif; font-weight:700; font-size:13px; fill:var(--ink); }

/* ---- Overlay / dialogs ---- */
.overlay{
  position:fixed; inset:0; background:rgba(27,42,74,0.45);
  display:flex; align-items:center; justify-content:center; z-index:50; padding:20px;
}
.confirm-box{
  background:var(--card); border-radius:14px; padding:26px 28px; max-width:400px; width:100%;
  box-shadow:0 12px 40px rgba(0,0,0,0.25);
}
.confirm-box h3{ margin-bottom:8px; }
.confirm-box p{ font-size:13.5px; color:var(--slate); line-height:1.5; }
.confirm-icon{ color:var(--stamp); margin-bottom:8px; }
.confirm-actions{ display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }

.toast-wrap{ position:fixed; bottom:24px; right:24px; z-index:60; }
.toast{
  display:flex; align-items:center; gap:8px; background:var(--ink); color:#F5EFDD;
  padding:12px 18px; border-radius:10px; font-size:13px; font-weight:500; box-shadow:0 8px 24px rgba(0,0,0,0.25);
}
.toast svg{ color:var(--sage); }

/* ---- Pay slip ---- */
.slip-shell{ width:100%; max-width:640px; max-height:92vh; overflow-y:auto; }
.slip-toolbar{ display:flex; justify-content:space-between; margin-bottom:10px; }
.slip-paper{
  position:relative; background:#FFFCF3; border:1px solid var(--rule); border-radius:4px;
  padding:30px 34px 26px; box-shadow:0 10px 40px rgba(0,0,0,0.2); overflow:hidden;
}
.perforation{
  position:absolute; top:0; left:0; right:0; height:10px;
  background-image:radial-gradient(circle, var(--paper) 3px, transparent 3.2px);
  background-size:16px 10px; background-position:0 -5px;
}
.slip-watermark{
  position:absolute; top:42%; left:50%; transform:translate(-50%,-50%) rotate(-18deg);
  font-family:'Zilla Slab', serif; font-size:52px; font-weight:700; color:rgba(27,42,74,0.05);
  letter-spacing:0.1em; pointer-events:none; white-space:nowrap;
}
.slip-header{ display:flex; align-items:center; gap:14px; margin-top:8px; }
.slip-title{ flex:1; }
.slip-title h1{ font-size:19px; }
.slip-title p{ font-size:11.5px; color:var(--slate); margin-top:2px; }
.slip-meta{ text-align:right; font-size:11.5px; color:var(--slate); }
.slip-meta div{ margin-bottom:2px; }
.slip-meta b{ font-family:'IBM Plex Mono', monospace; color:var(--ink); margin-left:6px; }
.slip-divider{ border-top:1px dashed var(--rule); margin:16px 0; }
.slip-grid{ display:grid; grid-template-columns:1fr 1fr; gap:12px 20px; }
.slip-grid .span-2{ grid-column:1 / -1; }
.slip-label{ font-size:10.5px; text-transform:uppercase; letter-spacing:0.05em; color:var(--slate); }
.slip-value{ font-size:13.5px; font-weight:600; color:var(--ink); margin-top:2px; }
.tag-inline{ display:inline-block; background:#EFE7CF; padding:2px 9px; border-radius:6px; font-size:12px; }
.slip-payment-box{
  display:flex; align-items:center; justify-content:space-between;
  background:#F7F1E1; border:1px dashed var(--brass); border-radius:8px; padding:12px 16px; margin:14px 0;
}
.slip-amount-box{ text-align:right; }
.slip-amount{ font-family:'IBM Plex Mono', monospace; font-size:22px; font-weight:600; color:var(--stamp); }
.slip-signatures{ display:flex; justify-content:space-between; gap:30px; margin-top:44px; }
.sig-block{ flex:1; text-align:center; }
.sig-line{ border-top:1px solid var(--ink); margin-bottom:6px; }
.sig-block span{ font-size:11px; color:var(--slate); }
.slip-footer{ text-align:center; font-size:10.5px; color:var(--slate); margin-top:26px; font-style:italic; }

@media print{
  body *{ visibility:hidden; }
  .print-area, .print-area *{ visibility:visible; }
  .print-area{ position:absolute; top:0; left:0; width:100%; box-shadow:none; border:none; }
  .no-print{ display:none !important; }
}

@media (max-width: 880px){
  .app-shell{ flex-direction:column; }
  .sidebar{ width:100%; min-width:0; flex-direction:row; align-items:center; padding:14px 16px; overflow-x:auto; }
  .sidebar-brand{ border:none; padding:0; }
  .brand-sub{ display:none; }
  .sidebar-nav{ flex-direction:row; }
  .settings-item{ margin-top:0; }
  .sidebar-foot{ display:none; }
  .main-area{ padding:18px; }
  .grid-2{ grid-template-columns:1fr; }
  .stat-grid{ grid-template-columns:1fr 1fr; }
  .dash-lower{ grid-template-columns:1fr; }
}
`;
