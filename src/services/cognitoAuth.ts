import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const POOL_DATA = {
  UserPoolId: "af-south-1_3QLNXOhng",
  ClientId: "5g3ub7478b63r9bplanek51gel",
};

const userPool = new CognitoUserPool(POOL_DATA);

// ── Token helpers ──

export function getIdTokenPayload(): Record<string, any> | null {
  const saved = localStorage.getItem("taskai_user");
  if (!saved) return null;
  try {
    const idToken = JSON.parse(saved)?.idToken;
    if (!idToken) return null;
    const payload = idToken.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export function getStoredAccessToken(): string | null {
  const saved = localStorage.getItem("taskai_user");
  if (!saved) return null;
  try {
    return JSON.parse(saved)?.token ?? null;
  } catch {
    return null;
  }
}

export function getStoredIdToken(): string | null {
  const saved = localStorage.getItem("taskai_user");
  if (!saved) return null;
  try {
    return JSON.parse(saved)?.idToken ?? null;
  } catch {
    return null;
  }
}

function storeTokens(session: CognitoUserSession) {
  const accessToken = session.getAccessToken().getJwtToken();
  const idToken = session.getIdToken().getJwtToken();
  const refreshToken = session.getRefreshToken().getToken();
  localStorage.setItem(
    "taskai_user",
    JSON.stringify({ token: accessToken, idToken, refreshToken })
  );
}

export function clearTokens() {
  localStorage.removeItem("taskai_user");
}

// ── Login ──

export function cognitoLogin(
  email: string,
  password: string
): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.setAuthenticationFlowType("USER_PASSWORD_AUTH");
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    user.authenticateUser(authDetails, {
      onSuccess(session) {
        storeTokens(session);
        resolve(session);
      },
      onFailure(err) {
        reject(new Error(err.message || "Login failed"));
      },
      newPasswordRequired() {
        reject(new Error("New password required. Please contact support."));
      },
    });
  });
}

// ── Signup ──

export interface CognitoSignupData {
  email: string;
  password: string;
  name: string;
  surname: string;
  contactNumber: string;
  username: string;
}

export function cognitoSignup(data: CognitoSignupData): Promise<void> {
  return new Promise((resolve, reject) => {
    // Only send standard Cognito attributes that exist in the pool schema.
    // Extra profile data (role, surname, contact, username) will be synced
    // via the /me endpoint after login.
    const attributes: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: "email", Value: data.email }),
      new CognitoUserAttribute({ Name: "name", Value: `${data.name} ${data.surname}` }),
    ];

    userPool.signUp(data.email, data.password, attributes, [], (err) => {
      if (err) {
        reject(new Error(err.message || "Registration failed"));
      } else {
        resolve();
      }
    });
  });
}

// ── Confirm registration ──

export function cognitoConfirm(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) reject(new Error(err.message || "Confirmation failed"));
      else resolve();
    });
  });
}

// ── Forgot password ──

export function cognitoForgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.forgotPassword({
      onSuccess() {
        resolve();
      },
      onFailure(err) {
        reject(new Error(err.message || "Failed to send reset code"));
      },
    });
  });
}

export function cognitoConfirmPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmPassword(code, newPassword, {
      onSuccess() {
        resolve();
      },
      onFailure(err) {
        reject(new Error(err.message || "Failed to reset password"));
      },
    });
  });
}

// ── Resend confirmation code ──

export function cognitoResendConfirmation(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) reject(new Error(err.message || "Failed to resend code"));
      else resolve();
    });
  });
}

// ── Logout ──

export function cognitoLogout() {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
  clearTokens();
}

// ── Restore session ──

export function cognitoGetCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      resolve(null);
      return;
    }
    user.getSession((err: any, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }
      storeTokens(session);
      resolve(session);
    });
  });
}
