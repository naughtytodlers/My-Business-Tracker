import { AuthUser, UserRole, SheetUserRecord } from '../types';

export interface StoredUser {
  id: string;
  name: string; // USERNAME
  mobile?: string;
  role: UserRole;
  passwordPlain: string;
  passwordHash?: string;
  createdAt: string;
}

const AUTH_STORAGE_KEY = 'nt_business_tracker_session';
const USERS_STORAGE_KEY = 'nt_business_tracker_users';

// Default primary Admin specified by user:
// Name: "Jaya Narasimha Rao", Password: "Naidu@1993", Role: "Admin"
export const DEFAULT_ADMIN_USER: StoredUser = {
  id: 'user-admin-jaya',
  name: 'Jaya Narasimha Rao',
  role: 'Admin',
  passwordPlain: 'Naidu@1993',
  mobile: '',
  createdAt: '2026-10-01',
};

const INITIAL_USERS: StoredUser[] = [DEFAULT_ADMIN_USER];

export function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }

    // Filter out old legacy mock email accounts (admin@naughtytoddlers.com, etc.)
    const cleaned = parsed.filter(
      (u: any) =>
        u.name &&
        !u.email?.includes('naughtytoddlers.com') &&
        u.name !== 'Admin Account' &&
        u.name !== 'Business User' &&
        u.name !== 'Standard User'
    );

    // Ensure Jaya Narasimha Rao Admin is present
    const hasAdmin = cleaned.some(
      (u: StoredUser) => u.name.toLowerCase() === DEFAULT_ADMIN_USER.name.toLowerCase()
    );

    const finalUsers: StoredUser[] = hasAdmin ? cleaned : [DEFAULT_ADMIN_USER, ...cleaned];
    if (finalUsers.length !== parsed.length) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(finalUsers));
    }
    return finalUsers;
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users to localStorage', e);
  }
}

/**
 * Merges users fetched from the Google Sheet "Users" tab into local storage
 */
