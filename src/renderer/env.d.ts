/// <reference types="vite/client" />
import type { BlazeAuditApi } from '../preload';

declare const __BLAZEAUDIT_DEV_ACTIVATION__: boolean;

declare global {
  interface Window {
    blazeaudit: BlazeAuditApi;
  }
}

export {};
