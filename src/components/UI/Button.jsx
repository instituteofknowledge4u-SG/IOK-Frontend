import { ArrowLeft } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export const Button = ({
  buttonType,
  disabledCondition,
  isLoading,
  buttonName,
}) => {
  return (
    <button
      type={buttonType}
      disabled={disabledCondition}
      className="disabled:bg-primary/70 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold capitalized tracking-widest shadow-lg shadow-primary/30 hover:opacity-90 transition flex justify-center items-center"
    >
      {isLoading ? (
        <span className="w-5 h-5 border-2 border-primary-foreground border-b-transparent rounded-full inline-block animate-spin" />
      ) : (
        buttonName
      )}
    </button>
  );
};

export default function BackButton({ details }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-4">
      <div
        onClick={() => navigate(-1)}
        className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 transition-all shadow-sm cursor-pointer"
      >
        <ArrowLeft size={20} />
      </div>
      <div>
        <h1
          onClick={() => navigate(-1)}
          className="text-foreground hover:text-primary transition-colors font-medium text-lg cursor-pointer"
        >
          Back
        </h1>
        <p className="text-sm text-muted-foreground">{details}</p>
      </div>
    </div>
  );
}
