import { AuthResponse } from "../../../../../dist";
import { SignUpRequest } from "../../../../types";
import { defineSchema } from "../../../../yauth-utils";


export interface CustomSignUp extends SignUpRequest {
    username: string;
}

export interface CustomSignUpResult extends AuthResponse {
    gwapo: boolean;
}

export const registerSchema = defineSchema({
    signUp: {
        params: {} as CustomSignUp,
        result: {} as CustomSignUpResult
    }
})


