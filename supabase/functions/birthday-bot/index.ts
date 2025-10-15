// supabase/functions/birthday-bot/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Set the timezone for your college campus
const TIMEZONE = 'Asia/Kolkata'; 

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get today's month and day in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(new Date());
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10);
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);

    if (!month || !day) {
      throw new Error('Could not determine current month and day in the specified timezone.');
    }
    
    console.log(`Checking for birthdays on: Month ${month}, Day ${day}`);

    // 2. Call the custom SQL function to get birthday users
    const { data: birthdayUsers, error: usersError } = await supabaseAdmin
      .rpc('get_birthday_users', {
        p_month: month,
        p_day: day
      });
    
    if (usersError) throw usersError;

    if (!birthdayUsers || birthdayUsers.length === 0) {
      console.log('No birthdays today. Exiting.');
      return new Response(JSON.stringify({ message: 'No birthdays today.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    console.log(`Found ${birthdayUsers.length} birthday(s).`);

    // 3. Construct the birthday post content
    const names = birthdayUsers.map(u => u.full_name);
    let postContent = `🎉 Let's wish a very Happy Birthday to:\n\n`;

    if (names.length === 1) {
        postContent = `🎉 Let's wish a very Happy Birthday to ${names[0]}! Hope you have a great day!`;
    } else if (names.length === 2) {
        postContent += `${names[0]} and ${names[1]}`;
    } else {
        postContent += names.slice(0, -1).join(', ') + `, and ${names[names.length - 1]}`;
    }

    postContent += "\n\nHope you all have a fantastic day! 🎂";

    // 4. Get the Bot's user_id
    const { data: botProfile, error: botError } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('username', 'birthday_bot')
      .single();

    if (botError || !botProfile) throw new Error("Birthday bot profile not found.");

    // 5. Create the post as the bot
    const { error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: botProfile.user_id,
        //is_public: true, // Make it a public post for everyone to see
      });

    if (postError) throw postError;
    
    console.log('Successfully posted birthday announcement.');

    return new Response(JSON.stringify({ message: `Successfully posted for ${names.length} user(s).` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});