# 🚀 YAuth v1.0.0

## 📌 Overview

`YAuth` is a **TypeScript-based authentication client** designed for personal use. It provides a structured way to manage **authentication** and **authorization** in web applications, leveraging **Axios** for HTTP requests.

---

## ✨ Features

- ✅ **Sign-in & Sign-up**
- 🔒 **External authentication support**
- 🔄 **JWT token storage & refresh**
- 🧑‍💻 **Password recovery & reset**
- 📧 **Email confirmation & verification**

---
🚀<a href="https://www.npmjs.com/package/yauth-kit?activeTab=readme">YAuth NPM</a>

## 🛠 Installation

Ensure `axios` is installed in your project. If not, install both dependencies using npm:

```sh
npm install axios yauth-kit
```

---

## 🚀 Usage

### 📥 Import & Initialize YAuth

```ts
import { YAuth, createAxiosInstance } from "yauth-kit";

const apiBaseUrl = "https://api.example.com";
const axiosInstance = createAxiosInstance(apiBaseUrl);

const authClient = new YAuth({
    apiBaseUrl,
    axiosInstance,
});
```

---

## 🔑 Authentication Methods

### 🏷️ Sign In
```ts
const user = await authClient.signIn({ email: "user@example.com", password: "password123" });
console.log(user);
```

### 🏷️ Sign Up
```ts
const newUser = await authClient.signUp({ email: "new@example.com", password: "password123" });
console.log(newUser);
```

### 🚪 Sign Out
```ts
await authClient.signOut();
```

---

## 🏷️ User Management

### 👤 Fetch Current User
```ts
const user = authClient.getUser(); // From local storage
const user = authClient.whoAmI(); // From API
```

### 🔄 Refresh Token
```ts
await authClient.refreshToken();
```

---

## 🌍 External Authentication

### 🔗 Sign In with External Provider
```ts
authClient.signInExternal();
```

### 🔗 Sign Up with External Provider
```ts
const user = await authClient.signUpExternal({ provider: "google", token: "external-token" });
```

---

## 🔑 Password Management

### 📩 Forgot Password
```ts
await authClient.forgotPassword("youremail@example.com");
```

### 🔄 Reset Password
```ts
await authClient.resetPassword({
    email: "email@email.com",
    password: "newPassword",
    code: "123245556"
});
```

### 🔄 Change Password
```ts
await authClient.changePassword({
    password: "12345",
    newPassword: "newPass123"
});
```

---

## ✉️ Email Management

### 📧 Resend Email Confirmation
```ts
await authClient.resendEmailConfirmation({
    email: "email@email.com",
});
```

### ✅ Confirm Email
```ts
await authClient.confirmEmail({
    code: "some-code",
    userId: "some-userid"
});
```

---

## ⚙️ Configuration Options

| 🛠 Option           | 🔠 Type          | 🏷 Default     | 📌 Description                 |
|--------------------|----------------|--------------|------------------------------|
| `apiBaseUrl`       | `string`        | `undefined`  | Base API URL                 |
| `authApiPrefix`    | `string`        | `"/auth"`    | Authentication API prefix     |
| `accountApiPrefix` | `string`        | `"/account"` | Account management API prefix |
| `useUserStore`     | `boolean`       | `true`       | Enable user storage           |
| `useTokenStore`    | `boolean`       | `true`       | Enable token storage          |
| `axiosInstance`    | `AxiosInstance` | `undefined`  | Axios instance to use         |

---

## 🛠 Custom Configurations

YAuth allows you to define schemas for authentication methods, giving you flexibility in handling authentication-related parameters and responses. You can customize request and response types and merge multiple configurations as needed.  

---

### 🛠 Example: Custom Parameters and Results  

You can extend the default request and response structures to include custom fields that suit your authentication requirements.  

```ts
// Extending the sign-in request to include a username field  
interface CustomSignIn extends SignInRequest {
    username: string;
}

// Extending the sign-in response to include a custom property  
interface CustomSignInResult extends AuthResponse {
    gwapo: boolean;
}

// Defining a schema that specifies the custom parameters and result  
const signInConfig = defineSchema({
    signIn: {
        params: {} as CustomSignIn,  // Custom request structure  
        result: {} as CustomSignInResult, // Custom response structure  
    },
});

// Creating an instance of YAuth with the custom sign-in schema  
const auth = new YAuth(options, signInConfig);
```

🔹 **Why use this?**  
This customization allows you to tailor the authentication process to your specific needs, ensuring that additional parameters (e.g., `username`) are included when signing in.  

---

### 🛠 Example: Merging Custom Configurations  

You can combine multiple schema configurations into a single configuration object, making your authentication client more flexible.  

```ts
// Extending the sign-in request and response  
interface CustomSignIn extends SignInRequest {
    username: string;
}

interface CustomSignInResult extends AuthResponse {
    gwapo: boolean;
}

// Defining a custom schema for sign-in  
const signInConfig = defineSchema({
    signIn: {
        params: {} as CustomSignIn,
        result: {} as CustomSignInResult,
    },
});

// Defining a custom schema for sign-out  
const signOutConfig = defineSchema({
    signOut: {
        params: {} as any,
        result: {} as any,
    },
});

// Merging both configurations into one  
const mergedConfig = defineSchema({
    ...signInConfig,
    ...signOutConfig
});

// Creating an instance of YAuth with the merged configuration  
const auth = new YAuth(options, mergedConfig);
```

🔹 **Why use this?**  
Merging configurations allows you to maintain modularity in your code, making it easier to add or remove features without modifying the core YAuth structure.  

---

### 🔄 Overriding Endpoints  

If your API uses different endpoints for authentication, you can override the default YAuth endpoints.  

```ts
const endpoints: YAuthEndpointConfiguration = {
    signInEndpoint: "/login",  // Custom sign-in endpoint  
    signUpEndpoint: "/register" // Custom sign-up endpoint  
};

const auth = new YAuth({
    ...options, 
    authApiPrefix: "/auth2",  // Changing the authentication prefix  
    endpointConfig: { ...endpoints } // Applying custom endpoint configurations  
});
```

🔹 **Why use this?**  
Some backend systems may use different endpoint structures. Overriding these allows YAuth to seamlessly integrate with any API without modifying its core logic.  

---

### 🗄️ Overriding Storage Mechanism  

By default, YAuth stores authentication tokens and user information in **local storage**. However, you can disable this and handle storage manually.  

```ts
const auth = new YAuth({
    ...options,
    useUserStore: false,  // Prevent storing user info  
    useTokenStore: false  // Prevent storing JWT tokens  
});
```

🔹 **Why use this?**  
This is useful when using **cookies** for authentication instead of local storage or when implementing a **custom state management solution**.  


---

## 🛠 Utilities & Types

### 📌 Extracting Types  

You can extract the return type of a specific authentication method using `ExtractYAuthResult`. This is useful when you need to reuse the inferred type elsewhere in your application.  

```ts
const auth = new YAuth(options);

// Extracting the result type of the sign-in method  
type User = ExtractYAuthResult<typeof auth, "signIn">;
```

🔹 **Why use this?**  
- It ensures **type safety**, as the extracted type is directly derived from the YAuth instance.  
- Reduces manual type definitions, making your code more **maintainable**.  
- Useful for defining variables, function parameters, or state objects based on authentication responses.  

---


### 📌 Paramater and Result Types
```ts
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
```

### Usage in a react project
see example folder in the git repository 🔗

---

## 📝 License

📜 This project is licensed under the **MIT License**.
