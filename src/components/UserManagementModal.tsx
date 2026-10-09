import React, { useState } from 'react';
import { 
  X, 
  Users, 
  UserPlus, 
  Trash2, 
  Check, 
  AlertCircle,
  Eye,
  EyeOff,
  Phone
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';
import { 
  getStoredUsers, 
  createNewUser,
  saveOrUpdateStoredUser, 
  deleteStoredUser, 
  updateUserRole, 
  StoredUser,
  DEFAULT_ADMIN_USER 
} from '../services/authService';
import { saveUserToSheet, deleteUserFromSheet, getSavedScriptUrl } from '../services/sheetService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  scriptUrl?: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  scriptUrl = '',
}) => {
  const [users, setUsers] = useState<StoredUser[]>(() => getStoredUsers());
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('User');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setUsers(getStoredUsers());
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!isOpen) return null;

  const refreshUsers = () => {
    setUsers(getStoredUsers());
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanName = newName.trim();
    const cleanPassword = newPassword.trim();
    const cleanMobile = newMobile.trim();

    if (!cleanName || !cleanPassword) {
      setError('Please enter both User Name and Password.');
      return;
    }

    // Check if user already exists before attempting to create
    const existingUsers = getStoredUsers();
    if (existingUsers.some((u) => u.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      setError(`A user with name "${cleanName}" already exists.`);
      return;
    }

    setIsSaving(true);
    try {
      // 1. Persist locally first so user appears immediately without hard refresh
      saveOrUpdateStoredUser(cleanName, newRole, cleanPassword, cleanMobile);
      refreshUsers();

      // 2. If connected to Google Sheet, sync to Users tab
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      if (urlToUse) {
        try {
          await saveUserToSheet(urlToUse, {
            name: cleanName,
            password: cleanPassword,
            role: newRole,
            mobile: cleanMobile,
          });
        } catch (sheetErr) {
          console.warn('Background sync to Google Sheet Users tab notice:', sheetErr);
        }
      }

      setSuccess('User added successfully');
      setNewName('');
      setNewMobile('');
      setNewPassword('');
      setIsAddingUser(false);
      refreshUsers();
    } catch (err) {
      setError((err as Error).message || 'Failed to create user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const { id: userId, name: userName } = userToDelete;

    if (userName.toLowerCase() === DEFAULT_ADMIN_USER.name.toLowerCase()) {
      setError(`The primary Admin "${DEFAULT_ADMIN_USER.name}" cannot be deleted.`);
      setUserToDelete(null);
      return;
    }

    if (userId === currentUser.id) {
      setError('You cannot delete your own logged-in admin account.');
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Delete locally immediately so the table updates without refresh
      deleteStoredUser(userId, userName);
      refreshUsers();

      // 2. Sync deletion to Google Sheet Users tab
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      if (urlToUse) {
        try {
          await deleteUserFromSheet(urlToUse, userName);
        } catch (sheetErr) {
          console.warn('Background deletion in Google Sheet notice:', sheetErr);
        }
      }

      setSuccess('User deleted successfully');
      setUserToDelete(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (userId: string, userName: string, role: UserRole) => {
    try {
      const urlToUse = (scriptUrl && scriptUrl.trim()) || getSavedScriptUrl();
      if (urlToUse) {
        const u = users.find((item) => item.id === userId);
        await saveUserToSheet(urlToUse, {
          name: userName,
          password: u?.passwordPlain || '',
          role,
          mobile: u?.mobile || '',
        });
      }
      updateUserRole(userId, role);
      setSuccess(`Role updated to ${role} for ${userName}`);
      refreshUsers();
    } catch (err) {
      setError((err as Error).message || 'Failed to update user role in Google Sheet.');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">User Access Management</h2>
              <p className="text-xs text-slate-500 font-medium">
                Admin controls access for Admin, Business User, and User roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* Notification Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">
              Registered Users ({users.length})
            </span>

            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddingUser ? 'Cancel' : 'Add New User'}</span>
            </button>
          </div>

          {/* Create User Form */}
          {isAddingUser && (
            <form onSubmit={handleCreateUser} className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/70 space-y-3 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-900">
                Create & Assign User Access
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Name (USERNAME)
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    placeholder="e.g. 9876543210 (for password reset)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Role Assignment
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="Admin">Admin (Full Access & User Management)</option>
                    <option value="Business User">Business User (KPIs, Charts & Operations)</option>
                    <option value="User">User (Standard Transaction Logging)</option>
                  </select>
                </div>
              </div>

              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? 'Saving to Google Sheet...' : 'Save & Create User'}
                </button>
              </div>
            </form>
          )}

          {/* Users List */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {users.map((u) => {
              const isCurrent = u.id === currentUser.id;
              const isPrimaryAdmin = u.name.toLowerCase() === DEFAULT_ADMIN_USER.name.toLowerCase();
              const showPass = visiblePasswords[u.id];

              return (
                <div key={u.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      u.role === 'Admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : u.role === 'Business User' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{u.name}</p>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-50 text-[10px] font-bold text-purple-700 border border-purple-200">
                            Logged In
                          </span>
                        )}
                        {isPrimaryAdmin && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-50 text-[10px] font-bold text-amber-800 border border-amber-200">
                            Primary Admin
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {/* Password reveal */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Password:</span>
                          <span className="text-[11px] font-mono font-semibold text-slate-600">
                            {showPass ? u.passwordPlain : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            title={showPass ? 'Hide password' : 'View password'}
                          >
                            {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Mobile Number if available */}
                        {u.mobile && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.mobile}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, u.name, e.target.value as UserRole)}
                      disabled={isPrimaryAdmin}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                        u.role === 'Admin'
                          ? 'border-purple-300 bg-purple-50 text-purple-800'
                          : u.role === 'Business User'
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Business User">Business User</option>
                      <option value="User">User</option>
                    </select>

                    {!isPrimaryAdmin && !isCurrent && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete({ id: u.id, name: u.name })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Delete user account ${u.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delete User Confirmation Modal */}
          {userToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Delete User Account</h3>
                    <p className="text-xs text-slate-500">This action cannot be undone.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  Are you sure you want to permanently remove <span className="font-bold text-slate-900">"{userToDelete.name}"</span>?
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setUserToDelete(null)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleConfirmDelete}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
