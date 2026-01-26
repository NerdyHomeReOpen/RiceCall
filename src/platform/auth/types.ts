/**
 * Auth Controller Types
 */

export interface AuthController {
  /**
   * Performs the logout process: clears data and handles UI state transition (redirect or window switch).
   */
  logout(): Promise<void>;

  /**
   * Handles actions after a successful login.
   * @param token The session token.
   */
  loginSuccess(token: string): Promise<void>;
}
