import React from "react";
import { motion } from "framer-motion";

export const PhotoCarousel = ({ images, title = "Our Facilities" }) => (
  <section className="py-24 bg-muted/30 border-y border-border overflow-hidden">
    <h2 className="text-2xl md:text-3xl font-black text-center mb-16 uppercase tracking-[0.2em]">
      {title}
    </h2>
    <div className="flex gap-6 px-6 overflow-x-auto pb-8 snap-x snap-mandatory custom-scrollbar max-w-7xl mx-auto">
      {images.map((src, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ y: -10 }}
          className="min-w-[280px] md:min-w-[400px] h-[250px] md:h-[300px] shrink-0 rounded-2xl overflow-hidden shadow-xl snap-center border border-border cursor-pointer"
        >
          <img
            src={src}
            alt={`Carousel Item ${i}`}
            className="w-full h-full object-cover"
          />
        </motion.div>
      ))}
    </div>
  </section>
);
