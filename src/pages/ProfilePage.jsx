// import React, {
//   memo,
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   ArrowLeft,
//   BookOpen,
//   Calendar,
//   Check,
//   ChevronDown,
//   ChevronUp,
//   Clock,
//   Edit3,
//   FileText,
//   Flag,
//   GraduationCap,
//   Hash,
//   Mail,
//   MapPin,
//   Phone,
//   Printer,
//   Save,
//   Shield,
//   ShieldAlert,
//   Trash2,
//   User,
//   UserCheck,
//   X,
//   ZoomIn,
// } from "lucide-react";
// import toast from "react-hot-toast";
// import { Helmet } from "react-helmet-async";

// import useAuthStore from "../stores/useAuthStore";
// import useUserStore from "../stores/useUserStore";
// import useBatchStore from "../stores/useBatchStore";
// import useClassStore from "../stores/useClassStore";
// import BackButton from "../components/UI/Button";
// import { COUNTRIES } from "../util/Countries";
// import { getStudentId } from "../util/getStudentId";
// import { Image } from "../assets/Image";
// import {
//   canTeacherAccessStudent,
//   filterBatchesForTeacher,
// } from "../util/teacherAccessControl";

// const ROLE = {
//   ADMIN: "admin",
//   TEACHER: "teacher",
//   STUDENT: "student",
// };

// const normalizeRole = (role) => String(role || ROLE.STUDENT).toLowerCase();

// const getEntityId = (value) => {
//   if (!value) return "";
//   if (typeof value === "string") return value;
//   return value._id || value.id || value.studentId || "";
// };

// const idsEqual = (a, b) =>
//   Boolean(getEntityId(a) && getEntityId(b)) &&
//   String(getEntityId(a)) === String(getEntityId(b));

// const getName = (user) => {
//   if (!user) return "Student";
//   if (user.name) return user.name;
//   return (
//     `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//     user.email ||
//     "Student"
//   );
// };

// const getInitials = (user) => {
//   const name = getName(user).trim();
//   const parts = name.split(/\s+/).filter(Boolean);
//   return (
//     parts.length > 1
//       ? `${parts[0][0]}${parts[parts.length - 1][0]}`
//       : name.slice(0, 2)
//   ).toUpperCase();
// };

// const avatarGradients = [
//   "from-blue-500 to-indigo-600",
//   "from-violet-500 to-fuchsia-600",
//   "from-emerald-500 to-teal-600",
//   "from-orange-500 to-rose-600",
//   "from-cyan-500 to-blue-600",
//   "from-pink-500 to-purple-600",
// ];

// const getAvatarGradient = (value = "") => {
//   let hash = 0;
//   for (let i = 0; i < value.length; i += 1)
//     hash = value.charCodeAt(i) + ((hash << 5) - hash);
//   return avatarGradients[Math.abs(hash) % avatarGradients.length];
// };

// const getPhoto = (user) =>
//   user?.profilePic ||
//   user?.profilePicture ||
//   user?.profile_picture ||
//   user?.photo ||
//   user?.image ||
//   "";

// const getBatchStudentIds = (batch) => {
//   const ids = new Set();

//   (batch?.students || []).forEach((student) => {
//     const id = getEntityId(student);
//     if (id) ids.add(String(id));
//   });

//   (batch?.mainClassStudentPairs || []).forEach((pair) => {
//     const id = getEntityId(pair?.student);
//     if (id) ids.add(String(id));
//   });

//   return ids;
// };

// const batchHasStudent = (batch, studentId) =>
//   getBatchStudentIds(batch).has(String(studentId));

// const getBatchMainClassId = (batch, studentId) => {
//   const pair = (batch?.mainClassStudentPairs || []).find((item) =>
//     idsEqual(item?.student, studentId),
//   );

//   return (
//     getEntityId(pair?.mainClass) ||
//     getEntityId(pair?.mainClassId) ||
//     getEntityId(batch?.mainClass) ||
//     getEntityId(batch?.mainClassId) ||
//     ""
//   );
// };

// const getClassName = (classItem) =>
//   typeof classItem === "object"
//     ? classItem?.name || classItem?.courseName || classItem?.title || "Course"
//     : classItem || "Course";

// const formatDate = (value) => {
//   if (!value) return "-";
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return "-";
//   return date.toLocaleDateString("en-GB", {
//     day: "2-digit",
//     month: "long",
//     year: "numeric",
//   });
// };

// const absoluteUrl = (path) => {
//   if (!path) return "";
//   if (/^(https?:|data:|blob:)/i.test(path)) return path;
//   return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
// };

// const escapeHtml = (value = "") =>
//   String(value)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");

// const InfoRow = memo(({ icon: Icon, label, value }) => (
//   <div className="flex items-start gap-3 p-4 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
//     <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
//       {Icon && <Icon size={16} />}
//     </div>
//     <div className="min-w-0 flex-1">
//       <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//         {label}
//       </p>
//       <div className="mt-1 text-sm font-semibold text-foreground break-words">
//         {value || "Not Provided"}
//       </div>
//     </div>
//   </div>
// ));

// const Section = memo(
//   ({ title, icon: Icon, action, children, className = "" }) => (
//     <section
//       className={`bg-card border border-border rounded-2xl shadow-sm overflow-hidden ${className}`}
//     >
//       <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
//         <div className="flex items-center gap-2.5">
//           <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
//             <Icon size={18} />
//           </div>
//           <h2 className="font-bold text-foreground">{title}</h2>
//         </div>
//         {action}
//       </div>
//       {children}
//     </section>
//   ),
// );

// const ConfirmModal = memo(
//   ({ open, title, message, confirmText, loading, onClose, onConfirm }) => {
//     if (!open) return null;

//     return (
//       <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.96, y: 12 }}
//           animate={{ opacity: 1, scale: 1, y: 0 }}
//           className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6"
//         >
//           <div className="w-11 h-11 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
//             <Trash2 size={20} />
//           </div>
//           <h3 className="text-lg font-bold text-foreground">{title}</h3>
//           <p className="mt-2 text-sm text-muted-foreground leading-6">
//             {message}
//           </p>
//           <div className="mt-6 flex justify-end gap-3">
//             <button
//               onClick={onClose}
//               disabled={loading}
//               className="px-4 py-2.5 rounded-xl bg-muted font-semibold text-sm"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onConfirm}
//               disabled={loading}
//               className="px-4 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-60"
//             >
//               {loading ? "Please wait..." : confirmText}
//             </button>
//           </div>
//         </motion.div>
//       </div>
//     );
//   },
// );

// const ProfileSkeleton = () => (
//   <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
//     <div className="max-w-5xl mx-auto space-y-5 animate-pulse">
//       <div className="h-10 w-28 bg-muted rounded-xl" />
//       <div className="h-52 bg-card border border-border rounded-2xl" />
//       <div className="grid lg:grid-cols-2 gap-5">
//         <div className="h-72 bg-card border border-border rounded-2xl" />
//         <div className="h-72 bg-card border border-border rounded-2xl" />
//       </div>
//       <div className="h-48 bg-card border border-border rounded-2xl" />
//     </div>
//   </div>
// );

// const ProfilePage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   const loggedInUser = useAuthStore((state) => state.user);
//   const getUserById = useUserStore((state) => state.getUserById);
//   const updateUser = useUserStore((state) => state.updateUser);
//   const deleteUser = useUserStore((state) => state.deleteUser);
//   const userLoading = useUserStore((state) => state.isLoading);

//   const batches = useBatchStore((state) => state.batches);
//   const fetchBatches = useBatchStore((state) => state.fetchBatches);
//   const removeStudentFromBatch = useBatchStore(
//     (state) => state.removeStudentFromBatch,
//   );

//   const getMainClassById = useClassStore(
//     (state) => state.getMainClassById || state.getClassById,
//   );
//   const getStudentProgress = useClassStore((state) => state.getStudentProgress);
//   const getClasses = useClassStore((state) => state.getClasses);
//   const allClass = useClassStore((state) => state.allClass || []);

//   const targetUserId =
//     location.state?.userId ||
//     location.state?.studentId ||
//     location.state?.teacherId;

//   const passedUserData =
//     location.state?.userData ||
//     location.state?.studentData ||
//     location.state?.teacherData ||
//     location.state?.student ||
//     location.state?.teacher;

//   const activeUserId = targetUserId || loggedInUser?._id;
//   const viewerRole = normalizeRole(loggedInUser?.role);
//   const isSelf = String(activeUserId) === String(loggedInUser?._id);

//   const [profileData, setProfileData] = useState(
//     passedUserData || (isSelf ? loggedInUser : null),
//   );
//   const [formData, setFormData] = useState(
//     passedUserData || (isSelf ? loggedInUser : {}),
//   );
//   const [isLoading, setIsLoading] = useState(!profileData);
//   const [isEditing, setIsEditing] = useState(false);

//   const [showProgress, setShowProgress] = useState(true);
//   const [showBatches, setShowBatches] = useState(true);
//   const [showDocuments, setShowDocuments] = useState(true);

//   const [detailedProgress, setDetailedProgress] = useState({});
//   const [loadingProgress, setLoadingProgress] = useState({});

//   const [activeDocument, setActiveDocument] = useState(null);
//   const [modalImageSrc, setModalImageSrc] = useState(null);
//   const [showProfilePicModal, setShowProfilePicModal] = useState(false);

//   const [newProfilePic, setNewProfilePic] = useState(null);
//   const [newProfilePreview, setNewProfilePreview] = useState(null);
//   const [newDocuments, setNewDocuments] = useState([]);
//   const [existingDocuments, setExistingDocuments] = useState([]);

//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showRemoveBatchModal, setShowRemoveBatchModal] = useState(false);
//   const [batchToRemove, setBatchToRemove] = useState(null);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [isRemovingFromBatch, setIsRemovingFromBatch] = useState(false);

//   const [certificateCourse, setCertificateCourse] = useState(null);
//   const [certificateGrade, setCertificateGrade] = useState("");

//   const classCacheRef = useRef(new Map());
//   const userCacheRef = useRef(new Map());
//   const userInFlightRef = useRef(new Map());

//   const targetRole = normalizeRole(profileData?.role);
//   const isAdmin = viewerRole === ROLE.ADMIN;
//   const isTeacher = viewerRole === ROLE.TEACHER;
//   const isTargetStudent = targetRole === ROLE.STUDENT;
//   const isTargetTeacher = targetRole === ROLE.TEACHER;
//   const isTargetAdmin = targetRole === ROLE.ADMIN;

//   // Existing permission model is preserved: only Admin edits student/admin profiles.
//   // A Teacher can edit their own profile only.
//   const canEdit = isAdmin || (isTeacher && isSelf && isTargetTeacher);
//   const canDelete = isAdmin && !isSelf;
//   const canModifyProgress = isAdmin;

//   const teacherBatches = useMemo(
//     () =>
//       isTeacher
//         ? filterBatchesForTeacher(
//             batches,
//             loggedInUser?.batches || [],
//             loggedInUser?.role || "",
//             loggedInUser?.email,
//             loggedInUser?._id,
//           )
//         : [],
//     [
//       batches,
//       isTeacher,
//       loggedInUser?.batches,
//       loggedInUser?.role,
//       loggedInUser?.email,
//       loggedInUser?._id,
//     ],
//   );

//   const visibleStudentBatches = useMemo(() => {
//     if (!isTargetStudent || !profileData?._id) return [];
//     const source = isAdmin ? batches : teacherBatches;
//     return source.filter((batch) => batchHasStudent(batch, profileData._id));
//   }, [batches, teacherBatches, isAdmin, isTargetStudent, profileData?._id]);

//   const displayTeacherBatches = useMemo(() => {
//     if (!isTargetTeacher) return [];
//     const fromStore = batches.filter(
//       (batch) =>
//         batch?.teacherEmail === profileData?.email ||
//         batch?.teachers?.some((teacher) => idsEqual(teacher, profileData?._id)),
//     );
//     return fromStore.length ? fromStore : profileData?.batches || [];
//   }, [
//     batches,
//     isTargetTeacher,
//     profileData?.email,
//     profileData?._id,
//     profileData?.batches,
//   ]);

//   const displayTeacherCourses = useMemo(() => {
//     if (!isTargetTeacher) return [];
//     const fromStore = allClass.filter(
//       (course) =>
//         course?.teacherEmail === profileData?.email ||
//         course?.teachers?.some((teacher) =>
//           idsEqual(teacher, profileData?._id),
//         ),
//     );
//     return fromStore.length ? fromStore : profileData?.mainClasses || [];
//   }, [
//     allClass,
//     isTargetTeacher,
//     profileData?.email,
//     profileData?._id,
//     profileData?.mainClasses,
//   ]);

//   // Batch store now has TTL + in-flight protection, so this does not cause
//   // repeated /batch requests when several profile instances mount.
//   useEffect(() => {
//     fetchBatches();
//     if (isTargetTeacher && getClasses) getClasses();
//   }, [fetchBatches, getClasses, isTargetTeacher]);

//   const loadUser = useCallback(async () => {
//     if (!activeUserId) {
//       navigate(-1);
//       return;
//     }

//     const cacheKey = String(activeUserId);
//     const cached = userCacheRef.current.get(cacheKey);

//     if (cached) {
//       setProfileData(cached);
//       setFormData(cached);
//       setIsLoading(false);
//     } else {
//       setIsLoading(true);
//     }

//     if (userInFlightRef.current.has(cacheKey)) {
//       try {
//         const result = await userInFlightRef.current.get(cacheKey);
//         if (result) {
//           setProfileData(result);
//           setFormData(result);
//         }
//       } catch {
//         if (!cached) navigate(-1);
//       } finally {
//         setIsLoading(false);
//       }
//       return;
//     }

//     // Keep route-state/self data as immediate UI, but only use the server
//     // request once per profile until a mutation explicitly invalidates it.
//     if (!cached) {
//       const immediate =
//         passedUserData && String(passedUserData._id) === cacheKey
//           ? passedUserData
//           : isSelf
//             ? loggedInUser
//             : null;

//       if (immediate) {
//         userCacheRef.current.set(cacheKey, immediate);
//         setProfileData(immediate);
//         setFormData(immediate);
//         setIsLoading(false);
//       }
//     }

//     const request = (async () => {
//       const response = await getUserById(activeUserId);
//       return (
//         response?.data?.user || response?.user || response?.data || response
//       );
//     })();

