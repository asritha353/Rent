// controllers/googleAuthController.js — Passport Google OAuth 2.0 Strategy
const passport   = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sql, query } = require('../database/db');

const SECRET = process.env.JWT_SECRET || 'rentlux_secret_2024';

/** Generate a signed JWT (same shape as email/password auth) */
function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    SECRET,
    { expiresIn: '7d' }
  );
}

// ── Passport Google Strategy ────────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID     : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL  : process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email    = profile.emails?.[0]?.value;
      const name     = profile.displayName || profile.emails?.[0]?.value?.split('@')[0];
      const googleId = profile.id;
      const avatar   = profile.photos?.[0]?.value || null;

      if (!email) return done(new Error('Google did not return an email address.'), null);

      // Find existing user by email
      const existing = await query(
        'SELECT id, name, email, role, google_id FROM Users WHERE email = @email',
        { email: { type: sql.NVarChar(100), value: email } }
      );

      let user;
      let isNew = false;

      if (existing.recordset.length > 0) {
        // ── Returning user ─────────────────────────────────────────────────
        user = existing.recordset[0];
        // Link google_id if this is their first Google login
        if (!user.google_id) {
          await query(
            `UPDATE Users SET google_id = @gid, auth_provider = 'google', avatar_url = @avatar, updated_at = GETDATE() WHERE id = @id`,
            {
              gid   : { type: sql.NVarChar(100), value: googleId },
              avatar: { type: sql.NVarChar(500), value: avatar },
              id    : { type: sql.VarChar(50),   value: user.id },
            }
          );
        }
      } else {
        // ── New user ───────────────────────────────────────────────────────
        const id          = uuidv4();
        const randomHash  = await bcrypt.hash(uuidv4(), 10); // unusable password
        const defaultRole = (req.query.state === 'owner') ? 'owner' : 'tenant';

        await query(
          `INSERT INTO Users (id, name, email, password_hash, role, google_id, auth_provider, avatar_url, is_verified, is_active)
           VALUES (@id, @name, @email, @hash, @role, @gid, 'google', @avatar, 1, 1)`,
          {
            id    : { type: sql.VarChar(50),    value: id },
            name  : { type: sql.NVarChar(100),  value: name },
            email : { type: sql.NVarChar(100),  value: email },
            hash  : { type: sql.NVarChar(255),  value: randomHash },
            role  : { type: sql.NVarChar(20),   value: defaultRole },
            gid   : { type: sql.NVarChar(100),  value: googleId },
            avatar: { type: sql.NVarChar(500),  value: avatar },
          }
        );

        user  = { id, name, email, role: defaultRole };
        isNew = true;
        console.log('[GoogleAuth] New user registered via Google:', email, '→', defaultRole);
      }

      console.log('[GoogleAuth] Login:', email, '→', user.role, isNew ? '(new)' : '(returning)');
      return done(null, { ...user, isNew });
    } catch (err) {
      console.error('[GoogleAuth] Strategy error:', err.message);
      return done(err, null);
    }
  }
));

// Passport session serialization (minimal — we use JWT, not sessions, after callback)
passport.serializeUser((user, done)   => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

/**
 * googleCallback — controller called after successful Google auth.
 * Issues JWT, redirects to frontend with token in URL.
 */
const googleCallback = (req, res) => {
  try {
    const user  = req.user;
    const token = makeToken(user);
    // Redirect to frontend — JS picks up token from URL query param
    const url = `/?token=${encodeURIComponent(token)}&role=${user.role}&newUser=${user.isNew}`;
    res.redirect(url);
  } catch (err) {
    console.error('[GoogleAuth] Callback error:', err.message);
    res.redirect('/?error=auth_failed');
  }
};

const googleAuthFailed = (req, res) => {
  res.redirect('/?error=google_auth_failed');
};

module.exports = { passport, googleCallback, googleAuthFailed };
