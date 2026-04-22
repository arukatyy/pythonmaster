export type SyllabusWeek = {
  week: string;
  title: string;
  lessons: string[];
};

export type CourseMaterial = {
  name: string;
  url: string;
  type: string;
  sizeLabel: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  students: string;
  rating: string;
  price: string;
  image: string;
  language: string;
  videoUrl: string;
  videoType?: "embed" | "file";
  features: string[];
  syllabus: SyllabusWeek[];
  materials?: CourseMaterial[];
  instructor: {
    name: string;
    title: string;
    experience: string;
    students: string;
    courses: string;
    rating: string;
    image: string;
    bio: string;
  };
};

const COURSES_STORAGE_KEY = "courses";

const defaultSyllabus: SyllabusWeek[] = [
  {
    week: "1-апта",
    title: "Кіріспе және орта дайындау",
    lessons: [
      "Платформаға шолу",
      "Қажетті құралдарды орнату",
      "Алғашқы практикалық тапсырма",
      "Жұмыс барысын жоспарлау",
    ],
  },
  {
    week: "2-апта",
    title: "Негізгі ұғымдар",
    lessons: [
      "Синтаксис және құрылым",
      "Айнымалылар және типтер",
      "Шарттар және циклдар",
      "Функциялар құру",
    ],
  },
  {
    week: "3-апта",
    title: "Практикалық жоба",
    lessons: [
      "Жоба архитектурасы",
      "API немесе деректермен жұмыс",
      "Қателерді өңдеу",
      "Финалдық демонстрация",
    ],
  },
];

