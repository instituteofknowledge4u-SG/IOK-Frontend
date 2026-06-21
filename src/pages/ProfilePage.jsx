// import React, { useState, useEffect } from "react";
// import { useParams, useLocation, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   User,
//   Edit3,
//   Save,
//   X,
//   ZoomIn,
//   Shield,
//   Mail,
//   Phone,
//   MapPin,
//   Hash,
//   BookOpen,
//   GraduationCap,
//   Calendar,
//   Flag,
//   UserCheck,
//   Clock,
//   FileText,
//   Trash2,
// } from "lucide-react";
// import toast from "react-hot-toast";
// import useAuthStore from "../stores/useAuthStore";
// import useUserStore from "../stores/useUserStore";
// import useBatchStore from "../stores/useBatchStore";
// import BackButton from "../components/UI/Button";
// import DeleteConfirmModal from "../components/UI/DeleteConfirmModal";
// import { getStudentId } from "../util/getStudentId";
// import {
//   canTeacherAccessTeacherProfile,
//   canTeacherAccessStudent,
//   filterBatchesForTeacher,
// } from "../util/teacherAccessControl";

// const ProfilePage = () => {
//   const { username } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();

//   const targetUserId = location.state?.userId;
//   const targetUserData = location.state?.userData;

//   const loggedInUser = useAuthStore((state) => state.user);
//   const loggedInUserRole = useAuthStore((state) => state.userRole);
//   const loggedInUserId = useAuthStore((state) => state.id);
//   const updateUser = useUserStore((state) => state.updateUser);
//   const deleteUser = useUserStore((state) => state.deleteUser);
//   const isUpdating = useUserStore((state) => state.isLoading);
//   const getUserById = useUserStore((state) => state.getUserById);

//   const batches = useBatchStore((state) => state.batches);
//   const fetchBatches = useBatchStore((state) => state.fetchBatches);

//   const activeUserId = targetUserId || loggedInUser?._id;
//   const isSelf = activeUserId === loggedInUser?._id;
//   const isAdmin = loggedInUser?.role === "Admin";

//   // STRICT EDIT RULE: ONLY Admins can edit profiles
//   const canEdit = isAdmin;

//   const [profileData, setProfileData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [accessDenied, setAccessDenied] = useState(false);

//   const [activeDocument, setActiveDocument] = useState(null);
//   const [showProfilePicModal, setShowProfilePicModal] = useState(false);
//   const [modalImageSrc, setModalImageSrc] = useState(null);

//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   const [formData, setFormData] = useState({});
//   const [newProfilePic, setNewProfilePic] = useState(null);
//   const [newProfilePreview, setNewProfilePreview] = useState(null);
//   const [newDocuments, setNewDocuments] = useState([]);
//   const [existingDocuments, setExistingDocuments] = useState([]);

//   // --- ROLE LOGIC FIXED ---
//   // Moved to the top so handleUpdate doesn't throw a ReferenceError
//   const targetRole = profileData?.role || "Student";
//   const isTargetAdmin = targetRole === "Admin";
//   const isTargetTeacher = targetRole === "Teacher";
//   const isTargetStudent = profileData
//     ? !isTargetAdmin && !isTargetTeacher
//     : false;

//   useEffect(() => {
//     fetchBatches();
//   }, [fetchBatches]);

//   useEffect(() => {
//     if (!activeUserId) {
//       navigate("/");
//       return;
//     }

//     // Teacher access control
//     if (loggedInUserRole === "Teacher" && !isSelf) {
//       // Check if teacher is trying to access another user's profile
//       if (targetUserData?.role === "Teacher" || targetRole === "Teacher") {
//         // Teachers cannot view other teachers' profiles
//         setAccessDenied(true);
//         toast.error("You cannot view other teachers' profiles");
//         navigate("/access-denied");
//         return;
//       }

//       if (batches.length > 0) {
//         const teacherBatches = filterBatchesForTeacher(
//           batches,
//           loggedInUser?.batches || [],
//           loggedInUserRole,
//           loggedInUser?.email,
//         );
//         const canAccess = canTeacherAccessStudent(
//           activeUserId,
//           teacherBatches,
//           loggedInUserRole,
//         );
//         if (!canAccess) {
//           setAccessDenied(true);
//           toast.error("You can only view students from your assigned batches");
//           navigate("/access-denied");
//           return;
//         }
//       }
//     }

//     const fetchUserData = async () => {
//       setIsLoading(true);
//       try {
//         if (isSelf) {
//           setProfileData(loggedInUser);
//           setFormData(loggedInUser);
//         } else if (targetUserData) {
//           setProfileData(targetUserData);
//           setFormData(targetUserData);
//         } else {
//           const fetchedData = await getUserById(activeUserId);
//           setProfileData(fetchedData);
//           setFormData(fetchedData);
//         }
//       } catch (error) {
//         toast.error("Failed to load user profile");
//         navigate("/");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchUserData();
//   }, [
//     activeUserId,
//     targetUserData,
//     isSelf,
//     loggedInUser,
//     navigate,
//     getUserById,
//     batches,
//   ]);

//   const cleanupPreviews = () => {
//     if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
//     newDocuments.forEach((doc) => URL.revokeObjectURL(doc.previewUrl));
//   };

