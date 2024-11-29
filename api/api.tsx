import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://192.168.88.129:8000';

// Function to call the root endpoint
export const getRoot = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/`, { timeout: 5000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching root endpoint:', error);
        if (axios.isAxiosError(error)) {
            if (error instanceof Error) {
                console.error('Axios error details:', JSON.stringify(error));
            }
        }
        throw error;
    }
};

// Function to call the status endpoint
export const getStatus = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/status`, { timeout: 5000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching status endpoint:', error);
        if (axios.isAxiosError(error)) {
            if (error instanceof axios.AxiosError) {
                console.error('Axios error details:', (error as axios.AxiosError).toJSON());
            }
        }
        throw error;
    }
};

// Function to call the signup endpoint
export const signup = async (username: string, email: string, password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/v3/signup`, {
            username,
            email,
            password
        }, { timeout: 5000 });
        return response.data;
    } catch (error) {
        console.error('Error during signup:', error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', (error as axios.AxiosError).toJSON());
        }
        throw error;
    }
};

// Function to call the login endpoint
export const login = async (username: string, password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/v3/login`, new URLSearchParams({
            username,
            password
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error('Error during login:', error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', (error as axios.AxiosError).toJSON());
        }
        throw error;
    }
};

// Function to call any endpoint with a given path and JWT token for authentication
export const callApiWithAuth = async (path: string, token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}${path}`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${path} endpoint with auth:`, error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', (error as axios.AxiosError).toJSON());
        }
        throw error;
    }
};