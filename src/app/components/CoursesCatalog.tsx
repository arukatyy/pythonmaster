import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Search, X } from "lucide-react";
import { getAllCourses, type Course } from "../data/courses";

export function CoursesCatalog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  useEffect(() => {
    const syncCourses = () => setAvailableCourses(getAllCourses());
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
    if (!normalized) return availableCourses;
    return availableCourses.filter((course) =>
      course.title.toLowerCase().includes(normalized),
    );
  }, [searchTerm, availableCourses]);

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Барлық <span className="text-primary">Курстар</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Платформадағы барлық курс бір жерде
            </p>
          </div>

          <div className="w-full max-w-md">
            <label htmlFor="course-search-page" className="mb-2 block text-sm font-semibold">
              Курсты іздеу
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="course-search-page"
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
              transition={{ duration: 0.5, delay: index * 0.05 }}
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
      </div>
    </section>
  );
}
