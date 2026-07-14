import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Paperclip,
  X,
} from "lucide-react";
import api from "../lib/data";
import { fmtVND, fmtTy, fmtDate, outstanding, daysLate } from "../lib/models";
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

// Ngày cập nhật của 1 hợp đồng = ngày mới nhất trong các đợt (không bịa nếu chưa có)
function lastUpdate(rows) {
  let best = null;
  for (const r of rows) {
    for (const d of [r.ngayTT, r.ngayXuatHD, r.ngayGuiHS, r.ngayDenHan]) {
      if (d && (!best || d > best)) best = d;
    }
  }
  return best;
}

// Trạng thái 1 đợt → màu chấm trên thanh tiến trình
function stageState(r) {
  if (daysLate(r) > 0) return "overdue"; // quá hạn - đỏ
  if (outstanding(r) <= 0.5) return "paid"; // đã thu đủ - xanh
  if ((r.paid || 0) > 0 || (r.status || 0) >= 2) return "progress"; // đang xử lý - vàng
  return "todo"; // chưa tới - xám
}
const DOT = {
  overdue: "bg-danger text-white",
  paid: "bg-brand-500 text-white",
  progress: "bg-warning text-white",
  todo: "bg-line text-sub",
};

function Stepper({ rows }) {
  if (rows.length === 0)
    return <div className="text-xs italic text-faint">Chưa có đợt thanh toán</div>;
  return (
    <div className="flex items-center">
      {rows.map((r, i) => (
        <Fragment key={r.id}>
          {i > 0 && <div className="h-0.5 flex-1 bg-line" />}
          <div
            className="flex flex-col items-center"
            title={`${r.dot}: ${fmtVND(r.value)} · ${
              { overdue: "Quá hạn", paid: "Đã thu đủ", progress: "Đang xử lý", todo: "Chưa tới" }[
                stageState(r)
              ]
            }`}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                DOT[stageState(r)]
              }`}
            >
              {i + 1}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
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

export default function Contracts() {
  const nav = useNavigate();
  const { canEdit } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tìm kiếm + bộ lọc
  const [q, setQ] = useState("");
  const [fCus, setFCus] = useState(""); // lọc theo chủ đầu tư
  const [fStatus, setFStatus] = useState(""); // lọc theo trạng thái

  const [year, setYear] = useState(null);
  const [yearOpen, setYearOpen] = useState(true);
  const [openCus, setOpenCus] = useState({});

  // Modal thêm HĐ/PL
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  // Modal thêm khách hàng
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

  // Mở modal thêm HĐ/PL, có thể điền sẵn chủ đầu tư từ 1 công ty
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
          os: rs.reduce((s, r) => s + outstanding(r), 0),
          late: rs.some((r) => daysLate(r) > 0),
          fileCount: rs.reduce((s, r) => s + (r.files?.length || 0), 0),
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

  // Gom theo công ty (chủ đầu tư)
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
    g.fileCount = g.contracts.reduce((s, c) => s + c.fileCount, 0);
    g.updated = lastUpdate(g.contracts.flatMap((c) => c.rows));
    // trạng thái tổng: quá hạn > hoàn thành > đang thực hiện
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
  const hasFilter = q || fCus || fStatus;
  const cusNames = [...new Set(groups.map((g) => g.name))].sort((a, b) => a.localeCompare(b, "vi"));

  return (
    <div className="pt-4 xl:pt-6">
      {/* Tiêu đề trang + hành động */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink xl:text-2xl">
            Kho lưu trữ hợp đồng thi công
          </h1>
          <p className="mt-0.5 text-xs text-faint">
            Bấm tên công trình để mở đối chiếu công nợ &amp; hồ sơ · Thêm hợp đồng / phụ lục cho
            từng công ty
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

      {/* Thanh tìm kiếm + bộ lọc */}
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
            title={yearOpen ? "Thu gọn năm" : "Mở năm"}
          >
            {yearOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            <Archive size={18} /> NĂM {activeYear}
          </button>
          <span className="text-xs text-navdim">
            {byCus.size} công ty · {inYear.length} hợp đồng/phụ lục · bấm để xổ ra / thu gọn
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
          <b className="text-warning">{fmtVND(yearValue - yearPaid)}</b>
        </div>
      </div>

      {/* Danh sách gom theo công ty */}
      {yearOpen && (
        <div className="space-y-3">
          {filtered.map((g) => {
            const open = openCus[g.key] ?? true;
            return (
              <div
                key={g.key}
                className="overflow-hidden rounded-xl border border-line bg-card shadow-card"
              >
                {/* Header công ty */}
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => setOpenCus((s) => ({ ...s, [g.key]: !open }))}
                    className="mt-0.5 shrink-0 text-faint hover:text-ink"
                    title={open ? "Thu gọn" : "Mở"}
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
                    {g.maDuAn && (
                      <div className="mt-0.5 text-xs text-faint">Mã dự án: {g.maDuAn}</div>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
                      <span className="flex items-center gap-1">
                        <Layers size={11} /> {g.contracts.length} HĐ/PL · {g.rowCount} đợt
                      </span>
                      {g.fileCount > 0 && (
                        <span className="flex items-center gap-1 text-accent">
                          <Paperclip size={11} /> {g.fileCount} hồ sơ
                        </span>
                      )}
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
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${g.pct}%` }}
                        />
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

                {/* Hợp đồng của công ty */}
                {open && (
                  <div className="space-y-2 border-t border-line bg-page/40 p-3">
                    {g.contracts.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => nav(`/contracts/${c.id}`)}
                        className="cursor-pointer rounded-lg border border-line bg-card p-3 hover:border-brand-400"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
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
                              {c.fileCount > 0 && (
                                <span className="flex items-center gap-0.5 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                  <Paperclip size={10} /> {c.fileCount}
                                </span>
                              )}
                            </div>
                            {c.work && (
                              <div className="mt-1 max-w-2xl text-xs text-faint">
                                Hạng mục: {c.work}
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 text-right text-xs">
                            <div className="text-faint">
                              Đã thu <b className="text-brand-500">{fmtVND(c.paid)}</b>
                            </div>
                            <div className="text-faint">
                              Còn phải thu <b className="text-ink">{fmtVND(c.os)}</b>
                            </div>
                          </div>
                        </div>
                        {/* Dãy đợt Đ1..Đn */}
                        <div className="mt-3">
                          <Stepper rows={c.rows} />
                        </div>
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

      {/* Chú giải màu đợt */}
      <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-sub">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-brand-500" /> Đã thu đủ
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-warning" /> Đang xử lý
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-danger" /> Quá hạn
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-line" /> Chưa tới
        </span>
      </div>

      {/* Modal thêm HĐ/PL */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Thêm hợp đồng / phụ lục"
        wide
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModal(false)}>
              Hủy
            </Btn>
            <Btn onClick={saveContract} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Btn>
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
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="…hoặc nhập chủ đầu tư mới">
            <Input
              value={form.newCustomer}
              onChange={set("newCustomer")}
              placeholder="Tên công ty CĐT"
            />
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
            <Btn variant="ghost" onClick={() => setCustModal(false)}>
              Hủy
            </Btn>
            <Btn onClick={saveCustomer} disabled={custSaving}>
              {custSaving ? "Đang lưu…" : "Lưu khách hàng"}
            </Btn>
          </>
        }
      >
        <Field label="Tên chủ đầu tư *">
          <Input
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
            placeholder="VD: CÔNG TY TNHH ..."
          />
        </Field>
        <p className="mt-2 text-xs text-faint">
          Sau khi thêm, chủ đầu tư này sẽ xuất hiện trong danh sách khi thêm hợp đồng / phụ lục.
        </p>
      </Modal>
    </div>
  );
}
