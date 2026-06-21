import { motion, AnimatePresence } from "framer-motion";
import { FileBadge, X } from "lucide-react";
import React from "react";

export const FilePreviewModal = ({ viewingFile, setViewingFile }) => {
  return (
    <AnimatePresence>
      {viewingFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setViewingFile(null)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-card border border-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-border">
              <h3 className="font-semibold text-foreground truncate pr-4">
                {viewingFile.name}
              </h3>
              <button
                onClick={() => setViewingFile(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview Area */}
            <div className="p-4 bg-muted/30 flex-1 flex items-center justify-center min-h-[50vh] max-h-[80vh] overflow-auto">
              {viewingFile.type.startsWith("image/") ? (
                <img
                  src={viewingFile.url}
                  alt="Preview"
                  className="max-w-full max-h-full rounded-lg object-contain shadow-sm border border-border/50"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-3">
                  <FileBadge size={48} className="opacity-50" />
                  <p className="font-medium">Preview not available</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
