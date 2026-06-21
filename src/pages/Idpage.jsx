import React, { useEffect } from "react";
import IdCard from "../components/IDcard/IdCard";
import useAuthStore from "../stores/useAuthStore";
import useUserStore from "../stores/useUserStore";
import { Image } from "../assets/Image";
import { getStudentId } from "../util/getStudentId";

const Idpage = () => {
  // Extract your refetch function from the store (e.g., checkAuth, fetchProfile, etc.)
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const students = useUserStore((state) => state.students);
  const getStudents = useUserStore((state) => state.getStudents);

  // Refetch data every time the user navigates to the ID Page
  useEffect(() => {
    if (loadUser) {
      loadUser();
    }
    if (getStudents && !students?.length) {
      getStudents();
    }
  }, [loadUser, getStudents, students]);

  // Show a proper loading state while fetching/authenticating
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-muted-foreground transition-colors duration-300">
        <div className="w-8 h-8 animate-spin border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="font-medium tracking-wide">Loading ID Card...</p>
      </div>
    );
  }

  // Format the data safely
  const studentData = {
    profileImage: user?.profilePic,
    name: user?.name || "Unknown Student",
    idNumber: getStudentId(user, students) || "N/A",
    role: user?.role || "Student",
    validUntil: user?.graduationDate || "2026-12-31",
    qrCode: user?.qrCodeUrl || Image?.qrCode,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300 p-4 md:p-8">
      <IdCard
        profileImage={studentData.profileImage}
        qrCode={studentData.qrCode}
        details={{
          name: studentData.name,
          role: "Student",
          idNumber: studentData.idNumber,
          validUntil: "2026-12-31",
        }}
      />
    </div>
  );
};

export default Idpage;
