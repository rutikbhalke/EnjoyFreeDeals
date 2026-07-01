import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, LockKeyhole, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { saveUserSession } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import SEO from "@/components/SEO";

type OtpResponse = {
  success?: boolean;
  message?: string;
  user?: {
    userId?: string;
    mobile?: string;
    name?: string;
    full_name?: string;
    isTestUser?: boolean;
    is_test_user?: boolean;
  };
  token?: string;
  data?: {
    user?: OtpResponse["user"];
    accessToken?: string;
  };
};

export default function LoginPage() {
  const { user, isLoading, isMobileLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("9699353648");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState<"send" | "verify" | null>(null);

  if (!isLoading && (user || isMobileLoggedIn)) return <Navigate to="/" replace />;

  const requestOtp = async () => {
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    if (cleanMobile.length !== 10) {
      setError("Enter a valid 10 digit mobile number.");
      return;
    }
    setSubmitting("send");
    setError("");
    setMessage("");
    try {
      const response = await postOtp("/api/auth/whatsapp/request-otp", { mobile: cleanMobile });
      setOtpSent(true);
      setMessage(response.message || "OTP sent successfully.");
    } catch (primaryError) {
      try {
        const response = await postOtp("/api/send-whatsapp-otp", { mobile: cleanMobile });
        setOtpSent(true);
        setMessage(response.message || "OTP sent successfully.");
      } catch {
        setError(primaryError instanceof Error ? primaryError.message : "Could not send OTP.");
      }
    } finally {
      setSubmitting(null);
    }
  };

  const verifyOtp = async () => {
    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.replace(/\D/g, "");
    if (cleanMobile.length !== 10 || cleanOtp.length < 4) {
      setError("Enter mobile number and OTP.");
      return;
    }
    setSubmitting("verify");
    setError("");
    setMessage("");
    try {
      const response = await postOtp("/api/auth/whatsapp/verify-otp", { mobile: cleanMobile, otp: cleanOtp });
      persistSession(response, cleanMobile);
      setMessage(response.message || "OTP verified successfully.");
      navigate("/", { replace: true });
    } catch (primaryError) {
      try {
        const response = await postOtp("/api/verify-whatsapp-otp", { mobile: cleanMobile, otp: cleanOtp });
        persistSession(response, cleanMobile);
        navigate("/", { replace: true });
      } catch {
        setError(primaryError instanceof Error ? primaryError.message : "Invalid OTP.");
      }
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7faf7] px-4 py-8 dark:bg-background">
      <SEO title="Login with WhatsApp" description="Login to EnjoyFreeDeals with your mobile number and WhatsApp OTP." />
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-[#ff3b6b]/10" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#14b87a]/12" />

      <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center">
        <Link to="/" className="mb-7 block rounded-xl dark:bg-white dark:px-3 dark:py-2 dark:shadow-sm">
          <img src={logo} alt="EnjoyFreeDeals" className="mx-auto h-20 w-auto object-contain" />
          <p className="mt-1 text-center text-sm font-semibold text-muted-foreground">Save More. Earn More.</p>
        </Link>

        <Card className="w-full rounded-[2rem] border-white/70 bg-white/95 shadow-2xl shadow-black/15 dark:border-border dark:bg-card">
          <CardContent className="p-6 sm:p-8">
            <div className="mx-auto mb-6 w-fit rounded-full bg-gradient-to-r from-[#f23131] via-[#ffc107] to-[#087b33] px-5 py-2 text-sm font-extrabold text-white shadow-lg">
              Premium Shopping Deals
            </div>

            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-black text-[#1e293b] dark:text-foreground">Login with WhatsApp</h1>
              <p className="mt-1 text-sm text-muted-foreground">Enter your mobile number to receive a secure OTP</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-xs font-semibold text-[#087b33]">WhatsApp Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="mobile"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="h-14 rounded-2xl border-[#087b33]/40 pl-12 text-base"
                    placeholder="9699353648"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-xs font-semibold text-[#087b33]">Enter OTP</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="otp"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-14 rounded-2xl pl-12 text-base"
                    placeholder="123456"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button type="button" variant="ghost" className="text-[#e60023] hover:text-[#e60023]" onClick={requestOtp} disabled={submitting !== null}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {submitting === "send" ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                </Button>
                <Button type="button" className="rounded-2xl bg-[#087b33] px-6 hover:bg-[#06682b]" onClick={verifyOtp} disabled={submitting !== null}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {submitting === "verify" ? "Verifying..." : "Verify OTP"}
                </Button>
              </div>

              {(message || error) && (
                <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-600 dark:bg-red-950/30" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"}`}>
                  <div className="flex items-start gap-2">
                    {!error && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{error || message}</span>
                  </div>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Test login: mobile <span className="font-semibold text-foreground">9699353648</span>, OTP <span className="font-semibold text-foreground">123456</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

async function postOtp(path: string, body: Record<string, string>): Promise<OtpResponse> {
  return apiPost<OtpResponse>(path, body);
}

function persistSession(response: OtpResponse, fallbackMobile: string) {
  const user = response.user || response.data?.user || {};
  saveUserSession({
    userId: user.userId,
    mobile: user.mobile || fallbackMobile,
    full_name: user.full_name || user.name || "EnjoyFreeDeals User",
    is_test_user: Boolean(user.is_test_user || user.isTestUser),
    token: response.token || response.data?.accessToken,
  });
}