//   const startEditing = () => {
//     setIsEditing(true);
//     setExistingDocuments(profileData.documents || []);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "phone" || name === "adhar") {
//       const onlyNumbers = value.replace(/\D/g, "");
//       const maxLength = name === "phone" ? 10 : 12;
//       if (onlyNumbers.length <= maxLength) {
//         setFormData({ ...formData, [name]: onlyNumbers });
//       }
//       return;
//     }
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleProfilePicChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       if (file.type === "image/jpeg" || file.type === "image/png") {
//         if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
//         setNewProfilePic(file);
//         setNewProfilePreview(URL.createObjectURL(file));
//       } else {
//         toast.error("Only JPG and PNG images are allowed.");
//       }
//     }
//   };

//   const handleDocChange = (e) => {
//     const files = Array.from(e.target.files);
//     const validFiles = [];

//     files.forEach((file) => {
//       if (file.type === "image/jpeg" || file.type === "image/png") {
//         validFiles.push({
//           id: Math.random().toString(36).substring(7),
//           file: file,
//           previewUrl: URL.createObjectURL(file),
//         });
//       } else {
//         toast.error(`Skipped ${file.name}: Only JPG/PNG allowed.`);
//       }
//     });

//     setNewDocuments((prev) => [...prev, ...validFiles]);
//     e.target.value = null;
//   };

//   const removeNewDocument = (idToRemove) => {
//     setNewDocuments((prev) => {
//       const docToRemove = prev.find((d) => d.id === idToRemove);
//       if (docToRemove) URL.revokeObjectURL(docToRemove.previewUrl);
//       return prev.filter((d) => d.id !== idToRemove);
//     });
//   };

//   const removeExistingDocument = (urlToRemove) => {
//     setExistingDocuments((prev) => prev.filter((url) => url !== urlToRemove));
//   };

//   const cancelEdit = () => {
//     setIsEditing(false);
//     setFormData(profileData);
//     cleanupPreviews();
//     setNewProfilePic(null);
//     setNewProfilePreview(null);
//     setNewDocuments([]);
//     setExistingDocuments([]);
//   };

//   const validateForm = () => {
//     if (!formData.name || formData.name.trim().length < 3) {
//       toast.error("Please enter a valid full name (minimum 3 characters).");
//       return false;
//     }

//     if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
//       toast.error("Please enter a valid email address.");
//       return false;
//     }

//     if (formData.phone) {
//       const phoneDigits = formData.phone.replace(/\D/g, "");
//       if (phoneDigits.length !== 10) {
//         toast.error("Please enter a valid 10-digit phone number.");
//         return false;
//       }
//     } else {
//       toast.error("Phone number is required.");
//       return false;
//     }

//     return true;
//   };

//   const handleUpdate = async (e) => {
//     e.preventDefault();

//     if (!isAdmin) {
//       setIsEditing(false);
//       return toast.error("Access denied. Only Admins can edit profiles.");
//     }

//     if (!profileData._id) return toast.error("User ID is missing.");
//     if (!validateForm()) return;

//     const submitData = new FormData();
//     Object.keys(formData).forEach((key) => {
//       if (
//         typeof formData[key] === "string" ||
//         typeof formData[key] === "number"
//       ) {
//         submitData.append(key, formData[key]);
//       }
//     });

//     if (formData.fatherName) {
//       submitData.append("fathersName", formData.fatherName);
//       submitData.append("fathername", formData.fatherName);
//       submitData.append("father_name", formData.fatherName);
//       submitData.append("parentName", formData.fatherName);
//     }

//     if (newProfilePic) submitData.append("profilePic", newProfilePic);

//     if (isTargetStudent) {
//       newDocuments.forEach((doc) => submitData.append("documents", doc.file));
//       existingDocuments.forEach((url) =>
//         submitData.append("retainedDocuments", url),
//       );
//     }

//     try {
//       const serverResponse = await updateUser(profileData._id, submitData);
//       const freshUserData =
//         serverResponse?.data || serverResponse?.user || serverResponse;

//       setProfileData(freshUserData);

//       if (isSelf) useAuthStore.setState({ user: freshUserData });

//       toast.success("Profile updated successfully!");
//       cleanupPreviews();
//       setIsEditing(false);
//       setNewProfilePic(null);
//       setNewProfilePreview(null);
//       setNewDocuments([]);
//       setExistingDocuments([]);
//     } catch (error) {
//       const errorMessage =
//         error.response?.data?.message ||
//         error.message ||
//         "Failed to update profile";
//       toast.error(errorMessage);
//     }
//   };

//   const confirmDeleteAction = async () => {
//     if (!isAdmin || isSelf) return;

//     setIsDeleting(true);
//     try {
//       await deleteUser(profileData._id);
//       toast.success("User deleted successfully.");
//       setShowDeleteModal(false);
//       navigate(-1);
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to delete user");
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "-";
//     return new Date(dateString).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   const openProfilePicModal = (src) => {
//     if (src) {
//       setModalImageSrc(src);
//       setShowProfilePicModal(true);
//     }
//   };

//   if (isLoading || !profileData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background">
//         <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-md"></div>
//       </div>
//     );
//   }

//   const InfoRow = ({ icon: Icon, label, value }) => (
//     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0 ">
//       <div className="flex items-center gap-3 w-full sm:w-1/3">
//         <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
//           {Icon && <Icon size={16} className="sm:w-5 sm:h-5" />}
//         </div>
//         <p className="text-xs sm:text-sm font-medium text-muted-foreground capitalize tracking-wider">
//           {label}
//         </p>
//       </div>
//       <div className="sm:w-2/3 pl-11 sm:pl-0">
//         <p className="text-sm sm:text-base font-semibold text-foreground">
//           {value || "Not Provided"}
//         </p>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 bg-background text-foreground font-sans transition-colors duration-300">
//       <div className="max-w-4xl mx-auto relative z-10">
//         <div className="flex justify-between items-center mb-6 sm:mb-8">
//           <BackButton />

//           <div className="flex items-center gap-2 sm:gap-3">
//             {isAdmin && !isSelf && !isEditing && (
//               <button
//                 onClick={() => setShowDeleteModal(true)}
//                 className="group flex items-center gap-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all border border-destructive/20 hover:border-destructive shadow-sm active:scale-95"
//               >
//                 <Trash2
//                   size={16}
//                   className="sm:w-[18px] sm:h-[18px] transition-transform"
//                 />
//                 <span className="hidden sm:inline">Delete User</span>
//               </button>
//             )}

//             {canEdit && !isEditing && (
//               <button
//                 onClick={startEditing}
//                 className="group flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
//               >
//                 <Edit3
//                   size={16}
//                   className="sm:w-[18px] sm:h-[18px] group-hover:rotate-12 transition-transform"
//                 />
//                 Edit Profile
//               </button>
//             )}
//           </div>
//         </div>

//         <AnimatePresence mode="wait">
//           {!isEditing ? (
//             /* ================= VIEW MODE ================= */
//             <motion.div
//               key="view-mode"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-4 sm:space-y-6"
//             >
//               <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row gap-5 sm:gap-8 items-center shadow-sm relative overflow-hidden">
//                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

//                 <div className="relative shrink-0 z-10">
//                   <div
//                     onClick={() => openProfilePicModal(profileData.profilePic)}
//                     className={`w-28 h-28 sm:w-36 sm:h-36 border-[3px] sm:border-4 border-card shadow-xl bg-muted rounded-full overflow-hidden relative group ${profileData.profilePic ? "cursor-pointer" : ""}`}
//                   >
//                     {profileData.profilePic ? (
//                       <>
//                         <img
//                           src={profileData.profilePic}
//                           alt="Profile"
//                           className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
//                         />
//                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//                           <ZoomIn
//                             className="text-white drop-shadow-md"
//                             size={28}
//                           />
//                         </div>
//                       </>
//                     ) : (
//                       <User
//                         size={48}
//                         className="text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
//                       />
//                     )}
//                   </div>
//                   <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-success border-4 border-card rounded-full z-20"></div>
//                 </div>

//                 <div className="flex-1 text-center sm:text-left z-10 w-full">
//                   <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize tracking-tight">
//                     {profileData.name}
//                   </h2>

//                   <div className="mt-2 sm:mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
//                     {isTargetAdmin && (
//                       <span className="flex items-center gap-1.5 text-xs sm:text-sm text-primary font-bold bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg shadow-sm">
//                         <Shield size={14} /> System Administrator
//                       </span>
//                     )}
//                     {isTargetTeacher && (
//                       <span className="flex items-center gap-1.5 text-xs sm:text-sm text-success font-bold bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg shadow-sm">
//                         <BookOpen size={14} /> Faculty / Teacher
//                       </span>
//                     )}
//                     {isTargetStudent && (
//                       <span className="flex items-center gap-1.5 text-xs sm:text-sm text-accent-foreground font-bold bg-accent border border-border px-3 py-1.5 rounded-lg shadow-sm">
//                         <GraduationCap size={14} /> Student
//                       </span>
//                     )}
//                     {isTargetStudent && (
//                       <span className="flex items-center gap-1.5 text-xs sm:text-sm text-accent-foreground font-bold bg-accent border border-border px-3 py-1.5 rounded-lg shadow-sm">
//                         {getStudentId(profileData)}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//                 <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
//                   <div className="bg-muted/30 p-3 sm:p-4 border-b border-border flex items-center gap-2">
//                     <UserCheck className="text-primary" size={18} />
//                     <h3 className="font-bold text-foreground text-sm sm:text-base">
//                       Contact Details
//                     </h3>
//                   </div>
//                   <div className="divide-y divide-border/50">
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
//                     {isTargetStudent && profileData.dob && (
//                       <InfoRow
//                         icon={User}
//                         label="Father's Name"
//                         value={
//                           profileData.fatherName ||
//                           profileData.fathersName ||
//                           profileData.fathername ||
//                           profileData.father_name ||
//                           profileData.parentName ||
//                           "-"
//                         }
//                       />
//                     )}
//                     {isTargetStudent && profileData.dob && (
//                       <InfoRow
//                         icon={Calendar}
//                         label="Date of Birth"
//                         value={formatDate(profileData.dob)}
//                       />
//                     )}
//                     {isTargetStudent && profileData.gender && (
//                       <InfoRow
//                         icon={User}
//                         label="Gender"
//                         value={profileData.gender}
//                       />
//                     )}
//                     {isTargetStudent && profileData.nationality && (
//                       <InfoRow
//                         icon={Flag}
//                         label="Nationality"
//                         value={profileData.nationality}
//                       />
//                     )}
//                     {isTargetStudent && profileData.address && (
//                       <InfoRow
//                         icon={MapPin}
//                         label="Address"
//                         value={profileData.address}
//                       />
//                     )}
//                     <InfoRow
//                       icon={Calendar}
//                       label={
//                         isTargetStudent ? "Admission Date" : "Account Created"
//                       }
//                       value={formatDate(profileData.createdAt)}
//                     />
//                   </div>
//                 </div>

//                 <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit flex flex-col">
//                   <div className="bg-muted/30 p-3 sm:p-4 border-b border-border flex items-center gap-2">
//                     <Shield className="text-primary" size={18} />
//                     <h3 className="font-bold text-foreground text-sm sm:text-base">
//                       Academic & Status
//                     </h3>
//                   </div>
//                   <div className="divide-y divide-border/50 flex-1">
//                     {isTargetStudent && (
//                       <>
//                         <InfoRow
//                           icon={Hash}
//                           label="Aadhar Number"
//                           value={
//                             isAdmin
//                               ? profileData.adhar
//                               : profileData.adhar
//                                 ? `XXXX-XXXX-${profileData.adhar.replace(/\D/g, "").slice(-4)}`
//                                 : "-"
//                           }
//                         />
//                         {profileData.stream && (
//                           <InfoRow
//                             icon={BookOpen}
//                             label="Stream"
//                             value={profileData.stream}
//                           />
//                         )}
//                         {profileData.grade && (
//                           <InfoRow
//                             icon={GraduationCap}
//                             label="Grade"
//                             value={profileData.grade}
//                           />
//                         )}
//                         {profileData.marksObtained !== undefined && (
//                           <InfoRow
//                             icon={FileText}
//                             label="Marks Obtained"
//                             value={`${profileData.marksObtained}`}
//                           />
//                         )}
//                         <InfoRow
//                           icon={BookOpen}
//                           label="Main Classes"
//                           value={
//                             profileData.mainClasses
//                               ?.map((c) => c.name)
//                               .join(", ") || "-"
//                           }
//                         />
//                         <InfoRow
//                           icon={Clock}
//                           label="Assigned Batches"
//                           value={
//                             profileData.batches
//                               ?.map((b) => `${b.name} (${b.weekday})`)
//                               .join(", ") || "-"
//                           }
//                         />
//                       </>
//                     )}
//                     {!isTargetStudent && (
//                       <InfoRow
//                         icon={Shield}
//                         label="System Role"
//                         value={profileData.role}
//                       />
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {isTargetStudent && (
//                 <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
//                   <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 text-foreground flex items-center gap-2">
//                     <BookOpen className="text-primary" size={18} /> Student
//                     Documents
//                   </h3>
//                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
//                     {profileData.documents?.length > 0 ? (
//                       profileData.documents.map((docUrl, idx) => {
//                         return (
//                           <div
//                             key={idx}
//                             onClick={() =>
//                               setActiveDocument({
//                                 url: docUrl,
//                                 name: `Document ${idx + 1}`,
//                               })
//                             }
//                             className="cursor-pointer bg-muted border border-border rounded-xl overflow-hidden h-28 sm:h-36 group relative shadow-sm"
//                           >
//                             <img
//                               src={docUrl}
//                               alt={`Doc ${idx + 1}`}
//                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                             />
//                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
//                               <ZoomIn className="text-white" size={20} />
//                               <span className="text-white text-[10px] sm:text-xs font-semibold px-2 text-center">
//                                 View
//                               </span>
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="col-span-full py-10 text-center text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2 sm:gap-3">
//                         <FileText
//                           size={28}
//                           className="text-muted-foreground/60"
//                         />
//                         <p className="text-sm">No documents available.</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </motion.div>
//           ) : (
//             /* ================= EDIT MODE ================= */
//             <motion.div
//               key="edit-mode"
//               initial={{ opacity: 0, scale: 0.98 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.98 }}
//               transition={{ duration: 0.2 }}
//             >
//               <form
//                 onSubmit={handleUpdate}
//                 className="bg-card p-4 sm:p-8 rounded-2xl shadow-xl border border-border"
//               >
//                 <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 pb-4 border-b border-border">
//                   <Edit3 className="text-primary" size={20} />
//                   <h2 className="text-lg sm:text-2xl font-bold text-foreground">
//                     Edit Profile Details
//                   </h2>
//                 </div>

//                 <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 bg-muted/30 p-4 sm:p-6 rounded-xl border border-border/50">
//                   <div className="relative shrink-0 mx-auto sm:mx-0">
//                     <div
//                       onClick={() =>
//                         openProfilePicModal(
//                           newProfilePreview || profileData.profilePic,
//                         )
//                       }
//                       className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-md border-4 border-card bg-muted overflow-hidden relative group ${newProfilePreview || profileData.profilePic ? "cursor-pointer" : ""}`}
//                     >
//                       {newProfilePreview || profileData.profilePic ? (
//                         <>
//                           <img
//                             src={newProfilePreview || profileData.profilePic}
//                             alt="Preview"
//                             className="w-full h-full object-cover"
//                           />
//                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                             <ZoomIn size={20} className="text-white" />
//                           </div>
//                         </>
//                       ) : (
//                         <User
//                           size={32}
//                           className="text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
//                         />
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex-1 text-center sm:text-left">
//                     <label className="text-xs sm:text-sm font-bold block mb-2 text-foreground">
//                       Update Profile Photo
//                     </label>
//                     <input
//                       type="file"
//                       accept="image/png, image/jpeg, image/jpg"
//                       onChange={handleProfilePicChange}
//                       className="block w-full text-xs sm:text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 sm:file:px-6 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
//                   <div className="space-y-1 sm:space-y-2">
//                     <label className="text-xs sm:text-sm font-bold text-foreground">
//                       Full Name <span className="text-destructive">*</span>
//                     </label>
//                     <div className="relative">
//                       <User
//                         className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                         size={16}
//                       />
//                       <input
//                         type="text"
//                         name="name"
//                         value={formData.name || ""}
//                         onChange={handleInputChange}
//                         required
//                         className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-1 sm:space-y-2">
//                     <label className="text-xs sm:text-sm font-bold text-foreground">
//                       Email Address <span className="text-destructive">*</span>
//                     </label>
//                     <div className="relative">
//                       <Mail
//                         className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                         size={16}
//                       />
//                       <input
//                         type="email"
//                         name="email"
//                         value={formData.email || ""}
//                         onChange={handleInputChange}
//                         required
//                         className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-1 sm:space-y-2">
//                     <label className="text-xs sm:text-sm font-bold text-foreground">
//                       Phone Number <span className="text-destructive">*</span>
//                     </label>
//                     <div className="relative">
//                       <Phone
//                         className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                         size={16}
//                       />
//                       <input
//                         type="text"
//                         name="phone"
//                         value={formData.phone || ""}
//                         onChange={handleInputChange}
//                         required
//                         placeholder="10-digit number"
//                         className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                       />
//                     </div>
//                   </div>

//                   {isTargetStudent && (
//                     <>
//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Father's Name
//                         </label>
//                         <div className="relative">
//                           <User
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="text"
//                             name="fatherName"
//                             value={
//                               formData.fatherName ||
//                               formData.fathersName ||
//                               formData.fathername ||
//                               formData.father_name ||
//                               formData.parentName ||
//                               ""
//                             }
//                             onChange={handleInputChange}
//                             placeholder="Father's Name"
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Date of Birth
//                         </label>
//                         <div className="relative">
//                           <Calendar
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="date"
//                             name="dob"
//                             value={
//                               formData.dob ? formData.dob.split("T")[0] : ""
//                             }
//                             onChange={handleInputChange}
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Gender
//                         </label>
//                         <div className="relative">
//                           <User
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <select
//                             name="gender"
//                             value={formData.gender || ""}
//                             onChange={handleInputChange}
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow appearance-none"
//                           >
//                             <option value="">Select Gender</option>
//                             <option value="Male">Male</option>
//                             <option value="Female">Female</option>
//                             <option value="Other">Other</option>
//                           </select>
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Nationality
//                         </label>
//                         <div className="relative">
//                           <Flag
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="text"
//                             name="nationality"
//                             value={formData.nationality || ""}
//                             onChange={handleInputChange}
//                             placeholder="e.g., Indian"
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Address
//                         </label>
//                         <div className="relative">
//                           <MapPin
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="text"
//                             name="address"
//                             value={formData.address || ""}
//                             onChange={handleInputChange}
//                             placeholder="Full Address"
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Stream
//                         </label>
//                         <div className="relative">
//                           <BookOpen
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="text"
//                             name="stream"
//                             value={formData.stream || ""}
//                             onChange={handleInputChange}
//                             placeholder="e.g., Science, Arts"
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Grade
//                         </label>
//                         <div className="relative">
//                           <GraduationCap
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="text"
//                             name="grade"
//                             value={formData.grade || ""}
//                             onChange={handleInputChange}
//                             placeholder="e.g., 10th, 12th"
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Marks Obtained
//                         </label>
//                         <div className="relative">
//                           <FileText
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="number"
//                             name="marksObtained"
//                             value={formData.marksObtained || ""}
//                             onChange={handleInputChange}
//                             placeholder="e.g., 450"
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>

//                       <div className="space-y-1 sm:space-y-2">
//                         <label className="text-xs sm:text-sm font-bold text-foreground">
//                           Aadhar Number
//                         </label>
//                         <div className="relative">
//                           <Hash
//                             className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                             size={16}
//                           />
//                           <input
//                             type="text"
//                             name="adhar"
//                             value={formData.adhar || ""}
//                             onChange={handleInputChange}
//                             placeholder="12-digit number"
//                             className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
//                           />
//                         </div>
//                       </div>
//                     </>
//                   )}

//                   {isTargetStudent && (
//                     <div className="col-span-1 md:col-span-2 mt-2">
//                       <div className="p-4 sm:p-6 border-2 border-dashed border-border rounded-xl bg-muted/30">
//                         <label className="text-xs sm:text-sm font-bold block mb-2 sm:mb-3 text-foreground">
//                           Update Documents (JPG/PNG)
//                         </label>

//                         <input
//                           type="file"
//                           multiple
//                           accept="image/png, image/jpeg, image/jpg"
//                           onChange={handleDocChange}
//                           className="block w-full text-xs sm:text-sm text-muted-foreground file:mr-3 file:py-2 sm:file:py-2.5 file:px-4 sm:file:px-6 file:rounded-xl file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-colors mb-4"
//                         />

//                         {(existingDocuments.length > 0 ||
//                           newDocuments.length > 0) && (
//                           <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
//                             {existingDocuments.map((docUrl, idx) => (
//                               <div
//                                 key={`existing-${idx}`}
//                                 className="relative group rounded-xl overflow-hidden h-24 sm:h-28 border border-border shadow-sm"
//                               >
//                                 <img
//                                   src={docUrl}
//                                   alt={`Saved Doc ${idx + 1}`}
//                                   className="w-full h-full object-cover cursor-pointer"
//                                   onClick={() =>
//                                     setActiveDocument({
//                                       url: docUrl,
//                                       name: `Saved Document ${idx + 1}`,
//                                     })
//                                   }
//                                 />
//                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
//                                   <ZoomIn
//                                     size={20}
//                                     className="text-white drop-shadow-md"
//                                   />
//                                 </div>
//                                 <button
//                                   type="button"
//                                   onClick={() => removeExistingDocument(docUrl)}
//                                   className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-90 hover:scale-110 transition-all z-10"
//                                   title="Remove Saved File"
//                                 >
//                                   <X size={14} strokeWidth={3} />
//                                 </button>
//                                 <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded">
//                                   Saved
//                                 </span>
//                               </div>
//                             ))}

//                             {newDocuments.map((doc) => (
//                               <div
//                                 key={doc.id}
//                                 className="relative group rounded-xl overflow-hidden h-24 sm:h-28 border border-border shadow-sm"
//                               >
//                                 <img
//                                   src={doc.previewUrl}
//                                   alt="New Doc Preview"
//                                   className="w-full h-full object-cover cursor-pointer"
//                                   onClick={() =>
//                                     setActiveDocument({
//                                       url: doc.previewUrl,
//                                       name: doc.file.name,
//                                     })
//                                   }
//                                 />
//                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
//                                   <ZoomIn
//                                     size={20}
//                                     className="text-white drop-shadow-md"
//                                   />
//                                 </div>
//                                 <button
//                                   type="button"
//                                   onClick={() => removeNewDocument(doc.id)}
//                                   className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-90 hover:scale-110 transition-all z-10"
//                                   title="Remove New File"
//                                 >
//                                   <X size={14} strokeWidth={3} />
//                                 </button>
//                                 <span className="absolute bottom-1 left-1 bg-success/80 text-success-foreground text-[10px] px-1.5 py-0.5 rounded">
//                                   New
//                                 </span>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-10 pt-5 sm:pt-6 border-t border-border">
//                   <button
//                     type="button"
//                     onClick={cancelEdit}
//                     className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base text-foreground bg-muted hover:bg-muted/80 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={isUpdating}
//                     className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
//                   >
//                     <Save size={16} className="sm:w-[18px] sm:h-[18px]" />{" "}
//                     {isUpdating ? "Saving..." : "Save Changes"}
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       <AnimatePresence>
//         {showProfilePicModal && modalImageSrc && (
//           <motion.div
//             key="profile-pic-modal"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//             onClick={() => setShowProfilePicModal(false)}
//           >
//             <div className="relative max-w-3xl w-full flex justify-center">
//               <button
//                 className="absolute -top-12 right-0 sm:-right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-colors z-50"
//                 onClick={() => setShowProfilePicModal(false)}
//               >
//                 <X size={20} className="sm:w-6 sm:h-6" />
//               </button>
//               <motion.img
//                 initial={{ scale: 0.9 }}
//                 animate={{ scale: 1 }}
//                 exit={{ scale: 0.9 }}
//                 src={modalImageSrc}
//                 alt="Full Profile"
//                 className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/10"
//                 onClick={(e) => e.stopPropagation()}
//               />
//             </div>
//           </motion.div>
//         )}

//         {/* ADDED KEY HERE */}
//         {activeDocument && (
//           <motion.div
//             key="document-modal"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
//             onClick={() => setActiveDocument(null)}
//           >
//             <motion.div
//               initial={{ scale: 0.95, opacity: 0, y: 20 }}
//               animate={{ scale: 1, opacity: 1, y: 0 }}
//               exit={{ scale: 0.95, opacity: 0, y: 20 }}
//               transition={{ type: "spring", stiffness: 300, damping: 25 }}
//               className="w-full max-w-5xl flex flex-col items-center gap-4 sm:gap-6"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="w-full flex items-center justify-between drop-shadow-lg px-2 sm:px-0">
//                 <div className="flex items-center gap-3">
//                   <FileText
//                     className="text-white"
//                     size={24}
//                     strokeWidth={1.5}
//                   />
//                   <h3 className="font-medium text-white truncate max-w-[200px] sm:max-w-2xl text-lg sm:text-xl tracking-wide drop-shadow-md">
//                     {activeDocument.name}
//                   </h3>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => setActiveDocument(null)}
//                     className="p-2 text-white/70 hover:text-white transition-colors duration-200"
//                     title="Close"
//                   >
//                     <X size={28} strokeWidth={1.5} />
//                   </button>
//                 </div>
//               </div>

//               <div className="w-full flex justify-center items-center">
//                 <img
//                   src={activeDocument.url}
//                   alt={activeDocument.name}
//                   className="max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain drop-shadow-2xl rounded-sm"
//                 />
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <DeleteConfirmModal
//         isOpen={showDeleteModal}
//         onClose={() => setShowDeleteModal(false)}
//         onConfirm={confirmDeleteAction}
//         itemName={profileData?.name}
//         isLoading={isDeleting}
//       />
//     </div>
//   );
// };

// export default ProfilePage;

import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../stores/useAuthStore";
import useUserStore from "../stores/useUserStore";
import useBatchStore from "../stores/useBatchStore";
import BackButton from "../components/UI/Button";
import DeleteConfirmModal from "../components/UI/DeleteConfirmModal";
import { getStudentId } from "../util/getStudentId";
import {
  canTeacherAccessTeacherProfile,
  canTeacherAccessStudent,
  filterBatchesForTeacher,
} from "../util/teacherAccessControl";

const ProfilePage = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const targetUserId = location.state?.userId;
  const targetUserData = location.state?.userData;

  const loggedInUser = useAuthStore((state) => state.user);
  const loggedInUserRole = useAuthStore((state) => state.userRole);
  const loggedInUserId = useAuthStore((state) => state.id);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const isUpdating = useUserStore((state) => state.isLoading);
  const getUserById = useUserStore((state) => state.getUserById);

  const batches = useBatchStore((state) => state.batches);
  const fetchBatches = useBatchStore((state) => state.fetchBatches);

  const activeUserId = targetUserId || loggedInUser?._id;
  const isSelf = activeUserId === loggedInUser?._id;
  const isAdmin = loggedInUser?.role === "Admin";

  // STRICT EDIT RULE: ONLY Admins can edit profiles
  const canEdit = isAdmin;

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Toggle State for Documents
  const [showDocuments, setShowDocuments] = useState(true);

  const [activeDocument, setActiveDocument] = useState(null);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({});
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);
  const [newDocuments, setNewDocuments] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);

  // --- ROLE LOGIC FIXED ---
  // Moved to the top so handleUpdate doesn't throw a ReferenceError
  const targetRole = profileData?.role || "Student";
  const isTargetAdmin = targetRole === "Admin";
  const isTargetTeacher = targetRole === "Teacher";
  const isTargetStudent = profileData
    ? !isTargetAdmin && !isTargetTeacher
    : false;

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    if (!activeUserId) {
      navigate("/");
      return;
    }

    // Teacher access control
    if (loggedInUserRole === "Teacher" && !isSelf) {
      // Check if teacher is trying to access another user's profile
      if (targetUserData?.role === "Teacher" || targetRole === "Teacher") {
        // Teachers cannot view other teachers' profiles
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
        const canAccess = canTeacherAccessStudent(
          activeUserId,
          teacherBatches,
          loggedInUserRole,
        );
        if (!canAccess) {
          setAccessDenied(true);
          toast.error("You can only view students from your assigned batches");
          navigate("/access-denied");
          return;
        }
      }
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        if (isSelf) {
          setProfileData(loggedInUser);
          setFormData(loggedInUser);
        } else if (targetUserData) {
          setProfileData(targetUserData);
          setFormData(targetUserData);
        } else {
          const fetchedData = await getUserById(activeUserId);
          setProfileData(fetchedData);
          setFormData(fetchedData);
        }
      } catch (error) {
        toast.error("Failed to load user profile");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [
    activeUserId,
    targetUserData,
    isSelf,
    loggedInUser,
    navigate,
    getUserById,
    batches,
  ]);

  const cleanupPreviews = () => {
    if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
    newDocuments.forEach((doc) => URL.revokeObjectURL(doc.previewUrl));
  };

  const startEditing = () => {
    setIsEditing(true);
    setExistingDocuments(profileData.documents || []);
  };

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
      if (file.type === "image/jpeg" || file.type === "image/png") {
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
      if (file.type === "image/jpeg" || file.type === "image/png") {
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

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData(profileData);
    cleanupPreviews();
    setNewProfilePic(null);
    setNewProfilePreview(null);
    setNewDocuments([]);
    setExistingDocuments([]);
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      toast.error("Please enter a valid full name (minimum 3 characters).");
      return false;
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (formData.phone) {
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        toast.error("Please enter a valid 10-digit phone number.");
        return false;
      }
    } else {
      toast.error("Phone number is required.");
      return false;
    }

    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setIsEditing(false);
      return toast.error("Access denied. Only Admins can edit profiles.");
    }

    if (!profileData._id) return toast.error("User ID is missing.");
    if (!validateForm()) return;

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (
        typeof formData[key] === "string" ||
        typeof formData[key] === "number"
      ) {
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
      existingDocuments.forEach((url) =>
        submitData.append("retainedDocuments", url),
      );
    }

    try {
      const serverResponse = await updateUser(profileData._id, submitData);
      const freshUserData =
        serverResponse?.data || serverResponse?.user || serverResponse;

      setProfileData(freshUserData);

      if (isSelf) useAuthStore.setState({ user: freshUserData });

      toast.success("Profile updated successfully!");
      cleanupPreviews();
      setIsEditing(false);
      setNewProfilePic(null);
      setNewProfilePreview(null);
      setNewDocuments([]);
      setExistingDocuments([]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile";
      toast.error(errorMessage);
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const openProfilePicModal = (src) => {
    if (src) {
      setModalImageSrc(src);
      setShowProfilePicModal(true);
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-md"></div>
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0 ">
      <div className="flex items-center gap-3 w-full sm:w-1/3">
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary">
          {Icon && <Icon size={16} className="sm:w-5 sm:h-5" />}
        </div>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground capitalize tracking-wider">
          {label}
        </p>
      </div>
      <div className="sm:w-2/3 pl-11 sm:pl-0">
        <p className="text-sm sm:text-base font-semibold text-foreground">
          {value || "Not Provided"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 bg-background text-foreground font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <BackButton />

          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && !isSelf && !isEditing && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="group flex items-center gap-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all border border-destructive/20 hover:border-destructive shadow-sm active:scale-95"
              >
                <Trash2
                  size={16}
                  className="sm:w-[18px] sm:h-[18px] transition-transform"
                />
                <span className="hidden sm:inline">Delete User</span>
              </button>
            )}

            {canEdit && !isEditing && (
              <button
                onClick={startEditing}
                className="group flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Edit3
                  size={16}
                  className="sm:w-[18px] sm:h-[18px] group-hover:rotate-12 transition-transform"
                />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!isEditing ? (
            /* ================= VIEW MODE ================= */
            <motion.div
              key="view-mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="bg-card border border-border rounded-2xl p-5 sm:p-8 flex flex-col sm:flex-row gap-5 sm:gap-8 items-center shadow-sm relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="relative shrink-0 z-10">
                  <div
                    onClick={() => openProfilePicModal(profileData.profilePic)}
                    className={`w-28 h-28 sm:w-36 sm:h-36 border-[3px] sm:border-4 border-card shadow-xl bg-muted rounded-full overflow-hidden relative group ${profileData.profilePic ? "cursor-pointer" : ""}`}
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
                  <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-success border-4 border-card rounded-full z-20"></div>
                </div>

                <div className="flex-1 text-center sm:text-left z-10 w-full">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize tracking-tight">
                    {profileData.name}
                  </h2>

                  <div className="mt-2 sm:mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                    {isTargetAdmin && (
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm text-primary font-bold bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg shadow-sm">
                        <Shield size={14} /> System Administrator
                      </span>
                    )}
                    {isTargetTeacher && (
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm text-success font-bold bg-success/10 border border-success/20 px-3 py-1.5 rounded-lg shadow-sm">
                        <BookOpen size={14} /> Faculty / Teacher
                      </span>
                    )}
                    {isTargetStudent && (
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm text-accent-foreground font-bold bg-accent border border-border px-3 py-1.5 rounded-lg shadow-sm">
                        <GraduationCap size={14} /> Student
                      </span>
                    )}
                    {isTargetStudent && (
                      <span className="flex items-center gap-1.5 text-xs sm:text-sm text-accent-foreground font-bold bg-accent border border-border px-3 py-1.5 rounded-lg shadow-sm">
                        {getStudentId(profileData)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
                  <div className="bg-muted/30 p-3 sm:p-4 border-b border-border flex items-center gap-2">
                    <UserCheck className="text-primary" size={18} />
                    <h3 className="font-bold text-foreground text-sm sm:text-base">
                      Contact Details
                    </h3>
                  </div>
                  <div className="divide-y divide-border/50">
                    <InfoRow
                      icon={Mail}
                      label="Email Address"
                      value={profileData.email}
                    />
                    <InfoRow
                      icon={Phone}
                      label="Phone Number"
                      value={profileData.phone}
                    />
                    {isTargetStudent && profileData.dob && (
                      <InfoRow
                        icon={User}
                        label="Father's Name"
                        value={
                          profileData.fatherName ||
                          profileData.fathersName ||
                          profileData.fathername ||
                          profileData.father_name ||
                          profileData.parentName ||
                          "-"
                        }
                      />
                    )}
                    {isTargetStudent && profileData.dob && (
                      <InfoRow
                        icon={Calendar}
                        label="Date of Birth"
                        value={formatDate(profileData.dob)}
                      />
                    )}
                    {isTargetStudent && profileData.gender && (
                      <InfoRow
                        icon={User}
                        label="Gender"
                        value={profileData.gender}
                      />
                    )}
                    {isTargetStudent && profileData.nationality && (
                      <InfoRow
                        icon={Flag}
                        label="Nationality"
                        value={profileData.nationality}
                      />
                    )}
                    {isTargetStudent && profileData.address && (
                      <InfoRow
                        icon={MapPin}
                        label="Address"
                        value={profileData.address}
                      />
                    )}
                    <InfoRow
                      icon={Calendar}
                      label={
                        isTargetStudent ? "Admission Date" : "Account Created"
                      }
                      value={formatDate(profileData.createdAt)}
                    />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit flex flex-col">
                  <div className="bg-muted/30 p-3 sm:p-4 border-b border-border flex items-center gap-2">
                    <Shield className="text-primary" size={18} />
                    <h3 className="font-bold text-foreground text-sm sm:text-base">
                      Academic & Status
                    </h3>
                  </div>
                  <div className="divide-y divide-border/50 flex-1">
                    {isTargetStudent && (
                      <>
                        <InfoRow
                          icon={Hash}
                          label="Aadhar Number"
                          value={
                            isAdmin
                              ? profileData.adhar
                              : profileData.adhar
                                ? `XXXX-XXXX-${profileData.adhar.replace(/\D/g, "").slice(-4)}`
                                : "-"
                          }
                        />
                        {profileData.stream && (
                          <InfoRow
                            icon={BookOpen}
                            label="Stream"
                            value={profileData.stream}
                          />
                        )}
                        {profileData.grade && (
                          <InfoRow
                            icon={GraduationCap}
                            label="Grade"
                            value={profileData.grade}
                          />
                        )}
                        {profileData.marksObtained !== undefined && (
                          <InfoRow
                            icon={FileText}
                            label="Marks Obtained"
                            value={`${profileData.marksObtained}`}
                          />
                        )}
                        <InfoRow
                          icon={BookOpen}
                          label="Main Classes"
                          value={
                            profileData.mainClasses
                              ?.map((c) => c.name)
                              .join(", ") || "-"
                          }
                        />
                        <InfoRow
                          icon={Clock}
                          label="Assigned Batches"
                          value={
                            profileData.batches
                              ?.map((b) => `${b.name} (${b.weekday})`)
                              .join(", ") || "-"
                          }
                        />
                      </>
                    )}
                    {!isTargetStudent && (
                      <InfoRow
                        icon={Shield}
                        label="System Role"
                        value={profileData.role}
                      />
                    )}
                  </div>
                </div>
              </div>

              {isTargetStudent && (
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="text-primary" size={18} /> Student
                      Documents
                    </h3>
                    <button
                      onClick={() => setShowDocuments(!showDocuments)}
                      className="text-xs sm:text-sm font-medium bg-muted/50 hover:bg-muted px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-foreground transition-colors flex items-center gap-1.5"
                    >
                      {showDocuments ? "Hide" : "Show"}
                      {showDocuments ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {showDocuments && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 pt-2">
                          {profileData.documents?.length > 0 ? (
                            profileData.documents.map((docUrl, idx) => {
                              return (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    setActiveDocument({
                                      url: docUrl,
                                      name: `Document ${idx + 1}`,
                                    })
                                  }
                                  className="cursor-pointer bg-muted border border-border rounded-xl overflow-hidden h-28 sm:h-36 group relative shadow-sm"
                                >
                                  <img
                                    src={docUrl}
                                    alt={`Doc ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <ZoomIn className="text-white" size={20} />
                                    <span className="text-white text-[10px] sm:text-xs font-semibold px-2 text-center">
                                      View
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-span-full py-10 text-center text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2 sm:gap-3">
                              <FileText
                                size={28}
                                className="text-muted-foreground/60"
                              />
                              <p className="text-sm">No documents available.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          ) : (
            /* ================= EDIT MODE ================= */
            <motion.div
              key="edit-mode"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <form
                onSubmit={handleUpdate}
                className="bg-card p-4 sm:p-8 rounded-2xl shadow-xl border border-border"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 pb-4 border-b border-border">
                  <Edit3 className="text-primary" size={20} />
                  <h2 className="text-lg sm:text-2xl font-bold text-foreground">
                    Edit Profile Details
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 bg-muted/30 p-4 sm:p-6 rounded-xl border border-border/50">
                  <div className="relative shrink-0 mx-auto sm:mx-0">
                    <div
                      onClick={() =>
                        openProfilePicModal(
                          newProfilePreview || profileData.profilePic,
                        )
                      }
                      className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-md border-4 border-card bg-muted overflow-hidden relative group ${newProfilePreview || profileData.profilePic ? "cursor-pointer" : ""}`}
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
                  <div className="flex-1 text-center sm:text-left">
                    <label className="text-xs sm:text-sm font-bold block mb-2 text-foreground">
                      Update Profile Photo
                    </label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleProfilePicChange}
                      className="block w-full text-xs sm:text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 sm:file:px-6 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-foreground">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-foreground">
                      Email Address <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-bold text-foreground">
                      Phone Number <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                      />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                        required
                        placeholder="10-digit number"
                        className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                      />
                    </div>
                  </div>

                  {isTargetStudent && (
                    <>
                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Father's Name
                        </label>
                        <div className="relative">
                          <User
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="text"
                            name="fatherName"
                            value={
                              formData.fatherName ||
                              formData.fathersName ||
                              formData.fathername ||
                              formData.father_name ||
                              formData.parentName ||
                              ""
                            }
                            onChange={handleInputChange}
                            placeholder="Father's Name"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Date of Birth
                        </label>
                        <div className="relative">
                          <Calendar
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="date"
                            name="dob"
                            value={
                              formData.dob ? formData.dob.split("T")[0] : ""
                            }
                            onChange={handleInputChange}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Gender
                        </label>
                        <div className="relative">
                          <User
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <select
                            name="gender"
                            value={formData.gender || ""}
                            onChange={handleInputChange}
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow appearance-none"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Nationality
                        </label>
                        <div className="relative">
                          <Flag
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="text"
                            name="nationality"
                            value={formData.nationality || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., Indian"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Address
                        </label>
                        <div className="relative">
                          <MapPin
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="text"
                            name="address"
                            value={formData.address || ""}
                            onChange={handleInputChange}
                            placeholder="Full Address"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Stream
                        </label>
                        <div className="relative">
                          <BookOpen
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="text"
                            name="stream"
                            value={formData.stream || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., Science, Arts"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Grade
                        </label>
                        <div className="relative">
                          <GraduationCap
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="text"
                            name="grade"
                            value={formData.grade || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., 10th, 12th"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Marks Obtained
                        </label>
                        <div className="relative">
                          <FileText
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="number"
                            name="marksObtained"
                            value={formData.marksObtained || ""}
                            onChange={handleInputChange}
                            placeholder="e.g., 450"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-bold text-foreground">
                          Aadhar Number
                        </label>
                        <div className="relative">
                          <Hash
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                          />
                          <input
                            type="text"
                            name="adhar"
                            value={formData.adhar || ""}
                            onChange={handleInputChange}
                            placeholder="12-digit number"
                            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {isTargetStudent && (
                    <div className="col-span-1 md:col-span-2 mt-2">
                      <div className="p-4 sm:p-6 border-2 border-dashed border-border rounded-xl bg-muted/30">
                        <label className="text-xs sm:text-sm font-bold block mb-2 sm:mb-3 text-foreground">
                          Update Documents (JPG/PNG)
                        </label>

                        <input
                          type="file"
                          multiple
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleDocChange}
                          className="block w-full text-xs sm:text-sm text-muted-foreground file:mr-3 file:py-2 sm:file:py-2.5 file:px-4 sm:file:px-6 file:rounded-xl file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-colors mb-4"
                        />

                        {(existingDocuments.length > 0 ||
                          newDocuments.length > 0) && (
                          <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {existingDocuments.map((docUrl, idx) => (
                              <div
                                key={`existing-${idx}`}
                                className="relative group rounded-xl overflow-hidden h-24 sm:h-28 border border-border shadow-sm"
                              >
                                <img
                                  src={docUrl}
                                  alt={`Saved Doc ${idx + 1}`}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() =>
                                    setActiveDocument({
                                      url: docUrl,
                                      name: `Saved Document ${idx + 1}`,
                                    })
                                  }
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                  <ZoomIn
                                    size={20}
                                    className="text-white drop-shadow-md"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExistingDocument(docUrl)}
                                  className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-90 hover:scale-110 transition-all z-10"
                                  title="Remove Saved File"
                                >
                                  <X size={14} strokeWidth={3} />
                                </button>
                                <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded">
                                  Saved
                                </span>
                              </div>
                            ))}

                            {newDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className="relative group rounded-xl overflow-hidden h-24 sm:h-28 border border-border shadow-sm"
                              >
                                <img
                                  src={doc.previewUrl}
                                  alt="New Doc Preview"
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() =>
                                    setActiveDocument({
                                      url: doc.previewUrl,
                                      name: doc.file.name,
                                    })
                                  }
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                                  <ZoomIn
                                    size={20}
                                    className="text-white drop-shadow-md"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeNewDocument(doc.id)}
                                  className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-90 hover:scale-110 transition-all z-10"
                                  title="Remove New File"
                                >
                                  <X size={14} strokeWidth={3} />
                                </button>
                                <span className="absolute bottom-1 left-1 bg-success/80 text-success-foreground text-[10px] px-1.5 py-0.5 rounded">
                                  New
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-10 pt-5 sm:pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base text-foreground bg-muted hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                  >
                    <Save size={16} className="sm:w-[18px] sm:h-[18px]" />{" "}
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showProfilePicModal && modalImageSrc && (
          <motion.div
            key="profile-pic-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowProfilePicModal(false)}
          >
            <div className="relative max-w-3xl w-full flex justify-center">
              <button
                className="absolute -top-12 right-0 sm:-right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-colors z-50"
                onClick={() => setShowProfilePicModal(false)}
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={modalImageSrc}
                alt="Full Profile"
                className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/10"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}

        {/* ADDED KEY HERE */}
        {activeDocument && (
          <motion.div
            key="document-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-5xl flex flex-col items-center gap-4 sm:gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between drop-shadow-lg px-2 sm:px-0">
                <div className="flex items-center gap-3">
                  <FileText
                    className="text-white"
                    size={24}
                    strokeWidth={1.5}
                  />
                  <h3 className="font-medium text-white truncate max-w-[200px] sm:max-w-2xl text-lg sm:text-xl tracking-wide drop-shadow-md">
                    {activeDocument.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveDocument(null)}
                    className="p-2 text-white/70 hover:text-white transition-colors duration-200"
                    title="Close"
                  >
                    <X size={28} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="w-full flex justify-center items-center">
                <img
                  src={activeDocument.url}
                  alt={activeDocument.name}
                  className="max-w-full max-h-[80vh] sm:max-h-[85vh] object-contain drop-shadow-2xl rounded-sm"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAction}
        itemName={profileData?.name}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProfilePage;
