import { AnimatePresence } from "framer-motion";
import LoginModal from "./components/Login/LoginModal";
import LandingPage from "./pages/LandingPage";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  ProtectedRoute,
  ProtectedRouteRoleBased,
  PublicRoute,
} from "./Routes/Route";
import Dashboard from "./pages/Dashboard";
import { useEffect, useState } from "react";
import useAuthStore from "./stores/useAuthStore";
import { useLoginStore } from "./stores/useLoginStore";
import useUiStateStore from "./stores/useUiStateStore";
import AllTeachers from "./pages/Admin/AllTeachers";
import AllStudents from "./pages/Admin/AllStudents";
import Loading from "./pages/Loading";
import { NavigationLayout } from "./components/UI/NavigationLayout";
import ProfilePage from "./pages/ProfilePage";
import CoursesPage from "./pages/Admin/CoursesPage";
import CreateCourse from "./pages/Admin/CreateCourse";
import AddNewStudent from "./pages/Admin/AddNewStudent";
import AttendancePage from "./pages/AttendancePage";
import AttendanceStatus from "./pages/AttendanceStatus";
import RegisterNewUser from "./pages/RegisterNewUser";
import NotFoundPage from "./pages/NotFoundPage";
import StudentProfile from "./pages/Student/StudentProfile";
import TradeManagement from "./pages/Admin/TradeManagement";

import BatchList from "./pages/Batch/BatchList";
import BatchDetails from "./pages/Batch/BatchDetails";
import CreateBatch from "./pages/Batch/CreateBatch";
import EditBatch from "./pages/Batch/EditBatch";
import CourseDetails from "./pages/Admin/CourseDetails";

import Fees from "./pages/Fees";
import FeesYearlyStatus from "./pages/FeesYearlyStatus";
import IdCard from "./components/IDcard/IdCard";
import AccessDenied from "./pages/AccessDenied";
import TeacherProfile from "./pages/Teacher/TeacherProfile";

const App = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openLoginModal = useLoginStore((state) => state.openModal);
  const isDarkMode = useUiStateStore((state) => state.isDarkMode);
  const loaduser = useAuthStore((state) => state.loadUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      await loaduser();
      setIsLoading(false);
    };

    initApp();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timeOut = setTimeout(openLoginModal, 5000);
      return () => clearTimeout(timeOut);
    }
  }, [isAuthenticated, openLoginModal, isLoading]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <AnimatePresence mode="Wait">
      <Router>
        <Toaster />
        <LoginModal />
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route element={<NavigationLayout />}>
              {/* ==========================================
                  ROLE: ALL USERS (Admin, Teacher, Student)
                  ========================================== */}
              <Route
                element={
                  <ProtectedRouteRoleBased
                    allowedRoles={["Admin", "Teacher", "Student"]}
                  />
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile/:username" element={<ProfilePage />} />

                {/* SHARED ROUTES NOW PLACED HERE */}
                <Route
                  path="/attendance-status"
                  element={<AttendanceStatus />}
                />
                <Route
                  path="/fees-yearly-status"
                  element={<FeesYearlyStatus />}
                />

                {/* BATCH VIEWING ROUTES */}
                <Route path="/batches" element={<BatchList />} />
                <Route path="/batches/:batchName" element={<BatchDetails />} />
              </Route>

              {/* ==========================================
                  ROLE: STAFF ONLY (Admin, Teacher)
                  ========================================== */}
              <Route
                element={
                  <ProtectedRouteRoleBased
                    allowedRoles={["Admin", "Teacher"]}
                  />
                }
              >
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/students" element={<AllStudents />} />
              </Route>

              {/* ==========================================
                  ROLE: (Teacher , Student)
                  ========================================== */}

              {/* <Route
                element={
                  <ProtectedRouteRoleBased
                    allowedRoles={["Student", "Teacher"]}
                  />
                }
              >
                <Route path="/idcard" element={<IdCard />} />
              </Route> */}

              {/* ==========================================
                  ROLE: ADMIN ONLY
                  ========================================== */}
              <Route
                element={<ProtectedRouteRoleBased allowedRoles={["Admin"]} />}
              >
                <Route path="/studentprofile" element={<StudentProfile />} />
                <Route path="/teacherprofile" element={<TeacherProfile />} />
                <Route path="/teachers" element={<AllTeachers />} />
                <Route path="/fees" element={<Fees />} />
                <Route path="/courses">
                  <Route index element={<CoursesPage />} />
                  <Route
                    path="/courses/:courseName"
                    element={<CourseDetails />}
                  />

                  <Route path="createcourse" element={<CreateCourse />} />
                  <Route path="addnewstudent" element={<AddNewStudent />} />
                </Route>
                <Route path="/registeruser" element={<RegisterNewUser />} />
                <Route path="/trades" element={<TradeManagement />} />

                {/* BATCH MANAGEMENT ROUTES */}
                <Route path="/batches/create" element={<CreateBatch />} />
                <Route path="/batches/edit" element={<EditBatch />} />
              </Route>

              {/* ==========================================
                  ROLE: STUDENT ONLY
                  ========================================== */}
              <Route
                element={<ProtectedRouteRoleBased allowedRoles={["Student"]} />}
              >
                <Route path="/student-profile" element={<StudentProfile />} />

                {/* <Route path="/course-certificate" /> */}
                {/* <Route path="/admit-card" /> */}
                {/* <Route path="/registration-form" /> */}
              </Route>
            </Route>
          </Route>

          <Route path="/home" element={<LandingPage />} />

          {/* ACCESS DENIED & 404 ROUTES */}
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AnimatePresence>
  );
};

export default App;