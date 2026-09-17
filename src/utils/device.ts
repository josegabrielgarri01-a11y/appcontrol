const DEVICE_ID_KEY = 'pc_device_id';
const MASTER_PIN_KEY = 'pc_master_pin';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getMasterPin(): string {
  return localStorage.getItem(MASTER_PIN_KEY) || '0000';
}

export function setMasterPin(pin: string): void {
  localStorage.setItem(MASTER_PIN_KEY, pin);
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}
