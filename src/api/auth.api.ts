import { http } from "./http";

export async function loginApi(email: string, password: string) {
  const res = await http.post("/auth/login", { email, password });
  return res.data;
}
