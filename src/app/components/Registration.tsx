import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { UserCircle, Mail, Phone, CheckCircle2, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { addNotification, getAdminSettings } from "../data/appState";
import { registerUser } from "../data/usersApi";

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type StoredUser = FormData & {
  id: number;
  createdAt: string;
};

const initialFormData: FormData = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasNumberRegex = /\d/;

export function Registration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case "fullName":
        return value.trim() ? "" : "Аты-жөніңізді енгізіңіз";
      case "email":
        if (!value.trim()) return "Email енгізіңіз";
        return emailRegex.test(value) ? "" : "Email форматы қате";
      case "phone":
        if (!value.trim()) return "Телефон нөмірін енгізіңіз";
        return /^\d{11}$/.test(value)
          ? ""
          : "Телефон тек 11 цифрдан тұруы керек";
      case "password":
        if (!value) return "Пароль енгізіңіз";
        if (value.length < 6) return "Пароль кемінде 6 символ болуы керек";
        return hasNumberRegex.test(value)
          ? ""
          : "Парольде кемінде 1 сан болуы керек";
      default:
        return "";
    }
  };

  const validateForm = (): FormErrors => {
    return {
      fullName: validateField("fullName", formData.fullName),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      password: validateField("password", formData.password),
    };
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const settings = getAdminSettings();
    if (!settings.allowRegistrations) {
      toast.error("Қазір жаңа тіркелу уақытша өшірілген");
      return;
    }

    const nextErrors = validateForm();
    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      toast.error("Формада қателер бар. Тексеріп көріңіз.");
      return;
    }

    try {
      const createdUser = await registerUser(formData);
      const newUser: StoredUser = {
        ...formData,
        id: createdUser.id,
        createdAt: createdUser.createdAt,
      };

      localStorage.setItem("currentUser", JSON.stringify(newUser));
      addNotification({
        title: "Жаңа тіркелу",
        message: `${formData.fullName} платформаға тіркелді`,
        type: "success",
      });

      setSubmitted(true);
      toast.success("Сәтті тіркелдіңіз");

      setTimeout(() => {
        navigate("/profile");
      }, 1800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Тіркелу кезінде қате болды";
      toast.error(message);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    const nextValue = fieldName === "phone" ? value.replace(/\D/g, "").slice(0, 11) : value;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: nextValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [fieldName]: validateField(fieldName, nextValue),
    }));
  };

  const getInputClassName = (field: keyof FormData) =>
    `w-full rounded-lg border bg-card py-4 pl-12 pr-4 text-foreground outline-none transition-colors placeholder:text-muted-foreground ${
      errors[field] ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
    }`;

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mb-4 text-3xl font-bold">Тіркеу сәтті өтті!</h2>
          <p className="mb-6 text-muted-foreground">Сіздің профиліңізге өтеміз...</p>
          <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.8 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-20">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Python әлеміне <span className="text-primary">қош келдіңіз</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Тіркелу үшін мәліметтеріңізді енгізіңіз
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-8 md:p-12"
        >
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="fullName" className="mb-2 block text-sm font-semibold">
                Толық аты-жөні
              </label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Мысалы: Асхат Нұрланов"
                  className={getInputClassName("fullName")}
                />
              </div>
              {errors.fullName && <p className="mt-2 text-sm text-red-400">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                Email мекенжайы
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  className={getInputClassName("email")}
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-semibold">
                Телефон нөмірі
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="87011234567"
                  className={getInputClassName("phone")}
                />
              </div>
              {errors.phone && <p className="mt-2 text-sm text-red-400">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Кемінде 6 символ және 1 сан"
                  className={getInputClassName("password")}
                />
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password}</p>}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 font-bold text-primary-foreground transition-all hover:bg-primary/90"
              >
                Тіркелу
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Тіркелу арқылы сіз{" "}
              <a href="#" className="text-primary hover:underline">
                Қызмет көрсету шарттарымен
              </a>{" "}
              және{" "}
              <a href="#" className="text-primary hover:underline">
                Құпиялылық саясатымен
              </a>{" "}
              келісесіз
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid gap-6 md:grid-cols-3"
        >
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground">Қолдау қызметі</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Ақша қайтару кепілдігі</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-primary">∞</div>
            <div className="text-sm text-muted-foreground">Өмірлік қолжетімділік</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
