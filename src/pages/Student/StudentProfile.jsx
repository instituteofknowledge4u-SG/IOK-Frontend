// import React, { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
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
//   Check,
//   Trash2,
//   ArrowLeft,
//   ShieldAlert,
// } from "lucide-react";
// import toast from "react-hot-toast";
// import useAuthStore from "../../stores/useAuthStore";
// import useUserStore from "../../stores/useUserStore";
// import useClassStore from "../../stores/useClassStore";
// import BackButton from "../../components/UI/Button";
// import { COUNTRIES } from "../../util/Countries";
// import { getStudentId } from "../../util/getStudentId";

// const StudentProfile = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   // Route State & Auth
//   const targetUserId = location.state?.userId || location.state?.studentId;
//   const passedStudentData =
//     location.state?.userData ||
//     location.state?.studentData ||
//     location.state?.student;

//   const loggedInUser = useAuthStore((state) => state.user);
//   const activeUserId = targetUserId || loggedInUser?._id;

//   const userRole = loggedInUser?.role?.toLowerCase() || "";
//   const isAdmin = userRole === "admin";
//   const isSelf = activeUserId === loggedInUser?._id;

//   const canEdit = isAdmin;

//   // --- ZUSTAND STORES ---
//   const getUserById = useUserStore((state) => state.getUserById);
//   const updateUser = useUserStore((state) => state.updateUser);
//   const deleteUser = useUserStore((state) => state.deleteUser);
//   const isUpdating = useUserStore((state) => state.isLoading);

//   const getMainClassById = useClassStore(
//     (state) => state.getMainClassById || state.getClassById,
//   );
//   const getStudentProgress = useClassStore((state) => state.getStudentProgress);

//   // Local State
//   const [profileData, setProfileData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);

//   const [detailedProgress, setDetailedProgress] = useState({});
//   const [loadingProgress, setLoadingProgress] = useState({});

//   // Modals & Viewers
//   const [activeDocument, setActiveDocument] = useState(null);
//   const [showProfilePicModal, setShowProfilePicModal] = useState(false);
//   const [modalImageSrc, setModalImageSrc] = useState(null);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Edit Form State
//   const [formData, setFormData] = useState({});
//   const [newProfilePic, setNewProfilePic] = useState(null);
//   const [newProfilePreview, setNewProfilePreview] = useState(null);
//   const [newDocuments, setNewDocuments] = useState([]);
//   const [existingDocuments, setExistingDocuments] = useState([]);

//   useEffect(() => {
//     if (!activeUserId) {
//       toast.error("No valid user ID provided.");
//       navigate(-1);
//       return;
//     }

//     const loadProfileData = async () => {
//       setIsLoading(true);
//       try {
//         // 1. Optimistically load passed data if available
//         let currentData = null;
//         if (passedStudentData && passedStudentData._id === activeUserId) {
//           currentData = passedStudentData;
//         } else if (isSelf) {
//           currentData = loggedInUser;
//         }

//         if (currentData) {
//           setProfileData(currentData);
//           setFormData(currentData);
//         }

//         // 2. ALWAYS fetch fresh data to prevent stale location.state cache issues
//         let freshData = currentData;
//         try {
//           const response = await getUserById(activeUserId);
//           const fetchedUser =
//             response?.data?.user ||
//             response?.user ||
//             response?.data ||
//             response;
//           if (fetchedUser && fetchedUser._id) {
//             freshData = fetchedUser;
//             setProfileData(freshData);
//             setFormData(freshData);
//           }
//         } catch (fetchErr) {
//           console.error("Failed to fetch fresh user data:", fetchErr);
//           if (!freshData) throw new Error("Invalid or missing student data.");
//         }

//         // 3. Fetch missing class details & progress safely using Promise.all
//         if (
//           Array.isArray(freshData.mainClasses) &&
//           freshData.mainClasses.length > 0
//         ) {
//           const populatedClasses = await Promise.all(
//             freshData.mainClasses.map(async (mainClass) => {
//               const classId =
//                 typeof mainClass === "string" ? mainClass : mainClass._id;

//               if (classId && getMainClassById) {
//                 try {
//                   const res = await getMainClassById(classId);
//                   const classData =
//                     res?.mainClass || res?.data?.mainClass || res;
//                   const progressList =
//                     res?.studentsProgress ||
//                     res?.data?.studentsProgress ||
//                     classData?.studentsProgress ||
//                     [];

//                   const studentProg = progressList.find(
//                     (p) =>
//                       p.student?._id === freshData._id ||
//                       p.student === freshData._id,
//                   );

//                   if (studentProg) {
//                     setDetailedProgress((prev) => ({
//                       ...prev,
//                       [classId]: studentProg,
//                     }));
//                   }

//                   // Return the fully populated object to overwrite the string ID
//                   return classData || mainClass;
//                 } catch (error) {
//                   console.error("Error fetching class details:", error);
//                   return mainClass;
//                 }
//               }
//               return mainClass;
//             }),
//           );

//           // Update profileData with the actual class objects to remove "Loading..." state
//           setProfileData((prev) => ({
//             ...prev,
//             mainClasses: populatedClasses,
//           }));
//           setFormData((prev) => ({
//             ...prev,
//             mainClasses: populatedClasses,
//           }));
//         }
//       } catch (error) {
//         console.error("Profile Fetch Error:", error);
//         toast.error("Failed to load student profile data.");
//         navigate(-1);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadProfileData();
//   }, [activeUserId]); // Clean dependency array avoids infinite loops

//   const toggleProgressCheckbox = async (mainClassId, field) => {
//     if (!canEdit) {
//       toast.error("Only Administrators can modify student progress.");
//       return;
//     }

//     const classIdStr =
//       typeof mainClassId === "string" ? mainClassId : mainClassId._id;
//     const progRecord = detailedProgress[classIdStr];

//     if (!progRecord || !progRecord._id) {
//       toast.error(
//         "Progress record not found. Ensure the student is properly enrolled.",
//       );
//       return;
//     }

//     const studentBatchId = progRecord._id;
//     const newValue = !progRecord[field];

//     setLoadingProgress((prev) => ({
//       ...prev,
//       [`${classIdStr}_${field}`]: true,
//     }));

//     const updatedData = {
//       [field]: newValue,
//     };

//     try {
//       await getStudentProgress(studentBatchId, updatedData);

//       setDetailedProgress((prev) => ({
//         ...prev,
//         [classIdStr]: {
//           ...prev[classIdStr],
//           [field]: newValue,
//         },
//       }));

//       const fieldLabel =
//         field === "batchcompletion"
//           ? "Course"
//           : field === "examcompletion"
//             ? "Exam"
//             : "Certificate";
//       toast.success(`${fieldLabel} status updated successfully!`);
//     } catch (error) {
//       toast.error("Error updating progress. Please try again.");
//     } finally {
//       setLoadingProgress((prev) => ({
//         ...prev,
//         [`${classIdStr}_${field}`]: false,
//       }));
//     }
//   };

//   const cleanupPreviews = () => {
//     if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
//     newDocuments.forEach((doc) => URL.revokeObjectURL(doc.previewUrl));
//   };

//   const startEditing = () => {
//     setIsEditing(true);
//     setExistingDocuments(profileData.documents || []);
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
//       if (
//         file.type === "image/jpeg" ||
//         file.type === "image/png" ||
//         file.type === "image/jpg"
//       ) {
//         if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
//         setNewProfilePic(file);
//         setNewProfilePreview(URL.createObjectURL(file));
//       } else {
//         toast.error(
//           "Restricted: Only JPG and PNG images can be uploaded for profile pictures.",
//         );
//       }
//     }
//   };

//   const handleDocChange = (e) => {
//     const files = Array.from(e.target.files);
//     const validFiles = [];

//     files.forEach((file) => {
//       if (
//         file.type === "image/jpeg" ||
//         file.type === "image/png" ||
//         file.type === "image/jpg"
//       ) {
//         validFiles.push({
//           id: Math.random().toString(36).substring(7),
//           file: file,
//           previewUrl: URL.createObjectURL(file),
//         });
//       } else {
//         toast.error(
//           `Skipped ${file.name}: Only JPG/PNG images are allowed for documents.`,
//         );
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

//   const handleUpdate = async (e) => {
//     e.preventDefault();

//     if (!canEdit) {
//       setIsEditing(false);
//       return toast.error("Access denied. Only Admins can edit profiles.");
//     }

//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (formData.email && !emailRegex.test(formData.email)) {
//       return toast.error("Please enter a valid email address.");
//     }
//     if (formData.phone && formData.phone.length !== 10) {
//       return toast.error("Phone number must be exactly 10 digits.");
//     }
//     if (formData.adhar && formData.adhar.length !== 12) {
//       return toast.error("Aadhar number must be exactly 12 digits.");
//     }

