
# 🚀 YAuth v0.0.5

## Overview

`YAuth` is a **personal TypeScript-based authentication client** developed for my specific use case. It provides a structured way to manage **authentication** and **authorization** in web applications using **Axios** for HTTP requests. This project supports features such as **sign-in**, **sign-up**, **token refresh**, **password management**, and **external authentication**.

It is not intended for general public use, but rather tailored for my **individual needs**, providing a flexible solution for handling user authentication within my personal projects.

## ✨ Features
- ✅ Sign-in and sign-up support
- 🔒 External authentication handling
- 🔄 JWT token storage and refresh
- 🧑‍💻 Forgot password and reset password functionality
- 📧 Email confirmation
- ⚡ Axios request interceptors for authentication

## 🛠 Installation

Ensure you have `axios` installed in your project. If not, install it using npm or yarn:

```sh
npm install axios yauth-kit
```

Then, add the `YAuthClient` module to your project.

## ⚡ Usage

### Importing to React Project

Create a provider called `YAuthContext.tsx` and wrap the root of your app with the provider.

```ts
import { AuthResponse, createAxiosInstance, YAuthClient } from "yauth-kit";
import React, { createContext, useContext, useMemo } from "react";

export const axios = createAxiosInstance(import.meta.env.VITE_API_URL);

export const yauth = new YAuthClient({
    apiBaseUrl: import.meta.env.VITE_API_URL,
    axiosInstance: axios,
});

const YAuthContext = createContext<YAuthContextProps>({ user: null } as YAuthContextProps);

export const YAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState<AuthResponse | null>(yauth.getUser());

    yauth.initAxiosInterceptors(() => {
        setUser(null);
    });

    yauth.onEvents({
        onSignIn: <T,>(user: T) => {
            setUser(user as AuthResponse);
        },
        onSignOut: () => {
            setUser(null);
        },
    });

    const value = useMemo<YAuthContextProps>(
        () => ({
            user,
            yauth,
        }),
        [user]
    );

    return <YAuthContext.Provider value={value}>{children}</YAuthContext.Provider>;
};

export const useYAuth = () => {
    return useContext(YAuthContext);
};

export interface YAuthContextProps {
    user: AuthResponse | null;
    yauth: YAuthClient;
}
```

### Usage in a Component

```ts
const { yauth } = useYAuth();

const onSubmit = (data: { email: string; password: string }) => {
    yauth.signIn({ email: data.email, password: data.password })
        .then(() => {
            navigate("/"); // Redirect after sign-in
        })
        .catch((error) => {
            setApiErrors(extractApiErrors(error) ?? ["An error occurred"]);
        });
};
```

## 🔧 Custom Types

You can override or add custom types for the `YAuthClient` class by providing your own type arguments for each of the generic parameters when you create an instance of the class or extend it.

### Basic Syntax

You can specify your own types when using the `YAuthClient` class like this:

```typescript
new YAuthClient<
    CustomSignInRequest, 
    CustomSignInResponse, 
    CustomSignUpRequest, 
    CustomSignUpResponse, 
    CustomTokenResponse, 
    CustomAccountInfoResponse, 
    CustomSignUpExternalRequest, 
    CustomWhoAmIResponse
>();
```

Where `CustomSignInRequest`, `CustomSignInResponse`, `CustomSignUpRequest`, etc., are your custom types.

### Example: Overriding Custom Types

1. **Create Custom Types**: Define the types you want to use.

    ```typescript
    interface CustomSignInRequest {
        username: string;
        password: string;
    }

    interface CustomSignInResponse extends AuthResponse {
        accessToken: string;
        refreshToken: string;
    }

    interface CustomSignUpRequest {
        username: string;
        email: string;
        password: string;
    }

    interface CustomSignUpResponse extends AuthResponse {
        userId: string;
        status: string;
    }

    interface CustomTokenResponse extends TokenResponse {
        accessToken: string;
        expiresIn: number;
    }

    interface CustomAccountInfoResponse extends AccountInfoResponse {
        emailVerified: boolean;
        role: string;
    }

    interface CustomSignUpExternalRequest {
        provider: string;
        token: string;
    }

    interface CustomWhoAmIResponse extends WhoAmIResponse {
        userRole: string;
    }
    ```

2. **Use Custom Types with `YAuthClient`:**

    Now you can use your custom types by providing them when instantiating the `YAuthClient`.

    ```typescript
    const client = new YAuthClient<
        CustomSignInRequest, 
        CustomSignInResponse, 
        CustomSignUpRequest, 
        CustomSignUpResponse, 
        CustomTokenResponse, 
        CustomAccountInfoResponse, 
        CustomSignUpExternalRequest, 
        CustomWhoAmIResponse
    >();
    ```

### Overriding Default Types

If you only want to override one or a few of the default types while keeping the others as they are, you can omit the ones you don't need to change:

```typescript
const client = new YAuthClient<
    CustomSignInRequest,  // Custom type for sign-in request
    CustomSignInResponse  // Custom type for sign-in response
>();
```

