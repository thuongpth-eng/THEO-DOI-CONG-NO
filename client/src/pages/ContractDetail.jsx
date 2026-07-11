import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import api from "../lib/data";
import {
  fmtVND,
  fmtDate,
  statusName,
  STATUS_NAMES,
  outstanding,
  daysLate,
  summarize,
} from "../lib/models";
import Modal, { Field, Input, Textarea, Select, Btn } from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const emptyInst = {
  dot: "",
  hoso: "",
  noidung: "",
  value: "",
  paid: "",
  status: 0,
  ngayDenHan: "",
  ngayTT: "",
  ghichu: "",
  hanTT: 7,
};

function StatusBadge({ status }) {
  const tone =
    status >= 6
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : status === 5
      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
      : status >= 3
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-slate-500/15 text-sub";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${tone}`}>
      {statusName(status)}
    </span>
  );
}

export default function ContractDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { canEdit } = useAuth();
  const [contract, setContract] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [instModal, setInstModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyInst);
  const [ctModal, setCtModal] = useState(false);
  const [ctForm, setCtForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const [cts, inst] = await Promise.all([
      api.listContracts(),
      api.listInstallments(),
    ]);
    setContract(cts.find((c) => c.id === id) || null);
    setRows(
      inst
        .filter((i) => i.contractId === id)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    );
    setLoading(false);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyInst, dot: `ĐỢT ${rows.length + 1}` });
    setInstModal(true);
  }
  function openEdit(r) {
    setEditing(r);
    setForm({ ...emptyInst, ...r });
    setInstModal(true);
  }

  async function saveInst() {
    if (!form.dot.trim()) return alert("Nhập tên đợt (VD: ĐỢT 1).");
    setSaving(true);
    const payload = {
      contractId: id,
      contractName: contract.name,
      customerId: contract.customerId,
      dot: form.dot.trim(),
      hoso: form.hoso || "",
      noidung: form.noidung || "",
      value: Number(form.value) || 0,
      paid: Number(form.paid) || 0,
      status: Number(form.status) || 0,
      ngayDenHan: form.ngayDenHan || "",
      ngayTT: form.ngayTT || "",
      ghichu: form.ghichu || "",
      hanTT: Number(form.hanTT) || 0,
    };
    if (editing) {
      await api.updateInstallment(editing.id, payload);
    } else {
      await api.addInstallment({ ...payload, order: rows.length + 1 });
    }
    setSaving(false);
    setInstModal(false);
    reload();
  }

  async function delInst(r) {
    if (!confirm(`Xóa "${r.dot}"? Không thể hoàn tác.`)) return;
    await api.deleteInstallment(r.id);
    reload();
  }

  async function saveContract() {
    setSaving(true);
    await api.updateContract(id, {
      name: ctForm.name,
      customerName: ctForm.customerName,
      code: ctForm.code,
      work: ctForm.work,
      loc: ctForm.loc,
      totalAfterTax: Number(ctForm.totalAfterTax) || 0,
      maDuAn: ctForm.maDuAn,
    });
    setSaving(false);
    setCtModal(false);
    reload();
  }

  async function delContract() {
    if (!confirm(`Xóa công trình "${contract.name}" và toàn bộ đợt thanh toán?`)) return;
    await api.deleteContract(id);
    nav("/contracts");
  }

  if (loading) return <div className="py-20 text-center text-faint">Đang tải…</div>;
  if (!contract)
    return (
      <div className="py-20 text-center text-faint">
        Không tìm thấy công trình.{" "}
        <Link to="/contracts" className="text-brand-600">
          Quay lại
        </Link>
      </div>
    );

  const s = summarize(rows);

  return (
    <div>
      <Link
        to="/contracts"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-sub hover:text-brand-600"
      >
        <ArrowLeft size={15} /> Danh sách công trình
      </Link>

      {/* Thông tin công trình */}
      <div className="rounded-2xl border border-line bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 size={18} className="text-brand-600" />
              <h2 className="text-lg font-bold text-ink">{contract.name}</h2>
              <span className="text-xs text-faint">{contract.code}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-sub">{contract.customerName}</p>
            {contract.work && <p className="mt-1 text-sm text-sub">{contract.work}</p>}
            {contract.loc && (
              <p className="mt-0.5 text-xs text-faint">📍 {contract.loc}</p>
            )}
          </div>
          {canEdit && (
            <div className="flex shrink-0 gap-2">
              <Btn
                variant="outline"
                onClick={() => {
                  setCtForm({ ...contract });
                  setCtModal(true);
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Pencil size={14} /> <span className="hidden sm:inline">Sửa</span>
                </span>
              </Btn>
              <Btn variant="ghost" className="text-red-600" onClick={delContract}>
                <Trash2 size={15} />
              </Btn>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4">
          <Stat label="Giá trị HĐ" value={fmtVND(contract.totalAfterTax)} />
          <Stat label="Đã thu" value={fmtVND(s.totalPaid)} tone="text-emerald-600 dark:text-emerald-400" />
          <Stat label="Còn phải thu" value={fmtVND(s.outstanding)} tone="text-brand-600 dark:text-brand-400" />
          <Stat
            label="Quá hạn"
            value={fmtVND(s.overdue)}
            tone={s.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-faint"}
          />
        </div>
      </div>

      {/* Bảng đợt thanh toán */}
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">
          Đợt thanh toán ({rows.length})
        </h3>
        {canEdit && (
          <Btn onClick={openAdd}>
            <span className="flex items-center gap-1.5">
              <Plus size={16} /> <span className="hidden sm:inline">Thêm đợt</span>
              <span className="sm:hidden">Thêm</span>
            </span>
          </Btn>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-line bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-4 py-3 font-medium">Đợt</th>
                <th className="px-4 py-3 font-medium">Nội dung</th>
                <th className="px-4 py-3 text-right font-medium">Giá trị</th>
                <th className="px-4 py-3 text-right font-medium">Đã thu</th>
                <th className="px-4 py-3 text-right font-medium">Còn lại</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Đến hạn</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const late = daysLate(r);
                return (
                  <tr key={r.id} className="border-b border-line/60 last:border-0 align-top">
                    <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">
                      {r.dot}
                    </td>
                    <td className="px-4 py-3 text-sub">
                      <div className="font-medium text-ink">{r.hoso}</div>
                      <div className="max-w-md text-xs text-faint">{r.noidung}</div>
                      {r.ghichu && (
                        <div className="mt-0.5 text-xs italic text-amber-600 dark:text-amber-400">
                          {r.ghichu}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sub">
                      {fmtVND(r.value)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {fmtVND(r.paid)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                      {fmtVND(outstanding(r))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sub">
                      {fmtDate(r.ngayDenHan)}
                      {late > 0 && (
                        <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                          trễ {late} ngày
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEdit(r)}
                            className="rounded p-1.5 text-faint hover:bg-hover hover:text-brand-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => delInst(r)}
                            className="rounded p-1.5 text-faint hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-faint">
                    Chưa có đợt thanh toán. Bấm “Thêm đợt”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal đợt thanh toán */}
      <Modal
        open={instModal}
        onClose={() => setInstModal(false)}
        title={editing ? `Sửa ${editing.dot}` : "Thêm đợt thanh toán"}
        wide
        footer={
          <>
            <Btn variant="ghost" onClick={() => setInstModal(false)}>
              Hủy
            </Btn>
            <Btn onClick={saveInst} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Btn>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tên đợt *">
            <Input value={form.dot} onChange={set("dot")} placeholder="ĐỢT 1" />
          </Field>
          <Field label="Trạng thái">
            <Select value={form.status} onChange={set("status")}>
              {STATUS_NAMES.map((n, i) => (
                <option key={i} value={i}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Hồ sơ">
              <Input value={form.hoso} onChange={set("hoso")} placeholder="BIÊN BẢN NGHIỆM THU + HÓA ĐƠN VAT" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Nội dung">
              <Textarea value={form.noidung} onChange={set("noidung")} />
            </Field>
          </div>
          <Field label="Giá trị đợt (đ)">
            <Input type="number" value={form.value} onChange={set("value")} />
          </Field>
          <Field label="Đã thanh toán (đ)">
            <Input type="number" value={form.paid} onChange={set("paid")} />
          </Field>
          <Field label="Ngày đến hạn">
            <Input type="date" value={form.ngayDenHan} onChange={set("ngayDenHan")} />
          </Field>
          <Field label="Ngày thanh toán">
            <Input type="date" value={form.ngayTT} onChange={set("ngayTT")} />
          </Field>
          <Field label="Số ngày theo HĐ">
            <Input type="number" value={form.hanTT} onChange={set("hanTT")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Ghi chú">
              <Textarea value={form.ghichu} onChange={set("ghichu")} rows={2} />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Modal sửa công trình */}
      <Modal
        open={ctModal}
        onClose={() => setCtModal(false)}
        title="Sửa thông tin công trình"
        wide
        footer={
          <>
            <Btn variant="ghost" onClick={() => setCtModal(false)}>
              Hủy
            </Btn>
            <Btn onClick={saveContract} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Btn>
          </>
        }
      >
        {ctForm && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tên công trình">
              <Input
                value={ctForm.name}
                onChange={(e) => setCtForm({ ...ctForm, name: e.target.value })}
              />
            </Field>
            <Field label="Số hợp đồng">
              <Input
                value={ctForm.code}
                onChange={(e) => setCtForm({ ...ctForm, code: e.target.value })}
              />
            </Field>
            <Field label="Chủ đầu tư">
              <Input
                value={ctForm.customerName}
                onChange={(e) => setCtForm({ ...ctForm, customerName: e.target.value })}
              />
            </Field>
            <Field label="Giá trị hợp đồng (đ)">
              <Input
                type="number"
                value={ctForm.totalAfterTax}
                onChange={(e) => setCtForm({ ...ctForm, totalAfterTax: e.target.value })}
              />
            </Field>
            <Field label="Mã dự án">
              <Input
                value={ctForm.maDuAn}
                onChange={(e) => setCtForm({ ...ctForm, maDuAn: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Hạng mục công việc">
                <Textarea
                  value={ctForm.work}
                  onChange={(e) => setCtForm({ ...ctForm, work: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Địa điểm">
                <Input
                  value={ctForm.loc}
                  onChange={(e) => setCtForm({ ...ctForm, loc: e.target.value })}
                />
              </Field>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div>
      <div className="text-xs text-faint">{label}</div>
      <div className={`mt-0.5 text-sm font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}
