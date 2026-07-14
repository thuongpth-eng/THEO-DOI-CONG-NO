import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Archive,
  ChevronRight,
  ChevronDown,
  Building2,
  MapPin,
  UserPlus,
  Layers,
  CalendarClock,
  Trash2,
  X,
} from "lucide-react";
import api from "../lib/data";
import {
  fmtVND,
  fmtTy,
  fmtDate,
  docSoVND,
  STATUS_NAMES,
  outstanding,
  daysLate,
  arisen,
  receivable,
} from "../lib/models";
import Modal, { Field, Input, Textarea, Select, Btn } from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const slug = (s) =>
  "cus_" +
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);

const yearOf = (c) => {
  const m = (c.code || "").match(/(20\d{2})/) || (c.maDuAn || "").match(/(20\d{2})/);
  return m ? m[1] : "Chưa rõ năm";
};
const todayISO = () => new Date().toISOString().slice(0, 10);

function stageState(r) {
  if (daysLate(r) > 0) return "overdue";
  if (outstanding(r) <= 0.5 && (r.paid || 0) > 0) return "paid";
  if (!arisen(r)) return "todo";
  return "progress";
}
const DOT = {
  overdue: "bg-danger text-white",
  paid: "bg-brand-500 text-white",
  progress: "bg-warning text-white",
  todo: "bg-line text-sub",
};
function Stepper({ rows }) {
  if (rows.length === 0)
    return <span className="text-xs italic text-faint">Chưa có đợt</span>;
  return (
    <div className="flex items-center">
      {rows.map((r, i) => (
        <Fragment key={r.id}>
          {i > 0 && <div className="h-0.5 w-4 bg-line sm:w-8" />}
          <span
            title={`${r.dot} · ${
              { overdue: "Quá hạn", paid: "Đã thu đủ", progress: "Đang xử lý", todo: "Chưa tới" }[
                stageState(r)
              ]
            }`}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
              DOT[stageState(r)]
            }`}
          >
            {i + 1}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/* Ô nhập trực tiếp trên bảng */
function EditCell({ value, type = "text", options, onSave, align = "left", placeholder }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  const base =
    "w-full min-w-[70px] rounded bg-transparent px-2 py-1.5 text-sm text-ink outline-none hover:bg-hover focus:bg-brandtint/30 focus:ring-1 focus:ring-brand-500/40";
  if (type === "select") {
    return (
      <select
        value={v}
        onChange={(e) => {
          setV(e.target.value);
          onSave(Number(e.target.value));
        }}
        className={base}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={type}
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const nv = type === "number" ? Number(v) || 0 : v;
        if (String(nv) !== String(value ?? "")) onSave(nv);
      }}
      className={`${base} ${align === "right" ? "text-right tabular-nums" : ""}`}
    />
  );
}

/* Ô tiền: hiển thị có dấu chấm ngăn cách, lưu ra số */
function MoneyCell({ value, onSave }) {
  const fmt = (n) => (n ? Number(n).toLocaleString("vi-VN") : "");
  const [v, setV] = useState(fmt(value));
  useEffect(() => setV(fmt(value)), [value]);
  return (
    <input
      value={v}
      inputMode="numeric"
      onChange={(e) => {
        const digits = e.target.value.replace(/[^\d]/g, "");
        setV(digits ? Number(digits).toLocaleString("vi-VN") : "");
      }}
      onBlur={() => {
        const n = Number(v.replace(/[^\d]/g, "")) || 0;
        if (n !== (value || 0)) onSave(n);
      }}
      className="w-full min-w-[110px] rounded bg-transparent px-2 py-1.5 text-right text-sm tabular-nums text-ink outline-none hover:bg-hover focus:bg-brandtint/30 focus:ring-1 focus:ring-brand-500/40"
    />
  );
}

const emptyForm = {
  name: "",
  customerName: "",
  newCustomer: "",
  code: "",
  work: "",
  loc: "",
  totalAfterTax: "",
  maDuAn: "",
  loai: "Hợp đồng",
};

const STATUS_OPTS = STATUS_NAMES.map((n, i) => ({ value: i, label: n }));

export default function Tracking({ summary = false, embedded = false }) {
  const { canEdit } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [fCus, setFCus] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [year, setYear] = useState(null);
  const [yearOpen, setYearOpen] = useState(true);
  const [openCus, setOpenCus] = useState({});

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [custModal, setCustModal] = useState(false);
  const [custName, setCustName] = useState("");
  const [custSaving, setCustSaving] = useState(false);

  async function reload() {
    const [ct, inst, cus] = await Promise.all([
      api.listContracts(),
      api.listInstallments(),
      api.listCustomers(),
    ]);
    setContracts(ct);
    setInstallments(inst);
    setCustomers(cus);
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openAdd(preset = {}) {
    setForm({ ...emptyForm, ...preset });
    setModal(true);
  }

  async function saveContract() {
    if (!form.name.trim()) return alert("Vui lòng nhập tên công trình.");
    setSaving(true);
    let customerId, customerName;
    if (form.newCustomer.trim()) {
      customerName = form.newCustomer.trim();
      customerId = slug(customerName);
      if (!customers.some((c) => c.id === customerId))
        await api.addCustomer?.({ id: customerId, name: customerName });
    } else {
      customerName = form.customerName;
      customerId = customers.find((c) => c.name === customerName)?.id || "";
    }
    await api.addContract({
      name: form.name.trim(),
      customerId,
      customerName,
      code: form.code.trim(),
      work: form.work.trim(),
      loc: form.loc.trim(),
      totalAfterTax: Number(form.totalAfterTax) || 0,
      maDuAn: form.maDuAn.trim(),
      group: form.name.trim(),
      loai: form.loai || "Hợp đồng",
      order: contracts.length + 1,
      updatedAt: todayISO(),
    });
    setSaving(false);
    setModal(false);
    setForm(emptyForm);
    reload();
  }

  async function saveCustomer() {
    const name = custName.trim();
    if (!name) return alert("Vui lòng nhập tên chủ đầu tư.");
    setCustSaving(true);
    const id = slug(name);
    if (!customers.some((c) => c.id === id)) await api.addCustomer?.({ id, name });
    setCustSaving(false);
    setCustModal(false);
    setCustName("");
    reload();
  }

  // Lưu 1 ô đợt + cập nhật mốc sửa của hợp đồng
  async function saveField(row, patch) {
    setInstallments((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    const t = todayISO();
    setContracts((prev) =>
      prev.map((c) => (c.id === row.contractId ? { ...c, updatedAt: t } : c))
    );
    await api.updateInstallment(row.id, patch);
    api.updateContract(row.contractId, { updatedAt: t });
  }

  async function addDot(c, count) {
    const created = await api.addInstallment({
      contractId: c.id,
      contractName: c.name,
      customerId: c.customerId,
      dot: `ĐỢT ${count + 1}`,
      hoso: "",
      noidung: "",
      value: 0,
      paid: 0,
      status: 0,
      ngayGuiHS: "",
      ngayXuatHD: "",
      ngayDenHan: "",
      ngayTT: "",
      duKienHD: "",
      duKienQLDA: "",
      duKienCDT: "",
      ghichu: "",
      hanTT: 7,
      order: count + 1,
    });
    setInstallments((prev) => [...prev, created]);
  }

  async function delDot(r) {
    if (!confirm(`Xóa "${r.dot}"? Không thể hoàn tác.`)) return;
    await api.deleteInstallment(r.id);
    setInstallments((prev) => prev.filter((x) => x.id !== r.id));
  }

  const rowsByContract = useMemo(() => {
    const m = new Map();
    for (const r of installments) {
      if (!m.has(r.contractId)) m.set(r.contractId, []);
      m.get(r.contractId).push(r);
    }
    for (const arr of m.values()) arr.sort((a, b) => (a.order || 0) - (b.order || 0));
    return m;
  }, [installments]);

  const enriched = useMemo(
    () =>
      contracts.map((c) => {
        const rs = rowsByContract.get(c.id) || [];
        return {
          ...c,
          year: yearOf(c),
          rows: rs,
          value: rs.reduce((s, r) => s + (r.value || 0), 0),
          paid: rs.reduce((s, r) => s + (r.paid || 0), 0),
          os: receivable(rs), // nợ CHỈ tính đợt đã phát sinh
          osAll: rs.reduce((s, r) => s + outstanding(r), 0),
          late: rs.some((r) => daysLate(r) > 0),
        };
      }),
    [contracts, rowsByContract]
  );

  const years = useMemo(() => {
    const ys = [...new Set(enriched.map((c) => c.year))];
    return ys.sort((a, b) => String(b).localeCompare(String(a)));
  }, [enriched]);
  const activeYear = year && years.includes(year) ? year : years[0];

  if (loading) return <div className="py-20 text-center text-faint">Đang tải…</div>;

  const inYear = enriched.filter((c) => c.year === activeYear);

  const groups = [];
  const byCus = new Map();
  for (const c of inYear) {
    const key = c.customerId || c.customerName;
    if (!byCus.has(key)) {
      const g = { key, name: c.customerName, loc: c.loc, maDuAn: c.maDuAn, contracts: [] };
      byCus.set(key, g);
      groups.push(g);
    }
    byCus.get(key).contracts.push(c);
  }
  for (const g of groups) {
    g.value = g.contracts.reduce((s, c) => s + c.value, 0);
    g.paid = g.contracts.reduce((s, c) => s + c.paid, 0);
    g.os = g.contracts.reduce((s, c) => s + c.os, 0);
    g.pct = g.value > 0 ? Math.round((g.paid / g.value) * 100) : 0;
    g.late = g.contracts.some((c) => c.late);
    g.rowCount = g.contracts.reduce((s, c) => s + c.rows.length, 0);
    g.updated = g.contracts.reduce((a, c) => (c.updatedAt && c.updatedAt > a ? c.updatedAt : a), "");
    g.st = g.late ? "overdue" : g.value > 0 && g.os <= 0.5 ? "done" : "progress";
  }

  const qq = q.trim().toLowerCase();
  const filtered = groups.filter((g) => {
    if (fCus && g.name !== fCus) return false;
    if (fStatus && g.st !== fStatus) return false;
    if (!qq) return true;
    return (
      g.name.toLowerCase().includes(qq) ||
      (g.maDuAn || "").toLowerCase().includes(qq) ||
      g.contracts.some(
        (c) =>
          c.name.toLowerCase().includes(qq) ||
          (c.code || "").toLowerCase().includes(qq) ||
          (c.maDuAn || "").toLowerCase().includes(qq)
      )
    );
  });
  filtered.sort((a, b) => b.os - a.os);

  const yearValue = inYear.reduce((s, c) => s + (c.totalAfterTax || c.value), 0);
  const yearPaid = inYear.reduce((s, c) => s + c.paid, 0);
  const yearOs = inYear.reduce((s, c) => s + c.os, 0);
  const hasFilter = q || fCus || fStatus;
  const cusNames = [...new Set(groups.map((g) => g.name))].sort((a, b) => a.localeCompare(b, "vi"));

  return (
    <div className={embedded ? "" : "pt-4 xl:pt-6"}>
      {/* Tiêu đề + hành động */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          {!embedded && (
            <h1 className="text-xl font-bold text-ink xl:text-2xl">Chi tiết công nợ theo công trình</h1>
          )}
          <p className={`text-xs text-faint ${embedded ? "" : "mt-0.5"}`}>
            {summary ? (
              <>Bấm tên công ty để xem tiến độ các đợt · Nợ chỉ tính đợt đã gửi hồ sơ / đến hạn</>
            ) : (
              <>Bấm tên công ty để mở · <b className="text-brand-500">Nhập trực tiếp trên bảng</b> · Nợ chỉ tính đợt đã gửi hồ sơ / đến hạn</>
            )}
          </p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Btn onClick={() => openAdd()}>
              <span className="flex items-center gap-1.5">
                <Plus size={16} /> Thêm hợp đồng / phụ lục
              </span>
            </Btn>
            <Btn variant="ghost" onClick={() => setCustModal(true)}>
              <span className="flex items-center gap-1.5">
                <UserPlus size={16} /> Thêm khách hàng mới
              </span>
            </Btn>
          </div>
        )}
      </div>

      {/* Tìm kiếm + lọc */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-3 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm công trình, CĐT, số HĐ…"
            className="h-10 w-full rounded-lg border border-line bg-page pl-9 pr-3 text-sm text-ink outline-none placeholder:text-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={fCus}
          onChange={(e) => setFCus(e.target.value)}
          className="h-10 rounded-lg border border-line bg-page px-3 text-sm text-ink outline-none focus:border-brand-500"
        >
          <option value="">Tất cả CĐT / công trình</option>
          {cusNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="h-10 rounded-lg border border-line bg-page px-3 text-sm text-ink outline-none focus:border-brand-500"
        >
          <option value="">Mọi trạng thái</option>
          <option value="overdue">Có quá hạn</option>
          <option value="progress">Đang thực hiện</option>
          <option value="done">Đã thu đủ</option>
        </select>
        {hasFilter && (
          <button
            onClick={() => {
              setQ("");
              setFCus("");
              setFStatus("");
            }}
            className="flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-faint hover:text-danger"
          >
            <X size={15} /> Xóa lọc
          </button>
        )}
      </div>

      {/* Thanh NĂM */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-nav px-4 py-3 text-navfg">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setYearOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-md px-1 text-base font-bold hover:bg-navhover"
          >
            {yearOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <Archive size={18} /> NĂM {activeYear}
          </button>
          <span className="text-xs text-navdim">
            {byCus.size} công ty · {inYear.length} hợp đồng/phụ lục
          </span>
          <div className="flex gap-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                  y === activeYear ? "bg-brand-500 text-white" : "text-navdim hover:bg-navhover"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="text-right text-xs">
          <span className="text-navdim">Đã thu </span>
          <b className="text-brand-400">{fmtVND(yearPaid)}</b>
          <span className="text-navdim"> / {fmtTy(yearValue)}</span>
          <span className="ml-2 text-navdim">Còn phải thu </span>
          <b className="text-warning">{fmtVND(yearOs)}</b>
        </div>
      </div>

      {/* Danh sách công ty */}
      {yearOpen && (
        <div className="space-y-3">
          {filtered.map((g) => {
            const open = openCus[g.key] ?? true;
            return (
              <div key={g.key} className="overflow-hidden rounded-xl border border-line bg-card shadow-card">
                {/* Header công ty */}
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => setOpenCus((s) => ({ ...s, [g.key]: !open }))}
                    className="mt-0.5 shrink-0 text-faint hover:text-ink"
                  >
                    {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => setOpenCus((s) => ({ ...s, [g.key]: !open }))}
                      className="flex items-center gap-2 text-left font-bold text-ink hover:text-brand-500"
                    >
                      <Building2 size={16} className="shrink-0 text-brand-500" /> {g.name}
                    </button>
                    {g.maDuAn && <div className="mt-0.5 text-xs text-faint">Mã dự án: {g.maDuAn}</div>}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                      <span className="flex items-center gap-1">
                        <Layers size={11} /> {g.contracts.length} HĐ/PL · {g.rowCount} đợt
                      </span>
                      {g.loc && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {g.loc}
                        </span>
                      )}
                      {g.updated && (
                        <span className="flex items-center gap-1">
                          <CalendarClock size={11} /> Cập nhật {fmtDate(g.updated)}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-hover">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${g.pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-brand-500">{g.pct}% đã thu</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-right text-xs">
                      <div className="text-faint">
                        Tổng đã thu <b className="text-brand-500">{fmtVND(g.paid)}</b>
                        <span className="text-faint"> / {fmtTy(g.value)}</span>
                      </div>
                      <div className="mt-0.5 text-faint">
                        Còn phải thu <b className="text-ink">{fmtVND(g.os)}</b>
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => openAdd({ customerName: g.name })}
                        className="flex items-center gap-1 rounded-lg border border-dashed border-brand-500 px-2.5 py-1 text-xs font-semibold text-brand-500 hover:bg-brandtint"
                      >
                        <Plus size={13} /> Thêm HĐ/PL
                      </button>
                    )}
                  </div>
                </div>

                {/* Bảng công nợ từng hợp đồng */}
                {open && (
                  <div className="space-y-4 border-t border-line bg-page/40 p-3">
                    {g.contracts.map((c) => (
                      <div key={c.id} className="rounded-lg border border-line bg-card">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                                c.loai === "Phụ lục" ? "bg-warning" : "bg-accent"
                              }`}
                            >
                              {c.loai || "Hợp đồng"}
                            </span>
                            <span className="font-semibold text-ink">{c.code || c.name}</span>
                            {c.late && (
                              <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                                QUÁ HẠN
                              </span>
                            )}
                            <span className="ml-1">
                              <Stepper rows={c.rows} />
                            </span>
                          </div>
                          <div className="text-right text-xs">
                            <span className="text-faint">Đã thu </span>
                            <b className="text-brand-500">{fmtVND(c.paid)}</b>
                            <span className="ml-2 text-faint">Còn phải thu </span>
                            <b className="text-ink">{fmtVND(c.os)}</b>
                          </div>
                        </div>
                        {c.work && (
                          <div className="border-b border-line px-3 py-2 text-xs text-faint">
                            Hạng mục: {c.work}
                          </div>
                        )}

                        {!summary && (
                          <>
                            <TrackTable
                              rows={c.rows}
                              canEdit={canEdit}
                              onField={saveField}
                              onDel={delDot}
                            />

                            {canEdit && (
                              <div className="p-2">
                                <button
                                  onClick={() => addDot(c, c.rows.length)}
                                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-sub hover:border-brand-400 hover:text-brand-500"
                                >
                                  <Plus size={14} /> Thêm đợt
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-line bg-card px-4 py-10 text-center text-faint">
              {hasFilter
                ? "Không tìm thấy công trình phù hợp bộ lọc."
                : `Không có hợp đồng nào trong năm ${activeYear}.`}
            </div>
          )}
        </div>
      )}

      {/* Chú giải */}
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-sub">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-brand-500" /> Đã thu đủ</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-warning" /> Đang xử lý</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-danger" /> Quá hạn</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-line" /> Chưa tới (chưa tính nợ)</span>
      </div>

      {/* Modal thêm HĐ/PL */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Thêm hợp đồng / phụ lục"
        wide
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModal(false)}>Hủy</Btn>
            <Btn onClick={saveContract} disabled={saving}>{saving ? "Đang lưu…" : "Lưu"}</Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Loại *">
            <Select value={form.loai} onChange={set("loai")}>
              <option value="Hợp đồng">Hợp đồng</option>
              <option value="Phụ lục">Phụ lục</option>
            </Select>
          </Field>
          <Field label="Tên công trình *">
            <Input value={form.name} onChange={set("name")} placeholder="VD: HOWELL" />
          </Field>
          <Field label="Số hợp đồng / phụ lục" hint="Năm trong số HĐ dùng để xếp vào kho">
            <Input value={form.code} onChange={set("code")} placeholder="01/2026/HĐXD-HPCS" />
          </Field>
          <Field label="Mã dự án">
            <Input value={form.maDuAn} onChange={set("maDuAn")} placeholder="HW-VSIP3" />
          </Field>
          <Field label="Chọn chủ đầu tư có sẵn">
            <Select value={form.customerName} onChange={set("customerName")}>
              <option value="">— Chọn —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="…hoặc nhập chủ đầu tư mới">
            <Input value={form.newCustomer} onChange={set("newCustomer")} placeholder="Tên công ty CĐT" />
          </Field>
          <Field label="Giá trị hợp đồng (sau thuế)">
            <Input type="number" value={form.totalAfterTax} onChange={set("totalAfterTax")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Hạng mục công việc">
              <Textarea value={form.work} onChange={set("work")} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Địa điểm">
              <Input value={form.loc} onChange={set("loc")} />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Modal thêm khách hàng */}
      <Modal
        open={custModal}
        onClose={() => setCustModal(false)}
        title="Thêm khách hàng (chủ đầu tư) mới"
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCustModal(false)}>Hủy</Btn>
            <Btn onClick={saveCustomer} disabled={custSaving}>{custSaving ? "Đang lưu…" : "Lưu khách hàng"}</Btn>
          </>
        }
      >
        <Field label="Tên chủ đầu tư *">
          <Input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="VD: CÔNG TY TNHH ..." />
        </Field>
      </Modal>
    </div>
  );
}

