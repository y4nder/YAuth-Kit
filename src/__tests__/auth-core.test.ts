import { AxiosInstance, AxiosResponse } from 'axios';
import { AccountInfoResponse, AuthResponse, ChangePasswordRequest, ExternalChallengeRequest, ExtractYAuthResult, ResetPasswordRequest, SignInRequest, SignUpRequest, TokenResponse, WhoAmIResponse, YAuthClientOptions } from '../types';
import { YAuth } from '../yauth-core';
import mockAxios from 'jest-mock-axios';
import { defineSchema } from '../yauth-utils';


const apiBaseUrl = "http://localhost:3000";
const authApiPrefix = "/auth";

const mockStorage: {
    data: Record<string, string>,
    setUser: jest.Mock<void, [any]>,
    getUser: jest.Mock<any, []>,
    setToken: jest.Mock<void, [string]>,
    getToken: jest.Mock<string | null, []>,
    clearToken: jest.Mock<void, []>,
    clearUser: jest.Mock<void, []>
} = {
    data: {} as Record<string, string>, 

    setUser: jest.fn((user) => {
        mockStorage.data["user"] = JSON.stringify(user);
    }),

    getUser: jest.fn(() => {
        return mockStorage.data["user"] ? JSON.parse(mockStorage.data["user"]) : null;
    }),

    setToken: jest.fn((token) => {
        mockStorage.data["token"] = token;
    }),

    getToken: jest.fn(() => {
        return mockStorage.data["token"] || null;
    }),

    clearToken: jest.fn(() => {
        delete mockStorage.data["token"];
    }),

    clearUser: jest.fn(() => {
        delete mockStorage.data["user"];
    }),
};


const options: YAuthClientOptions = {
    apiBaseUrl,
    authApiPrefix,
    axiosInstance: mockAxios.create() as unknown as AxiosInstance,
    storage: mockStorage,
};

