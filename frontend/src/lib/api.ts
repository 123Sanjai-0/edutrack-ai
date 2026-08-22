const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? "/api" : "http://127.0.0.1:8000/api");

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    authToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("edutrack_token");
      localStorage.removeItem("edutrack_refresh_token");
      localStorage.removeItem("edutrack_user");
    }
  } else {
    authToken = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("edutrack_token", token);
    }
  }
};

export const getStoredToken = (): string | null => {
  if (authToken && authToken !== "undefined" && authToken !== "null") return authToken;
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("edutrack_token");
    if (!token || token === "undefined" || token === "null" || token.trim() === "") {
      localStorage.removeItem("edutrack_token");
      authToken = null;
      return null;
    }
    authToken = token;
    return token;
  }
  return null;
};

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401 && typeof window !== "undefined") {
      // Token might be expired
      // In production, trigger refresh token workflow
    }

    const contentType = res.headers.get("content-type") || "";

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let errorData: any = {};
      try {
        errorData = text ? JSON.parse(text) : {};
      } catch {
        errorData = { detail: text || `API request failed with status ${res.status}` };
      }
      throw new ApiError(
        res.status,
        errorData?.detail || `API request failed with status ${res.status}`,
        errorData
      );
    }

    if (contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      if (!text || text.trim() === "" || text.trim() === "undefined") {
        return {} as T;
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        return {} as T;
      }
    }

    const blob = await res.blob().catch(() => new Blob([]));
    return blob as unknown as T;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, error.message || "Network request failed");
  }
}

