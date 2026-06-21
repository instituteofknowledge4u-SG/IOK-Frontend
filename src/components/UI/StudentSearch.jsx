import React, { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";

/**
 * Student Search Component
 * Provides global search across all students by name, ID, and phone
 */
const StudentSearch = ({
  students = [],
  onSearch = () => {},
  debounceMs = 500,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim() === "") {
        onSearch([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      const results = performSearch(students, searchTerm.toLowerCase());
      onSearch(results);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, students, onSearch, debounceMs]);

  /**
   * Perform search across multiple fields
   */
  const performSearch = (studentsList, query) => {
    return studentsList.filter((student) => {
      // Search by name (partial match)
      const matchName =
        student.name?.toLowerCase().includes(query) ||
        student.fatherName?.toLowerCase().includes(query);

      // Search by student ID (partial match)
      const matchId =
        student.studentId?.toString().includes(query) ||
        student._id?.toString().includes(query) ||
        student.id?.toString().includes(query);

      // Search by phone (partial match)
      const matchPhone = student.phone?.toString().includes(query);

      return matchName || matchId || matchPhone;
    });
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch([]);
  };

  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, ID, or phone..."
          className="w-full pl-10 pr-10 py-2.5 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search info */}
      {searchTerm && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          {isSearching ? (
            <>
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <span>Searching...</span>
            </>
          ) : (
            <>
              <span>
                Found{" "}
                <span className="font-semibold text-foreground">
                  {
                    students.filter((s) =>
                      performSearch([s], searchTerm.toLowerCase()),
                    ).length
                  }
                </span>{" "}
                result
                {students.filter((s) =>
                  performSearch([s], searchTerm.toLowerCase()),
                ).length !== 1
                  ? "s"
                  : ""}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentSearch;
