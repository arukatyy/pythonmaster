import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Shield, Lock, User } from "lucide-react";

export function AdminLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (login === "admin" && password === "123") {
      localStorage.setItem("admin-authenticated", "true");
      setError("");
      navigate("/admin", { replace: true });
      return;
    }

    setError("Логин немесе пароль қате. Логин: admin, пароль: 123");
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Админ ретінде кіру</h1>
          <p className="mt-1 text-sm text-muted-foreground">Админ панельге кіру үшін логин мен пароль енгізіңіз</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Логин</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                placeholder="admin"
                className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 outline-none transition-colors focus:border-primary"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Пароль</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="123"
                className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 outline-none transition-colors focus:border-primary"
              />
            </div>
          </label>

          {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Кіру
          </button>
        </form>
      </div>
    </div>
  );
}
