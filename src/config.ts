const config = process.env;

if (!config.NODE_ENV) {
  config.NODE_ENV = "production";
}

export default config;
