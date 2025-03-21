import { createContext, useContext } from "react";
import yauthInstance from "../yauth";
import { ExtractYAuthResult } from "../../../../types";

export const useYAuth = () => {
    const context = useContext(YAuthContext);
    if (!context) {
        throw new Error("useYAuth must be used within a YAuthProvider");
    }
    return context;
};

export type User = ExtractYAuthResult<typeof yauthInstance, "signIn">;


export const YAuthContext = createContext<YAuthContextProps>({ 
    user: null 
} as YAuthContextProps);

export interface YAuthContextProps {
    user: User | null;
    yauth: typeof yauthInstance;
}