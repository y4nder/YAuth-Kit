import { InternalAxiosRequestConfig } from "axios";
import { BaseAuthClientConfig, YAuthStorage } from "./types";

export function defineSchema<T extends Partial<BaseAuthClientConfig>>(config: T) {
    return config;
}

export const authRequestInterceptorFactory = (storage: YAuthStorage) => (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers.Accept = 'application/json';
    return config;
};
