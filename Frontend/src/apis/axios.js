import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue = []; // requests waiting for the new token

const processQueue = (error) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  pendingQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401, and only once per request
    if (error.response?.status !== 401 || originalRequest._retried) {
      return Promise.reject(error);
    }

    // Don't refresh if the failing request IS the refresh call itself
    if (originalRequest.url?.includes("/users/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue up concurrent requests while a refresh is in flight
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => instance(originalRequest));
    }

    originalRequest._retried = true;
    isRefreshing = true;

    try {
      await instance.post("/api/v1/users/refresh");
      processQueue(null);
      return instance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh token is also expired — send user to login
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default instance;