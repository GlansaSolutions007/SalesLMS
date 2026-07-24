import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn("VITE_API_URL is not set — API requests will fail. Copy .env.example to .env and set it.");
}

const httpClient = axios.create({ baseURL });

export default httpClient;
