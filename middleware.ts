export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/w/:path*",
    "/settings/:path*",
    "/api/workspaces/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
  ],
};