/**
 * Utility function to get the authentication header
 * Uses localStorage to retrieve the token
 */
export const authHeader = () => {
    const token = localStorage.getItem('auth_token');

    if (token) {
        return { Authorization: `Bearer ${token}` };
    }

    return {};
}; 