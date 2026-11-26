import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Activity,
  Edit3,
  LogIn,
  Clock,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  Plus,
  Copy,
  Check,
  CheckCircle2,
  Send,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { OidcSettings } from '../OidcSettings.js';
import { ApiKeyItem } from '../../types/index.js';
import { formatDisplayDate, formatDisplayDateTime, formatRelativeTime } from '../../utils/format.js';

export const UsersSettingsTab: React.FC = () => {
  const { t } = useLanguage();
  const { refreshAuthStatus } = useAuth();

  // Security mode state
  const [disableAuth, setDisableAuth] = useState(false);
  const [isEnvEnforced, setIsEnvEnforced] = useState(false);
  const [allowGuestAccess, setAllowGuestAccess] = useState(true);
  const [enableProxyAuth, setEnableProxyAuth] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'driver' | 'user'>('driver');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Reset modal state
  const [resetModalUser, setResetModalUser] = useState<{ id: string; email: string; resetLink?: string } | null>(null);
  const [generatingReset, setGeneratingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  // API keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadSecuritySettings = async () => {
    try {
      const res = await apiFetch<{ disableAuth: boolean; isEnvEnforced: boolean; allowGuestAccess?: boolean; enableProxyAuth?: boolean }>('/api/settings/security');
      setDisableAuth(res.disableAuth);
      setIsEnvEnforced(res.isEnvEnforced);
      if (typeof res.allowGuestAccess === 'boolean') {
        setAllowGuestAccess(res.allowGuestAccess);
      }
      if (typeof res.enableProxyAuth === 'boolean') {
        setEnableProxyAuth(res.enableProxyAuth);
      }
    } catch {}
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await apiFetch<{ users: any[] }>('/api/auth/users');
      setUsersList(res.users);
    } catch {
      // Non-admins ignore
    } finally {
      setUsersLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const res = await apiFetch<{ apiKeys: ApiKeyItem[] }>('/api/auth/api-keys');
      setApiKeys(res.apiKeys);
    } catch {}
  };

  useEffect(() => {
    loadSecuritySettings();
    loadUsers();
    loadApiKeys();
  }, []);

  const handleToggleDisableAuth = async (newVal: boolean) => {
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; disableAuth: boolean; message: string }>('/api/settings/security', {
        method: 'PUT',
        body: JSON.stringify({ disableAuth: newVal }),
      });
      setDisableAuth(res.disableAuth);
      setSecurityMessage(res.message);
      await refreshAuthStatus();
    } catch (err: any) {
      setSecurityMessage(err?.message || t('usersAuthToggleFailed'));
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleToggleAllowGuestAccess = async (newVal: boolean) => {
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; allowGuestAccess: boolean; message: string }>('/api/settings/security', {
        method: 'PUT',
        body: JSON.stringify({ allowGuestAccess: newVal }),
      });
      setAllowGuestAccess(res.allowGuestAccess);
      setSecurityMessage(res.message);
      await refreshAuthStatus();
    } catch (err: any) {
      setSecurityMessage(err?.message || t('usersGuestToggleFailed'));
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleToggleProxyAuth = async (newVal: boolean) => {
    setSecurityLoading(true);
    setSecurityMessage(null);
    try {
      const res = await apiFetch<{ success: boolean; enableProxyAuth: boolean; message: string }>('/api/settings/security', {
        method: 'PUT',
        body: JSON.stringify({ enableProxyAuth: newVal }),
      });
      setEnableProxyAuth(res.enableProxyAuth);
      setSecurityMessage(res.message);
      await refreshAuthStatus();
    } catch (err: any) {
      setSecurityMessage(err?.message || t('usersProxyToggleFailed'));
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await apiFetch(`/api/auth/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || t('usersRoleUpdateFailed'));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    setCreatingUser(true);
    try {
      await apiFetch('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newUserEmail,
          role: newUserRole,
          password: newUserPassword || undefined,
        }),
      });
      setIsCreateUserModalOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('driver');
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || t('usersCreateFailed'));
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const user = usersList.find((x) => x.id === userId);
    const lastActiveText = user?.last_active_at
      ? t('usersLastActive', {
          date: formatDisplayDate(user.last_active_at),
          relative: formatRelativeTime(user.last_active_at),
        })
      : t('usersNeverLoggedIn');
    const warningVehicles = (user?.vehicle_count || 0) > 0
      ? `\n\n${t('usersDeleteVehicleWarning', { count: user.vehicle_count })}`
      : '';

    if (!confirm(`${t('usersConfirmDelete', { email: userEmail })}\n(${lastActiveText})${warningVehicles}`)) return;
    try {
      await apiFetch(`/api/auth/users/${userId}`, { method: 'DELETE' });
      await loadUsers();
    } catch (err: any) {
      alert(err?.message || t('usersDeleteFailed'));
    }
  };

  const handleGenerateReset = async (userId: string, userEmail: string, sendEmail = false) => {
    setGeneratingReset(true);
    setResetFeedback(null);
    setResetCopied(false);
    try {
      const res = await apiFetch<any>(`/api/auth/users/${userId}/reset-link`, {
        method: 'POST',
        body: JSON.stringify({ sendEmail }),
      });
      if (res.resetLink) {
        setResetModalUser({ id: userId, email: userEmail, resetLink: res.resetLink });
        if (sendEmail) {
          setResetFeedback(res.emailSent ? t('usersResetEmailSent') : res.emailMessage || t('usersResetEmailFailed'));
        }
      }
    } catch (err: any) {
      alert(err?.message || t('usersResetLinkFailed'));
    } finally {
      setGeneratingReset(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    try {
      const res = await apiFetch<{ apiKey: string }>('/api/auth/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName }),
      });
      setGeneratedKey(res.apiKey);
      setNewKeyName('');
      loadApiKeys();
    } catch (err: any) {
      alert(err?.message || t('profileKeyCreateFailed'));
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm(t('profileConfirmRevokeKey'))) return;
    try {
      await apiFetch(`/api/auth/api-keys/${id}`, { method: 'DELETE' });
      loadApiKeys();
    } catch (err: any) {
      alert(err?.message || t('usersApiKeyDeleteFailed'));
    }
  };

  // The email is shown in bold inside the translated sentence.
  const [resetTextBefore, resetTextAfter = ''] = t('usersResetGenerated').split('{email}');

  return (
    <div className="space-y-6">
      {/* Reverse Proxy / No-Auth Toggle */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-500" />
              <span>{t('usersSecurityTitle')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('usersSecurityHint')}</p>
          </div>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1.5 self-start sm:self-center ${
              disableAuth
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800/60'
            }`}
          >
            {disableAuth ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{disableAuth ? t('usersNoAuthBadge') : t('usersSecuredBadge')}</span>
          </span>
        </div>

        {securityMessage && (
          <div className="p-3 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 text-sky-800 dark:text-sky-300 rounded-xl text-xs font-medium">
            {securityMessage}
          </div>
        )}

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5 pr-4">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('usersDisableAuthLabel')}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('usersDisableAuthHint')}</span>
          </div>

          <button
            type="button"
            disabled={securityLoading || isEnvEnforced}
            onClick={() => handleToggleDisableAuth(!disableAuth)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              disableAuth ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
            } ${isEnvEnforced ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                disableAuth ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5 pr-4">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Reverse Proxy SSO (Pangolin / Authelia / Authentik)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('usersProxyAuthHint')}</span>
          </div>

          <button
            type="button"
            disabled={securityLoading}
            onClick={() => handleToggleProxyAuth(!enableProxyAuth)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enableProxyAuth ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enableProxyAuth ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800">
          <div className="space-y-0.5 pr-4">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">{t('usersGuestAccessLabel')}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('usersGuestAccessHint')}</span>
          </div>

          <button
            type="button"
            disabled={securityLoading}
            onClick={() => handleToggleAllowGuestAccess(!allowGuestAccess)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              allowGuestAccess ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                allowGuestAccess ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Users List & Roles Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>{t('usersTitle')}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('usersHint')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateUserModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('usersAdd')}</span>
            </button>
            <button
              type="button"
              onClick={loadUsers}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition"
              title={t('refresh')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {usersLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">{t('usersLoading')}</div>
        ) : usersList.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">{t('usersEmpty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">{t('usersEmailLabel')}</th>
                  <th className="py-2.5 px-3">{t('usersColRole')}</th>
                  <th className="py-2.5 px-3">{t('usersColActivity')}</th>
                  <th className="py-2.5 px-3">{t('usersColRegistered')}</th>
                  <th className="py-2.5 px-3 text-right">{t('usersColAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white block">{u.email}</span>
                        {u.is_guest && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0"
                            title={t('usersGuestBadgeTitle')}
                          >
                            {t('usersGuestBadge')}
                          </span>
                        )}
                        {u.is_dormant && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shrink-0"
                            title={t('usersDormantBadgeTitle')}
                          >
                            {t('usersDormantBadge')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">{u.id}</span>
                        {u.vehicle_count > 0 && (
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                            🚗 {t(u.vehicle_count === 1 ? 'usersVehicleCountOne' : 'usersVehicleCountMany', { count: u.vehicle_count })}
                          </span>
                        )}
                        {u.shared_vehicle_count > 0 && (
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                            🔑 {t('usersSharedCount', { count: u.shared_vehicle_count })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value="admin">👑 Super-Admin</option>
                        <option value="user">{t('usersRoleOptionUser')}</option>
                        <option value="driver">{t('usersRoleOptionDriver')}</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      {u.last_active_at ? (
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                            <Activity className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{formatDisplayDateTime(u.last_active_at)}</span>
                            <span className="text-[10px] font-normal text-slate-400">({formatRelativeTime(u.last_active_at)})</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            {u.last_change_at && (
                              <span
                                className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium"
                                title={t('usersLastChangeTitle', { date: formatDisplayDateTime(u.last_change_at) })}
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>{t('usersChanged', { relative: formatRelativeTime(u.last_change_at) })}</span>
                              </span>
                            )}
                            {u.last_login_at && (
                              <span
                                className="flex items-center space-x-1 text-sky-600 dark:text-sky-400 font-medium"
                                title={t('usersLastLoginTitle', { date: formatDisplayDateTime(u.last_login_at) })}
                              >
                                <LogIn className="w-2.5 h-2.5" />
                                <span>{t('usersLogin', { relative: formatRelativeTime(u.last_login_at) })}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="italic">{t('usersNotLoggedInYet')}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {formatDisplayDate(u.created_at)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleGenerateReset(u.id, u.email)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={t('usersGenerateReset')}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={t('usersDelete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create User Modal */}
        {isCreateUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-sky-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('usersAdd')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">{t('usersEmailLabel')}</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder={t('usersEmailPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">{t('usersRoleLabel')}</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="driver">{t('usersCreateRoleDriver')}</option>
                    <option value="user">👤 {t('roleUser')}</option>
                    <option value="admin">{t('usersCreateRoleAdmin')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">{t('usersInitialPasswordLabel')}</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder={t('usersInitialPasswordPlaceholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded-xl font-bold transition disabled:opacity-50"
                  >
                    {creatingUser ? t('usersCreating') : t('usersCreateSubmit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {resetModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-4 h-4 text-sky-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('usersResetTitle')}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {resetTextBefore}
                <strong>{resetModalUser.email}</strong>
                {resetTextAfter}
              </p>

              {resetModalUser.resetLink && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">{t('usersResetLinkLabel')}</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={resetModalUser.resetLink}
                      className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetModalUser.resetLink || '');
                        setResetCopied(true);
                        setTimeout(() => setResetCopied(false), 2000);
                      }}
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0"
                    >
                      {resetCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{resetCopied ? t('copied') : t('copy')}</span>
                    </button>
                  </div>
                </div>
              )}

              {resetFeedback && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resetFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={generatingReset}
                  onClick={() => handleGenerateReset(resetModalUser.id, resetModalUser.email, true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {generatingReset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-sky-500" />}
                  <span>{t('usersSendResetMail')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-white rounded-xl text-xs font-bold transition"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Personal Security Banner */}
      <div className="bg-gradient-to-r from-sky-50/80 to-transparent dark:from-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">{t('usersPersonalSecurityTitle')}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t('usersPersonalSecurityHint')}</p>
          </div>
        </div>
        <a
          href="/profile"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <span>{t('usersGoToProfile')}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* OpenID Connect / SSO */}
      <OidcSettings />

      {/* API Keys Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <KeyRound className="w-4 h-4 text-sky-500" />
          <span>{t('usersApiKeysTitle')}</span>
        </h2>

        {generatedKey && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">{t('usersApiKeyCopyNow')}</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={generatedKey}
                className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('copied') : t('copy')}</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreateKey} className="flex gap-2">
          <input
            type="text"
            required
            placeholder={t('usersApiKeyNamePlaceholder')}
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 text-white hover:bg-black dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('usersApiKeyCreate')}</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
          {apiKeys.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">{t('usersNoApiKeys')}</p>
          ) : (
            apiKeys.map((k) => (
              <div key={k.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{k.name}</span>
                  <span className="font-mono text-slate-400 text-[11px]">{k.prefix}••••••••</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteKey(k.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

