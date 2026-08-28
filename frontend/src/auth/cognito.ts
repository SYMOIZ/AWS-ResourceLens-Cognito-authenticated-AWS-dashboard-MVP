import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

function pool(): CognitoUserPool {
  const UserPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const ClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  if (!UserPoolId || !ClientId) {
    throw new Error("Cognito is not configured. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID.");
  }
  return new CognitoUserPool({ UserPoolId, ClientId });
}

function user(email: string): CognitoUser {
  return new CognitoUser({ Username: email, Pool: pool() });
}

export function getCurrentUser(): CognitoUser | null {
  try {
    return pool().getCurrentUser();
  } catch {
    return null;
  }
}

export function getSession(): Promise<CognitoUserSession | null> {
  const current = getCurrentUser();
  if (!current) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    current.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) reject(err);
      else resolve(session?.isValid() ? session : null);
    });
  });
}

export async function getIdToken(): Promise<string | null> {
  const session = await getSession();
  return session?.getIdToken().getJwtToken() ?? null;
}

export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  const cognitoUser = user(email);
  const details = new AuthenticationDetails({ Username: email, Password: password });
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(details, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

export function signUp(email: string, password: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    pool().signUp(
      email,
      password,
      [
        new CognitoUserAttribute({ Name: "email", Value: email }),
        new CognitoUserAttribute({ Name: "name", Value: name }),
      ],
      [],
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    user(email).confirmRegistration(code, true, (err) => (err ? reject(err) : resolve()));
  });
}

export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    user(email).forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

export function confirmForgotPassword(email: string, code: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    user(email).confirmPassword(code, password, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

export function signOut(): void {
  getCurrentUser()?.signOut();
}
