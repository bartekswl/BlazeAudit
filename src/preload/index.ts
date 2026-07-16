import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '../shared/ipc';
import type {
  ActivateInput,
  AuthStatus,
  LoginInput,
  SecuritySettings,
  SetPasswordInput,
} from '../shared/auth';
import type { LoginPolicy } from '../shared/loginPolicy';
import type { ColorTheme } from '../shared/theme';
import type { BuiltinTemplate } from '../shared/form';
import type {
  BuiltinTemplateSummary,
  CustomTemplateSummary,
  DocumentContext,
  Template,
  TemplateInput,
  TemplatePickerItem,
  TemplateRef,
} from '../shared/document';
import type {
  CreateInspectionInput,
  DashboardStats,
  Inspection,
  InspectionInput,
  InspectionSummary,
} from '../shared/inspection';
import type {
  BusinessProfile,
  BusinessProfileInput,
  Inspector,
  InspectorInput,
} from '../shared/profile';
import type { NameBadge, NameBadgeInput } from '../shared/nameBadges';
import type { RollbackInfo, UpdateStatus } from '../shared/update';
import type { Client, ClientInput } from '../shared/types';

const api = {
  window: {
    minimize: (): void => ipcRenderer.send(IpcChannels.windowMinimize),
    toggleMaximize: (): void => ipcRenderer.send(IpcChannels.windowToggleMaximize),
    close: (): void => ipcRenderer.send(IpcChannels.windowClose),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke(IpcChannels.windowIsMaximized),
    /** Subscribe to maximize/unmaximize changes. Returns an unsubscribe function. */
    onMaximizeChange: (callback: (isMaximized: boolean) => void): (() => void) => {
      const listener = (_event: unknown, isMaximized: boolean) => callback(isMaximized);
      ipcRenderer.on(IpcChannels.windowMaximizeChanged, listener);
      return () => ipcRenderer.removeListener(IpcChannels.windowMaximizeChanged, listener);
    },
  },
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke(IpcChannels.appVersion),
    getIconUrl: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.appIconUrl),
    getTitleBarIconUrl: (): Promise<string | null> =>
      ipcRenderer.invoke(IpcChannels.appTitleBarIconUrl),
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.appOpenExternal, url),
  },
  update: {
    check: (): Promise<void> => ipcRenderer.invoke(IpcChannels.updateCheck),
    download: (): Promise<void> => ipcRenderer.invoke(IpcChannels.updateDownload),
    install: (): Promise<void> => ipcRenderer.invoke(IpcChannels.updateInstall),
    rollback: (): Promise<void> => ipcRenderer.invoke(IpcChannels.updateRollback),
    getRollbackInfo: (): Promise<RollbackInfo> => ipcRenderer.invoke(IpcChannels.updateGetRollbackInfo),
    /** Subscribe to update lifecycle status. Returns an unsubscribe function. */
    onStatus: (callback: (status: UpdateStatus) => void): (() => void) => {
      const listener = (_event: unknown, status: UpdateStatus) => callback(status);
      ipcRenderer.on(IpcChannels.updateStatus, listener);
      return () => ipcRenderer.removeListener(IpcChannels.updateStatus, listener);
    },
  },
  clients: {
    list: (): Promise<Client[]> => ipcRenderer.invoke(IpcChannels.clientsList),
    get: (id: string): Promise<Client | null> => ipcRenderer.invoke(IpcChannels.clientsGet, id),
    create: (input: ClientInput): Promise<Client> =>
      ipcRenderer.invoke(IpcChannels.clientsCreate, input),
    update: (id: string, input: ClientInput): Promise<Client> =>
      ipcRenderer.invoke(IpcChannels.clientsUpdate, id, input),
    remove: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.clientsDelete, id),
  },
  auth: {
    getStatus: (): Promise<AuthStatus> => ipcRenderer.invoke(IpcChannels.authGetStatus),
    activate: (input: ActivateInput): Promise<{ email: string }> =>
      ipcRenderer.invoke(IpcChannels.authActivate, input),
    setPassword: (input: SetPasswordInput): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.authSetPassword, input),
    login: (input: LoginInput): Promise<void> => ipcRenderer.invoke(IpcChannels.authLogin, input),
    logOut: (): Promise<void> => ipcRenderer.invoke(IpcChannels.authLogOut),
    selectAccount: (accountId: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.authSelectAccount, accountId),
    beginAddAccount: (): Promise<void> => ipcRenderer.invoke(IpcChannels.authBeginAddAccount),
    returnToLogin: (): Promise<void> => ipcRenderer.invoke(IpcChannels.authReturnToLogin),
    getSecuritySettings: (): Promise<SecuritySettings> =>
      ipcRenderer.invoke(IpcChannels.authGetSecuritySettings),
    setLoginPolicy: (policy: LoginPolicy): Promise<LoginPolicy> =>
      ipcRenderer.invoke(IpcChannels.authSetLoginPolicy, policy),
    setColorTheme: (theme: ColorTheme): Promise<ColorTheme> =>
      ipcRenderer.invoke(IpcChannels.authSetColorTheme, theme),
  },
  database: {
    exportClientsCsv: (): Promise<{ saved: false } | { saved: true; filePath: string }> =>
      ipcRenderer.invoke(IpcChannels.databaseExportClientsCsv),
    getDataDir: (): Promise<string> => ipcRenderer.invoke(IpcChannels.databaseGetDataDir),
    openDataFolder: (): Promise<{ opened: true; path: string }> =>
      ipcRenderer.invoke(IpcChannels.databaseOpenDataFolder),
    importTemplateJson: (): Promise<
      { imported: false } | { imported: true; templateId: string; filePath: string }
    > => ipcRenderer.invoke(IpcChannels.customTemplatesImportJson),
  },
  templates: {
    builtin: {
      list: (): Promise<BuiltinTemplateSummary[]> =>
        ipcRenderer.invoke(IpcChannels.builtinTemplatesList),
      get: (id: string): Promise<BuiltinTemplate | null> =>
        ipcRenderer.invoke(IpcChannels.builtinTemplatesGet, id),
    },
    custom: {
      list: (): Promise<CustomTemplateSummary[]> =>
        ipcRenderer.invoke(IpcChannels.customTemplatesList),
      get: (id: string): Promise<Template | null> =>
        ipcRenderer.invoke(IpcChannels.customTemplatesGet, id),
      create: (input: TemplateInput): Promise<Template> =>
        ipcRenderer.invoke(IpcChannels.customTemplatesCreate, input),
      update: (id: string, input: TemplateInput): Promise<Template> =>
        ipcRenderer.invoke(IpcChannels.customTemplatesUpdate, id, input),
      remove: (id: string): Promise<void> =>
        ipcRenderer.invoke(IpcChannels.customTemplatesDelete, id),
      duplicate: (id: string): Promise<Template> =>
        ipcRenderer.invoke(IpcChannels.customTemplatesDuplicate, id),
      exportJson: (id: string): Promise<{ saved: false } | { saved: true; filePath: string }> =>
        ipcRenderer.invoke(IpcChannels.customTemplatesExportJson, id),
      importJson: (): Promise<
        { imported: false } | { imported: true; templateId: string; filePath: string }
      > => ipcRenderer.invoke(IpcChannels.customTemplatesImportJson),
    },
    listForPicker: (): Promise<TemplatePickerItem[]> =>
      ipcRenderer.invoke(IpcChannels.templatesListForPicker),
    resolve: (ref: TemplateRef): Promise<Template | null> =>
      ipcRenderer.invoke(IpcChannels.templatesResolve, ref),
    exportSchemaKit: (): Promise<{ saved: false } | { saved: true; directory: string }> =>
      ipcRenderer.invoke(IpcChannels.templatesExportSchemaKit),
  },
  inspections: {
    list: (options?: { clientId?: string }): Promise<InspectionSummary[]> =>
      ipcRenderer.invoke(IpcChannels.inspectionsList, options),
    get: (id: string): Promise<Inspection | null> =>
      ipcRenderer.invoke(IpcChannels.inspectionsGet, id),
    create: (input: CreateInspectionInput): Promise<Inspection> =>
      ipcRenderer.invoke(IpcChannels.inspectionsCreate, input),
    update: (id: string, input: InspectionInput): Promise<Inspection> =>
      ipcRenderer.invoke(IpcChannels.inspectionsUpdate, id, input),
    remove: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.inspectionsDelete, id),
    getDashboard: (): Promise<DashboardStats> =>
      ipcRenderer.invoke(IpcChannels.inspectionsDashboard),
    getClientStats: (
      clientId: string,
    ): Promise<{
      documentCount: number;
      lastDocumentDate: string | null;
      nextInspectionDue: string | null;
    }> => ipcRenderer.invoke(IpcChannels.inspectionsClientStats, clientId),
    exportPdf: (
      id: string,
      html?: string,
    ): Promise<{ saved: false } | { saved: true; filePath: string }> =>
      ipcRenderer.invoke(IpcChannels.inspectionsExportPdf, id, html),
    importPdf: (): Promise<
      { imported: false } | { imported: true; inspectionId: string; filePath: string }
    > => ipcRenderer.invoke(IpcChannels.inspectionsImportPdf),
    resolveContext: (id: string): Promise<DocumentContext> =>
      ipcRenderer.invoke(IpcChannels.inspectionsResolveContext, id),
  },
  profile: {
    getBusiness: (): Promise<BusinessProfile> =>
      ipcRenderer.invoke(IpcChannels.profileGetBusiness),
    updateBusiness: (input: BusinessProfileInput): Promise<BusinessProfile> =>
      ipcRenderer.invoke(IpcChannels.profileUpdateBusiness, input),
    getLogo: (): Promise<string | null> => ipcRenderer.invoke(IpcChannels.profileGetLogo),
    pickLogo: (): Promise<BusinessProfile> => ipcRenderer.invoke(IpcChannels.profilePickLogo),
    removeLogo: (): Promise<BusinessProfile> => ipcRenderer.invoke(IpcChannels.profileRemoveLogo),
    listInspectors: (): Promise<Inspector[]> =>
      ipcRenderer.invoke(IpcChannels.profileListInspectors),
    createInspector: (input: InspectorInput): Promise<Inspector> =>
      ipcRenderer.invoke(IpcChannels.profileCreateInspector, input),
    updateInspector: (id: string, input: InspectorInput): Promise<Inspector> =>
      ipcRenderer.invoke(IpcChannels.profileUpdateInspector, id, input),
    deleteInspector: (id: string): Promise<void> =>
      ipcRenderer.invoke(IpcChannels.profileDeleteInspector, id),
  },
  nameBadges: {
    list: (): Promise<NameBadge[]> => ipcRenderer.invoke(IpcChannels.nameBadgesList),
    create: (input?: NameBadgeInput): Promise<NameBadge> =>
      ipcRenderer.invoke(IpcChannels.nameBadgesCreate, input),
    update: (id: string, input: NameBadgeInput): Promise<NameBadge> =>
      ipcRenderer.invoke(IpcChannels.nameBadgesUpdate, id, input),
    remove: (id: string): Promise<void> => ipcRenderer.invoke(IpcChannels.nameBadgesDelete, id),
    getPhoto: (id: string): Promise<string | null> =>
      ipcRenderer.invoke(IpcChannels.nameBadgesGetPhoto, id),
    pickPhoto: (id: string): Promise<NameBadge> =>
      ipcRenderer.invoke(IpcChannels.nameBadgesPickPhoto, id),
    removePhoto: (id: string): Promise<NameBadge> =>
      ipcRenderer.invoke(IpcChannels.nameBadgesRemovePhoto, id),
    exportPdf: (
      html: string,
      defaultFilename?: string,
    ): Promise<{ saved: false } | { saved: true; filePath: string }> =>
      ipcRenderer.invoke(IpcChannels.nameBadgesExportPdf, html, defaultFilename),
  },
};

contextBridge.exposeInMainWorld('blazeaudit', api);

export type BlazeAuditApi = typeof api;
