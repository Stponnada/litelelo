import { createClient } from "@supabase/supabase-js";

export default async function sitemap() {
    const baseUrl = "https://litelelo.in";

    // --- 1. SETUP SUPABASE CLIENT ---
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // service key needed for listing all rows
    );

    // --- 2. FETCH DYNAMIC ROUTES ---
    const { data: posts } = await supabase.from("posts").select("id");
    const { data: blogs } = await supabase.from("blogs").select("id");
    const { data: lost } = await supabase.from("lost_items").select("id");
    const { data: profiles } = await supabase.from("profiles").select("username");

    // --- 3. BUILD STATIC ROUTES ---
    const staticRoutes = [
        "", // homepage
        "blog",
        "campus/bits-coin",
        "campus/events",
        "campus/lost-and-found",
        "campus/map",
        "campus/marketplace",
        "campus/noticeboard",
        "campus/reviews",
        "campus/rideshare",
        "campus/chat",
        "campus/communities",
        "directory",
        "easter-egg/blockchain",
        "help",
        "login",
        "no-internet",
        "password-reset",
        "privacy",
        "profile",
        "profile-setup",
        "reputation",
        "search",
        "settings",
        "terms",
    ].map((route) => ({
        url: `${baseUrl}/${route}`,
        lastModified: new Date(),
    }));

    // --- 4. DYNAMIC ROUTES ---
    const blogRoutes =
        blogs?.map((b) => ({
            url: `${baseUrl}/blog/${b.id}`,
            lastModified: new Date(),
        })) ?? [];

    const postRoutes =
        posts?.map((p) => ({
            url: `${baseUrl}/post/${p.id}`,
            lastModified: new Date(),
        })) ?? [];

    const lostRoutes =
        lost?.map((l) => ({
            url: `${baseUrl}/campus/lost-and-found/${l.id}`,
            lastModified: new Date(),
        })) ?? [];

    const profileRoutes =
        profiles?.map((u) => ({
            url: `${baseUrl}/profile/${u.username}`,
            lastModified: new Date(),
        })) ?? [];

    // --- 5. RETURN COMPLETE SITEMAP ---
    return [
        ...staticRoutes,
        ...blogRoutes,
        ...postRoutes,
        ...lostRoutes,
        ...profileRoutes,
    ];
}
