import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { CourseDetail } from "./components/CourseDetail";
import { Registration } from "./components/Registration";
import { AdminDashboard } from "./components/AdminDashboard";
import { UserProfile } from "./components/UserProfile";
import { AdminLogin } from "./components/AdminLogin";
import { CoursesCatalog } from "./components/CoursesCatalog";

function ProtectedProfileRoute() {
  const currentUser = localStorage.getItem("currentUser");

  if (!currentUser) {
    return <Navigate to="/register" replace />;
  }

  return <UserProfile />;
}

function ProtectedAdminRoute() {
  const isAdminAuthenticated = localStorage.getItem("admin-authenticated") === "true";

  if (!isAdminAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "courses", Component: CoursesCatalog },
      { path: "course/:id", Component: CourseDetail },
      { path: "register", Component: Registration },
      { path: "admin", Component: ProtectedAdminRoute },
      { path: "profile", Component: ProtectedProfileRoute },
    ],
  },
]);
