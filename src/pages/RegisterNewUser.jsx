import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  Eye,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  ZoomIn,
} from "lucide-react";
import toast from "react-hot-toast";
import useUserStore from "../stores/useUserStore";
import useClassStore from "../stores/useClassStore";
import { TextInput } from "../components/UI/RegisterNewUser/TextInput";
import { SelectInput } from "../components/UI/RegisterNewUser/SelectInput";
import { FilePreviewModal } from "../components/UI/RegisterNewUser/FilePreviewModal";
import { SectionCard } from "../components/UI/RegisterNewUser/SectionCard";
import BackButton from "../components/UI/Button";

// Assuming COUNTRIES is exported as an array of strings from this path
import { COUNTRIES } from "../util/Countries";

const STREAM_OPTIONS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "MP",
  "XI Science",
  "XI Commerce",
  "XI Arts",
  "HS",
  "Vocational",
  "Diploma",
  "B.Tech",
  "B.Sc",
  "B.A",
  "B.Com",
  "BCA",
  "MCA",
  "MBA",
  "Other",
];

const RegisterNewUser = () => {
  const { addUser, isLoading: isAddingUser, error, success } = useUserStore();
  const {
    allClass = [],
    getClasses,
    isLoading: isClassesLoading,
    resetStatus,
  } = useClassStore();

  const MAX_FILE_SIZE_MB = 1;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const initialFormState = {
    role: "Student",
    name: "",
    email: "",
    phone: "",
    mainClasses: [],
    fatherName: "",
    dob: "",
    gender: "",
    nationality: "Indian", // Defaulting to Indian, but editable via dropdown
    address: "",
    pinCode: "",
    adhar: "",
    schoolName: "",
    stream: "",
    passingYear: "",
    marksObtained: "",
    grade: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [profilePic, setProfilePic] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [profilePreview, setProfilePreview] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

  useEffect(() => {
    if (getClasses) getClasses();
  }, [getClasses]);

  useEffect(() => {
    return () => {
      resetStatus();
      useUserStore.setState({ error: null, success: false });
    };
  }, [resetStatus]);

  useEffect(() => {
    let timer;
    if (success) {
      toast.success("User added successfully!");
      setFormData(initialFormState);
      setProfilePic(null);
      setProfilePreview(null);
      setDocuments([]);
    }

    if (error) {
      if (typeof error === "string" && error.startsWith("E11000")) {
        toast.error("Identity document or Email already exists!");
      } else {
        toast.error(error.message || error || "Failed to submit form");
      }
    }

    if (error || success) {
      timer = setTimeout(() => {
        useUserStore.setState({ error: null, success: false });
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [success, error]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNumericChange = (e, field, maxLen) => {
    let value = e.target.value.replace(/\D/g, "");
    if (maxLen) value = value.slice(0, maxLen);
    setFormData({ ...formData, [field]: value });
  };

  const handleAdharChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 12) value = value.slice(0, 12);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setFormData({ ...formData, adhar: formatted });
  };

  const toggleClassSelection = (classId) => {
    setFormData((prev) => {
      const currentClasses = prev.mainClasses;
      if (currentClasses.includes(classId)) {
        return {
          ...prev,
          mainClasses: currentClasses.filter((id) => id !== classId),
        };
      }
      return { ...prev, mainClasses: [...currentClasses, classId] };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          "Only image files (JPG, PNG) are allowed for the profile photo.",
        );
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`Profile photo must be less than ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      setProfilePic(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files);
    const hasNonImage = files.some((file) => !file.type.startsWith("image/"));
    if (hasNonImage) {
      toast.error("Only image files (JPG, PNG) are allowed.");
      return;
    }
    const hasOversizedFile = files.some(
      (file) => file.size > MAX_FILE_SIZE_BYTES,
    );
    if (hasOversizedFile) {
      toast.error(`Each document must be less than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }
    if (documents.length + files.length > 3) {
      toast.error("Maximum 3 documents allowed");
      return;
    }

    setDocuments([...documents, ...files]);
  };

  const openPreview = (file) => {
    const url = URL.createObjectURL(file);
    setViewingFile({ url, type: file.type, name: file.name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auth Modal Level Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email))
      return toast.error("Please enter a valid email address.");

    if (formData.phone.length !== 10)
      return toast.error("Phone number must be exactly 10 digits.");

    let rawAdhar = "";
    if (formData.role === "Student") {
      rawAdhar = formData.adhar.replace(/\s/g, "");
      if (rawAdhar.length !== 12)
        return toast.error(
          "Identity document number must be exactly 12 digits.",
        );
    }

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("email", formData.email.trim());
    data.append("phone", formData.phone);
    data.append("role", formData.role);

    formData.mainClasses.forEach((clsId) => data.append("mainClasses", clsId));

    if (profilePic) data.append("profilePic", profilePic);

    if (formData.role === "Student") {
      data.append("adhar", rawAdhar);
      if (formData.fatherName) {
        data.append("fatherName", formData.fatherName.trim());
        data.append("fathersName", formData.fatherName.trim()); // Fallback for backend
        data.append("fathername", formData.fatherName.trim());
        data.append("father_name", formData.fatherName.trim());
        data.append("parentName", formData.fatherName.trim());
      }
      if (formData.dob) data.append("dob", formData.dob);
      if (formData.gender) data.append("gender", formData.gender);
      if (formData.nationality)
        data.append("nationality", formData.nationality.trim());
      if (formData.address) data.append("address", formData.address.trim());
      if (formData.pinCode) data.append("pinCode", formData.pinCode);
      if (formData.schoolName)
        data.append("schoolName", formData.schoolName.trim());
      if (formData.stream) data.append("stream", formData.stream.trim());
      if (formData.passingYear)
        data.append("passingYear", formData.passingYear);
      if (formData.marksObtained)
        data.append("marksObtained", formData.marksObtained);
      if (formData.grade)
        data.append("grade", formData.grade.toUpperCase().trim());

      documents.forEach((doc) => data.append("documents", doc));
    }

    await addUser(data);
  };

  return (
    // Changed to h-full flex-col so it fits naturally inside NavigationLayout's scroll bounds
    <div className="h-full bg-background p-4 md:p-6 flex flex-col transition-colors duration-300">
      {/* File Preview Modal */}
      <FilePreviewModal
        viewingFile={viewingFile}
        setViewingFile={setViewingFile}
      />

      {/* shrink-0 and mb-8 to give it breathing room at the bottom of the page */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto w-full bg-card rounded-2xl shadow-xl overflow-hidden border border-border shrink-0 mb-8"
      >
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="mb-8 flex items-center justify-start">
            <BackButton details={`Register New User to the system`} />
          </div>

          {/* Role Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">
              Account Role
            </label>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              {["Student", "Teacher"].map((r) => (
                <button
                  key={r}
                  type="button"
                  disabled={isAddingUser}
                  onClick={() => setFormData({ ...initialFormState, role: r })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium flex items-center justify-center gap-2 ${
                    formData.role === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (Main Form Data) */}
            <div className="lg:col-span-8 space-y-6">
              <SectionCard
                title={
                  formData.role === "Student"
                    ? "Personal Information"
                    : "Basic Information"
                }
                icon={User}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div
                    className={
                      formData.role === "Teacher" ? "md:col-span-2" : ""
                    }
                  >
                    <TextInput
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={isAddingUser}
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Extra Personal Fields ONLY for Student */}
                  {formData.role === "Student" && (
                    <>
                      <TextInput
                        label="Father's Name"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleInputChange}
                        disabled={isAddingUser}
                        placeholder="Richard Doe"
                      />
                      <TextInput
                        label="Date of Birth"
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleInputChange}
                        required
                        disabled={isAddingUser}
                      />
                      <SelectInput
                        label="Gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        disabled={isAddingUser}
                        options={["Male", "Female", "Other"]}
                      />

                      {/* Changed to SelectInput utilizing COUNTRIES array */}
                      <SelectInput
                        label="Nationality"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        required
                        disabled={isAddingUser}
                        options={COUNTRIES}
                      />
                    </>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Contact Information" icon={MapPin}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <TextInput
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isAddingUser}
                    placeholder="john@example.com"
                  />
                  <TextInput
                    label="Phone (10 Digits)"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleNumericChange(e, "phone", 10)}
                    required
                    disabled={isAddingUser}
                    placeholder="9876543210"
                    maxLength={10}
                    error={
                      formData.phone.length > 0 && formData.phone.length < 10
                        ? "Must be exactly 10 digits"
                        : ""
                    }
                  />

                  {/* Extra Contact Fields ONLY for Student */}
                  {formData.role === "Student" && (
                    <>
                      <div className="md:col-span-2">
                        <TextInput
                          label="Full Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                          disabled={isAddingUser}
                          placeholder="123 Main Street, City"
                        />
                      </div>

                      {/* Removed 6-digit max length and specific limits */}
                      <TextInput
                        label="PIN Code / Zip"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={(e) => handleNumericChange(e, "pinCode")} // No max limit passed
                        required
                        disabled={isAddingUser}
                        placeholder="123456"
                      />
                    </>
                  )}
                </div>
              </SectionCard>

              {/* Academic Information ONLY for Student */}
              <AnimatePresence>
                {formData.role === "Student" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2">
                      <SectionCard
                        title="Academic Information"
                        icon={GraduationCap}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <TextInput
                              label="School/College Name"
                              name="schoolName"
                              value={formData.schoolName}
                              onChange={handleInputChange}
                              disabled={isAddingUser}
                              placeholder="XYZ High School"
                            />
                          </div>

                          {/* Changed from TextInput to SelectInput with Stream Options */}
                          <SelectInput
                            label="Stream / Major"
                            name="stream"
                            value={formData.stream}
                            onChange={handleInputChange}
                            disabled={isAddingUser}
                            options={STREAM_OPTIONS}
                          />

                          <TextInput
                            label="Year of Passing"
                            name="passingYear"
                            type="number"
                            value={formData.passingYear}
                            onChange={handleInputChange}
                            disabled={isAddingUser}
                            placeholder="2023"
                          />
                          <TextInput
                            label="Marks Obtained (%)"
                            name="marksObtained"
                            type="number"
                            value={formData.marksObtained}
                            onChange={handleInputChange}
                            disabled={isAddingUser}
                            placeholder="85.5"
                          />
                          <TextInput
                            label="Grade / CGPA"
                            name="grade"
                            value={formData.grade.toUpperCase()}
                            onChange={handleInputChange}
                            disabled={isAddingUser}
                            placeholder="A+"
                          />
                        </div>
                      </SectionCard>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column (Uploads & Identity) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Shared Profile Photo */}
              <SectionCard title="Profile Photo">
                <div className="flex flex-col items-center gap-4">
                  {profilePreview ? (
                    <div className="relative group">
                      <img
                        src={profilePreview}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-card shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          setViewingFile({
                            url: profilePreview,
                            type: "image/jpeg",
                            name: "Profile Photo Preview",
                          })
                        }
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <ZoomIn
                          className="text-white drop-shadow-md"
                          size={24}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePreview(null);
                          setProfilePic(null);
                        }}
                        className="absolute top-0 right-0 bg-destructive hover:opacity-90 text-destructive-foreground rounded-full p-1.5 shadow-lg transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground bg-background">
                      <Upload size={28} />
                    </div>
                  )}
                  <label className="cursor-pointer bg-primary/10 text-primary font-medium py-2 px-4 rounded-lg text-sm hover:bg-primary/20 transition-colors">
                    Browse Files
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isAddingUser}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG up to {MAX_FILE_SIZE_MB}MB.
                  </p>
                </div>
              </SectionCard>

              {/* Identity & Docs ONLY for Student */}
              <AnimatePresence>
                {formData.role === "Student" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2">
                      <SectionCard title="Identity & Documents">
                        <TextInput
                          label="Identity Number (12 Digits)"
                          name="adhar"
                          value={formData.adhar}
                          onChange={handleAdharChange}
                          required={formData.role === "Student"}
                          disabled={isAddingUser}
                          placeholder="XXXX XXXX XXXX"
                          error={
                            formData.adhar.replace(/\s/g, "").length > 0 &&
                            formData.adhar.replace(/\s/g, "").length < 12
                              ? "Must be exactly 12 digits"
                              : ""
                          }
                        />

                        <div className="mt-6 border-t border-border pt-5">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-semibold text-foreground">
                              Supporting Documents
                            </label>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                              {documents.length} / 3
                            </span>
                          </div>
                          <label className="block w-full py-5 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors bg-background text-center mb-4">
                            <FileText
                              size={24}
                              className="mx-auto text-primary mb-2 opacity-80"
                            />
                            <span className="text-sm font-medium text-foreground">
                              Click to upload files
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">
                              JPG, PNG allowed (Max {MAX_FILE_SIZE_MB}MB)
                            </p>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={handleDocChange}
                              disabled={isAddingUser}
                            />
                          </label>

                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {documents.map((doc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-background border border-border rounded-xl shadow-sm"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  {doc.type.startsWith("image/") ? (
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                      <ImageIcon
                                        size={18}
                                        className="text-primary flex-shrink-0"
                                      />
                                    </div>
                                  ) : (
                                    <div className="p-2 bg-destructive/10 rounded-lg">
                                      <FileText
                                        size={18}
                                        className="text-destructive flex-shrink-0"
                                      />
                                    </div>
                                  )}
                                  <span className="text-sm text-foreground truncate font-medium">
                                    {doc.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openPreview(doc)}
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDocuments(
                                        documents.filter((_, i) => i !== idx),
                                      )
                                    }
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </SectionCard>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <button
              type="submit"
              disabled={
                isAddingUser ||
                (formData.role === "Student" &&
                  formData.adhar.replace(/\s/g, "").length !== 12 &&
                  formData.adhar.length > 0) ||
                (formData.phone.length !== 10 && formData.phone.length > 0)
              }
              className="w-full md:w-auto md:min-w-[300px] float-right bg-primary hover:opacity-90 text-primary-foreground font-bold py-3.5 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-lg flex justify-center items-center gap-2"
            >
              {isAddingUser ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" />{" "}
                  Processing...
                </>
              ) : (
                "Create User Profile"
              )}
            </button>
            <div className="clear-both"></div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterNewUser;
