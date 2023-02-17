# CodeGuide

[Codeguide](https://codeguide.app) is an open-source tool for creating and viewing code guides. For onboarding, explaining the context of a code review, and more.

![CodeGuide](https://codeguide.app/_next/image?url=%2Flanding%2Fscreenshot-editor.png&w=3840&q=75)

## Why would you use it?

**Onboard (or re-board) to a new project or feature**

With code guides you can help new team members understand the codebase and get up to speed quickly. Also, it's a great way to re-board yourself to a project or feature area you haven't worked on for a while.

**Understand the context of a code review/PR change**

It makes it easy for PR authors to explain the reasoning behind their decisions and draw attention to important parts of their changes so reviewers can focus on those first.

**Make code presentations**

You can use Codeguide for creating code presentations, whether it's for a conference talk or a training session.

## Next.js

This is a [Next.js](https://nextjs.org/) project. To bootstrap a similar one, we recommend using [`create-t3-stack`](https://github.com/t3-oss/create-t3-app).

## Architecture

Project is written in TypeScript, using:

- [AWS DynamoDB](https://aws.amazon.com/dynamodb/) as a database (but the plan is to support other databases in the future)
- [NextAuth.js](https://next-auth.js.org/) for authentication (only GitHub connection at the moment)
- [tRPC](https://trpc.io/) for handling API requests
- [Tailwind CSS](https://tailwindcss.com/) for styling

## Self hosting

If you want to self host this project, first you need to set up enviroment variables:

```
AWS_APP_REGION=''
AWS_APP_ACCESS_KEY=''
AWS_APP_SECRET_KEY=''

DYNAMODB_GUIDES_TABLE=''
DYNAMODB_CHANGES_TABLE=''
DYNAMODB_COMMENTS_TABLE=''

NEXTAUTH_SECRET=''
NEXTAUTH_URL=http://localhost:3000
```

then run the development server:

```bash
npm run dev
# or
yarn dev
```

After that, open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
