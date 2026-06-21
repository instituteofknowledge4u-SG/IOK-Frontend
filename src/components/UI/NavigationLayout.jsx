// import React, { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Home,
//   Users,
//   GraduationCap,
//   UserPlus,
//   User,
//   LogOut,
//   BadgePlus,
//   IdCard,
//   Newspaper,
//   BookCheck,
//   Form,
//   Menu,
//   X,
//   Calendar,
//   Layers,
//   HandCoins,
//   Settings,
//   Sun,
//   Moon,
//   Monitor,
//   BarChart3,
//   Compass,
// } from "lucide-react";
// import { Outlet, Link, useLocation } from "react-router-dom";
// import useAuthStore from "../../stores/useAuthStore";
// import useUiStateStore from "../../stores/useUiStateStore";
// import { Image } from "../../assets/Image";
// import toast from "react-hot-toast";
// import { Breadcrumbs } from "./Breadcrumbs";
// import { generateSlug } from "../../util/generateSlug";

// export const NavigationLayout = () => {
//   const [isCollapsed, setIsCollapsed] = useState(true);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//   const [activeSettingsTab, setActiveSettingsTab] = useState("general");

//   const theme = useUiStateStore((state) => state.theme);
//   const setTheme = useUiStateStore((state) => state.setTheme);

//   const user = useAuthStore((state) => state.user);
//   const userRole = useAuthStore((state) => state.userRole);
//   const logout = useAuthStore((state) => state.logout);
//   const location = useLocation();

//   // --- Theme Management ---
//   useEffect(() => {
//     const root = window.document.documentElement;
//     root.classList.remove("light", "dark");

//     if (theme === "system") {
//       const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
//         .matches
//         ? "dark"
//         : "light";
//       root.classList.add(systemTheme);
//     } else {
//       root.classList.add(theme);
//     }
//   }, [theme]);

//   useEffect(() => {
//     if (theme !== "system") return;
//     const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
//     const handleChange = () => {
//       const root = window.document.documentElement;
//       root.classList.remove("light", "dark");
//       root.classList.add(mediaQuery.matches ? "dark" : "light");
//     };

//     mediaQuery.addEventListener("change", handleChange);
//     return () => mediaQuery.removeEventListener("change", handleChange);
//   }, [theme]);

//   // --- Roles & Menus ---
//   const roleMenus = {
//     admin: [
//       { path: "/", icon: Home, label: "Dashboard" },
//       { path: "/teachers", icon: Users, label: "Teachers" },
//       { path: "/students", icon: GraduationCap, label: "Students" },
//       { path: "/registeruser", icon: UserPlus, label: "Register New User" },
//       { path: "/batches", icon: Layers, label: "Batches" },
//       { path: "/courses", icon: BadgePlus, label: "All Courses" },
//       { path: "/trades", icon: Compass, label: "Trade Management" },
//       { path: "/fees", icon: HandCoins, label: "Fees Payment" },
//       { path: "/fees-yearly-status", icon: BarChart3, label: "Fees Status" },
//       { path: "/attendance", icon: Calendar, label: "Attendance" },
//       {
//         path: "/attendance-status",
//         icon: BarChart3,
//         label: "Attendance Status",
//       },
//       {
//         path: `/profile/${generateSlug(user?.name || "user")}`,
//         icon: User,
//         label: "Profile",
//         state: { userId: user?._id },
//       },
//     ],
//     teacher: [
//       { path: "/", icon: Home, label: "Dashboard" },
//       // { path: "/teachers", icon: Users, label: "Teachers" },
//       { path: "/students", icon: GraduationCap, label: "Students" },
//       { path: "/batches", icon: Layers, label: "Assigned Batches" },
//       { path: "/attendance", icon: Calendar, label: "Attendance" },
//       {
//         path: "/attendance-status",
//         icon: BarChart3,
//         label: "Attendance Status",
//       },
//       // { path: "/fees", icon: HandCoins, label: "Fees Payment" },
//       { path: "/fees-yearly-status", icon: BarChart3, label: "Fees Status" },
//       {
//         path: `/profile/${generateSlug(user?.name || "user")}`,
//         icon: User,
//         label: "Profile",
//         state: { userId: user?._id },
//       },
//     ],
//     student: [
//       { path: "/", icon: Home, label: "Dashboard" },
//       { path: "/batches", icon: Layers, label: "My Batches" },
//       // { path: "/idcard", icon: IdCard, label: "ID Card" },
//       // { path: "/admit-card", icon: BookCheck, label: "Admit card" },
//       // { path: "/registration-form", icon: Form, label: "Registration form" },
//       // {
//       //   path: "/course-certificate",
//       //   icon: Newspaper,
//       //   label: "Course Certificate",
//       // },
//       {
//         path: "/attendance-status",
//         icon: BarChart3,
//         label: "My Attendance Status",
//       },
//       { path: "/fees-yearly-status", icon: HandCoins, label: "My Fees Status" },
//       {
//         path: `/profile/${generateSlug(user?.name || "user")}`,
//         icon: User,
//         label: "Profile",
//         state: { userId: user?._id },
//       },
//     ],
//   };

