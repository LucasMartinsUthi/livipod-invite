require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// Create invite relationship
app.post('/api/invite/accept', async (req, res) => {
  try {
    const { inviteId, userId } = req.body;

    if (!inviteId || !userId) {
      return res.status(400).json({ error: 'Missing inviteId or userId' });
    }

    // Get invite details
    const inviteDoc = await db.collection('invites').doc(inviteId).get();

    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    const inviteData = inviteDoc.data();
    const inviterId = inviteData.inviterId;

    // Create relationship between users
    const relationshipRef = db.collection('user_relationships').doc();
    await relationshipRef.set({
      inviterId,
      inviteeId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      inviteId,
    });

    // Mark invite as used
    await db.collection('invites').doc(inviteId).update({
      usedBy: userId,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, relationshipId: relationshipRef.id });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new invite
app.post('/api/invite/create', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const inviteRef = db.collection('invites').doc();
    await inviteRef.set({
      inviterId: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      used: false,
    });

    res.json({ inviteId: inviteRef.id });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invite details
app.get('/api/invite/:inviteId', async (req, res) => {
  try {
    const { inviteId } = req.params;

    const inviteDoc = await db.collection('invites').doc(inviteId).get();

    if (!inviteDoc.exists) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    const inviteData = inviteDoc.data();

    if (inviteData.usedBy) {
      return res.status(400).json({ error: 'Invite already used' });
    }

    res.json({ inviteId, inviterId: inviteData.inviterId });
  } catch (error) {
    console.error('Error getting invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
