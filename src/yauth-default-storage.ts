import { YAuthStorage } from "./types";

const storagePrefix = 'yauth_';

export const yAuthDefaultStorage: YAuthStorage = {
    getToken: () => {
        return JSON.parse(window.localStorage.getItem(`${storagePrefix}token`) as string);
    },
    setToken: (token: string) => {
        window.localStorage.setItem(`${storagePrefix}token`, JSON.stringify(token));
    },
    clearToken: () => {
        window.localStorage.removeItem(`${storagePrefix}token`);
    },
    setUser: function <T>(userData: T): void {
        window.localStorage.setItem(`${storagePrefix}user`, JSON.stringify(userData));
    },
    clearUser: function (): void {
        window.localStorage.removeItem(`${storagePrefix}user`);
    },
    getUser: function <T>(): T {
        return JSON.parse(window.localStorage.getItem(`${storagePrefix}user`) as string)
    }
};

