/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const users = require('./user-mapping.json')

const { WebClient } = require('@slack/web-api')
const slackToken = process.env.SLACK_TOKEN;
const slack = new WebClient(slackToken)

// Search slack user id with user name
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

module.exports = app => {
  
  app.log('Yay, the app was loaded!')

  // pull request
  app.on(['pull_request_review.submitted'], async context => {
    let { payload: {review: {user:{login:reviewer}, state:act, body: comment, html_url: comment_url}, pull_request: {user: {login: author}, html_url: post_request_url}}} = context 
    let recipient = await userByName(users[author])
    let reviewerSlack = await userByName(users[reviewer])
    const reploy = await slack.chat.postMessage({
      text: msg,
      channel: recipient,
      unfurl_links: true,
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `<@${reviewerSlack}> has ${act} on your <${post_request_url}|pull_request>`
          } 
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": comment
          }
        }

      ]
    }); 
  })
}
