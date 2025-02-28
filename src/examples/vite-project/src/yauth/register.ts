import { AuthResponse } from "../../../../../dist";
import { SignUpRequest } from "../../../../types";
import { defineAuthConfig } from "../../../../yauth-utils";



export interface CustomSignUp extends SignUpRequest {
    username: string;
}

export interface CustomSignUpResult extends AuthResponse {
    gwapo: boolean;
}

export const registerSchema = defineAuthConfig({
    signUp: {
        params: {} as CustomSignUp,
        result: {} as CustomSignUpResult
    }
})


