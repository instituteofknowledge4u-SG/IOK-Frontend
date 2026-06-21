import axios from "axios";
import useAuthStore from "../stores/useAuthStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// interceptors for validate authorization

// Request interceptor

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // if ((error?.response?.status = 401)) {
    //   useAuthStore.getState().logout();
    // }
    return Promise.reject(error);
  },
);
