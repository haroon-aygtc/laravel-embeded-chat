/**
 * This file provides a polyfill for the Node.js process object
 * which is required by Next.js router components but not available in browser environments
 */

if (typeof window !== 'undefined' && !window.process) {
    window.process = {
        env: {},
        browser: true,
        version: '',
        platform: '',
        nextTick: (callback: Function) => {
            setTimeout(callback, 0);
        }
    };
}