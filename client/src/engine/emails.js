//this is for reading email addresses typed or pasted into the invite box
//(the database checks them again, this is only so people get a quick answer)
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const MAX_INVITES = 20;

//this is for splitting text like "a@x.com, b@x.com c@x.com" and sorting good from bad
//existing = emails already in the list, own = the user's own email (they are already the admin)
export function parseEmails(text, existing = [], own = "") {
  const added = [];
  const problems = [];
  const mine = own.trim().toLowerCase();

  text
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((e) => {
      if (!EMAIL.test(e) || e.length > 254)
        problems.push(e + " is not a valid email address.");
      else if (e === mine)
        problems.push("That is your own email, you are already the admin.");
      else if (existing.includes(e) || added.includes(e)) return;
      else if (existing.length + added.length >= MAX_INVITES)
        problems.push(
          "You can invite up to " + MAX_INVITES + " people at once.",
        );
      else added.push(e);
    });

  return { added, problems };
}
