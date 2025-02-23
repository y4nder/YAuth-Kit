import { AxiosInstance } from "axios";

export type SayHelloProps =  {
    firstName: string,
    lastName?: string,
    age?: number
}

export type YAuthClientOptions = {
    apiBaseUrl: string,
    authApiPrefix?: string,
    accountApiPrefix? : string;
    storage?: YAuthStorage,
    axiosInstance : AxiosInstance,
    endpointConfig?: YAuthEndpointConfiguration
}

export type YAuthEndpointConfiguration = {
    signInEndpoint : string;
    signUpEndpoint : string;
    signOutEndpoint: string;
    refreshTokenEndpoint: string;
    forgotPasswordEndpoint: string;
    resetPasswordEndpoint: string;
    changePasswordEndpoint: string;
    resendEmailConfirmationEndpoint: string;
    confirmEmailEndpoint: string;
}

export interface YAuthStorage {
    setUser:<T> (userData: T) => void;
    getToken: () => string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
    clearUser: () => void;
    getUser: <T>() => T;
}

export interface AuthResponse {
    email: string;
    access_token: string;
}

export interface TokenResponse {
    access_token: string;
    expires_in: number;
}

export interface ResetPasswordRequest {
    email: string;
    password: string;
    code: string;
}

export interface ChangePasswordRequest {
    password: string;
    newPassword: string;
}

export interface ExternalChallengeRequest {
    provider: string;
    mode: ChallengeMode;
}

export interface AccountInfoResponse {
    email: string;
    userName: string;
    roles: string[];
    logins: string[];
    hasPassword: boolean;
}

export interface WhoAmIResponse {
    username: string;
    email: string;
    roles: string[];
}

export type ChallengeMode = 'SignIn' | 'LinkLogin';