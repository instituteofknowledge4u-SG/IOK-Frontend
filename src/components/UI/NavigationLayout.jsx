import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  GraduationCap,
  UserPlus,
  User,
  LogOut,
  BadgePlus,
  Compass,
  Calendar,
  Layers,
  HandCoins,
  Settings,
  Sun,
  Moon,
  Monitor,
  BarChart3,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Outlet, Link, useLocation } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useUiStateStore from "../../stores/useUiStateStore";
import { Image } from "../../assets/Image";
import toast from "react-hot-toast";
import { Breadcrumbs } from "./Breadcrumbs";
import { generateSlug } from "../../util/generateSlug";
import { Helmet } from "react-helmet-async";

// 1. EXTRACTED NavItem OUTSIDE THE MAIN COMPONENT
const NavItem = ({
  item,
  isMobile = false,
  isCollapsed = false,
  closeMobileMenu,
}) => {
  const location = useLocation();
  const isActive =
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`);

  return (
    <Link
      to={item.path}
      state={item.state}
      onClick={() => isMobile && closeMobileMenu?.()}
      className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      }`}
    >
      {isActive && !isMobile && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <item.icon
        size={18}
        strokeWidth={isActive ? 2.5 : 2}
        className={`shrink-0 transition-colors ${
          isActive
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
      />
      <span
        className={`truncate transition-all duration-300 ${
          !isMobile && isCollapsed
            ? "w-0 opacity-0 hidden"
            : "w-auto opacity-100 block"
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
};

export const NavigationLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");

  const theme = useUiStateStore((state) => state.theme);
  const setTheme = useUiStateStore((state) => state.setTheme);

  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const logout = useAuthStore((state) => state.logout);

  // --- Theme Management ---
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // --- Roles & Menus ---
  const roleMenus = {
    admin: [
      { path: "/", icon: Home, label: "Dashboard" },
      { path: "/teachers", icon: Users, label: "Teachers" },
      { path: "/students", icon: GraduationCap, label: "Students" },
      { path: "/registeruser", icon: UserPlus, label: "Register New User" },
      { path: "/batches", icon: Layers, label: "Batches" },
      { path: "/courses", icon: BadgePlus, label: "All Courses" },
      { path: "/trades", icon: Compass, label: "Trade Management" },
      { path: "/fees", icon: HandCoins, label: "Fees Payment" },
      { path: "/fees-yearly-status", icon: BarChart3, label: "Fees Status" },
      { path: "/attendance", icon: Calendar, label: "Attendance" },
      {
        path: "/attendance-status",
        icon: BarChart3,
        label: "Attendance Status",
      },
      {
        path: `/profile/${generateSlug(user?.name || "user")}`,
        icon: User,
        label: "Profile",
        state: { userId: user?._id },
      },
    ],
    teacher: [
      { path: "/", icon: Home, label: "Dashboard" },
      { path: "/students", icon: GraduationCap, label: "Students" },
      { path: "/batches", icon: Layers, label: "Assigned Batches" },
      { path: "/attendance", icon: Calendar, label: "Attendance" },
      {
        path: "/attendance-status",
        icon: BarChart3,
        label: "Attendance Status",
      },
      { path: "/fees-yearly-status", icon: BarChart3, label: "Fees Status" },
      {
        path: `/profile/${generateSlug(user?.name || "user")}`,
        icon: User,
        label: "Profile",
        state: { userId: user?._id },
      },
    ],
    student: [
      { path: "/", icon: Home, label: "Dashboard" },
      { path: "/batches", icon: Layers, label: "My Batches" },
      {
        path: "/attendance-status",
        icon: BarChart3,
        label: "My Attendance Status",
      },
      { path: "/fees-yearly-status", icon: HandCoins, label: "My Fees Status" },
      {
        path: `/profile/${generateSlug(user?.name || "user")}`,
        icon: User,
        label: "Profile",
        state: { userId: user?._id },
      },
    ],
  };

  const currentRole = userRole ? userRole.toLowerCase() : "student";
  const menuItems = roleMenus[currentRole] || roleMenus.student;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="fixed inset-0 flex bg-background text-foreground overflow-hidden selection:bg-primary/20">
      {/* ---------------- SETTINGS MODAL ---------------- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            />

            <Helmet>
              <title>IOK - Settings</title>
            </Helmet>

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[500px]"
            >
              <div className="w-full md:w-64 bg-muted/20 border-b md:border-b-0 md:border-r border-border p-4 md:p-6 shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Settings
                  </h2>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar">
                  <button
                    onClick={() => setActiveSettingsTab("general")}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSettingsTab === "general"
                        ? "bg-background shadow-sm border border-border text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Settings size={16} /> General
                  </button>
                  <button
                    onClick={() => setActiveSettingsTab("account")}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSettingsTab === "account"
                        ? "bg-background shadow-sm border border-border text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <ShieldAlert size={16} /> Account
                  </button>
                </nav>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="hidden md:flex items-center justify-between mb-8">
                  <h3 className="text-lg font-semibold capitalize">
                    {activeSettingsTab} Settings
                  </h3>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {activeSettingsTab === "general" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-1.5">
                        Theme Preferences
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose how the application looks on your device.
                      </p>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "system", icon: Monitor, label: "System" },
                          { id: "light", icon: Sun, label: "Light" },
                          { id: "dark", icon: Moon, label: "Dark" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                              theme === t.id
                                ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                                : "border-border bg-card hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                            }`}
                          >
                            <t.icon size={20} className="mb-2" />
                            <span className="text-xs font-medium">
                              {t.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === "account" && (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <p className="text-sm">Account settings coming soon.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- MOBILE DRAWER ---------------- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[80] md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 h-full w-[280px] bg-card border-r border-border z-[90] flex flex-col shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={Image.Logo}
                    alt="Logo"
                    className="w-8 h-8 object-contain"
                  />
                  <h1 className="font-semibold text-sm leading-tight tracking-tight">
                    Institute of <br /> Knowledge
                  </h1>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <div className="mb-3 px-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Menu
                  </p>
                </div>
                {/* 2. UPDATED MOBILE MENU MAP */}
                {menuItems.map((item) => (
                  <NavItem
                    key={item.label}
                    item={item}
                    isMobile={true}
                    closeMobileMenu={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>

              <div className="p-4 border-t border-border space-y-1 shrink-0">
                <button
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings size={18} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside
        className={`hidden md:flex flex-col bg-card border-r border-border h-full transition-all duration-300 ease-in-out shrink-0 z-30 ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <div className="flex items-center h-16 px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={Image.Logo}
              alt="Logo"
              className="w-8 h-8 object-contain shrink-0"
            />
            <h1
              className={`font-semibold text-sm leading-tight tracking-tight whitespace-nowrap transition-opacity duration-300 ${
                isCollapsed ? "opacity-0 hidden" : "opacity-100"
              }`}
            >
              Institute of <br /> Knowledge
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-1 no-scrollbar">
          {/* 3. UPDATED DESKTOP MENU MAP */}
          {menuItems.map((item) => (
            <NavItem key={item.label} item={item} isCollapsed={isCollapsed} />
          ))}
        </div>

        <div className="p-3 border-t border-border shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-md hover:bg-muted/60 text-muted-foreground transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background md:bg-muted/10">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-md shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 rounded-md hover:bg-muted text-foreground transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block truncate">
              <Breadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-3 pr-4 border-r border-border">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-none mb-1">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none">
                  {currentRole}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase overflow-hidden">
                {user?.profilePic ? (
                  <img
                    src={user?.profilePic}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : user?.name ? (
                  user?.name.charAt(0)
                ) : (
                  "U"
                )}
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:flex p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Breadcrumbs */}
        <div className="sm:hidden px-4 py-2.5 bg-card border-b border-border shrink-0">
          <Breadcrumbs />
        </div>

        <main className="flex-1 overflow-y-auto w-full relative scroll-smooth">
          <div className="max-w-7xl mx-auto w-full h-full flex flex-col p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
