import { Message } from 'discord.js';

module.exports = {
  name: 'messageCreate',
  async execute(message: Message) {
    if (message.author.bot) return;
    console.log(`[${message.author.tag}]: ${message.content}`);
  },
};
