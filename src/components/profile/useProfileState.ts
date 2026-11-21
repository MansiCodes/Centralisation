import { useState, useEffect, useRef } from "react";

export type ProfileMsg = { text: string; isError?: boolean } | null;

export function useProfileState() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarData, setAvatarData] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState<ProfileMsg>(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<ProfileMsg>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/central/profile")
      .then((res) => res.json())
      .then((d) => {
        if (!d.ok) return;
        setName(d.name || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setPreview(d.avatarUrl || null);
      })
      .catch(() => setInfoMsg({ text: "Failed to load profile", isError: true }))
      .finally(() => setLoading(false));
  }, []);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setInfoMsg({ text: "Image must be under 2MB", isError: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setPreview(res);
      setAvatarData(res);
      setInfoMsg(null);
    };
    reader.readAsDataURL(file);
  }

  function onRemovePhoto() {
    setPreview(null);
    setAvatarData(null);
    if (fileRef.current) fileRef.current.value = "";
    setInfoMsg(null);
  }

  async function onSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    setInfoMsg(null);
    try {
      const payload: Record<string, unknown> = { name, phone };
      if (avatarData !== undefined) payload.avatarUrl = avatarData;
      const res = await fetch("/api/central/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.message || "Failed to update profile");
      setInfoMsg({ text: "Profile updated successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setInfoMsg({ text: msg, isError: true });
    } finally {
      setSavingInfo(false);
    }
  }

  async function onSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: "New passwords do not match", isError: true });
      return;
    }
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      const res = await fetch("/api/central/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currentPassword: currentPwd, password: newPwd, confirmPassword: confirmPwd }),
      });
      const d = await res.json();
      if (!res.ok || !d.ok) throw new Error(d.message || "Failed to update password");
      setPwdMsg({ text: "Password changed successfully!" });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setPwdMsg({ text: msg, isError: true });
    } finally {
      setSavingPwd(false);
    }
  }

  const initial = (name || email || "U").trim().charAt(0).toUpperCase();

  return {
    name,
    setName,
    email,
    phone,
    setPhone,
    preview,
    loading,
    savingInfo,
    infoMsg,
    currentPwd,
    setCurrentPwd,
    newPwd,
    setNewPwd,
    confirmPwd,
    setConfirmPwd,
    savingPwd,
    pwdMsg,
    fileRef,
    initial,
    onPickFile,
    onRemovePhoto,
    onSaveInfo,
    onSavePassword,
  };
}
