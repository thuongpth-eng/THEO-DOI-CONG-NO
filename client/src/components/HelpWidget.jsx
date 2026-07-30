import { useEffect, useState } from "react";
import {
  MessageCircleQuestion,
  X,
  Send,
  ChevronDown,
  CheckCircle2,
  Trash2,
  Lightbulb,
  HelpCircle,
} from "lucide-react";
import api from "../lib/data";
import { useAuth } from "../context/AuthContext";

const nowISO = () => new Date().toISOString();

// Hỏi đáp nhanh: câu hỏi hay gặp khi dùng app
const FAQ = [
  {
    q: "Sửa số liệu 1 đợt ở đâu?",
    a: "Theo dõi công nợ → tab Chi tiết → bấm ✏️ trên dòng đợt. Sửa xong bấm Lưu. Mọi thay đổi được ghi vào Lịch sử thay đổi ngay trong form đợt đó, và Dashboard / Tổng quan / Excel tự cập nhật theo.",
  },
  {
    q: "Sửa hoặc xóa cả hợp đồng?",
    a: "Tab Chi tiết → góc phải dòng tiêu đề hợp đồng có ✏️ (sửa thông tin) và 🗑️ (xóa). Xóa hợp đồng sẽ xóa kèm toàn bộ đợt của nó và app sẽ hỏi xác nhận trước.",
  },
  {
    q: "Úp file công nợ vào app thế nào?",
    a: "Tab Chi tiết → nút “Úp file công nợ (đồng bộ)”. Hợp đồng/đợt đã có sẽ được CẬP NHẬT, chưa có sẽ THÊM MỚI, không xóa dữ liệu cũ. File phải là file công nợ theo mẫu app xuất ra (có sheet DANH SÁCH CÔNG TRÌNH + mỗi công trình 1 sheet).",
  },
  {
    q: "Thêm hợp đồng mới mà có sẵn file công nợ?",
    a: "Bấm “Thêm hợp đồng / phụ lục” → khung xanh trên cùng chọn file Excel → chọn công trình trong ô danh sách → app tự điền thông tin và tạo sẵn các đợt → kiểm tra rồi bấm Lưu.",
  },
  {
    q: "Xuất dữ liệu theo tháng / chủ đầu tư / quá hạn?",
    a: "Bấm “Xuất dữ liệu” trên thanh công cụ. Chọn khoảng tháng, chủ đầu tư, công trình, lọc quá hạn hoặc đến hạn, tích các cột cần lấy rồi bấm Xuất Excel.",
  },
  {
    q: "Đính kèm hồ sơ (PDF/Excel/ảnh) cho 1 đợt?",
    a: "Kho lưu trữ hợp đồng → mở hợp đồng → sửa đợt → phần Hồ sơ đính kèm: bấm “Úp file” (≤500KB) hoặc “+ Thêm link” để dán link Google Drive.",
  },
  {
    q: "Không thấy thay đổi mới sau khi app được cập nhật?",
    a: "Nhấn Ctrl + F5 (Windows) để tải lại trang bỏ qua bộ nhớ đệm của trình duyệt.",
  },
];

