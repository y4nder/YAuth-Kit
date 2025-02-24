import Axios, { AxiosResponse, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { AccountInfoResponse, AuthResponse, ChangePasswordRequest, ExternalChallengeRequest, ResetPasswordRequest, SignInRequest, TokenResponse, WhoAmIResponse, YAuthClientOptions, YAuthEndpointConfiguration, YAuthStorage } from "./types";
import { yAuthDefaultStorage } from "./yauth-default-storage";
import { defaultClientOptions } from "./yauth-default-options";

/**
 * YAuthClient class provides methods for user authentication and account management.
 * 
 * @template TSignInRequest - Type for sign-in request data, extending SignInRequest
 * @template TSignInResponse - Type for sign-in response data, extending AuthResponse.
 * @template TSignUpRequest - Type for sign-up request data.
 * @template TSignUpResponse - Type for sign-up response data, extending AuthResponse.
 * @template TTokenResponse - Type for token response data, extending TokenResponse.
 * @template TAccountInfoResponse - Type for account info response data, extending AccountInfoResponse.
 * @template TSignUpExternalRequest - Type for external sign-up request data.
 * @template TWhoAmIResponse - Type for who am I response data, extending WhoAmIResponse.
 */
export class YAuthClient<
    TSignInRequest extends SignInRequest = SignInRequest,
    TSignInResponse extends AuthResponse = AuthResponse,
    TSignUpRequest = any,
    TSignUpResponse extends AuthResponse = AuthResponse,
    TTokenResponse extends TokenResponse = TokenResponse,
    TAccountInfoResponse extends AccountInfoResponse = AccountInfoResponse,
    TSignUpExternalRequest = any,
    TWhoAmIResponse extends WhoAmIResponse = WhoAmIResponse
> {
  
    private readonly apiBaseUrl: string;
    private readonly authApiPrefix: string;
    private readonly accountApiPrefix: string;
    private readonly storage : YAuthStorage;
    private readonly axios : AxiosInstance;
    private options: YAuthEndpointConfiguration;

    private onSignIn: <T>(userData: T) => void = () => {};
    private onSignOut: () => void = () => {};


    constructor(options : YAuthClientOptions) {
        this.apiBaseUrl = options.apiBaseUrl ,
        this.authApiPrefix = options.authApiPrefix || "/auth";
        this.accountApiPrefix = options.accountApiPrefix || "/account";
        this.storage = options.storage || yAuthDefaultStorage;
        this.axios = options.axiosInstance;
        this.options = options.endpointConfig || defaultClientOptions;
    }

    /**
     * Retrieves the user data from storage.
     * @template TUserData - Type for user data.
     * @returns {TUserData} The user data.
     */
    public getUser<TUserData>() : TUserData {
        return this.storage.getUser<TUserData>();
    }

    /**
     * Registers event handlers for sign-in and sign-out events.
     * @param {Object} ev - Event handlers.
     * @param {Function} ev.onSignIn - Handler for sign-in event.
     * @param {Function} ev.onSignOut - Handler for sign-out event.
     */
    public onEvents(ev: {
        onSignIn: <T>(userData: T) => void;
        onSignOut: () => void;
    }) {
        this.onSignIn = ev.onSignIn;
        this.onSignOut = ev.onSignOut;
    }

    /**
     * Configures the endpoint options.
     * @param {YAuthEndpointConfiguration} endpointConfig - The endpoint configuration.
     */
    public configure(endpointConfig: YAuthEndpointConfiguration){
        this.options = endpointConfig;
    }

    /**
     * Gets the API base URL.
     * @returns {string} The API base URL.
     */
    public getApiBaseUrl() {
        return this.apiBaseUrl;
    }

    /**
     * Gets the authentication API prefix.
     * @returns {string} The authentication API prefix.
     */
    public getAuthApiPrefix() {
        return this.authApiPrefix;
    }

    /**
     * Gets the account API prefix.
     * @returns {string} The account API prefix.
     */
    public getAccountApiPrefix() {
        return this.accountApiPrefix;
    }

    /**
     * Gets the sign-in endpoint.
     * @returns {string} The sign-in endpoint.
     */
    public getSignInEndpoint(){
        return this.options.signInEndpoint;
    }

    /**
     * Gets the sign-up endpoint.
     * @returns {string} The sign-up endpoint.
     */
    public getSignUpEndpoint(){
        return this.options.signUpEndpoint;
    }

    /**
     * Gets the sign-out endpoint.
     * @returns {string} The sign-out endpoint.
     */
    public getSignOutEndpoint(){
        return this.options.signOutEndpoint;
    }

    /**
     * Gets the refresh token endpoint.
     * @returns {string} The refresh token endpoint.
     */
    public getRefreshTokenEndpoint(){
        return this.options.refreshTokenEndpoint;
    }

    /**
     * Gets the endpoint options.
     * @returns {YAuthEndpointConfiguration} The endpoint options.
     */
    public getEndpointOptions(){
        return this.options;
    }

    /**
     * Gets the forgot password endpoint.
     * @returns {string} The forgot password endpoint.
     */
    public getForgotPasswordEndpoint(){
        return this.options.forgotPasswordEndpoint;
    }

    /**
     * Gets the reset password endpoint.
     * @returns {string} The reset password endpoint.
     */
    public getResetPasswordEndpoint(){
        return this.options.resetPasswordEndpoint;
    }

    /**
     * Gets the change password endpoint.
     * @returns {string} The change password endpoint.
     */
    public getChangePasswordEndpoint(){
        return this.options.changePasswordEndpoint;
    }

    /**
     * Gets the resend email confirmation endpoint.
     * @returns {string} The resend email confirmation endpoint.
     */
    public getResendEmailEndpoint(){
        return this.options.resendEmailConfirmationEndpoint;
    }

    /**
     * Gets the confirm email endpoint.
     * @returns {string} The confirm email endpoint.
     */
    public getConfirmEmailEndpoint(){
        return this.options.confirmEmailEndpoint;
    }

    /**
     * Signs in a user.
     * @param {TSignInRequest} data - The sign-in request data.
     * @returns {Promise<TSignInResponse>} The sign-in response data.
     */
    public async signIn(data: TSignInRequest): Promise<TSignInResponse> {
        const response = await this.axios.post<TSignInResponse>(`${this.authApiPrefix}${this.getSignInEndpoint()}`, data);
        const user = {email: data.email} as TSignInResponse;
        this.storage.setUser(user);
        this.storage.setToken(response.data.access_token);
        this.onSignIn(user);

        return user;
    }

    /**
     * Initiates an external challenge for authentication.
     * @param {ExternalChallengeRequest} data - The external challenge request data.
     */
    public externalChallenge(data: ExternalChallengeRequest) {
        const callBackUrl = data.mode === "SignIn"
            ? window.location.origin + "/external-challenge-callback" + data.provider
            : window.location.origin + "/profile?link" + data.provider;

        const api = this.apiBaseUrl + this.authApiPrefix + "/external/challenge/" + data.provider
            + "?CallbackUrl=" + encodeURIComponent(callBackUrl);
        
        window.location.replace(api);
    }

    /**
     * Links an external login to the account.
     * @returns {Promise<TAccountInfoResponse>} The account info response data.
     */
    public async linkLogin(): Promise<TAccountInfoResponse> {
        const path = '/link/external';
        const response = await this.axios.post<TAccountInfoResponse>(this.accountApiPrefix + path);
        return response.data;
    }

    /**
     * Signs up a user using external authentication.
     * @param {TSignUpExternalRequest} data - The external sign-up request data.
     * @returns {Promise<TSignUpResponse>} The sign-up response data.
     */
    public async signUpExternal(data: TSignUpExternalRequest): Promise<TSignUpResponse> {
        const path = '/signup/external';
        
        const tokenRes = await this.axios.post<TokenResponse>(this.authApiPrefix + path, data);
        this.storage.setToken(tokenRes.data.access_token);
        
        const userRes = await this.axios.get<TWhoAmIResponse>(this.authApiPrefix + '/whoami');
        const user = { email: userRes.data.email } as TSignUpResponse;

        this.storage.setUser(user);
        if (this.onSignIn) this.onSignIn(user);

        return user;
    }

    /**
     * Signs in a user using external authentication.
     * @returns {Promise<TSignInResponse>} The sign-in response data.
     */
    public async signInExternal(): Promise<TSignInResponse> {
        const path = '/signin/external';
    
        const tokenRes = await this.axios.post<TokenResponse>(this.authApiPrefix + path);
        this.storage.setToken(tokenRes.data.access_token);
        
        const userRes = await this.axios.get<TWhoAmIResponse>(this.authApiPrefix + '/whoami');
        const user =  { email: userRes.data.email } as TSignInResponse;
    
        this.storage.setUser(user);
        if (this.onSignIn) this.onSignIn(user);
    
        return user;
    }

    /**
     * Signs up a user.
     * @param {TSignUpRequest} data - The sign-up request data.
     * @returns {Promise<TSignUpResponse>} The sign-up response data.
     */
    public async signUp(data: TSignUpRequest): Promise<TSignUpResponse> {
        const response = await this.axios.post<TSignUpResponse>(`${this.authApiPrefix}${this.getSignUpEndpoint()}`, data);
        const userData = response.data;
        this.storage.setUser(userData);
        this.storage.setToken(userData.access_token);
        return userData;
    }

    /**
     * Retrieves the current user's information.
     * @returns {Promise<TWhoAmIResponse>} The who am I response data.
     */
    public async whoAmI(): Promise<TWhoAmIResponse> {
        const response = await this.axios.get<TWhoAmIResponse>(this.authApiPrefix + '/whoami');
        return response.data;
    }

    /**
     * Signs out the current user.
     * @returns {Promise<void>} A promise that resolves when the sign-out is complete.
     */
    public async signOut() : Promise<void> {
        await this.axios.post(`${this.authApiPrefix}${this.getSignOutEndpoint()}`);
        this.storage.clearToken();
        this.storage.clearUser();
        this.onSignOut && this.onSignOut();
    }

    /**
     * Refreshes the authentication token.
     * @returns {Promise<TTokenResponse>} The token response data.
     */
    public async refreshToken() : Promise<TTokenResponse>{
        const token = await this.axios.post<TTokenResponse>(`${this.authApiPrefix}${this.getRefreshTokenEndpoint()}`);
        this.storage.setToken(token.data.access_token);
        return token.data;
    }

    /**
     * Sends a forgot password request.
     * @param {string} email - The email address.
     */
    public async forgotPassword(email: string) {
        await this.axios.post(`${this.accountApiPrefix}${this.getForgotPasswordEndpoint()}`, {email})
    }

    /**
     * Resets the password.
     * @param {ResetPasswordRequest} data - The reset password request data.
     * @returns {Promise<AxiosResponse>} The Axios response.
     */
    public async resetPassword(data: ResetPasswordRequest) : Promise<AxiosResponse>{
        return await this.axios.post(`${this.accountApiPrefix}${this.getResetPasswordEndpoint()}`, data);
    }

    /**
     * Changes the password.
     * @param {ChangePasswordRequest} data - The change password request data.
     * @returns {Promise<AxiosResponse>} The Axios response.
     */
    public async changePassword(data: ChangePasswordRequest) : Promise<AxiosResponse>{
        return await this.axios.post(`${this.accountApiPrefix}${this.getChangePasswordEndpoint()}`, data);
    }

    /**
     * Resends the email confirmation.
     * @param {string} email - The email address.
     * @returns {Promise<AxiosResponse>} The Axios response.
     */
    public async resendEmailConfirmation(email: string) : Promise<AxiosResponse>{
        return await this.axios.post(`${this.accountApiPrefix}${this.getResendEmailEndpoint()}`, {email});
    }

    /**
     * Confirms the email address.
     * @param {string} code - The confirmation code.
     * @param {string} userId - The user ID.
     * @returns {Promise<AxiosResponse>} The Axios response.
     */
    public async confirmEmail(code: string, userId: string) : Promise<AxiosResponse>{
        return this.axios.get(`${this.accountApiPrefix}${this.getConfirmEmailEndpoint()}`, {
            params: {
                code, userId
            }
        });
    }

    /**
     * Initializes Axios interceptors for request and response handling.
     * @param {Function} [onSignOut] - Optional sign-out handler.
     */
    initAxiosInterceptors(onSignOut?: () => void) {
        this.axios.interceptors.request.use(authRequestInterceptorFactory(this.storage));
        this.axios.interceptors.response.use(value => value, async error => {
            if (!Axios.isAxiosError(error)) return Promise.reject(error);

            const originalConfig = error.config as any;
            const expired = error.response?.headers ? error.response.headers['x-token-expired'] : false;

            if (error.response?.status === 401 && expired && !originalConfig._retry) {
                originalConfig._retry = true;
                return tryRefreshToken(originalConfig);
            } else if (error.response?.status === 401 && !expired) {
                this.storage.clearToken();
                this.storage.clearUser();
                onSignOut && onSignOut();
            }

            return Promise.reject(error);
        });

        const tryRefreshToken = async (originalRequestConfig: any) => {
            try {
                await this.refreshToken();
                return this.axios.request(originalRequestConfig);
            } catch (error) {
                this.storage.clearToken();
                this.storage.clearUser();
                onSignOut && onSignOut();

                return Promise.reject(error);
            }
        };
    }
}

export const authRequestInterceptorFactory = (storage: YAuthStorage) => (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = 'application/json';
    return config;
};
