import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Edit3,
  Save,
  X,
  ZoomIn,
  Shield,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  Trash2,
  ShieldAlert,
  BookOpen,
  Clock,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/useAuthStore";
import useUserStore from "../../stores/useUserStore";
import BackButton from "../../components/UI/Button";
import useBatchStore from "../../stores/useBatchStore";
import useClassStore from "../../stores/useClassStore";
import { generateSlug } from "../../util/generateSlug";
import { Image } from "../../assets/Image";

const TeacherProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route State & Auth
  const targetUserId = location.state?.userId || location.state?.teacherId;
  const passedTeacherData =
    location.state?.userData ||
    location.state?.teacherData ||
    location.state?.teacher;

  const loggedInUser = useAuthStore((state) => state.user);
  const activeUserId = targetUserId || loggedInUser?._id;

  const userRole = loggedInUser?.role?.toLowerCase() || "";
  const isAdmin = userRole === "admin";
  const isSelf = activeUserId === loggedInUser?._id;

  const canEdit = isAdmin || isSelf; // Assuming teachers can edit their own basic info. Change to `isAdmin` if strictly admin-only.

  // --- ZUSTAND STORES ---
  const getUserById = useUserStore((state) => state.getUserById);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const isUpdating = useUserStore((state) => state.isLoading);
  const { batches, fetchBatches } = useBatchStore();
  const { allClass, getClasses } = useClassStore();

  // Local State
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Modals & Viewers
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({});
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);

  useEffect(() => {
    fetchBatches();
    getClasses();
  }, [fetchBatches, getClasses]);

  useEffect(() => {
    if (!activeUserId) {
      toast.error("No valid user ID provided.");
      navigate(-1);
      return;
    }

    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        // 1. Optimistically load passed data if available
        let currentData = null;
        if (passedTeacherData && passedTeacherData._id === activeUserId) {
          currentData = passedTeacherData;
        } else if (isSelf) {
          currentData = loggedInUser;
        }

        if (currentData) {
          setProfileData(currentData);
          setFormData(currentData);
        }

        // 2. ALWAYS fetch fresh data to prevent stale location.state cache issues
        let freshData = currentData;
        try {
          const response = await getUserById(activeUserId);
          const fetchedUser =
            response?.data?.user ||
            response?.user ||
            response?.data ||
            response;
          if (fetchedUser && fetchedUser._id) {
            freshData = fetchedUser;
            setProfileData(freshData);
            setFormData(freshData);
          }
        } catch (fetchErr) {
          console.error("Failed to fetch fresh user data:", fetchErr);
          if (!freshData) throw new Error("Invalid or missing teacher data.");
        }
      } catch (error) {
        console.error("Profile Fetch Error:", error);
        toast.error("Failed to load teacher profile data.");
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [
    activeUserId,
    passedTeacherData,
    isSelf,
    loggedInUser,
    getUserById,
    navigate,
  ]);

  const cleanupPreviews = () => {
    if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData(profileData);
    cleanupPreviews();
    setNewProfilePic(null);
    setNewProfilePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const onlyNumbers = value.replace(/\D/g, "");
      if (onlyNumbers.length <= 10) {
        setFormData({ ...formData, [name]: onlyNumbers });
      }
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg"
      ) {
        if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
        setNewProfilePic(file);
        setNewProfilePreview(URL.createObjectURL(file));
      } else {
        toast.error(
          "Restricted: Only JPG and PNG images can be uploaded for profile pictures.",
        );
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!canEdit) {
      setIsEditing(false);
      return toast.error("Access denied. You cannot edit this profile.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      return toast.error("Please enter a valid email address.");
    }
    if (formData.phone && formData.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits.");
    }

    const submitData = new FormData();
    submitData.append("name", formData.name);
    submitData.append("email", formData.email);
    submitData.append("phone", formData.phone);
    if (newProfilePic) submitData.append("profilePic", newProfilePic);

    try {
      const serverResponse = await updateUser(profileData._id, submitData);

      const freshUserData =
        serverResponse?.data?.user ||
        serverResponse?.user ||
        serverResponse?.data ||
        serverResponse;

      setProfileData(freshUserData);
      setFormData(freshUserData);
      if (isSelf) useAuthStore.setState({ user: freshUserData });

      // Replace React Router history state to prevent caching issues on reload
      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          userId: freshUserData._id,
          userData: freshUserData,
          teacherData: freshUserData,
          teacher: freshUserData,
        },
      });

      toast.success("Profile updated successfully!");
      cleanupPreviews();
      setIsEditing(false);
      setNewProfilePic(null);
      setNewProfilePreview(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update profile",
      );
    }
  };

  const confirmDeleteAction = async () => {
    if (!isAdmin || isSelf) return;
    setIsDeleting(true);
    try {
      await deleteUser(profileData._id);
      toast.success("Teacher deleted successfully.");
      setShowDeleteModal(false);
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete teacher");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatIdCardDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      date.getFullYear(),
    ].join(".");
  };

  const escapeHtml = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getAbsoluteUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return window.location.origin + (path.startsWith("/") ? path : `/${path}`);
  };

  const getTeacherEmployeeId = (teacher) => {
    if (!teacher) return "IK000000A000";
    const joinedDate = teacher.createdAt
      ? new Date(teacher.createdAt)
      : new Date();
    const year = Number.isNaN(joinedDate.getTime())
      ? new Date().getFullYear()
      : joinedDate.getFullYear();
    const month = Number.isNaN(joinedDate.getTime())
      ? "00"
      : String(joinedDate.getMonth() + 1).padStart(2, "0");
    const source = String(
      teacher._id || teacher.id || teacher.email || teacher.name || "",
    );
    const numericPart =
      (parseInt(source.replace(/[^a-fA-F0-9]/g, "").slice(-6), 16) || 0) % 1000;

    return `IK${month}${year}A${String(numericPart + 1).padStart(3, "0")}`;
  };

  const openProfilePicModal = (src) => {
    if (src) {
      setModalImageSrc(src);
      setShowProfilePicModal(true);
    }
  };

  const teacherBatches =
    batches?.filter(
      (b) =>
        b.teacherEmail === profileData?.email ||
        b.teachers?.some((t) => (t._id || t) === profileData?._id),
    ) || [];

  const teacherCourses =
    allClass?.filter(
      (c) =>
        c.teacherEmail === profileData?.email ||
        c.teachers?.some((t) => (t._id || t) === profileData?._id),
    ) || [];

  const displayBatches =
    teacherBatches.length > 0 ? teacherBatches : profileData?.batches || [];

  const displayCourses =
    teacherCourses.length > 0 ? teacherCourses : profileData?.mainClasses || [];

  const getCourseName = (course) => {
    const courseObj =
      typeof course === "object"
        ? course
        : allClass?.find((cls) => cls._id === course);
    return courseObj?.name || courseObj?.courseName || course || "";
  };

  const handlePrintIdCard = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print teacher ID card");
      return;
    }

    const cardTemplateUrl = getAbsoluteUrl(Image.teacherIdCardTemplate);
    const profilePicUrl = getAbsoluteUrl(profileData.profilePic || "");
    const department =
      profileData.department ||
      profileData.dept ||
      getCourseName(displayCourses?.[0]) ||
      "Information Technology (IT)";
    const designation =
      profileData.designation ||
      profileData.position ||
      profileData.title ||
      "Senior IT Faculty";
    const employeeId =
      profileData.employeeId ||
      profileData.employeeID ||
      profileData.teacherId ||
      getTeacherEmployeeId(profileData);
    const joiningDate = formatIdCardDate(
      profileData.joiningDate || profileData.joinedAt || profileData.createdAt,
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teacher ID Card - ${escapeHtml(profileData.name)}</title>
          <style>
            * { box-sizing: border-box; }
            html, body { margin: 0; min-height: 100%; background: #111; font-family: Arial, Helvetica, sans-serif; }
            body { display: flex; align-items: center; justify-content: center; padding: 18px; }
            .id-card {
              position: relative;
              width: min(88mm, calc(100vw - 24px));
              aspect-ratio: 6496 / 10039;
              overflow: hidden;
              background: #000;
              color: #fff;
            }
            .template {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 1;              position: absolute;
              z-index: 2;
              left: 50%;
              top: 27.8%;
              transform: translate(-50%, -50%);
              width: 44%;
              height: 28.5%;
              border-radius: 50%;
              object-fit: cover;
              object-position: center top;
              background: #0b5db8;
              border: 2px solid rgba(255, 255, 255, 0.9)
            }
            .teacher-photo {
              position: absolute;
              z-index: 2;
              left: 49.5%;
              top: 30%;
              transform: translate(-50%, -50%);
              width: 44%;
              height: 28.5%;
              border-radius: 50%;
              object-fit: cover;
              object-position: center top;
              background: #0b5db8;
              border: 2px solid rgba(255, 255, 255, 0.9);
            }
            .field {
              position: absolute;
              z-index: 3;
              width: 82%;
              left: 9%;
              text-align: center;
              line-height: 1.05;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: clip;
              letter-spacing: 0;
            }
            .name {
              top: 50.35%;
              font-size: clamp(24px, 7.2vw, 48px);
              font-weight: 500;
              color: #fff;
              text-transform: uppercase;
            }
            .designation {
              top: 57.25%;
              font-size: clamp(18px, 5vw, 34px);
              font-weight: 700;
              color: #ffc400;
              text-transform: uppercase;
            }
            .department {
              top: 64.35%;
              font-size: clamp(15px, 4.1vw, 28px);
              font-weight: 500;
              color: #fff;
            }
            .employee-id {
              top: 68.65%;
              font-size: clamp(15px, 4.1vw, 28px);
              font-weight: 700;
              color: #ffc400;
            }
            .joining-date {
              top: 81.25%;
              left: 40%;
              width: 54%;
              text-align: left;
              font-size: clamp(13px, 3.4vw, 24px);
              font-weight: 800;
              color: #fff;
            }
            .placeholder-photo {
              position: absolute;
              z-index: 2;
              left: 50%;
              top: 27.8%;
              transform: translate(-50%, -50%);
              width: 44%;
              height: 28.5%;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: rgba(255,255,255,0.9);
              font-size: 54px;
              font-weight: 800;
              background: #0b5db8;
              border: 2px solid rgba(255, 255, 255, 0.9);
            }
            @media print {
              @page { size: 88mm 136mm; margin: 0; }
              html, body { width: 88mm; min-height: 136mm; background: #fff; padding: 0; }
              body { display: block; }
              .id-card { width: 88mm; height: 136mm; }
              .name { font-size: 7.2mm; }
              .designation { font-size: 5.2mm; }
              .department, .employee-id { font-size: 4.2mm; }
              .joining-date { font-size: 3.7mm; }
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <img class="template" src="${cardTemplateUrl}" alt="Teacher ID card template" />
            ${
              profilePicUrl
                ? `<img class="teacher-photo" src="${profilePicUrl}" alt="${escapeHtml(profileData.name)}" />`
                : `<div class="placeholder-photo">${escapeHtml(profileData.name?.charAt(0)?.toUpperCase() || "T")}</div>`
            }
            <div class="field name" data-fit-text data-fit-min="14">${escapeHtml(profileData.name || "Teacher Name")}</div>
            <div class="field designation" data-fit-text data-fit-min="10">${escapeHtml(designation)}</div>
            <div class="field department" data-fit-text data-fit-min="10">Dept. of ${escapeHtml(department)}</div>
            <div class="field employee-id" data-fit-text data-fit-min="10">Employee ID : ${escapeHtml(employeeId)}</div>
            <div class="joining-date">Date of Joining : ${escapeHtml(joiningDate)}</div>
          </div>
          <script>
            function fitTextFields() {
              document.querySelectorAll("[data-fit-text]").forEach(function(el) {
                var min = Number(el.dataset.fitMin || 9);
                var max = parseFloat(window.getComputedStyle(el).fontSize);
                var size = max;
                el.style.fontSize = size + "px";
                while (el.scrollWidth > el.clientWidth && size > min) {
                  size -= 0.5;
                  el.style.fontSize = size + "px";
                }
              });
            }
            window.onload = function() {
              setTimeout(function() {
                fitTextFields();
                window.print();
                window.close();
              }, 700);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (isLoading || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-md"></div>
          <p className="text-muted-foreground font-medium animate-pulse">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 w-full sm:w-1/3 text-muted-foreground">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          {Icon && <Icon size={16} />}
        </div>
        <p className="text-sm font-medium capitalize tracking-wider">{label}</p>
      </div>
      <div className="sm:w-2/3 pl-11 sm:pl-0">
        {typeof value === "string" || typeof value === "number" ? (
          <p className="text-sm sm:text-base font-semibold text-foreground break-words">
            {value || "Not Provided"}
          </p>
        ) : (
          value || (
            <p className="text-sm sm:text-base font-semibold text-foreground">
              Not Provided
            </p>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 bg-background text-foreground font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex items-center gap-2 sm:gap-3">
            {!isEditing && (
              <button
                onClick={handlePrintIdCard}
                className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Printer
                  size={16}
                  className="group-hover:-translate-y-0.5 transition-transform"
                />
                <span className="hidden sm:inline">Print ID Card</span>
              </button>
            )}
            {isAdmin && !isSelf && !isEditing && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="group flex items-center gap-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-destructive/20 shadow-sm active:scale-95"
              >
                <Trash2 size={16} />{" "}
                <span className="hidden sm:inline">Delete Teacher</span>
              </button>
            )}
            {canEdit && !isEditing && (
              <button
                onClick={startEditing}
                className="group flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Edit3
                  size={16}
                  className="group-hover:rotate-12 transition-transform"
                />{" "}
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {!canEdit && !isSelf && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <p>
              Read-Only Mode. You have permission to view this profile, but only
              Administrators or the user themselves can edit details.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Profile Banner Card */}
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center shadow-sm relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="relative shrink-0 z-10">
                  <div
                    onClick={() => openProfilePicModal(profileData.profilePic)}
                    className={`w-28 h-28 sm:w-36 sm:h-36 border-4 border-card shadow-xl bg-muted rounded-full overflow-hidden relative group ${profileData.profilePic ? "cursor-pointer" : ""}`}
                  >
                    {profileData.profilePic ? (
                      <>
                        <img
                          src={profileData.profilePic}
                          alt="Profile"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <ZoomIn
                            className="text-white drop-shadow-md"
                            size={28}
                          />
                        </div>
                      </>
                    ) : (
                      <User
                        size={48}
                        className="text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left z-10 w-full">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize tracking-tight">
                    {profileData.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                    <span className="flex items-center gap-1.5 text-sm text-primary-foreground font-bold bg-primary border border-primary/20 px-4 py-1.5 rounded-lg shadow-sm">
                      <Shield size={14} />{" "}
                      {profileData.role
                        ? profileData.role.charAt(0).toUpperCase() +
                          profileData.role.slice(1)
                        : "Teacher"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid - Single Column for Teachers to keep it clean */}
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
                <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-2">
                  <UserCheck className="text-primary" size={18} />
                  <h3 className="font-bold text-foreground">
                    Contact & Professional Details
                  </h3>
                </div>
                <div className="divide-y divide-border/50 grid grid-cols-1 md:grid-cols-2">
                  <div className="col-span-1 md:border-r border-border/50">
                    <InfoRow
                      icon={Mail}
                      label="Email Address"
                      value={profileData.email}
                    />
                  </div>
                  <div className="col-span-1">
                    <InfoRow
                      icon={Phone}
                      label="Phone Number"
                      value={profileData.phone}
                    />
                  </div>
                  <div className="col-span-1 md:border-r md:border-t-0 border-t border-border/50">
                    <InfoRow
                      icon={Shield}
                      label="System Role"
                      value={profileData.role || "Teacher"}
                    />
                  </div>
                  <div className="col-span-1 md:border-t-0 border-t border-border/50">
                    <InfoRow
                      icon={Calendar}
                      label="Joined Date"
                      value={formatDate(profileData.createdAt)}
                    />
                  </div>
                  <div className="col-span-1 md:border-r md:border-t-0 border-t border-border/50">
                    <InfoRow
                      icon={BookOpen}
                      label="Assigned Courses"
                      value={
                        displayCourses?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {displayCourses.map((c, i) => {
                              const courseObj =
                                typeof c === "object"
                                  ? c
                                  : allClass?.find((cls) => cls._id === c);
                              const courseName = courseObj ? courseObj.name : c;
                              const isClickable = isAdmin && courseObj;

                              const content = (
                                <span
                                  key={courseObj?._id || i}
                                  className={`bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md text-xs font-semibold ${isClickable ? "hover:bg-primary/20 cursor-pointer transition-colors" : ""}`}
                                >
                                  {courseName}
                                </span>
                              );

                              return isClickable ? (
                                <Link
                                  key={courseObj?._id || i}
                                  to={`/courses/${generateSlug(courseObj.name)}`}
                                  state={{
                                    courseId: courseObj._id,
                                    courseName: courseObj.name,
                                  }}
                                >
                                  {content}
                                </Link>
                              ) : (
                                content
                              );
                            })}
                          </div>
                        ) : (
                          "None"
                        )
                      }
                    />
                  </div>
                  <div className="col-span-1 md:border-t-0 border-t border-border/50">
                    <InfoRow
                      icon={Clock}
                      label="Assigned Batches"
                      value={
                        displayBatches?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {displayBatches.map((b, i) => {
                              const batchObj =
                                typeof b === "object"
                                  ? b
                                  : batches?.find((batch) => batch._id === b);
                              const batchName = batchObj
                                ? `${batchObj.name} (${batchObj.weekday})`
                                : b;
                              const isClickable = isAdmin && batchObj;

                              const content = (
                                <span
                                  key={batchObj?._id || i}
                                  className={`bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-semibold ${isClickable ? "hover:bg-emerald-500/20 cursor-pointer transition-colors" : ""}`}
                                >
                                  {batchName}
                                </span>
                              );

                              return isClickable ? (
                                <Link
                                  key={batchObj?._id || i}
                                  to={`/batches/${generateSlug(batchObj.name)}`}
                                  state={{
                                    batchId: batchObj._id,
                                    batchName: batchObj.name,
                                  }}
                                >
                                  {content}
                                </Link>
                              ) : (
                                content
                              );
                            })}
                          </div>
                        ) : (
                          "None"
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= EDIT MODE ================= */
            <motion.div
              key="edit-mode"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <form
                onSubmit={handleUpdate}
                className="bg-card p-6 sm:p-8 rounded-2xl shadow-xl border border-border"
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <Edit3 className="text-primary" size={20} />
                  <h2 className="text-xl font-bold text-foreground">
                    Edit Teacher Details
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 bg-muted/30 p-6 rounded-xl border border-border/50">
                  <div className="relative shrink-0">
                    <div
                      onClick={() =>
                        openProfilePicModal(
                          newProfilePreview || profileData.profilePic,
                        )
                      }
                      className={`w-24 h-24 rounded-full shadow-md border-4 border-card bg-muted overflow-hidden relative group ${newProfilePreview || profileData.profilePic ? "cursor-pointer" : ""}`}
                    >
                      {newProfilePreview || profileData.profilePic ? (
                        <>
                          <img
                            src={newProfilePreview || profileData.profilePic}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ZoomIn size={20} className="text-white" />
                          </div>
                        </>
                      ) : (
                        <User
                          size={32}
                          className="text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-bold block mb-2 text-foreground">
                      Update Profile Photo
                    </label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleProfilePicChange}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mapping Fields */}
                  {[
                    {
                      label: "Full Name",
                      name: "name",
                      icon: User,
                      type: "text",
                      req: true,
                    },
                    {
                      label: "Email Address",
                      name: "email",
                      icon: Mail,
                      type: "email",
                      req: true,
                    },
                    {
                      label: "Phone Number",
                      name: "phone",
                      icon: Phone,
                      type: "text",
                      req: true,
                      placeholder: "10-digit number",
                    },
                  ].map((field) => (
                    <div
                      key={field.name}
                      className={`space-y-2 ${field.name === "name" ? "md:col-span-2" : ""}`}
                    >
                      <label className="text-sm font-bold text-foreground">
                        {field.label}{" "}
                        {field.req && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <div className="relative">
                        <field.icon
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />

                        <input
                          type={field.type}
                          name={field.name}
                          value={formData[field.name] || ""}
                          onChange={handleInputChange}
                          required={field.req}
                          placeholder={field.placeholder}
                          className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 rounded-xl font-bold text-sm bg-muted hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-8 py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 active:scale-95"
                  >
                    <Save size={16} />{" "}
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Pic Viewer Modal */}
      <AnimatePresence>
        {showProfilePicModal && modalImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProfilePicModal(false)}
          >
            <div className="relative max-w-3xl w-full flex justify-center">
              <button
                className="absolute -top-12 right-0 sm:-right-8 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition-colors z-50"
                onClick={() => setShowProfilePicModal(false)}
              >
                <X size={24} />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={modalImageSrc}
                alt="Full Profile"
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card p-6 rounded-2xl shadow-xl max-w-md w-full border border-border">
            <h3 className="text-xl font-bold text-foreground mb-4">
              Confirm Deletion
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete {profileData.name}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-muted font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold flex items-center gap-2"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfile;
