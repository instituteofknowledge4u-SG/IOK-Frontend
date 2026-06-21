import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const FeatureCard = ({ icon: Icon, title, desc }) => (
  <motion.div
    variants={fadeInUp}
    whileHover={{ y: -5 }}
    className="bg-card p-8 rounded-2xl shadow-sm border border-border flex flex-col items-center text-center transition-shadow hover:shadow-md hover:border-primary/30"
  >
    <div className="mb-4">
      <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
    </div>
    <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
    <p className="text-foreground/70 text-sm leading-relaxed">{desc}</p>
  </motion.div>
);