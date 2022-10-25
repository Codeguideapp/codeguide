import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const index = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>GitHub OAuth Login Test</title>
        <link href="/style.css" rel="stylesheet" />
        <script type="module">
        import { request as defaultRequest } from "https://cdn.pika.dev/@octokit/request";
const searchParams = new URLSearchParams(location.search);

const params = {};
for (const [key, value] of searchParams.entries()) {
  params[key] = value;
}

if (params.code) {
  exchangeCodeForToken(params.code);
} else {
  setup();
}

async function setup() {
  const token = localStorage.getItem("token");
  if (!token) return logout();

  // we asume the token is valid
  login(token);
  window.request = defaultRequest.defaults({
    headers: {
      authorization: \`token \${token}\`
    }
  });

  // ... but we check just to be sure
  request(\`GET \${location.origin}/dev/github/oauth/token\`).catch(logout);
}
async function exchangeCodeForToken(code) {
  const response = await defaultRequest(
    \`POST \${location.origin}/dev/github/oauth/token\`,
    {
      code: params.code
    }
  ).catch(console.error);

  if (!response) return;

  console.log(
    "access token is %s. Enabled scopes: ",
    response.data.token,
    response.data.scopes.join(", ")
  );
  login(response.data.token);
  window.request = defaultRequest.defaults({
    headers: {
      authorization: \`token \${response.data.token}\`
    }
  });

  // remove ?code=... and &state=... from URL
  const path =
    location.pathname +
    location.search.replace(/\b(code|state)=\w+/g, "").replace(/[?&]+$/, "");

  history.pushState({}, "", path);
}

function login(token) {
  document.body.dataset.state = "main";
  localStorage.setItem("token", token);
}

async function logout(options = {}) {
  if (options.invalidateToken) {
    await request(\`DELETE \${location.origin}/dev/github/oauth/token\`);
  }

  document.body.dataset.state = "login";
  localStorage.clear();
}

async function sayMyName() {
  const { data } = await request("GET /user");
  alert(data.name);
}

window.logout = logout;
window.sayMyName = sayMyName;

        </script>
      </head>
      <body>
        <div id="loading">
          Loading ...
        </div>
        <div id="login">
          <a href="/api/github/oauth/login?scopes=repo">
            Login with GitHub
          </a>
        </div>
        <div id="main">
          <h1>Hello there!</h1>
          <p>
            <button onclick="sayMyName()">Say my name!</button>
          </p>
          <p>
            <button onclick="logout({ invalidateToken: true })">Logout</button>
          </p>
        </div>
      </body>
    </html>
    `,
  };
};
