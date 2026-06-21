import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Image } from "../../assets/Image";

export const ServiceHighlight = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-20 uppercase tracking-[0.2em]">
          Our World-Class Services
        </h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20 max-h-96 md:max-h-full">
              <img
                src={Image.serviceHighlight}
                alt="Our Services"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </motion.div>

          {/* Text Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h3 className="text-3xl md:text-4xl font-black mb-4 uppercase tracking-[0.05em]">
                Excellence in Every Service
              </h3>
              <p className="text-muted-foreground leading-relaxed text-base">
                We provide comprehensive educational solutions that transform
                the way institutions operate. Our state-of-the-art
                infrastructure and dedicated team ensure quality service
                delivery at every level.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {[
                "Advanced Learning Management System",
                "Comprehensive Student Tracking",
                "Real-time Analytics & Reports",
                "Secure Cloud Infrastructure",
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Star size={14} className="text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{feature}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary hover:opacity-90 text-primary-foreground px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/30 transition-opacity w-fit"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
