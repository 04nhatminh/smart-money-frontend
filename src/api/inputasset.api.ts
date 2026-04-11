import http from "./http";

export const InputAssetAPI = {
  async send(data: {
    type: "IMAGE" | "VOICE";
    value: string;
  }) {
    try {
      const res = await http.post("/api/v1/input-assets", data);
      console.log("🟢 [InputAssetAPI] Response Success:", res.data);
      return res.data;
    } catch (error: any) {
      console.error("🔴 [InputAssetAPI] Error:", error?.response?.data || error);
      return (
        error?.response?.data || {
          success: false,
          message: error?.message || "Unknown error",
        }
      );
    }
  },
};