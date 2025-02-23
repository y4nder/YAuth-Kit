import mockAxios from "jest-mock-axios";
import { YAuthClient } from "../yauth-client";
import { YAuthClientOptions } from "../types";
import { AxiosInstance, AxiosResponse } from "axios";

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



const options : YAuthClientOptions ={
    apiBaseUrl, 
    authApiPrefix,
    axiosInstance: mockAxios.create() as unknown as AxiosInstance,
    storage: mockStorage,
}


const authClient = new YAuthClient(options);

describe("auth-client", () => {
    afterEach(() => {
        mockAxios.reset(); // Reset mock between tests
    });

    test("case 1: should have the right api base url", () => {
        expect(authClient.getApiBaseUrl()).toBe(apiBaseUrl);
    })

    test("case 2: should have the right api prefix", () => {
        expect(authClient.getAuthApiPrefix()).toBe(authApiPrefix);
    })

    test("case 3: should have fallback api prefix", () => {
        const apiBaseUrl = "http://localhost:3000";

        const options : YAuthClientOptions ={
            apiBaseUrl, authApiPrefix,
            axiosInstance: mockAxios.create() as unknown as AxiosInstance
        }

        const c = new YAuthClient(options);

        expect(c.getAuthApiPrefix()).toBe("/auth");
    })

    test("case 4: should call signInEndpoint with correct data and return response", async () => {
        const mockData = { username: "test", password: "1234" };
        const mockResponse = { 
            username: "leander",
            access_token: "fake-access-token" 
        };

        // Call the method
        const promise = authClient.signIn(mockData);

        // Simulate axios response
        mockAxios.mockResponse({ data: mockResponse });

        // Assert the result
        await expect(promise).resolves.toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(`${authClient.getAuthApiPrefix()}${authClient.getSignInEndpoint()}`, mockData);

        // Check if storage is called
        expect(mockStorage.setUser).toHaveBeenCalledWith(mockResponse);
        expect(mockStorage.setToken).toHaveBeenCalledWith(mockResponse.access_token);
    });

    test("case 5: should call signUpEndpoint with correct data and return response", async () => {
        const mockData = { email: "email@email.com",username: "test", password: "1234" };
        const mockResponse = { 
            username: "leander",
            access_token: "fake-access-token" 
        };

        // Call the method
        const promise = authClient.signUp(mockData);

        // Simulate axios response
        mockAxios.mockResponse({ data: mockResponse });

        // Assert the result
        await expect(promise).resolves.toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(`${authClient.getAuthApiPrefix()}${authClient.getSignUpEndpoint()}`, mockData);

        // Check if storage is called
        expect(mockStorage.setUser).toHaveBeenCalledWith(mockResponse);
        expect(mockStorage.setToken).toHaveBeenCalledWith(mockResponse.access_token);
    });

    
    test("case 6: should call signOutEndpoint and clear storage", async () => {

        const mockOnSignOut = jest.fn();

        authClient.onEvents({
            onSignIn: () => {},
            onSignOut: mockOnSignOut
        });
        
        // Call the method
        const promise = authClient.signOut();

        // Simulate axios response
        mockAxios.mockResponse();

        // Assert the result
        await expect(promise).resolves.toBeUndefined();
        expect(mockAxios.post).toHaveBeenCalledWith(`${authClient.getAuthApiPrefix()}${authClient.getSignOutEndpoint()}`);

        // Ensure storage clear methods were called
        expect(mockStorage.clearToken).toHaveBeenCalled();
        expect(mockStorage.clearUser).toHaveBeenCalled();

        // Ensure `onSignOut` callback was called
        expect(mockOnSignOut).toHaveBeenCalled();
    });

    test("case 7: should call refresh token endpoint and update the token in storage", async () => {
        const mockResponse = {
            expires_in: 20,
            access_token: "new-fake-access-token",
        };

        // Call the method
        const promise = authClient.refreshToken();

        // Simulate axios response
        mockAxios.mockResponse({ data: mockResponse });

        // Assert the result
        await expect(promise).resolves.toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(`${authApiPrefix}${authClient.getRefreshTokenEndpoint()}`);
        expect(mockStorage.setToken).toHaveBeenCalledWith(mockResponse.access_token);
    });

    test("case 8: should call forgot password endpoint with email", async () => {
        const email = "test@example.com";
    
        const promise = authClient.forgotPassword(email);
        mockAxios.mockResponse(); 
    
        await expect(promise).resolves.toBeUndefined();
        expect(mockAxios.post).toHaveBeenCalledWith(
            `${authClient.getAccountApiPrefix()}${authClient.getForgotPasswordEndpoint()}`,
            { email }
        );
    });

    test("case 9: should call reset password endpoint with correct data", async () => {
        const mockData = {
            email: "test@example.com",
            password: "NewPass123!",
            code: "some token"
        };
    
        const mockResponse = "Password reset successful";

        const promise = authClient.resetPassword(mockData);
        mockAxios.mockResponse({ data: mockResponse });
    
        const response = await promise; 
    
        expect(response.data).toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(
            `${authClient.getAccountApiPrefix()}${authClient.getResetPasswordEndpoint()}`,
            mockData
        );
    });

    test("case 10: should call change password endpoint with correct data", async () => {
        const mockData = {
            password: "NewPass123!",
            newPassword: "NewPass123!",
        };

        expect(mockData.password).toEqual(mockData.newPassword);
    
        const mockResponse = "Password changed successfully";
    
        const promise = authClient.changePassword(mockData);
        mockAxios.mockResponse({ data: mockResponse });
    
        const response = await promise; 
    
        expect(response.data).toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(
            `${authClient.getAccountApiPrefix()}${authClient.getChangePasswordEndpoint()}`,
            mockData
        );
    });

    test("case 11: should call resend email confirmation endpoint with email", async () => {
        const email = "test@example.com";
        const mockResponse = "Email sent successfully";
    
        const promise = authClient.resendEmailConfirmation(email);
        mockAxios.mockResponse({ data: mockResponse });
    
        const response = await promise; 
    
        expect(response.data).toEqual(mockResponse);
        expect(mockAxios.post).toHaveBeenCalledWith(
            `${authClient.getAccountApiPrefix()}${authClient.getResendEmailEndpoint()}`,
            { email }
        );
    });
    
    test("case 12: should call confirm email endpoint with correct params", async () => {
        const code = "confirmation-code";
        const userId = "user-123";
        const mockResponse = "Email confirmed successfully";
    
        const promise = authClient.confirmEmail(code, userId);
        mockAxios.mockResponse({ data: mockResponse });
        const response = await promise; 
    
        expect(response.data).toEqual(mockResponse);
        expect(mockAxios.get).toHaveBeenCalledWith(
            `${authClient.getAccountApiPrefix()}${authClient.getConfirmEmailEndpoint()}`,
            { params: { code, userId } }
        );
    });
    
    
})