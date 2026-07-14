import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Paperclip,
  ExternalLink,
  X,
} from "lucide-react";
import api from "../lib/data";
import {
  fmtVND,
  fmtDate,
  docSoVND,
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
  ngayGuiHS: "",
  ngayXuatHD: "",
  ngayDenHan: "",
  ngayTT: "",
  duKienHD: "",
  duKienQLDA: "",
  duKienCDT: "",
  ghichu: "",
  hanTT: 7,
  files: [],
};

function StatusBadge({ status }) {
  const tone =
    status >= 6
      ? "bg-brand-500 text-white"
      : status === 5
      ? "bg-accent text-white"
      : status >= 3
      ? "bg-warning text-white"
      : "bg-muted text-white";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {statusName(status)}
    </span>
  );
}

// Trạng thái thanh toán suy ra từ đã thu / giá trị
function payState(r) {
  const os = outstanding(r);
  if ((r.paid || 0) <= 0) return { label: "Chưa thanh toán", cls: "bg-muted text-white" };
  if (os > 0.5) return { label: "Thanh toán một phần", cls: "bg-warning text-white" };
  return { label: "Đã thanh toán", cls: "bg-brand-500 text-white" };
}
function PayBadge({ r }) {
  const s = payState(r);
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// Danh sách link hồ sơ (đọc) — dùng ở cả bảng và thẻ
function FileLinks({ files }) {
  if (!files || files.length === 0) return <span className="text-xs text-faint">—</span>;
  return (
    <div className="flex flex-col gap-1">
      {files.map((f, i) => (
        <a
          key={i}
          href={f.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-accent hover:underline"
          title={f.url}
        >
          <Paperclip size={11} className="shrink-0" />
          <span className="max-w-[140px] truncate">{f.name || "Tệp"}</span>
          <ExternalLink size={10} className="shrink-0 opacity-60" />
        </a>
      ))}
    </div>
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

  // ô nhập link hồ sơ tạm trong modal
  const [fName, setFName] = useState("");
  const [fUrl, setFUrl] = useState("");

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
    setForm({ ...emptyInst, dot: `ĐỢT ${rows.length + 1}`, files: [] });
    setFName("");
    setFUrl("");
    setInstModal(true);
  }
  function openEdit(r) {
    setEditing(r);
    setForm({ ...emptyInst, ...r, files: r.files ? [...r.files] : [] });
    setFName("");
    setFUrl("");
    setInstModal(true);
  }

  function addFile() {
    let url = fUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const name = fName.trim() || url.replace(/^https?:\/\//i, "").slice(0, 40);
    setForm((f) => ({ ...f, files: [...(f.files || []), { name, url }] }));
    setFName("");
    setFUrl("");
  }
  function removeFile(i) {
    setForm((f) => ({ ...f, files: f.files.filter((_, idx) => idx !== i) }));
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
      ngayGuiHS: form.ngayGuiHS || "",
      ngayXuatHD: form.ngayXuatHD || "",
      ngayDenHan: form.ngayDenHan || "",
      ngayTT: form.ngayTT || "",
      duKienHD: form.duKienHD || "",
      duKienQLDA: form.duKienQLDA || "",
      duKienCDT: form.duKienCDT || "",
      ghichu: form.ghichu || "",
      hanTT: Number(form.hanTT) || 0,
      files: form.files || [],
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
        <ArrowLeft size={15} /> Kho lưu trữ hợp đồng
      </Link>

      {/* Thông tin công trình */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Building2 size={18} className="text-brand-600" />
              <h2 className="text-lg font-bold text-ink">{contract.name}</h2>
              <span className="text-xs text-faint">{contract.code}</span>
            </div>
            <p className="mt-1 text-sm font-medium text-sub">{contract.customerName}</p>
            {contract.work && <p className="mt-1 text-sm text-sub">{contract.work}</p>}
            {contract.loc && <p className="mt-0.5 text-xs text-faint">📍 {contract.loc}</p>}
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

      {/* Bảng đối chiếu công nợ */}
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">
          Đối chiếu công nợ theo đợt ({rows.length})
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

      {/* Danh sách dạng thẻ — điện thoại (<768px) */}
      <div className="mt-3 space-y-3 md:hidden">
        {rows.map((r) => {
          const late = daysLate(r);
          return (
            <div key={r.id} className="rounded-xl border border-line bg-card p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{r.dot}</div>
                  <div className="mt-0.5 text-xs text-sub">{r.hoso}</div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={r.status} />
                  <PayBadge r={r} />
                </div>
              </div>
              {r.noidung && <div className="mt-2 text-xs text-faint">{r.noidung}</div>}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3 text-sm">
                <div>
                  <div className="text-[11px] text-faint">Giá trị đợt</div>
                  <div className="tabular-nums text-sub">{fmtVND(r.value)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-faint">Còn lại</div>
                  <div className="font-semibold tabular-nums text-ink">{fmtVND(outstanding(r))}</div>
                </div>
                <div>
                  <div className="text-[11px] text-faint">TT thực tế</div>
                  <div className="tabular-nums text-brand-500">{fmtVND(r.paid)}</div>
                  {(r.paid || 0) > 0 && (
                    <div className="text-[10px] italic text-faint">{docSoVND(r.paid)}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-faint">Đến hạn</div>
                  <div className="text-sub">
                    {fmtDate(r.ngayDenHan)}
                    {late > 0 && <span className="ml-1 font-semibold text-danger">trễ {late}n</span>}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-faint">Ngày gửi HS</div>
                  <div className="text-sub">{fmtDate(r.ngayGuiHS)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-faint">Ngày thực thu</div>
                  <div className="text-sub">{fmtDate(r.ngayTT)}</div>
                </div>
              </div>
              <div className="mt-2 border-t border-line pt-2">
                <div className="text-[11px] text-faint">Hồ sơ đính kèm</div>
                <div className="mt-1">
                  <FileLinks files={r.files} />
                </div>
              </div>
              {r.ghichu && <div className="mt-2 text-xs italic text-warning">{r.ghichu}</div>}
              {canEdit && (
                <div className="mt-3 flex gap-2 border-t border-line pt-3">
                  <button
                    onClick={() => openEdit(r)}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-line text-sm font-medium text-sub"
                  >
                    <Pencil size={15} /> Sửa
                  </button>
                  <button
                    onClick={() => delInst(r)}
                    className="flex min-h-[44px] items-center justify-center rounded-lg border border-line px-4 text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-xl border border-line bg-card px-4 py-10 text-center text-faint">
            Chưa có đợt thanh toán. Bấm “Thêm đợt”.
          </div>
        )}
      </div>

      {/* Bảng đầy đủ — tablet & desktop (≥768px) */}
      <div className="mt-3 hidden rounded-xl border border-line bg-card shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="h-12 border-b border-line bg-page/60 text-left text-[11px] uppercase tracking-wider text-faint">
                <th className="whitespace-nowrap px-3 py-3 font-medium">Đợt</th>
                <th className="min-w-[220px] px-3 py-3 font-medium">Nội dung cần hoàn thành</th>
                <th className="min-w-[160px] px-3 py-3 font-medium">Hồ sơ yêu cầu</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Trạng thái hồ sơ</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Trạng thái thanh toán</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Ngày gửi HS</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Ngày xuất hóa đơn</th>
                <th className="whitespace-nowrap px-3 py-3 text-center font-medium">Số ngày theo HĐ</th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium">Giá trị đợt</th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium">TT thực tế</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Ngày thực thu</th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium">Còn lại</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Công nợ đến hạn</th>
                <th className="whitespace-nowrap px-3 py-3 text-center font-medium">Số ngày quá hạn</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Dự kiến thu theo HĐ</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Dự kiến thu QLDA</th>
                <th className="whitespace-nowrap px-3 py-3 font-medium">Dự kiến thu CĐT</th>
                <th className="min-w-[160px] px-3 py-3 font-medium">Ghi chú</th>
                <th className="min-w-[150px] px-3 py-3 font-medium">Hồ sơ đính kèm</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const late = daysLate(r);
                return (
                  <tr
                    key={r.id}
                    className="border-b border-line/60 align-top last:border-0 hover:bg-hover"
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-ink">{r.dot}</td>
                    <td className="px-3 py-3 text-sub">
                      <div className="max-w-[280px] text-xs">{r.noidung}</div>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-sub">
                      <div className="max-w-[180px]">{r.hoso}</div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3">
                      <PayBadge r={r} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sub">{fmtDate(r.ngayGuiHS)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sub">{fmtDate(r.ngayXuatHD)}</td>
                    <td className="px-3 py-3 text-center text-sub">{r.hanTT || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-sub">
                      {fmtVND(r.value)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                      <div className="whitespace-nowrap">{fmtVND(r.paid)}</div>
                      {(r.paid || 0) > 0 && (
                        <div className="mt-0.5 max-w-[160px] text-[10px] font-normal italic text-faint">
                          {docSoVND(r.paid)}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sub">{fmtDate(r.ngayTT)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-ink">
                      {fmtVND(outstanding(r))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sub">{fmtDate(r.ngayDenHan)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-center">
                      {late > 0 ? (
                        <span className="inline-block rounded-full bg-danger px-2 py-0.5 text-xs font-semibold text-white">
                          {late} ngày
                        </span>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-sub">{fmtDate(r.duKienHD)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sub">{fmtDate(r.duKienQLDA)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-sub">{fmtDate(r.duKienCDT)}</td>
                    <td className="px-3 py-3">
                      <div className="max-w-[200px] text-xs italic text-amber-600 dark:text-amber-400">
                        {r.ghichu}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <FileLinks files={r.files} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-3">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => openEdit(r)}
                            className="rounded p-1.5 text-faint hover:bg-hover hover:text-brand-600"
                            title="Sửa"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => delInst(r)}
                            className="rounded p-1.5 text-faint hover:bg-red-500/10 hover:text-red-600"
                            title="Xóa"
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
                  <td colSpan={20} className="px-4 py-10 text-center text-faint">
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
          <Field label="Trạng thái hồ sơ">
            <Select value={form.status} onChange={set("status")}>
              {STATUS_NAMES.map((n, i) => (
                <option key={i} value={i}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Hồ sơ yêu cầu">
              <Input value={form.hoso} onChange={set("hoso")} placeholder="BIÊN BẢN NGHIỆM THU + HÓA ĐƠN VAT" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Nội dung cần hoàn thành để được thanh toán">
              <Textarea value={form.noidung} onChange={set("noidung")} />
            </Field>
          </div>
          <Field label="Giá trị đợt (đ)">
            <Input type="number" value={form.value} onChange={set("value")} />
          </Field>
          <Field label="Giá trị thanh toán thực tế (đ)">
            <Input type="number" value={form.paid} onChange={set("paid")} />
          </Field>
          <Field label="Ngày gửi hồ sơ">
            <Input type="date" value={form.ngayGuiHS} onChange={set("ngayGuiHS")} />
          </Field>
          <Field label="Ngày xuất hóa đơn">
            <Input type="date" value={form.ngayXuatHD} onChange={set("ngayXuatHD")} />
          </Field>
          <Field label="Số ngày theo HĐ">
            <Input type="number" value={form.hanTT} onChange={set("hanTT")} />
          </Field>
          <Field label="Ngày công nợ đến hạn">
            <Input type="date" value={form.ngayDenHan} onChange={set("ngayDenHan")} />
          </Field>
          <Field label="Ngày thực thu">
            <Input type="date" value={form.ngayTT} onChange={set("ngayTT")} />
          </Field>
          <Field label="Dự kiến thu theo hợp đồng">
            <Input type="date" value={form.duKienHD} onChange={set("duKienHD")} />
          </Field>
          <Field label="Dự kiến thu theo bảng dự thầu QLDA">
            <Input type="date" value={form.duKienQLDA} onChange={set("duKienQLDA")} />
          </Field>
          <Field label="Dự kiến thu theo KH chủ đầu tư">
            <Input type="date" value={form.duKienCDT} onChange={set("duKienCDT")} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Ghi chú">
              <Textarea value={form.ghichu} onChange={set("ghichu")} rows={2} />
            </Field>
          </div>

          {/* Hồ sơ đính kèm (link) */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-sub">
              Hồ sơ đính kèm (dán link file scan / Drive / SharePoint…)
            </label>
            {form.files?.length > 0 && (
              <div className="mb-2 space-y-1">
                {form.files.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 py-2 text-sm"
                  >
                    <Paperclip size={13} className="shrink-0 text-faint" />
                    <span className="flex-1 truncate text-ink" title={f.url}>
                      {f.name}
                    </span>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-accent hover:underline"
                      title="Mở"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => removeFile(i)}
                      className="shrink-0 text-faint hover:text-danger"
                      title="Bỏ"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="sm:w-1/3">
                <Input
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="Tên hồ sơ (VD: BBNT đợt 2)"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={fUrl}
                  onChange={(e) => setFUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFile();
                    }
                  }}
                  placeholder="Dán đường link… (Google Drive, SharePoint…)"
                />
              </div>
              <Btn variant="outline" onClick={addFile}>
                <span className="flex items-center gap-1.5">
                  <Plus size={15} /> Thêm link
                </span>
              </Btn>
            </div>
            <p className="mt-1 text-xs text-faint">
              Tải file scan lên Google Drive / SharePoint rồi dán link vào đây. Có thể thêm nhiều
              file cho 1 đợt.
            </p>
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
              <Input value={ctForm.name} onChange={(e) => setCtForm({ ...ctForm, name: e.target.value })} />
            </Field>
            <Field label="Số hợp đồng">
              <Input value={ctForm.code} onChange={(e) => setCtForm({ ...ctForm, code: e.target.value })} />
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
              <Input value={ctForm.maDuAn} onChange={(e) => setCtForm({ ...ctForm, maDuAn: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Hạng mục công việc">
                <Textarea value={ctForm.work} onChange={(e) => setCtForm({ ...ctForm, work: e.target.value })} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Địa điểm">
                <Input value={ctForm.loc} onChange={(e) => setCtForm({ ...ctForm, loc: e.target.value })} />
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
