import { z } from "zod";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.object({
    email: z.string().email("Invalid email address."),
    phone: z.string().regex(/^[\d\s\-\+\(\)]{10,}$/, "Please enter a valid phone number."),
    password: z
        .string()
        .regex(
            PASSWORD_REGEX,
            "Password must be at least 8 characters and include uppercase, lowercase, digit, and special character."
        )
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address."),
    password: z.string().min(1, "Password is required.")
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required.")
});
