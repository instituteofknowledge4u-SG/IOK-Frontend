import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, QrCode } from "lucide-react";

const IdCard = ({
  frontBackground,
  backBackground,
  profileImage,
  qrCode,
  details = { name: "Loading...", role: "", idNumber: "", validUntil: "" },
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [qrError, setQrError] = useState(false);

  // FIX: Reset error states if the static image prop changes
  // This prevents the image from permanently disappearing during dev/reloads
  useEffect(() => {
    setImageError(false);
  }, [profileImage]);

  useEffect(() => {
    setQrError(false);
  }, [qrCode]);

  const handleFlip = () => setIsFlipped((prev) => !prev);

  const frontBgStyle = frontBackground
    ? { backgroundImage: `url(${frontBackground})` }
    : {};
  const backBgStyle = backBackground
    ? { backgroundImage: `url(${backBackground})` }
    : {};

  return (
    <div className="flex items-center justify-center p-8 [perspective:1000px]">
      <motion.div
        className="relative w-80 h-[32rem] cursor-pointer shadow-2xl rounded-2xl"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Toggle ID Card side"
        onKeyDown={(e) => e.key === "Enter" && handleFlip()}
      >
        {/* ==================== FRONT SIDE ==================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-card border border-border flex flex-col items-center ${
            !frontBackground
              ? "bg-gradient-to-b from-primary/20 to-background"
              : ""
          }`}
          style={{
            backfaceVisibility: "hidden",
            backgroundSize: "cover",
            backgroundPosition: "center",
            ...frontBgStyle,
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center p-6 pt-12">
            {/* Profile Picture */}
            <div className="w-36 h-36 rounded-full border-4 border-primary bg-muted overflow-hidden shadow-lg flex-shrink-0 flex items-center justify-center">
              {profileImage && !imageError ? (
                <img
                  src={profileImage}
                  alt={`${details.name}'s Profile`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <User size={64} className="text-muted-foreground/50" />
              )}
            </div>

            {/* Dynamic Text Details */}
            <div className="mt-auto mb-6 text-center w-full bg-card/80 backdrop-blur-md py-5 px-4 rounded-xl border border-border shadow-sm">
              <h2 className="text-2xl font-extrabold text-foreground uppercase tracking-widest line-clamp-1">
                {details.name}
              </h2>
              <p className="text-sm font-bold text-primary mt-1 uppercase tracking-wide">
                {details.role}
              </p>

              <div className="mt-5 space-y-1.5 border-t border-border/50 pt-4">
                <p className="text-xs font-bold text-muted-foreground tracking-wider flex justify-between">
                  ID NO:{" "}
                  <span className="font-bold text-foreground">
                    {details.idNumber || "N/A"}
                  </span>
                </p>
                <p className="text-xs font-bold text-muted-foreground tracking-wider flex justify-between">
                  VALID TILL:{" "}
                  <span className="font-bold text-foreground">
                    {details.validUntil || "N/A"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== BACK SIDE ==================== */}
        <div
          className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-card border border-border flex flex-col items-center justify-center ${
            !backBackground
              ? "bg-gradient-to-t from-primary/10 to-background"
              : ""
          }`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            ...backBgStyle,
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-200 flex items-center justify-center min-w-[11rem] min-h-[11rem]">
              {qrCode && !qrError ? (
                <img
                  src={qrCode}
                  alt="Verification QR Code"
                  className="w-40 h-40 object-contain"
                  onError={() => setQrError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <QrCode size={64} strokeWidth={1} />
                  <span className="text-[10px] mt-2 font-semibold">
                    QR UNAVAILABLE
                  </span>
                </div>
              )}
            </div>

            <p className="mt-10 text-xs text-center text-foreground font-medium leading-relaxed bg-card/80 backdrop-blur-md p-4 rounded-xl border border-border shadow-sm">
              Scan the QR code to verify identity. <br />
              <br />
              <span className="text-muted-foreground">
                If found, please return to the issuing administration
                immediately.
              </span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default IdCard;
