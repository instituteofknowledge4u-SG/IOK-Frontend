import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Edit3, Save, X, ZoomIn, Shield, Mail, Phone, MapPin, Hash, BookOpen,
  GraduationCap, Calendar, Flag, UserCheck, Clock, FileText, Check, Trash2,
  ShieldAlert, ChevronDown, ChevronUp, Printer, Download, Image as ImageIcon
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

// --- Dynamic Avatar Placeholder Component ---
const AvatarPlaceholder = ({ name, className = "", size = "large" }) => {
  const gradients = [
    "bg-gradient-to-br from-pink-500 to-orange-400",
    "bg-gradient-to-br from-purple-500 to-indigo-500",
    "bg-gradient-to-br from-blue-500 to-cyan-500",
    "bg-gradient-to-br from-emerald-500 to-teal-400",
    "bg-gradient-to-br from-rose-500 to-red-500",
    "bg-gradient-to-br from-amber-500 to-pink-500"
  ];
  
  let hash = 0;
  const safeName = name || "User";
  for (let i = 0; i < safeName.length; i++) {
    hash = safeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const bg = gradients[Math.abs(hash) % gradients.length];
  const initials = safeName.substring(0, 2).toUpperCase();
  const fontSize = size === "large" ? "text-4xl" : "text-xl";

  return (
    <div className={`flex items-center justify-center text-white font-bold tracking-wider shadow-inner ${bg} ${className} ${fontSize}`}>
      {initials}
    </div>
  );
};

// --- UPDATED: Print Preview Modal Component (With PNG Download) ---
const PrintPreviewModal = ({ html, title, onClose }) => {
  const iframeRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownloadPNG = () => {
    if (iframeRef.current && iframeRef.current.contentWindow.downloadAsImage) {
      setIsDownloading(true);
      const filename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      // Call the function injected inside the iframe's HTML
      iframeRef.current.contentWindow.downloadAsImage(filename)
        .then(() => setIsDownloading(false))
        .catch(() => {
          setIsDownloading(false);
          toast.error("Failed to generate image. Please try printing to PDF instead.");
        });
    } else {
      toast.error("Download script is still loading, please wait a second.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-card w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border bg-muted/30 gap-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><Printer size={20} className="text-primary"/> {title || "Print Preview"}</h3>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={handleDownloadPNG} disabled={isDownloading} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 shadow-sm disabled:opacity-70">
              <ImageIcon size={16} /> {isDownloading ? "Generating..." : "Download PNG"}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg font-semibold transition-all active:scale-95 shadow-sm">
              <Download size={16} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"><X size={20} /></button>
          </div>
        </div>
        <div className="flex-1 bg-gray-500/10 p-2 sm:p-4 overflow-hidden relative">
           <iframe ref={iframeRef} srcDoc={html} className="w-full h-full bg-white rounded-xl shadow-inner border-0" title="Print Preview" />
        </div>
      </motion.div>
    </motion.div>
  );
};

const ProfilePage = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Route State & Auth
  const targetUserId = location.state?.userId || location.state?.studentId || location.state?.teacherId;
  const targetUserData = location.state?.userData || location.state?.studentData || location.state?.teacherData;

  const loggedInUser = useAuthStore((state) => state.user);
  const loggedInUserRole = useAuthStore((state) => state.userRole);
  
  const activeUserId = useMemo(() => targetUserId || loggedInUser?._id, [targetUserId, loggedInUser?._id]);
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

  const [showProgress, setShowProgress] = useState(true);
  const [showBatches, setShowBatches] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);

  // Modals & Viewers
  const [activeDocument, setActiveDocument] = useState(null);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Print Preview States
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");

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

  // Role Logic Memoized
  const targetRole = useMemo(() => profileData?.role || targetUserData?.role || "Student", [profileData?.role, targetUserData?.role]);
  const isTargetAdmin = targetRole === "Admin" || targetRole?.toLowerCase() === "admin";
  const isTargetTeacher = targetRole === "Teacher" || targetRole?.toLowerCase() === "teacher";
  const isTargetStudent = !isTargetAdmin && !isTargetTeacher;

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

    if (loggedInUserRole === "Teacher" && !isSelf) {
      if (targetUserData?.role === "Teacher" || targetRole === "Teacher") {
        setAccessDenied(true);
        toast.error("You cannot view other teachers' profiles");
        navigate("/access-denied");
        return;
      }

      if (batches.length > 0) {
        const teacherBatches = filterBatchesForTeacher(batches, loggedInUser?.batches || [], loggedInUserRole, loggedInUser?.email, loggedInUser?._id);
        const canAccess = canTeacherAccessStudent(activeUserId, teacherBatches, loggedInUserRole);
        if (!canAccess) {
          setAccessDenied(true);
          toast.error("You can only view students from your assigned batches");
          navigate("/access-denied");
          return;
        }
      }
    }

    let isMounted = true;

    const loadProfileData = async () => {
      let currentData = null;
      if (isSelf) {
        currentData = loggedInUser;
      } else if (targetUserData && targetUserData._id === activeUserId) {
        currentData = targetUserData;
      }

      if (currentData) {
        setProfileData(currentData);
        setFormData(currentData);
        setIsLoading(false); 
      } else {
        setIsLoading(true);
      }

      try {
        const response = await getUserById(activeUserId);
        const freshData = response?.data?.user || response?.user || response?.data || response;
        
        if (isMounted && freshData && freshData._id) {
          setProfileData(freshData);
          setFormData(freshData);

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

                    if (studentProg && isMounted) {
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
            if(isMounted){
                setProfileData((prev) => ({ ...prev, mainClasses: populatedClasses }));
                setFormData((prev) => ({ ...prev, mainClasses: populatedClasses }));
            }
          }
        }
      } catch (error) {
        if (!currentData && isMounted) {
            toast.error("Failed to load profile data");
            navigate("/");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProfileData();
    return () => { isMounted = false; };
  }, [activeUserId, isSelf, loggedInUser, navigate, getUserById, batches, loggedInUserRole, targetRole, targetUserData, getMainClassById]);

  const toggleProgressCheckbox = useCallback(async (mainClassId, field) => {
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
  }, [detailedProgress, getStudentProgress, isAdmin]);

  const cleanupPreviews = useCallback(() => {
    if (newProfilePreview) URL.revokeObjectURL(newProfilePreview);
    newDocuments.forEach((doc) => URL.revokeObjectURL(doc.previewUrl));
  }, [newProfilePreview, newDocuments]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setExistingDocuments(profileData.documents || []);
  }, [profileData]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setFormData(profileData);
    cleanupPreviews();
    setNewProfilePic(null);
    setNewProfilePreview(null);
    setNewDocuments([]);
    setExistingDocuments([]);
  }, [profileData, cleanupPreviews]);

  useEffect(() => {
    if (!isEditing) return;
    const handlePopState = () => cancelEdit();
    window.history.pushState({ profileEdit: true }, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isEditing, cancelEdit]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "adhar") {
      const onlyNumbers = value.replace(/\D/g, "");
      const maxLength = name === "phone" ? 10 : 12;
      if (onlyNumbers.length <= maxLength) {
        setFormData(prev => ({ ...prev, [name]: onlyNumbers }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

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

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  }, []);

  const escapeHtml = useCallback((value = "") => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"), []);

  const getAbsoluteUrl = useCallback((path) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;
    return window.location.origin + (path.startsWith("/") ? path : `/${path}`);
  }, []);

  const getMainClassName = useCallback(() => {
    const mainClass = profileData.mainClasses?.[0];
    if (!mainClass) return "DCA";
    return mainClass.name || mainClass.courseName || mainClass.title || "DCA";
  }, [profileData]);

  const getBatchName = useCallback(() => {
    const batch = profileData.batches?.[0];
    if (!batch) return "Computer";
    return batch.name || batch.batchName || "Computer";
  }, [profileData]);

  // --- UPDATED HTML GENERATORS (Added Fonts & Download Script) ---
  const handlePrintStudentCard = (cardType) => {
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

    const html = `<!DOCTYPE html><html><head>
      <title>${escapeHtml(isGcc ? "GCC Admit Card" : "IK Student ID Card")} - ${escapeHtml(profileData.name)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
        *{box-sizing:border-box} html,body{margin:0;background:#111;font-family:'Montserrat',sans-serif;}
        body{padding:18px;display:flex;flex-direction:column;align-items:center;gap:18px}
        #capture-area { display:flex; flex-direction:column; gap:20px; align-items:center; background: transparent; }
        .page{position:relative;width:min(88mm,calc(100vw - 24px));aspect-ratio:6496/10039;overflow:hidden;background:#000;color:#fff;break-after:page}
        .page:last-child{break-after:auto} .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
        .student-photo,.placeholder-photo{position:absolute;z-index:2;left:50%;top:27.8%;transform:translate(-50%,-50%);width:44%;height:28.5%;border-radius:50%;object-fit:cover;background:#0b5db8;border:2px solid rgba(255,255,255,0.9)}
        .placeholder-photo{display:flex;align-items:center;justify-content:center;font-size:52px;font-weight:800}
        .field{position:absolute;z-index:3;left:8%;width:84%;text-align:center;line-height:1.08;white-space:nowrap;overflow:hidden;margin-bottom:6px;padding-bottom:4px;margin-top:4px}
        .name{top:46.15%;color:#fff;font-size:clamp(22px,6.5vw,44px);font-weight:700;text-transform:uppercase}
        .student-id{top:52.25%;color:#ffc400;font-size:clamp(14px,3.8vw,26px);font-weight:800}
        .course{top:61.0%;color:#fff;font-size:clamp(14px,4.2vw,28px);font-weight:800}
        .group-line{top:67.0%;color:#fff;font-size:clamp(14px,4vw,28px);font-weight:800}
        .session{top:73.0%;color:#fff;font-size:clamp(11px,3vw,22px);font-weight:800}
        .qr{position:absolute;z-index:2;left:28.4%;top:53.55%;width:43.2%;height:28.4%;object-fit:contain;background:#fff;padding:6%}
        @media print{
          @page{size:88mm 136mm;margin:0} 
          html,body{width:88mm;background:#fff;padding:0} 
          body{display:block} 
          #capture-area{gap:0; display:block;}
          .page{width:88mm;height:136mm} 
          .name{font-size:6.2mm} 
          .student-id{font-size:4.2mm} 
          .course,.group-line{font-size:4.4mm} 
          .session{font-size:3.2mm}
        }
      </style></head><body>
      <div id="capture-area">
        <section class="page"><img class="template" crossorigin="anonymous" src="${frontTemplate}" />
        ${profilePicUrl ? `<img class="student-photo" crossorigin="anonymous" src="${profilePicUrl}" />` : `<div class="placeholder-photo">${escapeHtml(profileData.name?.charAt(0)?.toUpperCase() || "S")}</div>`}
        <div class="field name" data-fit-text>${escapeHtml(profileData.name)}</div>
        <div class="field student-id" data-fit-text>Student ID : ${escapeHtml(studentId)}</div>
        <div class="field course" data-fit-text>${escapeHtml(isGcc ? "Training on Academic Literacy" : `Training on ${getMainClassName()}`)}</div>
        <div class="field group-line" data-fit-text>${escapeHtml(isGcc ? `Class : ${profileData.grade || profileData.class || "VIII"}` : `Batch : ${getBatchName()}`)}</div>
        <div class="field session" data-fit-text>Academic Session : ${escapeHtml(session)}</div></section>
        <section class="page"><img class="template" crossorigin="anonymous" src="${backTemplate}" /><img class="qr" crossorigin="anonymous" src="${qrCodeUrl}" /></section>
      </div>
      <script>
        function fitTextFields(){document.querySelectorAll("[data-fit-text]").forEach(function(el){var min=9;var size=parseFloat(window.getComputedStyle(el).fontSize);el.style.fontSize=size+"px";while(el.scrollWidth>el.clientWidth&&size>min){size-=0.5;el.style.fontSize=size+"px";}});}
        window.onload=function(){setTimeout(function(){fitTextFields();},600);};
        window.downloadAsImage = function(filename) {
          return html2canvas(document.getElementById('capture-area'), { useCORS: true, scale: 3, backgroundColor: null }).then(canvas => {
            let link = document.createElement('a');
            link.download = filename + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          });
        };
      </script></body></html>`;
      
      setPreviewTitle(isGcc ? "GCC Admit Card Preview" : "IK Student ID Preview");
      setPreviewHtml(html);
  };

  const handlePrintCertificate = () => {
    if (!certificateCourse) return;
    const grade = certificateGrade.trim();
    if (!grade) return toast.error("Please enter a grade before viewing certificate.");

    const template = getAbsoluteUrl(Image.ikCertificateTemplate);
    const studentId = getStudentId(profileData) || profileData.studentId || "";
    const certNo = `IK${new Date().getFullYear().toString().slice(-2)}${String(studentId || profileData._id).replace(/\W/g, "").slice(-7).padStart(7, "0")}`;
    const fmtCertDate = (v) => { const d = new Date(v||Date.now()); return [String(d.getDate()).padStart(2, "0"), String(d.getMonth() + 1).padStart(2, "0"), d.getFullYear()].join("."); };
    
    const html = `<!DOCTYPE html><html><head>
      <title>Certificate - ${escapeHtml(profileData.name)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,600;0,800;1,600&display=swap" rel="stylesheet">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
        *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact} 
        html,body{margin:0;padding:0;background:#f3f4f6;font-family:Arial;} 
        body{min-height:100vh;display:flex;align-items:center;justify-content:center}
        #capture-area { position:relative; width:min(297mm,100vw); aspect-ratio:3508/2480; background:#fff; overflow:hidden; color:#2a176d; box-shadow: 0 10px 30px rgba(0,0,0,0.1); } 
        .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
        .field{position:absolute;z-index:2;text-align:center;font-weight:800;color:#2d2078;line-height:1.05;white-space:nowrap;overflow:hidden}
        .student-name{left:33.2%;top:49.05%;width:18.6%;font-size:clamp(14px,2vw,38px); font-family: 'Cinzel', serif;} 
        .relation{left:51.7%;top:49.45%;width:10.2%;color:#5b3191;font-family:"Playfair Display",serif;font-style:italic;font-size:clamp(13px,1.65vw,31px)}
        .guardian-name{left:61.7%;top:49.05%;width:19.2%;font-size:clamp(14px,2vw,38px); font-family: 'Playfair Display', serif;} 
        .reg-no{left:53.2%;top:58.03%;width:13.5%;font-size:clamp(13px,1.75vw,32px); font-family: 'Playfair Display', serif;} 
        .cert-no{left:80.2%;top:58.03%;width:13.2%;font-size:clamp(13px,1.75vw,32px); font-family: 'Playfair Display', serif;}
        .course-name{left:55.3%;top:64.85%;width:36.5%;text-align:left;font-size:clamp(13px,1.85vw,35px); font-family: 'Cinzel', serif;} 
        .from-date{left:42.8%;top:72.1%;width:11.8%;font-size:clamp(13px,1.7vw,32px); font-family: 'Playfair Display', serif;} 
        .to-date{left:56.0%;top:72.1%;width:12%;font-size:clamp(13px,1.7vw,32px); font-family: 'Playfair Display', serif;}
        .grade{left:77.4%;top:72.1%;width:8%;font-size:clamp(13px,1.75vw,34px); font-family: 'Cinzel', serif;} 
        .issue-date{left:42.2%;top:90.07%;width:12%;font-size:clamp(13px,1.7vw,32px); font-family: 'Playfair Display', serif;}
        @media print{
          @page{size:A4 landscape;margin:0} 
          html,body{width:297mm;height:210mm;background:#fff;display:block;} 
          #capture-area{width:297mm;height:210mm; box-shadow:none;} 
          .student-name,.guardian-name{font-size:7.2mm} .relation{font-size:6.2mm} 
          .reg-no,.cert-no,.course-name,.from-date,.to-date,.grade,.issue-date{font-size:5.6mm}
        }
      </style></head><body>
      <section id="capture-area">
        <img class="template" crossorigin="anonymous" src="${template}" />
        <div class="field student-name" data-fit-text>${escapeHtml(profileData.name)}</div>
        <div class="field relation">${escapeHtml(profileData.fatherName ? "Son of" : "")}</div>
        <div class="field guardian-name" data-fit-text>${escapeHtml(profileData.fatherName || "")}</div>
        <div class="field reg-no" data-fit-text>${escapeHtml(studentId || "-")}</div>
        <div class="field cert-no" data-fit-text>${escapeHtml(certNo)}</div>
        <div class="field course-name" data-fit-text>${escapeHtml((certificateCourse?.name || certificateCourse?.courseName || "Course").toUpperCase())}</div>
        <div class="field from-date" data-fit-text>${escapeHtml(fmtCertDate(certificateCourse?.startDate || profileData.admissionDate || profileData.createdAt))}</div>
        <div class="field to-date" data-fit-text>${escapeHtml(fmtCertDate(certificateCourse?.endDate))}</div>
        <div class="field grade" data-fit-text>${escapeHtml(grade.toUpperCase())}</div>
        <div class="field issue-date" data-fit-text>${escapeHtml(fmtCertDate())}</div>
      </section>
      <script>
        function fitTextFields(){document.querySelectorAll("[data-fit-text]").forEach(function(el){var min=9;var size=parseFloat(window.getComputedStyle(el).fontSize);el.style.fontSize=size+"px";while(el.scrollWidth>el.clientWidth&&size>min){size-=0.5;el.style.fontSize=size+"px";}});}
        window.onload=function(){setTimeout(function(){fitTextFields();},600);};
        window.downloadAsImage = function(filename) {
          return html2canvas(document.getElementById('capture-area'), { useCORS: true, scale: 3 }).then(canvas => {
            let link = document.createElement('a');
            link.download = filename + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          });
        };
      </script></body></html>`;
    
    setPreviewTitle("Certificate Preview");
    setPreviewHtml(html);
    setCertificateCourse(null);
    setCertificateGrade("");
  };

  const handlePrintTeacherCard = () => {
    const template = getAbsoluteUrl(Image.teacherIdCardTemplate);
    const photo = getAbsoluteUrl(profileData.profilePic || "");
    const dept = profileData.department || profileData.dept || (allClass?.find(c => c.teacherEmail === profileData.email)?.name) || "Information Technology (IT)";
    const empId = profileData.employeeId || profileData.employeeID || profileData.teacherId || `IK${String(profileData.createdAt ? new Date(profileData.createdAt).getMonth() + 1 : "00").padStart(2, "0")}${new Date().getFullYear()}A${String((parseInt(profileData._id.slice(-6), 16) || 0) % 1000 + 1).padStart(3, "0")}`;
    
    const html = `<!DOCTYPE html><html><head>
      <title>Teacher ID Card - ${escapeHtml(profileData.name)}</title>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap" rel="stylesheet">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <style>
        *{box-sizing:border-box} html,body{margin:0;min-height:100%;background:#111;font-family:'Montserrat',sans-serif;} 
        body{display:flex;align-items:center;justify-content:center;padding:18px}
        #capture-area{position:relative;width:min(88mm,calc(100vw - 24px));aspect-ratio:6496/10039;overflow:hidden;background:#000;color:#fff} 
        .template{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1}
        .teacher-photo,.placeholder-photo{position:absolute;z-index:2;left:49.5%;top:30%;transform:translate(-50%,-50%);width:44%;height:28.5%;border-radius:50%;object-fit:cover;background:#0b5db8;border:2px solid rgba(255,255,255,0.9)}
        .placeholder-photo{display:flex;align-items:center;justify-content:center;font-size:54px;font-weight:800}
        .field{position:absolute;z-index:3;width:82%;left:9%;text-align:center;line-height:1.05;white-space:nowrap;overflow:hidden}
        .name{top:50.35%;font-size:clamp(24px,7.2vw,48px);font-weight:600;text-transform:uppercase} 
        .designation{top:57.25%;font-size:clamp(18px,5vw,34px);font-weight:800;color:#ffc400;text-transform:uppercase}
        .department{top:64.35%;font-size:clamp(15px,4.1vw,28px);font-weight:600} 
        .employee-id{top:68.65%;font-size:clamp(15px,4.1vw,28px);font-weight:800;color:#ffc400}
        .joining-date{top:81.25%;left:40%;width:54%;text-align:left;font-size:clamp(13px,3.4vw,24px);font-weight:800;position:absolute;z-index:3}
        @media print{
          @page{size:88mm 136mm;margin:0} 
          html,body{width:88mm;min-height:136mm;background:#fff;padding:0} 
          body{display:block} 
          #capture-area{width:88mm;height:136mm} 
          .name{font-size:7.2mm} .designation{font-size:5.2mm} 
          .department,.employee-id{font-size:4.2mm} .joining-date{font-size:3.7mm}
        }
      </style></head><body>
      <div id="capture-area"><img class="template" crossorigin="anonymous" src="${template}" />
      ${photo ? `<img class="teacher-photo" crossorigin="anonymous" src="${photo}" />` : `<div class="placeholder-photo">${escapeHtml(profileData.name?.charAt(0)?.toUpperCase() || "T")}</div>`}
      <div class="field name" data-fit-text>${escapeHtml(profileData.name)}</div>
      <div class="field designation" data-fit-text>${escapeHtml(profileData.designation || "Senior IT Faculty")}</div>
      <div class="field department" data-fit-text>Dept. of ${escapeHtml(dept)}</div>
      <div class="field employee-id" data-fit-text>Employee ID : ${escapeHtml(empId)}</div>
      <div class="joining-date">Date of Joining : ${escapeHtml((v=>{const d=new Date(v);return[String(d.getDate()).padStart(2,"0"),String(d.getMonth()+1).padStart(2,"0"),d.getFullYear()].join(".");})(profileData.createdAt))}</div></div>
      <script>
        function fitTextFields(){document.querySelectorAll("[data-fit-text]").forEach(function(el){var min=9;var size=parseFloat(window.getComputedStyle(el).fontSize);el.style.fontSize=size+"px";while(el.scrollWidth>el.clientWidth&&size>min){size-=0.5;el.style.fontSize=size+"px";}});}
        window.onload=function(){setTimeout(function(){fitTextFields();},600);};
        window.downloadAsImage = function(filename) {
          return html2canvas(document.getElementById('capture-area'), { useCORS: true, scale: 3, backgroundColor: null }).then(canvas => {
            let link = document.createElement('a');
            link.download = filename + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
          });
        };
      </script></body></html>`;

    setPreviewTitle("Teacher ID Preview");
    setPreviewHtml(html);
  };

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

  const teacherBatches = useMemo(() => batches?.filter((b) => b.teacherEmail === profileData?.email || b.teachers?.some((t) => (t._id || t) === profileData?._id)) || [], [batches, profileData]);
  const teacherCourses = useMemo(() => allClass?.filter((c) => c.teacherEmail === profileData?.email || c.teachers?.some((t) => (t._id || t) === profileData?._id)) || [], [allClass, profileData]);
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
            <motion.div key="view-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center shadow-sm relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="relative shrink-0 z-10">
                  <div onClick={() => { if (profileData.profilePic) { setModalImageSrc(profileData.profilePic); setShowProfilePicModal(true); } }} className={`w-28 h-28 sm:w-36 sm:h-36 border-4 border-card shadow-xl rounded-full overflow-hidden relative group ${profileData.profilePic ? "cursor-pointer" : ""}`}>
                    {profileData.profilePic ? (
                      <><img src={profileData.profilePic} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-105" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ZoomIn className="text-white drop-shadow-md" size={28} /></div></>
                    ) : (
                      <AvatarPlaceholder name={profileData.name} className="w-full h-full" size="large" />
                    )}
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

              {isTargetStudent && (
                <>
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
                                          <button type="button" onClick={() => { setCertificateCourse(classObj); setCertificateGrade(""); }} className="text-sm font-semibold bg-success/10 hover:bg-success/20 text-success px-4 py-1.5 rounded-full border border-success/20 transition-colors flex items-center gap-1.5"><Printer size={14} /> View Certificate</button>
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
                      ) : (
                        <AvatarPlaceholder name={profileData.name} className="w-full h-full" size="normal" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-bold block mb-2">Update Profile Photo</label>
                    <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleProfilePicChange} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      <AnimatePresence>
        
        {showProfilePicModal && modalImageSrc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfilePicModal(false)}>
            <div className="relative max-w-3xl w-full flex justify-center">
              <button className="absolute -top-12 right-0 sm:-right-8 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition-colors z-50" onClick={() => setShowProfilePicModal(false)}><X size={24} /></button>
              <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} src={modalImageSrc} alt="Full Profile" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/10" onClick={(e) => e.stopPropagation()} />
            </div>
          </motion.div>
        )}

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
                <button type="button" onClick={handlePrintCertificate} className="px-5 py-2 rounded-xl bg-success hover:opacity-90 text-success-foreground font-semibold flex items-center gap-2 transition-all"><Printer size={16} /> Preview & Print</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {previewHtml && (
          <PrintPreviewModal 
            html={previewHtml} 
            title={previewTitle}
            onClose={() => setPreviewHtml(null)} 
          />
        )}
      </AnimatePresence>

      <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteAction} itemName={profileData?.name} isLoading={isDeleting} />
    </div>
  );
};

export default ProfilePage;