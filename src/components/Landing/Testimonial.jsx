import { motion } from "framer-motion";

export const Testimonial = ({ text, author, isRight }) => (
  <motion.div
    initial={{ opacity: 0, x: isRight ? 50 : -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className={`relative mb-8 max-w-lg ${isRight ? "ml-auto" : "mr-auto"}`}
  >
    <div
      className={`p-6 rounded-2xl border-2 border-border bg-card text-foreground/80 text-sm leading-relaxed shadow-sm
      ${isRight ? "rounded-br-none" : "rounded-bl-none"}`}
    >
      <p className="font-medium italic">"{text}"</p>
      <p className="mt-3 font-bold text-foreground">- {author}</p>
    </div>
    <div
      className={`absolute bottom-[-12px] w-6 h-6 bg-card border-r-2 border-b-2 border-border rotate-45 
      ${isRight ? "right-6" : "left-6"}`}
    />
  </motion.div>
);