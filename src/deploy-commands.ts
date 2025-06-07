import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

// Replace these with your actual values
const CLIENT_ID = '1380943914923724861';
const GUILD_ID = '1377705200693022781';

(async () => {
  try {
    console.log('🛠 Registering slash command...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash command registered!');
  } catch (error) {
    console.error('Error registering command:', error);
  }
})();
