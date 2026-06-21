import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image } from "../../assets/Image";
import { NavLink, useNavigate } from "react-router-dom";
import { useLoginStore } from "../../stores/useLoginStore";
import useAuthStore from "../../stores/useAuthStore";
import useUiStateStore from "../../stores/useUiStateStore";
import { Moon, Sun, Monitor, Menu, X, ArrowRight } from "lucide-react";

export const Navbar = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openModal = useLoginStore((state) => state.openModal);
  const navigate = useNavigate();

  const theme = useUiStateStore((state) => state.theme);
  const setTheme = useUiStateStore((state) => state.setTheme);

  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        if (systemThemeMedia.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();

    const handleSystemThemeChange = () => applyTheme();
    systemThemeMedia.addEventListener("change", handleSystemThemeChange);

    return () =>
      systemThemeMedia.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const handleThemeSelect = (newTheme) => {
    setTheme(newTheme);
    setIsThemeDropdownOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm transition-colors duration-300">
      <div className="flex items-center justify-between px-4 md:px-12 py-3 md:py-4">
        {/* DESKTOP LEFT: Navigation Links */}
        {/* <div className="hidden md:flex flex-1 items-center gap-6 text-sm font-semibold text-foreground/80">
          <NavLink
            to="/"
            className="hover:text-primary transition text-lg lg:text-xl font-extrabold"
          >
            Features
          </NavLink>
          <NavLink
            to="/"
            className="hover:text-primary transition text-lg lg:text-xl font-extrabold"
          >
            Modules
          </NavLink>
        </div> */}

        {/* CENTER/MOBILE LEFT: Logo */}
        <div className="flex md:flex-1 justify-start md:justify-center">
          <div
            className="w-16 md:w-20 lg:w-25 rounded-lg flex items-center justify-center cursor-pointer"
            // onClick={() => navigate("/")}
          >
            <img
              src={Image.Logo}
              alt="Logo"
              className="object-contain w-full h-full"
            />
          </div>
        </div>

        {/* RIGHT: Actions (Theme Dropdown & Auth Button) */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4 lg:gap-6">
          {/* Theme Dropdown (Visible on all sizes) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-muted text-foreground transition-colors border border-transparent hover:border-border"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Sun size={20} />
              ) : theme === "dark" ? (
                <Moon size={20} />
              ) : (
                <Monitor size={20} />
              )}
            </button>

            <AnimatePresence>
              {isThemeDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col py-1 z-50"
                >
                  <button
                    onClick={() => handleThemeSelect("light")}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
                      theme === "light"
                        ? "text-primary bg-primary/10"
                        : "text-foreground"
                    }`}
                  >
                    <Sun size={16} /> Light
                  </button>
                  <button
                    onClick={() => handleThemeSelect("dark")}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
                      theme === "dark"
                        ? "text-primary bg-primary/10"
                        : "text-foreground"
                    }`}
                  >
                    <Moon size={16} /> Dark
                  </button>
                  <button
                    onClick={() => handleThemeSelect("system")}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
                      theme === "system"
                        ? "text-primary bg-primary/10"
                        : "text-foreground"
                    }`}
                  >
                    <Monitor size={16} /> System
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DESKTOP ONLY: Auth Button */}
          <div className="hidden md:block">
            {!isAuthenticated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openModal}
                className="bg-primary text-primary-foreground px-6 py-2.5 lg:px-8 lg:py-3 rounded-full font-black text-sm lg:text-lg tracking-widest shadow-lg shadow-primary/30 transition-opacity hover:opacity-90 whitespace-nowrap"
              >
                Login
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/")}
                className="bg-primary text-primary-foreground px-6 py-2.5 lg:px-8 lg:py-3 rounded-full font-black text-sm lg:text-xl tracking-widest shadow-lg shadow-primary/30 transition-opacity hover:opacity-90 whitespace-nowrap"
              >
                continue
              </motion.button>
            )}
          </div>

          {/* MOBILE ONLY: Hamburger Menu Toggle */}
          <button
            className="md:hidden flex items-center justify-center p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-background border-b border-border shadow-lg"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {/* <NavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold text-foreground/80 hover:text-primary transition-colors py-2"
              >
                Features
              </NavLink>
              <NavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-bold text-foreground/80 hover:text-primary transition-colors py-2"
              >
                Modules
              </NavLink> */}

              <div className="pt-4 mt-2 border-t border-border">
                {!isAuthenticated ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      openModal();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-black text-lg tracking-widest shadow-lg shadow-primary/30 transition-opacity hover:opacity-90"
                  >
                    Login
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigate("/");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-black text-lg tracking-widest shadow-lg shadow-primary/30 transition-opacity hover:opacity-90"
                  >
                    Continue
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
