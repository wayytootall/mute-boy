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
    .setName('warn')
    .setDescription('Warn a user for breaking rules')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (!member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: '❌ You need Manage Messages permission to issue warnings.',
        ephemeral: true,
      });
    }

    const warnedUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    const guildId = interaction.guild?.id;

    if (!guildId) {
      return interaction.reply({
        content: '⚠️ This command can only be used in a server.',
        ephemeral: true,
      });
    }

    const { error } = await supabase.from('warnings').insert({
      user_id: warnedUser.id,
      username: warnedUser.tag,
      guild_id: guildId,
      reason,
      warned_by: interaction.user.tag,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('[Supabase error]', error.message);
      return interaction.reply({
        content: '💥 Failed to issue the warning.',
        ephemeral: true,
      });
    }

    return interaction.reply(`⚠️ ${warnedUser.tag} has been warned: *${reason}*`);
  },
};
