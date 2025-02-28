import React, { useMemo } from "react";
import yauthInstance from "../yauth";
import { User, YAuthContext, YAuthContextProps } from "../contexts/useYauth";


export const YAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = React.useState< User | null>(yauthInstance.getUser());

    yauthInstance.initAxiosInterceptors(() => {
        setUser(null);
    });

    yauthInstance.onEvents({
        onSignIn: <T,>(user: T) => {
            setUser(user as User);
        },
        onSignOut: () => {
            setUser(null);
        },
    });

    const value = useMemo<YAuthContextProps>(
        () => ({
            user,
            yauth: yauthInstance,
        }),
        [user]
    );

    return <YAuthContext.Provider value={value}>{children}</YAuthContext.Provider>;
};