describe("YAuth Core", () => {
    afterEach(() => {
        mockAxios.reset();
        
        // Clear stored data
        mockStorage.data = {}; 

        // Reset all mock functions
        mockStorage.setUser.mockClear();
        mockStorage.getUser.mockClear();
        mockStorage.setToken.mockClear();
        mockStorage.getToken.mockClear();
        mockStorage.clearToken.mockClear();
        mockStorage.clearUser.mockClear();
    });

    describe("Sign In", () => {
        test("should sign in successfully", async () => {
            const auth = new YAuth(options);
            const mockData = { email: "user@example.com", password: "secure123" };
            const mockResult = { userId: 1, token: "some token" };
            
            const promise = auth.signIn(mockData);
            mockAxios.mockResponse({ data: mockResult });
            await expect(promise).resolves.toEqual(mockResult);
        });

        test("should sign in with custom data and result", async () => {
            interface CustomSignIn extends SignInRequest {
                username: string;
            }
            interface CustomSignInResult extends AuthResponse {
                gwapo: boolean;
            }

            const signInConfig = defineSchema({
                signIn: {
                    params: {} as CustomSignIn,
                    result: {} as CustomSignInResult,
                },
            });

            const auth = new YAuth(options, signInConfig);
            
        
            const mockData: CustomSignIn = { username: "user123", email: "test@example.com", password: "password123" };
            const mockResult: CustomSignInResult = { email: "test@example.com", access_token: "test-token", gwapo: true };

            mockAxios.post.mockResolvedValueOnce({ data: mockResult });
            const result = await auth.signIn(mockData);

            expect(auth.getUser()).toEqual(result);
            expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining(options.authApiPrefix!), mockData);
            expect(result).toEqual(mockResult);
            expect(mockStorage.setUser).toHaveBeenCalledWith(mockResult);
            expect(mockStorage.setToken).toHaveBeenCalledWith(mockResult.access_token);
            
        });
    });

    describe("Sign Up", () => {
        test("should sign up successfully", async () => {
            const auth = new YAuth(options);
            const mockData: SignUpRequest = { email: "email@email.com", password: "password123" };
            const mockResult: AuthResponse = { email: mockData.email, access_token: "some access token" };
            
            mockAxios.post.mockResolvedValueOnce({ data: mockResult });
            const result = await auth.signUp(mockData);

            expect(auth.getUser()).toEqual(mockResult);
            expect(mockStorage.setUser).toHaveBeenCalledWith(result);
            expect(mockStorage.setToken).toHaveBeenCalledWith(result.access_token);
            expect(result).toEqual(mockResult);
        });

        test("should sign up with custom types", async () => {
            interface CustomSignUpReq extends SignUpRequest {
                gwapo: boolean;
            }
            interface CustomSignUpRes extends AuthResponse {
                picture: string;
            }
            const configs = defineSchema({ signUp: { params: {} as CustomSignUpReq, result: {} as CustomSignUpRes } });
            const auth = new YAuth(options, configs);
            const mockData: CustomSignUpReq = { email: "email@email.com", password: "password123", gwapo: true };
            const mockResult: CustomSignUpRes = { email: mockData.email, access_token: "some access token", picture: "some url of a picture" };
            
            mockAxios.post.mockResolvedValueOnce({ data: mockResult });
            const result = await auth.signUp(mockData);
            expect(mockStorage.setUser).toHaveBeenCalledWith(result);
            expect(mockStorage.setToken).toHaveBeenCalledWith(result.access_token);
            expect(result).toEqual(mockResult);
            
        });
    });

    describe("Sign Out", () => {
        test("should sign out successfully", async () => {
            const auth = new YAuth(options);
            mockAxios.post.mockResolvedValue({ success: true });
            const res = await auth.signOut();

            expect(res).toEqual({ success: true });
            expect(mockStorage.clearToken).toHaveBeenCalled();
            expect(mockStorage.clearUser).toHaveBeenCalled();
            expect(mockStorage.getUser()).toBeNull();
            expect(mockStorage.getToken()).toBeNull();
        });
    });

    describe("Who Am I", () => {
        test("should fetch user information", async () => {
            const auth = new YAuth(options);
            const mockResult : WhoAmIResponse =  {
                username: 'yander',
                email: 'email@email.com',
                roles: ["admin", "user"]
            }

            mockAxios.get.mockResolvedValueOnce({ data: mockResult });
            const result = await auth.whoAmI();
            expect(result).toEqual(mockResult);
            expect(mockAxios.get).toHaveBeenCalledWith("/auth/whoami");
        });
    });

    
    describe("refresh token", () => {
        test("should return token response", async () => {
            const auth = new YAuth(options);
            const mockResult : TokenResponse =  {
                access_token: 'some access token',
                expires_in: 1
            }

            mockAxios.post.mockResolvedValueOnce({ data: mockResult });
            const result = await auth.refreshToken();
            expect(result).toEqual(mockResult);
            expect(mockAxios.post).toHaveBeenCalledWith("/auth/signin/refresh");
            expect(mockStorage.setToken).toHaveBeenCalledWith(mockResult.access_token)
        });
    });

    describe("forgot password", () => {
        test("should return token response", async () => {
            const auth = new YAuth(options);
            
            mockAxios.post.mockResolvedValueOnce({});
            const email : string = "email@example.com"
            await auth.forgotPassword(email);
            
            expect(mockAxios.post).toHaveBeenCalledWith("/account/password/forgot", {email});
        });
    });
    describe('reset password', () => {
        test("should accept email ", async () => {
            const auth = new YAuth(options);
            const mockData: ResetPasswordRequest = {
                email: "email@email.com",
                password: "newPassword",
                code: "123245556"
            }

            mockAxios.post.mockResolvedValueOnce({});

            const res = await auth.resetPassword(mockData);

            expect(res).toMatchObject({} as AxiosResponse);
        })
    })

    describe('change password', () => {
        test("should accept data properly", async () => {
            const auth = new YAuth(options);
            const mockData: ChangePasswordRequest = {
                password: '12345',
                newPassword: '12345'
            }

            expect(mockData.newPassword).toEqual(mockData.password);

            mockAxios.post.mockResolvedValueOnce({});

            const res = await auth.changePassword(mockData);

            expect(res).toMatchObject({} as AxiosResponse);
        })
    })
    
    describe("resend email confirmation", () => {
        test("should accept email ", async () => {
            const auth = new YAuth(options);
            const mockData= {
                email: "email@email.com",
            }

            mockAxios.post.mockResolvedValueOnce({});

            const res = await auth.resendEmailConfirmation(mockData);

            expect(res).toMatchObject({} as AxiosResponse);
        })
    })

    describe("account info", () => {
        test("should accept code and userId ", async () => {
            const auth = new YAuth(options);
            const mockResult : AccountInfoResponse = {
                email: 'email@email.com',
                userName: 'yander',
                roles: ['admin', 'user'],
                logins: ['google', 'facebook'],
                hasPassword: true
            }
            mockAxios.get.mockResolvedValueOnce({data: mockResult});
            const res = await auth.accountInfo();
            expect(res).toEqual(mockResult);
            expect(mockAxios.get).toHaveBeenCalledWith("/account/info");
        })
    })

    describe("confirm email", () => {
        test("should accept code and userId ", async () => {
            const auth = new YAuth(options);
            const mockData = {
                code: "some code",
                userId: "some userid"
            }

            mockAxios.get.mockResolvedValueOnce({});
            const res = await auth.confirmEmail(mockData);
            expect(res).toMatchObject({} as AxiosResponse);
        })
    })

    describe("externalChallenge", () => {
        let auth = new YAuth(options);
        let replaceSpy: jest.SpyInstance;
    
        beforeEach(() => {
            auth = new YAuth(options);
            replaceSpy = jest.fn();
            Object.defineProperty(window, "location", {
                value: { replace: replaceSpy, origin: "http://localhost" },
                writable: true,
            });
        });
    
        afterEach(() => {
            jest.restoreAllMocks();
        });
    
        test("should call external challenge callback for SignIn", () => {
            const mockData: ExternalChallengeRequest = {
                provider: "google",
                mode: "SignIn"
            };
    
            const expectedUrl =
                `${auth.apiBaseUrl}${auth.authApiPrefix}/external/challenge/google` +
                `?CallbackUrl=${encodeURIComponent(window.location.origin + "/external-challenge-callbackgoogle")}`;
    
            auth.externalChallenge(mockData);
    
            expect(replaceSpy).toHaveBeenCalledWith(expectedUrl);
        });
    
        test("should call external profile link for LinkLogin", () => {
            const mockData: ExternalChallengeRequest = {
                provider: "google",
                mode: "LinkLogin"
            };
    
            const expectedUrl =
                `${auth.apiBaseUrl}${auth.authApiPrefix}/external/challenge/google` +
                `?CallbackUrl=${encodeURIComponent(window.location.origin + "/profile?linkgoogle")}`;
    
            auth.externalChallenge(mockData);
    
            expect(replaceSpy).toHaveBeenCalledWith(expectedUrl);
        });
    });

    describe("link login", () => {

        test("called the right path", async () => {
            const auth = new YAuth(options);
            mockAxios.post.mockResolvedValueOnce({});
            const res = await auth.linkLogin();
            expect(mockAxios.post).toHaveBeenCalledWith("/account/link/external");
        })
    })

    describe("signUp external", () => {

        test("called the right path", async () => {
            const auth = new YAuth(options);
            const mockTokenResponse = { data: { access_token: "test_token" } };
            mockAxios.post.mockResolvedValue(mockTokenResponse);

            const handleExternalResponseSpy = jest.spyOn<any, any>(auth as any, "handleExternalResponse");
            handleExternalResponseSpy.mockResolvedValue({ id: 1, email: "test@example.com" });

            const res = await auth.signUpExternal({});
            expect(mockAxios.post).toHaveBeenCalledWith("/auth/signup/external", {});
            expect(handleExternalResponseSpy).toHaveBeenCalledWith(mockTokenResponse.data, "SignUp");
        })
    })

    describe("sign in external", () => {
        test("calls the correct endpoint", async () => {
            const auth = new YAuth(options);
            
            // Mock Axios post response
            const mockTokenResponse = { data: { access_token: "test_token" } };
            mockAxios.post.mockResolvedValue(mockTokenResponse);
    
            // Spy on the private method
            const handleExternalResponseSpy = jest.spyOn<any, any>(auth as any, "handleExternalResponse");
            handleExternalResponseSpy.mockResolvedValue({ id: 1, email: "test@example.com" });
    
            const res = await auth.signInExternal();
    
            expect(mockAxios.post).toHaveBeenCalledWith(auth.authApiPrefix + "/signin/external");
            expect(handleExternalResponseSpy).toHaveBeenCalledWith(mockTokenResponse.data, "SignIn");
        });
    });
    
    describe("custom conigurations", () => {
        test("multiple configurations", () => {
            interface CustomSignIn extends SignInRequest {
                username: string;
            }
            interface CustomSignInResult extends AuthResponse {
                gwapo: boolean;
            }

            const signInConfig = defineSchema({
                signIn: {
                    params: {} as CustomSignIn,
                    result: {} as CustomSignInResult,
                },
            });
            
            const signOutConfig = defineSchema({
                signOut: {
                    params: {} as any,
                    result: {} as any,
                },
            });

            const mergedConfig = defineSchema({
                ...signInConfig,
                ...signOutConfig
            });
        
            const auth = new YAuth(options, mergedConfig);
        })
        test("overriding an endpoint", async () => {
            const auth = new YAuth({
                ...options, 
                authApiPrefix: "/auth2",
                endpointConfig:{
                    signInEndpoint: "/login"
                }
            });
    
            mockAxios.post.mockResolvedValueOnce({data: {access_token: "some token"}});
    
            const mockData = {
                email: 'some@some.com',
                password: '12345'
            };
    
            await auth.signIn(mockData) ;
    
            expect(mockAxios.post).toHaveBeenCalledWith("/auth2/login", mockData);
        })
    
        test("invalid prefix should fail",async () => {
            expect(() => new YAuth({
                ...options, 
                authApiPrefix: "auth2", // ❌ Invalid prefix (missing "/")
            })).toThrow();
        })
    
        test("should use storage and token store", () => {
            const auth = new YAuth(options);
    
            expect(auth.useUserStore).toBe(true);
            expect(auth.useTokenStore).toBe(true);
        })
    
        test("should override storage mechanism", () => {
            const auth = new YAuth({...options, useUserStore: false});   
    
            expect(auth.useUserStore).toBe(false);
            expect(auth.useTokenStore).toBe(true);
        })
    
        test("should override token store mechanism", () => {
            const auth = new YAuth({...options, useTokenStore: false});   
    
            expect(auth.useUserStore).toBe(true);
            expect(auth.useTokenStore).toBe(false);
        })
    
        test("should override both store mechanism", () => {
            const auth = new YAuth({...options, useTokenStore: false, useUserStore: false});   
    
            expect(auth.useUserStore).toBe(false);
            expect(auth.useTokenStore).toBe(false);
        })
    })
    
    describe("extract result type", () => {
        test("should extract result type", () => {
            const auth = new YAuth(options);
            type WhoAmIType = ExtractYAuthResult<typeof auth, "whoAmI">;
            type SignInType = ExtractYAuthResult<typeof auth, "signIn">;
            
            // Type assertions (these are compile-time checks)
            const whoAmIResult: WhoAmIType = {
                username: "test",
                email: "test@example.com",
                roles: ["user"]
            };

            const signInResult: SignInType = {
                email: "test@example.com",
                access_token: "token123"
            };

            // Runtime checks just to make TypeScript happy
            expect(whoAmIResult.username).toBe("test");
            expect(signInResult.access_token).toBe("token123");
        });

        test("should extract custom result type", () => {
            interface CustomSignInResult extends AuthResponse {
                customField: string;
            }

            const customConfig = defineSchema({
                signIn: {
                    params: {} as SignInRequest,
                    result: {} as CustomSignInResult
                }
            });

            const auth = new YAuth(options, customConfig);
            type CustomSignInType = ExtractYAuthResult<typeof auth, "signIn">;

            // Type assertion (compile-time check)
            const signInResult: CustomSignInType = {
                email: "test@example.com",
                access_token: "token123",
                customField: "custom"
            };

            // Runtime check just to make TypeScript happy
            expect(signInResult.customField).toBe("custom");
        });
    })
    
});