//     userInFlightRef.current.set(cacheKey, request);

//     try {
//       const fresh = await request;
//       if (!fresh?._id) throw new Error("Invalid profile response");
//       userCacheRef.current.set(cacheKey, fresh);
//       setProfileData(fresh);
//       setFormData(fresh);
//       return fresh;
//     } catch (error) {
//       console.error("Profile fetch failed:", error);
//       if (!profileData) {
//         toast.error("Failed to load profile.");
//         navigate(-1);
//       }
//       return null;
//     } finally {
//       userInFlightRef.current.delete(cacheKey);
//       setIsLoading(false);
//     }
//   }, [
//     activeUserId,
//     getUserById,
//     isSelf,
//     loggedInUser,
//     navigate,
//     passedUserData,
//     profileData,
//   ]);

//   useEffect(() => {
//     loadUser();
//   }, [activeUserId]); // intentionally keyed only by profile ID

//   // Teacher access control is checked after batches are available.
//   useEffect(() => {
//     if (!profileData || !isTeacher || isSelf) return;

//     if (isTargetTeacher) {
//       toast.error("You cannot view another teacher's profile.");
//       navigate("/access-denied", { replace: true });
//       return;
//     }

//     if (isTargetStudent && batches.length > 0) {
//       const allowed = canTeacherAccessStudent(
//         profileData._id,
//         teacherBatches,
//         loggedInUser?.role || "",
//       );

//       if (!allowed) {
//         toast.error("You can only view students from your assigned batches.");
//         navigate("/access-denied", { replace: true });
//       }
//     }
//   }, [
//     profileData,
//     isTeacher,
//     isSelf,
//     isTargetTeacher,
//     isTargetStudent,
//     batches.length,
//     teacherBatches,
//     loggedInUser?.role,
//     navigate,
//   ]);

//   // Hydrate student courses only once per course ID.
//   useEffect(() => {
//     if (
//       !isTargetStudent ||
//       !profileData?.mainClasses?.length ||
//       !getMainClassById
//     )
//       return;

//     let cancelled = false;

//     const hydrate = async () => {
//       const populated = await Promise.all(
//         profileData.mainClasses.map(async (mainClass) => {
//           const id = getEntityId(mainClass);
//           if (!id || (typeof mainClass === "object" && mainClass?.name)) {
//             return mainClass;
//           }

//           if (classCacheRef.current.has(id)) {
//             return classCacheRef.current.get(id);
//           }

//           try {
//             const response = await getMainClassById(id);
//             const classData =
//               response?.mainClass || response?.data?.mainClass || response;

//             const progressList =
//               response?.studentsProgress ||
//               response?.data?.studentsProgress ||
//               classData?.studentsProgress ||
//               [];

//             const progress = progressList.find((item) =>
//               idsEqual(item?.student, profileData._id),
//             );

//             if (progress) {
//               setDetailedProgress((prev) => ({ ...prev, [id]: progress }));
//             }

//             const result = classData || mainClass;
//             classCacheRef.current.set(id, result);
//             return result;
//           } catch {
//             return mainClass;
//           }
//         }),
//       );

//       if (cancelled) return;

//       setProfileData((prev) =>
//         prev ? { ...prev, mainClasses: populated } : prev,
//       );
//       setFormData((prev) =>
//         prev ? { ...prev, mainClasses: populated } : prev,
//       );
//     };

//     hydrate();

//     return () => {
//       cancelled = true;
//     };
//   }, [
//     isTargetStudent,
//     profileData?._id,
//     profileData?.mainClasses,
//     getMainClassById,
//   ]);

//   const invalidateProfileCache = useCallback(() => {
//     if (activeUserId) userCacheRef.current.delete(String(activeUserId));
//   }, [activeUserId]);

//   const cleanupPreviews = useCallback(() => {
//     if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
//     newDocuments.forEach((doc) => URL.revokeObjectURL(doc.previewUrl));
//   }, [newDocuments, newProfilePreview]);

//   useEffect(() => () => cleanupPreviews(), [cleanupPreviews]);

//   const startEditing = useCallback(() => {
//     setIsEditing(true);
//     setExistingDocuments(profileData?.documents || []);
//   }, [profileData?.documents]);

//   const cancelEdit = useCallback(() => {
//     setIsEditing(false);
//     setFormData(profileData || {});
//     cleanupPreviews();
//     setNewProfilePic(null);
//     setNewProfilePreview(null);
//     setNewDocuments([]);
//     setExistingDocuments([]);
//   }, [cleanupPreviews, profileData]);

//   const handleInputChange = useCallback((event) => {
//     const { name, value } = event.target;

//     if (name === "phone" || name === "adhar") {
//       const digits = value.replace(/\D/g, "");
//       const max = name === "phone" ? 10 : 12;
//       if (digits.length <= max) {
//         setFormData((prev) => ({ ...prev, [name]: digits }));
//       }
//       return;
//     }

//     setFormData((prev) => ({ ...prev, [name]: value }));
//   }, []);

//   const handleProfilePicChange = useCallback((event) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
//       toast.error("Only JPG and PNG images are allowed.");
//       return;
//     }

//     setNewProfilePreview((old) => {
//       if (old) URL.revokeObjectURL(old);
//       return URL.createObjectURL(file);
//     });
//     setNewProfilePic(file);
//   }, []);

//   const handleDocChange = useCallback((event) => {
//     const files = Array.from(event.target.files || []);
//     const valid = [];

//     files.forEach((file) => {
//       if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
//         toast.error(`Skipped ${file.name}: JPG/PNG only.`);
//         return;
//       }

//       valid.push({
//         id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
//         file,
//         previewUrl: URL.createObjectURL(file),
//       });
//     });

//     setNewDocuments((prev) => [...prev, ...valid]);
//     event.target.value = "";
//   }, []);

//   const removeNewDocument = useCallback((id) => {
//     setNewDocuments((prev) => {
//       const target = prev.find((doc) => doc.id === id);
//       if (target) URL.revokeObjectURL(target.previewUrl);
//       return prev.filter((doc) => doc.id !== id);
//     });
//   }, []);

//   const removeExistingDocument = useCallback((url) => {
//     setExistingDocuments((prev) => prev.filter((item) => item !== url));
//   }, []);

//   const handleUpdate = useCallback(
//     async (event) => {
//       event.preventDefault();

//       if (!canEdit) {
//         toast.error("Access denied. You cannot edit this profile.");
//         return;
//       }

//       if (!formData.name?.trim() || formData.name.trim().length < 3) {
//         toast.error("Please enter a valid full name.");
//         return;
//       }

//       if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
//         toast.error("Please enter a valid email address.");
//         return;
//       }

//       if (formData.phone && formData.phone.length !== 10) {
//         toast.error("Phone number must be exactly 10 digits.");
//         return;
//       }

//       if (formData.adhar && formData.adhar.length !== 12) {
//         toast.error("Aadhar number must be exactly 12 digits.");
//         return;
//       }

//       const payload = new FormData();

//       Object.entries(formData).forEach(([key, value]) => {
//         if (typeof value === "string" || typeof value === "number") {
//           payload.append(key, value);
//         }
//       });

//       if (formData.fatherName) {
//         payload.append("fathersName", formData.fatherName);
//         payload.append("fathername", formData.fatherName);
//         payload.append("father_name", formData.fatherName);
//         payload.append("parentName", formData.fatherName);
//       }

//       if (newProfilePic) payload.append("profilePic", newProfilePic);

//       if (isTargetStudent) {
//         newDocuments.forEach((doc) => payload.append("documents", doc.file));
//         existingDocuments.forEach((url) =>
//           payload.append("retainedDocuments", url),
//         );
//       }

//       try {
//         const response = await updateUser(profileData._id, payload);
//         const fresh =
//           response?.data?.user || response?.user || response?.data || response;

//         if (!fresh?._id) throw new Error("Invalid update response.");

//         userCacheRef.current.set(String(fresh._id), fresh);
//         setProfileData(fresh);
//         setFormData(fresh);

//         if (isSelf) useAuthStore.setState({ user: fresh });

//         toast.success("Profile updated successfully.");
//         cleanupPreviews();
//         setIsEditing(false);
//         setNewProfilePic(null);
//         setNewProfilePreview(null);
//         setNewDocuments([]);
//         setExistingDocuments([]);
//       } catch (error) {
//         toast.error(
//           error.response?.data?.message ||
//             error.message ||
//             "Failed to update profile",
//         );
//       }
//     },
//     [
//       canEdit,
//       cleanupPreviews,
//       existingDocuments,
//       formData,
//       isSelf,
//       isTargetStudent,
//       newDocuments,
//       newProfilePic,
//       profileData?._id,
//       updateUser,
//     ],
//   );

//   const confirmDelete = useCallback(async () => {
//     if (!canDelete) return;

//     setIsDeleting(true);
//     try {
//       await deleteUser(profileData._id);
//       invalidateProfileCache();
//       toast.success(
//         `${isTargetStudent ? "Student" : "Teacher"} deleted successfully.`,
//       );
//       setShowDeleteModal(false);
//       navigate(-1);
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to delete user");
//     } finally {
//       setIsDeleting(false);
//     }
//   }, [
//     canDelete,
//     deleteUser,
//     invalidateProfileCache,
//     isTargetStudent,
//     navigate,
//     profileData?._id,
//   ]);

//   const requestRemoveFromBatch = useCallback((batch) => {
//     setBatchToRemove(batch);
//     setShowRemoveBatchModal(true);
//   }, []);

//   const confirmRemoveFromBatch = useCallback(async () => {
//     if (!batchToRemove || !profileData?._id) return;

//     const allowed =
//       isAdmin ||
//       (isTeacher &&
//         teacherBatches.some((batch) => idsEqual(batch, batchToRemove)));

//     if (!allowed) {
//       toast.error("You do not have permission to modify this batch.");
//       return;
//     }

//     const mainClassId = getBatchMainClassId(batchToRemove, profileData._id);

//     if (!mainClassId) {
//       toast.error(
//         "This batch does not contain a main class ID. The student cannot be removed safely.",
//       );
//       return;
//     }

//     setIsRemovingFromBatch(true);

//     try {
//       await removeStudentFromBatch(
//         batchToRemove._id,
//         profileData._id,
//         mainClassId,
//       );

//       // Optimistic UI update: no second batch-list fetch is required.
//       setProfileData((prev) => {
//         if (!prev) return prev;

//         const nextBatches = (prev.batches || []).filter(
//           (batch) => !idsEqual(batch, batchToRemove),
//         );

//         return { ...prev, batches: nextBatches };
//       });

//       setFormData((prev) => ({
//         ...prev,
//         batches: (prev.batches || []).filter(
//           (batch) => !idsEqual(batch, batchToRemove),
//         ),
//       }));

//       invalidateProfileCache();
//       userCacheRef.current.delete(String(profileData._id));

//       setShowRemoveBatchModal(false);
//       setBatchToRemove(null);

//       // One explicit profile refresh after mutation.
//       await loadUser();

//       toast.success(`Student removed from "${batchToRemove.name || "batch"}".`);
//     } catch (error) {
//       toast.error(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to remove student from batch",
//       );
//     } finally {
//       setIsRemovingFromBatch(false);
//     }
//   }, [
//     batchToRemove,
//     invalidateProfileCache,
//     isAdmin,
//     isTeacher,
//     loadUser,
//     profileData?._id,
//     removeStudentFromBatch,
//     teacherBatches,
//   ]);

//   const toggleProgress = useCallback(
//     async (mainClassId, field) => {
//       if (!canModifyProgress) {
//         toast.error("Only Administrators can modify student progress.");
//         return;
//       }

//       const id = getEntityId(mainClassId);
//       const progress = detailedProgress[id];

//       if (!progress?._id) {
//         toast.error("Progress record not found.");
//         return;
//       }

//       const key = `${id}_${field}`;
//       const value = !progress[field];

//       setLoadingProgress((prev) => ({ ...prev, [key]: true }));

//       try {
//         await getStudentProgress(progress._id, { [field]: value });

//         setDetailedProgress((prev) => ({
//           ...prev,
//           [id]: { ...prev[id], [field]: value },
//         }));

//         const label =
//           field === "batchcompletion"
//             ? "Course"
//             : field === "examcompletion"
//               ? "Exam"
//               : "Certificate";

//         toast.success(`${label} status updated successfully.`);
//       } catch (error) {
//         toast.error(
//           error.response?.data?.message ||
//             "Error updating progress. Please try again.",
//         );
//       } finally {
//         setLoadingProgress((prev) => ({ ...prev, [key]: false }));
//       }
//     },
//     [canModifyProgress, detailedProgress, getStudentProgress],
//   );

//   const openProfilePic = useCallback((src) => {
//     if (!src) return;
//     setModalImageSrc(src);
//     setShowProfilePicModal(true);
//   }, []);

//   const getMainClassName = useCallback(() => {
//     const item = profileData?.mainClasses?.[0];
//     return getClassName(item);
//   }, [profileData?.mainClasses]);

//   const getBatchName = useCallback(() => {
//     const item = profileData?.batches?.[0];
//     return typeof item === "object"
//       ? item?.name || item?.batchName || "Computer"
//       : item || "Computer";
//   }, [profileData?.batches]);

//   const printStudentCard = useCallback(
//     (cardType) => {
//       if (!profileData) return;

//       const printWindow = window.open("", "_blank");
//       if (!printWindow) {
//         toast.error("Please allow popups to print student card.");
//         return;
//       }

//       const isGcc = cardType === "gcc";
//       const front = absoluteUrl(
//         isGcc ? Image.studentGccCardFront : Image.studentIkCardFront,
//       );
//       const back = absoluteUrl(Image.studentCardBack);
//       const photo = absoluteUrl(getPhoto(profileData));
//       const qr = absoluteUrl(profileData.qrCodeUrl || Image.qrCode);
//       const studentId =
//         getStudentId(profileData) || profileData.studentId || "N/A";
//       const course = getMainClassName();
//       const batch = getBatchName();
//       const grade =
//         profileData.className ||
//         profileData.grade ||
//         profileData.class ||
//         "VIII";

