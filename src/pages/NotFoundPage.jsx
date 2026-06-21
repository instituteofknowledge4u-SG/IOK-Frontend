import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, MapPinOff } from "lucide-react";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full filter blur-[100px] animate-blob" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/40 rounded-full filter blur-[100px] animate-blob animation-delay-2000" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border p-10 md:p-12 text-center relative z-10 transition-colors duration-300"
      >
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75" />
            <div className="relative bg-accent w-24 h-24 rounded-full flex items-center justify-center border-4 border-background shadow-sm transition-colors duration-300">
              <MapPinOff className="w-10 h-10 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 mb-2"
        >
          404
        </motion.h1>

        <motion.h2
          variants={itemVariants}
          className="text-2xl font-bold text-foreground mb-4 transition-colors duration-300"
        >
          Page Not Found
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-muted-foreground mb-10 leading-relaxed transition-colors duration-300"
        >
          Oops! It looks like you've ventured into unknown territory. The page
          you are looking for doesn't exist or has been moved.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-foreground bg-muted hover:bg-accent hover:text-accent-foreground transition-all duration-200 border border-transparent hover:border-border"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-primary-foreground bg-primary hover:opacity-90 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
