const { promisify } = require('util')
const zlib = require('zlib')
const Discord = require('discord.js')

const gunzip = promisify(zlib.gunzip)

exports.handler = async function (event, context) {
  if (process.env.DEBUG) {
    console.log({ event, context })
  }

  const payload = Buffer.from(event.awslogs.data, 'base64')
  await gunzip(payload)
    .then(async result => {
      const {
        logGroup,
        logStream,
        subscriptionFilters,
        logEvents
      } = JSON.parse(result.toString())

      const client = new Discord.WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL })
      const embeds = []
      
      logEvents.forEach(evt => {
        const message = evt.message.replace(/\t|\n/g, ' ')

        try {
          const errorObjIndex = message.indexOf('{')
          const error = JSON.parse(message.slice(errorObjIndex))
          evt.message = message.slice(0, errorObjIndex).trim()
          Object.assign(evt, error)

          if (evt.stack) {
            evt.stack = JSON.stringify(evt.stack)
          }
        } catch (err) {
          evt.message = message
        }

        embeds.push(
          new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(evt.errorMessage)
            .setDescription(evt.stack)
        )
      })

      await client.send({
        content: 'Probleminha rolando.',
        username: 'Freddie',
        avatarURL: 'https://i.imgur.com/jXAa3NQ.gif',
        embeds
      })

      console.log({ logGroup, logStream, subscriptionFilters, logEvents });
      context.succeed()
    })
    .catch(e => context.fail(e))
}
