import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Settings from './Settings';
import Message from './Message';

function Dashboard() {
  const { user, logout, updateUser, setUser } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [groupMessages, setGroupMessages] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroupChat, setSelectedGroupChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [error, setError] = useState('');
  const [groupChats, setGroupChats] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [hasNewRequests, setHasNewRequests] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('requests');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  console.log('Current user in Dashboard:', user);

  // Polling intervals for friends and chats
  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchFriends();
      fetchFriendRequests();
      fetchGroupChats();

      // Set up polling intervals
      const friendsInterval = setInterval(fetchFriends, 3000);
      const requestsInterval = setInterval(fetchFriendRequests, 3000);
      const groupChatsInterval = setInterval(fetchGroupChats, 3000);
      
      return () => {
        clearInterval(friendsInterval);
        clearInterval(requestsInterval);
        clearInterval(groupChatsInterval);
      };
    }
  }, [user]);

  // Poll for messages
  useEffect(() => {
    let messageInterval;
    if (selectedFriend) {
      fetchMessages(selectedFriend._id);
      messageInterval = setInterval(() => {
        fetchMessages(selectedFriend._id);
      }, 1000);
    } else if (selectedGroupChat) {
      fetchGroupMessages(selectedGroupChat._id);
      messageInterval = setInterval(() => {
        fetchGroupMessages(selectedGroupChat._id);
      }, 1000);
    }

    return () => {
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [selectedFriend, selectedGroupChat]);

  // Add useEffect specifically for updating selected group chat
  useEffect(() => {
    let interval;
    if (selectedGroupChat) {
      // Initial fetch
      fetchSelectedGroupChat(selectedGroupChat._id);
      
      // Set up polling for selected group
      interval = setInterval(() => {
        fetchSelectedGroupChat(selectedGroupChat._id);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedGroupChat?._id]); // Depend on the ID to prevent unnecessary updates

  useEffect(() => {
    if (selectedFriend) {
      const updatedFriend = friends.find(f => f._id === selectedFriend._id);
      if (updatedFriend && updatedFriend.profileImage !== selectedFriend.profileImage) {
        setSelectedFriend(updatedFriend);
      }
    }
  }, [friends, selectedFriend]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/friends/${user?.id}`);
      setFriends(response.data);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/friends/requests/${user.id}`);
      const newRequests = response.data;
      
      // Only set hasNewRequests if the modal isn't open and there are new requests
      if (!showFriendsModal && newRequests.length > 0 && newRequests.length > friendRequests.length) {
        setHasNewRequests(true);
      } else if (newRequests.length === 0) {
        // Clear notification if there are no requests
        setHasNewRequests(false);
      }
      
      setFriendRequests(newRequests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const addFriend = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/friends/request', {
        userId: user.id,
        friendUsername: newFriendUsername
      });
      setNewFriendUsername('');
      setError('Friend request sent successfully!');
      setTimeout(() => setError(''), 3000);
      fetchFriendRequests(); // Refresh immediately
    } catch (error) {
      setError(error.response?.data?.error || 'Error sending friend request');
    }
  };

  const acceptFriendRequest = async (requesterId) => {
    try {
      await axios.post('http://localhost:5000/api/friends/accept', {
        userId: user.id,
        friendId: requesterId
      });
      
      // Refresh lists
      fetchFriends();
      fetchFriendRequests();
      
      // Clear notification if this was the last request
      if (friendRequests.length <= 1) {
        setHasNewRequests(false);
        
        // Update user's notification status in database
        axios.post('http://localhost:5000/api/users/clear-notifications', {
          userId: user.id
        }).catch(error => {
          console.error('Error clearing notifications:', error);
        });
      }
    } catch (error) {
      setError('Error accepting friend request');
    }
  };

  const rejectFriendRequest = async (requesterId) => {
    try {
      await axios.post('http://localhost:5000/api/friends/reject', {
        userId: user.id,
        friendId: requesterId
      });
      
      // Refresh requests
      fetchFriendRequests();
      
      // Clear notification if this was the last request
      if (friendRequests.length <= 1) {
        setHasNewRequests(false);
        
        // Update user's notification status in database
        axios.post('http://localhost:5000/api/users/clear-notifications', {
          userId: user.id
        }).catch(error => {
          console.error('Error clearing notifications:', error);
        });
      }
    } catch (error) {
      setError('Error rejecting friend request');
    }
  };

  const sendMessage = async (content) => {
    try {
      const response = await axios.post('http://localhost:5000/api/messages/send', {
        sender: user.id,
        receiver: selectedFriend?._id,
        groupId: selectedGroupChat?._id,
        content: content
      });

      const newMessage = response.data;

      // Update messages based on whether it's a direct or group chat
      if (selectedFriend) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } else if (selectedGroupChat) {
        setGroupMessages(prevMessages => [...prevMessages, newMessage]);
      }

      // Clear input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const fetchMessages = async (friendId) => {
    try {
      console.log('Fetching messages between', user.id, 'and', friendId);
      const response = await axios.get(`http://localhost:5000/api/messages/${user.id}/${friendId}`);
      console.log('Fetched messages:', response.data);
      
      // Sort messages by date
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const deleteAccount = async () => {
    console.log('Delete account initiated for user:', user);
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (confirmed) {
      console.log('Delete confirmed, sending request...');
      try {
        // Check for user.id instead of user._id
        if (!user || !user.id) {
          console.error('User object:', user);
          throw new Error('User ID not found');
        }

        console.log('Attempting to delete account with ID:', user.id);
        
        // Use user.id in the endpoint
        const response = await axios.delete(
          `http://localhost:5000/api/auth/delete/${user.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        console.log('Delete response:', response);

        if (response.status === 200) {
          // Success - log out and redirect
          logout();
          navigate('/login');
        } else {
          throw new Error('Unexpected response status: ' + response.status);
        }
      } catch (error) {
        console.error('Full error object:', error);
        console.error('Error response:', error.response);
        setError(
          'Failed to delete account: ' + 
          (error.response?.data?.error || error.message || 'Unknown error occurred')
        );
      }
    }
  };

  const removeFriend = async (friendId) => {
    try {
      // Remove friend relationship using POST request
      await axios.post(`http://localhost:5000/api/friends/remove`, {
        userId: user.id,
        friendId: friendId
      });

      // Clear messages if we're viewing that friend's messages
      if (selectedFriend && selectedFriend._id === friendId) {
        setMessages([]);
        setSelectedFriend(null);
      }

      // Update friends list
      setFriends(prevFriends => prevFriends.filter(friend => friend._id !== friendId));

    } catch (error) {
      console.error('Error removing friend:', error);
      setError('Failed to remove friend');
    }
  };

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    // Check if message is from today
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
    
    // Check if message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + messageDate.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
    
    // Otherwise show full date
    return messageDate.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchGroupChats = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/groupchats/user/${user.id}`);
      const newGroupChats = response.data;
      
      // Update selected group chat if it exists in the new data
      if (selectedGroupChat) {
        const updatedSelectedGroup = newGroupChats.find(chat => chat._id === selectedGroupChat._id);
        if (updatedSelectedGroup) {
          setSelectedGroupChat(updatedSelectedGroup);
        }
      }
      
      setGroupChats(newGroupChats);
    } catch (error) {
      console.error('Error fetching group chats:', error);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      console.log('Fetching group messages for:', groupId);
      const response = await axios.get(`http://localhost:5000/api/groupchats/${groupId}/messages`);
      console.log('Fetched group messages:', response.data);
      
      // Sort messages by date
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setGroupMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching group messages:', error);
    }
  };

  const createGroupChat = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/groupchats/create', {
        name: newGroupName,
        creator: user.id,
        members: selectedMembers
      });
      
      console.log('Created new group chat:', response.data); // Debug log
      
      // Update group chats list
      setGroupChats(prevChats => [...prevChats, response.data]);
      
      // Select the new group chat
      setSelectedGroupChat(response.data);
      setSelectedFriend(null);
      
      // Clear form
      setNewGroupName('');
      setSelectedMembers([]);
      setShowCreateGroup(false);
      
      // Force immediate fetch of messages
      await fetchGroupMessages(response.data._id);
    } catch (error) {
      console.error('Error creating group chat:', error);
    }
  };

  const sendGroupMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post('http://localhost:5000/api/messages/group', {
        sender: user.id,
        groupId: selectedGroupChat._id,
        content: newMessage
      });
      setNewMessage('');
      fetchGroupMessages(selectedGroupChat._id);
    } catch (error) {
      console.error('Error sending group message:', error);
    }
  };

  const leaveGroupChat = async (groupId) => {
    try {
      await axios.delete(`http://localhost:5000/api/groupchats/${groupId}/members/${user.id}`);
      setGroupChats(prevChats => prevChats.filter(chat => chat._id !== groupId));
      setSelectedGroupChat(null);
      setMessages([]);
    } catch (error) {
      console.error('Error leaving group chat:', error);
    }
  };

  // Add new function to fetch selected group chat
  const fetchSelectedGroupChat = async (groupId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/groupchats/${groupId}`);
      setSelectedGroupChat(response.data);
      
      // Also update the group in the groupChats list
      setGroupChats(prevChats => 
        prevChats.map(chat => 
          chat._id === groupId ? response.data : chat
        )
      );
    } catch (error) {
      console.error('Error fetching selected group chat:', error);
    }
  };

  // Update the chat area JSX to handle both direct and group messages
  const renderChatHeader = () => {
    if (selectedFriend) {
      return (
        <div className="chat-header-user">
          <div className="user-info">
            <img
              src={selectedFriend.profileImage || '/default-avatar.png'}
              alt="Friend's profile"
              className="profile-picture"
            />
            <h3>{selectedFriend.username}</h3>
          </div>
        </div>
      );
    } else if (selectedGroupChat) {
      return (
        <div className="chat-header-group">
          <div className="group-header">
            <div className="group-info">
              <div className="group-info-left">
                <h3>💬 {selectedGroupChat.name}</h3>
                <span className="member-count">{selectedGroupChat.members.length} members</span>
              </div>
              <div className="group-actions">
                <button 
                  onClick={() => {
                    setSelectedGroupForMembers(selectedGroupChat);
                    setAvailableMembers(getAvailableMembers(selectedGroupChat));
                    setShowAddMembers(true);
                  }}
                  className="add-members-button"
                >
                  Add Members
                </button>
                <button 
                  onClick={() => leaveGroupChat(selectedGroupChat._id)}
                  className="leave-group-button"
                >
                  Leave Group
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!selectedFriend && !selectedGroupChat) return;

    try {
      const response = await axios.post('http://localhost:5000/api/messages/send', {
        sender: user.id,
        receiver: selectedFriend?._id,
        groupId: selectedGroupChat?._id,
        content: newMessage
      });
      
      console.log('Message sent:', response.data);
      
      // Add the new message to the messages list
      setMessages(prevMessages => [...prevMessages, response.data]);
      
      // Clear input
      setNewMessage('');
      
      // Fetch latest messages
      if (selectedGroupChat) {
        await fetchGroupMessages(selectedGroupChat._id);
      } else {
        await fetchMessages(selectedFriend._id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add function to get available members for a group
  const getAvailableMembers = (groupChat) => {
    return friends.filter(friend => 
      !groupChat.members.some(member => member._id === friend._id)
    );
  };

  // Update the handleAddMembers function
  const handleAddMembers = async (e) => {
    e.preventDefault();
    try {
      const promises = selectedNewMembers.map(memberId =>
        axios.post(`http://localhost:5000/api/groupchats/${selectedGroupForMembers._id}/members`, {
          userId: memberId
        })
      );

      const results = await Promise.all(promises);
      const updatedGroup = results[results.length - 1].data;

      // Update both states
      setSelectedGroupChat(updatedGroup);
      setGroupChats(prevChats => 
        prevChats.map(chat => 
          chat._id === updatedGroup._id ? updatedGroup : chat
        )
      );

      // Reset states
      setShowAddMembers(false);
      setSelectedNewMembers([]);
      setSelectedGroupForMembers(null);
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  // Update the function that opens the friend requests modal
  const handleOpenFriendsModal = () => {
    setShowFriendsModal(true);
    setActiveTab('requests');
    
    // Clear notification when modal is opened
    setHasNewRequests(false);
    
    // Update user's hasNewFriendRequests status in the database
    if (hasNewRequests) {
      axios.post('http://localhost:5000/api/users/clear-notifications', {
        userId: user.id
      }).catch(error => {
        console.error('Error clearing notifications:', error);
      });
    }
  };

  // Update the friend requests button click handler
  const handleAddFriend = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/friends/request', {
        userId: user.id,
        friendUsername: newFriendUsername
      });
      setNewFriendUsername('');
      setShowAddFriend(false);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const updateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/users/${user.id}/update-profile`, {
        firstName: firstName,
        lastName: lastName
      });
      
      console.log('Update profile response:', response.data);
      
      // Update the user in the state
      const updatedUser = {
        ...user,
        firstName: firstName,
        lastName: lastName
      };
      
      // Update user in context
      updateUser(updatedUser);
      setIsUpdatingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setIsUpdatingProfile(false);
    }
  };

  const handleMessageDelete = (messageId) => {
    // Update messages in direct chat
    if (selectedFriend) {
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
    }
    // Update messages in group chat
    if (selectedGroupChat) {
      setGroupMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
    }
  };

  // Update your message rendering to include the onMessageDelete prop
  const renderMessages = () => {
    const messagesToRender = selectedGroupChat ? groupMessages : messages;
    
    return messagesToRender.map((message) => (
      <Message
        key={message._id}
        message={message}
        onMessageDelete={handleMessageDelete}
      />
    ));
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="user-header">
          <div className="user-info">
            <img
              src={user?.profileImage || '/default-avatar.png'}
              alt="Profile"
              className="profile-picture"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-avatar.png';
              }}
            />
            <h2>{user?.username}</h2>
            {(user?.firstName || user?.lastName) && (
              <span className="user-full-name">
                {user?.firstName} {user?.lastName}
              </span>
            )}
          </div>
        </div>

        <div className="section-header">
          <h3>Friends ({friends.length})</h3>
          <button 
            className={`friend-requests-button ${hasNewRequests ? 'has-notifications' : ''}`}
            onClick={handleOpenFriendsModal}
            title="Friend Requests"
          >
            👥 {hasNewRequests && <span className="notification-badge">•</span>}
          </button>
        </div>

        <div className="friends-list">
          {friends.map(friend => (
            <div key={friend._id} className="friend-item">
              <div 
                className="friend-info"
                onClick={() => {
                  setSelectedFriend(friend);
                  setSelectedGroupChat(null);
                  setMessages([]);
                  fetchMessages(friend._id);
                }}
              >
                <img
                  src={friend.profileImage || '/default-avatar.png'}
                  alt="Profile"
                  className="profile-picture"
                />
                <span>{friend.username}</span>
              </div>
              <button 
                className="remove-friend-button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFriend(friend._id);
                }}
                title="Remove Friend"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="section-header">
          <h3>Group Chats</h3>
          <button onClick={() => setShowCreateGroup(true)} className="create-group-button">
            +
          </button>
        </div>
        <div className="group-chats-list">
          {groupChats.map(chat => (
            <div
              key={chat._id}
              className={`chat-item ${selectedGroupChat?._id === chat._id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedGroupChat(chat);
                setSelectedFriend(null);
                setMessages([]);
                fetchGroupMessages(chat._id);
              }}
            >
              <div className="chat-item-info">
                <h4>💬 {chat.name}</h4>
                <span>{chat.members.length} members</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-actions">
            <button 
              className="settings-button"
              onClick={() => setShowSettings(true)}
            >
              ⚙️ Settings
            </button>
            <button 
              className="logout-button"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="chat-area">
        {(selectedFriend || selectedGroupChat) ? (
          <>
            <div className="chat-header">
              {renderChatHeader()}
            </div>
            <div className="messages-container">
              {renderMessages()}
            </div>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {showCreateGroup && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create Group Chat</h2>
            <form onSubmit={createGroupChat}>
              <input
                type="text"
                placeholder="Group Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <div className="member-selection">
                {friends.map(friend => (
                  <label key={friend._id} className="member-option">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(friend._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, friend._id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== friend._id));
                        }
                      }}
                    />
                    {friend.username}
                  </label>
                ))}
              </div>
              <div className="modal-buttons">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateGroup(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddMembers && (
        <div className="modal">
          <div className="modal-content">
            <h2>Add Members to {selectedGroupForMembers.name}</h2>
            <form onSubmit={handleAddMembers}>
              <div className="member-selection">
                {getAvailableMembers(selectedGroupForMembers).map(friend => (
                  <label key={friend._id} className="member-option">
                    <input
                      type="checkbox"
                      checked={selectedNewMembers.includes(friend._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNewMembers([...selectedNewMembers, friend._id]);
                        } else {
                          setSelectedNewMembers(selectedNewMembers.filter(id => id !== friend._id));
                        }
                      }}
                    />
                    {friend.username}
                  </label>
                ))}
              </div>
              <div className="modal-buttons">
                <button type="submit">Add Selected Members</button>
                <button type="button" onClick={() => {
                  setShowAddMembers(false);
                  setSelectedNewMembers([]);
                  setSelectedGroupForMembers(null);
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFriendsModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-tabs">
                <button 
                  className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
                  onClick={() => setActiveTab('requests')}
                >
                  Friend Requests {hasNewRequests && <span className="tab-notification">•</span>}
                </button>
                <button 
                  className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
                  onClick={() => setActiveTab('add')}
                >
                  Add Friend
                </button>
              </div>
            </div>

            {activeTab === 'requests' ? (
              <div className="friend-requests-list">
                {friendRequests.length > 0 ? (
                  friendRequests.map(request => (
                    <div key={request._id} className="friend-request">
                      <span>{request.username}</span>
                      <div className="friend-request-buttons">
                        <button 
                          className="accept"
                          onClick={() => acceptFriendRequest(request._id)}
                        >
                          Accept
                        </button>
                        <button 
                          className="reject"
                          onClick={() => rejectFriendRequest(request._id)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-requests">No pending friend requests</div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddFriend}>
                <input
                  type="text"
                  placeholder="Friend's username"
                  value={newFriendUsername}
                  onChange={(e) => setNewFriendUsername(e.target.value)}
                  className="friend-username-input"
                />
                <button type="submit" className="add-friend-submit">
                  Send Request
                </button>
              </form>
            )}

            <div className="modal-buttons">
              <button onClick={() => {
                setShowFriendsModal(false);
                setNewFriendUsername('');
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <Settings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;