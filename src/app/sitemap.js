export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";

export default async function sitemap() {
    const baseUrl = "https://litelelo.in";

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabase = null;
    if (url && anon) {
        supabase = createClient(url, anon);
    }

    // Fetch dynamic routes safely
    const posts = supabase
        ? (await supabase.from("posts").select("id")).data
        : [];

    const blogs = supabase
        ? (await supabase.from("blogs").select("id")).data
        : [];

    const lost = supabase
        ? (await supabase.from("lost_items").select("id")).data
        : [];

    const profiles = supabase
        ? (await supabase.from("profiles").select("username")).data
        : [];

    // Static routes
    const staticRoutes = [
        "",
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
        lastModified: new Date().toISOString(),
    }));

    // Dynamic routes
    const blogRoutes = blogs?.map((b) => ({
        url: `${baseUrl}/blog/${b.id}`,
        lastModified: new Date().toISOString(),
    })) ?? [];

    const postRoutes = posts?.map((p) => ({
        url: `${baseUrl}/post/${p.id}`,
        lastModified: new Date().toISOString(),
    })) ?? [];

    const lostRoutes = lost?.map((l) => ({
        url: `${baseUrl}/campus/lost-and-found/${l.id}`,
        lastModified: new Date().toISOString(),
    })) ?? [];

    const profileRoutes = profiles?.map((u) => ({
        url: `${baseUrl}/profile/${u.username}`,
        lastModified: new Date().toISOString(),
    })) ?? [];

    return [
        ...staticRoutes,
        ...blogRoutes,
        ...postRoutes,
        ...lostRoutes,
        ...profileRoutes,
    ];
}
