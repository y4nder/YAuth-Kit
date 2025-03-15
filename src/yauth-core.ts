import Axios, {AxiosInstance } from "axios";
import {
    BaseAuthClientConfig,
    ExternalStrategy,
    MergeConfig,
    YAuthClientOptions,
    YAuthEndpointConfiguration,
    YAuthStorage
} from "./types";
import { yAuthDefaultStorage } from "./yauth-default-storage";
import { defaultClientOptions } from "./yauth-default-options";
import { authRequestInterceptorFactory } from "./yauth-utils";

// type aliasing MergeConfig<T>
type MC<T extends Partial<BaseAuthClientConfig>> = MergeConfig<T>;

export class YAuth<TConfig extends Partial<BaseAuthClientConfig>> {
    private config: MC<TConfig>;
    public readonly apiBaseUrl: string;
    public readonly authApiPrefix: string;
    private readonly accountApiPrefix: string;
    private readonly storage? : YAuthStorage;
    private readonly axios : AxiosInstance;
    private options: YAuthEndpointConfiguration;
    private _useUserStore: boolean;
    private _useTokenStore: boolean;

    constructor(options: YAuthClientOptions, config?: TConfig) {
        this.validateOptions(options);
        this.config = (config ?? {}) as MC<TConfig>;
        this.apiBaseUrl = options.apiBaseUrl;
        this.authApiPrefix = options.authApiPrefix || "/auth";
        this.accountApiPrefix = options.accountApiPrefix || "/account";
        this._useUserStore = options.useUserStore ?? true;
        this._useTokenStore = options.useTokenStore ?? true;
        if (this._useUserStore || this._useTokenStore) {
            this.storage = options.storage || yAuthDefaultStorage;
        }
        this.axios = options.axiosInstance;
        this.options = {
            ...defaultClientOptions,
            ...(options.endpointConfig || {}),
        };
    }


    private validateOptions(options: YAuthClientOptions) {
        const invalidPrefixes: string[] = [];
    
        if (options.authApiPrefix && !options.authApiPrefix?.startsWith("/")) {
            invalidPrefixes.push("authApiPrefix");
        }
    
        if (options.accountApiPrefix && !options.accountApiPrefix?.startsWith("/")) {
            invalidPrefixes.push("accountApiPrefix");
        }
    
        if (invalidPrefixes.length > 0) {
            throw new Error(
                `The following prefixes must start with '/': ${invalidPrefixes.join(", ")}`
            );
        }
    }

    private onSignIn: <T>(userData: T) => void = () => {};
    private onSignOut: () => void = () => {};

    public get useUserStore(): boolean {
        return this._useUserStore;
    }

    public get useTokenStore(): boolean {
        return this._useTokenStore;
    }
    
    public onEvents(ev: {
        onSignIn: <T>(userData: T) => void;
        onSignOut: () => void;
    }) {
        this.onSignIn = ev.onSignIn;
        this.onSignOut = ev.onSignOut;
    }

    public getUser<TUser>() : TUser | null{
        return this.storage!.getUser<TUser>();
    }

    async signIn(params: MC<TConfig>["signIn"]["params"]): Promise<MC<TConfig>["signIn"]["result"]> {
        const response = await this.axios.post<MC<TConfig>["signIn"]["result"]>(`${this.authApiPrefix}${this.options.signInEndpoint}`, params);
        const user = response.data as MC<TConfig>["signIn"]["result"];
        this.invokeUseStores<typeof user>(user, "signIn");      
        this.onSignIn && this.onSignIn(user);
        return user;
    }

    async signUp(params: MC<TConfig>["signUp"]["params"]): Promise<MC<TConfig>["signUp"]["result"]> {
        const response = await this.axios.post<MC<TConfig>["signUp"]["result"]>(`${this.authApiPrefix}${this.options.signUpEndpoint}`, params);
        const user = response.data as MC<TConfig>["signUp"]["result"];
        this.invokeUseStores<typeof user>(user, "signUp");
        return user;
    }

    async signOut(): Promise<MC<TConfig>["signOut"]["result"]> {
        await this.axios.post(`${this.authApiPrefix}${this.options.signOutEndpoint}`);
        this.invokeClearStores();
        this.onSignOut && this.onSignOut();
        return {success: true} as MC<TConfig>["signOut"]["result"];
    }

    async whoAmI() : Promise<MC<TConfig>["whoAmI"]["result"]>{
        const response = await this.axios.get<MC<TConfig>["whoAmI"]["result"]>(`${this.authApiPrefix}/whoami`);
        return response.data as MC<TConfig>["whoAmI"]["result"];
    }

    async refreshToken() : Promise<MC<TConfig>["refreshToken"]["result"]>{
        const response = await this.axios.post<MC<TConfig>["refreshToken"]["result"]>(`${this.authApiPrefix}${this.options.refreshTokenEndpoint}`);
        if(this.useTokenStore) this.storage!.setToken(response.data.access_token);
        return response.data;
    }

    async forgotPassword(email: string) {
        await this.axios.post(`${this.accountApiPrefix}${this.options.forgotPasswordEndpoint}`, {email})
    }

    async resetPassword(params: MC<TConfig>["resetPassword"]["params"]) : Promise<MC<TConfig>["resetPassword"]["result"]>{
        return await this.axios.post(`${this.accountApiPrefix}${this.options.resetPasswordEndpoint}`, params);
    }

