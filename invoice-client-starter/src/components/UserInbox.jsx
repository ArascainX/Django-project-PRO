import React, { useEffect, useState } from "react";
import { apiGet, apiDelete } from "../utils/api";
import FlashMessage from "../components/FlashMessage";

const UserInbox = () => {
  const [messages, setMessages] = useState([]);
  const [flashMessage, setFlashMessage] = useState(null);

  const fetchMessages = () => {
    apiGet("/api/user-messages")
      .then((data) => {
        setMessages(data);
      })
      .catch((err) => {
        console.error("Chyba při načítání zpráv:", err);
        setFlashMessage({
          text: "❌ Nepodařilo se načíst zprávy.",
          theme: "danger",
        });
      });
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (flashMessage) {
      const timer = setTimeout(() => setFlashMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flashMessage]);

  const deleteAllMessages = async () => {
    if (!window.confirm("Opravdu chceš smazat všechny zprávy?")) return;

    try {
      await apiDelete("/api/usermessages/delete_all/");
      setMessages([]); 
      setFlashMessage({
        text: "✅ Zprávy byly úspěšně smazány.",
        theme: "success",
      });
    } catch (error) {
      console.error("❌ Chyba při mazání zpráv:", error);
      setFlashMessage({
        text: "❌ Nastala chyba při mazání zpráv.",
        theme: "danger",
      });
    }
  };

  return (
    <div className="user-inbox">
      <h2>Schránka zpráv</h2>

      {flashMessage && (
        <FlashMessage text={flashMessage.text} theme={flashMessage.theme} />
      )}

      {messages.length === 0 ? (
        <p className="no-messages">Žádné zprávy.</p>
      ) : (
        <>
          <ul className="message-list">
            {messages.map((msg) => (
              <li
                key={msg.id || msg._id}
                className={`message ${msg.read ? "read" : "unread"}`}
              >
                <div className="message-header">
                  <strong className="message-title">{msg.title}</strong>
                  <small className="message-date">
                    {new Date(msg.created).toLocaleString()}
                  </small>
                </div>
                <p className="message-content">{msg.content}</p>
              </li>
            ))}
          </ul>

          <div className="delete-all-container">
            <button className="delete-all-btn" onClick={deleteAllMessages}>
              🗑️ Smazat všechny zprávy
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserInbox;
