//this is for the api base url (works in docker and in dev thanks to the nginx/vite proxies)
const BASE = "/api";

//this is for the GET all request template
export async function getItems() {
  const res = await fetch(`${BASE}/example`);
  return res.json();
}

//this is for the GET one request template
export async function getItem(id) {
  const res = await fetch(`${BASE}/example/${id}`);
  return res.json();
}

//this is for the POST request template (data is sent as json in the body)
export async function postItem(data) {
  const res = await fetch(`${BASE}/example`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

//this is for the PUT request template
export async function putItem(id, data) {
  const res = await fetch(`${BASE}/example/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

//this is for the DELETE request template
export async function deleteItem(id) {
  const res = await fetch(`${BASE}/example/${id}`, {
    method: "DELETE",
  });
  return res.json();
}
