export interface ActivateRequest {
  email: string;
  activationKey: string;
  instanceId: string;
  appVersion: string;
}

export interface ActivateResponse {
  keyX: string;
  token: string;
}

export interface ValidateRequest {
  email: string;
  instanceId: string;
  token: string;
}

export interface ValidateResponse {
  valid: boolean;
  revoked: boolean;
}

export interface LicenseClient {
  activate(request: ActivateRequest): Promise<ActivateResponse>;
  validate(request: ValidateRequest): Promise<ValidateResponse>;
}
