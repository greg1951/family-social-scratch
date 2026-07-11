import { FamilyFeatureKey } from "@/features/family/services/family-feature-flags";

type MainRoomDefinition = {
  featureKey: FamilyFeatureKey;
  href: string;
  roomTitle: string;
  src: string;
};

export const RoomDefinitions: Record<FamilyFeatureKey, MainRoomDefinition> = {
  tv: {
    featureKey: "tv",
    href: "/tv",
    roomTitle: "TV Room",
    src: "/images/main/room-tv-tablet.png",
  },
  movies: {
    featureKey: "movies",
    href: "/movies",
    roomTitle: "Movie Theater",
    src: "/images/main/room-movies-tablet.jpg",
  },
  books: {
    featureKey: "books",
    href: "/books",
    roomTitle: "Library",
    src: "/images/main/library-tablet.jpg",
  },
  music: {
    featureKey: "music",
    href: "/music",
    roomTitle: "Music Salon",
    src: "/images/main/room-music-tablet.jpg",
  },
  games: {
    featureKey: "games",
    href: "/games",
    roomTitle: "Game Room",
    src: "/images/main/room-games-tablet.jpg",
  },
  poetry: {
    featureKey: "poetry",
    href: "/poetry",
    roomTitle: "Poetry Nook",
    src: "/images/main/room-poetry-tablet.jpg",
  },
  foodies: {
    featureKey: "foodies",
    href: "/foodies",
    roomTitle: "The Kitchen",
    src: "/images/main/room-kitchen-tablet.jpg",
  },
  gallery: {
    featureKey: "gallery",
    href: "/family-gallery",
    roomTitle: "Picture Hallway",
    src: "/images/main/room-pictures-tablet.jpg",
  },
  threads: {
    featureKey: "threads",
    href: "/threads",
    roomTitle: "Living Room",
    src: "/images/main/room-mailbox-tablet.jpg",
  },
};

export const PhoneRoomOrder: FamilyFeatureKey[] = [
  "tv",
  "movies",
  "books",
  "music",
  "games",
  "poetry",
  "foodies",
  "gallery",
  "threads",
];

export const TabletRoomOrder: FamilyFeatureKey[] = [
  "tv",
  "movies",
  "books",
  "music",
  "games",
  "poetry",
  "gallery",
  "foodies",
  "threads",
];
