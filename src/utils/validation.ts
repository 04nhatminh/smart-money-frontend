export function validateLogin(email: string, password: string) {
  if (!email) return "Email is required";
  if (!email.includes("@")) return "Invalid email";
  if (!password) return "Password is required";
  if (password.length < 6) return "Password too short";
  return null;
}