import { useState } from "react";
import { auth } from "../lib/firebase";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function StockLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("login"); // login / signup

  // 🔐 로그인
  const login = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pw);
      onLogin(res.user);
    } catch (e) {
      alert("로그인 실패");
    }
  };

  // 🆕 회원가입
  const signup = async () => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pw);
      onLogin(res.user);
    } catch (e) {
      alert("회원가입 실패 (이미 존재하거나 비밀번호 짧음)");
    }
  };

  return (
    <div style={styles.wrap}>
      <h2>📊 Stock App</h2>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="password (6자리 이상)"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />

      {mode === "login" ? (
        <button onClick={login}>로그인</button>
      ) : (
        <button onClick={signup}>회원가입</button>
      )}

      <p
        style={{ cursor: "pointer", color: "blue" }}
        onClick={() =>
          setMode(mode === "login" ? "signup" : "login")
        }
      >
        {mode === "login"
          ? "👉 회원가입으로 이동"
          : "👉 로그인으로 이동"}
      </p>
    </div>
  );
}

const styles = {
  wrap: {
    padding: 20,
    maxWidth: 300,
    margin: "0 auto",
    textAlign: "center",
  },
};