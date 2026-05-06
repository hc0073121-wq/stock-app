import { useEffect, useState } from "react";

export default function StockDashboard() {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortMode, setSortMode] = useState("name");
  const [editIndex, setEditIndex] = useState(null);

  const [form, setForm] = useState({
    category: "기본",
    name: "",
    buyPrice: "",
    quantity: "",
    currentPrice: "",
  });

  // ✅ 안전 로딩 (Astro 핵심)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("stocks");
      if (saved) setStocks(JSON.parse(saved) || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 💾 저장
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("stocks", JSON.stringify(stocks));
  }, [stocks]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ➕ 추가 / 수정 (안정형)
  const saveStock = () => {
    if (!form.name.trim()) return;

    const record = {
      buyPrice: Number(form.buyPrice || 0),
      quantity: Number(form.quantity || 0),
      currentPrice: Number(form.currentPrice || 0),
      date: new Date().toISOString(),
    };

    const newItem = {
      id: Date.now(),
      category: form.category || "기본",
      name: form.name,
      history: [record],
    };

    if (editIndex !== null) {
      const copy = [...stocks];
      const target = copy[editIndex];

      copy[editIndex] = {
        ...target,
        category: form.category,
        name: form.name,
        history: [...(target?.history || []), record],
      };

      setStocks(copy);
      setEditIndex(null);
    } else {
      setStocks([...stocks, newItem]);
    }

    setForm({
      category: "기본",
      name: "",
      buyPrice: "",
      quantity: "",
      currentPrice: "",
    });
  };

  // ✏️ 수정 시작
  const startEdit = (stock, index) => {
    const last = stock?.history?.at(-1) || {};

    setForm({
      category: stock.category || "기본",
      name: stock.name || "",
      buyPrice: last.buyPrice || "",
      quantity: last.quantity || "",
      currentPrice: last.currentPrice || "",
    });

    setEditIndex(index);
  };

  // 🗑 삭제
  const deleteStock = (index) => {
    const copy = [...stocks];
    copy.splice(index, 1);
    setStocks(copy);
  };

  // 📊 계산
  const calc = (s) => {
    const last = s?.history?.at(-1);

    if (!last) return { invest: 0, current: 0, profit: 0 };

    const invest = last.buyPrice * last.quantity;
    const current = last.currentPrice * last.quantity;

    return {
      invest,
      current,
      profit: current - invest,
    };
  };

  // 🔍 필터 + 검색
  let filtered = stocks.filter((s) => {
    const matchSearch = s.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchCategory =
      selectedCategory ? s.category === selectedCategory : true;

    return matchSearch && matchCategory;
  });

  // ↕ 정렬
  filtered = [...filtered].sort((a, b) => {
    if (sortMode === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortMode === "profit") {
      return calc(b).profit - calc(a).profit;
    }

    return 0;
  });

  const categories = [...new Set(stocks.map((s) => s.category))];

  return (
    <div className="wrap">
      <h1>나의 주식, 한눈에 보기!</h1>

      {/* 입력 */}
      <div className="card">
        <input name="category" value={form.category} onChange={handleChange} placeholder="카테고리" />
        <input name="name" value={form.name} onChange={handleChange} placeholder="종목명" />
        <input name="buyPrice" value={form.buyPrice} onChange={handleChange} placeholder="매입가" />
        <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="수량" />
        <input name="currentPrice" value={form.currentPrice} onChange={handleChange} placeholder="현재가" />

        <button onClick={saveStock}>
          {editIndex !== null ? "수정" : "추가"}
        </button>
      </div>

      {/* 검색 + 정렬 */}
      <div className="card row">
        <input
          placeholder="🔍 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={() => setSortMode("name")}>이름순</button>
        <button onClick={() => setSortMode("profit")}>수익순</button>
      </div>

      {/* 카테고리 */}
      <div className="card row">
        <button onClick={() => setSelectedCategory("")}>전체</button>

        {categories.map((c) => (
          <button key={c} onClick={() => setSelectedCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="card">
        <h3>📌 종목</h3>

        {filtered.map((s, i) => {
          const c = calc(s);

          return (
            <div key={i} className="item">
              <div>
                <b>{s.name}</b> ({s.category})
              </div>

              <div>
                매입 {c.invest.toLocaleString()} / 현재 {c.current.toLocaleString()}
              </div>

              <div style={{ color: c.profit >= 0 ? "red" : "blue" }}>
                손익 {c.profit.toLocaleString()}
              </div>

              <div className="btns">
                <button onClick={() => startEdit(s, i)}>수정</button>
                <button onClick={() => deleteStock(i)}>삭제</button>
              </div>

              {/* 📜 히스토리 */}
              <details>
                <summary>과거 기록</summary>

                {(s.history || []).map((h, idx) => (
                  <div key={idx} className="history">
                    {h.date?.slice(0, 10)} |
                    매입:{h.buyPrice} |
                    수량:{h.quantity} |
                    현재:{h.currentPrice}
                  </div>
                ))}
              </details>
            </div>
          );
        })}
      </div>

      {/* 스타일 */}
      <style>{`
        .wrap{
          padding:24px;
          background:#f8fafc;
          font-family:system-ui;
          min-height:100vh;
        }

        h1{font-size:28px;margin-bottom:20px}

        .card{
          background:white;
          padding:16px;
          border-radius:12px;
          margin-bottom:16px;
          box-shadow:0 4px 10px rgba(0,0,0,0.06);
        }

        input{
          padding:8px;
          margin:6px;
          border:1px solid #e5e7eb;
          border-radius:8px;
        }

        button{
          margin:4px;
          padding:6px 10px;
          border:none;
          border-radius:8px;
          background:#2563eb;
          color:white;
          cursor:pointer;
        }

        .row{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }

        .item{
          border-top:1px solid #eee;
          padding:10px 0;
        }

        .history{
          font-size:14px;
          background:#f1f5f9;
          padding:6px;
          border-radius:8px;
          margin-top:6px;
        }
      `}</style>
    </div>
  );
}