// import http from "./http";
// import { ApiResponse } from "../types/auth.types";

// export type UserFinancialProfileResponse = {
//   userId: string;
//   role: string;
//   livingStatus: string;
//   incomeLevel: string;
//   transportMode: string;
//   spendingStyle: string;
//   workStyle: string;
//   familyStatus: string;
//   studyIntensity: string;
//   healthNeed: string;
//   createdAt?: string;
//   updatedAt?: string;
// };

// export const UserFinancialProfileAPI = {
//   async getMe(): Promise<ApiResponse<UserFinancialProfileResponse>> {
//     try {
//       const fullUrl = `${http.defaults.baseURL}/api/v1/user-financial-profile`;

//       console.log("🔵 [UserFinancialProfileAPI] GET Request:");
//       console.log("   URL:", fullUrl);

//       const res = await http.get("/api/v1/user-financial-profile");

//       console.log("🟢 [UserFinancialProfileAPI] Response Success:", res.data);

//       return res.data;
//     } catch (error: any) {
//       const errorMsg = error?.message || "Unknown error";
//       const status = error?.response?.status || "No status";
//       const responseData = error?.response?.data;

//       console.error("🔴 [UserFinancialProfileAPI] Error Details:");
//       console.error("   Message:", errorMsg);
//       console.error("   Status:", status);
//       console.error("   Response Data:", responseData);
//       console.error("   Full Error:", error);

//       return (
//         error?.response?.data || {
//           success: false,
//           message: errorMsg,
//         }
//       );
//     }
//   },
// };