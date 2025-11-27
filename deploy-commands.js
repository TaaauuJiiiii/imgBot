require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
    // /upload_image
    new SlashCommandBuilder()
        .setName('upload_image')
        .setDescription('Upload an image to the gallery channel')
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The image to upload')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('caption')
                .setDescription('Optional caption for the image')),

    // /file_picker (Experimental)
    new SlashCommandBuilder()
        .setName('file_picker')
        .setDescription('Experimental: Upload a file using the new modal picker'),

    // Context Menu: Delete Bot Image
    new ContextMenuCommandBuilder()
        .setName('Delete Bot Image')
        .setType(ApplicationCommandType.Message),
    new SlashCommandBuilder()
        .setName('delete_image')
        .setDescription('Deletes an image from the gallery channel')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The ID of the message to delete')
                .setRequired(true)),

    // /ping
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
