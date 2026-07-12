import axios from "axios";
import { API_URL } from "../config";

// Hits an /export/* endpoint with the auth token, then triggers a browser
// download of the returned CSV. Needs a manual blob+link approach (rather
// than a plain <a href>) because the endpoint requires an Authorization
// header, which a normal link navigation can't send.
export async function downloadCsv(path, filename) {
  const res = await axios.get(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}