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
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ You need Manage Messages permission to view warnings.',
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

    const { data, error } = await supabase
      .from('warnings')
      .select()
      .eq('guild_id', guildId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Supabase error]', error.message);
      return interaction.reply({
        content: '💥 Failed to fetch warnings.',
        ephemeral: true,
      });
    }

    if (!data || data.length === 0) {
      return interaction.reply({
        content: `✅ ${user.tag} has no warnings.`,
        ephemeral: true,
      });
    }

    const summary = data
      .map((warn, i) => `**${i + 1}.** ${warn.reason} *(by ${warn.warned_by})* — ${new Date(warn.timestamp).toLocaleDateString()}`)
      .join('\n');

    return interaction.reply({
      content: `📄 Warnings for ${user.tag}:\n\n${summary}`,
      ephemeral: true,
    });
  },
};
