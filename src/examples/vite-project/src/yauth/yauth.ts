import { createAxiosInstance } from "../../../../../dist";
import { YAuth } from '../../../../yauth-core';
import { defineAuthConfig } from "../../../../yauth-utils";
import { registerSchema } from "./register";

const apiBaseUrl = import.meta.env.VITE_API_URL;

const authConfig = defineAuthConfig({
    ...registerSchema
})

export const axiosInstance = createAxiosInstance(apiBaseUrl);

export const yauth = new YAuth({ apiBaseUrl, axiosInstance,
    endpointConfig: {
        signInEndpoint: "/login",
    }
},authConfig);


export default yauth;