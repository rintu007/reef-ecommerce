import { Redirect } from "expo-router";

/** (auth)/_layout.tsx redirects onward to (tabs)/browse once a session exists. */
export default function Index() {
  return <Redirect href="/(auth)/sign-in" />;
}
