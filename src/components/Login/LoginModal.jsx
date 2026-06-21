import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useLoginStore } from "../../stores/useLoginStore";
import useUiStateStore from "../../stores/useUiStateStore";
import { LeftPanel } from "./LeftPanel";
import { StepTwoForm } from "./StepTwoForm";
import { StepOneForm } from "./StepOneForm";
import useAuthStore from "../../stores/useAuthStore";

const LoginModal = () => {
  const { isOpen, closeModal, step, nextStep } = useLoginStore();

  const [email, setEmail] = useState("");

  const appname = useUiStateStore((state) => state.appName);
  const originalTitleRef = useRef("");

  useEffect(() => {
    if (isOpen) {
      originalTitleRef.current = document.title;
      document.title = `${appname} | Login`;
    } else if (originalTitleRef.current) {
      document.title = originalTitleRef.current;
    }

    return () => {
      if (isOpen && originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [isOpen, appname]);

  const handleClose = () => {
    closeModal();
    setTimeout(() => {
      setEmail("");
      useLoginStore.setState({ step: 1 });
    }, 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="modal-box"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background rounded-2xl md:rounded-3xl shadow-2xl overflow-y-auto flex flex-col md:flex-row max-w-4xl w-full max-h-[95vh] min-h-[400px] md:min-h-[500px] relative scrollbar-hide"
          >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-50 p-2 bg-foreground/10 hover:bg-foreground/20 md:bg-background/50 md:hover:bg-foreground/10 backdrop-blur-md rounded-full transition"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            {/* Render Component 1 */}
            <LeftPanel />

            {/* Adjusted padding for mobile (p-5) to give more breathing room */}
            <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-12 bg-background flex flex-col justify-center relative">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <StepOneForm
                    email={email}
                    setEmail={setEmail}
                    onVerify={nextStep}
                  />
                ) : (
                  <StepTwoForm
                    email={email}
                    onBack={() => useLoginStore.setState({ step: 1 })}
                    onSuccess={handleClose}
                  />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
