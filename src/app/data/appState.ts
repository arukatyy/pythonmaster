import type { Course } from "./courses";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
  createdAt: string;
};

export type CartItem = {
  courseId: string;
  title: string;
  price: string;
  image: string;
  addedAt: string;
};

export type EnrollmentItem = {
  courseId: string;
  title: string;
  instructor: string;
  thumbnail: string;
  progress: number;
  currentLessonIndex: number;
  totalLessons: number;
  lastOpenedAt: string;
};

export type PurchaseItem = {
  courseId: string;
  title: string;
  price: string;
  purchasedAt: string;
};

export type AdminSettings = {
  platformName: string;
  supportEmail: string;
  allowRegistrations: boolean;
  maintenanceMode: boolean;
};

const CART_KEY = "cart";
const ENROLLMENTS_KEY = "enrollments";
const PURCHASES_KEY = "purchases";
const NOTIFICATIONS_KEY = "notifications";
const ADMIN_SETTINGS_KEY = "admin-settings";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function dispatchStateUpdate(eventName: string) {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(eventName));
}

export function getCartItems() {
  return read<CartItem[]>(CART_KEY, []);
}

export function addToCart(course: Course) {
  const cart = getCartItems();
  if (cart.some((item) => item.courseId === course.id)) {
    return false;
  }

  cart.unshift({
    courseId: course.id,
    title: course.title,
    price: course.price,
    image: course.image,
    addedAt: new Date().toISOString(),
  });

  write(CART_KEY, cart);
  dispatchStateUpdate("cart-updated");
  return true;
}

export function removeFromCart(courseId: string) {
  const nextCart = getCartItems().filter((item) => item.courseId !== courseId);
  write(CART_KEY, nextCart);
  dispatchStateUpdate("cart-updated");
}

export function getEnrollments() {
  return read<EnrollmentItem[]>(ENROLLMENTS_KEY, []);
}

export function saveEnrollments(items: EnrollmentItem[]) {
  write(ENROLLMENTS_KEY, items);
  dispatchStateUpdate("enrollments-updated");
}

export function enrollInCourse(course: Course) {
  const enrollments = getEnrollments();
  const totalLessons = course.syllabus.reduce((sum, week) => sum + week.lessons.length, 0);
  const existing = enrollments.find((item) => item.courseId === course.id);

  if (!existing) {
    enrollments.unshift({
      courseId: course.id,
      title: course.title,
      instructor: course.instructor.name,
      thumbnail: course.image,
      progress: 0,
      currentLessonIndex: 0,
      totalLessons,
      lastOpenedAt: new Date().toISOString(),
    });
    saveEnrollments(enrollments);
  }

  const purchases = read<PurchaseItem[]>(PURCHASES_KEY, []);
  if (!purchases.some((item) => item.courseId === course.id)) {
    purchases.unshift({
      courseId: course.id,
      title: course.title,
      price: course.price,
      purchasedAt: new Date().toISOString(),
    });
    write(PURCHASES_KEY, purchases);
  }

  removeFromCart(course.id);
  dispatchStateUpdate("purchases-updated");
}

export function updateEnrollmentProgress(courseId: string, currentLessonIndex: number) {
  const enrollments = getEnrollments().map((item) => {
    if (item.courseId !== courseId) return item;
    const safeIndex = Math.min(Math.max(currentLessonIndex, 0), Math.max(item.totalLessons - 1, 0));
    const completedLessons = Math.min(safeIndex + 1, item.totalLessons);
    return {
      ...item,
      currentLessonIndex: safeIndex,
      progress: item.totalLessons > 0 ? Math.round((completedLessons / item.totalLessons) * 100) : 0,
      lastOpenedAt: new Date().toISOString(),
    };
  });

  saveEnrollments(enrollments);
}

export function getNotifications() {
  return read<NotificationItem[]>(NOTIFICATIONS_KEY, []);
}

export function addNotification(notification: Omit<NotificationItem, "id" | "createdAt">) {
  const notifications = getNotifications();
  notifications.unshift({
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  write(NOTIFICATIONS_KEY, notifications.slice(0, 20));
  dispatchStateUpdate("notifications-updated");
}

export function clearNotifications() {
  write(NOTIFICATIONS_KEY, []);
  dispatchStateUpdate("notifications-updated");
}

export function getAdminSettings(): AdminSettings {
  return read<AdminSettings>(ADMIN_SETTINGS_KEY, {
    platformName: "PythonMaster",
    supportEmail: "support@pythonmaster.kz",
    allowRegistrations: true,
    maintenanceMode: false,
  });
}

export function saveAdminSettings(settings: AdminSettings) {
  write(ADMIN_SETTINGS_KEY, settings);
  dispatchStateUpdate("admin-settings-updated");
}
