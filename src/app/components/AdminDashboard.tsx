import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Download,
  Search,
  Filter,
  MoreVertical,
  LayoutDashboard,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  Upload,
  PlusCircle,
  FileVideo,
  ImagePlus,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllCourses,
  saveCustomCourse,
  slugifyCourseTitle,
  type Course,
  type CourseMaterial,
} from "../data/courses";
import {
  addNotification,
  clearNotifications,
  getAdminSettings,
  getCartItems,
  getNotifications,
  saveAdminSettings,
  type AdminSettings,
  type NotificationItem,
} from "../data/appState";
import { fetchUsers } from "../data/usersApi";

type UserRecord = {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  course: string;
  progress: number;
  status: "active" | "inactive";
  joined: string;
};

type CourseFormState = {
  title: string;
  description: string;
  level: string;
  duration: string;
  price: string;
  language: string;
  instructorName: string;
  instructorTitle: string;
  instructorBio: string;
  weekLabel: string;
  moduleTitle: string;
  lessonsText: string;
  featuresText: string;
  imageUrl: string;
  videoUrl: string;
};

const initialFormState: CourseFormState = {
  title: "",
  description: "",
  level: "Бастауыш",
  duration: "",
  price: "",
  language: "Қазақ",
  instructorName: "",
  instructorTitle: "",
  instructorBio: "",
  weekLabel: "1-апта",
  moduleTitle: "Кіріспе модуль",
  lessonsText: "1-сабақ\n2-сабақ\n3-сабақ",
  featuresText: "Сертификат\nПрактикалық тапсырма\nВидео сабақ",
  imageUrl: "",
  videoUrl: "",
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Файлды оқу мүмкін болмады"));
    reader.readAsDataURL(file);
  });
}

