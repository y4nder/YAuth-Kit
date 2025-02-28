import { createAxiosInstance } from "../../../../../dist";
import { YAuthClientOptions } from "../../../../types";
import { YAuth } from '../../../../yauth-core';
import { defineSchema } from "../../../../yauth-utils";
import { loginSchema } from "./login";
import { registerSchema } from "./register";

const apiBaseUrl = import.meta.env.VITE_API_URL;
export const axiosInstance = createAxiosInstance(apiBaseUrl);

const schemas = defineSchema({    
    ...registerSchema,
    ...loginSchema
})

const options : YAuthClientOptions = { 
    apiBaseUrl, 
    axiosInstance,
    endpointConfig: {
        signInEndpoint: "/login",
    }
}

const yauthInstance = new YAuth(options, schemas);


export default yauthInstance;



