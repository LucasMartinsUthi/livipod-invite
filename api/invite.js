const admin = require('firebase-admin');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { inviteId } = req.query;

  // GET /api/invite/:inviteId - Get invite details
  if (req.method === 'GET' && inviteId) {
    try {
      const inviteDoc = await db.collection('invites').doc(inviteId).get();

      if (!inviteDoc.exists) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      const inviteData = inviteDoc.data();

      if (inviteData.usedBy) {
        return res.status(400).json({ error: 'Invite already used' });
      }

      return res.json({ inviteId, inviterId: inviteData.inviterId });
    } catch (error) {
      console.error('Error getting invite:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/invite/create - Create new invite
  if (req.method === 'POST' && req.url.includes('/create')) {
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

      return res.json({ inviteId: inviteRef.id });
    } catch (error) {
      console.error('Error creating invite:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/invite/accept - Accept invite
  if (req.method === 'POST' && req.url.includes('/accept')) {
    try {
      const { inviteId, userId } = req.body;

      if (!inviteId || !userId) {
        return res.status(400).json({ error: 'Missing inviteId or userId' });
      }

      const inviteDoc = await db.collection('invites').doc(inviteId).get();

      if (!inviteDoc.exists) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      const inviteData = inviteDoc.data();
      const inviterId = inviteData.inviterId;

      const relationshipRef = db.collection('user_relationships').doc();
      await relationshipRef.set({
        inviterId,
        inviteeId: userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        inviteId,
      });

      await db.collection('invites').doc(inviteId).update({
        usedBy: userId,
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.json({ success: true, relationshipId: relationshipRef.id });
    } catch (error) {
      console.error('Error accepting invite:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
};
