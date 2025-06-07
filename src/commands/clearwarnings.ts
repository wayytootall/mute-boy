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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to clear warnings for')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ You need Manage Messages permission to use this.',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('user', true);
    const guildId = interaction.guild?.id;

    if (!guildId) {
      return interaction.reply({
        content: '⚠️ This command can only be used in a server.',
        ephemeral: true,
      });
    }

    const { error } = await supabase
      .from('warnings')
      .delete()
      .eq('guild_id', guildId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Supabase error]', error.message);
      return interaction.reply({
        content: '💥 Failed to clear warnings.',
        ephemeral: true,
      });
    }

    return interaction.reply(`🧹 Cleared all warnings for ${user.tag}.`);
  },
};
