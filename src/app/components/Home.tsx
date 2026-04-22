import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Code2, Zap, Trophy, Users, ChevronRight, Play, BookOpen, Award, Search, X } from "lucide-react";
import { getAllCourses, type Course } from "../data/courses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

const stats = [
  { icon: Users, value: "15,000+", label: "Студенттер" },
  { icon: BookOpen, value: "50+", label: "Курстар" },
  { icon: Award, value: "98%", label: "Табысты бітіру" },
  { icon: Trophy, value: "4.9", label: "Орташа рейтинг" },
];

export function Home() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  useEffect(() => {
    const syncCourses = () => {
      setAvailableCourses(getAllCourses());
    };

    syncCourses();
    window.addEventListener("courses-updated", syncCourses);
    window.addEventListener("storage", syncCourses);

    return () => {
      window.removeEventListener("courses-updated", syncCourses);
      window.removeEventListener("storage", syncCourses);
    };
  }, []);

  const filteredCourses = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    if (!normalized) {
      return availableCourses;
    }

    return availableCourses.filter((course) =>
      course.title.toLowerCase().includes(normalized),
    );
  }, [searchTerm, availableCourses]);

  return (
    <div>
      <section className="relative flex min-h-[90vh] items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />

        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-20 top-20 h-96 w-96 rounded-full bg-primary blur-[120px]" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-cyan-400 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2"
            >
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Қазақстандағы #1 Python платформасы</span>
            </motion.div>

            <h1 className="mb-6 text-6xl font-bold leading-tight md:text-7xl">
              Master
              <br />
              <span className="relative inline-block text-primary">
                Python
                <div className="absolute inset-0 bg-primary opacity-30 blur-2xl" />
              </span>
            </h1>

            <p className="mb-8 max-w-lg text-xl text-muted-foreground">
              Дүние жүзіндегі ең танымал бағдарламалау тілін үйреніп,
              технология саласында жаңа мансабыңызды бастаңыз
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="group relative overflow-hidden rounded-lg bg-primary px-8 py-4 font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Тіркелу
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>

              {availableCourses[0] && (
                <button
                  type="button"
                  onClick={() => setSelectedCourse(availableCourses[0])}
                  className="group flex items-center gap-2 rounded-lg border-2 border-primary px-8 py-4 font-bold text-primary transition-all hover:bg-primary/10"
                >
                  <Play className="h-5 w-5" />
                  Трейлер көру
                </button>
              )}
            </div>

            <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-3xl" />
              <div className="relative rounded-2xl border border-border bg-gradient-to-br from-card to-background p-8">
                <Code2 className="h-64 w-full text-primary" strokeWidth={1} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="courses" className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-4 text-4xl font-bold md:text-5xl"
              >
                Танымал <span className="text-primary">Курстар</span>
              </motion.h2>
              <p className="text-lg text-muted-foreground">
                Мамандар жасаған, нәтижеге бағытталған курстар
              </p>
            </div>

            <div className="w-full max-w-md">
              <label htmlFor="course-search" className="mb-2 block text-sm font-semibold">
                Курсты іздеу
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="course-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Атауы бойынша іздеу..."
                  className="w-full rounded-xl border border-border bg-card py-4 pl-12 pr-12 text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Табылды: {filteredCourses.length} / {availableCourses.length}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50"
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    {course.level}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="mb-2 text-xl font-bold transition-colors group-hover:text-primary">
                    {course.title}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {course.description}
                  </p>

                  <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>⏱ {course.duration}</span>
                    <span>👥 {course.students}</span>
                    <span>⭐ {course.rating}</span>
                  </div>

                  <div className="border-border flex items-center justify-between border-t pt-4">
                    <div className="text-2xl font-bold text-primary">{course.price}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/course/${course.id}`);
                      }}
                      className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    >
                      Ашу
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center text-muted-foreground">
              Сұраныс бойынша курс табылмады. Басқа атауды енгізіп көріңіз.
            </div>
          )}
        </div>
      </section>

      <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/10 to-background opacity-70" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">Өз саяхатыңызды бүгін бастаңыз</h2>
            <p className="mb-8 text-xl text-muted-foreground">
              Python-ды меңгеріп, технология әлеміндегі мансабыңызды құрыңыз
            </p>
            <Link
              to="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-primary px-10 py-5 text-lg font-bold text-primary-foreground transition-all hover:bg-primary/90"
            >
              <span className="relative z-10">Тіркелу</span>
              <ChevronRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </motion.div>
        </div>
      </section>

      <Dialog open={Boolean(selectedCourse)} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        {selectedCourse && (
          <DialogContent className="max-w-2xl border-border bg-card text-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedCourse.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {selectedCourse.description}
              </DialogDescription>
            </DialogHeader>

            <img src={selectedCourse.image} alt={selectedCourse.title} className="h-64 w-full rounded-xl object-cover" />

            <div className="grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-1 text-xs uppercase tracking-[0.2em] text-primary">Деңгей</div>
                <div className="font-semibold text-foreground">{selectedCourse.level}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-1 text-xs uppercase tracking-[0.2em] text-primary">Ұзақтығы</div>
                <div className="font-semibold text-foreground">{selectedCourse.duration}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-1 text-xs uppercase tracking-[0.2em] text-primary">Тіл</div>
                <div className="font-semibold text-foreground">{selectedCourse.language}</div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-1 text-xs uppercase tracking-[0.2em] text-primary">Баға</div>
                <div className="font-semibold text-foreground">{selectedCourse.price}</div>
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-lg font-bold">Не үйренесіз</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCourse.features.map((feature) => (
                  <span key={feature} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={`/course/${selectedCourse.id}`}
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Толық бетке өту
              </Link>
              <Link
                to="/register"
                onClick={() => setSelectedCourse(null)}
                className="rounded-lg border border-border px-6 py-3 font-semibold transition-all hover:border-primary/50 hover:text-primary"
              >
                Тіркелу
              </Link>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
