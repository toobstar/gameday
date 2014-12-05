Gameday is a simple web application that is designed to give an indication of how enjoyable an NBA game will be without giving away the result.

It does this by determining a rating for each game.  The rating is calculated automatically based on points difference and lead changes throughout the game.

Hopefully I'll get to a point where I include other metrics such as social media chatter.  I'm sure other aspects would be helpful too.  Here's a quick TODO:

- Highlight games where players of interest (Aussies) do well
- Show final score as an option (DONE)
- Publish feed to twitter/fb/rss
- Configurable rating system

It was also created as an exercise to use the MEAN stack.  That is: MongoDB / Mongoose / Express / AngularJs / NodeJs.  A.k.a. "full stack javascript".

It is currently running at http://www.bestgametowatch.com and is hosted on the OpenShift PAAS environment.

To run this locally you can use a mac terminal command such as:

    SECURITY_CODE=XXX NBA_ACCESS_TOKEN=XXX TWITTER_ACCESS_SECRET=XXX TWITTER_ACCESS_TOKEN=XXX TWITTER_CONS_KEY=XXX TWITTER_CONS_SECRET=XXX node server

You'll need all the relevant libs of course.