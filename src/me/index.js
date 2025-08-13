
/**
 * Required for intellisense to work with client & command
 * @param {import('wolf.js').WOLF} client
 * @param {import('wolf.js').CommandContext} command
 */
export default async (client, command) => {

    const subscriber = await client.subscriber.getById(command.sourceSubscriberId);

    return await command.reply(
        client.utility.string.replace(
            command.getPhrase(`${client.config.keyword}_subscriber_message`),
            {
                nickname: subscriber.nickname,
                id: subscriber.id,
                status: subscriber.status,
                level: subscriber.reputation.split('.')[0],
                percentage: subscriber.percentage,
            }
        )
    );
};
