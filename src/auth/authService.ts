import { loginApi } from "../api/auth.api";
import { tokenStorage } from "../storage/tokenStorage";
import { validateLogin } from "../utils/validation";

export async function login(email: string, password: string) {
  const error = validateLogin(email, password);
  if (error) {
    return { ok: false, message: error };
  }

  try {
    const res = await loginApi(email, password);

    await tokenStorage.setAccessToken(res.accessToken);
    await tokenStorage.setRefreshToken(res.refreshToken);

    return { ok: true };
  } catch (e: any) {
    return {
      ok: false,
      message: e?.response?.data?.message ?? "Login failed",
    };
  }
}