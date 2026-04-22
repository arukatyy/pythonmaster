import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { Code2, Home, BookOpen, UserCircle, LayoutDashboard, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { getAdminSettings } from "../data/appState";

export function Layout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";
  const [hasCurrentUser, setHasCurrentUser] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const syncCurrentUser = () => {
      setHasCurrentUser(Boolean(localStorage.getItem("currentUser")));
    };

    syncCurrentUser();
    window.addEventListener("storage", syncCurrentUser);

    return () => {
      window.removeEventListener("storage", syncCurrentUser);
    };
  }, []);

  useEffect(() => {
    setHasCurrentUser(Boolean(localStorage.getItem("currentUser")));
    setMaintenanceMode(getAdminSettings().maintenanceMode);
  }, [location.pathname]);

  useEffect(() => {
    const syncSettings = () => setMaintenanceMode(getAdminSettings().maintenanceMode);
    syncSettings();
    window.addEventListener("admin-settings-updated", syncSettings);
    return () => window.removeEventListener("admin-settings-updated", syncSettings);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {maintenanceMode && (
        <div className="bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
          Maintenance mode қосулы. Кейбір функциялар уақытша шектелуі мүмкін.
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <nav className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="group flex items-center gap-3">
              <div className="relative">
                <Code2 className="h-8 w-8 text-primary" />
                <div className="absolute inset-0 bg-primary opacity-30 blur-xl transition-opacity group-hover:opacity-50" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                Python<span className="text-primary">Master</span>
              </span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              <Link
                to="/"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                  isActive("/") && location.pathname === "/"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Басты бет</span>
              </Link>

              <Link
                to="/courses"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                  isActive("/courses") || isActive("/course")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span>Курстар</span>
              </Link>

              {hasCurrentUser && (
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                    isActive("/profile")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <UserCircle className="h-4 w-4" />
                  <span>Профиль</span>
                </Link>
              )}

              <Link
                to="/admin"
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
                  isActive("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Админ</span>
              </Link>

              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:text-primary"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{isDark ? "Light mode" : "Dark mode"}</span>
              </button>

              {!hasCurrentUser && (
                <Link
                  to="/register"
                  className="group relative overflow-hidden rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  <span className="relative z-10">Тіркелу</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-20 border-t border-border bg-background/80">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Code2 className="h-6 w-6 text-primary" />
                <span className="font-bold">PythonMaster</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Қазақстандағы ең үздік Python оқыту платформасы
              </p>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Курстар</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/course/python-basics" className="transition-colors hover:text-primary">Python Basics</Link></li>
                <li><Link to="/course/data-science" className="transition-colors hover:text-primary">Data Science</Link></li>
                <li><Link to="/course/web-dev" className="transition-colors hover:text-primary">Web Development</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Компания</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="transition-colors hover:text-primary">Біз туралы</a></li>
                <li><a href="#" className="transition-colors hover:text-primary">Байланыс</a></li>
                <li><a href="#" className="transition-colors hover:text-primary">Блог</a></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold">Қолдау</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="transition-colors hover:text-primary">FAQ</a></li>
                <li><a href="#" className="transition-colors hover:text-primary">Көмек орталығы</a></li>
                <li><a href="#" className="transition-colors hover:text-primary">Байланыс</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            © 2026 PythonMaster. Барлық құқықтар қорғалған.
          </div>
        </div>
      </footer>
    </div>
  );
}
