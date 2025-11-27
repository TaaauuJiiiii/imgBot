# Discord Image Bot

A Discord bot for uploading and managing images in a specific channel.

## Features

- **/upload_image**: Upload an image with an optional caption.
- **/file_picker**: (Experimental) Upload a file using a modal.
- **/delete_image**: Delete a message by ID.
- **Context Menu**: Right-click a message > Apps > Delete Bot Image to delete it.
- **Permission System**: Restrict upload and delete actions to specific roles.

## Setup

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on the configuration below.
4.  Deploy commands:
    ```bash
    node deploy-commands.js
    ```
5.  Start the bot:
    ```bash
    node index.js
    ```

## Configuration (.env)

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_guild_id
TARGET_CHANNEL_ID=target_channel_id
ALLOWED_ROLES=role_id_1,role_id_2
```

- `ALLOWED_ROLES`: Comma-separated list of Role IDs allowed to upload and delete images.
