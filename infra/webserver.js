function getOrigin() {
  if (process.env.WEBSERVER_HOST) {
    return process.env.WEBSERVER_HOST;
  }

  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://lojaeplay.com.br";
}

const webserver = {
  origin: getOrigin(),
};

export default webserver;
