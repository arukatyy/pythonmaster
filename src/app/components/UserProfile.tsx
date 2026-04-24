import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  User,
  Camera,
  Settings,
  LogOut,
  BookOpen,
  Clock3,
  Trophy,
  Sparkles,
  ShieldCheck,
  Star,
} from "lucide-react";
import { getAllCourses } from "../data/courses";
import { getEnrollments, type EnrollmentItem } from "../data/appState";

type StoredUser = {
  id?: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
};

function formatActivityTitle(title?: string) {
  if (!title) return "Class inheritance";
  return title.length > 28 ? `${title.slice(0, 28)}...` : title;
}

export function UserProfile() {
  const navigate = useNavigate();
  const [currentUserName, setCurrentUserName] = useState("Арман С.");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as StoredUser;
      if (parsedUser.fullName?.trim()) {
        const nameParts = parsedUser.fullName.trim().split(" ");
        const formattedName =
          nameParts.length > 1
            ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
            : parsedUser.fullName.trim();
        setCurrentUserName(formattedName);
      }
      if (parsedUser.avatarUrl) {
        setAvatarUrl(parsedUser.avatarUrl);
      }
    }

    const syncEnrollments = () => {
      setEnrollments(getEnrollments());
    };

    syncEnrollments();
    window.addEventListener("enrollments-updated", syncEnrollments);
    window.addEventListener("storage", syncEnrollments);

    return () => {
      window.removeEventListener("enrollments-updated", syncEnrollments);
      window.removeEventListener("storage", syncEnrollments);
    };
  }, []);

  const courses = useMemo(() => getAllCourses(), []);
  const activeEnrollment = enrollments[0] ?? null;
  const activeCourse = courses.find((course) => course.id === activeEnrollment?.courseId) ?? null;
  const mainCourseTitle = activeEnrollment?.title ?? "Python: Негіздері";
  const mainCourseProgress = activeEnrollment?.progress ?? 85;
  const lastActiveLesson = formatActivityTitle(
    activeCourse?.syllabus.flatMap((week) => week.lessons)[activeEnrollment?.currentLessonIndex ?? 0],
  );
  const completedTasks = activeEnrollment
    ? Math.min(activeEnrollment.currentLessonIndex + 1, 12)
    : 12;
  const xpPoints = 1250 + enrollments.length * 25;
  const levelValue = 12;

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const nextAvatar = typeof fileReader.result === "string" ? fileReader.result : null;
      setAvatarUrl(nextAvatar);
      const currentUser = JSON.parse(localStorage.getItem("currentUser") ?? "{}") as StoredUser;
      localStorage.setItem("currentUser", JSON.stringify({ ...currentUser, avatarUrl: nextAvatar }));
    };
    fileReader.readAsDataURL(file);
  };

  const handleProfileLogout = () => {
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new Event("storage"));
    navigate("/register", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1a3429_0%,#0f1714_45%,#090c0b_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold tracking-tight">Профиль бөлімі</h1>
          <p className="mt-2 text-sm text-white/60">Оқу барысыңыз, жетістіктеріңіз және аккаунт баптаулары бір жерде.</p>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[#7dffb3]/40 bg-gradient-to-br from-[#7dffb3] via-[#43d98d] to-[#0ea5a3]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={currentUserName} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-14 w-14 text-[#0e1613]" />
                  )}
                </div>
                <label className="absolute -bottom-1 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#111917] text-[#7dffb3] shadow-lg">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              </div>
              <h2 className="text-2xl font-bold">{currentUserName}</h2>
              <p className="mt-1 text-sm text-[#9fe7bf]">Python Student</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[#0e1512] p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.22em] text-white/40">Бүйірлік мәзір</div>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                  >
                    <BookOpen className="h-4 w-4 text-[#7dffb3]" />
                    Курстар
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                  >
                    <Settings className="h-4 w-4 text-[#7dffb3]" />
                    Баптаулар
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileLogout}
                    className="flex w-full items-center gap-3 rounded-xl bg-[#173126] px-4 py-3 text-left text-sm font-semibold text-[#c7ffe0] transition-colors hover:bg-[#1d3a2d]"
                  >
                    <LogOut className="h-4 w-4 text-[#7dffb3]" />
                    Шығу
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(125,255,179,0.14),rgba(14,165,163,0.08))] p-6">
              <div className="mb-3 text-xs uppercase tracking-[0.22em] text-white/45">Орталық блок</div>
              <h2 className="text-2xl font-bold">Негізгі ақпарат</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/65">
                Профильде сіздің негізгі курсыңыз, соңғы белсенділігіңіз, жетістіктеріңіз және келесі сабақ туралы қысқаша мәлімет көрсетіледі.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
                <div className="mb-2 flex items-center gap-2 text-[#9fe7bf]">
                  <BookOpen className="h-5 w-5" />
                  <span className="text-sm font-semibold">Курстар</span>
                </div>
                <div className="text-xl font-bold">"{mainCourseTitle}" ({mainCourseProgress}%)</div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7dffb3] to-[#17c7b7]" style={{ width: `${mainCourseProgress}%` }} />
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
                <div className="mb-2 flex items-center gap-2 text-[#9fe7bf]">
                  <Clock3 className="h-5 w-5" />
                  <span className="text-sm font-semibold">Соңғы белсенділік</span>
                </div>
                <div className="text-xl font-bold">"{lastActiveLesson}"</div>
                <p className="mt-2 text-sm text-white/55">Соңғы ашылған тақырып автоматты түрде курстан алынады.</p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
                <div className="mb-2 flex items-center gap-2 text-[#9fe7bf]">
                  <Trophy className="h-5 w-5" />
                  <span className="text-sm font-semibold">Жетістіктер</span>
                </div>
                <div className="text-2xl">🏆 🏆 🏅</div>
                <p className="mt-2 text-sm text-white/55">Практика мен үздіксіз оқу үшін берілген марапаттар.</p>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
                <div className="mb-2 flex items-center gap-2 text-[#9fe7bf]">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-semibold">Келесі сабақ</span>
                </div>
                <div className="text-xl font-bold">Ертең сағат 19:00</div>
                <p className="mt-2 text-sm text-white/55">Күнтізбе бойынша келесі ұсынылған оқу уақыты.</p>
              </div>
            </div>
          </motion.main>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <div className="mb-2 text-xs uppercase tracking-[0.22em] text-white/40">Оң жақ блок</div>
            <h2 className="text-2xl font-bold">Статистика</h2>

            <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
              <div className="mb-2 flex items-center gap-2 text-[#9fe7bf]">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-semibold">Деңгей</span>
              </div>
              <div className="text-xl font-bold">Python Ninja (Lv. {levelValue})</div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
              <div className="mb-2 flex items-center gap-2 text-[#9fe7bf]">
                <Star className="h-5 w-5" />
                <span className="text-sm font-semibold">Ұпайлар</span>
              </div>
              <div className="text-xl font-bold">{xpPoints} XP</div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
              <div className="mb-2 text-sm font-semibold text-[#9fe7bf]">Тапсырмалар</div>
              <div className="text-xl font-bold">{completedTasks}/15 бітті</div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#0d1411] p-5">
              <div className="mb-2 text-sm font-semibold text-[#9fe7bf]">Төсбелгілер</div>
              <div className="text-xl font-bold">"Clean Code Master"</div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