    async changePassword(params: MC<TConfig>["changePassword"]["params"]) : Promise<MC<TConfig>["changePassword"]["result"]>{
        return await this.axios.post(`${this.accountApiPrefix}${this.options.changePasswordEndpoint}`, params);                
    }

    async resendEmailConfirmation(params: MC<TConfig>["resendEmailConfirm"]["params"]) : Promise<MC<TConfig>["resendEmailConfirm"]["result"]>{
        return await this.axios.post(`${this.accountApiPrefix}${this.options.resendEmailConfirmationEndpoint}`, {email: params.email});
    }

    async confirmEmail(params: MC<TConfig>["confirmEmail"]["params"]) : Promise<MC<TConfig>["confirmEmail"]["result"]>{
        return this.axios.get(`${this.accountApiPrefix}${this.options.confirmEmailEndpoint}`, {
            params: {
                code: params.code, 
                userId: params.userId
            }
        });
    }

    async accountInfo() : Promise<MC<TConfig>["accountInfo"]["result"]>{
        const response = await this.axios.get<MC<TConfig>["accountInfo"]["result"]>(`${this.accountApiPrefix}${this.options.accountInfoEndpoint}`);
        return response.data;
    }

    externalChallenge(data: MC<TConfig>["externalChallenge"]["params"]){
        const callBackUrl = data.mode === "SignIn"
            ? window.location.origin + "/external-challenge-callback" + data.provider
            : window.location.origin + "/profile?link" + data.provider;

        const api = this.apiBaseUrl + this.authApiPrefix + "/external/challenge/" + data.provider
            + "?CallbackUrl=" + encodeURIComponent(callBackUrl);
        
        window.location.replace(api);
    }

    async linkLogin() : Promise<MC<TConfig>["linkLogin"]["result"]>{
        const path = '/link/external';
        const response = await this.axios.post<MC<TConfig>["linkLogin"]["result"]>(this.accountApiPrefix + path);
        return response.data;
    }

    async signUpExternal(data: MC<TConfig>["signUpExternal"]["params"]) : Promise<MC<TConfig>["signUpExternal"]["result"]>{
        const path = '/signup/external';
        const tokenRes = await this.axios.post<MC<TConfig>["refreshToken"]["result"]>(this.authApiPrefix + path, data);
        const user = await this.handleExternalResponse(tokenRes.data, "SignUp");
        return user as MC<TConfig>["signUpExternal"]["result"];
    }

    async signInExternal() : Promise<MC<TConfig>["signInExternal"]["result"]>{
        const path = '/signin/external';
        const tokenRes = await this.axios.post<MC<TConfig>["refreshToken"]["result"]>(this.authApiPrefix + path);
        const user = await this.handleExternalResponse(tokenRes.data, "SignIn");
        return user as MC<TConfig>["signInExternal"]["result"];
    }

    

    private async handleExternalResponse(response: MC<TConfig>["refreshToken"]["result"], type: ExternalStrategy){
        if(this.useTokenStore)this.storage!.setToken(response.access_token);
        const whoAmIRes = await this.axios.get<MC<TConfig>["whoAmI"]["result"]>(this.authApiPrefix + '/whoami');
        const userRes = whoAmIRes.data;
        if(this.useUserStore)this.storage!.setUser(userRes);
        if (this.onSignIn) this.onSignIn(userRes);
        if(type === "SignIn"){
            return userRes as MC<TConfig>["signInExternal"]["result"];
        } else {
            return userRes as MC<TConfig>["signUpExternal"]["result"];
        }
    }


    initAxiosInterceptors(onSignOut?: () => void) {
        if(this.useTokenStore){
            this.axios.interceptors.request.use(authRequestInterceptorFactory(this.storage!));
        }
        this.axios.interceptors.response.use(value => value, async error => {
            if (!Axios.isAxiosError(error)) return Promise.reject(error);

            const originalConfig = error.config as any;
            const expired = error.response?.headers ? error.response.headers['x-token-expired'] : false;

            if (error.response?.status === 401 && expired && !originalConfig._retry) {
                originalConfig._retry = true;
                return tryRefreshToken(originalConfig);
            } else if (error.response?.status === 401 && !expired) {
                this.invokeClearStores();
                onSignOut && onSignOut();
            }

            return Promise.reject(error);
        });

        const tryRefreshToken = async (originalRequestConfig: any) => {
            try {
                await this.refreshToken();
                return this.axios.request(originalRequestConfig);
            } catch (error) {
                this.invokeClearStores();
                onSignOut && onSignOut();

                return Promise.reject(error);
            }
        };
    }

    private invokeUseStores<T>(userData: T, type: "signIn" | "signUp"){
        let data: MC<TConfig>["signIn"]["result"] | MC<TConfig>["signUp"]["result"];
        if(type === "signIn")
            data = userData as MC<TConfig>["signIn"]["result"]
        else 
            data = userData as MC<TConfig>["signUp"]["result"] 
        if(this.useUserStore) this.storage!.setUser(data);
        if(this.useTokenStore) this.storage!.setToken(data.access_token);   
    }

    private invokeClearStores(){
        if(this.useUserStore) this.storage!.clearToken()
        if(this.useTokenStore) this.storage!.clearUser();
    }
}


