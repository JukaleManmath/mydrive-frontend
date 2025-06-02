import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mydrive-backend-oi3r.onrender.com';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    withCredentials: true
});

// Add request interceptor to add token to all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login if unauthorized
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/token', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/register', {
        email: userData.email,
        username: userData.username,
        password: userData.password,
    });
    return response.data;
};

export const uploadFile = async (file, parentId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId !== null) {
        formData.append('parent_id', parentId);
    }
    const response = await api.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getFiles = async (parentId = null) => {
    const params = parentId !== null ? { parent_id: parentId } : {};
    const response = await api.get('/files/', { params });
    return response.data;
};

export const getAllFiles = async () => {
    const response = await api.get('/files/all');
    return response.data;
};

export const downloadFile = async (fileId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Use the configured api instance which already has the token handling
        const response = await api.get(`/files/${fileId}/download`, {
            responseType: 'blob',
            headers: {
                'Accept': '*/*'
            }
        });

        // Return the blob directly
        return response.data;
    } catch (error) {
        console.error('Error downloading file:', error);
        if (error.response) {
            if (error.response.status === 401) {
                // Clear token and redirect to login if unauthorized
                localStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Authentication failed. Please log in again.');
            } else if (error.response.status === 404) {
                throw new Error('File not found');
            } else if (error.response.status === 403) {
                throw new Error('You do not have permission to download this file');
            }
            throw new Error(error.response.data?.detail || 'Failed to download file');
        } else if (error.request) {
            throw new Error('No response from server. Please check your connection.');
        } else {
            throw new Error(error.message || 'Failed to download file');
        }
    }
};

export const deleteFile = async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
};

export const shareFile = async (fileId, email, permission = "read") => {
    const response = await api.post(`/files/${fileId}/share`, {
        shared_with_email: email,
        permission,
    });
    return response.data;
};

export const getFilesSharedWithMe = async () => {
    try {
        const response = await api.get('/files/shared-with-me');
        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response format');
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching shared files:', error);
        throw error;
    }
};

export const getRecentSharedFiles = async () => {
    try {
        const response = await api.get('/files/recent-shared');
        if (!Array.isArray(response.data)) {
            throw new Error('Invalid response format');
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching recent shared files:', error);
        throw error;
    }
};

export const getFileContent = async (fileId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Use fetch directly to handle both text and binary
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://mydrive-backend-oi3r.onrender.com'}/files/${fileId}/content`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Authentication failed. Please log in again.');
            } else if (response.status === 404) {
                throw new Error('File not found');
            } else if (response.status === 500) {
                throw new Error('Server error occurred while fetching file content');
            }
            throw new Error('Failed to fetch file content');
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('text/')) {
            const content = await response.text();
            return { content };
        } else {
            // For binary files (images, pdf, etc.)
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            return { url };
        }
    } catch (error) {
        console.error('Error fetching file content:', error);
        throw new Error(error.message || 'Failed to fetch file content');
    }
};

export const moveFile = async (fileId, targetParentId) => {
    const response = await api.patch(`/files/${fileId}/move`, {
        target_parent_id: targetParentId
    });
    return response.data;
};

export const getFileVersions = async (fileId) => {
    const response = await api.get(`/files/${fileId}/versions`);
    return response.data;
};

export const getVersionContent = async (fileId, versionNumber) => {
    const response = await api.get(`/files/${fileId}/versions/${versionNumber}/content`);
    return response.data;
};

export const restoreVersion = async (fileId, versionNumber) => {
    const response = await api.post(`/files/${fileId}/versions/${versionNumber}/restore`);
    return response.data;
};

export const deleteFileVersion = async (fileId, versionNumber) => {
    const response = await api.delete(`/files/${fileId}/versions/${versionNumber}`);
    return response.data;
};

export default api; 