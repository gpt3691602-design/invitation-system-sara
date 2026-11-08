import "server-only";
import QRCode from "qrcode";

// QR code as an SVG data URI. Rendered on the server; the browser gets a
// plain image, no client JavaScript.
export async function qrDataUri(text: string, dark = "#111111", light = "#ffffff"): Promise<string> {
  const svg = await QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark, light },
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
