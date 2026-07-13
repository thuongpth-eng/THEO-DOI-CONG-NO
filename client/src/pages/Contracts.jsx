import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ChevronRight,
  Search,
  Archive,
  CheckCircle2,
  Loader,
  Landmark,
} from "lucide-react";
import api from "../lib/data";
import { fmtVND, fmtTy, outstanding, daysLate } from "../lib/models";
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

// Lấy năm từ số hợp đồng (VD "01/2026/HĐXD-HPCS" → "2026")
const yearOf = (c) => {
  const m = (c.code || "").match(/(20\d{2})/) || (c.maDuAn || "").match(/(20\d{2})/);
  return m ? m[1] : "Chưa rõ năm";
};

const emptyForm = {
  name: "",
  customerName: "",
  newCustomer: "",
  code: "",
  work: "",
  loc: "",
  totalAfterTax: "",
  maDuAn: "",
};

function StatusTag({ done }) {
  return done ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
      <CheckCircle2 size={12} /> Hoàn thành
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">
      <Loader size={12} /> Đang thực hiện
    </span>
  );
}

function YearStat({ icon: Icon, label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sub">
        <Icon size={16} className="text-brand-500" /> {label}
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

export default function Contracts() {
  const nav = useNavigate();
  const { canEdit } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [year, setYear] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

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

  async function saveContract() {
    if (!form.name.trim()) return alert("Vui lòng nhập tên công trình.");
    setSaving(true);
    let customerId, customerName;
    if (form.newCustomer.trim()) {
      customerName = form.newCustomer.trim();
      customerId = slug(customerName);
      if (!customers.some((c) => c.id === customerId)) {
        await api.addCustomer?.({ id: customerId, name: customerName });
      }
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
      loai: "Hợp đồng",
      order: contracts.length + 1,
    });
    setSaving(false);
    setModal(false);
    setForm(emptyForm);
    reload();
  }

  // Gắn năm + trạng thái cho từng hợp đồng
  const enriched = useMemo(
    () =>
      contracts.map((c) => {
        const rs = installments.filter((i) => i.contractId === c.id);
        const os = rs.reduce((s, r) => s + outstanding(r), 0);
        return {
          ...c,
          year: yearOf(c),
          os,
          late: rs.some((r) => daysLate(r) > 0),
          count: rs.length,
          done: rs.length > 0 && os <= 0.5,
        };
      }),
    [contracts, installments]
  );

  const years = useMemo(() => {
    const ys = [...new Set(enriched.map((c) => c.year))];
    return ys.sort((a, b) => String(b).localeCompare(String(a)));
  }, [enriched]);

  const activeYear = year && years.includes(year) ? year : years[0];

  if (loading) return <div className="py-20 text-center text-faint">Đang tải…</div>;

  const inYear = enriched.filter((c) => c.year === activeYear);
  const doneCount = inYear.filter((c) => c.done).length;
  const totalValue = inYear.reduce((s, c) => s + (c.totalAfterTax || 0), 0);
  const totalOs = inYear.reduce((s, c) => s + c.os, 0);

  const rows = inYear
    .filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        (c.customerName || "").toLowerCase().includes(q.toLowerCase())
    )
    .sort((a, b) => b.os - a.os);

  return (
    <div>
      {/* Chọn năm lưu trữ */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-sub">
          <Archive size={16} className="text-brand-500" /> Năm lưu trữ:
        </span>
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`h-10 rounded-lg px-4 text-sm font-bold transition-colors ${
              y === activeYear
                ? "bg-brand-500 text-white"
                : "border border-line bg-card text-sub hover:border-brand-400 hover:text-brand-500"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Thống kê năm */}
      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <YearStat icon={Archive} label={`Hợp đồng năm ${activeYear}`} value={inYear.length} />
        <YearStat
          icon={CheckCircle2}
          label="Đã hoàn thành"
          value={doneCount}
          tone="text-brand-500"
        />
        <YearStat
          icon={Loader}
          label="Đang thực hiện"
          value={inYear.length - doneCount}
          tone="text-accent"
        />
        <YearStat
          icon={Landmark}
          label="Tổng giá trị / còn phải thu"
          value={`${fmtTy(totalValue)} / ${fmtTy(totalOs)}`}
        />
      </div>

      {/* Tìm kiếm + thêm */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-3 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm công trình / khách hàng…"
            className="h-10 w-full rounded-lg border border-line bg-card pl-9 pr-3 text-sm text-ink outline-none placeholder:text-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        {canEdit && (
          <Btn onClick={() => setModal(true)}>
            <span className="flex items-center gap-1.5">
              <Plus size={16} /> <span className="hidden sm:inline">Thêm hợp đồng</span>
              <span className="sm:hidden">Thêm</span>
            </span>
          </Btn>
        )}
      </div>

      {/* Danh sách dạng thẻ — điện thoại (<768px) */}
      <div className="space-y-3 md:hidden">
        {rows.map((c) => (
          <button
            key={c.id}
            onClick={() => nav(`/contracts/${c.id}`)}
            className="block w-full rounded-xl border border-line bg-card p-4 text-left shadow-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-ink">{c.name}</span>
                  {c.late && (
                    <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                      QUÁ HẠN
                    </span>
                  )}
                </div>
                <div className="mt-0.5 truncate text-xs text-faint">{c.customerName}</div>
                <div className="mt-1.5">
                  <StatusTag done={c.done} />
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-faint" />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
              <div>
                <div className="text-[11px] text-faint">Còn phải thu</div>
                <div className="font-semibold tabular-nums text-brand-500">{fmtVND(c.os)}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-faint">{c.count} đợt · Giá trị HĐ</div>
                <div className="tabular-nums text-sub">{fmtVND(c.totalAfterTax)}</div>
              </div>
            </div>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-line bg-card px-4 py-10 text-center text-faint">
            Không tìm thấy hợp đồng nào trong năm {activeYear}.
          </div>
        )}
      </div>

      {/* Bảng — tablet & desktop (≥768px) */}
      <div className="hidden rounded-xl border border-line bg-card shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="h-12 border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-3 py-3 font-medium">Công trình</th>
                <th className="px-3 py-3 font-medium">Chủ đầu tư</th>
                <th className="px-3 py-3 font-medium">Trạng thái</th>
                <th className="px-3 py-3 text-center font-medium">Số đợt</th>
                <th className="px-3 py-3 text-right font-medium">Giá trị HĐ</th>
                <th className="px-3 py-3 text-right font-medium">Còn phải thu</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => nav(`/contracts/${c.id}`)}
                  className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-hover"
                >
                  <td className="px-3 py-3 font-semibold text-ink">
                    <div className="flex items-center gap-2">
                      {c.name}
                      {c.late && (
                        <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-semibold text-white">
                          QUÁ HẠN
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-normal text-faint">{c.code}</div>
                  </td>
                  <td className="px-3 py-3 text-sub">{c.customerName}</td>
                  <td className="px-3 py-3">
                    <StatusTag done={c.done} />
                  </td>
                  <td className="px-3 py-3 text-center text-sub">{c.count}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-sub">
                    {fmtVND(c.totalAfterTax)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums text-ink">
                    {fmtVND(c.os)}
                  </td>
                  <td className="px-2 py-3 text-faint">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-faint">
                    Không tìm thấy hợp đồng nào trong năm {activeYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Thêm hợp đồng / công trình"
        wide
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModal(false)}>
              Hủy
            </Btn>
            <Btn onClick={saveContract} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu hợp đồng"}
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên công trình *">
            <Input value={form.name} onChange={set("name")} placeholder="VD: HOWELL" />
          </Field>
          <Field label="Số hợp đồng" hint="Năm trong số HĐ dùng để xếp vào kho lưu trữ">
            <Input value={form.code} onChange={set("code")} placeholder="01/2026/HĐXD-HPCS" />
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
          <Field label="…hoặc nhập chủ đầu tư mới" hint="Nếu điền ô này sẽ ưu tiên tạo KH mới">
            <Input
              value={form.newCustomer}
              onChange={set("newCustomer")}
              placeholder="Tên công ty CĐT"
            />
          </Field>
          <Field label="Giá trị hợp đồng (sau thuế)">
            <Input
              type="number"
              value={form.totalAfterTax}
              onChange={set("totalAfterTax")}
              placeholder="VD: 217204200000"
            />
          </Field>
          <Field label="Mã dự án">
            <Input value={form.maDuAn} onChange={set("maDuAn")} placeholder="HW-VSIP3" />
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
    </div>
  );
}
