const isReplit = process.env.REPLIT_ENVIRONMENT;
const replitBackendUrl = 'http://localhost:3001';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE || (isReplit ? replitBackendUrl : 'https://add-is.onrender.com');
