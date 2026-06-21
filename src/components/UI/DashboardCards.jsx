import React from "react";
import { Users, BookOpen, Clock, AlertCircle } from "lucide-react";

/**
 * Dashboard Cards Component
 * Displays summary metrics for the selected course and batch
 */
const DashboardCards = ({
  totalStudents = 0,
  pendingCurrentMonth = 0,
  pendingPreviousMonth = 0,
  isLoading = false,
}) => {
  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-muted"></div>
        <div className="flex-1">
          <div className="h-4 bg-muted rounded mb-2 w-2/3"></div>
          <div className="h-6 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  const cards = [
    {
      id: 1,
      title: "Total Students",
      value: totalStudents,
      icon: Users,
      bgGradient: "from-blue-500/10 to-blue-600/5",
      borderColor: "border-blue-500/20",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      id: 2,
      title: "Pending Fees",
      value: pendingCurrentMonth,
      subtitle: "Current Month",
      icon: AlertCircle,
      bgGradient: "from-orange-500/10 to-orange-600/5",
      borderColor: "border-orange-500/20",
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100",
    },
    {
      id: 3,
      title: "Previous Month Pending",
      value: pendingPreviousMonth,
      subtitle: "Last Month",
      icon: Clock,
      bgGradient: "from-green-500/10 to-green-600/5",
      borderColor: "border-green-500/20",
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array(4)
          .fill()
          .map((_, i) => (
            <SkeletonCard key={i} />
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`bg-gradient-to-br ${card.bgGradient} border ${card.borderColor} rounded-xl p-6 shadow-sm transition-all hover:shadow-md hover:border-opacity-100`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium mb-2">
                  {card.title}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {typeof card.value === "number"
                    ? card.value.toLocaleString()
                    : String(card.value).substring(0, 25)}
                </p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;
