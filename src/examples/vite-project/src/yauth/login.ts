import { AuthResponse, SignInRequest } from "../../../../../dist";
import { defineAuthConfig } from "../../../../yauth-utils";

export interface CustomSignIn extends SignInRequest{
    idNo: number;
}

export interface CustomSignInResult extends AuthResponse{
    idNo?: number;
}

export const loginSchema = defineAuthConfig({
    signIn: {
        params: {} as CustomSignIn,
        result: {} as CustomSignInResult
    }
})