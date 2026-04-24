export type SyllabusWeekLite = {
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

export type CourseQuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

type CourseForContent = {
  id?: string;
  title: string;
  level: string;
  duration: string;
  language: string;
  features: string[];
  syllabus: SyllabusWeekLite[];
};

function matchesTopic(course: CourseForContent, keywords: string[]) {
  const haystack = `${course.id ?? ""} ${course.title}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

const CYRILLIC_TO_LATIN_MAP: Record<string, string> = {
  А: "A", а: "a", Ә: "A", ә: "a", Б: "B", б: "b", В: "V", в: "v", Г: "G", г: "g",
  Ғ: "G", ғ: "g", Д: "D", д: "d", Е: "E", е: "e", Ё: "Yo", ё: "yo", Ж: "Zh", ж: "zh",
  З: "Z", з: "z", И: "I", и: "i", Й: "I", й: "i", К: "K", к: "k", Қ: "Q", қ: "q",
  Л: "L", л: "l", М: "M", м: "m", Н: "N", н: "n", Ң: "Ng", ң: "ng", О: "O", о: "o",
  Ө: "O", ө: "o", П: "P", п: "p", Р: "R", р: "r", С: "S", с: "s", Т: "T", т: "t",
  У: "U", у: "u", Ұ: "U", ұ: "u", Ү: "U", ү: "u", Ф: "F", ф: "f", Х: "H", х: "h",
  Һ: "H", һ: "h", Ц: "Ts", ц: "ts", Ч: "Ch", ч: "ch", Ш: "Sh", ш: "sh", Щ: "Sh", щ: "sh",
  Ъ: "", ъ: "", Ы: "Y", ы: "y", І: "I", і: "i", Ь: "", ь: "", Э: "E", э: "e",
  Ю: "Yu", ю: "yu", Я: "Ya", я: "ya",
};

function transliterateToAscii(value: string) {
  return value
    .split("")
    .map((char) => CYRILLIC_TO_LATIN_MAP[char] ?? char)
    .join("")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapText(text: string, maxLength = 82) {
  const words = transliterateToAscii(text).split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (!word) continue;
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxLength) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

function escapePdfText(text: string) {
  return text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function createPdfDataUrl(lines: string[]) {
  const pageLines = lines.flatMap((line) => wrapText(line));
  const contentStream = [
    "BT",
    "/F1 12 Tf",
    "50 790 Td",
    "18 TL",
    ...pageLines.map((line, index) => `${index === 0 ? "" : "T* " }(${escapePdfText(line)}) Tj`.trim()),
    "ET",
  ].join("\n");

  const streamLength = contentStream.length;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  pdf += offsets
    .slice(1)
    .map((offset) => `${offset.toString().padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return `data:application/pdf;base64,${toBase64(pdf)}`;
}

function slugifyFileName(value: string) {
  return transliterateToAscii(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createCourseMaterial(course: CourseForContent): CourseMaterial {
  const overviewLines = [
    `${course.title} course material`,
    "",
    `Level: ${transliterateToAscii(course.level) || "General"}`,
    `Duration: ${transliterateToAscii(course.duration) || "Flexible"}`,
    `Language: ${transliterateToAscii(course.language) || "Mixed"}`,
    "",
    "Learning modules:",
    ...course.syllabus.flatMap((week, index) => [
      `${index + 1}. ${transliterateToAscii(week.title) || `Module ${index + 1}`}`,
      ...week.lessons.map((lesson) => `   - ${transliterateToAscii(lesson) || "Practical lesson"}`),
    ]),
    "",
    "Course outcomes:",
    ...course.features.map((feature, index) => ` - ${index + 1}. ${transliterateToAscii(feature) || "Practical skill"}`),
    "",
    "Study recommendation:",
    "Read one module summary, watch the lesson, then complete one small hands-on exercise.",
  ];

  return {
    name: `${slugifyFileName(course.title) || "course"}-material.pdf`,
    url: createPdfDataUrl(overviewLines),
    type: "application/pdf",
    sizeLabel: "PDF материал",
  };
}

export function generateCourseQuiz(course: CourseForContent): CourseQuizQuestion[] {
  if (matchesTopic(course, ["python-basics"])) {
    return [
      {
        question: "Python тілінде экранға мәтін шығару үшін қай функция қолданылады?",
        options: ["print()", "echo()", "show()", "write()"],
        correctAnswer: 0,
        explanation: "Python-да экранға ақпарат шығару үшін print() функциясы қолданылады.",
      },
      {
        question: "Python-да айнымалыны дұрыс жазу үлгісі қайсы?",
        options: ["name = 'Aruzhan'", "string name = 'Aruzhan'", "var:name = 'Aruzhan'", "name :=: 'Aruzhan'"],
        correctAnswer: 0,
        explanation: "Python-да айнымалы типін алдын ала жазбай, name = value түрінде беріледі.",
      },
      {
        question: "Төмендегілердің қайсысы Python-дағы тізім?",
        options: ["[1, 2, 3]", "{1, 2, 3}", "(1, 2, 3)", "<1, 2, 3>"],
        correctAnswer: 0,
        explanation: "List квадрат жақшамен жазылады: [1, 2, 3].",
      },
      {
        question: "Python-да шарт тексеруге қай оператор қолданылады?",
        options: ["if", "for", "def", "import"],
        correctAnswer: 0,
        explanation: "Шартты тексеру үшін if операторы қолданылады.",
      },
      {
        question: "for циклы көбіне не үшін қолданылады?",
        options: ["Қайталанатын әрекеттерді орындау үшін", "Файлды жою үшін", "Экран түсін өзгерту үшін", "Бағдарламаны жабу үшін"],
        correctAnswer: 0,
        explanation: "for циклы бір әрекетті бірнеше рет қайталап орындауға көмектеседі.",
      },
      {
        question: "Функцияны анықтау үшін Python-да қай кілтсөз жазылады?",
        options: ["def", "func", "function", "lambda_def"],
        correctAnswer: 0,
        explanation: "Python-да функция def кілтсөзімен анықталады.",
      },
      {
        question: "Python-да сөздік (dictionary) қандай жақшамен жазылады?",
        options: ["{}", "[]", "()", "<>"],
        correctAnswer: 0,
        explanation: "Dictionary фигуралы жақшамен жазылады.",
      },
      {
        question: "Файлды оқу үшін жиі қолданылатын әдіс қайсы?",
        options: ["open()", "readfile()", "load()", "scan()"],
        correctAnswer: 0,
        explanation: "Python-да файлмен жұмыс open() арқылы басталады.",
      },
      {
        question: "Қате өңдеу блогында қай кілтсөз қолданылады?",
        options: ["except", "error", "catch", "fail"],
        correctAnswer: 0,
        explanation: "Python-да exception өңдеу үшін try/except құрылымы қолданылады.",
      },
      {
        question: "Python-дағы 'Hello World' мысалының дұрыс нұсқасы қайсы?",
        options: ["print('Hello World')", "echo('Hello World')", "console.log('Hello World')", "System.out('Hello World')"],
        correctAnswer: 0,
        explanation: "Python-да мәтін шығару print('Hello World') арқылы орындалады.",
      },
    ];
  }

  if (matchesTopic(course, ["data-science", "data science"])) {
    return [
      {
        question: "Data Science жобаларында кестелік деректермен жұмыс істеуге ең жиі қай кітапхана қолданылады?",
        options: ["pandas", "pygame", "tkinter", "requests"],
        correctAnswer: 0,
        explanation: "pandas кестелік деректерді талдауда ең кең қолданылатын кітапханалардың бірі.",
      },
      {
        question: "График салуға жиі қолданылатын кітапхана қайсы?",
        options: ["matplotlib", "flask", "fastapi", "pytest"],
        correctAnswer: 0,
        explanation: "matplotlib деректер визуализациясы үшін қолданылады.",
      },
      {
        question: "Machine Learning моделін үйрету үшін қай кітапхана жиі пайдаланылады?",
        options: ["scikit-learn", "beautifulsoup", "selenium", "sqlite3"],
        correctAnswer: 0,
        explanation: "scikit-learn классикалық ML модельдерін құруда танымал.",
      },
      {
        question: "Dataset дегеніміз не?",
        options: ["Талдауға арналған деректер жиыны", "Тек бір ғана формула", "Тек сурет редакторы", "Веб-сайттың мәзірі"],
        correctAnswer: 0,
        explanation: "Dataset дегеніміз талдау немесе модель үйрету үшін қолданылатын деректер жиыны.",
      },
      {
        question: "Missing values дегеніміз не?",
        options: ["Жетпейтін немесе бос мәндер", "Тек дұрыс жауаптар", "Тек суреттер", "Кодтағы комментарийлер"],
        correctAnswer: 0,
        explanation: "Missing values кестедегі бос немесе белгісіз ұяшық мәндерін білдіреді.",
      },
      {
        question: "Train/test split не үшін керек?",
        options: ["Модельді үйрету және тексеру үшін деректі бөлуге", "Файл атауын өзгертуге", "Суретті үлкейтуге", "Пароль құруға"],
        correctAnswer: 0,
        explanation: "Деректі train және test бөлігіне бөлу модель сапасын тексеруге көмектеседі.",
      },
      {
        question: "Classification міндеті нені болжайды?",
        options: ["Санат немесе класс", "Тек ұзындықты", "Тек файл көлемін", "Тек түсті"],
        correctAnswer: 0,
        explanation: "Classification белгілі бір классқа жататынын анықтайды.",
      },
      {
        question: "Regression міндеті нені болжайды?",
        options: ["Сандық мәнді", "Тек мәтінді", "Тек сурет форматын", "Тек батырма орнын"],
        correctAnswer: 0,
        explanation: "Regression үздіксіз сандық мәндерді болжауға арналған.",
      },
      {
        question: "Jupyter Notebook не үшін ыңғайлы?",
        options: ["Код, мәтін және графикті бірге жүргізуге", "Тек ойын ойнауға", "Тек видео монтажға", "Тек сервер өшіруге"],
        correctAnswer: 0,
        explanation: "Jupyter Notebook анализ, түсіндірме және визуализацияны бір жерде біріктіреді.",
      },
      {
        question: "Feature дегеніміз не?",
        options: ["Модельге берілетін белгі немесе баған", "Тек қате хабарламасы", "Тек дизайн элементі", "Тек пароль түрі"],
        correctAnswer: 0,
        explanation: "Feature дегеніміз модель қолданатын кіріс белгісі.",
      },
    ];
  }

  if (matchesTopic(course, ["web-dev", "web development", "django", "flask"])) {
    return [
      {
        question: "Django мен Flask негізінен не үшін қолданылады?",
        options: ["Веб-қосымша жасау үшін", "Видео монтаж үшін", "3D модель салу үшін", "Антивирус жазу үшін"],
        correctAnswer: 0,
        explanation: "Django және Flask Python-дағы веб-фреймворктар.",
      },
      {
        question: "Django-да URL-дарды өңдеуге қай бөлік жауап береді?",
        options: ["routing/urls", "styles.css", "README", "package-lock"],
        correctAnswer: 0,
        explanation: "Django-да маршруттар urls конфигурациясында жазылады.",
      },
      {
        question: "Flask-та қарапайым маршрут жасау үшін не қолданылады?",
        options: ["@app.route()", "@flask.url()", "@page.open()", "@server.path()"],
        correctAnswer: 0,
        explanation: "Flask маршруттары көбіне @app.route() декораторымен жазылады.",
      },
      {
        question: "Backend дегеніміз не?",
        options: ["Сервер жағындағы логика", "Тек батырма түсі", "Тек шрифт таңдауы", "Тек баннер суреті"],
        correctAnswer: 0,
        explanation: "Backend серверлік логика, дерекқор және API-мен жұмыс істейді.",
      },
      {
        question: "REST API не үшін керек?",
        options: ["Клиент пен сервер арасында дерек алмасу үшін", "Тек PDF басып шығару үшін", "Тек фото өңдеу үшін", "Тек пароль сақтау үшін"],
        correctAnswer: 0,
        explanation: "REST API клиент пен сервердің байланысын ұйымдастырады.",
      },
      {
        question: "HTTP GET сұранысы көбіне не істейді?",
        options: ["Дерек алады", "Дерек өшіреді", "Серверді тоқтатады", "Кодты архивтейді"],
        correctAnswer: 0,
        explanation: "GET әдетте серверден дерек оқу үшін қолданылады.",
      },
      {
        question: "HTTP POST сұранысы көбіне не істейді?",
        options: ["Жаңа дерек жібереді", "Тек стильді өзгертеді", "Тек экранды жаңартады", "Тек таймер қосады"],
        correctAnswer: 0,
        explanation: "POST серверге жаңа дерек жіберу үшін қолданылады.",
      },
      {
        question: "Authentication не үшін қажет?",
        options: ["Пайдаланушыны тексеру үшін", "Тек түсті өзгерту үшін", "Тек фото үлкейту үшін", "Тек дыбыс қосу үшін"],
        correctAnswer: 0,
        explanation: "Authentication жүйеге кім кіріп жатқанын тексереді.",
      },
      {
        question: "Database не сақтайды?",
        options: ["Қолданба деректерін", "Тек анимацияны", "Тек видео эффектті", "Тек тышқан қозғалысын"],
        correctAnswer: 0,
        explanation: "Database қолданбадағы мәліметтерді сақтайды.",
      },
      {
        question: "Deployment дегеніміз не?",
        options: ["Қосымшаны серверге жариялау", "Тек кодты бояу", "Тек қате жасыру", "Тек файл атын қысқарту"],
        correctAnswer: 0,
        explanation: "Deployment дайын жобаны серверге шығару процесі.",
      },
    ];
  }

  if (matchesTopic(course, ["automation", "scripting"])) {
    return [
      {
        question: "Python automation не үшін пайдалы?",
        options: ["Қайталанатын тапсырмаларды автоматтандыру үшін", "Тек сурет салу үшін", "Тек музыка тыңдау үшін", "Тек интернет жылдамдату үшін"],
        correctAnswer: 0,
        explanation: "Automation күнделікті қайталанатын жұмысты жеңілдетеді.",
      },
      {
        question: "Файлдармен автоматты жұмыс істеуге қай модуль жиі қолданылады?",
        options: ["os", "random-color", "video-edit", "paint"],
        correctAnswer: 0,
        explanation: "os модулі файлдар мен жүйелік жолдармен жұмысқа көмектеседі.",
      },
      {
        question: "Кестемен жұмыс автоматизациясында қай кітапхана жиі қолданылады?",
        options: ["openpyxl", "pygame", "flask", "pydub"],
        correctAnswer: 0,
        explanation: "openpyxl Excel файлдарымен жұмыс істеуге кең қолданылады.",
      },
      {
        question: "PDF-пен автоматты жұмыс үшін не қолдануға болады?",
        options: ["PyPDF2", "tkinter only", "matplotlib only", "sqlite only"],
        correctAnswer: 0,
        explanation: "PyPDF2 PDF файлдарды оқу не біріктіру сияқты жұмыстарға жарайды.",
      },
      {
        question: "Web scraping мақсаты қандай?",
        options: ["Сайттан ақпарат жинау", "Компьютерді форматтау", "Монитор жарығын өзгерту", "Тек принтерді қосу"],
        correctAnswer: 0,
        explanation: "Web scraping веб-беттен дерек алуға көмектеседі.",
      },
      {
        question: "BeautifulSoup не үшін қолданылады?",
        options: ["HTML талдау үшін", "Видео салу үшін", "Ойын жасау үшін", "Антивирус орнату үшін"],
        correctAnswer: 0,
        explanation: "BeautifulSoup HTML құрылымынан қажетті деректерді алуға ыңғайлы.",
      },
      {
        question: "Cron немесе scheduler не үшін керек?",
        options: ["Скриптті белгілі уақытта автоматты іске қосу үшін", "Экран түсін ауыстыру үшін", "Фотоны айналдыру үшін", "Дыбысты бәсеңдету үшін"],
        correctAnswer: 0,
        explanation: "Scheduler тапсырманы уақыт бойынша автоматты орындайды.",
      },
      {
        question: "requests кітапханасы не істейді?",
        options: ["HTTP сұраныстар жібереді", "Тек шрифт орнатады", "Тек кесте бояйды", "Тек тышқанды жылжытады"],
        correctAnswer: 0,
        explanation: "requests API немесе веб-сайттарға сұраныс жіберуге арналған.",
      },
      {
        question: "Автоматтандырудың басты артықшылығы қайсы?",
        options: ["Уақыт үнемдеу", "Компьютер салмағын азайту", "Экран көлемін үлкейту", "Интернет кабелін қысқарту"],
        correctAnswer: 0,
        explanation: "Automation уақытты үнемдеп, қателікті азайтады.",
      },
      {
        question: "Скрипт дегеніміз не?",
        options: ["Белгілі бір тапсырманы орындайтын шағын бағдарлама", "Тек сурет форматы", "Тек кесте түсі", "Тек батырма атауы"],
        correctAnswer: 0,
        explanation: "Скрипт нақты жұмысты автоматтандыруға арналған бағдарлама.",
      },
    ];
  }

  if (matchesTopic(course, ["advanced-python", "advanced python"])) {
    return [
      {
        question: "Async programming Python-да не үшін қолданылады?",
        options: ["Күтуі көп операцияларды тиімді орындау үшін", "Тек фото сақтау үшін", "Тек түсті ауыстыру үшін", "Тек принтер баптау үшін"],
        correctAnswer: 0,
        explanation: "Async I/O күтуі бар операцияларда өнімділікті арттырады.",
      },
      {
        question: "Python-да async функция қалай басталады?",
        options: ["async def", "def async", "function async", "await def"],
        correctAnswer: 0,
        explanation: "Асинхрон функция async def арқылы жазылады.",
      },
      {
        question: "await не үшін керек?",
        options: ["Асинхрон операцияның аяқталуын күту үшін", "Айнымалы атауын қысқарту үшін", "Қатені жасыру үшін", "Файлды архивтеу үшін"],
        correctAnswer: 0,
        explanation: "await асинхрон нәтижені күту үшін қолданылады.",
      },
      {
        question: "Profiling мақсаты қандай?",
        options: ["Кодтың баяу жерлерін табу", "Тек түс таңдау", "Тек логин өзгерту", "Тек мәтінді қалыңдату"],
        correctAnswer: 0,
        explanation: "Profiling өнімділік мәселелерін анықтайды.",
      },
      {
        question: "Clean architecture неге көмектеседі?",
        options: ["Кодты құрылымды және қолдауға ыңғайлы етуге", "Тек суретті қысуға", "Тек пароль жасауға", "Тек интернет өшіруге"],
        correctAnswer: 0,
        explanation: "Жақсы архитектура кодты кеңейту мен тестілеуді жеңілдетеді.",
      },
      {
        question: "Multithreading көбіне не үшін пайдалы?",
        options: ["Бірнеше ағынмен қатар жұмыс істеуге", "Тек бір батырма салуға", "Тек фонды бояуға", "Тек PDF атауын өзгертуге"],
        correctAnswer: 0,
        explanation: "Multithreading кейбір параллель жұмыстарда пайдалы болады.",
      },
      {
        question: "Concurrency нені білдіреді?",
        options: ["Бірнеше жұмысты қатар басқару", "Тек бір функция жазу", "Тек бір файл ашу", "Тек бір түсті қолдану"],
        correctAnswer: 0,
        explanation: "Concurrency бірнеше процесті не тапсырманы қатар жүргізуді білдіреді.",
      },
      {
        question: "Optimization мақсаты қандай?",
        options: ["Кодты жылдам әрі тиімді ету", "Тек мәтінді үлкейту", "Тек URL қысқарту", "Тек фон қоюлату"],
        correctAnswer: 0,
        explanation: "Optimization ресурсты аз қолданып, өнімділікті жақсартады.",
      },
      {
        question: "System design дегеніміз не?",
        options: ["Жүйенің жалпы архитектурасын жоспарлау", "Тек иконка салу", "Тек түс палитрасын таңдау", "Тек шрифт орнату"],
        correctAnswer: 0,
        explanation: "System design жүйенің компоненттері қалай жұмыс істейтінін анықтайды.",
      },
      {
        question: "Code review не үшін маңызды?",
        options: ["Қателерді ерте табу және сапаны арттыру үшін", "Тек курс бағасын өзгерту үшін", "Тек видео қою үшін", "Тек сурет көшіру үшін"],
        correctAnswer: 0,
        explanation: "Code review сапаны жақсартып, тәуекелді азайтады.",
      },
    ];
  }

  if (matchesTopic(course, ["ai-ml", "machine learning", "ai "])) {
    return [
      {
        question: "Machine Learning дегеніміз не?",
        options: ["Деректер арқылы үлгі үйрету тәсілі", "Тек сурет салу әдісі", "Тек сайт безендіру құралы", "Тек архивтеу форматы"],
        correctAnswer: 0,
        explanation: "Machine Learning модельге деректерден заңдылық үйретеді.",
      },
      {
        question: "Neural network негізінен неден тұрады?",
        options: ["Қабаттар мен нейрондардан", "Тек батырмалардан", "Тек PDF беттерінен", "Тек папкалардан"],
        correctAnswer: 0,
        explanation: "Нейрондық желі бірнеше қабат пен нейроннан құралады.",
      },
      {
        question: "Deep Learning қай ұғыммен тығыз байланысты?",
        options: ["Көпқабатты нейрондық желілер", "Тек HTML беттері", "Тек Excel формулалары", "Тек ZIP архивтері"],
        correctAnswer: 0,
        explanation: "Deep Learning нейрондық желілердің терең құрылымдарына сүйенеді.",
      },
      {
        question: "PyTorch не үшін қолданылады?",
        options: ["AI/ML модельдерін құру және үйрету үшін", "Тек музыка тыңдау үшін", "Тек принтер қосу үшін", "Тек браузер жаңарту үшін"],
        correctAnswer: 0,
        explanation: "PyTorch нейрондық желілерді жасауға арналған танымал фреймворк.",
      },
      {
        question: "Model training дегеніміз не?",
        options: ["Модель параметрлерін дерекпен үйрету", "Тек папка атын өзгерту", "Тек түсті баптау", "Тек экранды тазалау"],
        correctAnswer: 0,
        explanation: "Training кезінде модель деректен үйренеді.",
      },
      {
        question: "Computer Vision немен байланысты?",
        options: ["Сурет пен видеоны талдаумен", "Тек мәтін аудармасымен", "Тек дыбыс азайтумен", "Тек пароль сақтаумен"],
        correctAnswer: 0,
        explanation: "Computer Vision визуалды деректерді өңдейді.",
      },
      {
        question: "NLP қысқартуы нені білдіреді?",
        options: ["Natural Language Processing", "New Logic Program", "Native Layout Package", "Network Link Protocol"],
        correctAnswer: 0,
        explanation: "NLP адамның тілін өңдеу саласын білдіреді.",
      },
      {
        question: "Overfitting дегеніміз не?",
        options: ["Модельдің train дерегіне тым қатты бейімделуі", "Тек файл көлемінің үлкеюі", "Тек экран бұзылуы", "Тек кесте жойылуы"],
        correctAnswer: 0,
        explanation: "Overfitting кезінде модель жаңа деректерде нашар жұмыс істеуі мүмкін.",
      },
      {
        question: "Inference дегеніміз не?",
        options: ["Үйретілген модельмен жаңа болжам жасау", "Тек кодты өшіру", "Тек видео кесу", "Тек сервер көшіру"],
        correctAnswer: 0,
        explanation: "Inference дайын модельді қолдану кезеңі.",
      },
      {
        question: "Model deployment дегеніміз не?",
        options: ["Модельді пайдалануға шығару", "Тек жоба атын өзгерту", "Тек экран түсін сақтау", "Тек локалды файл жою"],
        correctAnswer: 0,
        explanation: "Deployment модельді нақты жүйеде қолдануға мүмкіндік береді.",
      },
    ];
  }

  const firstWeek = course.syllabus[0];
  const secondWeek = course.syllabus[1];
  const firstLesson = firstWeek?.lessons[0] ?? "First lesson";
  const secondLesson = firstWeek?.lessons[1] ?? "Second lesson";
  const thirdLesson = secondWeek?.lessons[0] ?? "Core practice";
  const mainFeature = course.features[0] ?? "Practical projects";
  const secondFeature = course.features[1] ?? "Mentor feedback";
  const thirdFeature = course.features[2] ?? "Certificate";

  return [
    {
      question: `${course.title} курсы қай деңгейге арналған?`,
      options: [course.level, "Тек сарапшыларға", "Тек балаларға", "Тек офлайн оқуға"],
      correctAnswer: 0,
      explanation: `Бұл курс сипаттамасында деңгейі ${course.level} деп көрсетілген.`,
    },
    {
      question: `${course.title} курсының ұзақтығы қанша?`,
      options: [course.duration, "2 күн", "1 ай", "24 апта"],
      correctAnswer: 0,
      explanation: `Курс ұзақтығы ${course.duration} деп берілген.`,
    },
    {
      question: `Бұл курста қай тілдер қолданылады?`,
      options: [course.language, "Тек жапон тілі", "Тек неміс тілі", "Тек француз тілі"],
      correctAnswer: 0,
      explanation: `Курс тілі ${course.language} деп көрсетілген.`,
    },
    {
      question: `Бірінші модульдің басты тақырыбы қайсы?`,
      options: [
        firstWeek?.title ?? "Кіріспе модуль",
        secondWeek?.title ?? "Қорытынды модуль",
        "Тек емтихан",
        "Тек сертификат жүктеу",
      ],
      correctAnswer: 0,
      explanation: "Бірінші модуль курс бастауындағы негізгі тақырыпты ашады.",
    },
    {
      question: `Алғашқы сабақтардың бірі қайсы?`,
      options: [firstLesson, "Жалақы келісімі", "Маркетинг жоспарлау", "Офис интерьері"],
      correctAnswer: 0,
      explanation: "Бұл курс жоспарының алғашқы сабағының бірі.",
    },
    {
      question: `Курс басында тағы бір қандай бөлім өтеді?`,
      options: [secondLesson, "Компания тіркеу", "Салық есебі", "Банк аудиті"],
      correctAnswer: 0,
      explanation: "Бұл да алғашқы модульдегі негізгі сабақтардың бірі.",
    },
    {
      question: `Келесі модульдердегі практикалық тақырыптың мысалы қайсы?`,
      options: [thirdLesson, "Ас мәзірі құрастыру", "Туристік виза алу", "Спорт жарысын өткізу"],
      correctAnswer: 0,
      explanation: "Бұл курс мазмұнына тікелей кіретін практикалық тақырып.",
    },
    {
      question: `Курс артықшылықтарының бірі қайсы?`,
      options: [mainFeature, "Тек қағаз кітап", "Міндетті офлайн жатақхана", "Тек телефонсыз оқу"],
      correctAnswer: 0,
      explanation: "Бұл мүмкіндік курс артықшылықтары бөлімінде берілген.",
    },
    {
      question: `Қосымша қандай мүмкіндік қарастырылған?`,
      options: [secondFeature, "Тек бір күндік қатынау", "Кірусіз қарау", "Мазмұнсыз файл"],
      correctAnswer: 0,
      explanation: "Бұл да курстың маңызды қосымша мүмкіндіктерінің бірі.",
    },
    {
      question: `Оқу соңында студентке не берілуі мүмкін?`,
      options: [thirdFeature, "Тек қағаз түбіртек", "Тек жарнама парағы", "Ешқандай нәтиже жоқ"],
      correctAnswer: 0,
      explanation: "Курс соңындағы нәтиже ретінде осы мүмкіндік көрсетілген.",
    },
  ];
}
