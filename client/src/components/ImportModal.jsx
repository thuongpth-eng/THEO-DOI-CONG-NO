import { useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import Modal, { Btn } from "./Modal";
import api from "../lib/data";
import { parseCongNoExcel } from "../lib/importExcel";
import { fmtTy } from "../lib/models";

export default function ImportModal({ open, onClose, onDone }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function reset() {
    setFileName(""); setParsed(null); setErr(""); setReading(false); setBusy(false);
  }

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name); setErr(""); setParsed(null); setReading(true);
    try {
      const buf = await f.arrayBuffer();
      const res = await parseCongNoExcel(buf);
      setParsed(res);
    } catch (ex) {
      setErr("Không đọc được file: " + (ex?.message || ex));
    } finally {
      setReading(false);
    }
  }

  async function doReplace() {
    if (!parsed?.contracts?.length) return;
    if (!confirm(`Thay thế TOÀN BỘ dữ liệu hiện tại bằng ${parsed.contracts.length} công trình trong file?\n(Dữ liệu cũ sẽ bị xóa — hãy chắc đã sao lưu).`)) return;
    setBusy(true); setErr("");
    try {
      const [cs, cts, ins] = await Promise.all([api.listCustomers(), api.listContracts(), api.listInstallments()]);
      for (const r of ins) await api.deleteInstallment(r.id);
      for (const c of cts) await api.deleteContract(c.id);
      for (const c of cs) await api.deleteCustomer?.(c.id);
      for (const c of parsed.customers) await api.addCustomer(c);
      for (const c of parsed.contracts) await api.addContract(c);
      for (const r of parsed.installments) await api.addInstallment(r);
      onDone?.();
      reset();
      onClose();
    } catch (ex) {
      setErr("Lỗi khi nhập: " + (ex?.message || ex));
    } finally {
      setBusy(false);
    }
  }

  const totalHD = parsed ? parsed.contracts.reduce((s, c) => s + (c.totalAfterTax || 0), 0) : 0;
  const totalPaid = parsed ? parsed.installments.reduce((s, r) => s + (r.paid || 0), 0) : 0;

  return (
    <Modal
      open={open}
      onClose={() => { if (!busy) { reset(); onClose(); } }}
      title="Nhập dữ liệu công nợ từ Excel"
      wide
      footer={
        <>
          <Btn variant="ghost" onClick={() => { if (!busy) { reset(); onClose(); } }}>Đóng</Btn>
          <Btn onClick={doReplace} disabled={!parsed?.contracts?.length || busy}>
            {busy ? "Đang nhập…" : "Thay thế toàn bộ & Lưu"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-page/40 px-4 py-8 text-center hover:border-brand-400">
          <UploadCloud size={30} className="text-brand-500" />
          <span className="text-sm font-semibold text-ink">Chọn / kéo thả file Excel công nợ (.xlsx)</span>
          <span className="text-xs text-faint">Đúng mẫu chuẩn: có sheet "Danh sách công trình" + mỗi công trình 1 sheet</span>
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
        </label>

        {fileName && (
          <div className="flex items-center gap-2 text-sm text-sub">
            <FileSpreadsheet size={16} className="text-brand-500" /> {fileName}
            {reading && <span className="text-faint">· đang đọc…</span>}
          </div>
        )}

        {err && (
          <div className="flex items-start gap-2 rounded-lg bg-danger/10 p-3 text-sm text-danger">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {err}
          </div>
        )}

        {parsed && parsed.contracts.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Công trình" value={parsed.contracts.length} />
              <Stat label="Khách hàng" value={parsed.customers.length} />
              <Stat label="Đợt" value={parsed.installments.length} />
              <Stat label="Tổng giá trị HĐ" value={fmtTy(totalHD)} tone="text-accent" />
            </div>
            <div className="text-xs text-faint">Đã thu: <b className="text-brand-500">{fmtTy(totalPaid)}</b> · Còn phải thu: <b className="text-ink">{fmtTy(totalHD - totalPaid)}</b></div>

            {parsed.warnings.length > 0 && (
              <div className="rounded-lg bg-warning/10 p-3 text-xs text-warning">
                {parsed.warnings.map((w, i) => <div key={i}>⚠️ {w}</div>)}
              </div>
            )}

            <div className="max-h-56 overflow-auto rounded-lg border border-line">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-page">
                  <tr className="text-left text-faint">
                    <th className="px-2 py-1.5 font-medium">Số HĐ</th>
                    <th className="px-2 py-1.5 font-medium">Công trình</th>
                    <th className="px-2 py-1.5 font-medium">Chủ đầu tư</th>
                    <th className="px-2 py-1.5 text-right font-medium">Giá trị</th>
                    <th className="px-2 py-1.5 text-center font-medium">Đợt</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.contracts.map((c) => (
                    <tr key={c.id} className="border-t border-line/60">
                      <td className="px-2 py-1.5 text-sub">{c.code}</td>
                      <td className="px-2 py-1.5 font-medium text-ink">{c.name}</td>
                      <td className="px-2 py-1.5 text-sub">{c.customerName}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmtTy(c.totalAfterTax)}</td>
                      <td className="px-2 py-1.5 text-center">{parsed.installments.filter((r) => r.contractId === c.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-600">
              <CheckCircle2 size={14} /> Kiểm tra xong, bấm "Thay thế toàn bộ & Lưu" để cập nhật vào app.
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-lg border border-line bg-card p-2.5">
      <div className="text-[11px] uppercase text-faint">{label}</div>
      <div className={`text-base font-bold ${tone}`}>{value}</div>
    </div>
  );
}
