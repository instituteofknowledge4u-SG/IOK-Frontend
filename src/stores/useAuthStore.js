import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { api } from "../api/api.js";

const useAuthStore = create(
  persist(
    (set, get) => ({
      // User informations
      id: null,
      user: null,
      token: null,
      userRole: null,

      // Authenticated states
      isAuthenticated: false,
      isOtpAuthenticated: false,
      isValidEmail: false,

      // Error states
      error: null,

      // Loaders States
      loginLoding: false,
      otpLoading: false,
      userLoading: false,

      clearError: () => set({ error: null }),

      sendOtp: async (email) => {
        try {
          const response = await api.post("/auth/sendotp", { email });
          set({
            isValidEmail: response?.data?.success ?? false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || "Email is not verified",
          });
        }
      },

      verifyOtp: async (userCredentails) => {
        set({
          loginLoding: true,
          error: null,
        });

        try {
          const response = await api.post("/auth/verifyotp", userCredentails);

          const responseData = response.data.data;

          set({
            user: responseData.user ?? null,
            id: responseData.user?._id ?? null,
            token: responseData.token ?? null,
            userRole: responseData.user?.role ?? null,
            isAuthenticated: true,
            loginLoding: false,
          });
        } catch (error) {
          set({
            error: error.response?.data?.message || "Login failed",
            loginLoding: false,
          });
          console.error("Login Error:", error);
        }
      },

      logout: () => {
        set({
          id: null,
          user: null,
          userRole: null,
          token: null,
          isAuthenticated: false,
          loginLoding: false,
          isOtpAuthenticated: false,
          isValidEmail: false,
        });
        return true;
      },

      loadUser: async () => {
        const { id, token, isAuthenticated, logout } = get();

        if (!id || !token || !isAuthenticated) {
          logout();
          return;
        }

        set({
          userLoading: true,
          error: null,
        });

        try {
          const response = await api.get(`/user/details/${id}`);
          const userData = response.data.data;

          set({
            user: userData ?? null,
            id: userData?._id ?? id,
            userRole: userData?.role ?? null,
            userLoading: false,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error("Load User Error:", error);
          logout();
        } finally {
          set({
            userLoading: false,
          });
        }
      },
    }),
    {
      name: "session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        id: state?.id ?? null,
        token: state?.token ?? null,
        userRole: state?.userRole ?? null,
        isAuthenticated: state?.isAuthenticated ?? false,
      }),
    },
  ),
);

export default useAuthStore;
