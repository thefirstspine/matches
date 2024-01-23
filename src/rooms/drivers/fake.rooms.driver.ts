import axios from "axios";
import { IRoomsDriver, IRoomsDriverResponse } from "../rooms.service";

export class NetworkRoomsDriver implements IRoomsDriver {

  private nextResponseData: any;
  private nextResponseError: boolean;

  setNextResponse(data: any, error: boolean) {
    this.nextResponseData = data;
    this.nextResponseError = error;
  }

  async sendRequest<T>(endpoint: string, data: any, method: "get" | "post" | "delete"): Promise<IRoomsDriverResponse<T>> {
      return {
        data: this.nextResponseData as T,
        error: this.nextResponseError,
      };
  }

}
