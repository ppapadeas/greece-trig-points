const express = require('express');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { ensureAuth } = require('../middleware/auth.middleware');
const passkeyService = require('../../services/passkey.service');
const recoveryService = require('../../services/recovery.service');

const router = express.Router();

const rpName = process.env.WEBAUTHN_RP_NAME || 'vathra.xyz';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:5173';

// --- Registration ---

router.post('/api/passkey/register/options', async (req, res) => {
  try {
    let userId, userEmail, userName;

    if (req.isAuthenticated()) {
      userId = req.user.id;
      userEmail = req.user.email;
      userName = req.user.display_name;
    } else {
      const { email, displayName } = req.body;
      if (!email || !displayName) {
        return res.status(400).json({ message: 'Email and display name are required' });
      }

      const existing = await passkeyService.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: 'Email already registered. Please log in first to add a passkey.' });
      }

      req.session.pendingPasskeyUser = { email, displayName };
      userId = email; // temporary identifier for WebAuthn
      userEmail = email;
      userName = displayName;
    }

    const existingCreds = req.isAuthenticated()
      ? await passkeyService.getAllCredentialIdsForUser(req.user.id)
      : [];

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: userEmail,
      userDisplayName: userName,
      userID: new TextEncoder().encode(String(userId)),
      attestationType: 'none',
      excludeCredentials: existingCreds.map((c) => ({
        id: c.credential_id,
        transports: c.transports || [],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    req.session.currentChallenge = options.challenge;
    res.json(options);
  } catch (err) {
    console.error('Passkey register options error:', err);
    res.status(500).json({ message: 'Failed to generate registration options' });
  }
});

router.post('/api/passkey/register/verify', async (req, res) => {
  try {
    const challenge = req.session.currentChallenge;
    if (!challenge) {
      return res.status(400).json({ message: 'No registration challenge found' });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ message: 'Verification failed' });
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;

    let user;
    if (req.isAuthenticated()) {
      user = req.user;
    } else if (req.session.pendingPasskeyUser) {
      const { email, displayName } = req.session.pendingPasskeyUser;
      user = await passkeyService.createPasskeyUser(email, displayName);
      delete req.session.pendingPasskeyUser;
    } else {
      return res.status(400).json({ message: 'No user context for registration' });
    }

    await passkeyService.saveCredential(user.id, {
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: req.body.response?.transports || [],
      deviceName: req.body.deviceName || credentialDeviceType || null,
    });

    delete req.session.currentChallenge;

    if (!req.isAuthenticated()) {
      await new Promise((resolve, reject) => {
        req.login(user, (err) => (err ? reject(err) : resolve()));
      });
    }

    res.json({ verified: true, user });
  } catch (err) {
    console.error('Passkey register verify error:', err);
    res.status(500).json({ message: 'Failed to verify registration' });
  }
});

// --- Authentication ---

router.post('/api/passkey/login/options', async (req, res) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'preferred',
    });

    req.session.currentChallenge = options.challenge;
    res.json(options);
  } catch (err) {
    console.error('Passkey login options error:', err);
    res.status(500).json({ message: 'Failed to generate authentication options' });
  }
});

router.post('/api/passkey/login/verify', async (req, res) => {
  try {
    const challenge = req.session.currentChallenge;
    if (!challenge) {
      return res.status(400).json({ message: 'No authentication challenge found' });
    }

    const credentialRecord = await passkeyService.getCredentialByCredentialId(req.body.id);
    if (!credentialRecord) {
      return res.status(400).json({ message: 'Credential not found' });
    }

    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credentialRecord.credential_id,
        publicKey: Buffer.from(credentialRecord.public_key, 'base64url'),
        counter: Number(credentialRecord.counter),
        transports: credentialRecord.transports || [],
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ message: 'Authentication failed' });
    }

    await passkeyService.updateCredentialCounter(
      credentialRecord.credential_id,
      verification.authenticationInfo.newCounter
    );

    delete req.session.currentChallenge;

    const user = {
      id: credentialRecord.uid,
      email: credentialRecord.email,
      display_name: credentialRecord.display_name,
      profile_picture_url: credentialRecord.profile_picture_url,
      role: credentialRecord.role,
    };

    await new Promise((resolve, reject) => {
      req.login(user, (err) => (err ? reject(err) : resolve()));
    });

    res.json({ verified: true, user });
  } catch (err) {
    console.error('Passkey login verify error:', err);
    res.status(500).json({ message: 'Failed to verify authentication' });
  }
});

// --- Recovery (token-based, no session auth required) ---

router.post('/api/passkey/recover/options', async (req, res) => {
  try {
    const { token } = req.body || {};
    const record = await recoveryService.findValidToken(token);
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired recovery token' });
    }

    const existingCreds = await passkeyService.getAllCredentialIdsForUser(record.user_id);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: record.email,
      userDisplayName: record.display_name || record.email,
      userID: new TextEncoder().encode(String(record.user_id)),
      attestationType: 'none',
      excludeCredentials: existingCreds.map((c) => ({
        id: c.credential_id,
        transports: c.transports || [],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    req.session.currentChallenge = options.challenge;
    req.session.recoveryTokenId = record.id;
    req.session.recoveryUserId = record.user_id;

    res.json({
      options,
      user: { email: record.email, displayName: record.display_name },
    });
  } catch (err) {
    console.error('Passkey recovery options error:', err);
    res.status(500).json({ message: 'Failed to generate recovery options' });
  }
});

router.post('/api/passkey/recover/verify', async (req, res) => {
  try {
    const challenge = req.session.currentChallenge;
    const tokenId = req.session.recoveryTokenId;
    const userId = req.session.recoveryUserId;
    if (!challenge || !tokenId || !userId) {
      return res.status(400).json({ message: 'No recovery challenge in session' });
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ message: 'Verification failed' });
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;

    await passkeyService.saveCredential(userId, {
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: req.body.response?.transports || [],
      deviceName: req.body.deviceName || credentialDeviceType || null,
    });

    await recoveryService.consumeToken(tokenId);

    delete req.session.currentChallenge;
    delete req.session.recoveryTokenId;
    delete req.session.recoveryUserId;

    const userRow = await passkeyService.getCredentialByCredentialId(credential.id);
    const user = userRow
      ? {
          id: userRow.uid,
          email: userRow.email,
          display_name: userRow.display_name,
          profile_picture_url: userRow.profile_picture_url,
          role: userRow.role,
        }
      : null;

    if (user) {
      await new Promise((resolve, reject) => {
        req.login(user, (err) => (err ? reject(err) : resolve()));
      });
    }

    res.json({ verified: true, user });
  } catch (err) {
    console.error('Passkey recovery verify error:', err);
    res.status(500).json({ message: 'Failed to verify recovery' });
  }
});

// --- Management ---

router.get('/api/passkey/credentials', ensureAuth, async (req, res) => {
  try {
    const credentials = await passkeyService.getCredentialsByUserId(req.user.id);
    res.json(credentials);
  } catch (err) {
    console.error('Passkey list error:', err);
    res.status(500).json({ message: 'Failed to list credentials' });
  }
});

router.delete('/api/passkey/credentials/:id', ensureAuth, async (req, res) => {
  try {
    const deleted = await passkeyService.deleteCredential(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Passkey delete error:', err);
    res.status(500).json({ message: 'Failed to delete credential' });
  }
});

module.exports = router;
