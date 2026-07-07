import { http } from "./http";
import { tokenStorage } from "../storage/tokenStorage";

class AssistantAPI {

  async analyze() {

    const response = await http.post(
      "/api/v1/assistant/analyze",
    );

    return response.data;
  }
}

export default new AssistantAPI();