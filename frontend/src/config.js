// Central place for environment-driven config.
// Falls back to localhost so local dev keeps working without a .env file,
// but production/deploy setups should set REACT_APP_API_URL.
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
