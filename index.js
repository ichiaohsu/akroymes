/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Application} app
 */

const users = require('./user-mapping.json')
const { slack, userByName } = require('./lib/slack.js');

module.exports = app => {
  
  app.log('Yay, the app was loaded!')

  // pull request
  app.on(['pull_request_review.submitted'], async context => {
    
    let { 
      github, 
      payload: {
        review: {
          user:{
            login:reviewer
          }, 
          state:act, 
          body: comment, 
          html_url: comment_url
        }, 
        pull_request: {
          user: {
            login: author
          }, 
          html_url: post_request_url, 
          number: pull_number
        }, 
        repository: {
            name: repo, 
            owner: {
              login: owner
            }
          }
        }
      } = context 
    let recipient = await userByName(users[author])
    let reviewerSlack = await userByName(users[reviewer])
    // Get PR title
    let { data:{title:pr_title} } = await github.pulls.get({owner, repo, pull_number})

    await slack.chat.postMessage({
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
    })
  })

  app.on(['pull_request.review_requested'], async context => {
    let {
      payload: {
        pull_request: {
          user: {
            login: author
          },
          title,
          html_url: pullRequestUrl,
          requested_reviewers,
          body
        },
      }
    } = context
    
    let slackAuthor = await userByName(users[author])
    let slackReviewers = []
    // Find slack id for all reviewers 
    await Promise.all(
      requested_reviewers.map(async (x) => { return userByName(users[x.login])} )
    ).then((data) => {
      slackReviewers.push(...data)
    })
    // Send messages using map
    await Promise.all(
      slackReviewers.map(async (recipient) => {
        return slack.chat.postMessage({
          channel: recipient,
          unfurl_links: true,
          attachments: [
            {
              "text": `<@${slackAuthor}> has request you as reviewer`,
              "color": "#42F56C"
            },
            {
              "fallback": body,
              "title": title,
              "title_link": pullRequestUrl,
              "text": body,
              "color": "#764FA5",
            }
          ]
        }) 
      })
    ).then(() => {
      app.log("send message to reviewers")
    })
  })
}
