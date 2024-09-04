import axios from "axios";
import { IRoomsDriver, IRoomsDriverResponse } from "../rooms.service";

export class NetworkRoomsDriver implements IRoomsDriver {

  async sendRequest<T>(endpoint: string, data: any, method: "get" | "post" | "delete"): Promise<IRoomsDriverResponse<T>> {
    const url: string = `${process.env.ROOMS_URL}/api/${endpoint}`;
    try {
      const response = await axios.post(
        url,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Cert': Buffer.from(process.env.ROOMS_PUBLIC_KEY.replace(/\\n/gm, '\n')).toString('base64'),
          },
        });
      const jsonResponse: any = response.data;
      if (response.status >= 400) {
        return {
          data: jsonResponse as T,
          error: true,
        };
      }
      return {
        data: jsonResponse as T,
        error: false,
      };
    } catch (error) {
      return {
        data: error?.response?.data as T,
        error: true,
      };
    }
  }

}