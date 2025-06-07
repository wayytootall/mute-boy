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
    .setName('banword')
    .setDescription('Add a new word to this server’s banned word list')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('The word or phrase to ban')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const word = interaction.options.getString('word', true).toLowerCase();
    const guildId = interaction.guild?.id;
    const user = interaction.user;

    // Check user permissions
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

    // Check if word is already banned
    const { data: existing, error: checkError } = await supabase
      .from('banned_words')
      .select('id')
      .eq('guild_id', guildId)
      .eq('word', word)
      .maybeSingle();

    if (checkError) {
      console.error('[Supabase error]', checkError.message);
      return interaction.reply({
        content: '⚠️ Failed to check existing words. Try again later.',
        ephemeral: true,
      });
    }

    if (existing) {
      return interaction.reply({
        content: `⚠️ '${word}' is already on this server’s banned word list.`,
        ephemeral: true,
      });
    }

    // Insert new word
    const { error: insertError } = await supabase
      .from('banned_words')
      .insert([{ guild_id: guildId, word }]);

    if (insertError) {
      console.error('[Supabase error]', insertError.message);
      return interaction.reply({
        content: '💥 Something went wrong while saving that word.',
        ephemeral: true,
      });
    }

    return interaction.reply(`🧼 Added **‘${word}’** to this server’s banned word list.`);
  },
};