//       const html = `
//       <!doctype html>
//       <html><head>
//       <title>${escapeHtml(isGcc ? "GCC Admit Card" : "IK Student ID Card")}</title>
//       <style>
//         *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
//         html,body{margin:0;background:#111;font-family:Arial}
//         body{padding:16px;display:flex;flex-direction:column;align-items:center;gap:16px}
//         .page{position:relative;width:min(88mm,calc(100vw - 20px));aspect-ratio:6496/10039;overflow:hidden;background:#000;break-after:page}
//         .page:last-child{break-after:auto}.template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
//         .photo{position:absolute;z-index:2;left:50%;top:27.8%;transform:translate(-50%,-50%);width:44%;height:28.5%;border-radius:50%;object-fit:cover;background:#0b5db8;border:2px solid #fff}
//         .placeholder{position:absolute;z-index:2;left:50%;top:27.8%;transform:translate(-50%,-50%);width:44%;height:28.5%;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0b5db8;color:#fff;font-size:52px;font-weight:800;border:2px solid #fff}
//         .field{position:absolute;z-index:3;left:8%;width:84%;text-align:center;line-height:1.05;white-space:nowrap;overflow:hidden}
//         .name{top:46%;font-size:clamp(22px,6vw,44px);color:#fff}.id{top:52%;font-size:clamp(14px,3.8vw,26px);color:#ffc400;font-weight:700}
//         .course{top:61%;font-size:clamp(14px,4vw,28px);color:#fff;font-weight:800}.group{top:67%;font-size:clamp(14px,4vw,28px);color:#fff;font-weight:800}
//         .qr{position:absolute;z-index:2;left:28.4%;top:53.55%;width:43.2%;height:28.4%;object-fit:contain;background:#fff;padding:6%}
//         @media print{@page{size:88mm 136mm;margin:0}html,body{width:88mm;background:#fff;padding:0}body{display:block}.page{width:88mm;height:136mm}.name{font-size:6.2mm}.id{font-size:4.2mm}.course,.group{font-size:4.4mm}}
//       </style></head><body>
//       <section class="page">
//         <img class="template" src="${front}">
//         ${photo ? `<img class="photo" src="${photo}">` : `<div class="placeholder">${escapeHtml(getInitials(profileData))}</div>`}
//         <div class="field name">${escapeHtml(getName(profileData))}</div>
//         <div class="field id">Student ID : ${escapeHtml(studentId)}</div>
//         <div class="field course">${escapeHtml(isGcc ? "Training on Academic Literacy" : `Training on ${course}`)}</div>
//         <div class="field group">${escapeHtml(isGcc ? `Class : ${grade}` : `Batch : ${batch}`)}</div>
//       </section>
//       <section class="page"><img class="template" src="${back}"><img class="qr" src="${qr}"></section>
//       <script>
//         function ready(){Promise.all([...document.images].map(i=>i.complete?Promise.resolve():new Promise(r=>{i.onload=r;i.onerror=r}))).then(()=>setTimeout(()=>window.print(),200))}
//         window.onafterprint=()=>window.close();window.onload=()=>setTimeout(ready,100);
//       </script></body></html>`;

//       printWindow.document.open();
//       printWindow.document.write(html);
//       printWindow.document.close();
//     },
//     [getBatchName, getMainClassName, profileData],
//   );

//   const printTeacherCard = useCallback(() => {
//     if (!profileData) return;

//     const printWindow = window.open("", "_blank");
//     if (!printWindow) {
//       toast.error("Please allow popups to print teacher ID card.");
//       return;
//     }

//     const template = absoluteUrl(Image.teacherIdCardTemplate);
//     const photo = absoluteUrl(getPhoto(profileData));
//     const employeeId =
//       profileData.employeeId ||
//       profileData.employeeID ||
//       profileData.teacherId ||
//       `IK${String(profileData._id || "")
//         .slice(-6)
//         .toUpperCase()}`;

//     const department =
//       profileData.department ||
//       profileData.dept ||
//       getClassName(displayTeacherCourses?.[0]) ||
//       "Information Technology (IT)";

//     const designation =
//       profileData.designation ||
//       profileData.position ||
//       profileData.title ||
//       "Senior IT Faculty";

//     const html = `
//       <!doctype html><html><head><title>Teacher ID Card</title>
//       <style>
//       *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
//       html,body{margin:0;background:#111;font-family:Arial}body{display:flex;align-items:center;justify-content:center;padding:18px}
//       .card{position:relative;width:min(88mm,calc(100vw - 24px));aspect-ratio:6496/10039;overflow:hidden}
//       .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.photo,.placeholder{position:absolute;z-index:2;left:49.5%;top:30%;transform:translate(-50%,-50%);width:44%;height:28.5%;border-radius:50%;object-fit:cover;background:#0b5db8;border:2px solid #fff}
//       .placeholder{display:flex;align-items:center;justify-content:center;color:#fff;font-size:54px;font-weight:800}
//       .field{position:absolute;z-index:3;width:82%;left:9%;text-align:center;color:#fff;line-height:1.05;white-space:nowrap;overflow:hidden}
//       .name{top:50.35%;font-size:clamp(24px,7vw,48px);font-weight:500;text-transform:uppercase}.designation{top:57.25%;font-size:clamp(18px,5vw,34px);font-weight:700;color:#ffc400;text-transform:uppercase}
//       .department{top:64.35%;font-size:clamp(15px,4vw,28px);font-weight:500}.employee{top:68.65%;font-size:clamp(15px,4vw,28px);font-weight:700;color:#ffc400}.joining{top:81.25%;left:40%;width:54%;text-align:left;font-size:clamp(13px,3.4vw,24px);font-weight:800}
//       @media print{@page{size:88mm 136mm;margin:0}html,body{width:88mm;height:136mm;background:#fff;padding:0}.card{width:88mm;height:136mm}.name{font-size:7.2mm}.designation{font-size:5.2mm}.department,.employee{font-size:4.2mm}.joining{font-size:3.7mm}}
//       </style></head><body><div class="card">
//       <img class="template" src="${template}">
//       ${photo ? `<img class="photo" src="${photo}">` : `<div class="placeholder">${escapeHtml(getInitials(profileData))}</div>`}
//       <div class="field name">${escapeHtml(getName(profileData))}</div>
//       <div class="field designation">${escapeHtml(designation)}</div>
//       <div class="field department">Dept. of ${escapeHtml(department)}</div>
//       <div class="field employee">Employee ID : ${escapeHtml(employeeId)}</div>
//       <div class="field joining">Date of Joining : ${escapeHtml(formatDate(profileData.joiningDate || profileData.joinedAt || profileData.createdAt))}</div>
//       </div><script>window.onafterprint=()=>window.close();window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;

//     printWindow.document.open();
//     printWindow.document.write(html);
//     printWindow.document.close();
//   }, [displayTeacherCourses, profileData]);

//   const printCertificate = useCallback(() => {
//     if (!certificateCourse) return;

//     const grade = certificateGrade.trim();
//     if (!grade) {
//       toast.error("Please enter a grade before printing certificate.");
//       return;
//     }

//     const printWindow = window.open("", "_blank");
//     if (!printWindow) {
//       toast.error("Please allow popups to print certificate.");
//       return;
//     }

//     const template = absoluteUrl(Image.ikCertificateTemplate);
//     const studentId = getStudentId(profileData) || profileData.studentId || "";
//     const courseName = getClassName(certificateCourse);
//     const guardian =
//       profileData.fatherName ||
//       profileData.fathersName ||
//       profileData.father_name ||
//       profileData.fathername ||
//       profileData.parentName ||
//       "";

//     const certificateNo = `IK${new Date().getFullYear().toString().slice(-2)}${String(
//       studentId || profileData._id || Date.now(),
//     )
//       .replace(/\W/g, "")
//       .slice(-7)
//       .padStart(7, "0")}`;

//     const dateText = (value) => {
//       const date = value ? new Date(value) : new Date();
//       if (Number.isNaN(date.getTime())) return "";
//       return [
//         String(date.getDate()).padStart(2, "0"),
//         String(date.getMonth() + 1).padStart(2, "0"),
//         date.getFullYear(),
//       ].join(".");
//     };

//     const fromDate = dateText(
//       certificateCourse?.startDate ||
//         profileData.admissionDate ||
//         profileData.createdAt,
//     );
//     const toDate = dateText(certificateCourse?.endDate || new Date());
//     const issueDate = dateText(new Date());

//     const html = `
//       <!doctype html>
//       <html>
//       <head>
//         <title>Certificate - ${escapeHtml(getName(profileData))}</title>
//         <style>
//           *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
//           html,body{margin:0;padding:0;background:#f3f4f6;font-family:Arial}
//           body{min-height:100vh;display:flex;align-items:center;justify-content:center}
//           .certificate{position:relative;width:min(297mm,100vw);aspect-ratio:3508/2480;background:#fff;overflow:hidden}
//           .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
//           .field{position:absolute;z-index:2;text-align:center;font-weight:800;color:#2d2078;line-height:1.05;white-space:nowrap;overflow:hidden}
//           .name{left:33.2%;top:49.05%;width:18.6%;font-size:clamp(14px,2vw,38px)}
//           .relation{left:51.7%;top:49.45%;width:10.2%;font-family:"Times New Roman";font-size:clamp(13px,1.65vw,31px);font-style:italic}
//           .guardian{left:61.7%;top:49.05%;width:19.2%;font-size:clamp(14px,2vw,38px)}
//           .reg{left:53.2%;top:58.03%;width:13.5%;font-size:clamp(13px,1.75vw,32px)}
//           .cert{left:80.2%;top:58.03%;width:13.2%;font-size:clamp(13px,1.75vw,32px)}
//           .course{left:55.3%;top:64.85%;width:36.5%;text-align:left;font-size:clamp(13px,1.85vw,35px)}
//           .from{left:42.8%;top:72.1%;width:11.8%;font-size:clamp(13px,1.7vw,32px)}
//           .to{left:56%;top:72.1%;width:12%;font-size:clamp(13px,1.7vw,32px)}
//           .grade{left:77.4%;top:72.1%;width:8%;font-size:clamp(13px,1.75vw,34px)}
//           .issue{left:42.2%;top:90.07%;width:12%;font-size:clamp(13px,1.7vw,32px)}
//           @media print{
//             @page{size:A4 landscape;margin:0}
//             html,body{width:297mm;height:210mm;background:#fff}
//             .certificate{width:297mm;height:210mm}
//             .name,.guardian{font-size:7.2mm}.relation{font-size:6.2mm}
//             .reg,.cert,.course,.from,.to,.grade,.issue{font-size:5.6mm}
//           }
//         </style>
//       </head>
//       <body>
//         <section class="certificate">
//           <img class="template" src="${template}" alt="Certificate template">
//           <div class="field name">${escapeHtml(getName(profileData))}</div>
//           <div class="field relation">${escapeHtml(guardian ? "Son of" : "")}</div>
//           <div class="field guardian">${escapeHtml(guardian)}</div>
//           <div class="field reg">${escapeHtml(studentId || "-")}</div>
//           <div class="field cert">${escapeHtml(certificateNo)}</div>
//           <div class="field course">${escapeHtml(courseName.toUpperCase())}</div>
//           <div class="field from">${escapeHtml(fromDate || "-")}</div>
//           <div class="field to">${escapeHtml(toDate || "-")}</div>
//           <div class="field grade">${escapeHtml(grade.toUpperCase())}</div>
//           <div class="field issue">${escapeHtml(issueDate)}</div>
//         </section>
//         <script>
//           window.onafterprint=()=>window.close();
//           window.onload=()=>setTimeout(()=>window.print(),400);
//         </script>
//       </body>
//       </html>`;

//     printWindow.document.open();
//     printWindow.document.write(html);
//     printWindow.document.close();

//     setCertificateCourse(null);
//     setCertificateGrade("");
//   }, [certificateCourse, certificateGrade, profileData]);

//   if (isLoading || !profileData) return <ProfileSkeleton />;

//   const profilePhoto = getPhoto(profileData);
//   const roleLabel = targetRole.charAt(0).toUpperCase() + targetRole.slice(1);

//   return (
//     <div className="min-h-screen bg-background text-foreground px-4 sm:px-6 py-6 sm:py-8">
//       <Helmet>
//         <title>{`IOK - ${roleLabel} | ${getName(profileData)}`}</title>
//       </Helmet>

//       <div className="max-w-5xl mx-auto">
//         <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
//           <BackButton />

//           <div className="flex flex-wrap items-center justify-end gap-2">
//             {isTargetStudent && !isEditing && (
//               <>
//                 <button
//                   onClick={() => printStudentCard("ik")}
//                   className="action-btn bg-amber-500 text-white hover:bg-amber-600"
//                 >
//                   <Printer size={16} />{" "}
//                   <span className="hidden sm:inline">Print IK</span>
//                 </button>
//                 <button
//                   onClick={() => printStudentCard("gcc")}
//                   className="action-btn bg-slate-900 text-white hover:bg-slate-800"
//                 >
//                   <Printer size={16} />{" "}
//                   <span className="hidden sm:inline">Print GCC</span>
//                 </button>
//               </>
//             )}

//             {isTargetTeacher && !isEditing && (
//               <button
//                 onClick={printTeacherCard}
//                 className="action-btn bg-amber-500 text-white hover:bg-amber-600"
//               >
//                 <Printer size={16} />{" "}
//                 <span className="hidden sm:inline">Print ID Card</span>
//               </button>
//             )}

//             {canDelete && !isEditing && (
//               <button
//                 onClick={() => setShowDeleteModal(true)}
//                 className="action-btn bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
//               >
//                 <Trash2 size={16} />{" "}
//                 <span className="hidden sm:inline">Delete</span>
//               </button>
//             )}

//             {canEdit && !isEditing && (
//               <button
//                 onClick={startEditing}
//                 className="action-btn bg-primary text-primary-foreground hover:opacity-90"
//               >
//                 <Edit3 size={16} /> Edit
//               </button>
//             )}
//           </div>
//         </div>

//         {!canEdit && !isSelf && (
//           <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 flex gap-3 text-sm">
//             <ShieldAlert size={18} className="text-blue-500 shrink-0 mt-0.5" />
//             <p className="text-blue-700 dark:text-blue-300">
//               Read-only profile. Your role does not have permission to edit
//               these details.
//             </p>
//           </div>
//         )}

//         <AnimatePresence mode="wait">
//           {!isEditing ? (
//             <motion.div
//               key="view"
//               initial={{ opacity: 0, y: 14 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -14 }}
//               className="space-y-5"
//             >
//               <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-8">
//                 <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />

