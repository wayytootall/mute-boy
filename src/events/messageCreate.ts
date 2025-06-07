import { Message } from 'discord.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// List of banned words (can expand later)
const bannedWords = ['badword', 'stupid', 'dumb', 'heck'];

// Fun personality responses
const personalityResponses = [
  "🚨 Whoa there, buddy. That's not how we talk here.",
  "🧼 Language! This is a family-friendly Game Boy.",
  "🤖 Message rejected. Try again without the potty mouth.",
  "🔇 That’s a no-no word. You’ve been warned by MuteBoy.",
];

module.exports = {
  name: 'messageCreate',
  async execute(message: Message) {
    // Skip bot messages and empty messages
    if (message.author.bot || !message.content) return;

    console.log(`[Debug] Message received: ${message.content}`);

    const msg = message.content.toLowerCase();
    const hit = bannedWords.find(word => msg.includes(word));

    if (hit) console.log(`[Debug] Hit word: ${hit}`);
    if (!hit) return;

    const response = personalityResponses[Math.floor(Math.random() * personalityResponses.length)];

    try {
      await message.reply(response);

      console.log(`[Supabase] Logging moderation hit for ${message.author.tag}`);

      const { error } = await supabase.from('moderation_logs').insert({
        user_id: message.author.id,
        username: message.author.tag,
        message: message.content,
        word_hit: hit,
        channel_id: message.channel.id,
        guild_id: message.guild?.id ?? 'unknown',
      });

      if (error) {
        console.error('[❌ Supabase insert error]', error.message);
      } else {
        console.log('[✅ Supabase] Log inserted successfully');
      }
    } catch (error) {
      console.error(`💥 Error handling flagged message:`, error);
    }
  },
};
