import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, Home } from "lucide-react";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6"
    >
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="p-6 bg-red-100 dark:bg-red-900/30 rounded-full"
          >
            <Lock className="w-16 h-16 text-red-600 dark:text-red-400" />
          </motion.div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
          You don't have permission to access this page.
        </p>
        <p className="text-slate-500 dark:text-slate-500 mb-8">
          This page is restricted to authorized users only. If you believe this
          is an error, please contact your administrator.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </motion.button>
        </div>

        {/* Footer Note */}
        <p className="mt-12 text-sm text-slate-500 dark:text-slate-600">
          Error Code: 403 Forbidden
        </p>
      </div>
    </motion.div>
  );
};

export default AccessDenied;