//                 <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
//                   <button
//                     type="button"
//                     onClick={() => openProfilePic(profilePhoto)}
//                     className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-background shadow-xl bg-muted shrink-0"
//                   >
//                     {profilePhoto ? (
//                       <img
//                         src={profilePhoto}
//                         alt={getName(profileData)}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       <div
//                         className={`w-full h-full bg-gradient-to-br ${getAvatarGradient(getName(profileData))} flex items-center justify-center text-white text-4xl font-extrabold`}
//                       >
//                         {getInitials(profileData)}
//                       </div>
//                     )}
//                     {profilePhoto && (
//                       <span className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
//                         <ZoomIn size={26} className="text-white" />
//                       </span>
//                     )}
//                   </button>

//                   <div className="text-center sm:text-left min-w-0 flex-1">
//                     <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
//                       Institute Profile
//                     </p>
//                     <h1 className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
//                       {getName(profileData)}
//                     </h1>

//                     <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
//                       <span className="badge">
//                         {isTargetStudent ? (
//                           <GraduationCap size={14} />
//                         ) : (
//                           <Shield size={14} />
//                         )}
//                         {roleLabel}
//                       </span>

//                       {isTargetStudent && (
//                         <span className="badge bg-muted text-foreground border-border">
//                           ID: {getStudentId(profileData) || "N/A"}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {isTargetStudent ? (
//                 <>
//                   <div className="grid lg:grid-cols-2 gap-5">
//                     <Section
//                       title="Contact & Personal Details"
//                       icon={UserCheck}
//                     >
//                       <InfoRow
//                         icon={Mail}
//                         label="Email Address"
//                         value={profileData.email}
//                       />
//                       <InfoRow
//                         icon={Phone}
//                         label="Phone Number"
//                         value={profileData.phone}
//                       />
//                       {profileData.fatherName && (
//                         <InfoRow
//                           icon={User}
//                           label="Father's Name"
//                           value={profileData.fatherName}
//                         />
//                       )}
//                       {profileData.dob && (
//                         <InfoRow
//                           icon={Calendar}
//                           label="Date of Birth"
//                           value={formatDate(profileData.dob)}
//                         />
//                       )}
//                       {profileData.gender && (
//                         <InfoRow
//                           icon={User}
//                           label="Gender"
//                           value={profileData.gender}
//                         />
//                       )}
//                       {profileData.nationality && (
//                         <InfoRow
//                           icon={Flag}
//                           label="Nationality"
//                           value={profileData.nationality}
//                         />
//                       )}
//                       {profileData.address && (
//                         <InfoRow
//                           icon={MapPin}
//                           label="Address"
//                           value={profileData.address}
//                         />
//                       )}
//                       <InfoRow
//                         icon={Calendar}
//                         label="Admission Date"
//                         value={formatDate(
//                           profileData.admissionDate || profileData.createdAt,
//                         )}
//                       />
//                     </Section>

//                     <Section title="Academic Status" icon={GraduationCap}>
//                       {profileData.stream && (
//                         <InfoRow
//                           icon={BookOpen}
//                           label="Stream"
//                           value={profileData.stream}
//                         />
//                       )}
//                       {profileData.grade && (
//                         <InfoRow
//                           icon={GraduationCap}
//                           label="Grade"
//                           value={profileData.grade}
//                         />
//                       )}
//                       {profileData.marksObtained !== undefined && (
//                         <InfoRow
//                           icon={FileText}
//                           label="Marks"
//                           value={profileData.marksObtained}
//                         />
//                       )}
//                       <InfoRow
//                         icon={Hash}
//                         label="Aadhar Number"
//                         value={
//                           isAdmin
//                             ? profileData.adhar
//                             : profileData.adhar
//                               ? `XXXX-XXXX-${String(profileData.adhar).replace(/\D/g, "").slice(-4)}`
//                               : "-"
//                         }
//                       />
//                     </Section>
//                   </div>

//                   <Section
//                     title="Enrolled Course Progress"
//                     icon={BookOpen}
//                     action={
//                       <button
//                         onClick={() => setShowProgress((v) => !v)}
//                         className="section-toggle"
//                       >
//                         {showProgress ? "Hide" : "Show"}
//                         {showProgress ? (
//                           <ChevronUp size={15} />
//                         ) : (
//                           <ChevronDown size={15} />
//                         )}
//                       </button>
//                     }
//                   >
//                     <AnimatePresence initial={false}>
//                       {showProgress && (
//                         <motion.div
//                           initial={{ height: 0, opacity: 0 }}
//                           animate={{ height: "auto", opacity: 1 }}
//                           exit={{ height: 0, opacity: 0 }}
//                           className="p-5"
//                         >
//                           {profileData.mainClasses?.length ? (
//                             <div className="space-y-4">
//                               {profileData.mainClasses.map((mainClass) => {
//                                 const id = getEntityId(mainClass);
//                                 const classObj =
//                                   typeof mainClass === "object"
//                                     ? mainClass
//                                     : { _id: id, name: "Loading..." };
//                                 const progress = detailedProgress[id];

//                                 const statusItems = [
//                                   ["Course", "batchcompletion", BookOpen],
//                                   ["Exam", "examcompletion", Check],
//                                   [
//                                     "Certificate",
//                                     "certificatecompletion",
//                                     GraduationCap,
//                                   ],
//                                 ];

//                                 return (
//                                   <div
//                                     key={id}
//                                     className="rounded-2xl border border-border p-5 bg-background/50"
//                                   >
//                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
//                                       <div>
//                                         <h3 className="font-bold text-lg">
//                                           {getClassName(classObj)}
//                                         </h3>
//                                         <p className="text-sm text-muted-foreground mt-1">
//                                           {classObj.duration
//                                             ? `${classObj.duration} Months`
//                                             : "Course"}
//                                           {classObj.startDate
//                                             ? ` • Started ${formatDate(classObj.startDate)}`
//                                             : ""}
//                                         </p>
//                                       </div>
//                                       <div className="flex items-center gap-2">
//                                         {classObj.fees !== undefined && (
//                                           <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
//                                             ₹ {classObj.fees}
//                                           </span>
//                                         )}
//                                         <button
//                                           type="button"
//                                           onClick={() => {
//                                             setCertificateCourse(classObj);
//                                             setCertificateGrade("");
//                                           }}
//                                           className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5"
//                                         >
//                                           <Printer size={13} /> Certificate
//                                         </button>
//                                       </div>
//                                     </div>

//                                     {progress ? (
//                                       <div className="grid sm:grid-cols-3 gap-3">
//                                         {statusItems.map(
//                                           ([label, field, Icon]) => {
//                                             const busy =
//                                               loadingProgress[`${id}_${field}`];
//                                             const checked = Boolean(
//                                               progress[field],
//                                             );

//                                             return (
//                                               <button
//                                                 key={field}
//                                                 disabled={
//                                                   busy || !canModifyProgress
//                                                 }
//                                                 onClick={() =>
//                                                   toggleProgress(id, field)
//                                                 }
//                                                 className={`rounded-xl border p-4 text-left transition-all ${
//                                                   checked
//                                                     ? "border-emerald-500/30 bg-emerald-500/10"
//                                                     : "border-border bg-muted/20"
//                                                 } disabled:cursor-not-allowed disabled:opacity-60`}
//                                               >
//                                                 <div className="flex items-center justify-between">
//                                                   <Icon
//                                                     size={17}
//                                                     className={
//                                                       checked
//                                                         ? "text-emerald-500"
//                                                         : "text-muted-foreground"
//                                                     }
//                                                   />
//                                                   <span
//                                                     className={`w-5 h-5 rounded-full border flex items-center justify-center ${checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"}`}
//                                                   >
//                                                     {checked && (
//                                                       <Check size={12} />
//                                                     )}
//                                                   </span>
//                                                 </div>
//                                                 <p className="mt-3 text-sm font-bold">
//                                                   {busy ? "Updating..." : label}
//                                                 </p>
//                                                 <p className="text-xs text-muted-foreground mt-1">
//                                                   {checked
//                                                     ? "Completed"
//                                                     : "Pending"}
//                                                 </p>
//                                               </button>
//                                             );
//                                           },
//                                         )}
//                                       </div>
//                                     ) : (
//                                       <p className="text-sm text-muted-foreground bg-muted/30 rounded-xl p-4">
//                                         Progress record is not available for
//                                         this course.
//                                       </p>
//                                     )}
//                                   </div>
//                                 );
//                               })}
//                             </div>
//                           ) : (
//                             <div className="empty-state">
//                               No enrolled courses.
//                             </div>
//                           )}
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </Section>

//                   <Section
//                     title="Assigned Batches"
//                     icon={Clock}
//                     action={
//                       <button
//                         onClick={() => setShowBatches((v) => !v)}
//                         className="section-toggle"
//                       >
//                         {showBatches ? "Hide" : "Show"}
//                         {showBatches ? (
//                           <ChevronUp size={15} />
//                         ) : (
//                           <ChevronDown size={15} />
//                         )}
//                       </button>
//                     }
//                   >
//                     <AnimatePresence initial={false}>
//                       {showBatches && (
//                         <motion.div
//                           initial={{ height: 0, opacity: 0 }}
//                           animate={{ height: "auto", opacity: 1 }}
//                           exit={{ height: 0, opacity: 0 }}
//                           className="p-5"
//                         >
//                           {visibleStudentBatches.length ? (
//                             <div className="grid md:grid-cols-2 gap-3">
//                               {visibleStudentBatches.map((batch) => {
//                                 const canRemove =
//                                   !isSelf &&
//                                   (isAdmin ||
//                                     (isTeacher &&
//                                       teacherBatches.some((item) =>
//                                         idsEqual(item, batch),
//                                       )));

//                                 return (
//                                   <div
//                                     key={batch._id}
//                                     className="rounded-2xl border border-border bg-background/50 p-4 flex items-center justify-between gap-3"
//                                   >
//                                     <div className="min-w-0">
//                                       <p className="font-bold truncate">
//                                         {batch.name || "Unnamed Batch"}
//                                       </p>
//                                       <p className="text-xs text-muted-foreground mt-1">
//                                         {batch.weekday || "Schedule not set"}
//                                         {batch.startTime
//                                           ? ` • ${batch.startTime}`
//                                           : ""}
//                                       </p>
//                                     </div>

//                                     {canRemove && (
//                                       <button
//                                         onClick={() =>
//                                           requestRemoveFromBatch(batch)
//                                         }
//                                         className="shrink-0 w-9 h-9 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors flex items-center justify-center"
//                                         title="Remove student from this batch"
//                                       >
//                                         <X size={16} />
//                                       </button>
//                                     )}
//                                   </div>
//                                 );
//                               })}
//                             </div>
//                           ) : (
//                             <div className="empty-state">
//                               This student is not assigned to any visible batch.
//                             </div>
//                           )}
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </Section>

//                   <Section
//                     title="Documents"
//                     icon={FileText}
//                     action={
//                       <button
//                         onClick={() => setShowDocuments((v) => !v)}
//                         className="section-toggle"
//                       >
//                         {showDocuments ? "Hide" : "Show"}
//                         {showDocuments ? (
//                           <ChevronUp size={15} />
//                         ) : (
//                           <ChevronDown size={15} />
//                         )}
//                       </button>
//                     }
//                   >
//                     <AnimatePresence initial={false}>
//                       {showDocuments && (
//                         <motion.div
//                           initial={{ height: 0, opacity: 0 }}
//                           animate={{ height: "auto", opacity: 1 }}
//                           exit={{ height: 0, opacity: 0 }}
//                           className="p-5"
//                         >
//                           {profileData.documents?.length ? (
//                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
//                               {profileData.documents.map((url, index) => (
//                                 <button
//                                   key={`${url}-${index}`}
//                                   onClick={() =>
//                                     setActiveDocument({
//                                       url,
//                                       name: `Document ${index + 1}`,
//                                     })
//                                   }
//                                   className="group relative h-32 rounded-xl overflow-hidden border border-border bg-muted"
//                                 >
//                                   <img
//                                     src={url}
//                                     alt={`Document ${index + 1}`}
//                                     className="w-full h-full object-cover group-hover:scale-105 transition-transform"
//                                   />
//                                   <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
//                                     <ZoomIn className="text-white" size={20} />
//                                   </span>
//                                 </button>
//                               ))}
//                             </div>
//                           ) : (
//                             <div className="empty-state">
//                               No documents available.
//                             </div>
//                           )}
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </Section>
//                 </>
//               ) : (
//                 <div className="grid lg:grid-cols-2 gap-5">
//                   <Section
//                     title="Contact & Professional Details"
//                     icon={UserCheck}
//                   >
//                     <InfoRow
//                       icon={Mail}
//                       label="Email Address"
//                       value={profileData.email}
//                     />
//                     <InfoRow
//                       icon={Phone}
//                       label="Phone Number"
//                       value={profileData.phone}
//                     />
//                     <InfoRow
//                       icon={Shield}
//                       label="System Role"
//                       value={roleLabel}
//                     />
//                     <InfoRow
//                       icon={Calendar}
//                       label="Joined Date"
//                       value={formatDate(
//                         profileData.admissionDate || profileData.createdAt,
//                       )}
//                     />
//                   </Section>

//                   <Section title="Assignments" icon={BookOpen}>
//                     <InfoRow
//                       icon={BookOpen}
//                       label="Assigned Courses"
//                       value={
//                         displayTeacherCourses.length ? (
//                           <div className="flex flex-wrap gap-2">
//                             {displayTeacherCourses.map((course, i) => (
//                               <span
//                                 key={getEntityId(course) || i}
//                                 className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold"
//                               >
//                                 {getClassName(course)}
//                               </span>
//                             ))}
//                           </div>
//                         ) : (
//                           "None"
//                         )
//                       }
//                     />
//                     <InfoRow
//                       icon={Clock}
//                       label="Assigned Batches"
//                       value={
//                         displayTeacherBatches.length ? (
//                           <div className="flex flex-wrap gap-2">
//                             {displayTeacherBatches.map((batch, i) => (
//                               <span
//                                 key={getEntityId(batch) || i}
//                                 className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold"
//                               >
//                                 {batch?.name || batch}
//                               </span>
//                             ))}
//                           </div>
//                         ) : (
//                           "None"
//                         )
//                       }
//                     />
//                   </Section>
//                 </div>
//               )}
//             </motion.div>
//           ) : (
//             <motion.form
//               key="edit"
//               initial={{ opacity: 0, scale: 0.98 }}
//               animate={{ opacity: 1, scale: 1 }}
//               onSubmit={handleUpdate}
//               className="bg-card border border-border rounded-2xl shadow-sm p-5 sm:p-7"
//             >
//               <div className="flex items-center justify-between gap-3 pb-5 border-b border-border">
//                 <div>
//                   <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
//                     Profile Editor
//                   </p>
//                   <h2 className="text-xl font-black mt-1">
//                     Edit {roleLabel} Details
//                   </h2>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={cancelEdit}
//                   className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
//                 >
//                   <X size={18} />
//                 </button>
//               </div>

