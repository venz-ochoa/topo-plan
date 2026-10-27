//this is for the page template (shows how to call GET and POST from the api - copy this file to create new pages)
import { useEffect, useState } from 'react';
import { getItems, postItem } from '../api.js';

export default function Example() {
  //this is for the state that holds the data from the GET request
  const [items, setItems] = useState([]);
  //this is for the state that holds the input value for the POST request
  const [name, setName] = useState('');

  //this is for loading the data when the page opens (catch stops errors if the api is not up yet)
  useEffect(() => {
    getItems().then(setItems).catch((err) => console.error(err));
  }, []);

  //this is for the POST request when the form is submitted
  async function handleSubmit(e) {
    e.preventDefault();
    await postItem({ name });
    setName('');
    setItems(await getItems());
  }

  return (
    <div>
      <h1>Example</h1>
      {/*this is for the POST form*/}
      <form className="form" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="name"
        />
        <button className="btn" type="submit">Send POST</button>
      </form>
      {/*this is for rendering the GET result*/}
      <ul className="list">
        {items.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
