import QRCode from "qrcode";

export async function genererQrSvg(texte: string): Promise<string> {
  return QRCode.toString(texte, {
    type: "svg",
    margin: 1,
    color: { dark: "#16232A", light: "#FFFFFFFF" },
  });
}

export function qrSvgVersDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
