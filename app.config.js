// Public OAuth identifiers, not secrets. Keep the existing app.json as the base.
module.exports = ({ config }) => {
  const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ...(iosUrlScheme ? [["@react-native-google-signin/google-signin", { iosUrlScheme }]] : []),
    ],
  };
};
