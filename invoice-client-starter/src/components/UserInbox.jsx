import React, { useEffect, useState } from "react";
import { apiGet } from "../utils/api";


const UserInbox = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    apiGet("/api/user-messages").then(setMessages);
  }, []);

  return (
    <div className="user-inbox">
      <h2>Schránka zpráv</h2>
      {messages.length === 0 ? (
        <p>Žádné zprávy.</p>
      ) : (
        <ul>
          {messages.map((msg) => (
            <li key={msg._id} className={msg.read ? "read" : "unread"}>
              <strong>{msg.title}</strong><br />
              <small>{new Date(msg.created).toLocaleString()}</small>
              <p>{msg.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserInbox;
