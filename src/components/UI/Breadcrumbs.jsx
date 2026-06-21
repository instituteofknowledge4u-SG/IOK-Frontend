import { Home, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav
      className="flex items-center text-sm md:text-base text-foreground/60 font-medium print:hidden"
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="hover:text-primary transition-all duration-200 flex items-center bg-foreground/5 py-1.5 px-3 rounded-lg hover:bg-primary/10 shrink-0"
      >
        <Home size={18} className="mr-2" />
        Dashboard
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const title = value.replaceAll("-", " ");

        return (
          <div key={to} className="flex items-center capitalize shrink-0">
            <ChevronRight
              size={18}
              className="mx-1 text-foreground/40 shrink-0"
            />
            {isLast ? (
              <span className="text-foreground font-bold bg-foreground/5 py-1.5 px-3 rounded-lg shadow-sm">
                {title}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-primary transition-all duration-200 bg-foreground/5 py-1.5 px-3 rounded-lg hover:bg-primary/10"
              >
                {title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};