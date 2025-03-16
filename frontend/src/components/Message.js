import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Message.css';

function Message({ message, onMessageDelete }) {
  const { user } = useAuth();
  const [canUnsend, setCanUnsend] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const isOwnMessage = message.sender._id === user.id;
  const isRead = message.readBy && message.readBy.length > 0;

  useEffect(() => {
    if (isOwnMessage) {
      const messageTime = new Date(message.createdAt).getTime();
      const timeDiff = Date.now() - messageTime;
      const oneMinute = 60 * 1000;

      if (timeDiff < oneMinute) {
        setCanUnsend(true);
        setTimeLeft(Math.ceil((oneMinute - timeDiff) / 1000));

        const timer = setInterval(() => {
          const newTimeDiff = Date.now() - messageTime;
          if (newTimeDiff >= oneMinute) {
            clearInterval(timer);
            setCanUnsend(false);
            setTimeLeft(0);
          } else {
            setTimeLeft(Math.ceil((oneMinute - newTimeDiff) / 1000));
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [message.createdAt, isOwnMessage]);

  const handleUnsend = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/messages/unsend/${message._id}`);
      onMessageDelete(message._id);
    } catch (error) {
      console.error('Error unsending message:', error);
    }
  };

  return (
    <div className={`message-wrapper ${isOwnMessage ? 'sent' : 'received'}`}>
      <div className="message-row">
        {!isOwnMessage && (
          <img 
            src={message.sender.profileImage || '/default-avatar.png'} 
            alt="Profile" 
            className="message-profile-pic"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.png';
            }}
          />
        )}
        <div className="message">
          <div className="message-content">
            {canUnsend && (
              <button 
                onClick={handleUnsend}
                className="unsend-button"
                title={`Unsend (${timeLeft}s)`}
              >
                ×
              </button>
            )}
            {message.imageUrl ? (
              <img 
                src={message.imageUrl} 
                alt="Message attachment" 
                className="message-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span className="message-text">{message.content}</span>
            )}
          </div>
        </div>
        {isOwnMessage && (
          <img 
            src={message.sender.profileImage || '/default-avatar.png'} 
            alt="Profile" 
            className="message-profile-pic"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.png';
            }}
          />
        )}
      </div>
      <div className="message-time">
        {new Date(message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
        {isOwnMessage && isRead && (
          <span className="read-receipt">Read</span>
        )}
      </div>
    </div>
  );
}

export default Message; 