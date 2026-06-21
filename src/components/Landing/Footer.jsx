import {
  Facebook,
  Instagram,
  Twitter,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Image } from "../../assets/Image";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const footerData = {
  institute: {
    name: "Institute of Knowledge",
    logoAlt: "Institute Logo",
    description:
      "Empowering students with quality education and practical skills for a brighter future.",
    established: `${new Date().getFullYear()}`,
  },
  address: {
    street: "F.P. School, near Lauhati, Baidyapara",
    city: "Rajarhat, New Town, WB 700135",
    coordinates: { lat: 22.610940155735868, lng: 88.51870979069498 },
    mapLink: `https://maps.app.goo.gl/pkjCRdahsueU2tT68?g_st=aw`,
  },
  contact: {
    phone: "+91 7278957733",
    email: "instituteofknowledge4u@gmail.com",
    website: "instituteofknowledge.in",
  },
  hours: {
    weekdays: "Saturday - Thursday: 10:00 AM - 10:00 PM",
    weekend: "Friday: Closed",
  },
  quickLinks: [
    { name: "About Us", url: "/about" },
    { name: "Our Courses", url: "/courses" },
    { name: "Admissions", url: "/admissions" },
    { name: "Student Dashboard", url: "/student-profile" },
    { name: "Notice Board", url: "/notices" },
  ],
  socials: [
    {
      id: 1,
      icon: Facebook,
      colorClass: "hover:text-blue-600",
      url: "https://www.facebook.com",
    },
    {
      id: 2,
      icon: Instagram,
      colorClass: "hover:text-pink-500",
      url: "https://www.instagram.com",
    },
    {
      id: 3,
      icon: Twitter,
      colorClass: "hover:text-blue-400",
      url: "https://www.x.com",
    },
  ],
};

const mapContainerStyle = {
  width: "100%",
  height: "200px",
  borderRadius: "0.5rem",
};

export const Footer = () => {
  return (
    <footer className="border-t border-border py-16 px-6 md:px-12 bg-card">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 items-start text-left">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-foreground/5 rounded-lg flex items-center justify-center p-2">
              <img
                src={Image.Logo}
                alt={footerData.institute.logoAlt}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="font-bold text-foreground text-lg leading-tight">
              {footerData.institute.name}
            </p>
          </div>

          <p className="text-sm text-foreground/70 leading-relaxed">
            {footerData.institute.description}
          </p>

          <div className="w-full overflow-hidden rounded-lg border border-border shadow-sm relative group mt-2">
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLEMAP_API_KEY}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={footerData.address.coordinates}
                zoom={30}
                options={{
                  zoomControl: true,
                  gestureHandling: "cooperative",
                }}
              >
                <Marker
                  position={footerData.address.coordinates}
                  onClick={() =>
                    window.open(footerData.address.mapLink, "_blank")
                  }
                  title="Click to view on Google Maps"
                  cursor="pointer"
                />
              </GoogleMap>
            </LoadScript>
          </div>
        </div>

        <div className="flex flex-col pt-2">
          <p className="font-bold text-foreground mb-6 text-lg">Quick Links</p>
          <ul className="flex flex-col gap-3">
            {footerData.quickLinks.map((link, index) => (
              <li key={index}>
                <a
                  // href={link.url}
                  className="text-sm text-foreground/70 hover:text-primary transition flex items-center gap-2 group"
                >
                  <ChevronRight className="w-4 h-4 text-primary/50 group-hover:translate-x-1 transition-transform" />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col pt-2">
          <p className="font-bold text-foreground mb-6 text-lg">Contact Us</p>
          <div className="text-sm text-foreground/70 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p>
                {footerData.address.street} <br />
                {footerData.address.city}
              </p>
            </div>
            <a
              href={`tel:${footerData.contact.phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-3 hover:text-primary transition group"
            >
              <Phone className="w-5 h-5 text-primary shrink-0 group-hover:rotate-12 transition-transform" />
              <span>{footerData.contact.phone}</span>
            </a>
            <a
              href={`mailto:${footerData.contact.email}`}
              className="flex items-center gap-3 hover:text-primary transition"
            >
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <span>{footerData.contact.email}</span>
            </a>
            <a
              href={`https://${footerData.contact.website}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 hover:text-primary transition"
            >
              <Globe className="w-5 h-5 text-primary shrink-0" />
              <span>{footerData.contact.website}</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col pt-2">
          <p className="font-bold text-foreground mb-6 text-lg">
            Working Hours
          </p>
          <div className="text-sm text-foreground/70 space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <span>{footerData.hours.weekdays}</span>
            </div>
            <div className="flex items-center gap-3 opacity-70">
              <Clock className="w-5 h-5 shrink-0" />
              <span>{footerData.hours.weekend}</span>
            </div>
          </div>

          <p className="font-bold text-foreground mb-4 text-lg">Follow Us</p>
          <div className="flex gap-4">
            {footerData.socials.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground/70 transition-all duration-300 hover:scale-110 hover:shadow-md ${social.colorClass}`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-foreground/50">
        <p>
          © {footerData.institute.name} {footerData.institute.established}. All
          rights reserved.
        </p>
        <div className="flex gap-4">
          <a className="hover:text-primary transition">Privacy Policy</a>
          <a className="hover:text-primary transition">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