//   const currentRole = userRole ? userRole.toLowerCase() : "student";
//   const menuItems = roleMenus[currentRole] || roleMenus.student;

//   const handleLogout = async () => {
//     try {
//       await logout();
//       toast.success("Logging out...");
//     } catch (error) {
//       toast.error("Failed to log out");
//     }
//   };

//   return (
//     <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
//       {/* ---------------- SETTINGS MODAL ---------------- */}
//       <AnimatePresence>
//         {isSettingsOpen && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
//             onClick={() => setIsSettingsOpen(false)}
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0, y: 20 }}
//               animate={{ scale: 1, opacity: 1, y: 0 }}
//               exit={{ scale: 0.95, opacity: 0, y: 20 }}
//               transition={{ duration: 0.2, ease: "easeOut" }}
//               onClick={(e) => e.stopPropagation()}
//               className="w-full max-w-3xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[500px]"
//             >
//               <div className="w-full md:w-56 bg-muted/30 border-b md:border-b-0 md:border-r border-border p-6">
//                 <h2 className="text-lg font-bold text-muted-foreground mb-4 capitalize tracking-wider">
//                   Settings
//                 </h2>
//                 <nav className="space-y-2">
//                   <button
//                     onClick={() => setActiveSettingsTab("general")}
//                     className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
//                       activeSettingsTab === "general"
//                         ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
//                         : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
//                     }`}
//                   >
//                     <Settings size={20} className="shrink-0" />
//                     General
//                   </button>
//                 </nav>
//               </div>

//               <div className="flex-1 p-6 md:p-8 overflow-y-auto">
//                 <div className="flex items-center justify-between mb-8">
//                   <h3 className="text-2xl font-bold">General Settings</h3>
//                   <button
//                     onClick={() => setIsSettingsOpen(false)}
//                     className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
//                   >
//                     <X size={20} />
//                   </button>
//                 </div>

//                 {activeSettingsTab === "general" && (
//                   <div className="space-y-6">
//                     <div>
//                       <h4 className="text-lg font-semibold mb-1">Appearance</h4>
//                       <p className="text-sm text-muted-foreground">
//                         Customize how the application looks on your device.
//                       </p>
//                     </div>

//                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                       <button
//                         onClick={() => setTheme("system")}
//                         className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
//                           theme === "system"
//                             ? "border-primary bg-primary/5 text-primary"
//                             : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground bg-card"
//                         }`}
//                       >
//                         <Monitor className="mb-3" size={28} />
//                         <span className="font-medium">System</span>
//                       </button>

//                       <button
//                         onClick={() => setTheme("light")}
//                         className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
//                           theme === "light"
//                             ? "border-primary bg-primary/5 text-primary"
//                             : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground bg-card"
//                         }`}
//                       >
//                         <Sun className="mb-3" size={28} />
//                         <span className="font-medium">Light</span>
//                       </button>

