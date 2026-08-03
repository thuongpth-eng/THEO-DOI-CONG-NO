import { useMemo, useState } from "react";
import { Download, Filter, Columns3, FileSpreadsheet, FileText } from "lucide-react";
import Modal, { Btn } from "./Modal";
import {
  FIELDS,
  DEFAULT_FIELDS,
  MOC_NGAY,
  filterRows,
  exportCustomExcel,
  exportCustomPDF,
  ddmmyyyy,
} from "../lib/exportCustom";
import { fmtTy, outstanding } from "../lib/models";

// Xuất dữ liệu theo ý muốn: lọc tháng / CĐT / công trình / quá hạn - đến hạn + chọn cột
export default function ExportModal({
  open,
  onClose,
  contracts,
  installments,
  exportedBy,
  onMauChuan,
  busyMauChuan,
}) {
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [mocNgay, setMocNgay] = useState(""); // rỗng = xuất toàn bộ, không lọc theo ngày
  const [cus, setCus] = useState([]);
  const [cts, setCts] = useState([]);
  const [chiQuaHan, setQuaHan] = useState(false);
  const [chiDenHan, setDenHan] = useState(false);
  const [chiConNo, setConNo] = useState(false);
  const [kemChuaCoNgay, setKem] = useState(false);
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const dsCus = useMemo(
    () => [...new Set(contracts.map((c) => c.customerName).filter(Boolean))].sort(),
    [contracts]
  );

  const f = { tuNgay, denNgay, mocNgay, customers: cus, contracts: cts, chiQuaHan, chiDenHan, chiConNo, kemChuaCoNgay, fields };

  // Đặt nhanh khoảng ngày
  const iso = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  function datKy(loai) {
    const n = new Date();
    if (loai === "all") {
      setMocNgay(""); setTuNgay(""); setDenNgay("");
      return;
    }
    if (!mocNgay) setMocNgay("ngayDenHan");
    if (loai === "thang") {
      setTuNgay(iso(new Date(n.getFullYear(), n.getMonth(), 1)));
      setDenNgay(iso(new Date(n.getFullYear(), n.getMonth() + 1, 0)));
    } else if (loai === "quy") {
      const q = Math.floor(n.getMonth() / 3);
      setTuNgay(iso(new Date(n.getFullYear(), q * 3, 1)));
      setDenNgay(iso(new Date(n.getFullYear(), q * 3 + 3, 0)));
    } else if (loai === "nam") {
      setTuNgay(`${n.getFullYear()}-01-01`);
      setDenNgay(`${n.getFullYear()}-12-31`);
    }
  }

  // Bỏ hết điều kiện lọc → xuất toàn bộ
  function xoaLoc() {
    setMocNgay(""); setTuNgay(""); setDenNgay("");
    setCus([]); setCts([]); setQuaHan(false); setDenHan(false); setConNo(false); setKem(false);
  }

  // Xem trước số dòng & số tiền sẽ xuất
  const preview = useMemo(() => {
    const rows = filterRows(installments, contracts, f);
    return {
      n: rows.length,
      value: rows.reduce((s, r) => s + (r.value || 0), 0),
      paid: rows.reduce((s, r) => s + (r.paid || 0), 0),
      os: rows.reduce((s, r) => s + outstanding(r), 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installments, contracts, tuNgay, denNgay, mocNgay, cus, cts, chiQuaHan, chiDenHan, chiConNo, kemChuaCoNgay]);

  const toggle = (arr, set, v) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function run(dang = "excel") {
    setBusy(true);
    setErr("");
    try {
      if (dang === "pdf") {
        exportCustomPDF(contracts, installments, f, { exportedBy });
      } else {
        await exportCustomExcel(contracts, installments, f, { exportedBy });
      }
      onClose();
    } catch (ex) {
      setErr(ex?.message || String(ex));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Xuất dữ liệu theo ý muốn"
      wide
      footer={
        <>
          <Btn variant="ghost" onClick={onClose}>Đóng</Btn>
          <Btn variant="ghost" onClick={() => run("pdf")} disabled={busy || !preview.n || !fields.length}>
            <span className="flex items-center gap-1.5">
              <FileText size={15} /> Xuất PDF
            </span>
          </Btn>
          <Btn onClick={() => run("excel")} disabled={busy || !preview.n || !fields.length}>
            <span className="flex items-center gap-1.5">
              <Download size={15} /> {busy ? "Đang xuất…" : `Xuất Excel (${preview.n} dòng)`}
            </span>
          </Btn>
        </>
      }
    >
      <div className="space-y-4">
        {/* Xuất nguyên mẫu chuẩn HP CONS (nhiều sheet) */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-500/40 bg-brand-500/5 p-3">
          <div className="text-xs text-sub">
            <b className="text-ink">Xuất theo mẫu chuẩn HP CONS</b> — đủ 3 phần: Tổng quan ·
            Danh sách công trình · mỗi công trình 1 sheet (đúng mẫu file công nợ của công ty).
          </div>
          <button
            onClick={onMauChuan}
            disabled={busyMauChuan}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
          >
            <FileSpreadsheet size={15} />
            {busyMauChuan ? "Đang xuất…" : "Xuất mẫu chuẩn"}
          </button>
        </div>

        {/* Bộ lọc */}
        <Box icon={Filter} title="…hoặc xuất riêng theo ý muốn — Phạm vi dữ liệu">
          <div className="mb-3 flex flex-wrap gap-2">
            <Chk on={!mocNgay} set={() => datKy("all")} label="Xuất toàn bộ (không lọc ngày)" />
            <Mini onClick={() => datKy("thang")}>Tháng này</Mini>
            <Mini onClick={() => datKy("quy")}>Quý này</Mini>
            <Mini onClick={() => datKy("nam")}>Năm nay</Mini>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <L label="Tính theo mốc ngày">
              <select value={mocNgay} onChange={(e) => setMocNgay(e.target.value)} className={INP}>
                {MOC_NGAY.map((m) => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </L>
            <L label="Từ ngày">
              <input
                type="date"
                value={tuNgay}
                disabled={!mocNgay}
                onChange={(e) => setTuNgay(e.target.value)}
                className={`${INP} ${!mocNgay ? "opacity-50" : ""}`}
              />
            </L>
            <L label="Đến ngày">
              <input
                type="date"
                value={denNgay}
                disabled={!mocNgay}
                onChange={(e) => setDenNgay(e.target.value)}
                className={`${INP} ${!mocNgay ? "opacity-50" : ""}`}
              />
            </L>
          </div>
          <p className="mt-1 text-[11px] italic text-faint">
            {mocNgay
              ? `Đang lấy: ${ddmmyyyy(tuNgay) || "đầu kỳ"} → ${ddmmyyyy(denNgay) || "cuối kỳ"} theo ${
                  MOC_NGAY.find((m) => m.key === mocNgay)?.label
                }. Nhiều đợt chưa có ngày — muốn giữ thì tích “Kèm đợt chưa có ngày”.`
              : "Đang lấy toàn bộ dữ liệu, không giới hạn thời gian."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Chk on={chiQuaHan} set={setQuaHan} label="Chỉ công nợ QUÁ HẠN" tone="danger" />
            <Chk on={chiDenHan} set={setDenHan} label="Chỉ công nợ ĐẾN HẠN" tone="warning" />
            <Chk on={chiConNo} set={setConNo} label="Chỉ đợt còn phải thu" />
            {mocNgay && <Chk on={kemChuaCoNgay} set={setKem} label="Kèm đợt chưa có ngày" />}
            <Mini onClick={xoaLoc}>Bỏ hết bộ lọc</Mini>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <L label={`Chủ đầu tư ${cus.length ? `(${cus.length} chọn)` : "(tất cả)"}`}>
              <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-line p-2">
                {dsCus.map((n) => (
                  <Row key={n} on={cus.includes(n)} onClick={() => toggle(cus, setCus, n)} label={n} />
                ))}
              </div>
            </L>
            <L label={`Công trình ${cts.length ? `(${cts.length} chọn)` : "(tất cả)"}`}>
              <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-line p-2">
                {contracts.map((c) => (
                  <Row
                    key={c.id}
                    on={cts.includes(c.id)}
                    onClick={() => toggle(cts, setCts, c.id)}
                    label={`${c.name}${c.code ? ` · ${c.code}` : ""}`}
                  />
                ))}
              </div>
            </L>
          </div>
        </Box>

        {/* Chọn cột */}
        <Box icon={Columns3} title={`Cột cần xuất (${fields.length}/${FIELDS.length})`}>
          <div className="mb-2 flex gap-2">
            <Mini onClick={() => setFields(FIELDS.map((x) => x.key))}>Chọn tất cả</Mini>
            <Mini onClick={() => setFields(DEFAULT_FIELDS)}>Mặc định</Mini>
            <Mini onClick={() => setFields([])}>Bỏ hết</Mini>
          </div>
          <div className="grid max-h-44 grid-cols-1 gap-1 overflow-auto sm:grid-cols-3">
            {FIELDS.map((x) => (
              <Row
                key={x.key}
                on={fields.includes(x.key)}
                onClick={() => toggle(fields, setFields, x.key)}
                label={x.label}
              />
            ))}
          </div>
        </Box>

        {/* Xem trước */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Số dòng" value={preview.n} />
          <Stat label="Giá trị" value={fmtTy(preview.value)} />
          <Stat label="Đã thu" value={fmtTy(preview.paid)} tone="text-brand-500" />
          <Stat label="Còn phải thu" value={fmtTy(preview.os)} tone="text-accent" />
        </div>

        {!preview.n && (
          <p className="rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
            Không có dòng nào khớp bộ lọc — Sếp nới lỏng điều kiện giúp em.
          </p>
        )}
        {err && <p className="rounded-lg bg-danger/10 p-2.5 text-xs text-danger">{err}</p>}
      </div>
    </Modal>
  );
}

const INP =
  "w-full rounded-lg border border-line bg-page/40 px-3 py-2 text-sm text-ink outline-none focus:border-brand-400";

function Box({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-sub">
        <Icon size={14} className="text-brand-500" /> {title}
      </div>
      {children}
    </div>
  );
}

function L({ label, children }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase text-faint">{label}</div>
      {children}
    </div>
  );
}

function Row({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-hover"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
          on ? "border-brand-500 bg-brand-500 text-white" : "border-line text-transparent"
        }`}
      >
        ✓
      </span>
      <span className="truncate text-ink">{label}</span>
    </button>
  );
}

function Chk({ on, set, label, tone }) {
  const active =
    tone === "danger" ? "bg-danger text-white" : tone === "warning" ? "bg-warning text-white" : "bg-brand-500 text-white";
  return (
    <button
      onClick={() => set(!on)}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
        on ? active : "border border-line text-sub hover:bg-hover"
      }`}
    >
      {label}
    </button>
  );
}

function Mini({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-sub hover:bg-hover"
    >
      {children}
    </button>
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
