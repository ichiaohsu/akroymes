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
    
    let { github, payload: {review: {user:{login:reviewer}, state:act, body: comment, html_url: comment_url}, pull_request: {user: {login: author}, html_url: post_request_url, number: pull_number}, repository: {name: repo, owner: {login: owner}} }} = context 
    let recipient = await userByName(users[author])
    let reviewerSlack = await userByName(users[reviewer])
    // Get PR title
    let { data:{title:pr_title} } = await github.pulls.get({owner, repo, pull_number})

    const reploy = await slack.chat.postMessage({
      channel: recipient,
      unfurl_links: true,
      attachments: [
        {
          "text": `<@${reviewerSlack}> has ${act} on your <${post_request_url}|pull_request>`,
          "color": "#42F56C"
        },
        {
          "fallback": comment,
          "title": pr_title,
          "title_link": comment_url,
          "text": comment,
          "color": "#764FA5",
        }
      ]
    }); 
  })
}
