import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * ============================================================
 *  FIREBASE CONFIGURATION — PROYECTO apppadre-45209
 * ============================================================
 *
 *  Para compilar la app nativa en Android con Capacitor:
 *    npx cap add android
 *    npx cap copy android
 *    npx cap open android
 *
 *  En Android Studio, pega google-services.json en
 *    app/google-services.json
 *
 *  Colecciones de Firestore usadas por la app:
 *    - licenses:       { key, is_active, max_devices, linked_devices[], created_at }
 *    - devices:        { device_id, max_daily_hours, is_locked, daily_used_seconds, last_reset_date }
 *    - location_logs:  { device_id, lat, lng, timestamp, synced }
 *    - app_usage:      { device_id, package_name, app_name, usage_seconds, date }
 * ============================================================
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyCtlxM8Z_M-8heTL8hv0e-GiQzoLR2NNRE',
  authDomain: 'apppadre-45209.firebaseapp.com',
  projectId: 'apppadre-45209',
  storageBucket: 'apppadre-45209.firebasestorage.app',
  messagingSenderId: '526407414532',
  appId: '1:526407414532:android:76966d8d3f589bfaaed651',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
