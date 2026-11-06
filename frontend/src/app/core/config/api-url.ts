import { environment } from '../../../environments/environment';

/** Base URL of the FastAPI backend (Render in production, uvicorn locally). */
export const API_URL = environment.apiUrl.replace(/\/$/, '');

/** Club WhatsApp used while /public/club has not answered yet (Render may be waking up). */
export const DEFAULT_WHATSAPP = '573218543957';
