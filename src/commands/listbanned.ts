import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// These are your global defaults
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listbanned')
    .setDescription('Lists all banned words (global + server-specific)'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guild?.id;
    const user = interaction.user;

    const member = await interaction.guild?.members.fetch(user.id);
    if (!member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ You need Manage Messages permission to use this command.',
        ephemeral: true,
      });
    }

    if (!guildId) {
      return interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true,
      });
    }

    // Get server-specific banned words from Supabase
    const { data: serverWordsData, error } = await supabase
      .from('banned_words')
      .select('word')
      .eq('guild_id', guildId);

    if (error) {
      console.error('[Supabase error]', error.message);
      return interaction.reply({
        content: '💥 Failed to fetch server banned words.',
        ephemeral: true,
      });
    }

    const serverWords = serverWordsData.map(row => row.word);
    const globalList = defaultWords.map(w => `🌐 ${w}`).join('\n');
    const serverList = serverWords.length
      ? serverWords.map(w => `🛡️ ${w}`).join('\n')
      : '— *(no custom banned words)*';

    const output = `🧼 **Banned Words List for this Server**:\n\n${globalList}\n\n${serverList}`;

    return interaction.reply({
      content: output,
      ephemeral: true,
    });
  },
};