/* Bảng công nợ 1 hợp đồng — nhập trực tiếp trên ô */
function TrackTable({ rows, canEdit, onField, onDel }) {
  const RO = !canEdit;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="h-11 border-b border-line bg-page/60 text-left text-[11px] uppercase tracking-wide text-faint">
            <th className="whitespace-nowrap px-3 py-2 font-medium">Đợt</th>
            <th className="min-w-[200px] px-3 py-2 font-medium">Nội dung cần hoàn thành</th>
            <th className="min-w-[150px] px-3 py-2 font-medium">Hồ sơ yêu cầu</th>
            <th className="min-w-[150px] px-3 py-2 font-medium">Trạng thái hồ sơ</th>
            <th className="whitespace-nowrap px-3 py-2 font-medium">Trạng thái TT</th>
            <th className="min-w-[130px] px-3 py-2 font-medium">Ngày gửi HS</th>
            <th className="min-w-[130px] px-3 py-2 font-medium">Ngày xuất HĐ</th>
            <th className="whitespace-nowrap px-3 py-2 text-center font-medium">Ngày theo HĐ</th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Giá trị đợt</th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium">TT thực tế</th>
            <th className="min-w-[130px] px-3 py-2 font-medium">Ngày thực thu</th>
            <th className="whitespace-nowrap px-3 py-2 text-right font-medium">Còn lại</th>
            <th className="min-w-[130px] px-3 py-2 font-medium">Công nợ đến hạn</th>
            <th className="whitespace-nowrap px-3 py-2 text-center font-medium">Quá hạn</th>
            <th className="min-w-[130px] px-3 py-2 font-medium">Dự kiến thu HĐ</th>
            <th className="min-w-[130px] px-3 py-2 font-medium">Dự kiến thu QLDA</th>
            <th className="min-w-[130px] px-3 py-2 font-medium">Dự kiến thu CĐT</th>
            <th className="min-w-[150px] px-3 py-2 font-medium">Ghi chú</th>
            {canEdit && <th className="px-2 py-2"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const late = daysLate(r);
            const future = !arisen(r);
            const pay =
              (r.paid || 0) <= 0
                ? { label: "Chưa thanh toán", cls: "bg-muted text-white" }
                : outstanding(r) > 0.5
                ? { label: "Thanh toán một phần", cls: "bg-warning text-white" }
                : { label: "Đã thanh toán", cls: "bg-brand-500 text-white" };
            return (
              <tr
                key={r.id}
                className={`border-b border-line/60 align-middle last:border-0 ${future ? "opacity-60" : ""}`}
              >
                <td className="whitespace-nowrap px-3 py-1 font-semibold text-ink">
                  {RO ? r.dot : <EditCell value={r.dot} onSave={(v) => onField(r, { dot: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs text-sub">{r.noidung}</span> : <EditCell value={r.noidung} onSave={(v) => onField(r, { noidung: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs text-sub">{r.hoso}</span> : <EditCell value={r.hoso} onSave={(v) => onField(r, { hoso: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? (
                    <span className="text-xs">{STATUS_NAMES[r.status] ?? "—"}</span>
                  ) : (
                    <EditCell type="select" options={STATUS_OPTS} value={r.status ?? 0} onSave={(v) => onField(r, { status: v })} />
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-1">
                  <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${pay.cls}`}>
                    {pay.label}
                  </span>
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs">{fmtDate(r.ngayGuiHS)}</span> : <EditCell type="date" value={r.ngayGuiHS} onSave={(v) => onField(r, { ngayGuiHS: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs">{fmtDate(r.ngayXuatHD)}</span> : <EditCell type="date" value={r.ngayXuatHD} onSave={(v) => onField(r, { ngayXuatHD: v })} />}
                </td>
                <td className="px-1 py-1 text-center">
                  {RO ? r.hanTT || "—" : <EditCell type="number" align="right" value={r.hanTT} onSave={(v) => onField(r, { hanTT: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? <div className="text-right tabular-nums">{fmtVND(r.value)}</div> : <MoneyCell value={r.value} onSave={(v) => onField(r, { value: v })} />}
                </td>
                <td className="px-1 py-1 text-emerald-600 dark:text-emerald-400">
                  {RO ? (
                    <div className="text-right tabular-nums">{fmtVND(r.paid)}</div>
                  ) : (
                    <MoneyCell value={r.paid} onSave={(v) => onField(r, { paid: v })} />
                  )}
                  {(r.paid || 0) > 0 && (
                    <div className="px-2 text-right text-[10px] italic text-faint">{docSoVND(r.paid)}</div>
                  )}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs">{fmtDate(r.ngayTT)}</span> : <EditCell type="date" value={r.ngayTT} onSave={(v) => onField(r, { ngayTT: v })} />}
                </td>
                <td className="whitespace-nowrap px-3 py-1 text-right font-semibold tabular-nums text-ink">
                  {fmtVND(outstanding(r))}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs">{fmtDate(r.ngayDenHan)}</span> : <EditCell type="date" value={r.ngayDenHan} onSave={(v) => onField(r, { ngayDenHan: v })} />}
                </td>
                <td className="whitespace-nowrap px-3 py-1 text-center">
                  {late > 0 ? (
                    <span className="inline-block rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">
                      {late} ngày
                    </span>
                  ) : future ? (
                    <span className="text-[10px] italic text-faint">chưa tới</span>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs">{fmtDate(r.duKienHD)}</span> : <EditCell type="date" value={r.duKienHD} onSave={(v) => onField(r, { duKienHD: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs">{fmtDate(r.duKienQLDA)}</span> : <EditCell type="date" value={r.duKienQLDA} onSave={(v) => onField(r, { duKienQLDA: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs">{fmtDate(r.duKienCDT)}</span> : <EditCell type="date" value={r.duKienCDT} onSave={(v) => onField(r, { duKienCDT: v })} />}
                </td>
                <td className="px-1 py-1">
                  {RO ? <span className="text-xs italic text-amber-600 dark:text-amber-400">{r.ghichu}</span> : <EditCell value={r.ghichu} onSave={(v) => onField(r, { ghichu: v })} />}
                </td>
                {canEdit && (
                  <td className="whitespace-nowrap px-2 py-1">
                    <button
                      onClick={() => onDel(r)}
                      className="rounded p-1.5 text-faint hover:bg-red-500/10 hover:text-red-600"
                      title="Xóa đợt"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={canEdit ? 19 : 18} className="px-4 py-6 text-center text-xs text-faint">
                Chưa có đợt. Bấm “Thêm đợt”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
