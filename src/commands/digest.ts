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

interface DigestEntry {
  username: string;
  word_hit: string;
  message: string;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('digest')
    .setDescription('Get a summary of flagged messages from the last hour'),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ You need Manage Messages permission to use this.',
        ephemeral: true,
      });
    }

    const guildId = interaction.guild?.id;
    if (!guildId) {
      return interaction.reply({
        content: '⚠️ This command must be used in a server.',
        ephemeral: true,
      });
    }

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // last hour
    console.log('[Debug] Digest cutoff timestamp:', since);

    const { data, error } = await supabase.rpc('get_digest_logs', {
      input_guild_id: guildId,
      input_since: since,
    });

    if (error) {
      console.error('[Supabase error]', error.message);
      return interaction.reply({
        content: '💥 Failed to fetch digest.',
        ephemeral: true,
      });
    }
    console.log('[Debug] Digest raw response:', data);

    if (!Array.isArray(data) || data.length === 0) {
      console.log('[Debug] Digest returned 0 results (or malformed)');
      return interaction.reply({
        content: '✅ No flagged messages in the last hour!',
        ephemeral: true,
      });
    }


    console.log(`[Debug] Digest returned ${data.length} result(s)`);

    const digest = (data as DigestEntry[])
      .map((entry, i) =>
        `**${i + 1}.** \`${entry.username}\` flagged for **"${entry.word_hit}"**:\n> ${entry.message}`
      )
      .join('\n\n');

    return interaction.reply({
      content: `🧾 **Flagged Messages (last hour):**\n\n${digest}`,
      ephemeral: true,
    });
  },
};
