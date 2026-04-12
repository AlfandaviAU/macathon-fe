import axios from "axios";

let API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Ensure URL is absolute by adding protocol if missing
// Using // allows it to match the current page's protocol (http/https)
if (API_URL && !API_URL.includes("://") && !API_URL.startsWith("//")) {
  API_URL = `//${API_URL}`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export { API_URL };

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("user_role");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  },
);

export const getMatchExplanation = async (userId: string, propertyId: string) => {
  const response = await api.get(`/matching/explain-property/${userId}/${propertyId}`);
  return response.data;
};

export const getPropertyById = async (propertyId: string) => {
  const response = await api.get(`/properties/${propertyId}`);
  return response.data;
};

export const addInterest = async (propertyId: string) => {
  return api.post(`/properties/${propertyId}/interest`);
};

export const removeInterest = async (propertyId: string) => {
  return api.delete(`/properties/${propertyId}/interest`);
};

export const addDislike = async (propertyId: string) => {
  return api.post(`/properties/${propertyId}/dislike`);
};

export const removeDislike = async (propertyId: string) => {
  return api.delete(`/properties/${propertyId}/dislike`);
};

export const superLike = async (propertyId: string) => {
  return api.post(`/properties/${propertyId}/super-like`);
};

export const refreshSuperLike = async (propertyId: string) => {
  return api.post(`/properties/${propertyId}/super-like/refresh`);
};

export const approveTenant = async (propertyId: string, userId: string) => {
  return api.post(`/properties/${propertyId}/approve/${userId}`);
};

export const removeTenant = async (propertyId: string, userId: string) => {
  return api.post(`/properties/${propertyId}/remove-tenant/${userId}`);
};

export const updateProperty = async (propertyId: string, data: any) => {
  return api.patch(`/properties/${propertyId}`, data);
};

export default api;
