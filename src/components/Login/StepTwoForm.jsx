import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/useAuthStore";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import CountdownTimer from "./CountdownTimer";
import { Button } from "../UI/Button";

export const StepTwoForm = ({ email, onBack, onSuccess }) => {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [showOtp, setShowOtp] = useState(false);
  const inputRefs = useRef([]);

  const [canResend, setCanResend] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { error, clearError, sendOtp, verifyOtp } = useAuthStore();

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      inputRefs.current[index - 1]
    ) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pasteData.some(isNaN)) return;

    const newOtp = [...otp];
    pasteData.forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtp(newOtp);

    const focusIndex = pasteData.length < 6 ? pasteData.length : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();

    const otpString = otp.join("");
    const payLoad = {
      email: email,
      otp: otpString,
    };

    if (isOtpComplete) {
      setIsLoading(true);

      try {
        await verifyOtp(payLoad);
        const currentAuthError = useAuthStore.getState().error;
        if (currentAuthError) {
          throw new Error(currentAuthError);
        }
        toast.success("Login successful");
        navigate("/");
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error(err?.response?.message || "Invalid OTP");
        setOtp(new Array(6).fill(""));
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      const remaining = otp.filter((digit) => digit === "").length;
      toast.error(`${remaining} digit${remaining > 1 ? "s" : ""} remaining !!`);
    }
  };

  const handleResendOTP = async (e) => {
    clearError();
    try {
      const { isValidEmail, error: authError } = useAuthStore.getState();
      if (isValidEmail) {
        await sendOtp(email);
        toast.success("OTP resent successfully!");
        setOtp(new Array(6).fill(""));
        setCanResend(false);
        setTimerKey((prev) => prev + 1);
        inputRefs.current[0].focus();
      } else {
        toast.error(authError || "Failed to re-sent OTP.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <motion.div
      key="step2"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="space-y-6 mt-4 md:mt-0"
    >
      <div className="text-center md:text-left mb-6 md:mb-8">
        <h3 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tighter">
          Verify OTP
        </h3>
        <p className="text-foreground/60 text-sm mt-1">
          We've sent a code to
          <span className="font-semibold text-foreground block md:inline">
            {" "}
            {email}
          </span>
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-3">
          {/* Header Row: Label & Toggle Button aligned together */}
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs text-foreground/60 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Secure Code
            </span>
            <button
              type="button"
              onClick={() => setShowOtp(!showOtp)}
              className="text-xs text-foreground/60 hover:text-foreground transition-colors flex items-center gap-1.5 font-medium"
            >
              {showOtp ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Show
                </>
              )}
            </button>
          </div>

          {/* Fully Responsive Liquid OTP Container */}
          <div className="flex justify-between items-center gap-2 sm:gap-3 w-full">
            {otp.map((digit, index) => (
              <input
                key={index}
                type={showOtp ? "text" : "password"}
                maxLength={1}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={canResend || isLoading}
                className={`
                  w-full h-12 sm:h-14 md:h-16 flex-1 max-w-[3.5rem] 
                  text-center text-xl sm:text-2xl md:text-3xl font-bold 
                  rounded-xl md:rounded-2xl border transition-all duration-300 outline-none 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    isOtpComplete
                      ? "border-green-500 bg-green-500/5 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                      : digit !== ""
                        ? "border-primary/50 text-foreground bg-primary/5 focus:border-primary focus:ring-4 focus:ring-primary/20 scale-[1.02]"
                        : "border-border bg-card text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 hover:border-border/80"
                  }
                `}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center px-1 py-2 bg-foreground/5 rounded-lg border border-border/50">
          <span className="text-xs text-foreground/60 font-medium px-2">
            {canResend ? "Didn't receive the code?" : "Time remaining:"}
          </span>
          <div className="text-sm font-bold text-primary px-2">
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="hover:underline hover:text-primary/80 transition-colors cursor-pointer capitalize tracking-wider text-xs disabled:opacity-50"
              >
                Resend OTP ?
              </button>
            ) : (
              <CountdownTimer
                key={timerKey}
                onExpire={() => setCanResend(true)}
              />
            )}
          </div>
        </div>

        <Button
          buttonName={"Confirm Login"}
          buttonType={"submit"}
          disabledCondition={!isOtpComplete || canResend || isLoading}
          isLoading={isLoading}
        />
      </form>

      <button
        onClick={onBack}
        type="button"
        disabled={isLoading}
        className="w-full text-xs text-foreground/40 hover:text-foreground/80 uppercase font-bold transition disabled:opacity-50 mt-4"
      >
        Go Back
      </button>
    </motion.div>
  );
};