//                       <button
//                         onClick={() => setTheme("dark")}
//                         className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
//                           theme === "dark"
//                             ? "border-primary bg-primary/5 text-primary"
//                             : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground bg-card"
//                         }`}
//                       >
//                         <Moon className="mb-3" size={28} />
//                         <span className="font-medium">Dark</span>
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ---------------- MOBILE HEADER & MENU ---------------- */}
//       <div className="md:hidden flex flex-col w-full h-full overflow-hidden">
//         <header className="shrink-0 flex items-center justify-between p-4 bg-card border-b border-border shadow-sm z-50 relative print:hidden">
//           <div className="flex items-center gap-3">
//             <img
//               src={Image.Logo}
//               alt="Logo"
//               className="w-8 h-8 object-contain"
//             />
//             <h1 className="font-bold text-sm leading-tight tracking-tight">
//               Institute of Knowledge
//             </h1>
//           </div>
//           <button
//             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//             className="p-2 text-foreground/80 hover:text-primary transition-colors focus:outline-none"
//           >
//             {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
//           </button>
//         </header>

//         {/* Mobile Dropdown */}
//         <AnimatePresence>
//           {isMobileMenuOpen && (
//             <motion.div
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               transition={{ ease: "linear", duration: 0.2 }}
//               className="absolute top-[68px] left-0 right-0 bg-card border-b border-border z-40 overflow-hidden shadow-lg max-h-[calc(100vh-68px)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
//             >
//               <nav className="flex flex-col p-4 space-y-2">
//                 {menuItems.map((item) => {
//                   // ✅ FIXED ACTIVE LOGIC HERE
//                   const isActive =
//                     item.path === "/"
//                       ? location.pathname === "/"
//                       : location.pathname === item.path ||
//                         location.pathname.startsWith(`${item.path}/`);

//                   return (
//                     <Link
//                       key={item.label}
//                       to={item.path}
//                       state={item.state}
//                       onClick={() => setIsMobileMenuOpen(false)}
//                       className={`flex items-center p-4 rounded-xl transition-all ${
//                         isActive
//                           ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
//                           : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
//                       }`}
//                     >
//                       <item.icon size={22} className="mr-4 shrink-0" />
//                       <span className="font-medium text-base">
//                         {item.label}
//                       </span>
//                     </Link>
//                   );
//                 })}

//                 <button
//                   onClick={() => {
//                     setIsSettingsOpen(true);
//                     setIsMobileMenuOpen(false);
//                   }}
//                   className="flex items-center p-4 rounded-xl text-foreground/70 hover:bg-primary/10 hover:text-primary transition-colors w-full text-left mt-2 border-t border-border"
//                 >
//                   <Settings className="mr-4 shrink-0" size={22} />
//                   <span className="font-medium text-base">Settings</span>
//                 </button>

//                 <button
//                   onClick={() => {
//                     handleLogout();
//                     setIsMobileMenuOpen(false);
//                   }}
//                   className="flex items-center p-4 rounded-xl text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
//                 >
//                   <LogOut className="mr-4 shrink-0" size={22} />
//                   <span className="font-medium text-base">Logout</span>
//                 </button>
//               </nav>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Mobile Main Content */}
//         <main className="flex-1 overflow-hidden w-full flex flex-col">
//           <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-6xl mx-auto flex flex-col">
//             <Breadcrumbs />
//             <div className="mt-4 flex-1 flex flex-col">
//               <Outlet />
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* ---------------- DESKTOP LAYOUT ---------------- */}

//       {/* DESKTOP SIDEBAR */}
//       <motion.aside
//         animate={{ width: isCollapsed ? "88px" : "260px" }}
//         transition={{ ease: "linear", duration: 0.2 }}
//         onMouseEnter={() => setIsCollapsed(false)}
//         onMouseLeave={() => setIsCollapsed(true)}
//         className="hidden md:flex h-full bg-card border-r border-border flex-col p-4 z-40 relative"
//       >
//         <div className="flex items-center px-2 mb-6 h-10 mt-2">
//           <img
//             src={Image.Logo}
//             alt="Logo"
//             className="w-10 h-10 object-contain shrink-0"
//           />
//           <AnimatePresence>
//             {!isCollapsed && (
//               <motion.h1
//                 initial={{ opacity: 0, x: -10 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -10 }}
//                 transition={{ ease: "linear", duration: 0.2 }}
//                 className="ml-4 font-bold text-sm leading-tight tracking-tight whitespace-nowrap overflow-hidden"
//               >
//                 Institute of
//                 <br />
//                 Knowledge
//               </motion.h1>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* SCROLLABLE NAV WITH HIDDEN SCROLLBAR */}
//         <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//           {menuItems.map((item) => {
//             // ✅ FIXED ACTIVE LOGIC HERE
//             const isActive =
//               item.path === "/"
//                 ? location.pathname === "/"
//                 : location.pathname === item.path ||
//                   location.pathname.startsWith(`${item.path}/`);

