import { useEffect, useState } from "react";
import { Link2, ExternalLink, Pencil } from "lucide-react";
import api from "../lib/data";
import Modal, { Field, Input, Btn } from "../components/Modal";
import { useAuth } from "../context/AuthContext";

/* Trang Mã liên kết — lưu link hồ sơ (Drive/Cloud) cho từng công trình */
export default function Links() {
  const { canEdit } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // contract đang sửa link
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setContracts(await api.listContracts());
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, []);

  function openEdit(c) {
    setEditing(c);
    setUrl(c.linkHoSo || "");
  }

  async function save() {
    let v = url.trim();
    if (v && !/^https?:\/\//i.test(v)) v = "https://" + v;
    setSaving(true);
    await api.updateContract(editing.id, { linkHoSo: v });
    setSaving(false);
    setEditing(null);
    reload();
  }

  if (loading) return <div className="py-20 text-center text-faint">Đang tải…</div>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm text-sub">
        <Link2 size={16} className="text-brand-500" />
        Lưu đường dẫn hồ sơ (Google Drive, OneDrive…) cho từng công trình — cả công ty
        bấm là mở đúng thư mục.
      </div>

      {/* Card List — điện thoại */}
      <div className="space-y-3 md:hidden">
        {contracts.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-card p-4 shadow-card">
            <div className="font-semibold text-ink">{c.name}</div>
            <div className="mt-0.5 truncate text-xs text-faint">{c.customerName}</div>
            <div className="mt-3 flex gap-2">
              {c.linkHoSo ? (
                <a
                  href={c.linkHoSo}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-sm font-medium text-white"
                >
                  <ExternalLink size={15} /> Mở hồ sơ
                </a>
              ) : (
                <span className="flex h-10 flex-1 items-center justify-center rounded-lg border border-dashed border-line text-sm text-faint">
                  Chưa có link
                </span>
              )}
              {canEdit && (
                <button
                  onClick={() => openEdit(c)}
                  className="flex h-10 w-12 items-center justify-center rounded-lg border border-line text-sub"
                  aria-label="Sửa link"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bảng — desktop/tablet */}
      <div className="hidden rounded-xl border border-line bg-card shadow-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="h-12 border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-3 py-3 font-medium">Công trình</th>
                <th className="px-3 py-3 font-medium">Chủ đầu tư</th>
                <th className="px-3 py-3 font-medium">Link hồ sơ</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-hover">
                  <td className="px-3 py-3 font-semibold text-ink">{c.name}</td>
                  <td className="px-3 py-3 text-sub">{c.customerName}</td>
                  <td className="max-w-md px-3 py-3">
                    {c.linkHoSo ? (
                      <a
                        href={c.linkHoSo}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline"
                      >
                        <ExternalLink size={14} />
                        <span className="truncate">{c.linkHoSo}</span>
                      </a>
                    ) : (
                      <span className="italic text-faint">Chưa có link</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {canEdit && (
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded-lg p-2 text-faint hover:bg-hover hover:text-brand-500"
                        aria-label="Sửa link"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal sửa link */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Link hồ sơ — ${editing?.name || ""}`}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setEditing(null)}>
              Hủy
            </Btn>
            <Btn onClick={save} disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Btn>
          </>
        }
      >
        <Field label="Đường dẫn hồ sơ (Google Drive, OneDrive…)" hint="Để trống rồi Lưu nếu muốn xóa link">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/..."
            autoFocus
          />
        </Field>
      </Modal>
    </div>
  );
}
