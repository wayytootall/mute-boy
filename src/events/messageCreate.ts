import { Message } from 'discord.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Default banned words
const defaultWords = [
  'badword',
  'stupid',
  'dumb',
  'heck',
  'idiot',
  'loser',
  'trash',
  'cringe',
  'hate',
  'shut up',
  'kill yourself',
  'fuck',
  'shit',
];

const personalityResponses = [
  "🚨 Whoa there, buddy. That's not how we talk here.",
  "🧼 Language! This is a family-friendly Game Boy.",
  "🤖 Message rejected. Try again without the potty mouth.",
  "🔇 That’s a no-no word. You’ve been warned by MuteBoy.",
];

module.exports = {
  name: 'messageCreate',
  async execute(message: Message) {
    if (message.author.bot || !message.content) return;

    console.log(`[Debug] Message received: ${message.content}`);

    const guildId = message.guild?.id;
    const msg = message.content.toLowerCase();

    let customWords: string[] = [];

    // Fetch server-level custom banned words from Supabase
    if (guildId) {
      const { data, error } = await supabase
        .from('banned_words')
        .select('word')
        .eq('guild_id', guildId);

      if (error) {
        console.error('[❌ Supabase] Failed to load custom banned words:', error.message);
      } else if (data) {
        customWords = data.map(row => row.word.toLowerCase());
      }
    }

    // Combine default + custom words
    const allWords = [...new Set([...defaultWords, ...customWords])];
    const hit = allWords.find(word => msg.includes(word));
    if (!hit) return;

    console.log(`[Debug] Hit word: ${hit}`);

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
        guild_id: guildId ?? 'unknown',
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