//     const submitData = new FormData();
//     Object.keys(formData).forEach((key) => {
//       if (
//         typeof formData[key] === "string" ||
//         typeof formData[key] === "number"
//       ) {
//         submitData.append(key, formData[key]);
//       }
//     });

//     if (newProfilePic) submitData.append("profilePic", newProfilePic);

//     newDocuments.forEach((doc) => submitData.append("documents", doc.file));
//     existingDocuments.forEach((url) =>
//       submitData.append("retainedDocuments", url),
//     );

//     try {
//       const serverResponse = await updateUser(profileData._id, submitData);

//       const freshUserData =
//         serverResponse?.data?.user ||
//         serverResponse?.user ||
//         serverResponse?.data ||
//         serverResponse;

//       setProfileData(freshUserData);
//       setFormData(freshUserData);
//       if (isSelf) useAuthStore.setState({ user: freshUserData });

//       // FIX: Replace React Router history state to prevent caching issues on reload
//       navigate(location.pathname, {
//         replace: true,
//         state: {
//           ...location.state,
//           userId: freshUserData._id,
//           userData: freshUserData,
//           studentData: freshUserData,
//           student: freshUserData,
//         },
//       });

//       toast.success("Profile updated successfully!");
//       cleanupPreviews();
//       setIsEditing(false);
//       setNewProfilePic(null);
//       setNewProfilePreview(null);
//       setNewDocuments([]);
//       setExistingDocuments([]);
//     } catch (error) {
//       toast.error(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to update profile",
//       );
//     }
//   };

//   const confirmDeleteAction = async () => {
//     if (!isAdmin || isSelf) return;
//     setIsDeleting(true);
//     try {
//       await deleteUser(profileData._id);
//       toast.success("Student deleted successfully.");
//       setShowDeleteModal(false);
//       navigate(-1);
//     } catch (error) {
//       toast.error(error.response?.data?.message || "Failed to delete student");
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
//         <div className="flex flex-col items-center gap-4">
//           <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-md"></div>
//           <p className="text-muted-foreground font-medium animate-pulse">
//             Loading Profile...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const InfoRow = ({ icon: Icon, label, value }) => (
//     <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-muted/30 transition-colors border-b border-border/50 last:border-0">
//       <div className="flex items-center gap-3 w-full sm:w-1/3 text-muted-foreground">
//         <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary">
//           {Icon && <Icon size={16} />}
//         </div>
//         <p className="text-sm font-medium capitalize tracking-wider">{label}</p>
//       </div>
//       <div className="sm:w-2/3 pl-11 sm:pl-0">
//         <p className="text-sm sm:text-base font-semibold text-foreground break-all">
//           {value || "Not Provided"}
//         </p>
//       </div>
//     </div>
//   );

//   return (
//     <div className="min-h-screen relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 bg-background text-foreground font-sans transition-colors duration-300">
//       <div className="max-w-5xl mx-auto relative z-10">
//         {/* Header Actions */}
//         <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
//           <BackButton />
//           <div className="flex items-center gap-2 sm:gap-3">
//             {isAdmin && !isSelf && !isEditing && (
//               <button
//                 onClick={() => setShowDeleteModal(true)}
//                 className="group flex items-center gap-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-destructive/20 shadow-sm active:scale-95"
//               >
//                 <Trash2 size={16} />{" "}
//                 <span className="hidden sm:inline">Delete Student</span>
//               </button>
//             )}
//             {canEdit && !isEditing && (
//               <button
//                 onClick={startEditing}
//                 className="group flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 active:scale-95"
//               >
//                 <Edit3
//                   size={16}
//                   className="group-hover:rotate-12 transition-transform"
//                 />{" "}
//                 Edit Profile
//               </button>
//             )}
//           </div>
//         </div>

//         {!canEdit && !isSelf && (
//           <div className="mb-6 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl flex items-start gap-3 text-sm font-medium">
//             <ShieldAlert size={18} className="shrink-0 mt-0.5" />
//             <p>
//               Read-Only Mode. You have permission to view this profile, but only
//               Administrators can edit details or modify progress.
//             </p>
//           </div>
//         )}

//         <AnimatePresence mode="wait">
//           {!isEditing ? (
//             <motion.div
//               key="view-mode"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="space-y-6"
//             >
//               {/* Profile Banner Card */}
//               <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center shadow-sm relative overflow-hidden">
//                 <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
//                 <div className="relative shrink-0 z-10">
//                   <div
//                     onClick={() => openProfilePicModal(profileData.profilePic)}
//                     className={`w-28 h-28 sm:w-36 sm:h-36 border-4 border-card shadow-xl bg-muted rounded-full overflow-hidden relative group ${profileData.profilePic ? "cursor-pointer" : ""}`}
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
//                 </div>

//                 <div className="flex-1 text-center sm:text-left z-10 w-full">
//                   <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize tracking-tight">
//                     {profileData.name}
//                   </h2>
//                   <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
//                     <span className="flex items-center gap-1.5 text-sm text-accent-foreground font-bold bg-accent border border-border px-3 py-1.5 rounded-lg shadow-sm">
//                       <GraduationCap size={14} /> Student
//                     </span>
//                     {profileData._id && (
//                       <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-bold bg-muted border border-border px-3 py-1.5 rounded-lg shadow-sm">
//                         ID: {getStudentId(profileData)}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Info Grid */}
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Contact Details */}
//                 <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
//                   <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-2">
//                     <UserCheck className="text-primary" size={18} />
//                     <h3 className="font-bold text-foreground">
//                       Contact & Personal Details
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
//                     {profileData.dob && (
//                       <InfoRow
//                         icon={Calendar}
//                         label="Date of Birth"
//                         value={formatDate(profileData.dob)}
//                       />
//                     )}
//                     {profileData.gender && (
//                       <InfoRow
//                         icon={User}
//                         label="Gender"
//                         value={profileData.gender}
//                       />
//                     )}
//                     {profileData.nationality && (
//                       <InfoRow
//                         icon={Flag}
//                         label="Nationality"
//                         value={profileData.nationality}
//                       />
//                     )}
//                     {profileData.address && (
//                       <InfoRow
//                         icon={MapPin}
//                         label="Address"
//                         value={profileData.address}
//                       />
//                     )}
//                     <InfoRow
//                       icon={Calendar}
//                       label="Admission Date"
//                       value={formatDate(profileData.createdAt)}
//                     />
//                   </div>
//                 </div>

//                 {/* Academic Status */}
//                 <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
//                   <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-2">
//                     <Shield className="text-primary" size={18} />
//                     <h3 className="font-bold text-foreground">
//                       Academic Status
//                     </h3>
//                   </div>
//                   <div className="divide-y divide-border/50">
//                     {profileData.stream && (
//                       <InfoRow
//                         icon={BookOpen}
//                         label="Stream"
//                         value={profileData.stream}
//                       />
//                     )}
//                     {profileData.grade && (
//                       <InfoRow
//                         icon={GraduationCap}
//                         label="Grade"
//                         value={profileData.grade}
//                       />
//                     )}
//                     {profileData.marksObtained !== undefined && (
//                       <InfoRow
//                         icon={FileText}
//                         label="Marks"
//                         value={`${profileData.marksObtained}`}
//                       />
//                     )}
//                     <InfoRow
//                       icon={Hash}
//                       label="Aadhar Number"
//                       value={
//                         isAdmin
//                           ? profileData.adhar
//                           : profileData.adhar
//                             ? `XXXX-XXXX-${profileData.adhar.replace(/\D/g, "").slice(-4)}`
//                             : "-"
//                       }
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Main Classes & Progress */}
//               <div className="space-y-4">
//                 <h3 className="text-xl font-bold text-foreground flex items-center gap-2 px-1">
//                   <BookOpen className="text-primary" size={22} /> Enrolled
//                   Course Progress
//                 </h3>
//                 {profileData.mainClasses?.length > 0 ? (
//                   <div className="space-y-4">
//                     {profileData.mainClasses.map((mainClassObj) => {
//                       const classObj =
//                         typeof mainClassObj === "string"
//                           ? {
//                               _id: mainClassObj,
//                               name: "Loading...",
//                               duration: "-",
//                               fees: "-",
//                             }
//                           : mainClassObj;

//                       // USE DETAILED PROGRESS OBJECT FROM NEW STATE
//                       const progress = detailedProgress[classObj._id];

