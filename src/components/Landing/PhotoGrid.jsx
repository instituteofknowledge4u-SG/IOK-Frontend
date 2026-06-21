import React from "react";
import { motion } from "framer-motion";

export const PhotoGrid = ({ images, title = "Campus Life" }) => (
  <section className="py-24 px-6 max-w-6xl mx-auto">
    <h2 className="text-2xl md:text-3xl font-black text-center mb-16 uppercase tracking-[0.2em]">
      {title}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {images.map((src, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.03 }}
          className="overflow-hidden rounded-2xl shadow-lg border border-border bg-card cursor-pointer"
        >
          <img
            src={src}
            alt={`Gallery Item ${i}`}
            className="w-full h-full object-cover aspect-[4/3]"
          />
        </motion.div>
      ))}
    </div>
  </section>
);
