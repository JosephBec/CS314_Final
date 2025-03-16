import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Message.css';

function Message({ message, currentUser, onMessageDelete }) {
  const { user } = useAuth();
  const [canUnsend, setCanUnsend] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Handle both direct messages and group chat messages
  const isOwnMessage = message.sender && 
    ((typeof message.sender === 'object' && message.sender._id === user.id) || 
     (typeof message.sender === 'string' && message.sender === user.id));
  
  const isRead = message.readBy && message.readBy.length > 0;
  
  // Get sender information safely
  const getSenderInfo = () => {
    if (!message.sender) return { username: 'Unknown', profileImage: '/default-avatar.png' };
    
    if (typeof message.sender === 'object') {
      return {
        username: message.sender.username || 'Unknown',
        profileImage: message.sender.profileImage || '/default-avatar.png'
      };
    }
    
    // If sender is just an ID (from socket events)
    return { username: 'User', profileImage: '/default-avatar.png' };
  };
  
  const senderInfo = getSenderInfo();

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
            src={senderInfo.profileImage || '/default-avatar.png'} 
            alt="Profile" 
            className="message-profile-pic"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.png';
            }}
          />
        )}
        <div className="message">
          {!isOwnMessage && message.groupChat && (
            <div className="sender-name">{senderInfo.username}</div>
          )}
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
            src={senderInfo.profileImage || '/default-avatar.png'} 
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
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        {isOwnMessage && isRead && <span className="read-indicator">✓</span>}
      </div>
    </div>
  );
}

export default Message;