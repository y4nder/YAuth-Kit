import { createAxiosInstance } from "../../../../../dist";
import { YAuth } from '../../../../yauth-core';
import { defineAuthConfig } from "../../../../yauth-utils";
import { loginSchema } from "./login";
import { registerSchema } from "./register";

const apiBaseUrl = import.meta.env.VITE_API_URL;

const authConfig = defineAuthConfig({
    ...registerSchema,
    ...loginSchema
})

export const axiosInstance = createAxiosInstance(apiBaseUrl);

export const yauthInstance = new YAuth({ 
    apiBaseUrl, 
    axiosInstance,
    yAuthConfig: {
        signInEndpoint: "/login",
    }
},authConfig);

export default yauthInstance;

