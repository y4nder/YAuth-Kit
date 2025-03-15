import { YAuthEndpointConfiguration } from "./types";


export const defaultClientOptions : YAuthEndpointConfiguration = {
    signInEndpoint: '/signin',
    signUpEndpoint: '/signup',
    signOutEndpoint: '/signout',
    refreshTokenEndpoint: '/signin/refresh',
    forgotPasswordEndpoint: "/password/forgot",
    resetPasswordEndpoint: "/password/reset",
    changePasswordEndpoint: "/password/change",
    resendEmailConfirmationEndpoint: "/email/confirm/resend",
    confirmEmailEndpoint: "/email/confirm",
    accountInfoEndpoint: "/info",
}