//             return (
//               <Link
//                 key={item.label}
//                 to={item.path}
//                 state={item.state}
//                 className={`w-full flex items-center p-3 rounded-xl transition-all group ${
//                   isActive
//                     ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
//                     : "text-foreground/60 hover:bg-primary/10 hover:text-primary"
//                 }`}
//               >
//                 <item.icon size={22} className="shrink-0" />
//                 {!isCollapsed && (
//                   <span className="ml-4 font-medium whitespace-nowrap">
//                     {item.label}
//                   </span>
//                 )}
//               </Link>
//             );
//           })}
//         </nav>
//       </motion.aside>

//       {/* DESKTOP MAIN CONTENT */}
//       <main className="hidden md:flex flex-col flex-1 h-full overflow-hidden relative bg-background">
//         <div className="shrink-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
//           <div>
//             <Breadcrumbs />
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => setIsSettingsOpen(true)}
//               className="p-2.5 rounded-xl border border-border bg-card text-foreground/70 hover:text-primary hover:border-primary/50 transition-all shadow-sm"
//               title="Settings"
//             >
//               <Settings size={20} />
//             </button>
//             <button
//               onClick={handleLogout}
//               className="p-2.5 rounded-xl border border-border bg-card text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all shadow-sm"
//               title="Logout"
//             >
//               <LogOut size={20} />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto w-full">
//           <div className="max-w-7xl mx-auto p-8 h-full flex flex-col">
//             <Outlet />
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

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
  IdCard,
  Newspaper,
  BookCheck,
  Form,
  Menu,
  X,
  Calendar,
  Layers,
  HandCoins,
  Settings,
  Sun,
  Moon,
  Monitor,
  BarChart3,
  Compass,
} from "lucide-react";
import { Outlet, Link, useLocation } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useUiStateStore from "../../stores/useUiStateStore";
import { Image } from "../../assets/Image";
import toast from "react-hot-toast";
import { Breadcrumbs } from "./Breadcrumbs";
import { generateSlug } from "../../util/generateSlug";

