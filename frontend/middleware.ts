import { NextRequest, NextResponse } from "next/server";

const PROTECTED_CUSTOMER = ["/dashboard", "/customer"];
const PROTECTED_ADMIN = ["/admin"];
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const accessToken = request.cookies.get("gc_access_token")?.value;
    const userRole = request.cookies.get("gc_user_role")?.value;
    const isAuthenticated = Boolean(accessToken);

    // Redirect authenticated users away from auth routes
    if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
        const dest = userRole === "admin" ? "/admin/dashboard" : "/customer/dashboard";
        return NextResponse.redirect(new URL(dest, request.url));
    }

    // Protect customer routes
    if (PROTECTED_CUSTOMER.some((r) => pathname.startsWith(r)) && !isAuthenticated) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Protect admin routes
    if (PROTECTED_ADMIN.some((r) => pathname.startsWith(r))) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        if (userRole !== "admin") {
            return NextResponse.redirect(new URL("/customer/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*", "/customer/:path*", "/login", "/register"]
};
