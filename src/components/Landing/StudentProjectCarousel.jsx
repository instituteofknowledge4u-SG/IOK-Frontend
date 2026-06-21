import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Image } from "../../assets/Image";

export const StudentProjectCarousel = () => {
  const images = Image.studentProjects;

  const [current, setCurrent] = React.useState(0);

  const next = () => setCurrent((current + 1) % images.length);
  const prev = () => setCurrent((current - 1 + images.length) % images.length);

  return (
    <section className="py-24 bg-muted/50 border-y border-border overflow-hidden">
      <h2 className="text-2xl md:text-3xl font-black text-center mb-16 uppercase tracking-[0.2em]">
        Student Projects & Achievements
      </h2>
      <div className="max-w-5xl mx-auto px-6 relative">
        <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-border">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <img
              src={images[current]}
              alt={`Student Project ${current + 1}`}
              className="w-full h-96 md:h-[500px] object-cover"
            />
          </motion.div>

          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-primary/80 hover:bg-primary text-white p-2 rounded-full shadow-lg transition-all z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary/80 hover:bg-primary text-white p-2 rounded-full shadow-lg transition-all z-10"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current
                    ? "bg-primary w-8 h-2"
                    : "bg-white/50 hover:bg-white/70 w-2 h-2"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Counter */}
        <div className="text-center mt-8 text-muted-foreground font-medium">
          {current + 1} / {images.length}
        </div>
      </div>
    </section>
  );
};
