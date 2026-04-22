export type ApiUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  course: string;
  progress: number;
  status: "active" | "inactive";
  role: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegisterUserInput = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:4000";

type ApiResponse<T> = {
  ok: boolean;
  message?: string;
} & T;

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Серверден жауап алу мүмкін болмады");
  }

  return payload;
}

export async function fetchUsers() {
  const payload = await request<{ users: ApiUser[] }>("/api/users");
  return payload.users;
}

export async function registerUser(input: RegisterUserInput) {
  const payload = await request<{ user: ApiUser }>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });

  window.dispatchEvent(new Event("users-updated"));
  return payload.user;
}

export async function updateUserPassword(userId: number, password: string) {
  const payload = await request<{ user: ApiUser }>(`/api/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });

  return payload.user;
}
