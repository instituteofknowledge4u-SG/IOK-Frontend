import React from "react";
import { motion } from "framer-motion";

export const PhotoFeature = ({
  image,
  title = "Student Excellence",
  desc = "Experience the best moments of our institute. This highlighted section brings focus to a primary aspect of our academic and extra-curricular achievements.",
}) => (
  <section className="py-24 px-6 max-w-6xl mx-auto">
    <div className="flex flex-col md:flex-row items-center gap-12 bg-card rounded-3xl p-8 md:p-12 border border-border shadow-sm">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex-1 w-full rounded-2xl overflow-hidden shadow-2xl border border-border cursor-pointer"
      >
        <img
          src={image}
          alt="Featured Highlight"
          className="w-full h-full object-cover aspect-video"
        />
      </motion.div>
      <div className="flex-1 space-y-6 text-center md:text-left">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-[0.1em]">
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
          {desc}
        </p>
      </div>
    </div>
  </section>
);
