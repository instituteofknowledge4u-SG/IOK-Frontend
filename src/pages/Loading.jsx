import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Image } from "../assets/Image";

const Loading = ({
  text = "Loading application...",
  logoSrc = Image.Logo,
  instituteName = "Institute-of-knowledge",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center max-w-sm w-full px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
          className="relative mb-5"
        >
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />

          <img
            src={logoSrc}
            alt={`${instituteName} Logo`}
            className="w-24 h-24 md:w-28 md:h-28 object-contain relative z-10 drop-shadow-md"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {instituteName}
          </h1>
          <div className="h-1 w-12 bg-primary/60 mx-auto mt-4 rounded-full" />
        </motion.div>

        <div className="flex flex-col items-center w-full space-y-5">
          <div className="w-56 h-1.5 bg-muted overflow-hidden rounded-full relative">
            <motion.div
              className="absolute top-0 left-0 bottom-0 w-1/2 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Loading;