export default function HelpWidget() {
  const { user, roleName, isAdmin } = useAuth();
  // Người quản lý góp ý: TGĐ/PTGĐ + kế toán (người vận hành app)
  const quanLy = isAdmin || user?.role === "kt";
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("faq"); // faq | gopy
  const [expand, setExpand] = useState(-1);
  const [text, setText] = useState("");
  const [loai, setLoai] = useState("Góp ý");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [list, setList] = useState([]);

  // Admin xem danh sách góp ý đã gửi
  useEffect(() => {
    if (open && quanLy && tab === "gopy") {
      api.listFeedback?.().then(setList).catch(() => setList([]));
    }
  }, [open, quanLy, tab, sent]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      await api.addFeedback({
        loai,
        noidung: t,
        by: user?.name || "",
        role: roleName || "",
        ts: nowISO(),
      });
      setText("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (e) {
      alert("Không gửi được góp ý: " + (e?.message || e));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Nút nổi góc phải */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Hỏi đáp nhanh & Góp ý"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-transform hover:scale-105 hover:bg-brand-600"
        >
          <MessageCircleQuestion size={26} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex max-h-[80vh] w-[min(94vw,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
          <div className="flex items-center justify-between bg-brand-500 px-4 py-3 text-white">
            <div className="text-sm font-bold uppercase tracking-wide">Trợ giúp nhanh</div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/20">
              <X size={18} />
            </button>
          </div>

          <div className="flex border-b border-line">
            <TabBtn active={tab === "faq"} onClick={() => setTab("faq")} icon={HelpCircle}>
              Hỏi đáp nhanh
            </TabBtn>
            <TabBtn active={tab === "gopy"} onClick={() => setTab("gopy")} icon={Lightbulb}>
              Góp ý
            </TabBtn>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {tab === "faq" && (
              <div className="space-y-1.5">
                {FAQ.map((f, i) => (
                  <div key={i} className="rounded-lg border border-line">
                    <button
                      onClick={() => setExpand(expand === i ? -1 : i)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold text-ink hover:bg-hover"
                    >
                      {f.q}
                      <ChevronDown
                        size={14}
                        className={`shrink-0 text-faint transition-transform ${
                          expand === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {expand === i && (
                      <div className="border-t border-line px-3 py-2 text-xs leading-relaxed text-sub">
                        {f.a}
                      </div>
                    )}
                  </div>
                ))}
                <p className="pt-1 text-[11px] italic text-faint">
                  Không có câu trả lời Sếp cần? Gửi ở tab “Góp ý”.
                </p>
              </div>
            )}

            {tab === "gopy" && (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {["Góp ý", "Báo lỗi", "Đề xuất thêm"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLoai(l)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        loai === l
                          ? "bg-brand-500 text-white"
                          : "border border-line text-sub hover:bg-hover"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder="Sếp cần app làm gì thêm, hoặc chỗ nào chưa đúng?"
                  className="w-full rounded-lg border border-line bg-page/40 px-3 py-2 text-xs text-ink outline-none focus:border-brand-400"
                />
                <button
                  onClick={send}
                  disabled={sending || !text.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  <Send size={14} /> {sending ? "Đang gửi…" : "Gửi"}
                </button>
                {sent && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-3 py-2 text-xs font-medium text-brand-600">
                    <CheckCircle2 size={14} /> Đã gửi, cảm ơn Sếp!
                  </div>
                )}

                {quanLy && (
                  <div className="pt-2">
                    <div className="mb-1 text-[11px] font-semibold uppercase text-faint">
                      Góp ý đã nhận ({list.length})
                    </div>
                    <div className="max-h-48 space-y-1.5 overflow-auto">
                      {list.length === 0 && (
                        <p className="text-[11px] italic text-faint">Chưa có góp ý nào.</p>
                      )}
                      {list.map((f) => (
                        <div key={f.id} className="rounded-lg border border-line px-2.5 py-1.5 text-[11px]">
                          <div className="flex items-center justify-between text-faint">
                            <span className="font-semibold text-accent">{f.loai}</span>
                            <div className="flex items-center gap-1.5">
                              <span>{(f.ts || "").slice(0, 10)}</span>
                              <button
                                onClick={async () => {
                                  await api.deleteFeedback?.(f.id);
                                  setList((p) => p.filter((x) => x.id !== f.id));
                                }}
                                className="text-faint hover:text-danger"
                                title="Xóa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <div className="text-ink">{f.noidung}</div>
                          {f.by && <div className="text-faint">— {f.by}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold ${
        active ? "border-b-2 border-brand-500 text-brand-600" : "text-faint hover:text-sub"
      }`}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}
