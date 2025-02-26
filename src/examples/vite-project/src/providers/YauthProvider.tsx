import React, { createContext, useMemo, useContext } from "react";
import {AuthResponse } from "../../../../../dist";

import yauth from "../yauth/yauth";

const YAuthContext = createContext<YAuthContextProps>({ 
    user: null 
} as YAuthContextProps);

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

// eslint-disable-next-line react-refresh/only-export-components
export const useYAuth = () => {
    return useContext(YAuthContext);
};

interface YAuthContextProps {
    user: AuthResponse | null;
    yauth: typeof yauth;
}