import { AuthResponse, createAxiosInstance } from "../../../../../dist";
import { SignUpRequest } from "../../../../types";
import { YAuth } from '../../../../yauth-core';
import { defineAuthConfig } from "../../../../yauth-utils";

export const axiosInstance = createAxiosInstance(import.meta.env.VITE_API_URL || "https://example.com");

const config = defineAuthConfig({
    signUp: {
        params: {} as CustomSignUp,
        result: {} as AuthResponse,
    }
})

//todo merge configurations
// const endpointConfig: YAuthEndpointConfiguration = {
//     signInEndpoint: "",
//     signUpEndpoint: "",
//     signOutEndpoint: "",
//     refreshTokenEndpoint: "",
//     forgotPasswordEndpoint: "",
//     resetPasswordEndpoint: "",
//     changePasswordEndpoint: "",
//     resendEmailConfirmationEndpoint: "",
//     confirmEmailEndpoint: ""
// }

export const yauth = new YAuth({
    apiBaseUrl: import.meta.env.VITE_API_URL || "https://example.com",
    axiosInstance: axiosInstance,
},config);


export interface CustomSignUp extends SignUpRequest {
    username: string;
}



export default yauth;