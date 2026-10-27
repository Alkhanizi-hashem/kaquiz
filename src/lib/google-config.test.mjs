import assert from "node:assert/strict";
import test from "node:test";
import configFactory from "../../app.config.js";

test("Google plugin is optional and preserves existing Expo configuration", () => {
  const previous = process.env.GOOGLE_IOS_URL_SCHEME;
  try {
    delete process.env.GOOGLE_IOS_URL_SCHEME;
    const config = { name: "Kaquiz", plugins: ["expo-router"], ios: { bundleIdentifier: "com.reboot01.kaquiz" } };
    assert.deepEqual(configFactory({ config }), config);
    process.env.GOOGLE_IOS_URL_SCHEME = "com.googleusercontent.apps.test-only";
    assert.deepEqual(configFactory({ config }).plugins, ["expo-router", ["@react-native-google-signin/google-signin", { iosUrlScheme: "com.googleusercontent.apps.test-only" }]]);
    assert.deepEqual(config.plugins, ["expo-router"]);
  } finally {
    if (previous === undefined) delete process.env.GOOGLE_IOS_URL_SCHEME;
    else process.env.GOOGLE_IOS_URL_SCHEME = previous;
  }
});
