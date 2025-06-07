import { Interaction } from 'discord.js';
import { ExtendedClient } from '../types/ExtendedClient';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = (interaction.client as ExtendedClient).commands.get(interaction.commandName);
    if (!command) {
      console.error(`❌ No command found for ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`💥 Error executing ${interaction.commandName}:`, error);
      await interaction.reply({
        content: 'There was an error while executing this command.',
        ephemeral: true,
      });
    }
  },
};
