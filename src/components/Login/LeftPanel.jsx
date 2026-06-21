import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { Image } from "../../assets/Image";

export const LeftPanel = () => {
  return (
    <div className="hidden md:flex relative md:w-1/2 flex-col justify-center items-center text-white text-center overflow-hidden">
      <img
        src={Image.StudentPic}
        alt="Academy Student"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40 z-10" />
      <div className="relative z-20 p-12 flex flex-col items-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="mb-8"
        >
          <ShieldCheck
            className="w-32 h-32 text-white drop-shadow-lg"
            strokeWidth={1}
          />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2 uppercase tracking-wide drop-shadow-md text-white">
          Secure Access
        </h2>
        <p className="text-white/90 text-sm drop-shadow-sm">
          Experience the next generation of academy management.
        </p>
      </div>
    </div>
  );
};
