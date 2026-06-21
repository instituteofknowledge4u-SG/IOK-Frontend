import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/useAuthStore";
import { Button } from "../UI/Button";

export const StepOneForm = ({ email, setEmail, onVerify }) => {
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);

  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaText, setCaptchaText] = useState("");
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const { error, clearError, sendOtp } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateEmailFormat = (emailAddress) => {
    const trimmedEmail = emailAddress.trim();
    if (!trimmedEmail) return "";

    if (!trimmedEmail.includes("@")) return "Please include an '@' symbol.";

    const parts = trimmedEmail.split("@");
    if (parts[0].length === 0) return "Please enter a username before the '@'.";
    if (parts.length > 2)
      return "Email address can only contain one '@' symbol.";
    if (parts[1].length === 0)
      return "Please enter a domain after the '@' (e.g., gmail).";
    if (!parts[1].includes("."))
      return "Please include a dot ('.') in the domain portion.";

    const domainParts = parts[1].split(".");
    if (domainParts[domainParts.length - 1].length < 2) {
      return "Please add a valid top-level domain extension (e.g., .com, .org).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail))
      return "Please enter a valid email format.";

    return "";
  };

  useEffect(() => {
    if (!email) {
      setEmailFeedback("");
      setIsEmailValid(false);
      setIsCheckingEmail(false);
      return;
    }

    setIsCheckingEmail(true);

    const timer = setTimeout(() => {
      const errorMsg = validateEmailFormat(email);
      setEmailFeedback(errorMsg);
      setIsEmailValid(errorMsg === "");
      setIsCheckingEmail(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const generateCaptcha = () => {
    if (!canvasRef.current) return;
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    drawCaptcha(text);
  };

  const drawCaptcha = (text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "22px Arial";
    ctx.fillStyle = "#333";
    ctx.setTransform(1, Math.random() * 0.2, Math.random() * 0.2, 1, 0, 0);
    ctx.fillText(text, 15, 32);

    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = "#888";
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  useEffect(() => {
    const timer = setTimeout(() => generateCaptcha(), 50);
    inputRef.current.focus();
    return () => clearTimeout(timer);
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearError();

    if (!email) {
      toast.error("Email required !!");
      return;
    }

    if (!isEmailValid) {
      toast.error("Please provide a completely valid email format.");
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(email);
      const { isValidEmail, error: authError } = useAuthStore.getState();
      if (isValidEmail) {
        toast.success("OTP sent to your email");
        onVerify();
      } else {
        toast.error(authError || "Failed to send OTP.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to clear the input and refocus it
  const handleClearEmail = () => {
    setEmail("");
    inputRef.current?.focus();
  };

  return (
    <motion.form
      key="step1"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      onSubmit={handleSendOtp}
      className="space-y-6 mt-4 md:mt-0"
    >
      <div className="text-center md:text-left mb-6 md:mb-8">
        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">
          Login
        </h3>
        <p className="text-foreground/60 text-sm">
          Enter your credentials to continue
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />

          <input
            type="email"
            required
            disabled={isLoading}
            placeholder="Email Address"
            ref={inputRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // Note: Added pr-20 to make room for both the clear button and validation icon
            className={`
              ${
                email
                  ? isEmailValid
                    ? "focus:ring-green-400 border-green-400"
                    : "focus:ring-red-400 border-red-400"
                  : "focus:ring-primary border-border"
              } 
              w-full pl-12 pr-20 py-3 bg-card border text-foreground rounded-xl focus:ring-2 outline-none transition
            `}
          />

          {/* Action & Validation Icons Container */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Clear "X" Button (Only shows if there is text) */}
            {email && (
              <button
                type="button"
                onClick={handleClearEmail}
                disabled={isLoading}
                className="p-1 rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/10 transition-colors disabled:opacity-50"
                aria-label="Clear email"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Validation Status Indicator */}
            <div className="flex items-center justify-center w-5">
              {isCheckingEmail ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary/70" />
              ) : email && isEmailValid ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : email && !isEmailValid ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : null}
            </div>
          </div>
        </div>

        {/* Validation Feedback Message */}
        {emailFeedback && !isCheckingEmail && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-xs pl-2 font-medium"
          >
            {emailFeedback}
          </motion.p>
        )}
      </div>

      <Button
        buttonType={"submit"}
        buttonName={"Verify Details"}
        disabledCondition={
          !email || !isEmailValid || isCheckingEmail || isLoading
        }
        isLoading={isLoading}
      />
    </motion.form>
  );
};