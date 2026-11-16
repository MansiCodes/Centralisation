"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { LoginEmailForm } from "./LoginEmailForm";
import { LoginWhatsappOtpForm } from "./LoginWhatsappOtpForm";
import { LoginWhatsappPhoneForm } from "./LoginWhatsappPhoneForm";
import { type LoginMode, type WhatsappStep } from "./login-helpers";
import { useLoginFormEffects } from "./useLoginFormEffects";
import { createLoginFormHandlers } from "./login-form-handlers";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [mode, setMode] = useState<LoginMode>("whatsapp");
  const [whatsappStep, setWhatsappStep] = useState<WhatsappStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);

  useLoginFormEffects(otpExpiresAt, setOtpSecondsLeft, setRememberMe);

  function switchMode(next: LoginMode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setDevOtp(null);
    if (next === "whatsapp") {
      setWhatsappStep("phone");
      setOtp("");
      setOtpExpiresAt(null);
    }
  }

  const { onSendOtp, onWhatsappLogin, onEmailSubmit } = createLoginFormHandlers({
    t,
    router,
    phone,
    otp,
    email,
    password,
    rememberMe,
    otpSecondsLeft,
    setError,
    setInfo,
    setLoading,
    setSendingOtp,
    setWhatsappStep,
    setOtp,
    setOtpExpiresAt,
    setDevOtp,
  });

  return (
    <section className="login-form-panel">
      <div className="login-form-card">
        <div className="login-form-card__top">
          <div className="login-form-card__intro">
            <h2>{t("welcomeBack")}</h2>
            <p className="lead">{t("signInLead")}</p>
          </div>
          <div className="login-form-card__lang">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="login-mode-tabs" role="tablist" aria-label={t("title")}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "whatsapp"}
            className={mode === "whatsapp" ? "is-active" : ""}
            onClick={() => switchMode("whatsapp")}
          >
            {t("whatsappLogin")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "email"}
            className={mode === "email" ? "is-active" : ""}
            onClick={() => switchMode("email")}
          >
            {t("emailLogin")}
          </button>
        </div>

        {error ? (
          <div className="alert alert--error" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}
        {info ? (
          <div className="alert alert--ok" role="status" aria-live="polite">
            {info}
          </div>
        ) : null}

        {mode === "whatsapp" ? (
          whatsappStep === "phone" ? (
            <LoginWhatsappPhoneForm
              phone={phone}
              setPhone={setPhone}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              sendingOtp={sendingOtp}
              onSendOtp={onSendOtp}
            />
          ) : (
            <LoginWhatsappOtpForm
              otp={otp}
              setOtp={setOtp}
              otpSecondsLeft={otpSecondsLeft}
              devOtp={devOtp}
              rememberMe={rememberMe}
              setRememberMe={setRememberMe}
              loading={loading}
              sendingOtp={sendingOtp}
              onWhatsappLogin={onWhatsappLogin}
              onChangeNumber={() => {
                setWhatsappStep("phone");
                setOtp("");
                setDevOtp(null);
                setOtpExpiresAt(null);
                setInfo(null);
                setError(null);
              }}
            />
          )
        ) : (
          <LoginEmailForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            loading={loading}
            onEmailSubmit={onEmailSubmit}
            onForgotPassword={() =>
              router.push(
                phone.trim()
                  ? `/forgot-password?phone=${encodeURIComponent(phone.trim())}`
                  : "/forgot-password",
              )
            }
          />
        )}
      </div>
    </section>
  );
}
