import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Family Social",
    short_name: "My Family Social",
    description: "Social website for photos, TV shows, Recipes, Music, Movies, and more.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5fbff",
    theme_color: "#59cdf7",
    icons: [
      {
        src: "/images/family-social-logo-transparent.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}