import { AxiosInstance, AxiosResponse } from 'axios';
import { AuthResponse, ExternalChallengeRequest, ResetPasswordRequest, SignInRequest, SignUpRequest, TokenResponse, WhoAmIResponse, YAuthClientOptions } from '../types';
import { YAuth } from '../yauth-core';
import mockAxios from 'jest-mock-axios';
import { defineAuthConfig } from '../yauth-utils';

const apiBaseUrl = "http://localhost:3000";
const authApiPrefix = "/auth";

//todo create test react app

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
            const mockReturned = { email: "user@example.com" };
            
            const promise = auth.signIn(mockData);
            mockAxios.mockResponse({ data: mockResult });
            await expect(promise).resolves.toEqual(mockReturned);
        });

        test("should sign in with custom data and result", async () => {
            interface CustomSignIn extends SignInRequest {
                username: string;
            }
            interface CustomSignInResult extends AuthResponse {
                gwapo: boolean;
            }

            const authConfig = defineAuthConfig({
                signIn: {
                    params: {} as CustomSignIn,
                    result: {} as CustomSignInResult,
                },
            });
            const auth = new YAuth(options, authConfig);
            const mockData: CustomSignIn = { username: "user123", email: "test@example.com", password: "password123" };
            const mockResult: CustomSignInResult = { email: "test@example.com", access_token: "test-token", gwapo: true };

            mockAxios.post.mockResolvedValueOnce({ data: mockResult });
            const result = await auth.signIn(mockData);

            expect(mockAxios.post).toHaveBeenCalledWith(expect.stringContaining(options.authApiPrefix!), mockData);
            expect(result).toEqual({ email: "test@example.com" });
            expect(mockStorage.setUser).toHaveBeenCalledWith({ email: "test@example.com" });
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
            const configs = defineAuthConfig({ signUp: { params: {} as CustomSignUpReq, result: {} as CustomSignUpRes } });
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
        });
    });

    // describe("forgot password", () => {
    //     test("should return token response", async () => {
    //         const auth = new YAuth(options);
    //         const mockResult : TokenResponse =  {
    //             access_token: 'some access token',
    //             expires_in: 1
    //         }

    //         mockAxios.post.mockResolvedValueOnce({ data: mockResult });
    //         const result = await auth.refreshToken();
    //         expect(result).toEqual(mockResult);
    //         expect(mockAxios.post).toHaveBeenCalledWith("/auth/signin/refresh");
    //     });
    // });
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
    
    
});
