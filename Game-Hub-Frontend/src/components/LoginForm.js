// src/components/LoginForm.js
import { useState } from "react";
import { login } from "../api/auth";
import { useUser } from "../context/UserContext";

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser(); // ✅ bring user context

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(email, password);
      const { token, user } = res.data;

      localStorage.setItem("token", token); // store token
      setUser(user); // ✅ set user in context (includes isAdmin)

      onLogin(); // navigate after login
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;
