router.delete('/friend/:friendId', auth, async (req, res) => {
  try {
    await Message.deleteMany({
      $or: [
        { sender: req.user.id, recipient: req.params.friendId },
        { sender: req.params.friendId, recipient: req.user.id }
      ]
    });
    res.status(200).json({ message: 'Messages deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting messages' });
  }
}); 