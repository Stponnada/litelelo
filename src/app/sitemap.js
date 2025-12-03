export default async function sitemap() {
    const baseUrl = "https://litelelo.in";

    // Fetch dynamic route data at runtime
    const res = await fetch(`${baseUrl}/api/sitemap-data`, {
        // Always revalidate so sitemap stays fresh
        next: { revalidate: 60 },
    });

    const { posts, blogs, lost, profiles } = await res.json();

    // ---------- STATIC ROUTES ----------
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
        lastModified: new Date().toISOString(),
    }));

    // ---------- DYNAMIC ROUTES ----------
    const blogRoutes = blogs.map((b) => ({
        url: `${baseUrl}/blog/${b.id}`,
        lastModified: new Date().toISOString(),
    }));

    const postRoutes = posts.map((p) => ({
        url: `${baseUrl}/post/${p.id}`,
        lastModified: new Date().toISOString(),
    }));

    const lostRoutes = lost.map((l) => ({
        url: `${baseUrl}/campus/lost-and-found/${l.id}`,
        lastModified: new Date().toISOString(),
    }));

    const profileRoutes = profiles.map((u) => ({
        url: `${baseUrl}/profile/${u.username}`,
        lastModified: new Date().toISOString(),
    }));

    return [
        ...staticRoutes,
        ...blogRoutes,
        ...postRoutes,
        ...lostRoutes,
        ...profileRoutes,
    ];
}
