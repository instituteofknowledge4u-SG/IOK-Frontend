import React, { useState, useEffect, useMemo } from "react";

// In-memory cache of image URLs that failed to load (prevents flicker on pagination/re-render)
const failedUrlCache = new Set();

// 14 Curated Multi-Color Gradient Palettes
const AVATAR_COLOR_PALETTES = [
  "bg-gradient-to-br from-rose-500 to-orange-500 text-white border-rose-400/30",
  "bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400/30",
  "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/30",
  "bg-gradient-to-br from-sky-500 to-blue-600 text-white border-sky-400/30",
  "bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400/30",
  "bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white border-fuchsia-400/30",
  "bg-gradient-to-br from-cyan-500 to-teal-600 text-white border-cyan-400/30",
  "bg-gradient-to-br from-purple-600 to-pink-500 text-white border-purple-400/30",
  "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400/30",
  "bg-gradient-to-br from-lime-500 to-emerald-600 text-white border-lime-400/30",
  "bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-400/30",
  "bg-gradient-to-br from-teal-500 to-emerald-700 text-white border-teal-400/30",
  "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400/30",
  "bg-gradient-to-br from-pink-500 to-rose-500 text-white border-pink-400/30",
];

// Preset sizes for convenience (can be overridden via className)
const SIZE_CLASSES = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-lg",
};

// Preset shapes
const SHAPE_CLASSES = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  squircle: "rounded-2xl",
};

/**
 * Extracts the starting and ending letters of a user's name.
 * Example: "Ronit Shakhari" -> "RI", "Subhajit" -> "ST"
 */
export const getStartAndEndInitials = (name, email) => {
  // 1. Clean name by removing leading/trailing spaces and special characters
  const rawSource = (name || "").trim();
  const cleanChars = Array.from(rawSource.replace(/[^\p{L}\p{N}]/gu, ""));

  if (cleanChars.length >= 2) {
    const firstLetter = cleanChars[0];
    const lastLetter = cleanChars[cleanChars.length - 1];
    return `${firstLetter}${lastLetter}`.toUpperCase();
  }

  if (cleanChars.length === 1) {
    return cleanChars[0].toUpperCase();
  }

  // 2. Fallback to email local-part (before '@') if name is empty
  if (email && typeof email === "string") {
    const emailLocal = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    if (emailLocal.length >= 2) {
      return `${emailLocal[0]}${emailLocal[emailLocal.length - 1]}`.toUpperCase();
    }
    if (emailLocal.length === 1) {
      return emailLocal[0].toUpperCase();
    }
  }

  return "U";
};

/**
 * Deterministically picks a color palette based on the user's name/email/id
 */
export const getAvatarColorPalette = (seedString = "") => {
  const str = String(seedString || "default").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[index];
};

/**
 * Resolves profile picture URL from direct src or a user object
 */
export const resolveAvatarUrl = (src, user) => {
  const candidates = [
    src,
    user?.profilePic,
    user?.profilePicture,
    user?.avatar,
    user?.photo,
    user?.image,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim();
    }
  }
  return null;
};

const UserAvatar = ({
  user,
  src,
  name,
  email,
  size = "md",
  shape = "rounded",
  className = "",
  alt,
  onClick,
  title,
}) => {
  const resolvedName = name ?? user?.name ?? "";
  const resolvedEmail = email ?? user?.email ?? "";
  const resolvedSrc = useMemo(() => resolveAvatarUrl(src, user), [src, user]);

  const [imgError, setImgError] = useState(() =>
    resolvedSrc ? failedUrlCache.has(resolvedSrc) : false
  );

  useEffect(() => {
    setImgError(resolvedSrc ? failedUrlCache.has(resolvedSrc) : false);
  }, [resolvedSrc]);

  // Starting + Ending letter initials
  const initials = useMemo(
    () => getStartAndEndInitials(resolvedName, resolvedEmail),
    [resolvedName, resolvedEmail]
  );

  // Deterministic multi-color background
  const colorPalette = useMemo(
    () =>
      getAvatarColorPalette(
        resolvedName || resolvedEmail || user?._id || user?.id
      ),
    [resolvedName, resolvedEmail, user?._id, user?.id]
  );

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const shapeClass = SHAPE_CLASSES[shape] || SHAPE_CLASSES.rounded;
  const shouldShowImage = Boolean(resolvedSrc && !imgError);

  const handleImageError = () => {
    if (resolvedSrc) {
      failedUrlCache.add(resolvedSrc);
    }
    setImgError(true);
  };

  return (
    <div
      onClick={onClick}
      title={title || resolvedName || resolvedEmail || "User"}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden font-extrabold tracking-wider border shadow-sm transition-all ${sizeClass} ${shapeClass} ${
        shouldShowImage
          ? "bg-muted border-border"
          : colorPalette
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {shouldShowImage ? (
        <img
          src={resolvedSrc}
          alt={alt || resolvedName || "User Avatar"}
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="leading-none drop-shadow-sm">{initials}</span>
      )}
    </div>
  );
};

export default React.memo(UserAvatar);