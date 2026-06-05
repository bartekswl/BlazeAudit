/// <reference types="vite/client" />
import type { BlazeAuditApi } from '../preload';

declare global {
  interface Window {
    blazeaudit: BlazeAuditApi;
  }
}

export {};
