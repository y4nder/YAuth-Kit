import Axios, {AxiosInstance } from "axios";
import { BaseAuthClientConfig, MergeConfigs, YAuthClientOptions, YAuthEndpointConfiguration, YAuthStorage } from "./types";
import { yAuthDefaultStorage } from "./yauth-default-storage";
import { defaultClientOptions } from "./yauth-default-options";
import { authRequestInterceptorFactory } from "./yauth-utils";

export class YAuth<TConfig extends Partial<BaseAuthClientConfig>> {
    private readonly config: MergeConfigs<TConfig>;
    public readonly apiBaseUrl: string;
    public readonly authApiPrefix: string;
    private readonly accountApiPrefix: string;
    private readonly storage : YAuthStorage;
    private readonly axios : AxiosInstance;
    private options: YAuthEndpointConfiguration;

    constructor(options: YAuthClientOptions, config?: TConfig) {
        this.config = (config ?? {}) as MergeConfigs<TConfig>;
        this.apiBaseUrl = options.apiBaseUrl ,
        this.authApiPrefix = options.authApiPrefix || "/auth";
        this.accountApiPrefix = options.accountApiPrefix || "/account";
        this.storage = options.storage || yAuthDefaultStorage;
        this.axios = options.axiosInstance;
        this.options = options.endpointConfig || defaultClientOptions;
    }

    private onSignIn: <T>(userData: T) => void = () => {};
    private onSignOut: () => void = () => {};

    public onEvents(ev: {
        onSignIn: <T>(userData: T) => void;
        onSignOut: () => void;
    }) {
        this.onSignIn = ev.onSignIn;
        this.onSignOut = ev.onSignOut;
    }

    async signIn( params: MergeConfigs<TConfig>["signIn"]["params"]): Promise<MergeConfigs<TConfig>["signIn"]["result"]> {
        const response = await this.axios.post<MergeConfigs<TConfig>["signIn"]["result"]>(`${this.authApiPrefix}${this.options.signInEndpoint}`, params);
        const user = {email: params.email} as MergeConfigs<TConfig>["signIn"]["result"];
        this.storage.setUser(user);
        this.storage.setToken(response.data.access_token);
        this.onSignIn && this.onSignIn(user);
        return user as MergeConfigs<TConfig>["signIn"]["result"];
    }

    async signUp(params: MergeConfigs<TConfig>["signUp"]["params"]): Promise<MergeConfigs<TConfig>["signUp"]["result"]> {
        const response = await this.axios.post<MergeConfigs<TConfig>["signUp"]["result"]>(`${this.authApiPrefix}${this.options.signUpEndpoint}`, params);
        const userData = response.data;
        this.storage.setUser(userData);
        this.storage.setToken(userData.access_token);
        return userData as MergeConfigs<TConfig>["signUp"]["result"];
    }

    async signOut(): Promise<MergeConfigs<TConfig>["signOut"]["result"]> {
        await this.axios.post(`${this.authApiPrefix}${this.options.signOutEndpoint}`);
        this.storage.clearToken();
        this.storage.clearUser();
        this.onSignOut && this.onSignOut();
        return {success: true} as MergeConfigs<TConfig>["signOut"]["result"];
    }

    async whoAmI() : Promise<MergeConfigs<TConfig>["whoAmI"]["result"]>{
        const response = await this.axios.get<MergeConfigs<TConfig>["whoAmI"]["result"]>(`${this.authApiPrefix}/whoami`);
        return response.data as MergeConfigs<TConfig>["whoAmI"]["result"];
    }

    async refreshToken() : Promise<MergeConfigs<TConfig>["refreshToken"]["result"]>{
        const response = await this.axios.post<MergeConfigs<TConfig>["refreshToken"]["result"]>(`${this.authApiPrefix}${this.options.refreshTokenEndpoint}`);
        this.storage.setToken(response.data.access_token);
        return response.data;
    }

    async forgotPassword(email: string) {
        await this.axios.post(`${this.accountApiPrefix}${this.options.forgotPasswordEndpoint}`, {email})
    }

    async resetPassword(params: MergeConfigs<TConfig>["resetPassword"]["params"]) : Promise<MergeConfigs<TConfig>["resetPassword"]["result"]>{
        return await this.axios.post(`${this.accountApiPrefix}${this.options.resetPasswordEndpoint}`, params);
    }

    async changePassword(params: MergeConfigs<TConfig>["changePassword"]["params"]) : Promise<MergeConfigs<TConfig>["changePassword"]["result"]>{
        return await this.axios.post(`${this.accountApiPrefix}${this.options.changePasswordEndpoint}`, params);                
    }

    async resendEmailConfirmation(params: MergeConfigs<TConfig>["resendEmailConfirm"]["params"]) : Promise<MergeConfigs<TConfig>["resendEmailConfirm"]["result"]>{
        return await this.axios.post(`${this.accountApiPrefix}${this.options.resendEmailConfirmationEndpoint}`, {email: params.email});
    }

    async confirmEmail(params: MergeConfigs<TConfig>["confirmEmail"]["params"]) : Promise<MergeConfigs<TConfig>["confirmEmail"]["result"]>{
        return this.axios.get(`${this.accountApiPrefix}${this.options.confirmEmailEndpoint}`, {
            params: {
                code: params.code, 
                userId: params.userId
            }
        });
    }

    externalChallenge(data: MergeConfigs<TConfig>["externalChallenge"]["params"]){
        const callBackUrl = data.mode === "SignIn"
            ? window.location.origin + "/external-challenge-callback" + data.provider
            : window.location.origin + "/profile?link" + data.provider;

        const api = this.apiBaseUrl + this.authApiPrefix + "/external/challenge/" + data.provider
            + "?CallbackUrl=" + encodeURIComponent(callBackUrl);
        
        window.location.replace(api);
    }

    async linkLogin() : Promise<MergeConfigs<TConfig>["linkLogin"]["result"]>{
        const path = '/link/external';
        const response = await this.axios.post<MergeConfigs<TConfig>["linkLogin"]["result"]>(this.accountApiPrefix + path);
        return response.data;
    }

    async signUpExternal(data: MergeConfigs<TConfig>["signUpExternal"]["params"]) : Promise<MergeConfigs<TConfig>["signUpExternal"]["result"]>{
        const path = '/signup/external';
                
        const tokenRes = await this.axios.post<MergeConfigs<TConfig>["refreshToken"]["result"]>(this.authApiPrefix + path, data);
        this.storage.setToken(tokenRes.data.access_token);
        
        const userRes = await this.axios.get<MergeConfigs<TConfig>["whoAmI"]["result"]>(this.authApiPrefix + '/whoami');
        const user = { email: userRes.data.email }

        this.storage.setUser(user);
        if (this.onSignIn) this.onSignIn(user);

        return user as MergeConfigs<TConfig>["signUpExternal"]["result"];       
    }

    async signInExternal() : Promise<MergeConfigs<TConfig>["signInExternal"]["result"]>{
        const path = '/signin/external';
            
        const tokenRes = await this.axios.post<MergeConfigs<TConfig>["refreshToken"]["result"]>(this.authApiPrefix + path);
        this.storage.setToken(tokenRes.data.access_token);
        
        const userRes = await this.axios.get<MergeConfigs<TConfig>["whoAmI"]["result"]>(this.authApiPrefix + '/whoami');
        const user =  { email: userRes.data.email };
    
        this.storage.setUser(user);
        if (this.onSignIn) this.onSignIn(user);
    
        return user as MergeConfigs<TConfig>["signInExternal"]["result"];       
    }


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
  