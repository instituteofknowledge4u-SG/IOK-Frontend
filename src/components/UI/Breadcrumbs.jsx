import React from "react";
import { Home, ChevronRight, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  const paths = pathnames.map((path, index) => ({
    title: decodeURIComponent(path).replace(/-/g, " "),
    url: `/${pathnames.slice(0, index + 1).join("/")}`,
    isLast: index === pathnames.length - 1,
  }));
  const MAX_ITEMS = 3;
  let displayPaths = paths;

  if (paths.length > MAX_ITEMS) {
    displayPaths = [
      paths[0],
      { isEllipsis: true },
      paths[paths.length - 2],
      paths[paths.length - 1],
    ];
  }

  const Separator = () => (
    <ChevronRight className="h-4 w-4 text-foreground/40 shrink-0" />
  );

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 text-sm md:text-base text-foreground/60 print:hidden"
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-200 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
      >
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline font-medium">Dashboard</span>
      </Link>

      {displayPaths.length > 0 && <Separator />}

      {displayPaths.map((item, index) => {
        if (item.isEllipsis) {
          return (
            <React.Fragment key={`ellipsis-${index}`}>
              <span
                className="flex h-6 w-6 items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <MoreHorizontal className="h-4 w-4 text-foreground/40" />
              </span>
              <Separator />
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={item.url}>
            {item.isLast ? (
              <span
                className="text-foreground font-semibold capitalize shrink-0"
                aria-current="page"
              >
                {item.title}
              </span>
            ) : (
              <Link
                to={item.url}
                className="font-medium hover:text-foreground transition-colors duration-200 capitalize shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                {item.title}
              </Link>
            )}
            {!item.isLast && <Separator />}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
