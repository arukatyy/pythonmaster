import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import {
  Play,
  Clock,
  Users,
  Star,
  CheckCircle2,
  Award,
  Calendar,
  Globe,
  ChevronRight,
  Download,
  FileText,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { getAllCourses } from "../data/courses";
import { addNotification, addToCart, enrollInCourse, getEnrollments } from "../data/appState";

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function CourseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [courses, setCourses] = useState(getAllCourses());
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const syncCourses = () => setCourses(getAllCourses());

    window.addEventListener("courses-updated", syncCourses);
    window.addEventListener("storage", syncCourses);

    return () => {
      window.removeEventListener("courses-updated", syncCourses);
      window.removeEventListener("storage", syncCourses);
    };
  }, []);

  const course = useMemo(
    () => courses.find((item) => item.id === id) ?? courses.find((item) => item.id === "python-basics"),
    [courses, id],
  );

  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Курс табылмады</h1>
          <Link to="/" className="text-primary hover:underline">
            Басты бетке оралу
          </Link>
        </div>
      </div>
    );
  }

  const isUploadedVideo = course.videoType === "file" || course.videoUrl.startsWith("data:video");
  const isEnrolled = getEnrollments().some((item) => item.courseId === course.id);
  const materials = course.materials ?? [];
  const quizQuestions = course.quiz ?? [];
  const currentQuestion = quizQuestions[activeQuestionIndex] ?? null;

  useEffect(() => {
    setQuizStarted(false);
    setQuizFinished(false);
    setActiveQuestionIndex(0);
    setSelectedAnswers(Array(quizQuestions.length).fill(-1));
    setTimeLeft(60);
    setQuizScore(0);
  }, [course.id, quizQuestions.length]);

  useEffect(() => {
    if (!quizStarted || quizFinished || quizQuestions.length === 0) return;

    const timerId = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [quizStarted, quizFinished, activeQuestionIndex, quizQuestions.length]);

  useEffect(() => {
    if (!quizStarted || quizFinished) return;

    if (timeLeft > 0) {
      return;
    }

    if (activeQuestionIndex === quizQuestions.length - 1) {
      const nextScore = selectedAnswers.reduce((score, answer, index) => {
        return score + (answer === quizQuestions[index]?.correctAnswer ? 1 : 0);
      }, 0);

      setQuizScore(nextScore);
      setQuizFinished(true);
      setQuizStarted(false);
      return;
    }

    setActiveQuestionIndex((prev) => prev + 1);
    setTimeLeft(60);
  }, [activeQuestionIndex, quizFinished, quizQuestions, quizStarted, selectedAnswers, timeLeft]);

  const ensureRegistered = () => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      toast.error("Алдымен тіркелу керек");
      navigate("/register");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!ensureRegistered()) return;

    const added = addToCart(course);
    if (!added) {
      toast.info("Бұл курс себетте бар");
      return;
    }

    addNotification({
      title: "Себет жаңартылды",
      message: `${course.title} себетке қосылды`,
      type: "info",
    });
    toast.success("Курс себетке қосылды");
  };

  const handlePurchase = () => {
    if (!ensureRegistered()) return;
    if (isEnrolled) {
      navigate("/profile");
      return;
    }

    enrollInCourse(course);
    addNotification({
      title: "Сатып алу аяқталды",
      message: `${course.title} курсы сатып алынды`,
      type: "success",
    });
    toast.success("Курс сәтті сатып алынды");
    navigate("/profile");
  };

  const handleStartQuiz = () => {
    setSelectedAnswers(Array(quizQuestions.length).fill(-1));
    setActiveQuestionIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizStarted(true);
    setTimeLeft(60);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    setSelectedAnswers((prev) => {
      const nextAnswers = [...prev];
      nextAnswers[activeQuestionIndex] = answerIndex;
      return nextAnswers;
    });
  };

  const handleNextQuestion = () => {
    if (activeQuestionIndex === quizQuestions.length - 1) {
      const nextScore = selectedAnswers.reduce((score, answer, index) => {
        return score + (answer === quizQuestions[index]?.correctAnswer ? 1 : 0);
      }, 0);

      setQuizScore(nextScore);
      setQuizFinished(true);
      setQuizStarted(false);
      return;
    }

    setActiveQuestionIndex((prev) => prev + 1);
    setTimeLeft(60);
  };

  return (
    <div className="pb-20">
      <section className="bg-gradient-to-br from-background via-background to-primary/10 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-4">
                  <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                    {course.level}
                  </span>
                </div>

                <h1 className="mb-4 text-4xl font-bold md:text-5xl">{course.title}</h1>
                <p className="mb-6 text-xl text-muted-foreground">{course.description}</p>

                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" fill="currentColor" />
                    <span className="font-bold">{course.rating}</span>
                    <span className="text-muted-foreground">рейтинг</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span>{course.students} студент</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    <span>{course.language}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
              <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card">
                <div className="p-6">
                  <div className="mb-6 text-4xl font-bold text-primary">{course.price}</div>

                  <button
                    type="button"
                    onClick={handlePurchase}
                    className="mb-4 block w-full rounded-lg bg-primary px-6 py-4 text-center font-bold text-primary-foreground transition-all hover:bg-primary/90"
                  >
                    {isEnrolled ? "Профильге өту" : "Курсты сатып алу"}
                  </button>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full rounded-lg border-2 border-primary px-6 py-3 font-semibold text-primary transition-all hover:bg-primary/10"
                  >
                    Себетке қосу
                  </button>

                  <div className="mt-6 space-y-3 border-t border-border pt-6">
                    {course.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-12 lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
                  <Play className="h-8 w-8 text-primary" />
                  Танымал сабақ
                </h2>

                <div className="aspect-video overflow-hidden rounded-xl border border-border bg-card">
                  {isUploadedVideo ? (
                    <video className="h-full w-full" controls src={course.videoUrl} />
                  ) : (
                    <iframe
                      className="h-full w-full"
                      src={course.videoUrl}
                      title="Course Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
                  <Calendar className="h-8 w-8 text-primary" />
                  Оқу бағдарламасы
                </h2>

                <div className="space-y-4">
                  {course.syllabus.map((week, index) => (
                    <motion.div
                      key={`${week.week}-${week.title}`}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <div className="mb-1 text-sm font-semibold text-primary">{week.week}</div>
                            <h3 className="text-xl font-bold">{week.title}</h3>
                          </div>
                          <Calendar className="h-6 w-6 text-muted-foreground" />
                        </div>

                        <ul className="space-y-2">
                          {week.lessons.map((lesson) => (
                            <li key={lesson} className="flex items-start gap-2 text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span className="text-sm">{lesson}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
                  <FileText className="h-8 w-8 text-primary" />
                  Материалдар
                </h2>

                <div className="space-y-3 rounded-xl border border-border bg-card p-5">
                  {materials.length > 0 ? (
                    materials.map((material) => (
                      <a
                        key={`${material.name}-${material.url}`}
                        href={material.url}
                        download={material.name}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-4 transition-all hover:border-primary/40 hover:bg-accent"
                      >
                        <div>
                          <div className="font-semibold">{material.name}</div>
                          <div className="text-xs text-muted-foreground">{material.sizeLabel}</div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary">
                          <Download className="h-4 w-4" />
                          Жүктеу
                        </span>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Бұл курсқа материалдар әлі жүктелмеген.</p>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
                  <Timer className="h-8 w-8 text-primary" />
                  Курс тесті
                </h2>

                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-6 flex flex-col gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-semibold">10 сұрақ, әр сұраққа 1 минут</div>
                      <p className="text-sm text-muted-foreground">
                        Таймер әр сұрақ сайын қайта басталады. Уақыт бітсе, жүйе келесі сұраққа автоматты өтеді.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartQuiz}
                      className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                    >
                      {quizFinished ? "Тестті қайта бастау" : quizStarted ? "Қайта бастау" : "Тестті бастау"}
                    </button>
                  </div>

                  {quizFinished ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-primary/30 bg-primary/10 p-5">
                        <div className="text-sm font-semibold text-primary">Нәтиже</div>
                        <div className="mt-2 text-3xl font-bold">
                          {quizScore} / {quizQuestions.length}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Дұрыс жауап саны көрсетілді. Қаласаңыз тестті қайтадан тапсыра аласыз.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {quizQuestions.map((question, index) => (
                          <div key={question.question} className="rounded-xl border border-border p-4">
                            <div className="mb-2 flex items-start justify-between gap-4">
                              <div className="font-semibold">
                                {index + 1}. {question.question}
                              </div>
                              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                {selectedAnswers[index] === question.correctAnswer ? "Дұрыс" : "Қате"}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Дұрыс жауап: {question.options[question.correctAnswer]}
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">{question.explanation}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : quizStarted && currentQuestion ? (
                    <div>
                      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-background p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-primary">
                            Сұрақ {activeQuestionIndex + 1} / {quizQuestions.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Таңдалған жауап:{" "}
                            {selectedAnswers[activeQuestionIndex] >= 0
                              ? currentQuestion.options[selectedAnswers[activeQuestionIndex]]
                              : "Әлі таңдалмады"}
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 font-semibold text-primary">
                          <Timer className="h-4 w-4" />
                          {formatTimer(timeLeft)}
                        </div>
                      </div>

                      <h3 className="mb-4 text-xl font-bold">{currentQuestion.question}</h3>

                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleSelectAnswer(index)}
                            className={`w-full rounded-xl border px-4 py-4 text-left transition-all ${
                              selectedAnswers[activeQuestionIndex] === index
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/40 hover:bg-accent"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                        >
                          {activeQuestionIndex === quizQuestions.length - 1 ? "Тестті аяқтау" : "Келесі сұрақ"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Осы курсқа байланысты материалды қарап, кейін 10 сұрақтық тестті бастап біліміңізді тексеріңіз.
                    </p>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="mb-6 flex items-center gap-2 text-3xl font-bold">
                  <Award className="h-8 w-8 text-primary" />
                  Оқытушы
                </h2>

                <div className="rounded-xl border border-border bg-card p-8">
                  <div className="flex flex-col gap-6 md:flex-row">
                    <img
                      src={course.instructor.image}
                      alt={course.instructor.name}
                      className="h-32 w-32 rounded-xl border-2 border-primary object-cover"
                    />

                    <div className="flex-1">
                      <h3 className="mb-1 text-2xl font-bold">{course.instructor.name}</h3>
                      <p className="mb-3 text-primary">{course.instructor.title}</p>
                      <p className="mb-4 text-muted-foreground">{course.instructor.bio}</p>

                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg bg-background p-3 text-center">
                          <div className="text-xl font-bold text-primary">{course.instructor.experience}</div>
                          <div className="text-xs text-muted-foreground">Тәжірибе</div>
                        </div>
                        <div className="rounded-lg bg-background p-3 text-center">
                          <div className="text-xl font-bold text-primary">{course.instructor.students}</div>
                          <div className="text-xs text-muted-foreground">Студент</div>
                        </div>
                        <div className="rounded-lg bg-background p-3 text-center">
                          <div className="text-xl font-bold text-primary">{course.instructor.courses}</div>
                          <div className="text-xs text-muted-foreground">Курс</div>
                        </div>
                        <div className="rounded-lg bg-background p-3 text-center">
                          <div className="text-xl font-bold text-primary">{course.instructor.rating}</div>
                          <div className="text-xs text-muted-foreground">Рейтинг</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-bold">Курс туралы қысқаша</h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between"><span>Тіл</span><span className="font-semibold text-foreground">{course.language}</span></div>
                  <div className="flex items-center justify-between"><span>Студенттер</span><span className="font-semibold text-foreground">{course.students}</span></div>
                  <div className="flex items-center justify-between"><span>Формат</span><span className="font-semibold text-foreground">Онлайн</span></div>
                  <div className="flex items-center justify-between"><span>Материалдар</span><span className="font-semibold text-foreground">{course.materials?.length ?? 0}</span></div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 text-xl font-bold">Тест туралы</h3>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Сұрақ саны</span>
                    <span className="font-semibold text-foreground">{quizQuestions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Бір сұрақ уақыты</span>
                    <span className="font-semibold text-foreground">1 минут</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Формат</span>
                    <span className="font-semibold text-foreground">Бір жауап таңдау</span>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    Тест осы курс тақырыбы, модульдері және материалдары негізінде автоматты дайындалады.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-background via-primary/10 to-background py-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Өз Python саяхатыңызды бүгін бастаңыз</h2>
          <p className="mb-8 text-xl text-muted-foreground">Мыңдаған студенттердің қатарына қосылыңыз</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-10 py-5 text-lg font-bold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Тіркелу
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