export const api = {
  // Auth
  auth: {
    login: async (credentials: { username_or_email: string; password: string }) => {
      const data = await apiRequest<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        user: any;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (!data || !data.access_token || !data.user) {
        throw new ApiError(401, "Invalid response from server. Please check backend connection.");
      }
      setAuthToken(data.access_token);
      if (typeof window !== "undefined") {
        if (data.refresh_token) localStorage.setItem("edutrack_refresh_token", data.refresh_token);
        if (data.user) localStorage.setItem("edutrack_user", JSON.stringify(data.user));
      }
      return data;
    },
    me: async () => apiRequest<any>("/auth/me"),
    logout: () => {
      setAuthToken(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("edutrack_user");
        window.location.href = "/login";
      }
    },
  },

  // Students
  students: {
    list: async (params?: Record<string, any>) => {
      const query = params ? "?" + new URLSearchParams(params).toString() : "";
      return apiRequest<any>(`/students${query}`);
    },
    get: async (id: number) => apiRequest<any>(`/students/${id}`),
    create: async (data: any) =>
      apiRequest<any>("/students", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id: number, data: any) =>
      apiRequest<any>(`/students/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id: number) =>
      apiRequest<any>(`/students/${id}`, { method: "DELETE" }),
    getAnalytics: async (id: number) =>
      apiRequest<any>(`/students/${id}/analytics`),
  },

  // Faculty
  faculty: {
    list: async (deptId?: number) => {
      const query = deptId ? `?department_id=${deptId}` : "";
      return apiRequest<any[]>(`/faculty${query}`);
    },
    getMyClasses: async () => apiRequest<any[]>("/faculty/me/classes"),
  },

  // Academics
  academics: {
    getDepartments: async () => apiRequest<any[]>("/academics/departments"),
    getCourses: async (deptId?: number) =>
      apiRequest<any[]>(`/academics/courses${deptId ? `?department_id=${deptId}` : ""}`),
    getSemesters: async () => apiRequest<any[]>("/academics/semesters"),
    getSubjects: async (deptId?: number, semId?: number) => {
      const params = new URLSearchParams();
      if (deptId) params.append("department_id", deptId.toString());
      if (semId) params.append("semester_id", semId.toString());
      const query = params.toString() ? `?${params.toString()}` : "";
      return apiRequest<any[]>(`/academics/subjects${query}`);
    },
    getClasses: async (deptId?: number, semId?: number) => {
      const params = new URLSearchParams();
      if (deptId) params.append("department_id", deptId.toString());
      if (semId) params.append("semester_id", semId.toString());
      const query = params.toString() ? `?${params.toString()}` : "";
      return apiRequest<any[]>(`/academics/classes${query}`);
    },
  },

  // Marks & Assessments
  marks: {
    getExams: async (subjectId?: number, classId?: number) => {
      const params = new URLSearchParams();
      if (subjectId) params.append("subject_id", subjectId.toString());
      if (classId) params.append("class_section_id", classId.toString());
      const query = params.toString() ? `?${params.toString()}` : "";
      return apiRequest<any[]>(`/marks/exams${query}`);
    },
    createExam: async (data: any) =>
      apiRequest<any>("/marks/exams", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getExamResults: async (examId: number) =>
      apiRequest<any[]>(`/marks/exam/${examId}/results`),
    saveBulkMarks: async (data: { exam_id: number; marks: any[] }) =>
      apiRequest<any>("/marks/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    uploadCsv: async (examId: number, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiRequest<any>(`/marks/upload-csv?exam_id=${examId}`, {
        method: "POST",
        body: formData,
      });
    },
  },

  // Attendance
  attendance: {
    getSheet: async (classId: number, subjectId: number, dateStr?: string, period: number = 1) => {
      const params = new URLSearchParams({
        class_section_id: classId.toString(),
        subject_id: subjectId.toString(),
        period: period.toString(),
      });
      if (dateStr) params.append("record_date", dateStr);
      return apiRequest<any>(`/attendance/sheet?${params.toString()}`);
    },
    saveBulk: async (data: any) =>
      apiRequest<any>("/attendance/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getStudentSummary: async (studentId: number) =>
      apiRequest<any>(`/attendance/student/${studentId}/summary`),
  },

  // Analytics & Dashboards
  analytics: {
    getAdminStats: async (deptId?: number, semId?: number) => {
      const params = new URLSearchParams();
      if (deptId) params.append("department_id", deptId.toString());
      if (semId) params.append("semester_id", semId.toString());
      const query = params.toString() ? `?${params.toString()}` : "";
      return apiRequest<any>(`/analytics/admin${query}`);
    },
    getFacultyStats: async (classId?: number) => {
      const query = classId ? `?class_section_id=${classId}` : "";
      return apiRequest<any>(`/analytics/faculty${query}`);
    },
    getHeatmap: async (classId?: number) => {
      const query = classId ? `?class_section_id=${classId}` : "";
      return apiRequest<any>(`/analytics/heatmap${query}`);
    },
  },

  // ML Pipeline
  ml: {
    train: async (params?: any) =>
      apiRequest<any>("/ml/train", {
        method: "POST",
        body: JSON.stringify(params || {}),
      }),
    predict: async (features: any) =>
      apiRequest<any>("/ml/predict", {
        method: "POST",
        body: JSON.stringify(features),
      }),
    getMeta: async () => apiRequest<any>("/ml/meta"),
  },

  // Recommendations
  recommendations: {
    getForStudent: async (studentId: number) =>
      apiRequest<any[]>(`/recommendations/student/${studentId}`),
    updateStatus: async (id: number, status: string) =>
      apiRequest<any>(`/recommendations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
  },

  // Goals
  goals: {
    getForStudent: async (studentId: number) =>
      apiRequest<any[]>(`/goals/student/${studentId}`),
    create: async (data: any) =>
      apiRequest<any>("/goals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: async (id: number, data: any) =>
      apiRequest<any>(`/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Notifications
  notifications: {
    getAll: async () => apiRequest<any[]>("/notifications"),
    markRead: async (id: number) =>
      apiRequest<any>(`/notifications/${id}/read`, { method: "PUT" }),
    markAllRead: async () =>
      apiRequest<any>("/notifications/read-all", { method: "PUT" }),
  },

  // Configuration
  config: {
    get: async () => apiRequest<any>("/config"),
    update: async (data: any) =>
      apiRequest<any>("/config", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },

  // Audit Logs
  audit: {
    getLogs: async (page: number = 1, pageSize: number = 25) =>
      apiRequest<any[]>(`/audit/logs?page=${page}&page_size=${pageSize}`),
  },

  // Reports
  reports: {
    getStudentPdfUrl: (studentId: number) => `${API_BASE_URL}/reports/student/${studentId}/pdf`,
    getStudentsCsvUrl: () => `${API_BASE_URL}/students/export/csv`,
    getClassCsvUrl: (classId: number) => `${API_BASE_URL}/reports/class/${classId}/csv`,
  },

  // Public Lookup (no auth required)
  lookup: {
    studentByEmail: async (email: string) =>
      apiRequest<any>(`/lookup/student?email=${encodeURIComponent(email)}`),
  },
};