export const NavigationLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");

  const theme = useUiStateStore((state) => state.theme);
  const setTheme = useUiStateStore((state) => state.setTheme);

  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

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
      toast.success("Logging out...");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      {/* ---------------- SETTINGS MODAL ---------------- */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setIsSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85dvh] md:h-[500px]"
            >
              {/* Settings Sidebar */}
              <div className="w-full md:w-56 bg-muted/30 border-b md:border-b-0 md:border-r border-border p-4 md:p-6 shrink-0 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start">
                <h2 className="text-lg font-bold text-muted-foreground md:mb-4 capitalize tracking-wider">
                  Settings
                </h2>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="md:hidden p-2 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <X size={20} />
                </button>
                <nav className="hidden md:flex flex-col space-y-2 w-full mt-4">
                  <button
                    onClick={() => setActiveSettingsTab("general")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      activeSettingsTab === "general"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <Settings size={20} className="shrink-0" />
                    General
                  </button>
                </nav>
              </div>

              {/* Settings Content Area */}
              <div className="flex-1 p-5 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="hidden md:flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">General Settings</h3>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {activeSettingsTab === "general" && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-1">Appearance</h4>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Customize how the application looks on your device.
                      </p>
                    </div>

                    {/* Theme Toggle Grid */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <button
                        onClick={() => setTheme("system")}
                        className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-xl border-2 transition-all ${
                          theme === "system"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground bg-card"
                        }`}
                      >
                        <Monitor className="mb-2 md:mb-3 size-6 md:size-7 shrink-0" />
                        <span className="text-xs md:text-sm font-medium">
                          System
                        </span>
                      </button>

                      <button
                        onClick={() => setTheme("light")}
                        className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-xl border-2 transition-all ${
                          theme === "light"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground bg-card"
                        }`}
                      >
                        <Sun className="mb-2 md:mb-3 size-6 md:size-7 shrink-0" />
                        <span className="text-xs md:text-sm font-medium">
                          Light
                        </span>
                      </button>

                      <button
                        onClick={() => setTheme("dark")}
                        className={`flex flex-col items-center justify-center p-4 md:p-6 rounded-xl border-2 transition-all ${
                          theme === "dark"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground bg-card"
                        }`}
                      >
                        <Moon className="mb-2 md:mb-3 size-6 md:size-7 shrink-0" />
                        <span className="text-xs md:text-sm font-medium">
                          Dark
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] md:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ ease: "easeOut", duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 h-[100dvh] w-[280px] bg-card border-r border-border z-[90] flex flex-col shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={Image.Logo}
                    alt="Logo"
                    className="w-8 h-8 object-contain"
                  />
                  <h1 className="font-bold text-sm leading-tight tracking-tight">
                    Institute of <br /> Knowledge
                  </h1>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-foreground/70 hover:text-foreground hover:bg-muted active:scale-95 transition-all rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-1.5">
                  {menuItems.map((item) => {
                    const isActive =
                      item.path === "/"
                        ? location.pathname === "/"
                        : location.pathname === item.path ||
                          location.pathname.startsWith(`${item.path}/`);

                    return (
                      <Link
                        key={item.label}
                        to={item.path}
                        state={item.state}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center p-3.5 rounded-xl transition-all active:scale-[0.98] ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-foreground/70 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon size={22} className="mr-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center p-3.5 rounded-xl text-foreground/70 hover:bg-muted hover:text-foreground transition-all active:scale-[0.98] w-full text-left"
                  >
                    <Settings className="mr-4 shrink-0" size={22} />
                    <span className="font-medium">Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center p-3.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98] w-full text-left"
                  >
                    <LogOut className="mr-4 shrink-0" size={22} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <motion.aside
        animate={{ width: isCollapsed ? "88px" : "260px" }}
        transition={{ ease: "linear", duration: 0.2 }}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
        className="hidden md:flex h-full bg-card border-r border-border flex-col p-4 z-40 shrink-0 relative"
      >
        <div className="flex items-center px-2 mb-6 h-10 mt-2 shrink-0">
          <img
            src={Image.Logo}
            alt="Logo"
            className="w-10 h-10 object-contain shrink-0"
          />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ ease: "linear", duration: 0.2 }}
                className="ml-4 font-bold text-sm leading-tight tracking-tight whitespace-nowrap overflow-hidden"
              >
                Institute of
                <br />
                Knowledge
              </motion.h1>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.label}
                to={item.path}
                state={item.state}
                className={`w-full flex items-center p-3 rounded-xl transition-all group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-foreground/60 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <item.icon size={22} className="shrink-0" />
                {!isCollapsed && (
                  <span className="ml-4 font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <div className="flex-1 flex flex-col h-[100dvh] min-w-0 overflow-hidden relative bg-background">
        {/* Mobile Fixed Top Bar (Sticky Breadcrumbs & Menu) */}
        <header className="md:hidden flex items-center justify-between shrink-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <Breadcrumbs />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="ml-4 p-2 rounded-xl border border-border bg-card text-foreground/80 hover:text-primary hover:border-primary/50 active:scale-95 transition-all shadow-sm shrink-0"
            aria-label="Open Menu"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Desktop Header Toolbar */}
        <header className="hidden md:flex shrink-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 items-center justify-between">
          <div>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 rounded-xl border border-border bg-card text-foreground/70 hover:text-primary hover:border-primary/50 transition-all shadow-sm"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-border bg-card text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all shadow-sm"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Unified Scrollable Page Wrapper */}
        <main className="flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-7xl mx-auto p-4 md:p-8 h-full flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};