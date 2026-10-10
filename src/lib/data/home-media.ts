/**
 * Photos and captions for the home page that the owner manages in
 * Admin → Website photos. Defaults are the launch photos (credited Unsplash
 * images); saved values replace a whole group.
 */
export type MediaImage = { url: string; alt: string; credit: string };
export type ExperienceItem = MediaImage & { category: string; name: string; line: string };
export type GalleryEntry = MediaImage & { place: string; line: string; href: string };
export type HomeMedia = {
  hero_slides: MediaImage[];
  experiences: ExperienceItem[];
  gallery: GalleryEntry[];
  band: MediaImage;
  transport: MediaImage;
};

export const HOME_MEDIA_LIMITS = { hero_slides: 5, experiences: 6, gallery: 12 } as const;

export const DEFAULT_HOME_MEDIA: HomeMedia = {
  hero_slides: [
    { url: "https://images.unsplash.com/photo-1612862862126-865765df2ded", alt: "Aerial view of the Sigiriya rock fortress rising above dense green forest", credit: "Photo: Dylan Shaw / Unsplash" },
    { url: "https://images.unsplash.com/photo-1708338914870-797de586672d", alt: "A lush green hillside covered in trees in the Nuwara Eliya region", credit: "Photo: Juho S / Unsplash" },
    { url: "https://images.unsplash.com/photo-1580910527739-556eb89f9d65", alt: "Palm trees along the beach shore at Mirissa", credit: "Photo: Dinuka Lankaloka / Unsplash" },
  ],
  experiences: [
    { category: "cultural", name: "Culture & heritage", line: "Rock fortresses, cave temples and the sacred city of Kandy.", url: "https://images.unsplash.com/photo-1580794749460-76f97b7180d8", alt: "A path leading toward the Sigiriya rock fortress", credit: "" },
    { category: "wildlife", name: "Wildlife", line: "Leopards in Yala, elephant gatherings at Minneriya.", url: "https://images.unsplash.com/photo-1705936981588-a4192f66fcfb", alt: "Two elephants standing in water", credit: "" },
    { category: "beach", name: "Beaches", line: "South-coast bays in winter, the east coast in summer.", url: "https://images.unsplash.com/photo-1734279135140-05229fcde3a5", alt: "Aerial view of a tropical beach and ocean on Sri Lanka's south coast", credit: "" },
    { category: "hill-country", name: "Hill country", line: "Tea estates, cool mornings and the famous train ride.", url: "https://images.unsplash.com/photo-1578517929034-db013fd86597", alt: "Green tea fields with mountains beyond", credit: "" },
    { category: "adventure", name: "Adventure", line: "Sunrise hikes, surf breaks and whitewater.", url: "https://images.unsplash.com/photo-1453210110568-1384e93a200e", alt: "A surfer carrying a board along the sea", credit: "" },
  ],
  gallery: [
    { place: "Sigiriya", line: "The 5th-century Lion Rock fortress, rising out of the forest.", url: "https://images.unsplash.com/photo-1612862862126-865765df2ded", alt: "Aerial view of the Sigiriya rock fortress rising above dense green forest", credit: "Photo: Dylan Shaw / Unsplash", href: "/destinations/sigiriya" },
    { place: "Ella", line: "The hill-country railway, crossing bridges through the forest.", url: "https://images.unsplash.com/photo-1578519050142-afb511e518de", alt: "A train crossing a bridge through the forest near Ella", credit: "Photo: Anton Lecock / Unsplash", href: "/destinations/ella" },
    { place: "Kandy", line: "Home of the Temple of the Sacred Tooth Relic.", url: "https://images.unsplash.com/photo-1665849050332-8d5d7e59afb6", alt: "A white building with a gold roof beside the Temple of the Tooth in Kandy", credit: "Photo: Chathura Anuradha Subasinghe / Unsplash", href: "/destinations/kandy" },
    { place: "Yala", line: "Leopards, elephants and sloth bears in the dry south-east.", url: "https://images.unsplash.com/photo-1621847473222-d85c022cbf07", alt: "A leopard standing in water in Yala National Park", credit: "Photo: Udara Karunarathna / Unsplash", href: "/destinations/yala" },
    { place: "Nuwara Eliya", line: "Cool air and endless tea estates in the central highlands.", url: "https://images.unsplash.com/photo-1708338914870-797de586672d", alt: "A lush green hillside covered in trees in the Nuwara Eliya region", credit: "Photo: Juho S / Unsplash", href: "/destinations/nuwara-eliya" },
    { place: "Galle", line: "Ramparts, lanes and the lighthouse of the old Dutch fort.", url: "https://images.unsplash.com/photo-1568843240915-b512cc9b4415", alt: "The white lighthouse at Galle Fort", credit: "Photo: Shainee Fernando / Unsplash", href: "/destinations/galle" },
    { place: "Dambulla", line: "Cave temples filled with ancient Buddhist murals and statues.", url: "https://images.unsplash.com/photo-1656497107500-a2bc32cbe7d4", alt: "A large statue in front of the temple building at Dambulla", credit: "Photo: Secret Travel Guide / Unsplash", href: "/destinations/dambulla" },
    { place: "Mirissa", line: "Palm-fringed bays and whale watching in season.", url: "https://images.unsplash.com/photo-1580910527739-556eb89f9d65", alt: "Palm trees along the beach shore at Mirissa", credit: "Photo: Dinuka Lankaloka / Unsplash", href: "/destinations/mirissa" },
    { place: "Arugam Bay", line: "The east coast's surf town, at its best from May to September.", url: "https://images.unsplash.com/photo-1552055568-f8c4fb8c6320", alt: "Aerial view of fishing boats on the shore at Arugam Bay", credit: "Photo: Tomáš Malík / Unsplash", href: "/destinations/arugam-bay" },
  ],
  band: { url: "https://images.unsplash.com/photo-1519566335946-e6f65f0f4fdf", alt: "Stilt fishermen on wooden poles in the shallow coastal waters of Sri Lanka", credit: "Photo: Daniel Klein / Unsplash" },
  transport: { url: "https://images.unsplash.com/photo-1704797390325-b057758d8c3d", alt: "A tuk tuk parked in front of the lighthouse at Galle", credit: "" },
};
