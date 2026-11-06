//this is for turning an error into a short message that is safe to show on screen
//(raw errors can mention table names, policies or whether an email already has an account)
const known = {
  invalid_credentials: "Wrong email or password.",
  email_not_confirmed: "Please confirm your email first. Check your inbox.",
  weak_password:
    "That password is too weak. Use a longer one with letters and numbers.",
  same_password: "Pick a password you are not already using.",
  over_email_send_rate_limit:
    "Too many emails were sent. Please wait a few minutes and try again.",
  over_request_rate_limit:
    "Too many tries. Please wait a few minutes and try again.",
  reauthentication_needed: "Please log in again, then try once more.",
  session_not_found: "Your session ended. Please log in again.",
  //this is for an address that already has an account: say the same thing as for any other failure
  email_exists: "We could not use that email address. Check it and try again.",
  user_already_exists:
    "We could not use that email address. Check it and try again.",
};

export function friendly(
  e,
  fallback = "Something went wrong. Please try again.",
) {
  if (!e) return fallback;
  if (e.code && known[e.code]) return known[e.code];
  //this is for our own database functions: they raise short messages that were written for people
  if (
    e.code === "P0001" &&
    typeof e.message === "string" &&
    e.message.length <= 200
  )
    return e.message;
  //this is for the database refusing something
  if (e.code === "42501") return "You are not allowed to do that.";
  if (e.code === "23505") return "That already exists.";
  if (e.code === "23514" || e.code === "22001" || e.code === "22P02")
    return "Some of that information is not allowed. Check it and try again.";
  //this is for a lost connection
  if (e instanceof TypeError || /fetch|network/i.test(e.message || ""))
    return "Could not reach the server. Check your connection and try again.";
  return fallback;
}
