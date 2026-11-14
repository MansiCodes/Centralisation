export type CentralProfileSaveInput = {
  editName: string;
  editPassword: string;
  editConfirmPassword: string;
  avatarDraft: string | null;
};

export type CentralProfileSaveResult =
  | { ok: true; name: string; avatarUrl?: string | null }
  | { ok: false; message: string };

function validatePasswords(pwd: string, confirm: string): string | null {
  if (!pwd && !confirm) return null;
  if (pwd.length < 8) return "Password must be at least 8 characters";
  if (pwd !== confirm) return "Passwords do not match";
  return null;
}

export async function saveCentralProfile(
  input: CentralProfileSaveInput,
): Promise<CentralProfileSaveResult> {
  const pwd = input.editPassword.trim();
  const confirm = input.editConfirmPassword.trim();
  const pwdErr = validatePasswords(pwd, confirm);
  if (pwdErr) return { ok: false, message: pwdErr };

  try {
    const res = await fetch("/api/central/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: input.editName.trim(),
        password: pwd || "",
        confirmPassword: confirm || "",
        avatarUrl:
          input.avatarDraft === ""
            ? null
            : input.avatarDraft !== null
              ? input.avatarDraft
              : undefined,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      message?: string;
      name?: string;
      avatarUrl?: string | null;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, message: data.message || "Could not save profile" };
    }
    return {
      ok: true,
      name: data.name || input.editName.trim(),
      avatarUrl: data.avatarUrl,
    };
  } catch {
    return { ok: false, message: "Could not save profile" };
  }
}