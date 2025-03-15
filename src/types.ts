import { AxiosInstance, AxiosResponse } from "axios";
import { YAuth } from "./yauth-core";

export type YAuthClientOptions = {
    apiBaseUrl: string,
    authApiPrefix?: string,
    accountApiPrefix? : string;
    storage?: YAuthStorage,
    axiosInstance : AxiosInstance,
    endpointConfig?: YAuthEndpointConfiguration
    useUserStore?: boolean,
    useTokenStore?: boolean,
}

export type YAuthEndpointConfiguration = {
    signInEndpoint? : string;
    signUpEndpoint? : string;
    signOutEndpoint?: string;
    refreshTokenEndpoint?: string;
    forgotPasswordEndpoint?: string;
    resetPasswordEndpoint?: string;
    changePasswordEndpoint?: string;
    resendEmailConfirmationEndpoint?: string;
    confirmEmailEndpoint?: string;
    accountInfoEndpoint?: string;
}


export interface YAuthStorage {
    setUser:<T> (userData: T) => void;
    getToken: () => string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
    clearUser: () => void;
    getUser: <T>() => T;
}

export interface SignInRequest {
    email: string;
    password: string;
}

export interface SignUpRequest {
    email: string; 
    password: string 
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

export type ExternalStrategy = 'SignIn' | 'SignUp'

///////////////////////////////////////////////////

/**
 * MergeConfig is a powerful type that facilitates the 
 * creation of configuration objects that can be partially 
 * customized while still retaining the structure and default 
 * values of the base configuration.
 */
export type MergeConfig<T extends Partial<BaseAuthClientConfig>> = {
    [K in keyof BaseAuthClientConfig]: T[K] extends object
      ? T[K] & BaseAuthClientConfig[K] : BaseAuthClientConfig[K];
};

export interface BaseAuthClientConfig {
    signIn: {
        params: SignInRequest;
        result: AuthResponse;
    };
    signUp: {
        params: SignUpRequest;
        result: AuthResponse;
    };
    signOut: {
        params?: unknown;
        result: { success: boolean };
    };
    whoAmI : {
        params?: unknown;
        result: WhoAmIResponse
    };
    refreshToken: {
        params? : unknown;
        result: TokenResponse
    };
    forgotPassword : {
        email: string;
        result?: unknown 
    },
    resetPassword : {
        params: ResetPasswordRequest,
        result : AxiosResponse
    },

    changePassword: {
        params: ChangePasswordRequest,
        result: AxiosResponse
    }
    resendEmailConfirm: {
        params : {email: string},
        result: AxiosResponse
    },
    confirmEmail: {
        params: {code: string, userId: string}
        result: AxiosResponse
    }
    externalChallenge: {
        params: ExternalChallengeRequest,
        result?: unknown 
    };
    linkLogin: {
        params?: unknown,
        result: AccountInfoResponse
    };
    signUpExternal: {
        params: any
        result: AuthResponse
    };
    signInExternal : {
        params? : unknown,
        result: AuthResponse
    };
    accountInfo: {
        params?: unknown,
        result: AccountInfoResponse
    }
}


/**
 * Extracts the result type from a YAuth instance based on the provided key.
 *
 * @template T - The YAuth instance type.
 * @template K - The key in the BaseAuthClientConfig to extract the result type from.
 *
 * @typedef {T extends YAuth<infer C> ? C extends Record<K, { result: infer R }> ? R : AuthResponse : AuthResponse} ExtracYAuthResult
 * - If T is a YAuth instance with a configuration C, and C has a property K with a result type R, then R is the extracted type.
 * - Otherwise, defaults to AuthResponse.
 */
export type ExtractYAuthResult<
    T extends YAuth<any>, 
    K extends keyof BaseAuthClientConfig
  > 
  = T extends YAuth<infer C> ?
      C extends Record<K, { result: infer R }> ?
        R
        : AuthResponse
      : AuthResponse;
  