export function syncUsersFromSheet(sheetUsers: SheetUserRecord[]): StoredUser[] {
  if (!sheetUsers || sheetUsers.length === 0) {
    return getStoredUsers();
  }

  const current = getStoredUsers();
  const merged: StoredUser[] = [...current];

  for (const sUser of sheetUsers) {
    const sName = (sUser.name || '').trim();
    if (!sName) continue;
    const sPass = (sUser.password || '').trim();
    const sRole = (sUser.role || 'User') as UserRole;
    const sMobile = (sUser.mobile || '').trim();

    const existingIdx = merged.findIndex(
      (u) => u.name.trim().toLowerCase() === sName.toLowerCase()
    );

    if (existingIdx >= 0) {
      merged[existingIdx] = {
        ...merged[existingIdx],
        role: sRole,
        passwordPlain: sPass || merged[existingIdx].passwordPlain,
        mobile: sMobile || merged[existingIdx].mobile || '',
      };
    } else {
      merged.push({
        id: `sheet-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: sName,
        role: sRole,
        passwordPlain: sPass,
        mobile: sMobile,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
  }

  // Ensure default Admin Jaya Narasimha Rao is always retained
  if (!merged.some((u) => u.name.toLowerCase() === DEFAULT_ADMIN_USER.name.toLowerCase())) {
    merged.unshift(DEFAULT_ADMIN_USER);
  }

  saveStoredUsers(merged);
  return merged;
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (user && user.id && user.name && user.role) {
      return user;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Authenticates user by Username (Name) and Password.
 * Supports credentials entered directly in the "Users" sheet by Admin.
 */
export async function loginUser(
  username: string,
  passwordPlain: string,
  onDemandSync?: () => Promise<void>
): Promise<AuthUser> {
  let users = getStoredUsers();
  const cleanName = username.trim().toLowerCase();
  const trimmedPass = passwordPlain.trim();

  if (!cleanName) {
    throw new Error('Please enter your User Name.');
  }
  if (!trimmedPass) {
    throw new Error('Please enter your Password.');
  }

  // 1. Match username (Name) case-insensitively in current cache
  let matched = users.find((u) => u.name.trim().toLowerCase() === cleanName);

  // 2. If not found in current cache, perform on-demand sync from Google Sheet
  if (!matched && onDemandSync) {
    try {
      await onDemandSync();
      users = getStoredUsers();
      matched = users.find((u) => u.name.trim().toLowerCase() === cleanName);
    } catch (syncErr) {
      console.warn('On-demand sync failed during login:', syncErr);
    }
  }

  if (!matched) {
    throw new Error(
      `User "${username}" was not found. Please verify the user name or ensure it is added to the "Users" sheet in Google Sheets.`
    );
  }

  // Verify password: exact match or trimmed match
  const passMatch =
    matched.passwordPlain === trimmedPass ||
    matched.passwordPlain.trim() === trimmedPass;

  if (!passMatch) {
    throw new Error('Incorrect password. Please verify your credentials and try again.');
  }

  const sessionUser: AuthUser = {
    id: matched.id,
    name: matched.name,
    role: matched.role,
    mobile: matched.mobile,
    createdAt: matched.createdAt,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

/**
 * Finds user for password reset by mobile number or username
 */
export function findUserByMobile(mobileNumber: string, username?: string): StoredUser | null {
  const cleanMobile = mobileNumber.replace(/\D/g, '');
  if (!cleanMobile || cleanMobile.length < 10) return null;
  const last10 = cleanMobile.slice(-10);

  const users = getStoredUsers();

  // If username is provided, check that specific user first
  if (username && username.trim()) {
    const cleanName = username.trim().toLowerCase();
    const matched = users.find((u) => u.name.trim().toLowerCase() === cleanName);
    if (matched) {
      if (!matched.mobile || matched.mobile.trim() === '') {
        // Not bound yet; allow binding
        return matched;
      }
      const uMobile = matched.mobile.replace(/\D/g, '');
      if (uMobile === cleanMobile || uMobile.endsWith(last10)) {
        return matched;
      }
    }
  }

  // Find user whose registered mobile ends with the given 10 digits
  const byMobile = users.find((u) => {
    if (!u.mobile) return false;
    const digits = u.mobile.replace(/\D/g, '');
    return digits === cleanMobile || digits.endsWith(last10);
  });

  if (byMobile) return byMobile;

  // Fallback: If no user has a mobile set yet, match the default admin or primary user
  const admin = users.find((u) => u.name.toLowerCase() === DEFAULT_ADMIN_USER.name.toLowerCase()) || users[0];
  if (admin && (!admin.mobile || admin.mobile.trim() === '')) {
    return admin;
  }

  return null;
}

/**
 * Resets password directly for a verified user id
 */
export function resetPasswordForUser(
  userId: string,
  newPasswordPlain: string,
  verifiedMobile?: string
): StoredUser {
  const cleanPass = newPasswordPlain.trim();
  if (cleanPass.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    throw new Error('User record could not be found.');
  }

  const target = users[index];
  target.passwordPlain = cleanPass;
  if (verifiedMobile) {
    target.mobile = verifiedMobile.replace(/\D/g, '');
  }
  users[index] = target;
  saveStoredUsers(users);
  return target;
}

/**
 * Resets user password using registered mobile number
 */
export async function resetPasswordWithMobile(
  username: string,
  mobileNumber: string,
  newPasswordPlain: string
): Promise<StoredUser> {
  const cleanName = username.trim().toLowerCase();
  const cleanMobile = mobileNumber.replace(/\D/g, ''); // Digits only
  const cleanNewPass = newPasswordPlain.trim();

  if (!cleanName) {
    throw new Error('Please enter your User Name.');
  }
  if (!cleanMobile || cleanMobile.length < 10) {
    throw new Error('Please enter a valid 10-digit registered mobile number.');
  }
  if (!cleanNewPass || cleanNewPass.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const users = getStoredUsers();
  const userIndex = users.findIndex((u) => u.name.trim().toLowerCase() === cleanName);

  if (userIndex === -1) {
    throw new Error(`User "${username}" was not found in our records.`);
  }

  const targetUser = users[userIndex];

  // If a mobile number is registered, verify matching the last 10 digits
  if (targetUser.mobile && targetUser.mobile.trim() !== '') {
    const registeredClean = targetUser.mobile.replace(/\D/g, '');
    if (registeredClean !== cleanMobile && !registeredClean.endsWith(cleanMobile.slice(-10))) {
      throw new Error('The mobile number entered does not match the registered mobile for this user.');
    }
  } else {
    // If not previously set, bind this mobile to the user profile
    targetUser.mobile = cleanMobile;
  }

  targetUser.passwordPlain = cleanNewPass;
  users[userIndex] = targetUser;
  saveStoredUsers(users);

  return targetUser;
}

export function logoutUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Creates or updates a user in local cache, safely handling sheet sync
 */
export function saveOrUpdateStoredUser(
  name: string,
  role: UserRole,
  passwordPlain: string,
  mobile?: string
): StoredUser {
  const users = getStoredUsers();
  const cleanName = name.trim();
  const existingIdx = users.findIndex(
    (u) => u.name.trim().toLowerCase() === cleanName.toLowerCase()
  );

  if (existingIdx >= 0) {
    const updatedUser: StoredUser = {
      ...users[existingIdx],
      role,
      passwordPlain: passwordPlain.trim(),
      mobile: mobile !== undefined && mobile.trim() !== '' ? mobile.trim() : (users[existingIdx].mobile || ''),
    };
    users[existingIdx] = updatedUser;
    saveStoredUsers(users);
    return updatedUser;
  }

  const newUser: StoredUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    role,
    passwordPlain: passwordPlain.trim(),
    mobile: mobile ? mobile.trim() : '',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [...users, newUser];
  saveStoredUsers(updated);
  return newUser;
}

/**
 * Creates or registers a new user in local cache
 */
export function createNewUser(
  name: string,
  role: UserRole,
  passwordPlain: string,
  mobile?: string
): StoredUser {
  const users = getStoredUsers();
  const cleanName = name.trim();

  if (users.some((u) => u.name.toLowerCase() === cleanName.toLowerCase())) {
    throw new Error(`A user with name "${cleanName}" already exists.`);
  }

  const newUser: StoredUser = {
    id: `user-${Date.now()}`,
    name: cleanName,
    role,
    passwordPlain: passwordPlain.trim(),
    mobile: mobile ? mobile.trim() : '',
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [...users, newUser];
  saveStoredUsers(updated);
  return newUser;
}

export function deleteStoredUser(userId: string, name?: string): void {
  const users = getStoredUsers();
  const cleanName = (name || '').trim().toLowerCase();
  
  // Prevent deleting the primary admin
  const target = users.find(
    (u) =>
      u.id === userId ||
      (cleanName && u.name.trim().toLowerCase() === cleanName)
  );
  if (target && target.name.toLowerCase() === DEFAULT_ADMIN_USER.name.toLowerCase()) {
    throw new Error('The primary Admin account "Jaya Narasimha Rao" cannot be deleted.');
  }

  const updated = users.filter((u) => {
    if (u.id === userId) return false;
    if (cleanName && u.name.trim().toLowerCase() === cleanName) return false;
    return true;
  });
  saveStoredUsers(updated);
}

export function updateUserRole(userId: string, newRole: UserRole): void {
  const users = getStoredUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
  saveStoredUsers(updated);
}
