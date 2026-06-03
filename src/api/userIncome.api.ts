import http from "./http";
import { ApiResponse } from "../types/auth.types";
import { UserIncomeResponse, CreateIncomePayload } from "../types/user.types";

export const UserIncomeApi = {
    async getMe(): Promise<ApiResponse<UserIncomeResponse>> {
        try {
            const fullUrl = `${http.defaults.baseURL}/api/v1/user-income/me`;

            console.log("🔵 [UserIncomeApi] GET Request:")
            console.log("   URL:", fullUrl);

            const res = await http.get("/api/v1/user-income/me");

            console.log("🟢 [UserIncomeApi] Response Success:", res.data);
            return res.data;
        } catch (error: any) {
            const errorMsg = error?.message || "Unknown error";

            const status = error?.response?.status || "No status";
            const responseData = error?.response?.data;

            console.error(
                "🔴 [UserIncomeAPI] Error Details:"
            );

            console.error("   Message:", errorMsg);
            console.error("   Status:", status);
            console.error(
                "   Response Data:",
                responseData
            );

            return error.response?.data || {
                success: false,
                message: error?.message || "Get income failed",
            };
        }
    },

    async create(
        data: CreateIncomePayload
    ): Promise<ApiResponse<UserIncomeResponse>> {
        try {
            const fullUrl = `${http.defaults.baseURL}/api/v1/user-income/me`;

            console.log("🔵 [UserIncomeApi] CREATE Request:");
            console.log("   URL:", fullUrl);
            console.log("   Payload:", JSON.stringify(data, null, 2));
        

        const res = await http.post("/api/v1/user-income/me", data);

        console.log("🟢 [UserIncomeApi] Response Success:", res.data);

        return res.data;
        } catch (error: any) {
            const errorMsg = error?.message || "Unknown error";
            const status = error?.response?.status || "No status";
            const responseData = error?.response?.data;

            console.error("🔴 [UserIncomeApi] Error Details:");
            console.error("   Message:", errorMsg);
            console.error("   Status:", status);
            console.error("   Response Data:", responseData);

            return error.response?.data || {
                success: false,
                message: error?.message || "Create income failed",
            };
        }
    },

    async update(
        data: Partial<CreateIncomePayload>
    ): Promise<ApiResponse<UserIncomeResponse>> {
        try {
            const fullUrl = `${http.defaults.baseURL}/api/v1/user-income/me`;

            console.log("🔵 [UserIncomeApi] PUT Request:");
            console.log("   URL:", fullUrl);
            console.log("   Payload:", JSON.stringify(data, null, 2));

            const res = await http.put("/api/v1/user-income/me", data);

            console.log("🟢 [UserIncomeApi] Response Success:", res.data);

            return res.data;
        } catch (error: any) {
            const errorMsg = error?.message || "Unknown error";
            const status = error?.response?.status || "No status";
            const responseData = error?.response?.data;

            console.error("🔴 [UserIncomeApi] Error Details:");
            console.error("   Message:", errorMsg);
            console.error("   Status:", status);
            console.error("   Response Data:", responseData);

            return error.response?.data || {
                success: false,
                message: error?.message || "Update income failed",
            };
        }
    },
};