//                       return (
//                         <div
//                           key={classObj._id}
//                           className="bg-card rounded-2xl p-6 border border-border shadow-sm"
//                         >
//                           <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
//                             <div>
//                               <h3 className="text-lg font-bold text-foreground">
//                                 {classObj.name}
//                               </h3>
//                               <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
//                                 <span className="flex items-center gap-1.5">
//                                   <Calendar size={14} />{" "}
//                                   {classObj.duration || "-"} Months
//                                 </span>
//                                 {classObj.startDate && (
//                                   <span className="bg-muted px-2 py-0.5 rounded text-xs border border-border">
//                                     Start: {formatDate(classObj.startDate)}
//                                   </span>
//                                 )}
//                               </div>
//                             </div>
//                             <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 shrink-0 self-start">
//                               ₹ {classObj.fees || "-"}
//                             </span>
//                           </div>

//                           {/* Conditional render based on whether progress exists */}
//                           {progress ? (
//                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//                               {[
//                                 {
//                                   key: "courseComplete",
//                                   field: "batchcompletion",
//                                   icon: BookOpen,
//                                   label: "Course Completed",
//                                   color: "primary",
//                                 },
//                                 {
//                                   key: "examComplete",
//                                   field: "examcompletion",
//                                   icon: FileText,
//                                   label: "Exam Cleared",
//                                   color: "accent",
//                                 },
//                                 {
//                                   key: "certificateComplete",
//                                   field: "certificateIssued",
//                                   icon: Check,
//                                   label: "Certificate Issued",
//                                   color: "success",
//                                 },
//                               ].map(
//                                 ({
//                                   key: fieldKey,
//                                   field,
//                                   icon: Icon,
//                                   label,
//                                   color,
//                                 }) => {
//                                   const isComplete = progress[field];
//                                   const statusColors = isComplete
//                                     ? color === "primary"
//                                       ? "bg-primary/5 border-primary/40 text-primary"
//                                       : color === "accent"
//                                         ? "bg-accent/5 border-accent-foreground/40 text-accent-foreground"
//                                         : "bg-success/5 border-success/40 text-success"
//                                     : "bg-background border-border/60 text-muted-foreground";

//                                   return (
//                                     <button
//                                       key={fieldKey}
//                                       onClick={() =>
//                                         toggleProgressCheckbox(
//                                           classObj._id,
//                                           field,
//                                         )
//                                       }
//                                       disabled={
//                                         !canEdit ||
//                                         loadingProgress[
//                                           `${classObj._id}_${field}`
//                                         ]
//                                       }
//                                       className={`relative rounded-xl p-4 border-2 transition-all flex flex-col justify-between h-full text-left ${statusColors} ${canEdit ? "hover:-translate-y-1 hover:shadow-md cursor-pointer" : "opacity-90 cursor-not-allowed"}`}
//                                     >
//                                       <div className="flex items-start justify-between mb-3 w-full">
//                                         <div
//                                           className={`p-2.5 rounded-lg ${isComplete ? "bg-current/10" : "bg-muted"}`}
//                                         >
//                                           <Icon size={18} />
//                                         </div>
//                                         {isComplete && (
//                                           <div
//                                             className={`p-1 rounded-full text-white ${color === "primary" ? "bg-primary" : color === "accent" ? "bg-accent-foreground" : "bg-success"}`}
//                                           >
//                                             <Check size={14} strokeWidth={3} />
//                                           </div>
//                                         )}
//                                       </div>
//                                       <div>
//                                         <p
//                                           className={`font-semibold text-sm ${isComplete ? "text-foreground" : ""}`}
//                                         >
//                                           {label}
//                                         </p>
//                                         <p className="text-xs opacity-70 mt-1">
//                                           {isComplete
//                                             ? "Completed"
//                                             : canEdit
//                                               ? "Click to toggle"
//                                               : "Pending"}
//                                         </p>
//                                       </div>
//                                     </button>
//                                   );
//                                 },
//                               )}
//                             </div>
//                           ) : (
//                             <div className="w-full py-6 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
//                               <span className="text-sm font-semibold text-muted-foreground">
//                                 No batch assign
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="bg-card rounded-2xl border border-border border-dashed p-10 text-center flex flex-col items-center justify-center">
//                     <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
//                     <h3 className="font-semibold text-foreground">
//                       No Classes Enrolled
//                     </h3>
//                     <p className="text-sm text-muted-foreground">
//                       Student hasn't enrolled in any main classes yet.
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {/* Batches Grid */}
//               <div className="space-y-4">
//                 <h3 className="text-xl font-bold text-foreground flex items-center gap-2 px-1">
//                   <Clock className="text-primary" size={22} /> Assigned Batches
//                 </h3>
//                 {profileData.batches?.length > 0 ? (
//                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                     {profileData.batches.map((batchObj) => {
//                       const batch =
//                         typeof batchObj === "string"
//                           ? {
//                               _id: batchObj,
//                               name: "Loading Data...",
//                               weekday: "-",
//                               startTime: "-",
//                               endTime: "-",
//                             }
//                           : batchObj;
//                       return (
//                         <div
//                           key={batch._id}
//                           className="bg-card rounded-2xl p-5 border border-border shadow-sm"
//                         >
//                           <h3 className="font-bold text-foreground mb-3 truncate">
//                             {batch.name}
//                           </h3>
//                           <div className="space-y-2">
//                             <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-2 rounded-md">
//                               <Calendar
//                                 size={14}
//                                 className="mr-2 text-primary"
//                               />
//                               <span className="font-medium text-foreground">
//                                 {batch.weekday}
//                               </span>
//                             </div>
//                             <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-2 rounded-md">
//                               <div className="w-1.5 h-1.5 rounded-full bg-success mr-2.5 ml-1"></div>
//                               {batch.startTime} - {batch.endTime}
//                             </div>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 ) : (
//                   <div className="bg-card rounded-2xl border border-border border-dashed p-8 text-center flex flex-col items-center">
//                     <Clock className="w-8 h-8 text-muted-foreground/40 mb-2" />
//                     <p className="text-sm text-muted-foreground">
//                       No batches assigned.
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {/* Documents Grid */}
//               <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6">
//                 <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
//                   <FileText className="text-primary" size={18} /> Uploaded
//                   Documents
//                 </h3>
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//                   {profileData.documents?.length > 0 ? (
//                     profileData.documents.map((docUrl, idx) => (
//                       <div
//                         key={idx}
//                         onClick={() =>
//                           setActiveDocument({
//                             url: docUrl,
//                             name: `Document ${idx + 1}`,
//                           })
//                         }
//                         className="cursor-pointer bg-muted border border-border rounded-xl overflow-hidden h-32 group relative shadow-sm"
//                       >
//                         <img
//                           src={docUrl}
//                           alt={`Doc ${idx + 1}`}
//                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                         />
//                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
//                           <ZoomIn className="text-white" size={20} />
//                           <span className="text-white text-xs font-semibold px-2">
//                             View
//                           </span>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2">
//                       <FileText size={24} className="opacity-40" />
//                       <p className="text-sm">No documents available.</p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           ) : (
//             /* ================= EDIT MODE ================= */
//             <motion.div
//               key="edit-mode"
//               initial={{ opacity: 0, scale: 0.98 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 0.98 }}
//             >
//               <form
//                 onSubmit={handleUpdate}
//                 className="bg-card p-6 sm:p-8 rounded-2xl shadow-xl border border-border"
//               >
//                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
//                   <Edit3 className="text-primary" size={20} />
//                   <h2 className="text-xl font-bold text-foreground">
//                     Edit Student Details
//                   </h2>
//                 </div>