//               <div className="mt-6 flex flex-col sm:flex-row gap-5 items-center sm:items-start p-5 rounded-2xl bg-muted/30 border border-border">
//                 <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg shrink-0">
//                   {newProfilePreview || profilePhoto ? (
//                     <img
//                       src={newProfilePreview || profilePhoto}
//                       alt="Profile preview"
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <div
//                       className={`w-full h-full bg-gradient-to-br ${getAvatarGradient(getName(profileData))} flex items-center justify-center text-white text-2xl font-black`}
//                     >
//                       {getInitials(profileData)}
//                     </div>
//                   )}
//                 </div>
//                 <div className="w-full">
//                   <label className="text-sm font-bold">Profile Photo</label>
//                   <input
//                     type="file"
//                     accept="image/png,image/jpeg,image/jpg"
//                     onChange={handleProfilePicChange}
//                     className="mt-2 block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2.5 file:bg-primary/10 file:text-primary file:font-bold"
//                   />
//                 </div>
//               </div>

//               <div className="mt-6 grid md:grid-cols-2 gap-5">
//                 {[
//                   ["Full Name", "name", "text", User, true],
//                   ["Father's Name", "fatherName", "text", User, false],
//                   ["Email Address", "email", "email", Mail, true],
//                   ["Phone Number", "phone", "text", Phone, true],
//                   ["Date of Birth", "dob", "date", Calendar, false],
//                   ["Address", "address", "text", MapPin, false],
//                   ["Grade", "grade", "text", GraduationCap, false],
//                   [
//                     "Marks Obtained",
//                     "marksObtained",
//                     "number",
//                     FileText,
//                     false,
//                   ],
//                   ["Aadhar Number", "adhar", "text", Hash, false],
//                 ].map(([label, name, type, Icon, required]) => (
//                   <label key={name} className="space-y-2">
//                     <span className="text-sm font-bold">
//                       {label}
//                       {required && <span className="text-destructive"> *</span>}
//                     </span>
//                     <span className="relative block">
//                       <Icon
//                         size={16}
//                         className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                       />
//                       <input
//                         type={type}
//                         name={name}
//                         required={required}
//                         value={
//                           type === "date" && formData[name]
//                             ? String(formData[name]).split("T")[0]
//                             : (formData[name] ?? "")
//                         }
//                         onChange={handleInputChange}
//                         className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
//                       />
//                     </span>
//                   </label>
//                 ))}

//                 {isTargetStudent && (
//                   <>
//                     {[
//                       ["Nationality", "nationality", COUNTRIES],
//                       [
//                         "Stream",
//                         "stream",
//                         [
//                           "Science",
//                           "Commerce",
//                           "Arts",
//                           "Vocational",
//                           "Diploma",
//                           "B.Tech",
//                           "Other",
//                         ],
//                       ],
//                       ["Gender", "gender", ["Male", "Female", "Other"]],
//                     ].map(([label, name, options]) => (
//                       <label key={name} className="space-y-2">
//                         <span className="text-sm font-bold">{label}</span>
//                         <select
//                           name={name}
//                           value={formData[name] || ""}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
//                         >
//                           <option value="">Select {label}</option>
//                           {options.map((option) => (
//                             <option key={option} value={option}>
//                               {option}
//                             </option>
//                           ))}
//                         </select>
//                       </label>
//                     ))}

//                     <div className="md:col-span-2 p-5 rounded-2xl border-2 border-dashed border-border bg-muted/20">
//                       <label className="text-sm font-bold">
//                         Documents (JPG/PNG)
//                       </label>
//                       <input
//                         type="file"
//                         multiple
//                         accept="image/png,image/jpeg,image/jpg"
//                         onChange={handleDocChange}
//                         className="mt-3 block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2.5 file:bg-primary/10 file:text-primary file:font-bold"
//                       />

//                       {(existingDocuments.length > 0 ||
//                         newDocuments.length > 0) && (
//                         <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
//                           {existingDocuments.map((url, i) => (
//                             <div
//                               key={`saved-${i}`}
//                               className="relative h-28 rounded-xl overflow-hidden border border-border"
//                             >
//                               <img
//                                 src={url}
//                                 alt="Saved document"
//                                 className="w-full h-full object-cover"
//                                 onClick={() =>
//                                   setActiveDocument({
//                                     url,
//                                     name: `Saved Document ${i + 1}`,
//                                   })
//                                 }
//                               />
//                               <button
//                                 type="button"
//                                 onClick={() => removeExistingDocument(url)}
//                                 className="absolute top-1 right-1 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center"
//                               >
//                                 <X size={14} />
//                               </button>
//                             </div>
//                           ))}
//                           {newDocuments.map((doc) => (
//                             <div
//                               key={doc.id}
//                               className="relative h-28 rounded-xl overflow-hidden border border-border"
//                             >
//                               <img
//                                 src={doc.previewUrl}
//                                 alt={doc.file.name}
//                                 className="w-full h-full object-cover"
//                               />
//                               <button
//                                 type="button"
//                                 onClick={() => removeNewDocument(doc.id)}
//                                 className="absolute top-1 right-1 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center"
//                               >
//                                 <X size={14} />
//                               </button>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </>
//                 )}
//               </div>

//               <div className="mt-7 pt-5 border-t border-border flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={cancelEdit}
//                   className="px-5 py-3 rounded-xl bg-muted font-bold"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={userLoading}
//                   className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center gap-2 disabled:opacity-60"
//                 >
//                   <Save size={16} />{" "}
//                   {userLoading ? "Saving..." : "Save Changes"}
//                 </button>
//               </div>
//             </motion.form>
//           )}
//         </AnimatePresence>
//       </div>

//       <AnimatePresence>
//         {showProfilePicModal && modalImageSrc && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setShowProfilePicModal(false)}
//             className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
//           >
//             <div className="relative max-w-4xl max-h-[90vh]">
//               <button
//                 onClick={() => setShowProfilePicModal(false)}
//                 className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
//               >
//                 <X size={20} />
//               </button>
//               <img
//                 src={modalImageSrc}
//                 alt="Full profile"
//                 className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
//                 onClick={(e) => e.stopPropagation()}
//               />
//             </div>
//           </motion.div>
//         )}

