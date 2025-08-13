
import { WOLF, Command } from 'wolf.js';
import me from './src/me/index.js';

const client = new WOLF();
const keyword = client.config.keyword;

client.commandHandler.register(
    [
        new Command(`${keyword}_command_${keyword}`, { both: async (command) =>  command.reply(command.getPhrase(`${keyword}_help_message`)) },
            [
                new Command(`${keyword}_command_help`, { both: (command) => command.reply(command.getPhrase(`${keyword}_help_message`)) }),
                new Command(`${keyword}_command_me`, { both: (command) => me(client, command) })
            ]
        )
    ]
);

client.on('channelMessage', async (message) => {
    if (message.body !== '!ping') { return false; };

    return await message.reply('Pong!');
});

client.on('privateMessage', async (message) => {
    if (message.isCommand) { return false; }

    const { language } = await client.subscriber.getById(message.sourceSubscriberId);

    return await message.reply(client.phrase.getByLanguageAndName(language, `${client.config.keyword}_help_message`))
});

client.on('ready', () => {
    console.log('Ready');
});

client.login();
