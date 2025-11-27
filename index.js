require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ComponentType,
    Events
} = require('discord.js');
const http = require('http');

// ================= RENDER PORT BINDING =================
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Jag Raha hu Bsdk, G m ghus jaao bot ki');
}).listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});

// ================= CONFIGURATION =================
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;

// Who can UPLOAD/DELETE images?
const ALLOWED_ROLES = (process.env.ALLOWED_ROLES || '').split(',').map(s => s.trim());

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        console.log(`[LOG] User ${interaction.user.tag} (${interaction.user.id}) executed command: ${interaction.commandName}`);
    }

    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'upload_image') {
            // 1. Check Permissions (Role)
            const hasRole = interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

            if (!hasRole) {
                return interaction.reply({
                    content: '❌ 🩷de You do not have permission to upload images.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // 2. Get the file
            const attachment = interaction.options.getAttachment('image');
            const caption = interaction.options.getString('caption');

            // 3. Validate it's an image
            if (!attachment.contentType.startsWith('image/')) {
                return interaction.reply({
                    content: '❌ Please upload a valid image file.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                // 4. Send to Target Channel
                const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
                if (!targetChannel) throw new Error("Channel not found");

                const messageContent = `${caption ? `\n${caption}` : ''}`;

                await targetChannel.send({
                    content: messageContent,
                    files: [attachment.url]
                });

                await interaction.editReply({ content: `✅ File successfully sent to <#${TARGET_CHANNEL_ID}>!` });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ Failed to upload file. Check bot permissions or channel ID.' });
            }
        }
        else if (commandName === 'file_picker') {
            // 1. Check Permissions (Role)
            const hasRole = interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

            if (!hasRole) {
                return interaction.reply({
                    content: '❌ 🩷de You do not have permission to upload files.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Construct Modal manually to include FileUpload component
            const modalData = {
                customId: 'file_picker_modal',
                title: 'Upload File',
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.TextInput,
                                customId: 'caption',
                                label: 'Caption',
                                style: TextInputStyle.Short,
                                required: false
                            }
                        ]
                    },
                    {
                        type: ComponentType.Label,
                        label: 'Upload a file',
                        component: {
                            type: ComponentType.FileUpload,
                            customId: 'file',
                            required: true
                        }
                    }
                ]
            };

            await interaction.showModal(modalData);
        }
        else if (commandName === 'delete_image') {
            // 1. Check Permissions (Role)
            const hasRole = interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

            if (!hasRole) {
                return interaction.reply({
                    content: '❌ 🩷de You do not have permission to delete images.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const messageId = interaction.options.getString('message_id');

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
                if (!targetChannel) throw new Error("Channel not found");

                const message = await targetChannel.messages.fetch(messageId);
                if (!message) throw new Error("Message not found");

                await message.delete();

                await interaction.editReply({ content: '✅ Message deleted successfully.' });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ Failed to delete message. Check the message ID and bot permissions.' });
            }
        }
        else if (commandName === 'ping') {
            const sent = await interaction.reply({ content: 'Pinging...', withResponse: true, flags: MessageFlags.Ephemeral });
            interaction.editReply({
                content: `Roundtrip latency: ${sent.resource.message.createdTimestamp - interaction.createdTimestamp}ms\nWebsocket heartbeat: ${Math.round(client.ws.ping)}ms`
            });
        }
    }
    else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'file_picker_modal') {
            // 1. Security Check: Verify Role again (in case it was removed while modal was open)
            const hasRole = interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));

            if (!hasRole) {
                return interaction.reply({
                    content: '❌ 🩷de You do not have permission to upload files.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            try {
                const caption = interaction.fields.getTextInputValue('caption');

                // Retrieve uploaded files
                const files = interaction.fields.getUploadedFiles('file');

                if (!files || files.size === 0) {
                    return interaction.editReply({ content: '❌ No file uploaded.' });
                }

                const file = files.first();

                const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
                if (!targetChannel) throw new Error("Channel not found");

                const messageContent = `${caption ? `\n${caption}` : ''}`;

                await targetChannel.send({
                    content: messageContent,
                    files: [file.url]
                });

                await interaction.editReply({ content: `✅ File successfully sent to <#${TARGET_CHANNEL_ID}>!` });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ Failed to upload file.' });
            }
        }
    }

    // --- HANDLE CONTEXT MENU (DELETE) ---
    else if (interaction.isMessageContextMenuCommand() && interaction.commandName === 'Delete Bot Image') {

        // 1. Check Delete Permissions (Role check)
        const hasRole = interaction.member.roles.cache.some(r => ALLOWED_ROLES.includes(r.id));
        if (!hasRole) {
            return interaction.reply({
                content: '⛔ 🩷de You are not authorized to delete images.',
                flags: MessageFlags.Ephemeral
            });
        }

        const targetMessage = interaction.targetMessage;

        // 2. Security Check: Is this in the correct channel?
        if (targetMessage.channelId !== TARGET_CHANNEL_ID) {
            return interaction.reply({
                content: '⚠️ You can only use this tool in the designated gallery channel.',
                flags: MessageFlags.Ephemeral
            });
        }

        // 3. Delete the message
        try {
            // Check if the message is deletable (Bot needs Manage Messages or it must be its own message)
            if (!targetMessage.deletable) {
                return interaction.reply({
                    content: '❌ I cannot delete this message. I might lack permissions or it is too old.',
                    flags: MessageFlags.Ephemeral
                });
            }

            await targetMessage.delete();

            return interaction.reply({
                content: '🗑️ Image/Message deleted successfully.',
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ Error deleting message.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

client.login(TOKEN);