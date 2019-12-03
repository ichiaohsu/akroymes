const { WebClient } = require('@slack/web-api')
const slackToken = process.env.SLACK_TOKEN
const slack = new WebClient(slackToken)

// Search through Slack user list for Slack id with GitHub user name
const userByName = async (name) => {
  let userId
  try {
    const reply = await slack.users.list()
    userId = reply.members.find(x => x.name === name).id
  } catch (err) {
    console.error(err)
  }
  return userId
}

module.exports = {
  slack,
  userByName
}
