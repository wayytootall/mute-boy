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
    .setName('unbanword')
    .setDescription('Remove a banned word from this server')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('The word to remove')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const word = interaction.options.getString('word', true).toLowerCase();
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

    const { error, count } = await supabase
      .from('banned_words')
      .delete()
      .match({ guild_id: guildId, word });

    if (error) {
      console.error('[Supabase error]', error.message);
      return interaction.reply({
        content: '💥 Failed to remove the word.',
        ephemeral: true,
      });
    }

    if (count === 0) {
      return interaction.reply({
        content: `⚠️ '${word}' was not found on the banned list.`,
        ephemeral: true,
      });
    }

    return interaction.reply(`🗑️ Removed **‘${word}’** from the banned words list.`);
  },
};
