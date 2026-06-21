import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import {
  validateAddressFields,
  validateCountry,
  validateEmail,
  validatePhone,
  validatePostCode,
  validateProvince,
} from '../../../shared/address';
import { BUSINESS_PROFILE_LIMITS, type BusinessProfileInput, type Inspector } from '../../../shared/profile';
import { inputCls } from '../templates/BlockList';

const emptyBusiness = (): BusinessProfileInput => ({
  businessName: '',
  phone: '',
  email: '',
  street: '',
  unit: '',
  city: '',
  postCode: '',
  country: '',
  province: '',
});

export function UserProfileSection() {
  const [business, setBusiness] = useState<BusinessProfileInput>(emptyBusiness);
  const [savedBusiness, setSavedBusiness] = useState<BusinessProfileInput>(emptyBusiness);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof BusinessProfileInput, string>>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [businessSaveNotice, setBusinessSaveNotice] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectorMessage, setInspectorMessage] = useState<string | null>(null);
  const [inspectorError, setInspectorError] = useState<string | null>(null);
  const [newInspectorDraft, setNewInspectorDraft] = useState<{ name: string; licenseNumber: string } | null>(
    null,
  );
  const [savingInspectorId, setSavingInspectorId] = useState<string | null>(null);
  const [savingNewInspector, setSavingNewInspector] = useState(false);

  const refresh = useCallback(async () => {
    const [profile, logo, inspectorRows] = await Promise.all([
      window.blazeaudit.profile.getBusiness(),
      window.blazeaudit.profile.getLogo(),
      window.blazeaudit.profile.listInspectors(),
    ]);
    setBusiness({
      businessName: profile.businessName,
      phone: profile.phone,
      email: profile.email,
      street: profile.street,
      unit: profile.unit,
      city: profile.city,
      postCode: profile.postCode,
      country: profile.country,
      province: profile.province,
    });
    setSavedBusiness({
      businessName: profile.businessName,
      phone: profile.phone,
      email: profile.email,
      street: profile.street,
      unit: profile.unit,
      city: profile.city,
      postCode: profile.postCode,
      country: profile.country,
      province: profile.province,
    });
    setLogoDataUrl(logo);
    setInspectors(inspectorRows);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  const setBusinessField =
    (key: keyof BusinessProfileInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setBusiness((prev) => ({ ...prev, [key]: e.target.value }));
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      setBusinessSaveNotice(null);
    };

  const businessIsDirty =
    JSON.stringify(business) !== JSON.stringify(savedBusiness);

  const saveBusiness = async () => {
    const errs: Partial<Record<keyof BusinessProfileInput, string>> = {};
    const postCodeErr = validatePostCode(business.postCode);
    if (postCodeErr) errs.postCode = postCodeErr;
    const countryErr = validateCountry(business.country);
    if (countryErr) errs.country = countryErr;
    const provinceErr = validateProvince(business.province);
    if (provinceErr) errs.province = provinceErr;
    const phoneErr = validatePhone(business.phone);
    if (phoneErr) errs.phone = phoneErr;
    const emailErr = validateEmail(business.email);
    if (emailErr) errs.email = emailErr;
    const addressErr = validateAddressFields(business);
    if (addressErr && !errs.postCode && !errs.country && !errs.province) {
      errs.street = addressErr;
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSavingBusiness(true);
    setBusinessSaveNotice(null);
    setError(null);
    const hadChanges = businessIsDirty;
    try {
      await window.blazeaudit.profile.updateBusiness(business);
      await refresh();
      if (hadChanges) {
        setBusinessSaveNotice('Business profile saved.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save business profile.');
    } finally {
      setSavingBusiness(false);
    }
  };

  const pickLogo = async () => {
    setLogoBusy(true);
    setError(null);
    try {
      await window.blazeaudit.profile.pickLogo();
      setMessage('Company logo updated.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update logo.');
    } finally {
      setLogoBusy(false);
    }
  };

  const removeLogo = async () => {
    setLogoBusy(true);
    setError(null);
    try {
      await window.blazeaudit.profile.removeLogo();
      setMessage('Company logo removed.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove logo.');
    } finally {
      setLogoBusy(false);
    }
  };

  const beginAddInspector = () => {
    setInspectorError(null);
    setInspectorMessage(null);
    setNewInspectorDraft({ name: '', licenseNumber: '' });
  };

  const cancelNewInspector = () => {
    setNewInspectorDraft(null);
    setInspectorError(null);
  };

  const saveNewInspector = async () => {
    if (!newInspectorDraft) return;
    setSavingNewInspector(true);
    setInspectorError(null);
    setInspectorMessage(null);
    try {
      const saved = await window.blazeaudit.profile.createInspector(newInspectorDraft);
      setInspectors((prev) => [...prev, saved]);
      setNewInspectorDraft(null);
      setInspectorMessage(`Inspector "${saved.name}" saved.`);
    } catch (e) {
      setInspectorError(e instanceof Error ? e.message : 'Could not save inspector.');
    } finally {
      setSavingNewInspector(false);
    }
  };

  const saveInspector = async (inspector: Inspector) => {
    setSavingInspectorId(inspector.id);
    setInspectorError(null);
    setInspectorMessage(null);
    try {
      const saved = await window.blazeaudit.profile.updateInspector(inspector.id, {
        name: inspector.name,
        licenseNumber: inspector.licenseNumber,
      });
      setInspectors((prev) => prev.map((row) => (row.id === saved.id ? saved : row)));
      setInspectorMessage(`Inspector "${saved.name}" saved.`);
    } catch (e) {
      setInspectorError(e instanceof Error ? e.message : 'Could not save inspector.');
    } finally {
      setSavingInspectorId(null);
    }
  };

  const removeInspector = async (id: string) => {
    setInspectorError(null);
    setInspectorMessage(null);
    try {
      await window.blazeaudit.profile.deleteInspector(id);
      setInspectors((prev) => prev.filter((row) => row.id !== id));
      setInspectorMessage('Inspector removed.');
    } catch (e) {
      setInspectorError(e instanceof Error ? e.message : 'Could not remove inspector.');
    }
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
        <p className="text-sm text-neutral-500">Loading profile…</p>
      </section>
    );
  }

  return (
    <section id="user-profile" className="scroll-mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-5">
      <h3 className="text-sm font-medium text-neutral-200">User profile</h3>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        Business details and licensed inspectors used on reports and exports. Stored in your
        encrypted account database.
      </p>

      <div className="mt-5 space-y-4">
        <Field label="Business name">
          <input
            className={inputCls}
            value={business.businessName}
            onChange={setBusinessField('businessName')}
            placeholder="Your company name"
            maxLength={BUSINESS_PROFILE_LIMITS.businessName}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" error={fieldErrors.phone}>
            <input
              className={inputCls}
              type="tel"
              value={business.phone}
              onChange={setBusinessField('phone')}
              placeholder="416-555-0100"
              maxLength={BUSINESS_PROFILE_LIMITS.phone}
            />
          </Field>
          <Field label="Email" error={fieldErrors.email}>
            <input
              className={inputCls}
              type="email"
              value={business.email}
              onChange={setBusinessField('email')}
              placeholder="contact@company.com"
              maxLength={BUSINESS_PROFILE_LIMITS.email}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-neutral-400">Company logo</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid size-16 place-items-center overflow-hidden rounded-lg border border-white/10 bg-neutral-950">
              {logoDataUrl ? (
                <img src={logoDataUrl} alt="Company logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <ImagePlus className="size-6 text-neutral-600" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={logoBusy}
                onClick={() => void pickLogo()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/5 disabled:opacity-50"
              >
                <ImagePlus className="size-3.5" />
                {logoDataUrl ? 'Change logo' : 'Upload logo'}
              </button>
              {logoDataUrl && (
                <button
                  type="button"
                  disabled={logoBusy}
                  onClick={() => void removeLogo()}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-400 hover:bg-white/5 hover:text-red-300 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Address</p>
        <Field label="Street" error={fieldErrors.street}>
          <input
            className={inputCls}
            value={business.street}
            onChange={setBusinessField('street')}
            maxLength={BUSINESS_PROFILE_LIMITS.street}
          />
        </Field>
        <Field label="Unit / suite" error={fieldErrors.unit}>
          <input
            className={inputCls}
            value={business.unit}
            onChange={setBusinessField('unit')}
            maxLength={BUSINESS_PROFILE_LIMITS.unit}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" error={fieldErrors.city}>
            <input
              className={inputCls}
              value={business.city}
              onChange={setBusinessField('city')}
              maxLength={BUSINESS_PROFILE_LIMITS.city}
            />
          </Field>
          <Field label="Post code" error={fieldErrors.postCode}>
            <input
              className={inputCls}
              value={business.postCode}
              onChange={setBusinessField('postCode')}
              placeholder="A1A 1A1"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Province" error={fieldErrors.province}>
            <input
              className={inputCls}
              value={business.province}
              onChange={setBusinessField('province')}
              placeholder="ON"
              maxLength={BUSINESS_PROFILE_LIMITS.province}
            />
          </Field>
          <Field label="Country" error={fieldErrors.country}>
            <input
              className={inputCls}
              value={business.country}
              onChange={setBusinessField('country')}
              placeholder="Canada"
              maxLength={BUSINESS_PROFILE_LIMITS.country}
            />
          </Field>
        </div>

        <button
          type="button"
          disabled={savingBusiness}
          onClick={() => void saveBusiness()}
          className="rounded-lg bg-flame-500 px-3 py-2 text-xs font-semibold text-white hover:bg-flame-600 disabled:opacity-50"
        >
          {savingBusiness ? 'Saving…' : 'Save business profile'}
        </button>
        {businessSaveNotice && (
          <p className="text-xs text-emerald-300">{businessSaveNotice}</p>
        )}
      </div>

      <div className="mt-8 border-t border-white/5 pt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-medium text-neutral-200">Inspectors</h4>
            <p className="mt-1 text-xs text-neutral-500">
              Add everyone who may sign reports. Name and licence number can be pulled into
              documents later.
            </p>
          </div>
          <button
            type="button"
            disabled={newInspectorDraft !== null}
            onClick={beginAddInspector}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-neutral-200 hover:bg-white/5 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            Add inspector
          </button>
        </div>

        {newInspectorDraft && (
          <div className="mb-3 grid gap-2 rounded-lg border border-flame-500/20 bg-flame-500/5 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="Name">
              <input
                className={inputCls}
                value={newInspectorDraft.name}
                onChange={(e) =>
                  setNewInspectorDraft((prev) => prev && { ...prev, name: e.target.value })
                }
                placeholder="Inspector name"
                autoFocus
              />
            </Field>
            <Field label="Licence number">
              <input
                className={inputCls}
                value={newInspectorDraft.licenseNumber}
                onChange={(e) =>
                  setNewInspectorDraft((prev) => prev && { ...prev, licenseNumber: e.target.value })
                }
                placeholder="Licence #"
              />
            </Field>
            <div className="flex items-end gap-2">
              <button
                type="button"
                disabled={savingNewInspector}
                onClick={() => void saveNewInspector()}
                className="rounded-lg bg-flame-500 px-3 py-2 text-xs font-semibold text-white hover:bg-flame-600 disabled:opacity-50"
              >
                {savingNewInspector ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                disabled={savingNewInspector}
                onClick={cancelNewInspector}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-400 hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {inspectors.length === 0 && !newInspectorDraft ? (
          <p className="rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-xs text-neutral-500">
            No inspectors yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {inspectors.map((inspector) => (
              <li
                key={inspector.id}
                className="grid gap-2 rounded-lg border border-white/5 bg-neutral-950/40 p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
              >
                <Field label="Name">
                  <input
                    className={inputCls}
                    value={inspector.name}
                    onChange={(e) =>
                      setInspectors((prev) =>
                        prev.map((row) =>
                          row.id === inspector.id ? { ...row, name: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Inspector name"
                  />
                </Field>
                <Field label="Licence number">
                  <input
                    className={inputCls}
                    value={inspector.licenseNumber}
                    onChange={(e) =>
                      setInspectors((prev) =>
                        prev.map((row) =>
                          row.id === inspector.id
                            ? { ...row, licenseNumber: e.target.value }
                            : row,
                        ),
                      )
                    }
                    placeholder="Licence #"
                  />
                </Field>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={savingInspectorId === inspector.id}
                    onClick={() => void saveInspector(inspector)}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-neutral-200 hover:bg-white/5 disabled:opacity-50"
                  >
                    {savingInspectorId === inspector.id ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    aria-label="Remove inspector"
                    onClick={() => void removeInspector(inspector.id)}
                    className="rounded-md p-2 text-neutral-500 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {inspectorMessage && <p className="mt-3 text-xs text-emerald-300">{inspectorMessage}</p>}
        {inspectorError && <p className="mt-3 text-xs text-red-300">{inspectorError}</p>}
      </div>

      {message && <p className="mt-4 text-xs text-emerald-300">{message}</p>}
      {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-400">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
