import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Info,
  ArrowRight,
  Layers,
  GraduationCap,
  LayoutGrid,
} from "lucide-react";
import { TRADES } from "../../constants/trades";

/**
 * Trade Management - Read-only View
 *
 * Displays the fixed set of hardcoded trades.
 * No creation, editing, or deletion - trades are managed via constants.
 *
 * Architecture: Trade → Course → Batch
 */
const TradeManagement = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6 md:p-8"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Trade Management
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
            Fixed set of available trades for your institution. Trades organize
            courses and batches in the hierarchy: Trade → Course → Batch.
          </p>
        </div>

        {/* Info Box (Theme-aware) */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-3 items-start">
          <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-foreground/80 leading-relaxed">
            <strong className="text-blue-600 dark:text-blue-400 font-semibold mr-1">
              Note:
            </strong>
            Trades are currently fixed and managed through the application
            constants. To add or modify trades, please contact your system
            administrator.
          </p>
        </div>

        {/* Trades List */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-muted/20">
            <h2 className="text-lg font-bold text-foreground">
              Available Trades
            </h2>
            <span className="text-sm font-medium px-3 py-1 bg-muted rounded-full text-muted-foreground">
              {TRADES.length} Total
            </span>
          </div>

          {TRADES.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
              <BookOpen className="w-12 h-12 mb-3 opacity-20" />
              <p>No trades configured in the system.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {TRADES.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 px-6 py-5 hover:bg-muted/40 transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-105 transition-transform">
                    <BookOpen size={22} />
                  </div>

                  {/* Trade Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base truncate">
                      {trade.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">ID:</span>
                      <code className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-mono">
                        {trade.id}
                      </code>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Visual Architecture Info */}
        <div className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8 space-y-6">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-foreground text-lg">
              System Architecture Overview
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              How data flows through the institution.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            {/* Step 1 */}
            <div className="bg-card border border-border rounded-xl p-5 w-full text-center shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 group-hover:bg-primary transition-colors" />
              <LayoutGrid className="w-8 h-8 mx-auto text-primary mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">
                {TRADES.length}
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Trades
              </p>
            </div>

            <ArrowRight
              className="text-muted-foreground/40 shrink-0 rotate-90 md:rotate-0"
              size={24}
            />

            {/* Step 2 */}
            <div className="bg-card border border-border rounded-xl p-5 w-full text-center shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/40 group-hover:bg-blue-500 transition-colors" />
              <GraduationCap className="w-8 h-8 mx-auto text-blue-500 mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">∞</div>
              <p className="text-sm font-medium text-muted-foreground">
                Courses per Trade
              </p>
            </div>

            <ArrowRight
              className="text-muted-foreground/40 shrink-0 rotate-90 md:rotate-0"
              size={24}
            />

            {/* Step 3 */}
            <div className="bg-card border border-border rounded-xl p-5 w-full text-center shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors" />
              <Layers className="w-8 h-8 mx-auto text-emerald-500 mb-3" />
              <div className="text-2xl font-bold text-foreground mb-1">∞</div>
              <p className="text-sm font-medium text-muted-foreground">
                Batches per Course
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TradeManagement;
