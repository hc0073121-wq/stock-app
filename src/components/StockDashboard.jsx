import { useEffect, useState } from "react";

import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import StockLogin from "./StockLogin";

export default function StockDashboard() {
  const [user, setUser] = useState(null);
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

  // 🔐 로그인 상태 감지
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadData(u.uid);
    });

    return () => unsub();
  }, []);

  // 📥 Firestore 불러오기
  const loadData = async (uid) => {
    const q = query(collection(db, "stocks"), where("userId", "==", uid));
    const snap = await getDocs(q);

    const data = snap.docs.map((d) => d.data());

    setStocks(data[0]?.data || []);
  };

  // 💾 Firestore 저장
  const saveToDB = async (newStocks) => {
    if (!user) return;

    await addDoc(collection(db, "stocks"), {
      userId: user.uid,
      data: newStocks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ➕ 추가 / 수정
  const saveStock = async () => {
    if (!form.name.trim()) return;

    const record = {
      buyPrice: Number(form.buyPrice || 0),
      quantity: Number(form.quantity || 0),
      currentPrice: Number(form.currentPrice || 0),
      date: new Date().toISOString(),
    };

    let updated;

    if (editIndex !== null) {
      updated = [...stocks];

      updated[editIndex] = {
        ...updated[editIndex],
        category: form.category,
        name: form.name,
        history: [...(updated[editIndex].history || []), record],
      };

      setEditIndex(null);
    } else {
      updated = [
        ...stocks,
        {
          id: Date.now(),
          category: form.category,
          name: form.name,
          history: [record],
        },
      ];
    }

    setStocks(updated);
    await saveToDB(updated);

    setForm({
      category: "기본",
      name: "",
      buyPrice: "",
      quantity: "",
      currentPrice: "",
    });
  };

  // ✏️ 수정
  const startEdit = (stock, index) => {
    const last = stock?.history?.at(-1) || {};

    setForm({
      category: stock.category,
      name: stock.name,
      buyPrice: last.buyPrice || "",
      quantity: last.quantity || "",
      currentPrice: last.currentPrice || "",
    });

    setEditIndex(index);
  };

  // 🗑 삭제
  const deleteStock = async (index) => {
    const updated = [...stocks];
    updated.splice(index, 1);

    setStocks(updated);
    await saveToDB(updated);
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

  // 🔐 로그인 안 했으면 로그인 화면
  if (!user) return <StockLogin />;

  return (
    <div className="wrap">
      <h1>📊 주식 포트폴리오</h1>
      <p>로그인: {user.email}</p>

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
              <b>{s.name}</b> ({s.category})

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

              <details>
                <summary>과거 기록</summary>

                {(s.history || []).map((h, idx) => (
                  <div key={idx} className="history">
                    {h.date?.slice(0, 10)} |
                    {h.buyPrice} / {h.quantity} / {h.currentPrice}
                  </div>
                ))}
              </details>
            </div>
          );
        })}
      </div>

      <style>{`
        .wrap{padding:24px;background:#f8fafc;font-family:system-ui}
        .card{background:white;padding:16px;border-radius:12px;margin-bottom:16px}
        input{padding:8px;margin:6px;border:1px solid #ddd;border-radius:8px}
        button{margin:4px;padding:6px 10px;background:#2563eb;color:white;border:none;border-radius:8px}
        .row{display:flex;gap:8px;flex-wrap:wrap}
        .item{border-top:1px solid #eee;padding:10px 0}
        .history{font-size:14px;background:#f1f5f9;padding:6px;margin-top:6px;border-radius:6px}
      `}</style>
    </div>
  );
}