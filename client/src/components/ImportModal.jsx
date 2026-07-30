import { useMemo, useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import Modal, { Btn } from "./Modal";
import api from "../lib/data";
import { parseCongNoExcel } from "../lib/importExcel";
import { fmtTy } from "../lib/models";

// Khóa so khớp hợp đồng: ưu tiên số HĐ, không có thì dùng tên
const keyOf = (c) => (c.code || "").trim().toUpperCase() || "T:" + (c.name || "").trim().toUpperCase();
const dotKey = (d) => (d.dot || "").trim().toUpperCase();

export default function ImportModal({ open, onClose, onDone }) {
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null);
  const [cur, setCur] = useState(null); // dữ liệu đang có trong app (để so khớp)
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");

  function reset() {
    setFileName(""); setParsed(null); setCur(null); setErr(""); setDone("");
    setReading(false); setBusy(false);
  }

  async function onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name); setErr(""); setDone(""); setParsed(null); setReading(true);
    try {
      const buf = await f.arrayBuffer();
      const res = await parseCongNoExcel(buf);
      if (!res.contracts.length) {
        setErr(
          (res.warnings[0] || "Không đọc được công trình nào từ file.") +
            " — File phải là file công nợ theo mẫu app xuất ra (có sheet \"DANH SÁCH CÔNG TRÌNH\" và mỗi công trình 1 sheet)."
        );
        setReading(false);
        return;
      }
      const [cts, ins, cs] = await Promise.all([
        api.listContracts(), api.listInstallments(), api.listCustomers(),
      ]);
      setCur({ contracts: cts, installments: ins, customers: cs });
      setParsed(res);
    } catch (ex) {
      setErr("Không đọc được file: " + (ex?.message || ex));
    } finally {
      setReading(false);
    }
  }

  // So khớp file với dữ liệu đang có → biết cái nào thêm mới, cái nào cập nhật
  const plan = useMemo(() => {
    if (!parsed || !cur) return null;
    const byKey = new Map(cur.contracts.map((c) => [keyOf(c), c]));
    const rows = [];
    let dotNew = 0, dotUpd = 0;
    for (const c of parsed.contracts) {
      const old = byKey.get(keyOf(c));
      const dots = parsed.installments.filter((r) => r.contractId === c.id);
      let dNew = 0, dUpd = 0;
      if (old) {
        const oldDots = cur.installments.filter((r) => r.contractId === old.id);
        const oldByDot = new Map(oldDots.map((r) => [dotKey(r), r]));
        for (const d of dots) (oldByDot.has(dotKey(d)) ? dUpd++ : dNew++);
      } else {
        dNew = dots.length;
      }
      dotNew += dNew; dotUpd += dUpd;
      rows.push({ c, old, dots, dNew, dUpd });
    }
    return {
      rows,
      ctNew: rows.filter((r) => !r.old).length,
      ctUpd: rows.filter((r) => r.old).length,
      dotNew, dotUpd,
    };
  }, [parsed, cur]);

  // Đồng bộ: HĐ/đợt đã có → cập nhật; chưa có → thêm mới. KHÔNG xóa gì.
  async function doSync() {
    if (!plan) return;
    setBusy(true); setErr(""); setDone("");
    try {
      // Chủ đầu tư mới
      const curCus = new Set(cur.customers.map((x) => x.id));
      for (const c of parsed.customers)
        if (!curCus.has(c.id)) await api.addCustomer?.(c);

      let ctA = 0, ctU = 0, dA = 0, dU = 0;
      for (const { c, old, dots } of plan.rows) {
        // eslint-disable-next-line no-unused-vars
        const { id: _drop, ...fields } = c;
        let cid;
        if (old) {
          cid = old.id;
          await api.updateContract(cid, fields);
          ctU++;
        } else {
          const created = await api.addContract(fields);
          cid = created?.id || c.id;
          ctA++;
        }
        const oldDots = old
          ? cur.installments.filter((r) => r.contractId === old.id)
          : [];
        const oldByDot = new Map(oldDots.map((r) => [dotKey(r), r]));
        for (const d of dots) {
          // eslint-disable-next-line no-unused-vars
          const { id: _d2, ...df } = d;
          const hit = oldByDot.get(dotKey(d));
          if (hit) {
            await api.updateInstallment(hit.id, { ...df, contractId: cid });
            dU++;
          } else {
            await api.addInstallment({ ...df, contractId: cid });
            dA++;
          }
        }
      }
      setDone(
        `Xong: thêm mới ${ctA} hợp đồng · cập nhật ${ctU} hợp đồng · thêm ${dA} đợt · cập nhật ${dU} đợt.`
      );
      onDone?.();
    } catch (ex) {
      setErr("Lỗi khi đồng bộ: " + (ex?.message || ex));
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
          <Btn onClick={doSync} disabled={!plan || busy}>
            {busy ? "Đang đồng bộ…" : "Đồng bộ vào app"}
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-page/40 px-4 py-8 text-center hover:border-brand-400">
          <UploadCloud size={30} className="text-brand-500" />
          <span className="text-sm font-semibold text-ink">Chọn / kéo thả file Excel công nợ (.xlsx)</span>
          <span className="text-xs text-faint">Đúng mẫu chuẩn: có sheet "Danh sách công trình" + mỗi công trình 1 sheet</span>
          <span className="text-xs font-medium text-brand-600">Hợp đồng/đợt đã có sẽ được cập nhật · chưa có sẽ thêm mới · không xóa dữ liệu cũ</span>
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

        {done && (
          <div className="flex items-start gap-2 rounded-lg bg-brand-500/10 p-3 text-sm font-medium text-brand-600">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {done}
          </div>
        )}

        {plan && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="HĐ thêm mới" value={plan.ctNew} tone="text-accent" />
              <Stat label="HĐ cập nhật" value={plan.ctUpd} tone="text-brand-500" />
              <Stat label="Đợt thêm / cập nhật" value={`${plan.dotNew} / ${plan.dotUpd}`} />
              <Stat label="Tổng giá trị HĐ" value={fmtTy(totalHD)} />
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
                    <th className="px-2 py-1.5 text-center font-medium">Đợt (mới/cập nhật)</th>
                    <th className="px-2 py-1.5 text-center font-medium">Việc sẽ làm</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.rows.map(({ c, old, dNew, dUpd }) => (
                    <tr key={c.id} className="border-t border-line/60">
                      <td className="px-2 py-1.5 text-sub">{c.code}</td>
                      <td className="px-2 py-1.5 font-medium text-ink">{c.name}</td>
                      <td className="px-2 py-1.5 text-sub">{c.customerName}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmtTy(c.totalAfterTax)}</td>
                      <td className="px-2 py-1.5 text-center tabular-nums">
                        <span className="text-accent">{dNew}</span> / <span className="text-brand-500">{dUpd}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white ${
                            old ? "bg-brand-500" : "bg-accent"
                          }`}
                        >
                          {old ? "Cập nhật" : "Thêm mới"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-600">
              <CheckCircle2 size={14} /> Kiểm tra xong, bấm "Đồng bộ vào app" — dữ liệu cũ không bị xóa.
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
