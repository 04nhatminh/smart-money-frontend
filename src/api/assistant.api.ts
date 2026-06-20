import { http } from "./http";
import { tokenStorage } from "../storage/tokenStorage";

class AssistantAPI {
  private async getHeaders() {
    const token = await tokenStorage.getAccessToken();

    if (!token) {
      throw new Error("No token found");
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async analyze() {
    const headers = await this.getHeaders();

    const response = await http.post(
      "/api/v1/assistant/analyze",
      { headers }
    );

    return response.data;
  }
}

export default new AssistantAPI();