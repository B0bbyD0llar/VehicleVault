import { AuthSessionController } from './auth/authSessionController.js';
import { AuthPasswordResetController } from './auth/authPasswordResetController.js';
import { AuthApiKeyController } from './auth/authApiKeyController.js';
import { UserManagementController } from './auth/userManagementController.js';

/**
 * AuthController Facade
 * Delegates specific authentication and user lifecycle capabilities to modular, SRP controllers:
 * - AuthSessionController (session lifecycle, register, login, refresh, logout, me, status, password change)
 * - AuthPasswordResetController (token verification, mail dispatch, reset confirmation)
 * - AuthApiKeyController (CRUD management for API access keys)
 * - UserManagementController (administrative user operations, roles, and status)
 */
export class AuthController {
  // Session & Authentication
  public static register = AuthSessionController.register;
  public static login = AuthSessionController.login;
  public static refresh = AuthSessionController.refresh;
  public static logout = AuthSessionController.logout;
  public static status = AuthSessionController.status;
  public static me = AuthSessionController.me;
  public static changePassword = AuthSessionController.changePassword;

  // Password Recovery
  public static forgotPassword = AuthPasswordResetController.forgotPassword;
  public static verifyResetToken = AuthPasswordResetController.verifyResetToken;
  public static resetPassword = AuthPasswordResetController.resetPassword;
  public static generateUserResetLink = AuthPasswordResetController.generateUserResetLink;

  // API Keys
  public static listApiKeys = AuthApiKeyController.listApiKeys;
  public static createApiKey = AuthApiKeyController.createApiKey;
  public static deleteApiKey = AuthApiKeyController.deleteApiKey;

  // User Administration
  public static createUser = UserManagementController.createUser;
  public static listUsers = UserManagementController.listUsers;
  public static listShareableUsers = UserManagementController.listShareableUsers;
  public static updateUserRole = UserManagementController.updateUserRole;
  public static deleteUser = UserManagementController.deleteUser;
}

export {
  AuthSessionController,
  AuthPasswordResetController,
  AuthApiKeyController,
  UserManagementController,
};
