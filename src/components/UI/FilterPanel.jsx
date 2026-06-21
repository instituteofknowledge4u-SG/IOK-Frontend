import React from "react";
import { ChevronDown } from "lucide-react";

const FilterPanel = ({
  mainClasses = [],
  batches = [],
  selectedMainClass,
  selectedBatch,
  onMainClassChange,
  onBatchChange,
  isLoading,
  hideCourseFees = false,
}) => {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Filters</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-foreground/80 mb-2">
            Courses
          </label>
          <div className="relative">
            <select
              value={selectedMainClass || ""}
              onChange={(e) => onMainClassChange(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Course --</option>
              {mainClasses?.map((mainClass) => (
                <option key={mainClass._id} value={mainClass._id}>
                  {hideCourseFees
                    ? mainClass.name
                    : `${mainClass.name} (₹${mainClass.fees})`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-foreground/80 mb-2">
            Batch
          </label>
          <div className="relative">
            <select
              value={selectedBatch || ""}
              onChange={(e) => onBatchChange(e.target.value)}
              disabled={isLoading || !selectedMainClass}
              className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">-- Select Batch --</option>
              {batches?.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name} ({batch.startTime} - {batch.endTime})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
          {!selectedMainClass && (
            <p className="text-xs text-muted-foreground mt-2">
              Select a Course first
            </p>
          )}
        </div>
      </div>

      {selectedMainClass && selectedBatch && (
        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-sm font-medium text-success flex items-center gap-2">
            ✓ Filters applied. Showing students for the selected Course and
            batch.
          </p>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