export const baseCourses: Course[] = [
  {
    id: "python-basics",
    title: "Python Basics: Zero to Hero",
    description:
      "Python негіздерін үйреніп, алғашқы бағдарламаларыңызды жазыңыз. Бұл курс бағдарламалауды нөлден бастағысы келетін барлық адамдарға арналған.",
    level: "Бастауыш",
    duration: "8 апта",
    students: "2,500+",
    rating: "4.9",
    price: "49,990 ₸",
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
    language: "Қазақ/Орыс",
    videoUrl: "https://www.youtube.com/embed/kqtD5dpn9C8",
    videoType: "embed",
    instructor: {
      name: "Асхат Нұрланов",
      title: "Senior Python Developer",
      experience: "10+ жыл тәжірибе",
      students: "5,000+",
      courses: "12",
      rating: "4.9",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
      bio: "Google және Microsoft компанияларында жұмыс тәжірибесі бар Python маманы",
    },
    syllabus: [
      {
        week: "1-апта",
        title: "Python-ға кіріспе",
        lessons: [
          "Python орнату және конфигурация",
          "Алғашқы бағдарлама: Hello World",
          "Айнымалылар және деректер түрлері",
          "Пернетақта арқылы мәліметтерді енгізу",
        ],
      },
      {
        week: "2-апта",
        title: "Басқару құрылымдары",
        lessons: [
          "IF операторлары және шарттар",
          "Циклдар: for және while",
          "Функциялар жасау",
          "Модульдермен жұмыс",
        ],
      },
      {
        week: "3-апта",
        title: "Деректер құрылымдары",
        lessons: [
          "Тізімдер (Lists)",
          "Сөздіктер (Dictionaries)",
          "Кортеждер (Tuples)",
          "Жиындар (Sets)",
        ],
      },
      {
        week: "4-апта",
        title: "Файлдармен жұмыс",
        lessons: [
          "Файлдарды оқу және жазу",
          "JSON форматымен жұмыс",
          "CSV файлдарын өңдеу",
          "Қателерді басқару (Exception Handling)",
        ],
      },
    ],
    features: [
      "70+ видео сабақ",
      "Өмірлік қолжетімділік",
      "Сертификат",
      "Жеке менторлық қолдау",
      "Практикалық жобалар",
      "Қоғамдастық чаты",
    ],
    materials: [
      {
        name: "python-basics-roadmap.pdf",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        type: "application/pdf",
        sizeLabel: "PDF",
      },
    ],
  },
  {
    id: "data-science",
    title: "Data Science Masterclass",
    description: "Machine Learning және AI технологияларын меңгеріп, нақты дата-кейстермен жұмыс істеңіз.",
    level: "Орташа",
    duration: "12 апта",
    students: "1,800+",
    rating: "4.8",
    price: "89,990 ₸",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    language: "Қазақ/Орыс/Ағылшын",
    videoUrl: "https://www.youtube.com/embed/ua-CiDNNj30",
    videoType: "embed",
    instructor: {
      name: "Айгерім Сапарова",
      title: "Lead Data Scientist",
      experience: "8+ жыл тәжірибе",
      students: "3,200+",
      courses: "8",
      rating: "4.8",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
      bio: "Fintech және HealthTech салаларында ML жобаларын іске асырған сарапшы",
    },
    syllabus: defaultSyllabus,
    features: [
      "60+ практикалық тапсырма",
      "Jupyter notebook шаблондары",
      "Portfolio жобалар",
      "Ментормен кері байланыс",
      "Сертификат",
      "Карьерлік кеңес",
    ],
    materials: [],
  },
  {
    id: "web-dev",
    title: "Python Web Development",
    description: "Django және Flask фреймворктарымен заманауи веб қосымшалар жасаңыз.",
    level: "Орташа",
    duration: "10 апта",
    students: "2,100+",
    rating: "4.9",
    price: "69,990 ₸",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    language: "Қазақ/Орыс",
    videoUrl: "https://www.youtube.com/embed/F5mRW0jo-U4",
    videoType: "embed",
    instructor: {
      name: "Тимур Өмірзақов",
      title: "Backend Architect",
      experience: "9+ жыл тәжірибе",
      students: "4,100+",
      courses: "10",
      rating: "4.9",
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      bio: "SaaS платформаларға архитектура құрып жүрген Python backend маманы",
    },
    syllabus: defaultSyllabus,
    features: [
      "Django және Flask",
      "REST API жобалары",
      "Auth және deployment",
      "Код ревью",
      "Практикалық sprint",
      "Сертификат",
    ],
    materials: [],
  },
  {
    id: "automation",
    title: "Python Automation & Scripting",
    description: "Күнделікті тапсырмаларды автоматтандырып, жұмыс өнімділігін бірнеше есе арттырыңыз.",
    level: "Бастауыш",
    duration: "6 апта",
    students: "3,200+",
    rating: "4.7",
    price: "39,990 ₸",
    image:
      "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&q=80",
    language: "Қазақ/Орыс",
    videoUrl: "https://www.youtube.com/embed/PXMJ6FS7llk",
    videoType: "embed",
    instructor: {
      name: "Нұрлан Бектасов",
      title: "Automation Engineer",
      experience: "7+ жыл тәжірибе",
      students: "2,700+",
      courses: "6",
      rating: "4.7",
      image:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80",
      bio: "QA automation мен business process automation бағытында жұмыс істейді",
    },
    syllabus: defaultSyllabus,
    features: [
      "Scraping және bots",
      "Excel/PDF автоматизациясы",
      "Cron және scheduling",
      "Жұмысқа дайын скрипттер",
      "Чат қолдау",
      "Сертификат",
    ],
    materials: [],
  },
  {
    id: "advanced-python",
    title: "Advanced Python Programming",
    description: "Кешенді архитектуралар, concurrency және оптимизация әдістерін меңгеріңіз.",
    level: "Жоғары",
    duration: "14 апта",
    students: "950+",
    rating: "4.9",
    price: "99,990 ₸",
    image:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80",
    language: "Ағылшын/Орыс",
    videoUrl: "https://www.youtube.com/embed/HGOBQPFzWKo",
    videoType: "embed",
    instructor: {
      name: "Сауле Жақсылықова",
      title: "Principal Software Engineer",
      experience: "12+ жыл тәжірибе",
      students: "1,900+",
      courses: "5",
      rating: "4.9",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
      bio: "Distributed systems және performance engineering бойынша кең тәжірибесі бар",
    },
    syllabus: defaultSyllabus,
    features: [
      "Async және multithreading",
      "Performance profiling",
      "Clean architecture",
      "System design",
      "Code review sessions",
      "Advanced certificate",
    ],
    materials: [],
  },
  {
    id: "ai-ml",
    title: "AI & Machine Learning Bootcamp",
    description: "Нейрондық желілер мен deep learning технологияларын жобалар арқылы үйреніңіз.",
    level: "Жоғары",
    duration: "16 апта",
    students: "1,400+",
    rating: "4.8",
    price: "119,990 ₸",
    image:
      "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80",
    language: "Ағылшын/Орыс",
    videoUrl: "https://www.youtube.com/embed/aircAruvnKk",
    videoType: "embed",
    instructor: {
      name: "Гүлнара Мұратова",
      title: "AI Research Engineer",
      experience: "9+ жыл тәжірибе",
      students: "2,300+",
      courses: "7",
      rating: "4.8",
      image:
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
      bio: "Computer vision және NLP жобаларын стартаптар мен enterprise ортада жүргізген",
    },
    syllabus: defaultSyllabus,
    features: [
      "Neural networks fundamentals",
      "PyTorch жобалары",
      "Model deployment",
      "Capstone project",
      "Mentor sessions",
      "Certificate",
    ],
    materials: [],
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function slugifyCourseTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getStoredCourses(): Course[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(COURSES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Course[]) : [];
  } catch {
    return [];
  }
}

export function getAllCourses(): Course[] {
  return [...baseCourses, ...getStoredCourses()];
}

export function getCourseById(id?: string) {
  return getAllCourses().find((course) => course.id === id);
}

export function saveCustomCourse(course: Course) {
  if (!canUseStorage()) {
    return;
  }

  const storedCourses = getStoredCourses();
  const nextCourses = [course, ...storedCourses.filter((item) => item.id !== course.id)];
  localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(nextCourses));
  window.dispatchEvent(new Event("courses-updated"));
}
