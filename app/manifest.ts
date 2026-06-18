import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "漁業関係法令コンシェルジュ",
    short_name: "漁業法令",
    description: "水産関係資料を根拠付きで検索する業務支援PWA",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f7fbfc",
    theme_color: "#087886",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
