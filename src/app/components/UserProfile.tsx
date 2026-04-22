import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  User,
  BookOpen,
  Award,
  TrendingUp,
  Mail,
  Camera,
  CheckCircle2,
  Play,
  Lock,
  Download,
  Star,
  Calendar,
  Target,
  Bell,
  Heart,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { getAllCourses } from "../data/courses";
import { getEnrollments, updateEnrollmentProgress, type EnrollmentItem } from "../data/appState";
import { updateUserPassword } from "../data/usersApi";

type LessonView = {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  videoUrl: string;
};

const achievements = [
  { icon: Award, title: "Алғашқы сабақ", earned: true },
  { icon: Target, title: "50% аяқталды", earned: true },
  { icon: TrendingUp, title: "7 күн қатарынан", earned: true },
  { icon: Star, title: "Үздік студент", earned: false },
];

type StoredUser = {
  id?: number;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
};

export function UserProfile() {
  const navigate = useNavigate();
  const [currentUserName, setCurrentUserName] = useState("Асхат");
  const [currentUserEmail, setCurrentUserEmail] = useState("student@pythonmaster.kz");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const playerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as StoredUser;
      if (parsedUser.fullName) {
        setCurrentUserName(parsedUser.fullName);
      }
      if (parsedUser.email) {
        setCurrentUserEmail(parsedUser.email);
      }
      if (parsedUser.avatarUrl) {
        setAvatarUrl(parsedUser.avatarUrl);
      }
    }

    const syncEnrollments = () => {
      const next = getEnrollments();
      setEnrollments(next);
      if (!selectedCourseId && next[0]) {
        setSelectedCourseId(next[0].courseId);
        setSelectedLessonIndex(next[0].currentLessonIndex);
      }
    };

    syncEnrollments();
    window.addEventListener("enrollments-updated", syncEnrollments);
    window.addEventListener("storage", syncEnrollments);

    return () => {
      window.removeEventListener("enrollments-updated", syncEnrollments);
      window.removeEventListener("storage", syncEnrollments);
    };
  }, [selectedCourseId]);

  const courses = useMemo(() => getAllCourses(), []);

  const activeEnrollment = enrollments.find((item) => item.courseId === selectedCourseId) ?? enrollments[0] ?? null;
  const activeCourse = courses.find((course) => course.id === activeEnrollment?.courseId) ?? null;

  const lessons = useMemo<LessonView[]>(() => {
    if (!activeCourse || !activeEnrollment) return [];

    return activeCourse.syllabus.flatMap((week, weekIndex) =>
      week.lessons.map((lesson, lessonIndex) => {
        const index = weekIndex * 100 + lessonIndex;
        const linearIndex = activeCourse.syllabus
          .slice(0, weekIndex)
          .reduce((sum, item) => sum + item.lessons.length, 0) + lessonIndex;

        return {
          id: `${activeCourse.id}-${index}`,
          title: `${week.week}: ${lesson}`,
          duration: `${12 + lessonIndex * 3}:00`,
          completed: linearIndex < activeEnrollment.currentLessonIndex,
          videoUrl: activeCourse.videoUrl,
        };
      }),
    );
  }, [activeCourse, activeEnrollment]);

  const selectedVideo = lessons[selectedLessonIndex] ?? lessons[0] ?? null;
  const completedLessons = activeEnrollment
    ? Math.min(activeEnrollment.currentLessonIndex, activeEnrollment.totalLessons)
    : 0;
  const completedCoursesCount = enrollments.filter((item) => item.progress >= 100).length;
  const testsTakenCount = enrollments.length * 4;
  const averageScore = enrollments.length > 0 ? Math.round(70 + enrollments.reduce((sum, item) => sum + item.progress, 0) / (enrollments.length * 5)) : 0;
  const certificates = enrollments.filter((item) => item.progress >= 100);
  const wishlistCourses = courses.filter((course) => !enrollments.some((enrollment) => enrollment.courseId === course.id)).slice(0, 3);
  const notificationItems = [
    { id: "notif-1", title: "Жаңа сабақ шықты", message: "Python Basics курсында 5-бөлім жарияланды." },
    { id: "notif-2", title: "Курс аяқталуға жақын", message: "Data Science курсын аяқтауға 2 сабақ қалды." },
  ];
  const reviewItems = enrollments.slice(0, 2).map((item) => ({
    id: item.courseId,
    courseTitle: item.title,
    rating: item.progress >= 80 ? 5 : 4,
    text: item.progress >= 80 ? "Материал өте түсінікті, практикалық тапсырмалар ұнады." : "Курс пайдалы, бірақ қосымша мысалдар болса жақсы болар еді.",
  }));

  const handleContinueCourse = (courseId: string, lessonIndex: number) => {
    setSelectedCourseId(courseId);
    setSelectedLessonIndex(lessonIndex);
    updateEnrollmentProgress(courseId, lessonIndex);
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSelectLesson = (lessonIndex: number) => {
    if (!activeEnrollment) return;
    setSelectedLessonIndex(lessonIndex);
    updateEnrollmentProgress(activeEnrollment.courseId, lessonIndex);
  };

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

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage("Пароль кемінде 6 символ болуы керек.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Парольдер сәйкес емес.");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser") ?? "{}") as StoredUser;
    if (!currentUser.id) {
      setPasswordMessage("Парольді жаңарту үшін қайта тіркеліп кіріңіз.");
      return;
    }

    try {
      await updateUserPassword(currentUser.id, newPassword);
      setPasswordMessage("Пароль серверде қауіпсіз жаңартылды.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage(error instanceof Error ? error.message : "Парольді жаңарту мүмкін болмады.");
    }
  };

  const handleDownloadCertificate = (courseTitle: string) => {
    const safeTitle = courseTitle.replace(/\s+/g, "_");
    const blob = new Blob(
      [
        `Certificate of Completion\n\nThis certifies that ${currentUserName} completed "${courseTitle}".\nDate: ${new Date().toLocaleDateString()}\n`,
      ],
      { type: "application/pdf" },
    );
    const fileUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = fileUrl;
    anchor.download = `${safeTitle}_certificate.pdf`;
    anchor.click();
    URL.revokeObjectURL(fileUrl);
  };

  const handleProfileLogout = () => {
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new Event("storage"));
    navigate("/register", { replace: true });
  };

  return (
    <div className="min-h-screen pb-20">
      <section className="bg-gradient-to-br from-[#0a0a0a] via-[#001a0f] to-[#0a0a0a] py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#00ff88] to-[#00ccff]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={currentUserName} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-black" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#1a1a1a] bg-[#111111]">
                <Camera className="h-4 w-4 text-[#00ff88]" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold md:text-4xl">Сәлем, {currentUserName}! 👋</h1>
              <p className="mb-2 text-gray-400">Сіздің оқу жолыңызды жалғастырыңыз</p>
              <p className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4 text-[#00ff88]" />
                Login: {currentUserEmail}
              </p>
              <button
                type="button"
                onClick={handleProfileLogout}
                className="rounded-lg border border-[#00ff88]/40 px-4 py-2 text-sm font-semibold text-[#00ff88] transition-colors hover:bg-[#00ff88]/10"
              >
                Шығу
              </button>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#00ff88]" />
                  <span className="text-sm">{enrollments.length} белсенді курс</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#00ff88]" />
                  <span className="text-sm">3 жетістік</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#00ff88]" />
                  <span className="text-sm">Прогресс бақылауда</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
                <div className="text-2xl font-bold text-[#00ff88]">{completedLessons}</div>
                <div className="text-xs text-gray-500">Аяқталған сабақтар</div>
              </div>
              <div className="rounded-xl border border-[#222222] bg-[#111111] p-4 text-center">
                <div className="text-2xl font-bold text-[#00ff88]">{activeEnrollment?.progress ?? 0}%</div>
                <div className="text-xs text-gray-500">Жалпы прогресс</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
                <User className="h-6 w-6 text-[#00ff88]" />
                Профиль ақпараты
              </h2>
              <div className="space-y-3 text-sm">
                <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3">
                  <span className="text-gray-400">Аты-жөні:</span>
                  <p className="mt-1 font-semibold">{currentUserName}</p>
                </div>
                <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3">
                  <span className="text-gray-400">Email / login:</span>
                  <p className="mt-1 font-semibold">{currentUserEmail}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold">
                <ShieldCheck className="h-6 w-6 text-[#00ff88]" />
                Пароль өзгерту
              </h2>
              <form className="space-y-3" onSubmit={handlePasswordChange}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Жаңа пароль"
                  className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-4 py-3 text-sm outline-none transition-colors focus:border-[#00ff88]"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Парольді қайталаңыз"
                  className="w-full rounded-lg border border-[#222222] bg-[#0a0a0a] px-4 py-3 text-sm outline-none transition-colors focus:border-[#00ff88]"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#00ff88] px-4 py-3 font-semibold text-black transition-all hover:bg-[#00ff88]/90"
                >
                  Сақтау
                </button>
                {passwordMessage && <p className="text-sm text-gray-400">{passwordMessage}</p>}
              </form>
            </div>
          </div>

          <h2 className="mb-6 text-2xl font-bold">Менің курстарым</h2>

          {enrollments.length === 0 ? (
            <div className="rounded-xl border border-[#222222] bg-[#111111] p-8 text-center text-gray-400">
              Сіз әлі курс сатып алмағансыз. Курс сатып алғаннан кейін осы жерде көрінеді.
            </div>
          ) : (
            <div className="mb-12 grid gap-6 md:grid-cols-2">
              {enrollments.map((course, index) => (
                <motion.div
                  key={course.courseId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group overflow-hidden rounded-xl border border-[#222222] bg-[#111111] transition-all hover:border-[#00ff88]/50"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent" />
                  </div>

                  <div className="p-6">
                    <h3 className="mb-2 text-xl font-bold">{course.title}</h3>
                    <p className="mb-4 text-sm text-gray-400">Оқытушы: {course.instructor}</p>

                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-gray-400">Прогресс</span>
                        <span className="font-bold text-[#00ff88]">{course.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#222222]">
                        <div className="h-full rounded-full bg-[#00ff88] transition-all" style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between text-sm text-gray-400">
                      <span>{Math.min(course.currentLessonIndex, course.totalLessons)} / {course.totalLessons} сабақ</span>
                      <span>Соңғы ашылғаны: {new Date(course.lastOpenedAt).toLocaleDateString()}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleContinueCourse(course.courseId, course.currentLessonIndex)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00ff88] px-4 py-3 font-semibold text-black transition-all hover:bg-[#00ff88]/90"
                    >
                      <Play className="h-4 w-4" />
                      Жалғастыру
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div ref={playerRef} className="overflow-hidden rounded-xl border border-[#222222] bg-[#111111]">
                <div className="border-b border-[#222222] p-4">
                  <h3 className="flex items-center gap-2 text-xl font-bold">
                    <Play className="h-6 w-6 text-[#00ff88]" />
                    {selectedVideo?.title ?? "Сабақ таңдалмаған"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">Ұзақтығы: {selectedVideo?.duration ?? "-"}</p>
                </div>

                <div className="aspect-video bg-black">
                  {selectedVideo?.videoUrl ? (
                    <iframe
                      className="h-full w-full"
                      src={selectedVideo.videoUrl}
                      title={selectedVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-center">
                        <Lock className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                        <p className="text-gray-500">Бұл сабақ әлі қолжетімсіз</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 rounded-lg border border-[#222222] bg-[#1a1a1a] px-6 py-3 transition-colors hover:bg-[#222222]">
                      <Download className="h-4 w-4" />
                      Материалдар
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectLesson(Math.max(selectedLessonIndex - 1, 0))}
                        className="rounded-lg border border-[#222222] px-6 py-3 transition-colors hover:bg-[#1a1a1a]"
                        disabled={!selectedVideo}
                      >
                        Алдыңғы
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectLesson(Math.min(selectedLessonIndex + 1, Math.max(lessons.length - 1, 0)))}
                        className="rounded-lg bg-[#00ff88] px-6 py-3 font-semibold text-black transition-all hover:bg-[#00ff88]/90"
                        disabled={!selectedVideo}
                      >
                        Келесі сабақ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 text-xl font-bold">Барлық сабақтар</h3>

                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleSelectLesson(index)}
                      className={`w-full rounded-lg p-4 text-left transition-all ${
                        selectedLessonIndex === index
                          ? "border border-[#00ff88] bg-[#00ff88]/10"
                          : "border border-[#222222] bg-[#0a0a0a] hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                            lesson.completed
                              ? "bg-[#00ff88] text-black"
                              : lesson.videoUrl
                              ? "bg-[#1a1a1a] text-[#00ff88]"
                              : "bg-[#1a1a1a] text-gray-600"
                          }`}
                        >
                          {lesson.completed ? <CheckCircle2 className="h-5 w-5" /> : lesson.videoUrl ? <Play className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </div>

                        <div className="flex-1">
                          <div className={`font-semibold ${selectedLessonIndex === index ? "text-[#00ff88]" : ""}`}>{lesson.title}</div>
                          <div className="text-sm text-gray-500">{lesson.duration}</div>
                        </div>

                        {lesson.completed && <span className="text-xs font-semibold text-[#00ff88]">Аяқталды</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Award className="h-6 w-6 text-[#00ff88]" />
                  Жетістіктер
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.title}
                      className={`rounded-xl border p-4 text-center ${
                        achievement.earned ? "border-[#00ff88] bg-[#00ff88]/10" : "border-[#222222] bg-[#0a0a0a] opacity-50"
                      }`}
                    >
                      <achievement.icon className={`mx-auto mb-2 h-8 w-8 ${achievement.earned ? "text-[#00ff88]" : "text-gray-600"}`} />
                      <div className="text-xs font-semibold">{achievement.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Calendar className="h-6 w-6 text-[#00ff88]" />
                  Апталық белсенділік
                </h3>

                <div className="space-y-3">
                  {["Дс", "Сс", "Ср", "Бс", "Жм", "Сн", "Жс"].map((day, index) => (
                    <div key={day} className="flex items-center gap-3">
                      <div className="w-8 text-sm text-gray-400">{day}</div>
                      <div className="h-2 flex-1 rounded-full bg-[#0a0a0a]">
                        <div className="h-full rounded-full bg-[#00ff88]" style={{ width: `${index < 5 ? 55 + index * 8 : 20}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#00ff88]/30 bg-gradient-to-br from-[#00ff88]/20 to-[#00ff88]/5 p-6">
                <h3 className="mb-2 text-xl font-bold">Бір қадам қалды! 🎯</h3>
                <p className="mb-4 text-sm text-gray-400">Оқу қарқыны жақсы. Тағы бірнеше сабақтан кейін жаңа жетістік ашылады.</p>
                <button
                  type="button"
                  onClick={() => activeEnrollment && handleContinueCourse(activeEnrollment.courseId, activeEnrollment.currentLessonIndex)}
                  className="w-full rounded-lg bg-[#00ff88] px-4 py-3 font-bold text-black transition-all hover:bg-[#00ff88]/90"
                >
                  Жалғастыру
                </button>
              </div>

              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <TrendingUp className="h-6 w-6 text-[#00ff88]" />
                  Прогресс және статистика
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3 text-sm">
                    Аяқталған курс: <span className="font-semibold text-[#00ff88]">{completedCoursesCount}</span>
                  </div>
                  <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3 text-sm">
                    Тапсырылған тест: <span className="font-semibold text-[#00ff88]">{testsTakenCount}</span>
                  </div>
                  <div className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3 text-sm">
                    Орташа балл: <span className="font-semibold text-[#00ff88]">{averageScore}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Award className="h-6 w-6 text-[#00ff88]" />
                  Сертификаттар
                </h3>
                {certificates.length === 0 ? (
                  <p className="text-sm text-gray-400">Сертификат алу үшін курсты 100% аяқтаңыз.</p>
                ) : (
                  <div className="space-y-3">
                    {certificates.map((item) => (
                      <div key={item.courseId} className="flex items-center justify-between rounded-lg border border-[#222222] bg-[#0a0a0a] p-3">
                        <span className="text-sm">{item.title}</span>
                        <button
                          type="button"
                          onClick={() => handleDownloadCertificate(item.title)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#00ff88]/40 px-3 py-2 text-sm text-[#00ff88] transition-colors hover:bg-[#00ff88]/10"
                        >
                          <Download className="h-4 w-4" />
                          PDF жүктеу
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Heart className="h-6 w-6 text-[#00ff88]" />
                  Wishlist / Таңдаулы курстар
                </h3>
                <div className="space-y-2">
                  {wishlistCourses.map((course) => (
                    <div key={course.id} className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3 text-sm">
                      {course.title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Bell className="h-6 w-6 text-[#00ff88]" />
                  Notifications
                </h3>
                <div className="space-y-3">
                  {notificationItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-400">{item.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#222222] bg-[#111111] p-6">
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <MessageSquare className="h-6 w-6 text-[#00ff88]" />
                  Пікірлер / Review
                </h3>
                {reviewItems.length === 0 ? (
                  <p className="text-sm text-gray-400">Курс аяқтағаннан кейін пікір қалдыра аласыз.</p>
                ) : (
                  <div className="space-y-3">
                    {reviewItems.map((review) => (
                      <div key={review.id} className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-3">
                        <p className="text-sm font-semibold">{review.courseTitle}</p>
                        <p className="mt-1 text-xs text-[#00ff88]">Бағасы: {review.rating}/5</p>
                        <p className="mt-2 text-xs text-gray-400">{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