//         {activeDocument && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setActiveDocument(null)}
//             className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
//           >
//             <div className="relative max-w-5xl max-h-[90vh]">
//               <button
//                 onClick={() => setActiveDocument(null)}
//                 className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
//               >
//                 <X size={20} />
//               </button>
//               <img
//                 src={activeDocument.url}
//                 alt={activeDocument.name}
//                 className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
//                 onClick={(e) => e.stopPropagation()}
//               />
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {certificateCourse && (
//         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
//           <motion.div
//             initial={{ opacity: 0, scale: 0.96 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6"
//           >
//             <div className="flex items-center justify-between gap-3">
//               <div>
//                 <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
//                   Certificate
//                 </p>
//                 <h3 className="text-lg font-black mt-1">
//                   {getClassName(certificateCourse)}
//                 </h3>
//               </div>
//               <button
//                 onClick={() => {
//                   setCertificateCourse(null);
//                   setCertificateGrade("");
//                 }}
//                 className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
//               >
//                 <X size={17} />
//               </button>
//             </div>

//             <label className="block mt-6">
//               <span className="text-sm font-bold">Grade</span>
//               <input
//                 autoFocus
//                 value={certificateGrade}
//                 onChange={(e) => setCertificateGrade(e.target.value)}
//                 placeholder="e.g. A+"
//                 className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20"
//               />
//             </label>

//             <div className="mt-6 flex justify-end gap-3">
//               <button
//                 onClick={() => {
//                   setCertificateCourse(null);
//                   setCertificateGrade("");
//                 }}
//                 className="px-4 py-2.5 rounded-xl bg-muted font-bold text-sm"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={printCertificate}
//                 className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2"
//               >
//                 <Printer size={16} /> Print Certificate
//               </button>
//             </div>
//           </motion.div>
//         </div>
//       )}

//       <ConfirmModal
//         open={showDeleteModal}
//         title={`Delete ${roleLabel}?`}
//         message={`Are you sure you want to delete ${getName(profileData)}? This action cannot be undone.`}
//         confirmText="Delete User"
//         loading={isDeleting}
//         onClose={() => setShowDeleteModal(false)}
//         onConfirm={confirmDelete}
//       />

//       <ConfirmModal
//         open={showRemoveBatchModal}
//         title="Remove student from batch?"
//         message={`This will remove ${getName(profileData)} from "${batchToRemove?.name || "this batch"}". The student profile itself will not be deleted.`}
//         confirmText="Remove from Batch"
//         loading={isRemovingFromBatch}
//         onClose={() => {
//           if (!isRemovingFromBatch) {
//             setShowRemoveBatchModal(false);
//             setBatchToRemove(null);
//           }
//         }}
//         onConfirm={confirmRemoveFromBatch}
//       />

//       <style>{`
//         .action-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem .9rem;border-radius:.8rem;font-size:.82rem;font-weight:700;transition:.2s;border:1px solid transparent;box-shadow:0 4px 14px rgba(0,0,0,.05)}
//         .action-btn:active{transform:scale(.97)}
//         .badge{display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .7rem;border-radius:.65rem;background:hsl(var(--primary)/.1);color:hsl(var(--primary));border:1px solid hsl(var(--primary)/.18);font-size:.75rem;font-weight:800}
//         .section-toggle{display:inline-flex;align-items:center;gap:.35rem;padding:.4rem .65rem;border-radius:.65rem;background:hsl(var(--muted)/.55);font-size:.75rem;font-weight:700}
//         .empty-state{padding:2rem;text-align:center;border:1px dashed hsl(var(--border));border-radius:1rem;color:hsl(var(--muted-foreground));font-size:.875rem}
//       `}</style>
//     </div>
//   );
// };

// export default ProfilePage;

import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
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
  MapPin,
  Hash,
  BookOpen,
  GraduationCap,
  Calendar,
  Flag,
  UserCheck,
  Clock,
  FileText,
  Check,
  Trash2,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import { Helmet } from "react-helmet-async";

import useAuthStore from "../stores/useAuthStore";
import useUserStore from "../stores/useUserStore";
import useBatchStore from "../stores/useBatchStore";
import useClassStore from "../stores/useClassStore";
import BackButton from "../components/UI/Button";
import DeleteConfirmModal from "../components/UI/DeleteConfirmModal";
import { COUNTRIES } from "../util/Countries";
import { getStudentId } from "../util/getStudentId";
import { generateSlug } from "../util/generateSlug";
import { Image } from "../assets/Image";
import {
  canTeacherAccessStudent,
  filterBatchesForTeacher,
} from "../util/teacherAccessControl";

const ProfilePage = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Route State & Auth
  const targetUserId = location.state?.userId || location.state?.studentId || location.state?.teacherId;
  const targetUserData = location.state?.userData || location.state?.studentData || location.state?.teacherData;

  const loggedInUser = useAuthStore((state) => state.user);
  const loggedInUserRole = useAuthStore((state) => state.userRole);
  const activeUserId = targetUserId || loggedInUser?._id;

  const isSelf = activeUserId === loggedInUser?._id;
  const isAdmin = loggedInUser?.role === "Admin" || loggedInUser?.role?.toLowerCase() === "admin";

  // ZUSTAND STORES
  const getUserById = useUserStore((state) => state.getUserById);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const isUpdating = useUserStore((state) => state.isLoading);

  const { batches, fetchBatches } = useBatchStore();
  const { allClass, getClasses, getMainClassById, getStudentProgress } = useClassStore();

  // Local State
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Feature Toggle States
  const [showProgress, setShowProgress] = useState(true);
  const [showBatches, setShowBatches] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);

  // Modals & Viewers
  const [activeDocument, setActiveDocument] = useState(null);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Student Progress States
  const [detailedProgress, setDetailedProgress] = useState({});
  const [loadingProgress, setLoadingProgress] = useState({});
  
  // Certificate Print States
  const [certificateCourse, setCertificateCourse] = useState(null);
  const [certificateGrade, setCertificateGrade] = useState("");

  // Edit Form State
  const [formData, setFormData] = useState({});
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);
  const [newDocuments, setNewDocuments] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);

  // Role Logic
  const targetRole = profileData?.role || targetUserData?.role || "Student";
  const isTargetAdmin = targetRole === "Admin" || targetRole?.toLowerCase() === "admin";
  const isTargetTeacher = targetRole === "Teacher" || targetRole?.toLowerCase() === "teacher";
  const isTargetStudent = !isTargetAdmin && !isTargetTeacher;

  // Edit Permissions: Admins can edit anyone, Teachers can edit themselves
  const canEdit = isAdmin || (isTargetTeacher && isSelf);

  useEffect(() => {
    fetchBatches();
    getClasses();
  }, [fetchBatches, getClasses]);

  useEffect(() => {
    if (!activeUserId) {
      navigate("/");
      return;
    }

    // Teacher Access Control checking
    if (loggedInUserRole === "Teacher" && !isSelf) {
      if (targetUserData?.role === "Teacher" || targetRole === "Teacher") {
        setAccessDenied(true);
        toast.error("You cannot view other teachers' profiles");
        navigate("/access-denied");
        return;
      }

      if (batches.length > 0) {
        const teacherBatches = filterBatchesForTeacher(
          batches,
          loggedInUser?.batches || [],
          loggedInUserRole,
          loggedInUser?.email,
          loggedInUser?._id,
        );
        const canAccess = canTeacherAccessStudent(activeUserId, teacherBatches, loggedInUserRole);
        if (!canAccess) {
          setAccessDenied(true);
          toast.error("You can only view students from your assigned batches");
          navigate("/access-denied");
          return;
        }
      }
    }

    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        let currentData = null;
        if (isSelf) {
          currentData = loggedInUser;
        } else if (targetUserData && targetUserData._id === activeUserId) {
          currentData = targetUserData;
        }

        if (currentData) {
          setProfileData(currentData);
          setFormData(currentData);
        }

        // Always fetch fresh data
        let freshData = currentData;
        try {
          const response = await getUserById(activeUserId);
          const fetchedUser = response?.data?.user || response?.user || response?.data || response;
          if (fetchedUser && fetchedUser._id) {
            freshData = fetchedUser;
            setProfileData(freshData);
            setFormData(freshData);
          }
        } catch (err) {
          if (!freshData) throw new Error("Failed to load fresh user data.");
        }

        // Hydrate Student Progress Data
        if ((!freshData.role || freshData.role.toLowerCase() === "student") && Array.isArray(freshData.mainClasses) && freshData.mainClasses.length > 0) {
          const populatedClasses = await Promise.all(
            freshData.mainClasses.map(async (mainClass) => {
              const classId = typeof mainClass === "string" ? mainClass : mainClass._id;
              if (classId && getMainClassById) {
                try {
                  const res = await getMainClassById(classId);
                  const classData = res?.mainClass || res?.data?.mainClass || res;
                  const progressList = res?.studentsProgress || res?.data?.studentsProgress || classData?.studentsProgress || [];
                  const studentProg = progressList.find((p) => p.student?._id === freshData._id || p.student === freshData._id);

                  if (studentProg) {
                    setDetailedProgress((prev) => ({ ...prev, [classId]: studentProg }));
                  }
                  return classData || mainClass;
                } catch (error) {
                  return mainClass;
                }
              }
              return mainClass;
            })
          );
          setProfileData((prev) => ({ ...prev, mainClasses: populatedClasses }));
          setFormData((prev) => ({ ...prev, mainClasses: populatedClasses }));
        }

      } catch (error) {
        toast.error("Failed to load profile data");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [activeUserId, isSelf, loggedInUser, navigate, getUserById, batches]);

  const toggleProgressCheckbox = async (mainClassId, field) => {
    if (!isAdmin) {
      toast.error("Only Administrators can modify student progress.");
      return;
    }

    const classIdStr = typeof mainClassId === "string" ? mainClassId : mainClassId._id;
    const progRecord = detailedProgress[classIdStr];

    if (!progRecord || !progRecord._id) {
      toast.error("Progress record not found. Ensure the student is properly enrolled.");
      return;
    }

    const studentBatchId = progRecord._id;
    const newValue = !progRecord[field];

    setLoadingProgress((prev) => ({ ...prev, [`${classIdStr}_${field}`]: true }));

    try {
      await getStudentProgress(studentBatchId, { [field]: newValue });
      setDetailedProgress((prev) => ({
        ...prev,
        [classIdStr]: { ...prev[classIdStr], [field]: newValue },
      }));
      toast.success(`${field === "batchcompletion" ? "Course" : field === "examcompletion" ? "Exam" : "Certificate"} status updated!`);
    } catch (error) {
      toast.error("Error updating progress. Please try again.");
    } finally {
      setLoadingProgress((prev) => ({ ...prev, [`${classIdStr}_${field}`]: false }));
    }
  };

  const cleanupPreviews = () => {
    if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
    newDocuments.forEach((doc) => URL.revokeObjectURL(doc.previewUrl));
  };

  const startEditing = () => {
    setIsEditing(true);
    setExistingDocuments(profileData.documents || []);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData(profileData);
    cleanupPreviews();
    setNewProfilePic(null);
    setNewProfilePreview(null);
    setNewDocuments([]);
    setExistingDocuments([]);
  };

  useEffect(() => {
    if (!isEditing) return;
    const handlePopState = () => cancelEdit();
    window.history.pushState({ profileEdit: true }, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isEditing, profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "adhar") {
      const onlyNumbers = value.replace(/\D/g, "");
      const maxLength = name === "phone" ? 10 : 12;
      if (onlyNumbers.length <= maxLength) {
        setFormData({ ...formData, [name]: onlyNumbers });
      }
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
        setNewProfilePic(file);
        setNewProfilePreview(URL.createObjectURL(file));
      } else {
        toast.error("Only JPG and PNG images are allowed.");
      }
    }
  };

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    files.forEach((file) => {
      if (["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        validFiles.push({
          id: Math.random().toString(36).substring(7),
          file: file,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        toast.error(`Skipped ${file.name}: Only JPG/PNG allowed.`);
      }
    });
    setNewDocuments((prev) => [...prev, ...validFiles]);
    e.target.value = null;
  };

  const removeNewDocument = (idToRemove) => {
    setNewDocuments((prev) => {
      const docToRemove = prev.find((d) => d.id === idToRemove);
      if (docToRemove) URL.revokeObjectURL(docToRemove.previewUrl);
      return prev.filter((d) => d.id !== idToRemove);
    });
  };

  const removeExistingDocument = (urlToRemove) => {
    setExistingDocuments((prev) => prev.filter((url) => url !== urlToRemove));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!canEdit) {
      setIsEditing(false);
      return toast.error("Access denied. Only Admins can edit profiles.");
    }

    if (!formData.name || formData.name.trim().length < 3) {
      return toast.error("Please enter a valid full name (min 3 chars).");
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      return toast.error("Please enter a valid email address.");
    }
    if (formData.phone && formData.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits.");
    }
    if (isTargetStudent && formData.adhar && formData.adhar.length !== 12) {
      return toast.error("Aadhar number must be exactly 12 digits.");
    }

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (typeof formData[key] === "string" || typeof formData[key] === "number") {
        submitData.append(key, formData[key]);
      }
    });

    if (formData.fatherName) {
      submitData.append("fathersName", formData.fatherName);
      submitData.append("fathername", formData.fatherName);
      submitData.append("father_name", formData.fatherName);
      submitData.append("parentName", formData.fatherName);
    }

    if (newProfilePic) submitData.append("profilePic", newProfilePic);

    if (isTargetStudent) {
      newDocuments.forEach((doc) => submitData.append("documents", doc.file));
      existingDocuments.forEach((url) => submitData.append("retainedDocuments", url));
    }

    try {
      const serverResponse = await updateUser(profileData._id, submitData);
      const freshUserData = serverResponse?.data?.user || serverResponse?.user || serverResponse?.data || serverResponse;

      setProfileData(freshUserData);
      if (isSelf) useAuthStore.setState({ user: freshUserData });

      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          userId: freshUserData._id,
          userData: freshUserData,
          studentData: isTargetStudent ? freshUserData : undefined,
          teacherData: isTargetTeacher ? freshUserData : undefined,
        },
      });

      toast.success("Profile updated successfully!");
      cleanupPreviews();
      setIsEditing(false);
      setNewProfilePic(null);
      setNewProfilePreview(null);
      setNewDocuments([]);
      setExistingDocuments([]);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to update profile");
    }
  };

  const confirmDeleteAction = async () => {
    if (!isAdmin || isSelf) return;
    setIsDeleting(true);
    try {
      await deleteUser(profileData._id);
      toast.success("User deleted successfully.");
      setShowDeleteModal(false);
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  // Printing & Formatting Helpers
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  const escapeHtml = (value = "") => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const getAbsoluteUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return window.location.origin + (path.startsWith("/") ? path : `/${path}`);
  };

  // Student Print Logics
  const getMainClassName = () => {
    const mainClass = profileData.mainClasses?.[0];
    if (!mainClass) return "DCA";
    return mainClass.name || mainClass.courseName || mainClass.title || "DCA";
  };
  const getBatchName = () => {
    const batch = profileData.batches?.[0];
    if (!batch) return "Computer";
    return batch.name || batch.batchName || "Computer";
  };

  const handlePrintStudentCard = (cardType) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups to print student card");

    const isGcc = cardType === "gcc";
    const frontTemplate = getAbsoluteUrl(isGcc ? Image.studentGccCardFront : Image.studentIkCardFront);
    const backTemplate = getAbsoluteUrl(Image.studentCardBack);
    const profilePicUrl = getAbsoluteUrl(profileData.profilePic || "");
    const qrCodeUrl = getAbsoluteUrl(profileData.qrCodeUrl || Image.qrCode);
    const studentId = getStudentId(profileData) || profileData.studentId || "N/A";
    const session = (() => {
      const date = new Date(profileData.admissionDate || profileData.createdAt || Date.now());
      const baseYear = Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
      const start = isGcc ? new Date(baseYear, 0, 1) : new Date(baseYear, 3, 1);
      const end = isGcc ? new Date(baseYear, 11, 31) : new Date(baseYear + 1, 2, 31);
      const fmt = (d) => [String(d.getDate()).padStart(2, "0"), String(d.getMonth() + 1).padStart(2, "0"), String(d.getFullYear()).slice(-2)].join(".");
      return `${fmt(start)}. To ${fmt(end)}`;
    })();

    const html = `<!DOCTYPE html><html><head><title>${escapeHtml(isGcc ? "GCC Admit Card" : "IK Student ID Card")} - ${escapeHtml(profileData.name)}</title>
      <style>
        *{box-sizing:border-box} html,body{margin:0;background:#111;font-family:Arial,Helvetica,sans-serif}
        body{padding:18px;display:flex;flex-direction:column;align-items:center;gap:18px}
        .page{position:relative;width:min(88mm,calc(100vw - 24px));aspect-ratio:6496/10039;overflow:hidden;background:#000;color:#fff;break-after:page}
        .page:last-child{break-after:auto} .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
        .student-photo,.placeholder-photo{position:absolute;z-index:2;left:50%;top:27.8%;transform:translate(-50%,-50%);width:44%;height:28.5%;border-radius:50%;object-fit:cover;background:#0b5db8;border:2px solid rgba(255,255,255,0.9)}
        .placeholder-photo{display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:800}
        .field{position:absolute;z-index:3;left:8%;width:84%;text-align:center;line-height:1.08;white-space:nowrap;overflow:hidden;margin-bottom:6px;padding-bottom:4px;margin-top:4px}
        .name{top:46.15%;color:#fff;font-size:clamp(22px,6.5vw,44px);font-weight:400;text-transform:uppercase}
        .student-id{top:52.25%;color:#ffc400;font-size:clamp(14px,3.8vw,26px);font-weight:700}
        .course{top:61.0%;color:#fff;font-size:clamp(14px,4.2vw,28px);font-weight:800}
        .group-line{top:67.0%;color:#fff;font-size:clamp(14px,4vw,28px);font-weight:800}
        .session{top:73.0%;color:#fff;font-size:clamp(11px,3vw,22px);font-weight:800}
        .qr{position:absolute;z-index:2;left:28.4%;top:53.55%;width:43.2%;height:28.4%;object-fit:contain;background:#fff;padding:6%}
        @media print{@page{size:88mm 136mm;margin:0} html,body{width:88mm;background:#fff;padding:0} body{display:block} .page{width:88mm;height:136mm} .name{font-size:6.2mm} .student-id{font-size:4.2mm} .course,.group-line{font-size:4.4mm} .session{font-size:3.2mm}}
      </style></head><body>
      <section class="page"><img class="template" src="${frontTemplate}" />
      ${profilePicUrl ? `<img class="student-photo" src="${profilePicUrl}" />` : `<div class="placeholder-photo">${escapeHtml(profileData.name?.charAt(0)?.toUpperCase() || "S")}</div>`}
      <div class="field name" data-fit-text>${escapeHtml(profileData.name)}</div>
      <div class="field student-id" data-fit-text>Student ID : ${escapeHtml(studentId)}</div>
      <div class="field course" data-fit-text>${escapeHtml(isGcc ? "Training on Academic Literacy" : `Training on ${getMainClassName()}`)}</div>
      <div class="field group-line" data-fit-text>${escapeHtml(isGcc ? `Class : ${profileData.grade || profileData.class || "VIII"}` : `Batch : ${getBatchName()}`)}</div>
      <div class="field session" data-fit-text>Academic Session : ${escapeHtml(session)}</div></section>
      <section class="page"><img class="template" src="${backTemplate}" /><img class="qr" src="${qrCodeUrl}" /></section>
      <script>
        function fitTextFields(){document.querySelectorAll("[data-fit-text]").forEach(function(el){var min=9;var size=parseFloat(window.getComputedStyle(el).fontSize);el.style.fontSize=size+"px";while(el.scrollWidth>el.clientWidth&&size>min){size-=0.5;el.style.fontSize=size+"px";}});}
        window.onafterprint=function(){window.close();};
        window.onload=function(){setTimeout(function(){fitTextFields();window.print();},600);};
      </script></body></html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintCertificate = () => {
    if (!certificateCourse) return;
    const grade = certificateGrade.trim();
    if (!grade) return toast.error("Please enter a grade before printing certificate.");
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups to print certificate");

    const template = getAbsoluteUrl(Image.ikCertificateTemplate);
    const studentId = getStudentId(profileData) || profileData.studentId || "";
    const certNo = `IK${new Date().getFullYear().toString().slice(-2)}${String(studentId || profileData._id).replace(/\W/g, "").slice(-7).padStart(7, "0")}`;
    const fmtCertDate = (v) => { const d = new Date(v||Date.now()); return [String(d.getDate()).padStart(2, "0"), String(d.getMonth() + 1).padStart(2, "0"), d.getFullYear()].join("."); };
    
    const html = `<!DOCTYPE html><html><head><title>Certificate - ${escapeHtml(profileData.name)}</title>
      <style>
        *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact} html,body{margin:0;padding:0;background:#f3f4f6;font-family:Arial} body{min-height:100vh;display:flex;align-items:center;justify-content:center}
        .certificate{position:relative;width:min(297mm,100vw);aspect-ratio:3508/2480;background:#fff;overflow:hidden;color:#2a176d} .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
        .field{position:absolute;z-index:2;text-align:center;font-weight:800;color:#2d2078;line-height:1.05;white-space:nowrap;overflow:hidden}
        .student-name{left:33.2%;top:49.05%;width:18.6%;font-size:clamp(14px,2vw,38px)} .relation{left:51.7%;top:49.45%;width:10.2%;color:#5b3191;font-family:"Times New Roman",serif;font-style:italic;font-size:clamp(13px,1.65vw,31px)}
        .guardian-name{left:61.7%;top:49.05%;width:19.2%;font-size:clamp(14px,2vw,38px)} .reg-no{left:53.2%;top:58.03%;width:13.5%;font-size:clamp(13px,1.75vw,32px)} .cert-no{left:80.2%;top:58.03%;width:13.2%;font-size:clamp(13px,1.75vw,32px)}
        .course-name{left:55.3%;top:64.85%;width:36.5%;text-align:left;font-size:clamp(13px,1.85vw,35px)} .from-date{left:42.8%;top:72.1%;width:11.8%;font-size:clamp(13px,1.7vw,32px)} .to-date{left:56.0%;top:72.1%;width:12%;font-size:clamp(13px,1.7vw,32px)}
        .grade{left:77.4%;top:72.1%;width:8%;font-size:clamp(13px,1.75vw,34px)} .issue-date{left:42.2%;top:90.07%;width:12%;font-size:clamp(13px,1.7vw,32px)}
        @media print{@page{size:A4 landscape;margin:0} html,body{width:297mm;height:210mm;background:#fff} .certificate{width:297mm;height:210mm} .student-name,.guardian-name{font-size:7.2mm} .relation{font-size:6.2mm} .reg-no,.cert-no,.course-name,.from-date,.to-date,.grade,.issue-date{font-size:5.6mm}}
      </style></head><body>
      <section class="certificate"><img class="template" src="${template}" />
      <div class="field student-name" data-fit-text>${escapeHtml(profileData.name)}</div>
      <div class="field relation">${escapeHtml(profileData.fatherName ? "Son of" : "")}</div>
      <div class="field guardian-name" data-fit-text>${escapeHtml(profileData.fatherName || "")}</div>
      <div class="field reg-no" data-fit-text>${escapeHtml(studentId || "-")}</div>
      <div class="field cert-no" data-fit-text>${escapeHtml(certNo)}</div>
      <div class="field course-name" data-fit-text>${escapeHtml((certificateCourse?.name || certificateCourse?.courseName || "Course").toUpperCase())}</div>
      <div class="field from-date" data-fit-text>${escapeHtml(fmtCertDate(certificateCourse?.startDate || profileData.admissionDate || profileData.createdAt))}</div>
      <div class="field to-date" data-fit-text>${escapeHtml(fmtCertDate(certificateCourse?.endDate))}</div>
      <div class="field grade" data-fit-text>${escapeHtml(grade.toUpperCase())}</div>
      <div class="field issue-date" data-fit-text>${escapeHtml(fmtCertDate())}</div></section>
      <script>
        function fitTextFields(){document.querySelectorAll("[data-fit-text]").forEach(function(el){var min=9;var size=parseFloat(window.getComputedStyle(el).fontSize);el.style.fontSize=size+"px";while(el.scrollWidth>el.clientWidth&&size>min){size-=0.5;el.style.fontSize=size+"px";}});}
        window.onafterprint=function(){window.close();}; window.onload=function(){setTimeout(function(){fitTextFields();window.print();},600);};
      </script></body></html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setCertificateCourse(null);
    setCertificateGrade("");
  };

  // Teacher Print Logic
  const handlePrintTeacherCard = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return toast.error("Please allow popups to print teacher ID card");
    const template = getAbsoluteUrl(Image.teacherIdCardTemplate);
    const photo = getAbsoluteUrl(profileData.profilePic || "");
    const dept = profileData.department || profileData.dept || (allClass?.find(c => c.teacherEmail === profileData.email)?.name) || "Information Technology (IT)";
    const empId = profileData.employeeId || profileData.employeeID || profileData.teacherId || `IK${String(profileData.createdAt ? new Date(profileData.createdAt).getMonth() + 1 : "00").padStart(2, "0")}${new Date().getFullYear()}A${String((parseInt(profileData._id.slice(-6), 16) || 0) % 1000 + 1).padStart(3, "0")}`;
    const html = `<!DOCTYPE html><html><head><title>Teacher ID Card - ${escapeHtml(profileData.name)}</title>
      <style>
        *{box-sizing:border-box} html,body{margin:0;min-height:100%;background:#111;font-family:Arial} body{display:flex;align-items:center;justify-content:center;padding:18px}
        .id-card{position:relative;width:min(88mm,calc(100vw - 24px));aspect-ratio:6496/10039;overflow:hidden;background:#000;color:#fff} .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
        .teacher-photo,.placeholder-photo{position:absolute;z-index:2;left:49.5%;top:30%;transform:translate(-50%,-50%);width:44%;height:28.5%;border-radius:50%;object-fit:cover;background:#0b5db8;border:2px solid rgba(255,255,255,0.9)}
        .placeholder-photo{display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:800}
        .field{position:absolute;z-index:3;width:82%;left:9%;text-align:center;line-height:1.05;white-space:nowrap;overflow:hidden}
        .name{top:50.35%;font-size:clamp(24px,7.2vw,48px);font-weight:500;text-transform:uppercase} .designation{top:57.25%;font-size:clamp(18px,5vw,34px);font-weight:700;color:#ffc400;text-transform:uppercase}
        .department{top:64.35%;font-size:clamp(15px,4.1vw,28px);font-weight:500} .employee-id{top:68.65%;font-size:clamp(15px,4.1vw,28px);font-weight:700;color:#ffc400}
        .joining-date{top:81.25%;left:40%;width:54%;text-align:left;font-size:clamp(13px,3.4vw,24px);font-weight:800;position:absolute;z-index:3}
        @media print{@page{size:88mm 136mm;margin:0} html,body{width:88mm;min-height:136mm;background:#fff;padding:0} body{display:block} .id-card{width:88mm;height:136mm} .name{font-size:7.2mm} .designation{font-size:5.2mm} .department,.employee-id{font-size:4.2mm} .joining-date{font-size:3.7mm}}
      </style></head><body>
      <div class="id-card"><img class="template" src="${template}" />
      ${photo ? `<img class="teacher-photo" src="${photo}" />` : `<div class="placeholder-photo">${escapeHtml(profileData.name?.charAt(0)?.toUpperCase() || "T")}</div>`}
      <div class="field name" data-fit-text>${escapeHtml(profileData.name)}</div>
      <div class="field designation" data-fit-text>${escapeHtml(profileData.designation || "Senior IT Faculty")}</div>
      <div class="field department" data-fit-text>Dept. of ${escapeHtml(dept)}</div>
      <div class="field employee-id" data-fit-text>Employee ID : ${escapeHtml(empId)}</div>
      <div class="joining-date">Date of Joining : ${escapeHtml((v=>{const d=new Date(v);return[String(d.getDate()).padStart(2,"0"),String(d.getMonth()+1).padStart(2,"0"),d.getFullYear()].join(".");})(profileData.createdAt))}</div></div>
      <script>
        function fitTextFields(){document.querySelectorAll("[data-fit-text]").forEach(function(el){var min=9;var size=parseFloat(window.getComputedStyle(el).fontSize);el.style.fontSize=size+"px";while(el.scrollWidth>el.clientWidth&&size>min){size-=0.5;el.style.fontSize=size+"px";}});}
        window.onafterprint=function(){window.close();}; window.onload=function(){setTimeout(function(){fitTextFields();window.print();},600);};
      </script></body></html>`;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Helper Renderers
  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 w-full sm:w-1/3">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          {Icon && <Icon size={16} />}
        </div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground capitalize tracking-wider">{label}</p>
      </div>
      <div className="sm:w-2/3 pl-11 sm:pl-0">
        {typeof value === "string" || typeof value === "number" ? (
          <p className="text-sm sm:text-base font-semibold text-foreground break-words">{value || "Not Provided"}</p>
        ) : (
          value || <p className="text-sm sm:text-base font-semibold text-foreground">Not Provided</p>
        )}
      </div>
    </div>
  );

  // Teacher specific lists
  const teacherBatches = batches?.filter((b) => b.teacherEmail === profileData?.email || b.teachers?.some((t) => (t._id || t) === profileData?._id)) || [];
  const teacherCourses = allClass?.filter((c) => c.teacherEmail === profileData?.email || c.teachers?.some((t) => (t._id || t) === profileData?._id)) || [];
  const displayBatches = teacherBatches.length > 0 ? teacherBatches : profileData?.batches || [];
  const displayCourses = teacherCourses.length > 0 ? teacherCourses : profileData?.mainClasses || [];

  if (isLoading || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-md"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 bg-background text-foreground font-sans transition-colors duration-300">
      <Helmet>
        <title>{`IOK - ${isTargetTeacher ? 'Teacher' : isTargetAdmin ? 'Admin' : 'Student'} | ${profileData.name}`}</title>
      </Helmet>
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
          {isEditing ? (
            <button type="button" onClick={cancelEdit} className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 font-semibold text-sm transition-all">
              <X size={17} className="group-hover:rotate-90 transition-transform" /> Back to Profile
            </button>
          ) : <BackButton />}

          <div className="flex items-center gap-2 sm:gap-3">
            {!isEditing && isTargetStudent && (
              <>
                <button onClick={() => handlePrintStudentCard("ik")} className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95">
                  <Printer size={16} /> <span className="hidden sm:inline">Print IK</span>
                </button>
                <button onClick={() => handlePrintStudentCard("gcc")} className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95 dark:bg-slate-700">
                  <Printer size={16} /> <span className="hidden sm:inline">Print GCC</span>
                </button>
              </>
            )}
            {!isEditing && isTargetTeacher && (
              <button onClick={handlePrintTeacherCard} className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg active:scale-95">
                <Printer size={16} /> <span className="hidden sm:inline">Print ID Card</span>
              </button>
            )}
            {isAdmin && !isSelf && !isEditing && (
              <button onClick={() => setShowDeleteModal(true)} className="group flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95">
                <Trash2 size={16} /> <span className="hidden sm:inline">Delete {isTargetTeacher ? 'Teacher' : 'Student'}</span>
              </button>
            )}
            {canEdit && !isEditing && (
              <button onClick={startEditing} className="group flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95">
                <Edit3 size={16} className="group-hover:rotate-12 transition-transform" /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {!canEdit && !isSelf && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <p>Read-Only Mode. You have permission to view this profile, but only Administrators can edit details.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isEditing ? (
            /* ================= VIEW MODE ================= */
            <motion.div key="view-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              {/* Profile Banner */}
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center shadow-sm relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="relative shrink-0 z-10">
                  <div onClick={() => { if (profileData.profilePic) { setModalImageSrc(profileData.profilePic); setShowProfilePicModal(true); } }} className={`w-28 h-28 sm:w-36 sm:h-36 border-4 border-card shadow-xl bg-muted rounded-full overflow-hidden relative group ${profileData.profilePic ? "cursor-pointer" : ""}`}>
                    {profileData.profilePic ? (
                      <><img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white drop-shadow-md" size={28} /></div></>
                    ) : <User size={48} className="text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left z-10 w-full">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize tracking-tight">{profileData.name}</h2>
                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                    {isTargetStudent ? (
                      <>
                        <span className="flex items-center gap-1.5 text-sm text-accent-foreground font-bold bg-accent border border-border px-3 py-1.5 rounded-lg shadow-sm"><GraduationCap size={14} /> Student</span>
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-bold bg-muted border border-border px-3 py-1.5 rounded-lg shadow-sm">ID: {getStudentId(profileData)}</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-primary-foreground font-bold bg-primary border border-primary/20 px-4 py-1.5 rounded-lg shadow-sm"><Shield size={14} /> {targetRole}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Universal Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
                  <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-2"><UserCheck className="text-primary" size={18} /><h3 className="font-bold text-foreground">Contact & Personal Details</h3></div>
                  <div className="divide-y divide-border/50">
                    <InfoRow icon={Mail} label="Email Address" value={profileData.email} />
                    <InfoRow icon={Phone} label="Phone Number" value={profileData.phone} />
                    {isTargetStudent && profileData.fatherName && <InfoRow icon={User} label="Father's Name" value={profileData.fatherName} />}
                    {isTargetStudent && profileData.dob && <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(profileData.dob)} />}
                    {isTargetStudent && profileData.gender && <InfoRow icon={User} label="Gender" value={profileData.gender} />}
                    {isTargetStudent && profileData.nationality && <InfoRow icon={Flag} label="Nationality" value={profileData.nationality} />}
                    {isTargetStudent && profileData.address && <InfoRow icon={MapPin} label="Address" value={profileData.address} />}
                    <InfoRow icon={Calendar} label={isTargetStudent ? "Admission Date" : "Joined Date"} value={formatDate(profileData.admissionDate || profileData.createdAt)} />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit flex flex-col">
                  <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-2"><Shield className="text-primary" size={18} /><h3 className="font-bold text-foreground">Academic / Professional Status</h3></div>
                  <div className="divide-y divide-border/50 flex-1">
                    {isTargetStudent ? (
                      <>
                        {profileData.stream && <InfoRow icon={BookOpen} label="Stream" value={profileData.stream} />}
                        {profileData.grade && <InfoRow icon={GraduationCap} label="Grade" value={profileData.grade} />}
                        {profileData.marksObtained !== undefined && <InfoRow icon={FileText} label="Marks Obtained" value={`${profileData.marksObtained}`} />}
                        <InfoRow icon={Hash} label="Aadhar Number" value={isAdmin ? profileData.adhar : profileData.adhar ? `XXXX-XXXX-${String(profileData.adhar).replace(/\D/g,"").slice(-4)}` : "-"} />
                      </>
                    ) : (
                      <>
                        <InfoRow icon={Shield} label="System Role" value={profileData.role || "Teacher"} />
                        <InfoRow icon={BookOpen} label="Assigned Courses" value={
                          displayCourses?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {displayCourses.map((c, i) => {
                                const courseObj = typeof c === "object" ? c : allClass?.find(cls => cls._id === c);
                                const content = <span key={courseObj?._id || i} className={`bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md text-xs font-semibold ${isAdmin && courseObj ? "hover:bg-primary/20 transition-colors" : ""}`}>{courseObj?.name || c}</span>;
                                return (isAdmin && courseObj) ? <Link key={courseObj._id} to={`/courses/${generateSlug(courseObj.name)}`} state={{ courseId: courseObj._id }}>{content}</Link> : content;
                              })}
                            </div>
                          ) : "None"
                        } />
                        <InfoRow icon={Clock} label="Assigned Batches" value={
                          displayBatches?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {displayBatches.map((b, i) => {
                                const batchObj = typeof b === "object" ? b : batches?.find(batch => batch._id === b);
                                const content = <span key={batchObj?._id || i} className={`bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-semibold ${isAdmin && batchObj ? "hover:bg-emerald-500/20 transition-colors" : ""}`}>{batchObj ? `${batchObj.name} (${batchObj.weekday})` : b}</span>;
                                return (isAdmin && batchObj) ? <Link key={batchObj._id} to={`/batches/${generateSlug(batchObj.name)}`} state={{ batchId: batchObj._id }}>{content}</Link> : content;
                              })}
                            </div>
                          ) : "None"
                        } />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Specific Sections */}
              {isTargetStudent && (
                <>
                  {/* Course Progress */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><BookOpen className="text-primary" size={22} /> Enrolled Course Progress</h3>
                      <button onClick={() => setShowProgress(!showProgress)} className="text-sm font-medium bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">{showProgress ? "Hide" : "Show"} {showProgress ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    </div>
                    <AnimatePresence initial={false}>
                      {showProgress && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pt-2">
                            {profileData.mainClasses?.length > 0 ? (
                              <div className="space-y-4">
                                {profileData.mainClasses.map((mainClassObj) => {
                                  const classObj = typeof mainClassObj === "string" ? { _id: mainClassObj, name: "Loading...", duration: "-", fees: "-" } : mainClassObj;
                                  const progress = detailedProgress[classObj._id];
                                  return (
                                    <div key={classObj._id} className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                                        <div>
                                          <h3 className="text-lg font-bold">{classObj.name}</h3>
                                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {classObj.duration || "-"} Months</span>
                                            {classObj.startDate && <span className="bg-muted px-2 py-0.5 rounded text-xs border border-border">Start: {formatDate(classObj.startDate)}</span>}
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
                                          <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">₹ {classObj.fees || "-"}</span>
                                          <button type="button" onClick={() => { setCertificateCourse(classObj); setCertificateGrade(""); }} className="text-sm font-semibold bg-success/10 hover:bg-success/20 text-success px-4 py-1.5 rounded-full border border-success/20 transition-colors flex items-center gap-1.5"><Printer size={14} /> Print Certificate</button>
                                        </div>
                                      </div>
                                      {progress ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                          {[
                                            { field: "batchcompletion", icon: BookOpen, label: "Course Completed", color: "primary" },
                                            { field: "examcompletion", icon: FileText, label: "Exam Cleared", color: "accent" },
                                            { field: "certificateIssued", icon: Check, label: "Certificate Issued", color: "success" },
                                          ].map(({ field, icon: Icon, label, color }) => {
                                            const isComplete = progress[field];
                                            const statusColors = isComplete ? (color === "primary" ? "bg-primary/5 border-primary/40 text-primary" : color === "accent" ? "bg-accent/5 border-accent-foreground/40 text-accent-foreground" : "bg-success/5 border-success/40 text-success") : "bg-background border-border/60 text-muted-foreground";
                                            return (
                                              <button key={field} onClick={() => toggleProgressCheckbox(classObj._id, field)} disabled={!isAdmin || loadingProgress[`${classObj._id}_${field}`]} className={`relative rounded-xl p-4 border-2 transition-all flex flex-col justify-between h-full text-left ${statusColors} ${isAdmin ? "hover:-translate-y-1 hover:shadow-md cursor-pointer" : "opacity-90 cursor-not-allowed"}`}>
                                                <div className="flex items-start justify-between mb-3 w-full">
                                                  <div className={`p-2.5 rounded-lg ${isComplete ? "bg-current/10" : "bg-muted"}`}><Icon size={18} /></div>
                                                  {isComplete && <div className={`p-1 rounded-full text-white ${color === "primary" ? "bg-primary" : color === "accent" ? "bg-accent-foreground" : "bg-success"}`}><Check size={14} strokeWidth={3} /></div>}
                                                </div>
                                                <div>
                                                  <p className={`font-semibold text-sm ${isComplete ? "text-foreground" : ""}`}>{label}</p>
                                                  <p className="text-xs opacity-70 mt-1">{isComplete ? "Completed" : isAdmin ? "Click to toggle" : "Pending"}</p>
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="w-full py-6 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center"><span className="text-sm font-semibold text-muted-foreground">No batch assign</span></div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-card rounded-2xl border border-border border-dashed p-10 text-center flex flex-col items-center"><BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" /><h3 className="font-semibold">No Classes Enrolled</h3></div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Student Assigned Batches */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><Clock className="text-primary" size={22} /> Assigned Batches</h3>
                      <button onClick={() => setShowBatches(!showBatches)} className="text-sm font-medium bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">{showBatches ? "Hide" : "Show"} {showBatches ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    </div>
                    <AnimatePresence initial={false}>
                      {showBatches && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pt-2">
                            {profileData.batches?.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {profileData.batches.map((batchObj) => {
                                  const batch = typeof batchObj === "string" ? { _id: batchObj, name: "Loading...", weekday: "-", startTime: "-", endTime: "-" } : batchObj;
                                  return (
                                    <div key={batch._id} className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                                      <h3 className="font-bold mb-3 truncate">{batch.name}</h3>
                                      <div className="space-y-2">
                                        <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-2 rounded-md"><Calendar size={14} className="mr-2 text-primary" /><span className="font-medium text-foreground">{batch.weekday}</span></div>
                                        <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-2 rounded-md"><div className="w-1.5 h-1.5 rounded-full bg-success mr-2.5 ml-1"></div>{batch.startTime} - {batch.endTime}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-card rounded-2xl border border-border border-dashed p-8 text-center flex flex-col items-center"><Clock className="w-8 h-8 text-muted-foreground/40 mb-2" /><p className="text-sm text-muted-foreground">No batches assigned.</p></div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Student Uploaded Documents */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><FileText className="text-primary" size={22} /> Uploaded Documents</h3>
                      <button onClick={() => setShowDocuments(!showDocuments)} className="text-sm font-medium bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">{showDocuments ? "Hide" : "Show"} {showDocuments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    </div>
                    <AnimatePresence initial={false}>
                      {showDocuments && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="pt-2">
                            <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {profileData.documents?.length > 0 ? (
                                  profileData.documents.map((docUrl, idx) => (
                                    <div key={idx} onClick={() => setActiveDocument({ url: docUrl, name: `Document ${idx + 1}` })} className="cursor-pointer bg-muted border border-border rounded-xl overflow-hidden h-32 group relative shadow-sm">
                                      <img src={docUrl} alt={`Doc ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"><ZoomIn className="text-white" size={20} /><span className="text-white text-xs font-semibold">View</span></div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border"><FileText size={24} className="mx-auto opacity-40 mb-2" /><p className="text-sm">No documents available.</p></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            /* ================= EDIT MODE ================= */
            <motion.div key="edit-mode" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
              <form onSubmit={handleUpdate} className="bg-card p-6 sm:p-8 rounded-2xl shadow-xl border border-border">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <Edit3 className="text-primary" size={20} />
                  <h2 className="text-xl font-bold">Edit {targetRole} Details</h2>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 bg-muted/30 p-6 rounded-xl border border-border/50">
                  <div className="relative shrink-0">
                    <div onClick={() => { if (newProfilePreview || profileData.profilePic) { setModalImageSrc(newProfilePreview || profileData.profilePic); setShowProfilePicModal(true); } }} className={`w-24 h-24 rounded-full shadow-md border-4 border-card bg-muted overflow-hidden relative group ${newProfilePreview || profileData.profilePic ? "cursor-pointer" : ""}`}>
                      {newProfilePreview || profileData.profilePic ? (
                        <><img src={newProfilePreview || profileData.profilePic} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn size={20} className="text-white" /></div></>
                      ) : <User size={32} className="text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-bold block mb-2">Update Profile Photo</label>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleProfilePicChange} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Universal Fields */}
                  {[
                    { label: "Full Name", name: "name", icon: User, type: "text", req: true },
                    { label: "Email Address", name: "email", icon: Mail, type: "email", req: true },
                    { label: "Phone Number", name: "phone", icon: Phone, type: "text", req: true, placeholder: "10-digit number" }
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-sm font-bold">{field.label} {field.req && <span className="text-destructive">*</span>}</label>
                      <div className="relative">
                        <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input type={field.type} name={field.name} value={formData[field.name] || ""} onChange={handleInputChange} required={field.req} placeholder={field.placeholder} className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow" />
                      </div>
                    </div>
                  ))}

                  {/* Student Specific Fields */}
                  {isTargetStudent && [
                    { label: "Father's Name", name: "fatherName", icon: User, type: "text" },
                    { label: "Date of Birth", name: "dob", icon: Calendar, type: "date" },
                    { label: "Nationality", name: "nationality", icon: Flag, type: "select", options: COUNTRIES },
                    { label: "Address", name: "address", icon: MapPin, type: "text" },
                    { label: "Stream", name: "stream", icon: BookOpen, type: "select", options: ["Science", "Commerce", "Arts", "Vocational", "Diploma", "B.Tech", "Other"] },
                    { label: "Grade", name: "grade", icon: GraduationCap, type: "text" },
                    { label: "Marks Obtained", name: "marksObtained", icon: FileText, type: "number" },
                    { label: "Aadhar Number", name: "adhar", icon: Hash, type: "text", placeholder: "12-digit number" },
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-sm font-bold">{field.label}</label>
                      <div className="relative">
                        <field.icon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        {field.type === "select" ? (
                          <select name={field.name} value={formData[field.name] || ""} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background appearance-none focus:ring-2 focus:ring-primary/20 outline-none transition-shadow">
                            <option value="">Select {field.label}</option>
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input type={field.type} name={field.name} value={field.type === "date" && formData[field.name] ? formData[field.name].split("T")[0] : formData[field.name] || ""} onChange={handleInputChange} placeholder={field.placeholder} className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow" />
                        )}
                      </div>
                    </div>
                  ))}

                  {isTargetStudent && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold">Gender</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <select name="gender" value={formData.gender || ""} onChange={handleInputChange} className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background appearance-none outline-none focus:ring-2 focus:ring-primary/20">
                          <option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Student Document Uploader */}
                  {isTargetStudent && (
                    <div className="col-span-1 md:col-span-2 mt-4 p-6 border-2 border-dashed border-border rounded-xl bg-muted/30">
                      <label className="text-sm font-bold block mb-3">Update Documents (JPG/PNG Only)</label>
                      <input type="file" multiple accept="image/png, image/jpeg, image/jpg" onChange={handleDocChange} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-colors mb-4" />
                      
                      {(existingDocuments.length > 0 || newDocuments.length > 0) && (
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {existingDocuments.map((docUrl, idx) => (
                            <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden h-28 border border-border shadow-sm">
                              <img src={docUrl} alt="Saved" className="w-full h-full object-cover cursor-pointer" onClick={() => setActiveDocument({ url: docUrl, name: `Saved Document ${idx + 1}` })} />
                              <button type="button" onClick={() => removeExistingDocument(docUrl)} className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-all z-10"><X size={14} strokeWidth={3} /></button>
                              <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded pointer-events-none">Saved</span>
                            </div>
                          ))}
                          {newDocuments.map((doc) => (
                            <div key={doc.id} className="relative group rounded-xl overflow-hidden h-28 border border-border shadow-sm">
                              <img src={doc.previewUrl} alt="New" className="w-full h-full object-cover cursor-pointer" onClick={() => setActiveDocument({ url: doc.previewUrl, name: doc.file.name })} />
                              <button type="button" onClick={() => removeNewDocument(doc.id)} className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-all z-10"><X size={14} strokeWidth={3} /></button>
                              <span className="absolute bottom-1 left-1 bg-success/80 text-success-foreground text-[10px] px-1.5 py-0.5 rounded pointer-events-none">New</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-border">
                  <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-xl font-bold text-sm bg-muted hover:bg-muted/80 transition-colors">Cancel</button>
                  <button type="submit" disabled={isUpdating} className="px-8 py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 active:scale-95"><Save size={16} /> {isUpdating ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile Pic Viewer Modal */}
      <AnimatePresence>
        {showProfilePicModal && modalImageSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfilePicModal(false)}>
            <div className="relative max-w-3xl w-full flex justify-center">
              <button className="absolute -top-12 right-0 sm:-right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-colors z-50" onClick={() => setShowProfilePicModal(false)}><X size={24} /></button>
              <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} src={modalImageSrc} alt="Full Profile" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/10" onClick={(e) => e.stopPropagation()} />
            </div>
          </motion.div>
        )}

        {/* Document Viewer Modal */}
        {activeDocument && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm" onClick={() => setActiveDocument(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-5xl flex flex-col items-center gap-6" onClick={(e) => e.stopPropagation()}>
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3"><FileText className="text-white" size={24} /><h3 className="font-medium text-white text-lg">{activeDocument.name}</h3></div>
                <button onClick={() => setActiveDocument(null)} className="p-2 text-white/70 hover:text-white transition-colors"><X size={28} /></button>
              </div>
              <img src={activeDocument.url} alt={activeDocument.name} className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-sm" />
            </motion.div>
          </motion.div>
        )}

        {/* Certificate Grade Modal */}
        {certificateCourse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { setCertificateCourse(null); setCertificateGrade(""); }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-card p-6 rounded-2xl shadow-xl max-w-md w-full border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div><h3 className="text-xl font-bold">Certificate Grade</h3><p className="text-sm text-muted-foreground mt-1">{certificateCourse.name || certificateCourse.courseName || certificateCourse.title || "Course"}</p></div>
                <button type="button" onClick={() => { setCertificateCourse(null); setCertificateGrade(""); }} className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"><X size={18} /></button>
              </div>
              <label className="block text-sm font-semibold mb-2">Enter Grade</label>
              <input type="text" value={certificateGrade} onChange={(e) => setCertificateGrade(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePrintCertificate()} autoFocus placeholder="Example: AA" className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button type="button" onClick={() => { setCertificateCourse(null); setCertificateGrade(""); }} className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 font-semibold transition-colors">Cancel</button>
                <button type="button" onClick={handlePrintCertificate} className="px-5 py-2 rounded-xl bg-success hover:opacity-90 text-success-foreground font-semibold flex items-center gap-2 transition-all"><Printer size={16} /> Print</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteAction} itemName={profileData?.name} isLoading={isDeleting} />
    </div>
  );
};

export default ProfilePage;