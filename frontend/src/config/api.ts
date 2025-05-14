/**
 * API Configuration
 * 
 * Centralized API configuration settings
 */

import { API_BASE_URL } from './constants';

export { API_BASE_URL };

export const API_TIMEOUT = 30000; // 30 seconds

export const API_HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
}; 