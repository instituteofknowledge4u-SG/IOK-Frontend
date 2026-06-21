import React, { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle } from "lucide-react";
import useFeesStore from "../../stores/useFeesStore";
import {
  calculateFineForMonth,
  formatFineAmount,
} from "../../util/fineCalculation";
import { getStudentId } from "../../util/getStudentId";
import { Image } from "../../assets/Image";

const StudentRow = ({
  student,
  mainClassId,
  classFees,
  batchName,
  courseName,
  onPaymentSuccess,
  showDiscount = false,
}) => {
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fineAmount, setFineAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [fineCalculated, setFineCalculated] = useState(true);
  const [showFineLoading, setShowFineLoading] = useState(false);

  // BUG FIX: Added state to properly handle image fallbacks
  const [imgError, setImgError] = useState(false);

  const recordFeesPaid = useFeesStore((state) => state.recordFeesPaid);

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  const [availableMonths] = useState(() => {
    const options = [];
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    for (let i = 0; i < 12; i++) {
      options.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
      d.setMonth(d.getMonth() + 1);
    }
    return options;
  });

  const studentId = student.studentId || student._id || student.id;
  const studentPhone = student.phone || student.phoneNumber || "-";
  const studentPhoto = student.profilePic || student.profile_picture || "";

  const totalAmount = parseFloat(classFees) || 0;
  const finalAmount = totalAmount + fineAmount - discountAmount;

  const isProcessButtonEnabled =
    fineCalculated &&
    paidAmount &&
    parseFloat(paidAmount) === finalAmount &&
    finalAmount > 0;

  const handleDateChange = (e) => {
    setPaymentDate(e.target.value);
    setFineAmount(0);
    setFineCalculated(false);
  };

  const handleCalculateFine = async () => {
    if (!paymentDate) {
      toast.error("Please select a payment date");
      return;
    }

    setShowFineLoading(true);
    try {
      // Split the string and construct date safely to avoid timezone shift issues
      const [year, month, day] = paymentDate.split("-");
      const selectedDate = new Date(year, month - 1, day);

      const fine = calculateFineForMonth(selectedDate, 10, 10);
      setFineAmount(fine);
      setFineCalculated(true);

      if (fine > 0) {
        toast.success(`Fine calculated: ${formatFineAmount(fine)}`);
      } else {
        toast.success("No fine applicable");
      }
    } catch (error) {
      toast.error("Failed to calculate fine");
    } finally {
      setShowFineLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!isProcessButtonEnabled) {
      toast.error("Please enter the correct payment amount");
      return;
    }

    // Pre-open the window to bypass popup blockers (synchronously connected to user click)
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) {
      toast.error("Please allow popups to print receipt");
      return;
    }
    receiptWindow.document.write("<h2>Processing payment, please wait...</h2>");

    setIsProcessing(true);
    try {
      if (!mainClassId || !studentId) {
        toast.error("Student or Class information is missing");
        receiptWindow.close();
        setIsProcessing(false);
        return;
      }

      // Safe date formatting
      const [year, month, day] = paymentDate.split("-");
      const paymentDateTime = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const isoDateTime = paymentDateTime.toISOString();

      const paymentData = {
        month: selectedMonth,
        totalAmount: parseFloat(paidAmount),
        PaidAt: isoDateTime,
      };

      const result = await recordFeesPaid(mainClassId, studentId, paymentData);

      if (!result) {
        receiptWindow.close();
        setIsProcessing(false);
        return;
      }

      // Generate and Print Receipt
      const getAbsoluteUrl = (path) => {
        if (!path) return "";
        if (path.startsWith("http") || path.startsWith("data:")) return path;
        return (
          window.location.origin + (path.startsWith("/") ? path : "/" + path)
        );
      };

      const logoUrl = getAbsoluteUrl(Image.Logo);
      const receiptNo = `#BILL-${Date.now().toString().slice(-6)}`;
      const receiptDate = new Date().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      // Bill Recipt genaration
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fee Receipt - ${student.name}</title>
            <style>
              * { box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; padding: 34px; color: #1f2937; line-height: 1.45; max-width: 820px; margin: 0 auto; background: #ffffff; }
              .receipt-shell { border: 2px solid #0f172a; padding: 22px; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 18px; margin-bottom: 22px; }
              .institute-name { width: 100%; font-size: 42px; line-height: 1; font-weight: 900; color: #0f172a; margin: 0 0 18px 0; text-align: center; text-transform: uppercase; letter-spacing: 0; white-space: nowrap; }
              .brand-row { display: flex; align-items: center; justify-content: space-between; gap: 28px; }
              .logo-wrap { flex: 0 0 120px; text-align: left; }
              .logo { width: 112px; max-height: 112px; object-fit: contain; display: block; }
              .institute-details { flex: 1; text-align: right; }
              .cert { font-size: 15px; font-weight: 800; color: #b91c1c; margin: 0 0 8px 0; text-transform: uppercase; }
              .address, .contact { font-size: 13px; color: #334155; margin: 3px 0; }
              .title { font-size: 22px; font-weight: 800; margin: 18px 0 0 0; color: #1e40af; text-align: center; text-transform: uppercase; letter-spacing: 2px; }
              .bill-meta { display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px 14px; margin-bottom: 18px; font-size: 14px; }
              .meta-item { display: flex; gap: 8px; align-items: center; }
              .meta-label { font-weight: 800; color: #475569; text-transform: uppercase; font-size: 12px; }
              .meta-value { color: #0f172a; font-weight: 700; }
              .student-box { border: 1.5px solid #0f172a; padding: 14px; margin-bottom: 22px; }
              .student-box-title { font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 0.5px; }
              .student-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 26px; font-size: 14px; }
              .info-row { display: flex; gap: 8px; min-width: 0; }
              .info-label { font-weight: 800; color: #475569; min-width: 98px; }
              .info-value { color: #0f172a; font-weight: 600; overflow-wrap: anywhere; }
              .table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
              .table th, .table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
              .table th { background: #f1f5f9; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 12px; }
              .table td { color: #1e293b; font-size: 14px; }
              .total-row td { font-weight: bold; font-size: 16px; background: #f8fafc; border-top: 2px solid #cbd5e1; }
              .amount-col { text-align: right !important; }
              .terms { margin-top: 30px; border: 1px solid #cbd5e1; padding: 12px 14px; background: #f8fafc; color: #1f2937; }
              .terms-title { margin: 0 0 8px 0; font-size: 12px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
              .terms ol { margin: 0; padding-left: 18px; font-size: 10.5px; line-height: 1.38; }
              .terms li { margin-bottom: 4px; }
              .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px; }
              .signature-section { margin-top: 44px; display: flex; justify-content: space-between; padding: 0 20px; }
              .signature-box { text-align: center; }
              .signature-line { border-top: 1px solid #475569; width: 150px; margin-bottom: 5px; }
              .signature-text { font-size: 14px; color: #475569; }
              .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.03); z-index: -1; pointer-events: none; white-space: nowrap; }
              @media print {
                @page { margin: 15mm; size: A4; }
                body { padding: 0; background: white; }
                button { display: none; }
                .receipt-shell { min-height: calc(297mm - 30mm); }
              }
              @media (max-width: 620px) {
                body { padding: 16px; }
                .institute-name { font-size: 30px; white-space: normal; }
                .brand-row, .bill-meta { align-items: flex-start; flex-direction: column; gap: 12px; }
                .institute-details { text-align: left; }
                .student-grid { grid-template-columns: 1fr; }
              }
            </style>
          </head>
          <body>
            <div class="watermark">PAID</div>
            <div class="receipt-shell">
              <div class="header">
                <h2 class="institute-name">Institute of Knowledge</h2>
                <div class="brand-row">
                  <div class="logo-wrap">
                    <img src="${logoUrl}" class="logo" alt="Institute Logo" onerror="this.style.display='none'" />
                  </div>
                  <div class="institute-details">
                    <p class="cert">GOVT. REGD. An ISO 2009-2015 Certified</p>
                    <p class="address">Lauhati, Rajarhat, North 24 Parganas, kol – 700135, W.B., India</p>
                    <p class="contact">Phone: +91-7278957733 | Email: instituteofknowledge4u@gmail.com</p>
                  </div>
                </div>
                <h1 class="title">Payment Receipt</h1>
              </div>

              <div class="bill-meta">
                <div class="meta-item"><span class="meta-label">Bill No:</span><span class="meta-value">${receiptNo}</span></div>
                <div class="meta-item"><span class="meta-label">Date:</span><span class="meta-value">${receiptDate}</span></div>
              </div>

              <div class="student-box">
                <p class="student-box-title">Student Payment Details</p>
                <div class="student-grid">
                <div class="info-row"><div class="info-label">Student Name:</div><div class="info-value">${student.name}</div></div>
                <div class="info-row"><div class="info-label">Student ID:</div><div class="info-value">${getStudentId(student)}</div></div>
                <div class="info-row"><div class="info-label">Course:</div><div class="info-value">${courseName}</div></div>
                <div class="info-row"><div class="info-label">Batch:</div><div class="info-value">${(batchName || "").split(" (")[0]}</div></div>
                <div class="info-row"><div class="info-label">Payment For:</div><div class="info-value">${selectedMonth}</div></div>
                </div>
              </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount-col">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Course Fee (${selectedMonth})</td>
                  <td class="amount-col">₹${parseFloat(classFees).toFixed(2)}</td>
                </tr>
                ${
                  fineAmount > 0
                    ? `
                <tr>
                  <td>Late Payment Fine</td>
                  <td class="amount-col">₹${parseFloat(fineAmount).toFixed(2)}</td>
                </tr>`
                    : ""
                }
                ${
                  discountAmount > 0
                    ? `
                <tr>
                  <td>Discount / Concession</td>
                  <td class="amount-col" style="color: #ef4444;">- ₹${parseFloat(discountAmount).toFixed(2)}</td>
                </tr>`
                    : ""
                }
                <tr class="total-row">
                  <td>Total Amount Paid</td>
                  <td class="amount-col">₹${finalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-text">Student / Parent Signature</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-text">Authorized Signatory</div>
              </div>
            </div>

            <div class="terms">
              <p class="terms-title">TERMS &amp; CONDITIONS (LEGAL &amp; ACADEMIC):</p>
              <ol>
                <li><strong>Refund Policy:</strong> All fees paid are strictly non-refundable and non-transferable under any circumstances.</li>
                <li><strong>Payment Schedule:</strong> Monthly fees must be cleared by the 10th of each month. A late fine of Rs. 10 per day will be charged beyond the due date.</li>
                <li><strong>Documentation:</strong> This receipt is computer-generated. Please keep it safe for identity verification and to claim your certificate upon course completion.</li>
                <li><strong>Attendance Policy:</strong> A minimum of 75% attendance is mandatory. Unauthorized absence for more than 15 days may lead to admission cancellation without refund.</li>
                <li><strong>Right to Modify:</strong> The Institute management reserves the right to change class schedules, faculty, or exam dates and other for administrative improvements.</li>
                <li><strong>Digital Confirmation:</strong> For online payments, this receipt is subject to fund realization in the Institute's bank account.</li>
              </ol>
            </div>

            
            </div>
            
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              }
            </script>
          </body>
        </html>
      `;
      receiptWindow.document.open();
      receiptWindow.document.write(html);
      receiptWindow.document.close();

      setPaymentDate(new Date().toISOString().split("T")[0]);
      setFineAmount(0);
      setDiscountAmount(0);
      setPaidAmount("");
      setFineCalculated(true);
      onPaymentSuccess?.();
    } catch (error) {
      console.error("Payment error:", error);
      receiptWindow.close();
      toast.error("Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold overflow-hidden shrink-0">
          {studentPhoto && !imgError ? (
            <img
              src={studentPhoto}
              alt={student.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{student.name?.charAt(0)?.toUpperCase() || "S"}</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3 font-medium text-foreground">{student.name}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
        {getStudentId(student)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {studentPhone !== "-" ? studentPhone : "-"}
      </td>

      <td className="px-4 py-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-2 py-1 border border-border bg-background text-foreground rounded text-sm w-36 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3 font-semibold text-foreground">₹{classFees}</td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <input
            type="date"
            value={paymentDate}
            onChange={handleDateChange}
            className="px-2 py-1 border border-border bg-background text-foreground rounded text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
          />
          <button
            onClick={handleCalculateFine}
            disabled={showFineLoading}
            className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {showFineLoading ? "Calculating..." : "Calculate Fine"}
          </button>
          <div
            className={`text-sm font-semibold ${fineAmount > 0 ? "text-destructive" : "text-success"}`}
          >
            {formatFineAmount(fineAmount)}
          </div>
        </div>
      </td>

      {showDiscount && (
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={discountAmount || ""}
              onChange={(e) =>
                setDiscountAmount(parseFloat(e.target.value) || 0)
              }
              placeholder="Discount"
              className="px-2 py-1 border border-border bg-background text-foreground rounded text-sm w-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
              min="0"
            />
          </div>
        </td>
      )}

      <td className="px-4 py-3">
        <div className="text-lg font-bold text-success">
          ₹{finalAmount.toFixed(2)}
        </div>
        {discountAmount > 0 && (
          <div className="text-xs text-muted-foreground">
            Discount: ₹{discountAmount.toFixed(2)}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-2">
          <input
            type="number"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="Enter amount"
            className="px-2 py-1 border border-border bg-background text-foreground rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            disabled={!fineCalculated}
            step="0.01"
            min="0"
          />
          <button
            onClick={handleProcessPayment}
            disabled={!isProcessButtonEnabled || isProcessing}
            className={`px-4 py-2 text-sm font-semibold rounded transition-all flex items-center justify-center gap-2 ${
              isProcessButtonEnabled
                ? "bg-success text-success-foreground hover:opacity-90 shadow-md shadow-success/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Process
              </>
            )}
          </button>
          {!isProcessButtonEnabled && fineCalculated && (
            <div className="text-xs text-destructive">
              Amount must equal ₹{finalAmount.toFixed(2)}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default StudentRow;