function normalizeVideoUrl(url: string) {
  if (url.includes("youtube.com/watch?v=")) {
    return url.replace("watch?v=", "embed/");
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }

  return url;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<CourseFormState>(initialFormState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [settingsState, setSettingsState] = useState<AdminSettings>(getAdminSettings());
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const syncUsers = async () => {
      try {
        const apiUsers = await fetchUsers();
        setUsers(
          apiUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            course: user.course || "Жаңа тіркелуші",
            progress: user.progress ?? 0,
            status: user.status === "inactive" ? "inactive" : "active",
            joined: user.createdAt.slice(0, 10),
          })),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Студенттерді жүктеу кезінде қате болды";
        toast.error(message);
      }
    };

    const syncCourses = () => setCourses(getAllCourses());
    const syncNotifications = () => setNotifications(getNotifications());
    const syncSettings = () => setSettingsState(getAdminSettings());
    const syncCart = () => setCartCount(getCartItems().length);
    void syncUsers();
    syncCourses();
    syncNotifications();
    syncSettings();
    syncCart();
    window.addEventListener("users-updated", syncUsers);
    window.addEventListener("courses-updated", syncCourses);
    window.addEventListener("storage", syncCourses);
    window.addEventListener("notifications-updated", syncNotifications);
    window.addEventListener("admin-settings-updated", syncSettings);
    window.addEventListener("cart-updated", syncCart);

    return () => {
      window.removeEventListener("users-updated", syncUsers);
      window.removeEventListener("courses-updated", syncCourses);
      window.removeEventListener("storage", syncCourses);
      window.removeEventListener("notifications-updated", syncNotifications);
      window.removeEventListener("admin-settings-updated", syncSettings);
      window.removeEventListener("cart-updated", syncCart);
    };
  }, []);

  const stats = useMemo(
    () => [
      {
        icon: Users,
        label: "Жалпы студенттер",
        value: users.length.toString(),
        change: "+12.5%",
        positive: true,
      },
      {
        icon: BookOpen,
        label: "Барлық курстар",
        value: courses.length.toString(),
        change: "+1",
        positive: true,
      },
      {
        icon: DollarSign,
        label: "Себеттегі курстар",
        value: cartCount.toString(),
        change: "+8.2%",
        positive: true,
      },
      {
        icon: TrendingUp,
        label: "Белсенді студенттер",
        value: `${users.filter((user) => user.status === "active").length}`,
        change: "+2.1%",
        positive: true,
      },
    ],
    [cartCount, courses, users],
  );

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.course.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
      course.level.toLowerCase().includes(courseSearch.toLowerCase()) ||
      course.language.toLowerCase().includes(courseSearch.toLowerCase()),
  );

  const handleExportToExcel = () => {
    const csvContent = [
      ["ID", "Аты-жөні", "Email", "Телефон", "Курс", "Прогресс", "Статус", "Тіркелген күні"],
      ...filteredUsers.map((user) => [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.course,
        `${user.progress}%`,
        user.status === "active" ? "Белсенді" : "Белсенді емес",
        user.joined,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImageFile(e.target.files?.[0] ?? null);
  };

  const handleVideoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVideoFile(e.target.files?.[0] ?? null);
  };

  const handleMaterialFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMaterialFiles(Array.from(e.target.files ?? []));
  };

  const handleSettingsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setSettingsState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setImageFile(null);
    setVideoFile(null);
    setMaterialFiles([]);
  };

  const handleSubmitCourse = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.price.trim()) {
      toast.error("Курс атауы, сипаттама және баға міндетті");
      return;
    }

    if (!imageFile && !formData.imageUrl.trim()) {
      toast.error("Курсқа фото жүктеңіз немесе фото сілтемесін беріңіз");
      return;
    }

    if (!videoFile && !formData.videoUrl.trim()) {
      toast.error("Курсқа видео файл немесе видео сілтеме қосыңыз");
      return;
    }

    try {
      setSubmitting(true);

      if (imageFile && imageFile.size > 2 * 1024 * 1024) {
        throw new Error("Фото 2 MB-тан аспауы керек");
      }

      if (videoFile && videoFile.size > 5 * 1024 * 1024) {
        throw new Error("Видео 5 MB-тан аспауы керек");
      }

      if (materialFiles.some((file) => file.size > 2 * 1024 * 1024)) {
        throw new Error("Материал файлдарының әрқайсысы 2 MB-тан аспауы керек");
      }

      const uploadedImage = imageFile ? await fileToDataUrl(imageFile) : formData.imageUrl.trim();
      const uploadedVideo = videoFile ? await fileToDataUrl(videoFile) : normalizeVideoUrl(formData.videoUrl.trim());
      const materials: CourseMaterial[] = await Promise.all(
        materialFiles.map(async (file) => ({
          name: file.name,
          url: await fileToDataUrl(file),
          type: file.type || "application/octet-stream",
          sizeLabel: formatFileSize(file.size),
        })),
      );

      const lessons = formData.lessonsText
        .split("\n")
        .map((lesson) => lesson.trim())
        .filter(Boolean);

      const features = formData.featuresText
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean);

      const idBase = slugifyCourseTitle(formData.title);
      const uniqueId = `${idBase || "custom-course"}-${Date.now().toString().slice(-6)}`;

      const newCourse: Course = {
        id: uniqueId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        level: formData.level,
        duration: formData.duration.trim() || "4 апта",
        students: "0",
        rating: "5.0",
        price: formData.price.trim(),
        image: uploadedImage,
        language: formData.language.trim() || "Қазақ",
        videoUrl: uploadedVideo,
        videoType: videoFile ? "file" : "embed",
        features,
        materials,
        syllabus: [
          {
            week: formData.weekLabel.trim() || "1-апта",
            title: formData.moduleTitle.trim() || "Кіріспе модуль",
            lessons,
          },
        ],
        instructor: {
          name: formData.instructorName.trim() || "Жаңа оқытушы",
          title: formData.instructorTitle.trim() || "Course Author",
          experience: "1+ жыл",
          students: "0",
          courses: "1",
          rating: "5.0",
          image: uploadedImage,
          bio: formData.instructorBio.trim() || "Автор туралы ақпарат кейін толықтырылады",
        },
      };

      saveCustomCourse(newCourse);
      setCourses(getAllCourses());
      resetForm();
      addNotification({
        title: "Курс қосылды",
        message: `${newCourse.title} әкімші панелі арқылы жарияланды`,
        type: "success",
      });
      toast.success("Курс сәтті қосылды");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Курсты сақтау кезінде қате болды";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSettings = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveAdminSettings(settingsState);
    addNotification({
      title: "Баптаулар жаңартылды",
      message: `${settingsState.platformName} платформасының баптаулары сақталды`,
      type: "info",
    });
    toast.success("Баптаулар сақталды");
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("admin-authenticated");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-card transition-transform duration-200 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Admin<span className="text-primary">Panel</span></h2>
              <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 hover:bg-accent lg:hidden">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            <a href="#dashboard" className="flex items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 text-primary">
              <LayoutDashboard className="h-5 w-5" />
              <span>Басты бет</span>
            </a>
            <a href="#students" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Users className="h-5 w-5" />
              <span>Студенттер</span>
            </a>
            <a href="#course-builder" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <BookOpen className="h-5 w-5" />
              <span>Курс қосу</span>
            </a>
            <a href="#courses" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <FileText className="h-5 w-5" />
              <span>Материалдар</span>
            </a>
            <a href="#notifications" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span>Хабарламалар</span>
            </a>
            <a href="#settings" className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <Settings className="h-5 w-5" />
              <span>Баптаулар</span>
            </a>
          </nav>

          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={handleAdminLogout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>Шығу</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 lg:p-8">
          <div id="dashboard" className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-accent lg:hidden">
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold">Басқару панелі</h1>
                <p className="text-muted-foreground">Курс, материал және студенттерді басқару</p>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className={`text-sm font-semibold ${stat.positive ? "text-green-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                </div>
                <div className="mb-1 text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="mb-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
            <motion.section
              id="course-builder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card"
            >
              <div className="border-b border-border p-6">
                <div className="flex items-center gap-3">
                  <PlusCircle className="h-6 w-6 text-primary" />
                  <div>
                    <h2 className="text-xl font-bold">Жаңа курс қосу</h2>
                    <p className="text-sm text-muted-foreground">Деңгей, материал, фото және видео толтырыңыз</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitCourse} className="grid gap-6 p-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">Курс атауы</label>
                  <input name="title" value={formData.title} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Python for Beginners" />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">Сипаттама</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} className="min-h-28 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Курс туралы қысқаша ақпарат" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Қай деңгейге арналған</label>
                  <select name="level" value={formData.level} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary">
                    <option>Бастауыш</option>
                    <option>Орташа</option>
                    <option>Жоғары</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Ұзақтығы</label>
                  <input name="duration" value={formData.duration} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="8 апта" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Бағасы</label>
                  <input name="price" value={formData.price} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="49,990 ₸" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Тілі</label>
                  <input name="language" value={formData.language} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Қазақ/Орыс" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Оқытушы аты</label>
                  <input name="instructorName" value={formData.instructorName} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Асқар Беков" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Оқытушы лауазымы</label>
                  <input name="instructorTitle" value={formData.instructorTitle} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Senior Instructor" />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">Оқытушы туралы</label>
                  <textarea name="instructorBio" value={formData.instructorBio} onChange={handleInputChange} className="min-h-24 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Қысқаша био" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Модуль аптасы</label>
                  <input name="weekLabel" value={formData.weekLabel} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="1-апта" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Модуль атауы</label>
                  <input name="moduleTitle" value={formData.moduleTitle} onChange={handleInputChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Кіріспе модуль" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Сабақтар тізімі</label>
                  <textarea name="lessonsText" value={formData.lessonsText} onChange={handleInputChange} className="min-h-32 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Әр сабақ жаңа жолдан" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Артықшылықтар</label>
                  <textarea name="featuresText" value={formData.featuresText} onChange={handleInputChange} className="min-h-32 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Әр артықшылық жаңа жолдан" />
                </div>

                <div className="rounded-xl border border-dashed border-border p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold"><ImagePlus className="h-4 w-4 text-primary" /> Фото жүктеу</label>
                  <input type="file" accept="image/*" onChange={handleImageFileChange} className="block w-full text-sm text-muted-foreground" />
                  <input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Немесе фото URL" />
                  <p className="mt-2 text-xs text-muted-foreground">Демо үшін 2 MB дейінгі сурет</p>
                </div>

                <div className="rounded-xl border border-dashed border-border p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold"><FileVideo className="h-4 w-4 text-primary" /> Видео жүктеу</label>
                  <input type="file" accept="video/*" onChange={handleVideoFileChange} className="block w-full text-sm text-muted-foreground" />
                  <input name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} className="mt-3 w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary" placeholder="Немесе YouTube embed/watch URL" />
                  <p className="mt-2 text-xs text-muted-foreground">Демо үшін 5 MB дейінгі видео</p>
                </div>

                <div className="md:col-span-2 rounded-xl border border-dashed border-border p-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold"><Upload className="h-4 w-4 text-primary" /> Материалдар жүктеу</label>
                  <input type="file" multiple onChange={handleMaterialFilesChange} className="block w-full text-sm text-muted-foreground" />
                  {materialFiles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {materialFiles.map((file) => (
                        <span key={`${file.name}-${file.size}`} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex flex-wrap gap-3">
                  <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60">
                    {submitting ? "Сақталуда..." : "Курсты сақтау"}
                  </button>
                  <button type="button" onClick={resetForm} className="rounded-lg border border-border px-6 py-3 font-semibold transition-colors hover:bg-accent">
                    Форманы тазалау
                  </button>
                </div>
              </form>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-bold">Жүктеу ережесі</h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 font-semibold text-foreground">Фото</div>
                  <p>Курс карточкасы мен detail бетіне шығады.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 font-semibold text-foreground">Видео</div>
                  <p>YouTube сілтемесі немесе шағын demo video жүктеуге болады.</p>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="mb-2 font-semibold text-foreground">Материалдар</div>
                  <p>PDF, DOCX, ZIP секілді файлдар курс бетінде жүктелетін болады.</p>
                </div>
              </div>
            </motion.section>
          </div>

          <motion.section id="courses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-xl border border-border bg-card">
            <div className="border-b border-border p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Курстар базасы</h2>
                  <p className="text-sm text-muted-foreground">Жаңа қосылған курстар бірден сайтқа шығады</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Курс іздеу..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 outline-none focus:border-primary sm:w-72"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <div key={course.id} className="overflow-hidden rounded-xl border border-border bg-background">
                  <img src={course.image} alt={course.title} className="h-40 w-full object-cover" />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{course.title}</div>
                        <div className="text-sm text-muted-foreground">{course.level} • {course.language}</div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{course.price}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {course.features.slice(0, 3).map((feature) => (
                        <span key={feature} className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                          {feature}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Материал: {course.materials?.length ?? 0}</span>
                      <span>Видео: {course.videoType === "file" ? "Файл" : "Embed"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          <div className="mb-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <motion.section
              id="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border p-6">
                <div>
                  <h2 className="text-xl font-bold">Хабарламалар</h2>
                  <p className="text-sm text-muted-foreground">Тіркелу, сатып алу, курс қосу оқиғалары</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearNotifications();
                    toast.success("Хабарламалар тазартылды");
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
                >
                  Тазалау
                </button>
              </div>

              <div className="space-y-3 p-6">
                {notifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                    Әзірге хабарлама жоқ.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border bg-background p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="font-semibold">{item.title}</div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            item.type === "success"
                              ? "bg-primary/10 text-primary"
                              : item.type === "warning"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-sky-500/10 text-sky-500"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            <motion.section
              id="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card"
            >
              <div className="border-b border-border p-6">
                <h2 className="text-xl font-bold">Баптаулар</h2>
                <p className="text-sm text-muted-foreground">Платформаның негізгі параметрлерін сақтау</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Платформа атауы</label>
                  <input
                    name="platformName"
                    value={settingsState.platformName}
                    onChange={handleSettingsChange}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Қолдау email</label>
                  <input
                    name="supportEmail"
                    type="email"
                    value={settingsState.supportEmail}
                    onChange={handleSettingsChange}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary"
                  />
                </div>

                <label className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div>
                    <div className="font-semibold">Тіркелуге рұқсат</div>
                    <div className="text-sm text-muted-foreground">Жаңа қолданушылар тіркеле алады</div>
                  </div>
                  <input
                    name="allowRegistrations"
                    type="checkbox"
                    checked={settingsState.allowRegistrations}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 accent-[var(--color-primary)]"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <div>
                    <div className="font-semibold">Maintenance mode</div>
                    <div className="text-sm text-muted-foreground">Платформаны уақытша техникалық режимге ауыстыру</div>
                  </div>
                  <input
                    name="maintenanceMode"
                    type="checkbox"
                    checked={settingsState.maintenanceMode}
                    onChange={handleSettingsChange}
                    className="h-5 w-5 accent-[var(--color-primary)]"
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                >
                  Баптауларды сақтау
                </button>
              </form>
            </motion.section>
          </div>

          <motion.section id="students" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-xl font-bold">Студенттер тізімі</h2>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Іздеу..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 outline-none focus:border-primary sm:w-64"
                    />
                  </div>

                  <button className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 transition-colors hover:bg-accent">
                    <Filter className="h-4 w-4" />
                    <span>Фильтр</span>
                  </button>

                  <button onClick={handleExportToExcel} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-all hover:bg-primary/90">
                    <Download className="h-4 w-4" />
                    <span>Excel-ге жүктеу</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Аты-жөні</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Телефон</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Курс</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Прогресс</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Статус</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Тіркелген</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-background">
                      <td className="px-6 py-4 text-sm text-muted-foreground">#{user.id}</td>
                      <td className="px-6 py-4"><div className="font-semibold">{user.name}</div></td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.phone}</td>
                      <td className="px-6 py-4 text-sm">{user.course}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 max-w-[100px] flex-1 rounded-full bg-border">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${user.progress}%` }} />
                          </div>
                          <span className="text-sm font-semibold">{user.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {user.status === "active" ? "Белсенді" : "Белсенді емес"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.joined}</td>
                      <td className="px-6 py-4">
                        <button className="rounded-lg p-2 transition-colors hover:bg-accent">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border p-6">
              <div className="text-sm text-muted-foreground">Көрсетілген: {filteredUsers.length} / {users.length}</div>
              <div className="flex gap-2">
                <button className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-accent">Алдыңғы</button>
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90">Келесі</button>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