This will keep all the other generic parameters (like `TSignUpRequest`, `TTokenResponse`, etc.) as the default types (`any`, `AuthResponse`, etc.).

---

# Overriding a Specific Type in `YAuthClient`

In some cases, you might want to override only a **specific type** in the `YAuthClient` while keeping the others as default. Below is an example of how you can do this.

## Default `YAuthClient` Declaration

The `YAuthClient` class is defined with multiple generic type parameters:

```typescript
export class YAuthClient<
    TSignInRequest = any,
    TSignInResponse extends AuthResponse = AuthResponse,
    TSignUpRequest = any,
    TSignUpResponse extends AuthResponse = AuthResponse,
    TTokenResponse extends TokenResponse = TokenResponse,
    TAccountInfoResponse extends AccountInfoResponse = AccountInfoResponse,
    TSignUpExternalRequest = any,
    TWhoAmIResponse extends WhoAmIResponse = WhoAmIResponse
> {
    // Class implementation
}
```

By default, each type has a fallback type (e.g., `any`, `AuthResponse`, etc.), but you can customize them as needed.

## Overriding a Specific Type

To override only one specific type while keeping the others as they are, pass your custom type as the argument for the one you want to modify. For example, if you only want to override `TSignInResponse` while leaving the others as default:

```typescript
const client = new YAuthClient<
    any,                    // Default type for TSignInRequest
    CustomSignInResponse    // Custom type for TSignInResponse
>();
```

In this example, only `TSignInResponse` is overridden with the `CustomSignInResponse` type, while the rest remain unchanged.

### Full Example with a Custom Type

Here’s how you can define a custom type for `TSignInResponse` and use it with `YAuthClient`:

```typescript
// Custom type for sign-in response
interface CustomSignInResponse extends AuthResponse {
    accessToken: string;
    refreshToken: string;
}

const client = new YAuthClient<
    any,                    // Default for TSignInRequest
    CustomSignInResponse,   // Custom for TSignInResponse
    any,                    // Default for TSignUpRequest
    AuthResponse,           // Default for TSignUpResponse
    TokenResponse,          // Default for TTokenResponse
    AccountInfoResponse,    // Default for TAccountInfoResponse
    any,                    // Default for TSignUpExternalRequest
    WhoAmIResponse          // Default for TWhoAmIResponse
>();
```

### When to Use This

This method is useful when you want to:
- Modify a **single type** to suit a specific use case, such as customizing the response from the sign-in operation.
- Keep the other types in the class or function unchanged to avoid unnecessary changes.


---

### Configuring Endpoint URLs 🛠️

To configure the endpoints for your authentication client, you can pass a custom `YAuthEndpointConfiguration` to the `configure` method of the `YAuthClient`.

#### Example Usage:

```ts
const client = new YAuthClient({
    // ... configurations
});

// Custom endpoint configuration
const endpointConfig: YAuthEndpointConfiguration = {
    signInEndpoint: "/auth/sign-in",
    signUpEndpoint: "/auth/sign-up",
    signOutEndpoint: "/auth/sign-out",
    refreshTokenEndpoint: "/auth/refresh-token",
    forgotPasswordEndpoint: "/auth/forgot-password",
    resetPasswordEndpoint: "/auth/reset-password",
    changePasswordEndpoint: "/auth/change-password",
    resendEmailConfirmationEndpoint: "/auth/resend-email-confirmation",
    confirmEmailEndpoint: "/auth/confirm-email"
};

// Apply the configuration
client.configure(endpointConfig);
```

#### `YAuthEndpointConfiguration` type:
```ts
export type YAuthEndpointConfiguration = {
    signInEndpoint: string;
    signUpEndpoint: string;
    signOutEndpoint: string;
    refreshTokenEndpoint: string;
    forgotPasswordEndpoint: string;
    resetPasswordEndpoint: string;
    changePasswordEndpoint: string;
    resendEmailConfirmationEndpoint: string;
    confirmEmailEndpoint: string;
};
```

This configuration allows you to customize the endpoints used for authentication actions such as **sign-in**, **sign-up**, **token refresh**, **password management**, and **email verification**.

## 📝 Sample Code

### Signing In
```ts
const login = async () => {
    try {
        const user = await yauthClient.signIn({ email: "user@example.com", password: "password123" });
        console.log("User authenticated", user);
    } catch (error) {
        console.error("Login failed", error);
    }
};
```

### Signing Up
```ts
const register = async () => {
    try {
        const newUser = await yauthClient.signUp({
            email: "newuser@example.com",
            username: "newUserName",
            password: "securepassword",
        });
        console.log("User registered", newUser);
    } catch (error) {
        console.error("Registration failed", error);
    }
};
```

### Signing Out
```ts
const logout = async () => {
    await yauthClient.signOut();
    console.log("User logged out");
};
```

## License

This project is licensed under the MIT License. Feel free to modify and use it in your projects.

## 🛠 Contributing

If you find any issues or have suggestions for improvements, please open an issue or submit a pull request. 🙌



