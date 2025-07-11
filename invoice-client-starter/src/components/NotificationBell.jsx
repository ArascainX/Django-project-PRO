import React, { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import api from "../utils/api"; // tvůj fetch wrapper

export default function NotificationBell() {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await api.apiGet("/user-messages");
      setMessages(data);
      const unread = data.filter(msg => !msg.read).length;
      setUnreadCount(unread);

      if (unread > 0) {
        playNotificationSound();
      }
    } catch (err) {
      console.error("Chyba při načítání zpráv:", err);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio("/notification-sound.mp3");
    audio.play();
  };

  const markAsRead = async (id) => {
    try {
      await api.apiPost(`/user-messages/${id}/mark-read/`);
      fetchMessages(); // refresh
    } catch (err) {
      console.error("Chyba při označení jako přečtené:", err);
    }
  };

  return (
    <div style={{ position: "relative", cursor: "pointer" }}>
      <FiBell size={24} />
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: "red",
            borderRadius: "50%",
            color: "white",
            padding: "2px 6px",
            fontSize: "0.75rem",
          }}
        >
          {unreadCount}
        </span>
      )}

      <div style={{ position: "absolute", right: 0, background: "white", border: "1px solid gray", marginTop: "30px", maxHeight: "300px", overflowY: "auto", width: "300px" }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ padding: "10px", borderBottom: "1px solid #ddd", backgroundColor: msg.read ? "#f9f9f9" : "#e6f7ff" }}>
            <b>{msg.title}</b>
            <p>{msg.content}</p>
            {!msg.read && (
              <button onClick={() => markAsRead(msg.id)}>Označit jako přečtené</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