//                 <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 bg-muted/30 p-6 rounded-xl border border-border/50">
//                   <div className="relative shrink-0">
//                     <div
//                       onClick={() =>
//                         openProfilePicModal(
//                           newProfilePreview || profileData.profilePic,
//                         )
//                       }
//                       className={`w-24 h-24 rounded-full shadow-md border-4 border-card bg-muted overflow-hidden relative group ${newProfilePreview || profileData.profilePic ? "cursor-pointer" : ""}`}
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
//                   <div className="flex-1">
//                     <label className="text-sm font-bold block mb-2 text-foreground">
//                       Update Profile Photo
//                     </label>
//                     <input
//                       type="file"
//                       accept="image/png, image/jpeg, image/jpg"
//                       onChange={handleProfilePicChange}
//                       className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {/* Mapping Fields with Select Support */}
//                   {[
//                     {
//                       label: "Full Name",
//                       name: "name",
//                       icon: User,
//                       type: "text",
//                       req: true,
//                     },
//                     {
//                       label: "Email Address",
//                       name: "email",
//                       icon: Mail,
//                       type: "email",
//                       req: true,
//                     },
//                     {
//                       label: "Phone Number",
//                       name: "phone",
//                       icon: Phone,
//                       type: "text",
//                       req: true,
//                       placeholder: "10-digit number",
//                     },
//                     {
//                       label: "Date of Birth",
//                       name: "dob",
//                       icon: Calendar,
//                       type: "date",
//                     },
//                     {
//                       label: "Nationality",
//                       name: "nationality",
//                       icon: Flag,
//                       type: "select",
//                       options: COUNTRIES,
//                     },
//                     {
//                       label: "Address",
//                       name: "address",
//                       icon: MapPin,
//                       type: "text",
//                     },
//                     {
//                       label: "Stream",
//                       name: "stream",
//                       icon: BookOpen,
//                       type: "select",
//                       options: [
//                         "Science",
//                         "Commerce",
//                         "Arts",
//                         "Vocational",
//                         "Diploma",
//                         "B.Tech",
//                         "Other",
//                       ],
//                     },
//                     {
//                       label: "Grade",
//                       name: "grade",
//                       icon: GraduationCap,
//                       type: "text",
//                     },
//                     {
//                       label: "Marks Obtained",
//                       name: "marksObtained",
//                       icon: FileText,
//                       type: "number",
//                     },
//                     {
//                       label: "Aadhar Number",
//                       name: "adhar",
//                       icon: Hash,
//                       type: "text",
//                       placeholder: "12-digit number",
//                     },
//                   ].map((field) => (
//                     <div key={field.name} className="space-y-2">
//                       <label className="text-sm font-bold text-foreground">
//                         {field.label}{" "}
//                         {field.req && (
//                           <span className="text-destructive">*</span>
//                         )}
//                       </label>
//                       <div className="relative">
//                         <field.icon
//                           className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                           size={16}
//                         />

//                         {field.type === "select" ? (
//                           <select
//                             name={field.name}
//                             value={formData[field.name] || ""}
//                             onChange={handleInputChange}
//                             required={field.req}
//                             className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow appearance-none"
//                           >
//                             <option value="">Select {field.label}</option>
//                             {field.options.map((opt) => (
//                               <option key={opt} value={opt}>
//                                 {opt}
//                               </option>
//                             ))}
//                           </select>
//                         ) : (
//                           <input
//                             type={field.type}
//                             name={field.name}
//                             value={
//                               field.type === "date" && formData[field.name]
//                                 ? formData[field.name].split("T")[0]
//                                 : formData[field.name] || ""
//                             }
//                             onChange={handleInputChange}
//                             required={field.req}
//                             placeholder={field.placeholder}
//                             className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
//                           />
//                         )}
//                       </div>
//                     </div>
//                   ))}

//                   {/* Gender Select */}
//                   <div className="space-y-2">
//                     <label className="text-sm font-bold text-foreground">
//                       Gender
//                     </label>
//                     <div className="relative">
//                       <User
//                         className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                         size={16}
//                       />
//                       <select
//                         name="gender"
//                         value={formData.gender || ""}
//                         onChange={handleInputChange}
//                         className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background appearance-none outline-none focus:ring-2 focus:ring-primary/20"
//                       >
//                         <option value="">Select Gender</option>
//                         <option value="Male">Male</option>
//                         <option value="Female">Female</option>
//                         <option value="Other">Other</option>
//                       </select>
//                     </div>
//                   </div>

//                   {/* Document Uploader */}
//                   <div className="col-span-1 md:col-span-2 mt-4 p-6 border-2 border-dashed border-border rounded-xl bg-muted/30">
//                     <label className="text-sm font-bold block mb-3 text-foreground">
//                       Update Documents (JPG/PNG Only)
//                     </label>
//                     <input
//                       type="file"
//                       multiple
//                       accept="image/png, image/jpeg, image/jpg"
//                       onChange={handleDocChange}
//                       className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-colors mb-4"
//                     />

//                     {(existingDocuments.length > 0 ||
//                       newDocuments.length > 0) && (
//                       <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
//                         {existingDocuments.map((docUrl, idx) => (
//                           <div
//                             key={`existing-${idx}`}
//                             className="relative group rounded-xl overflow-hidden h-28 border border-border shadow-sm"
//                           >
//                             <img
//                               src={docUrl}
//                               alt="Saved Doc"
//                               className="w-full h-full object-cover cursor-pointer"
//                               onClick={() =>
//                                 setActiveDocument({
//                                   url: docUrl,
//                                   name: `Saved Document ${idx + 1}`,
//                                 })
//                               }
//                             />
//                             <button
//                               type="button"
//                               onClick={() => removeExistingDocument(docUrl)}
//                               className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-all z-10"
//                             >
//                               <X size={14} strokeWidth={3} />
//                             </button>
//                             <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
//                               Saved
//                             </span>
//                           </div>
//                         ))}
//                         {newDocuments.map((doc) => (
//                           <div
//                             key={doc.id}
//                             className="relative group rounded-xl overflow-hidden h-28 border border-border shadow-sm"
//                           >
//                             <img
//                               src={doc.previewUrl}
//                               alt="New Doc"
//                               className="w-full h-full object-cover cursor-pointer"
//                               onClick={() =>
//                                 setActiveDocument({
//                                   url: doc.previewUrl,
//                                   name: doc.file.name,
//                                 })
//                               }
//                             />
//                             <button
//                               type="button"
//                               onClick={() => removeNewDocument(doc.id)}
//                               className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-all z-10"
//                             >
//                               <X size={14} strokeWidth={3} />
//                             </button>
//                             <span className="absolute bottom-1 left-1 bg-success/80 text-success-foreground text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
//                               New
//                             </span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-border">
//                   <button
//                     type="button"
//                     onClick={cancelEdit}
//                     className="px-6 py-3 rounded-xl font-bold text-sm bg-muted hover:bg-muted/80 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={isUpdating}
//                     className="px-8 py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 active:scale-95"
//                   >
//                     <Save size={16} />{" "}
//                     {isUpdating ? "Saving..." : "Save Changes"}
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Profile Pic Viewer Modal */}
//       <AnimatePresence>
//         {showProfilePicModal && modalImageSrc && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//             onClick={() => setShowProfilePicModal(false)}
//           >
//             <div className="relative max-w-3xl w-full flex justify-center">
//               <button
//                 className="absolute -top-12 right-0 sm:-right-8 text-white/70 hover:text-white bg-black/50 p-2 rounded-full transition-colors z-50"
//                 onClick={() => setShowProfilePicModal(false)}
//               >
//                 <X size={24} />
//               </button>
//               <motion.img
//                 initial={{ scale: 0.9 }}
//                 animate={{ scale: 1 }}
//                 exit={{ scale: 0.9 }}
//                 src={modalImageSrc}
//                 alt="Full Profile"
//                 className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
//                 onClick={(e) => e.stopPropagation()}
//               />
//             </div>
//           </motion.div>
//         )}

//         {/* Document Viewer Modal */}
//         {activeDocument && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
//             onClick={() => setActiveDocument(null)}
//           >
//             <motion.div
//               initial={{ scale: 0.95, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.95, y: 20 }}
//               className="w-full max-w-5xl flex flex-col items-center gap-6"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <div className="w-full flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <FileText className="text-white" size={24} />
//                   <h3 className="font-medium text-white text-lg">
//                     {activeDocument.name}
//                   </h3>
//                 </div>
//                 <button
//                   onClick={() => setActiveDocument(null)}
//                   className="p-2 text-white/70 hover:text-white transition-colors"
//                 >
//                   <X size={28} />
//                 </button>
//               </div>
//               <img
//                 src={activeDocument.url}
//                 alt={activeDocument.name}
//                 className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-sm"
//               />
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Delete Modal */}
//       {showDeleteModal && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//           <div className="bg-card p-6 rounded-2xl shadow-xl max-w-md w-full border border-border">
//             <h3 className="text-xl font-bold text-foreground mb-4">
//               Confirm Deletion
//             </h3>
//             <p className="text-muted-foreground mb-6">
//               Are you sure you want to delete {profileData.name}? This action
//               cannot be undone.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowDeleteModal(false)}
//                 className="px-4 py-2 rounded-xl bg-muted font-semibold"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={confirmDeleteAction}
//                 disabled={isDeleting}
//                 className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold flex items-center gap-2"
//               >
//                 {isDeleting ? "Deleting..." : "Confirm Delete"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default StudentProfile;

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  ArrowLeft,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Printer,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/useAuthStore";
import useUserStore from "../../stores/useUserStore";
import useClassStore from "../../stores/useClassStore";
import BackButton from "../../components/UI/Button";
import { COUNTRIES } from "../../util/Countries";
import { getStudentId } from "../../util/getStudentId";
import { Image } from "../../assets/Image";

const StudentProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route State & Auth
  const targetUserId = location.state?.userId || location.state?.studentId;
  const passedStudentData =
    location.state?.userData ||
    location.state?.studentData ||
    location.state?.student;

  const loggedInUser = useAuthStore((state) => state.user);
  const activeUserId = targetUserId || loggedInUser?._id;

  const userRole = loggedInUser?.role?.toLowerCase() || "";
  const isAdmin = userRole === "admin";
  const isSelf = activeUserId === loggedInUser?._id;

  const canEdit = isAdmin;

  // --- ZUSTAND STORES ---
  const getUserById = useUserStore((state) => state.getUserById);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteUser = useUserStore((state) => state.deleteUser);
  const isUpdating = useUserStore((state) => state.isLoading);

  const getMainClassById = useClassStore(
    (state) => state.getMainClassById || state.getClassById,
  );
  const getStudentProgress = useClassStore((state) => state.getStudentProgress);

  // Local State
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [detailedProgress, setDetailedProgress] = useState({});
  const [loadingProgress, setLoadingProgress] = useState({});

  // Toggle States for Sections
  const [showProgress, setShowProgress] = useState(true);
  const [showBatches, setShowBatches] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);

  // Modals & Viewers
  const [activeDocument, setActiveDocument] = useState(null);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [certificateCourse, setCertificateCourse] = useState(null);
  const [certificateGrade, setCertificateGrade] = useState("");

  // Edit Form State
  const [formData, setFormData] = useState({});
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [newProfilePreview, setNewProfilePreview] = useState(null);
  const [newDocuments, setNewDocuments] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);

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
        if (passedStudentData && passedStudentData._id === activeUserId) {
          currentData = passedStudentData;
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
          if (!freshData) throw new Error("Invalid or missing student data.");
        }

        // 3. Fetch missing class details & progress safely using Promise.all
        if (
          Array.isArray(freshData.mainClasses) &&
          freshData.mainClasses.length > 0
        ) {
          const populatedClasses = await Promise.all(
            freshData.mainClasses.map(async (mainClass) => {
              const classId =
                typeof mainClass === "string" ? mainClass : mainClass._id;

              if (classId && getMainClassById) {
                try {
                  const res = await getMainClassById(classId);
                  const classData =
                    res?.mainClass || res?.data?.mainClass || res;
                  const progressList =
                    res?.studentsProgress ||
                    res?.data?.studentsProgress ||
                    classData?.studentsProgress ||
                    [];

                  const studentProg = progressList.find(
                    (p) =>
                      p.student?._id === freshData._id ||
                      p.student === freshData._id,
                  );

                  if (studentProg) {
                    setDetailedProgress((prev) => ({
                      ...prev,
                      [classId]: studentProg,
                    }));
                  }

                  // Return the fully populated object to overwrite the string ID
                  return classData || mainClass;
                } catch (error) {
                  console.error("Error fetching class details:", error);
                  return mainClass;
                }
              }
              return mainClass;
            }),
          );

          // Update profileData with the actual class objects to remove "Loading..." state
          setProfileData((prev) => ({
            ...prev,
            mainClasses: populatedClasses,
          }));
          setFormData((prev) => ({
            ...prev,
            mainClasses: populatedClasses,
          }));
        }
      } catch (error) {
        console.error("Profile Fetch Error:", error);
        toast.error("Failed to load student profile data.");
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [activeUserId]); // Clean dependency array avoids infinite loops

  const toggleProgressCheckbox = async (mainClassId, field) => {
    if (!canEdit) {
      toast.error("Only Administrators can modify student progress.");
      return;
    }

    const classIdStr =
      typeof mainClassId === "string" ? mainClassId : mainClassId._id;
    const progRecord = detailedProgress[classIdStr];

    if (!progRecord || !progRecord._id) {
      toast.error(
        "Progress record not found. Ensure the student is properly enrolled.",
      );
      return;
    }

    const studentBatchId = progRecord._id;
    const newValue = !progRecord[field];

    setLoadingProgress((prev) => ({
      ...prev,
      [`${classIdStr}_${field}`]: true,
    }));

    const updatedData = {
      [field]: newValue,
    };

    try {
      await getStudentProgress(studentBatchId, updatedData);

      setDetailedProgress((prev) => ({
        ...prev,
        [classIdStr]: {
          ...prev[classIdStr],
          [field]: newValue,
        },
      }));

      const fieldLabel =
        field === "batchcompletion"
          ? "Course"
          : field === "examcompletion"
            ? "Exam"
            : "Certificate";
      toast.success(`${fieldLabel} status updated successfully!`);
    } catch (error) {
      toast.error("Error updating progress. Please try again.");
    } finally {
      setLoadingProgress((prev) => ({
        ...prev,
        [`${classIdStr}_${field}`]: false,
      }));
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

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];

    files.forEach((file) => {
      if (
        file.type === "image/jpeg" ||
        file.type === "image/png" ||
        file.type === "image/jpg"
      ) {
        validFiles.push({
          id: Math.random().toString(36).substring(7),
          file: file,
          previewUrl: URL.createObjectURL(file),
        });
      } else {
        toast.error(
          `Skipped ${file.name}: Only JPG/PNG images are allowed for documents.`,
        );
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      return toast.error("Please enter a valid email address.");
    }
    if (formData.phone && formData.phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits.");
    }
    if (formData.adhar && formData.adhar.length !== 12) {
      return toast.error("Aadhar number must be exactly 12 digits.");
    }

    const submitData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (
        typeof formData[key] === "string" ||
        typeof formData[key] === "number"
      ) {
        submitData.append(key, formData[key]);
      }
    });

    if (newProfilePic) submitData.append("profilePic", newProfilePic);

    newDocuments.forEach((doc) => submitData.append("documents", doc.file));
    existingDocuments.forEach((url) =>
      submitData.append("retainedDocuments", url),
    );

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

      // FIX: Replace React Router history state to prevent caching issues on reload
      navigate(location.pathname, {
        replace: true,
        state: {
          ...location.state,
          userId: freshUserData._id,
          userData: freshUserData,
          studentData: freshUserData,
          student: freshUserData,
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
      toast.success("Student deleted successfully.");
      setShowDeleteModal(false);
      navigate(-1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete student");
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

  const formatShortDate = (date) =>
    [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getFullYear()).slice(-2),
    ].join(".");

  const formatCertificateDate = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";

    return [
      String(date.getDate()).padStart(2, "0"),
      String(date.getMonth() + 1).padStart(2, "0"),
      date.getFullYear(),
    ].join(".");
  };

  const getAcademicSession = (cardType) => {
    const sourceDate = profileData.admissionDate || profileData.createdAt;
    const date = sourceDate ? new Date(sourceDate) : new Date();
    const baseYear = Number.isNaN(date.getTime())
      ? new Date().getFullYear()
      : date.getFullYear();
    const start =
      cardType === "gcc" ? new Date(baseYear, 0, 1) : new Date(baseYear, 3, 1);
    const end =
      cardType === "gcc"
        ? new Date(baseYear, 11, 31)
        : new Date(baseYear + 1, 2, 31);

    return `${formatShortDate(start)}. To ${formatShortDate(end)}`;
  };

  const getMainClassName = () => {
    const mainClass = profileData.mainClasses?.[0];
    if (!mainClass) return "DCA";
    if (typeof mainClass === "string") return mainClass;
    return mainClass.name || mainClass.courseName || mainClass.title || "DCA";
  };

  const getBatchName = () => {
    const batch = profileData.batches?.[0];
    if (!batch) return "Computer";
    if (typeof batch === "string") return batch;
    return batch.name || batch.batchName || "Computer";
  };

  const handlePrintStudentCard = (cardType) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print student card");
      return;
    }

    const isGcc = cardType === "gcc";
    const frontTemplate = getAbsoluteUrl(
      isGcc ? Image.studentGccCardFront : Image.studentIkCardFront,
    );
    const backTemplate = getAbsoluteUrl(Image.studentCardBack);
    const profilePicUrl = getAbsoluteUrl(profileData.profilePic || "");
    const qrCodeUrl = getAbsoluteUrl(profileData.qrCodeUrl || Image.qrCode);
    const studentId =
      getStudentId(profileData) || profileData.studentId || "N/A";
    const courseName = getMainClassName();
    const batchName = getBatchName();
    const grade =
      profileData.className || profileData.grade || profileData.class || "VIII";
    const session = getAcademicSession(cardType);
    const title = isGcc ? "GCC Admit Card" : "IK Student ID Card";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${escapeHtml(title)} - ${escapeHtml(profileData.name)}</title>
          <style>
            * { box-sizing: border-box; }
            html, body { margin: 0; background: #111; font-family: Arial, Helvetica, sans-serif; }
            body { padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 18px; }
            .page {
              position: relative;
              width: min(88mm, calc(100vw - 24px));
              aspect-ratio: 6496 / 10039;
              overflow: hidden;
              background: #000;
              color: #fff;
              break-after: page;
              page-break-after: always;
            }
            .page:last-child { break-after: auto; page-break-after: auto; }
            .template {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 1;
            }
            .student-photo {
              position: absolute;
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
              border: 2px solid rgba(255, 255, 255, 0.9);
            }
            .placeholder-photo {
              position: absolute;
              z-index: 2;
              left: 50%;
              top: 26.475%;
              transform: translate(-50%, -50%);
              width: 39%;
              height: 25.24%;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: rgba(255,255,255,0.9);
              font-size: 52px;
              font-weight: 800;
              background: #0b5db8;
              border: 2px solid rgba(255, 255, 255, 0.9);
            }
            .field {
              position: absolute;
              z-index: 3;
              left: 8%;
              width: 84%;
              text-align: center;
              line-height: 1.08;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: clip;
              letter-spacing: 0;
              margin-bottom: 6px;
              padding-bottom: 4px;
              margin-top:4px;
            }
            .name {
              top: 46.15%;
              color: #fff;
              font-size: clamp(22px, 6.5vw, 44px);
              font-weight: 400;
              text-transform: uppercase;
            }
            .student-id {
              top: 52.25%;
              color: #ffc400;
              font-size: clamp(14px, 3.8vw, 26px);
              font-weight: 700;
            }
            .course {
              top: 61.0%;
              color: #fff;
              font-size: clamp(14px, 4.2vw, 28px);
              font-weight: 800;
            }
            .group-line {
              top: 67.0%;
              color: #fff;
              font-size: clamp(14px, 4vw, 28px);
              font-weight: 800;
            }
            .session {
              top: 73.0%;
              color: #fff;
              font-size: clamp(11px, 3vw, 22px);
              font-weight: 800;
            }
            .qr {
              position: absolute;
              z-index: 2;
              left: 28.4%;
              top: 53.55%;
              width: 43.2%;
              height: 28.4%;
              object-fit: contain;
              background: #fff;
              padding: 6%;
            }
            @media print {
              @page { size: 88mm 136mm; margin: 0; }
              html, body { width: 88mm; background: #fff; padding: 0; }
              body { display: block; }
              .page { width: 88mm; height: 136mm; }
              .name { font-size: 6.2mm; }
              .student-id { font-size: 4.2mm; }
              .course, .group-line { font-size: 4.4mm; }
              .session { font-size: 3.2mm; }
            }
          </style>
        </head>
        <body>
          <section class="page">
            <img class="template" src="${frontTemplate}" alt="${escapeHtml(title)} front" />
            ${
              profilePicUrl
                ? `<img class="student-photo" src="${profilePicUrl}" alt="${escapeHtml(profileData.name)}" />`
                : `<div class="placeholder-photo">${escapeHtml(profileData.name?.charAt(0)?.toUpperCase() || "S")}</div>`
            }
            <div class="field name" data-fit-text data-fit-min="14">${escapeHtml(profileData.name || "Student Name")}</div>
            <div class="field student-id" data-fit-text data-fit-min="10">Student ID : ${escapeHtml(studentId)}</div>
            <div class="field course" data-fit-text data-fit-min="10">${escapeHtml(isGcc ? "Training on Academic Literacy" : `Training on ${courseName}`)}</div>
            <div class="field group-line" data-fit-text data-fit-min="10">${escapeHtml(isGcc ? `Class : ${grade}` : `Batch : ${batchName}`)}</div>
            <div class="field session" data-fit-text data-fit-min="9">Academic Session : ${escapeHtml(session)}</div>
          </section>
          <section class="page">
            <img class="template" src="${backTemplate}" alt="Student card back" />
            <img class="qr" src="${qrCodeUrl}" alt="QR Code" />
          </section>
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
              }, 800);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const openCertificateGradeModal = (classObj) => {
    setCertificateCourse(classObj);
    setCertificateGrade("");
  };

  const closeCertificateGradeModal = () => {
    setCertificateCourse(null);
    setCertificateGrade("");
  };

  const handlePrintCertificate = () => {
    const classObj = certificateCourse;
    if (!classObj) return;

    const grade = certificateGrade.trim();
    if (!grade) {
      toast.error("Please enter a grade before printing certificate.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print certificate");
      return;
    }

    const certificateTemplate = getAbsoluteUrl(Image.ikCertificateTemplate);
    const studentId = getStudentId(profileData) || profileData.studentId || "";
    const courseName =
      classObj?.name || classObj?.courseName || classObj?.title || "Course";
    const guardianName =
      profileData.fatherName ||
      profileData.fathersName ||
      profileData.father_name ||
      profileData.fathername ||
      profileData.parentName ||
      "";
    const certificateNo = `IK${new Date().getFullYear().toString().slice(-2)}${String(
      studentId || profileData._id || Date.now(),
    )
      .replace(/\W/g, "")
      .slice(-7)
      .padStart(7, "0")}`;
    const fromDate = formatCertificateDate(
      classObj?.startDate || profileData.admissionDate || profileData.createdAt,
    );
    const toDate = formatCertificateDate(classObj?.endDate || new Date());
    const issueDate = formatCertificateDate(new Date());

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${escapeHtml(profileData.name || "Student")}</title>
          <style>
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, Helvetica, sans-serif; }
            body { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
            .certificate {
              position: relative;
              width: min(297mm, 100vw);
              aspect-ratio: 3508 / 2480;
              background: #fff;
              overflow: hidden;
              color: #2a176d;
            }
            .template {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 1;
            }
            .field {
              position: absolute;
              z-index: 2;
              text-align: center;
              font-family: Arial, Helvetica, sans-serif;
              font-weight: 800;
              color: #2d2078;
              line-height: 1.05;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: clip;
              letter-spacing: 0;
            }
            .student-name {
              left: 33.2%;
              top: 49.05%;
              width: 18.6%;
              font-size: clamp(14px, 2vw, 38px);
            }
            .relation {
              left: 51.7%;
              top: 49.45%;
              width: 10.2%;
              color: #5b3191;
              font-family: "Times New Roman", serif;
              font-size: clamp(13px, 1.65vw, 31px);
              font-style: italic;
              font-weight: 700;
            }
            .guardian-name {
              left: 61.7%;
              top: 49.05%;
              width: 19.2%;
              font-size: clamp(14px, 2vw, 38px);
            }
            .reg-no {
              left: 53.2%;
              top: 58.03%;
              width: 13.5%;
              font-size: clamp(13px, 1.75vw, 32px);
            }
            .cert-no {
              left: 80.2%;
              top: 58.03%;
              width: 13.2%;
              font-size: clamp(13px, 1.75vw, 32px);
            }
            .course-name {
              left: 55.3%;
              top: 64.85%;
              width: 36.5%;
              text-align: left;
              font-size: clamp(13px, 1.85vw, 35px);
            }
            .from-date {
              left: 42.8%;
              top: 72.1%;
              width: 11.8%;
              font-size: clamp(13px, 1.7vw, 32px);
            }
            .to-date {
              left: 56.0%;
              top: 72.1%;
              width: 12%;
              font-size: clamp(13px, 1.7vw, 32px);
            }
            .grade {
              left: 77.4%;
              top: 72.1%;
              width: 8%;
              font-size: clamp(13px, 1.75vw, 34px);
            }
            .issue-date {
              left: 42.2%;
              top: 90.07%;
              width: 12%;
              font-size: clamp(13px, 1.7vw, 32px);
            }
            @media print {
              @page { size: A4 landscape; margin: 0; }
              html, body { width: 297mm; height: 210mm; background: #fff; }
              .certificate { width: 297mm; height: 210mm; }
              .student-name, .guardian-name { font-size: 7.2mm; }
              .relation { font-size: 6.2mm; }
              .reg-no, .cert-no, .course-name, .from-date, .to-date, .grade, .issue-date { font-size: 5.6mm; }
            }
          </style>
        </head>
        <body>
          <section class="certificate">
            <img class="template" src="${certificateTemplate}" alt="Certificate template" />
            <div class="field student-name" data-fit-text data-fit-min="12">${escapeHtml(profileData.name || "Student Name")}</div>
            <div class="field relation">${escapeHtml(guardianName ? "Son of" : "")}</div>
            <div class="field guardian-name" data-fit-text data-fit-min="12">${escapeHtml(guardianName)}</div>
            <div class="field reg-no" data-fit-text data-fit-min="10">${escapeHtml(studentId || "-")}</div>
            <div class="field cert-no" data-fit-text data-fit-min="10">${escapeHtml(certificateNo)}</div>
            <div class="field course-name" data-fit-text data-fit-min="10">${escapeHtml(courseName.toUpperCase())}</div>
            <div class="field from-date" data-fit-text data-fit-min="9">${escapeHtml(fromDate || "-")}</div>
            <div class="field to-date" data-fit-text data-fit-min="9">${escapeHtml(toDate || "-")}</div>
            <div class="field grade" data-fit-text data-fit-min="9">${escapeHtml(grade.toUpperCase())}</div>
            <div class="field issue-date" data-fit-text data-fit-min="9">${escapeHtml(issueDate)}</div>
          </section>
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
              }, 800);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    closeCertificateGradeModal();
  };

  if (isLoading || !profileData) {
    return (
      <div className="min-h-screen relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 bg-background text-foreground font-sans transition-colors duration-300">
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          {/* Header Actions Skeleton */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="w-24 h-10 bg-muted/60 animate-pulse rounded-xl"></div>
            <div className="w-32 h-10 bg-muted/60 animate-pulse rounded-xl"></div>
          </div>

          {/* Profile Banner Skeleton */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center shadow-sm">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-muted/60 animate-pulse shrink-0"></div>
            <div className="flex-1 w-full flex flex-col items-center sm:items-start gap-3">
              <div className="w-48 h-8 bg-muted/60 animate-pulse rounded-md"></div>
              <div className="flex gap-2">
                <div className="w-24 h-8 bg-muted/60 animate-pulse rounded-lg"></div>
                <div className="w-32 h-8 bg-muted/60 animate-pulse rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 bg-card border border-border rounded-2xl animate-pulse"></div>
            <div className="h-72 bg-card border border-border rounded-2xl animate-pulse"></div>
          </div>

          {/* Sections Skeleton */}
          <div className="h-48 bg-card border border-border rounded-2xl animate-pulse"></div>
          <div className="h-48 bg-card border border-border rounded-2xl animate-pulse"></div>
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
        <p className="text-sm sm:text-base font-semibold text-foreground break-all">
          {value || "Not Provided"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative px-4 sm:px-6 md:px-8 py-6 sm:py-8 bg-background text-foreground font-sans transition-colors duration-300">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
          <BackButton />
          <div className="flex items-center gap-2 sm:gap-3">
            {!isEditing && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintStudentCard("ik")}
                  className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Printer
                    size={16}
                    className="group-hover:-translate-y-0.5 transition-transform"
                  />
                  <span className="hidden sm:inline">Print IK</span>
                </button>
                <button
                  onClick={() => handlePrintStudentCard("gcc")}
                  className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-slate-900/20 active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  <Printer
                    size={16}
                    className="group-hover:-translate-y-0.5 transition-transform"
                  />
                  <span className="hidden sm:inline">Print GCC</span>
                </button>
              </div>
            )}
            {isAdmin && !isSelf && !isEditing && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="group flex items-center gap-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-destructive/20 shadow-sm active:scale-95"
              >
                <Trash2 size={16} />{" "}
                <span className="hidden sm:inline">Delete Student</span>
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
              Administrators can edit details or modify progress.
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
                    <span className="flex items-center gap-1.5 text-sm text-accent-foreground font-bold bg-accent border border-border px-3 py-1.5 rounded-lg shadow-sm">
                      <GraduationCap size={14} /> Student
                    </span>
                    {profileData._id && (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground font-bold bg-muted border border-border px-3 py-1.5 rounded-lg shadow-sm">
                        ID: {getStudentId(profileData)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Details */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
                  <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-2">
                    <UserCheck className="text-primary" size={18} />
                    <h3 className="font-bold text-foreground">
                      Contact & Personal Details
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
                    {profileData.fatherName && (
                      <InfoRow
                        icon={User}
                        label="Father's Name"
                        value={profileData.fatherName}
                      />
                    )}
                    {profileData.dob && (
                      <InfoRow
                        icon={Calendar}
                        label="Date of Birth"
                        value={formatDate(profileData.dob)}
                      />
                    )}
                    {profileData.gender && (
                      <InfoRow
                        icon={User}
                        label="Gender"
                        value={profileData.gender}
                      />
                    )}
                    {profileData.nationality && (
                      <InfoRow
                        icon={Flag}
                        label="Nationality"
                        value={profileData.nationality}
                      />
                    )}
                    {profileData.address && (
                      <InfoRow
                        icon={MapPin}
                        label="Address"
                        value={profileData.address}
                      />
                    )}
                    <InfoRow
                      icon={Calendar}
                      label="Admission Date"
                      value={formatDate(profileData.createdAt)}
                    />
                  </div>
                </div>

                {/* Academic Status */}
                <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-fit">
                  <div className="bg-muted/30 p-4 border-b border-border flex items-center gap-2">
                    <Shield className="text-primary" size={18} />
                    <h3 className="font-bold text-foreground">
                      Academic Status
                    </h3>
                  </div>
                  <div className="divide-y divide-border/50">
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
                        label="Marks"
                        value={`${profileData.marksObtained}`}
                      />
                    )}
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
                  </div>
                </div>
              </div>

              {/* Main Classes & Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="text-primary" size={22} /> Enrolled
                    Course Progress
                  </h3>
                  <button
                    onClick={() => setShowProgress(!showProgress)}
                    className="text-sm font-medium bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg text-foreground transition-colors flex items-center gap-1.5"
                  >
                    {showProgress ? "Hide" : "Show"}
                    {showProgress ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {showProgress && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        {profileData.mainClasses?.length > 0 ? (
                          <div className="space-y-4">
                            {profileData.mainClasses.map((mainClassObj) => {
                              const classObj =
                                typeof mainClassObj === "string"
                                  ? {
                                      _id: mainClassObj,
                                      name: "Loading...",
                                      duration: "-",
                                      fees: "-",
                                    }
                                  : mainClassObj;

                              const progress = detailedProgress[classObj._id];

                              return (
                                <div
                                  key={classObj._id}
                                  className="bg-card rounded-2xl p-6 border border-border shadow-sm"
                                >
                                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                                    <div>
                                      <h3 className="text-lg font-bold text-foreground">
                                        {classObj.name}
                                      </h3>
                                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                          <Calendar size={14} />{" "}
                                          {classObj.duration || "-"} Months
                                        </span>
                                        {classObj.startDate && (
                                          <span className="bg-muted px-2 py-0.5 rounded text-xs border border-border">
                                            Start:{" "}
                                            {formatDate(classObj.startDate)}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
                                      <span className="text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                                        ₹ {classObj.fees || "-"}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openCertificateGradeModal(classObj)
                                        }
                                        className="text-sm font-semibold bg-success/10 hover:bg-success/20 text-success px-4 py-1.5 rounded-full border border-success/20 transition-colors flex items-center gap-1.5"
                                      >
                                        <Printer size={14} />
                                        Print Certificate
                                      </button>
                                    </div>
                                  </div>

                                  {progress ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      {[
                                        {
                                          key: "courseComplete",
                                          field: "batchcompletion",
                                          icon: BookOpen,
                                          label: "Course Completed",
                                          color: "primary",
                                        },
                                        {
                                          key: "examComplete",
                                          field: "examcompletion",
                                          icon: FileText,
                                          label: "Exam Cleared",
                                          color: "accent",
                                        },
                                        {
                                          key: "certificateComplete",
                                          field: "certificateIssued",
                                          icon: Check,
                                          label: "Certificate Issued",
                                          color: "success",
                                        },
                                      ].map(
                                        ({
                                          key: fieldKey,
                                          field,
                                          icon: Icon,
                                          label,
                                          color,
                                        }) => {
                                          const isComplete = progress[field];
                                          const statusColors = isComplete
                                            ? color === "primary"
                                              ? "bg-primary/5 border-primary/40 text-primary"
                                              : color === "accent"
                                                ? "bg-accent/5 border-accent-foreground/40 text-accent-foreground"
                                                : "bg-success/5 border-success/40 text-success"
                                            : "bg-background border-border/60 text-muted-foreground";

                                          return (
                                            <button
                                              key={fieldKey}
                                              onClick={() =>
                                                toggleProgressCheckbox(
                                                  classObj._id,
                                                  field,
                                                )
                                              }
                                              disabled={
                                                !canEdit ||
                                                loadingProgress[
                                                  `${classObj._id}_${field}`
                                                ]
                                              }
                                              className={`relative rounded-xl p-4 border-2 transition-all flex flex-col justify-between h-full text-left ${statusColors} ${canEdit ? "hover:-translate-y-1 hover:shadow-md cursor-pointer" : "opacity-90 cursor-not-allowed"}`}
                                            >
                                              <div className="flex items-start justify-between mb-3 w-full">
                                                <div
                                                  className={`p-2.5 rounded-lg ${isComplete ? "bg-current/10" : "bg-muted"}`}
                                                >
                                                  <Icon size={18} />
                                                </div>
                                                {isComplete && (
                                                  <div
                                                    className={`p-1 rounded-full text-white ${color === "primary" ? "bg-primary" : color === "accent" ? "bg-accent-foreground" : "bg-success"}`}
                                                  >
                                                    <Check
                                                      size={14}
                                                      strokeWidth={3}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                              <div>
                                                <p
                                                  className={`font-semibold text-sm ${isComplete ? "text-foreground" : ""}`}
                                                >
                                                  {label}
                                                </p>
                                                <p className="text-xs opacity-70 mt-1">
                                                  {isComplete
                                                    ? "Completed"
                                                    : canEdit
                                                      ? "Click to toggle"
                                                      : "Pending"}
                                                </p>
                                              </div>
                                            </button>
                                          );
                                        },
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-full py-6 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-muted-foreground">
                                        No batch assign
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-card rounded-2xl border border-border border-dashed p-10 text-center flex flex-col items-center justify-center">
                            <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
                            <h3 className="font-semibold text-foreground">
                              No Classes Enrolled
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Student hasn't enrolled in any main classes yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Batches Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="text-primary" size={22} /> Assigned
                    Batches
                  </h3>
                  <button
                    onClick={() => setShowBatches(!showBatches)}
                    className="text-sm font-medium bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg text-foreground transition-colors flex items-center gap-1.5"
                  >
                    {showBatches ? "Hide" : "Show"}
                    {showBatches ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
                <AnimatePresence initial={false}>
                  {showBatches && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2">
                        {profileData.batches?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {profileData.batches.map((batchObj) => {
                              const batch =
                                typeof batchObj === "string"
                                  ? {
                                      _id: batchObj,
                                      name: "Loading Data...",
                                      weekday: "-",
                                      startTime: "-",
                                      endTime: "-",
                                    }
                                  : batchObj;
                              return (
                                <div
                                  key={batch._id}
                                  className="bg-card rounded-2xl p-5 border border-border shadow-sm"
                                >
                                  <h3 className="font-bold text-foreground mb-3 truncate">
                                    {batch.name}
                                  </h3>
                                  <div className="space-y-2">
                                    <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-2 rounded-md">
                                      <Calendar
                                        size={14}
                                        className="mr-2 text-primary"
                                      />
                                      <span className="font-medium text-foreground">
                                        {batch.weekday}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-2 rounded-md">
                                      <div className="w-1.5 h-1.5 rounded-full bg-success mr-2.5 ml-1"></div>
                                      {batch.startTime} - {batch.endTime}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-card rounded-2xl border border-border border-dashed p-8 text-center flex flex-col items-center">
                            <Clock className="w-8 h-8 text-muted-foreground/40 mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No batches assigned.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Documents Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="text-primary" size={22} /> Uploaded
                    Documents
                  </h3>
                  <button
                    onClick={() => setShowDocuments(!showDocuments)}
                    className="text-sm font-medium bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg text-foreground transition-colors flex items-center gap-1.5"
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
                      <div className="pt-2">
                        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-6">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {profileData.documents?.length > 0 ? (
                              profileData.documents.map((docUrl, idx) => (
                                <div
                                  key={idx}
                                  onClick={() =>
                                    setActiveDocument({
                                      url: docUrl,
                                      name: `Document ${idx + 1}`,
                                    })
                                  }
                                  className="cursor-pointer bg-muted border border-border rounded-xl overflow-hidden h-32 group relative shadow-sm"
                                >
                                  <img
                                    src={docUrl}
                                    alt={`Doc ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <ZoomIn className="text-white" size={20} />
                                    <span className="text-white text-xs font-semibold px-2">
                                      View
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full py-8 text-center text-muted-foreground bg-muted/30 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2">
                                <FileText size={24} className="opacity-40" />
                                <p className="text-sm">
                                  No documents available.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    Edit Student Details
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
                  {/* Mapping Fields with Select Support */}
                  {[
                    {
                      label: "Full Name",
                      name: "name",
                      icon: User,
                      type: "text",
                      req: true,
                    },
                    {
                      label: "Father's Name",
                      name: "fatherName",
                      icon: User,
                      type: "text",
                      req: false,
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
                    {
                      label: "Date of Birth",
                      name: "dob",
                      icon: Calendar,
                      type: "date",
                    },
                    {
                      label: "Nationality",
                      name: "nationality",
                      icon: Flag,
                      type: "select",
                      options: COUNTRIES,
                    },
                    {
                      label: "Address",
                      name: "address",
                      icon: MapPin,
                      type: "text",
                    },
                    {
                      label: "Stream",
                      name: "stream",
                      icon: BookOpen,
                      type: "select",
                      options: [
                        "Science",
                        "Commerce",
                        "Arts",
                        "Vocational",
                        "Diploma",
                        "B.Tech",
                        "Other",
                      ],
                    },
                    {
                      label: "Grade",
                      name: "grade",
                      icon: GraduationCap,
                      type: "text",
                    },
                    {
                      label: "Marks Obtained",
                      name: "marksObtained",
                      icon: FileText,
                      type: "number",
                    },
                    {
                      label: "Aadhar Number",
                      name: "adhar",
                      icon: Hash,
                      type: "text",
                      placeholder: "12-digit number",
                    },
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
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

                        {field.type === "select" ? (
                          <select
                            name={field.name}
                            value={formData[field.name] || ""}
                            onChange={handleInputChange}
                            required={field.req}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow appearance-none"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            name={field.name}
                            value={
                              field.type === "date" && formData[field.name]
                                ? formData[field.name].split("T")[0]
                                : formData[field.name] || ""
                            }
                            onChange={handleInputChange}
                            required={field.req}
                            placeholder={field.placeholder}
                            className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-shadow"
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Gender Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">
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
                        className="w-full pl-10 pr-4 py-3 text-sm border border-border rounded-xl bg-background appearance-none outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Document Uploader */}
                  <div className="col-span-1 md:col-span-2 mt-4 p-6 border-2 border-dashed border-border rounded-xl bg-muted/30">
                    <label className="text-sm font-bold block mb-3 text-foreground">
                      Update Documents (JPG/PNG Only)
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleDocChange}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-colors mb-4"
                    />

                    {(existingDocuments.length > 0 ||
                      newDocuments.length > 0) && (
                      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {existingDocuments.map((docUrl, idx) => (
                          <div
                            key={`existing-${idx}`}
                            className="relative group rounded-xl overflow-hidden h-28 border border-border shadow-sm"
                          >
                            <img
                              src={docUrl}
                              alt="Saved Doc"
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() =>
                                setActiveDocument({
                                  url: docUrl,
                                  name: `Saved Document ${idx + 1}`,
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingDocument(docUrl)}
                              className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-all z-10"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                              Saved
                            </span>
                          </div>
                        ))}
                        {newDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="relative group rounded-xl overflow-hidden h-28 border border-border shadow-sm"
                          >
                            <img
                              src={doc.previewUrl}
                              alt="New Doc"
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() =>
                                setActiveDocument({
                                  url: doc.previewUrl,
                                  name: doc.file.name,
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeNewDocument(doc.id)}
                              className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-all z-10"
                            >
                              <X size={14} strokeWidth={3} />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-success/80 text-success-foreground text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                              New
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

        {/* Document Viewer Modal */}
        {activeDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-5xl flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-white" size={24} />
                  <h3 className="font-medium text-white text-lg">
                    {activeDocument.name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDocument(null)}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <X size={28} />
                </button>
              </div>
              <img
                src={activeDocument.url}
                alt={activeDocument.name}
                className="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded-sm"
              />
            </motion.div>
          </motion.div>
        )}

        {certificateCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeCertificateGradeModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card p-6 rounded-2xl shadow-xl max-w-md w-full border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Certificate Grade
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {certificateCourse.name ||
                      certificateCourse.courseName ||
                      certificateCourse.title ||
                      "Course"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCertificateGradeModal}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close certificate grade dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <label className="block text-sm font-semibold text-foreground mb-2">
                Enter Grade
              </label>
              <input
                type="text"
                value={certificateGrade}
                onChange={(e) => setCertificateGrade(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePrintCertificate();
                }}
                autoFocus
                placeholder="Example: AA"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />

              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-border">
                <button
                  type="button"
                  onClick={closeCertificateGradeModal}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="px-5 py-2 rounded-xl bg-success hover:opacity-90 text-success-foreground font-semibold flex items-center gap-2 transition-all"
                >
                  <Printer size={16} />
                  Print
                </button>
              </div>
            </motion.div>
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

export default StudentProfile;
