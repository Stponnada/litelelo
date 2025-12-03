import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: posts } = await supabase.from("posts").select("id");
    const { data: blogs } = await supabase.from("blogs").select("id");
    const { data: lost } = await supabase.from("lost_items").select("id");
    const { data: profiles } = await supabase
        .from("profiles")
        .select("username");

    return Response.json({
        posts: posts ?? [],
        blogs: blogs ?? [],
        lost: lost ?? [],
        profiles: profiles ?? [],
    });
}
