// controllers/googleAuthController.js — Google OAuth via Passport
const passport   = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sql, query, getPool } = require('../database/db');

const SECRET = process.env.JWT_SECRET || 'rentlux_secret_2024';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    SECRET,
    { expiresIn: '7d' }
  );
}

// ── Configure Passport Google Strategy ────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID    : process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    passReqToCallback: true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email    = profile.emails?.[0]?.value;
      const googleId = profile.id;
      const name     = profile.displayName || email?.split('@')[0] || 'User';
      // Role can be passed as query param during the initial redirect
      const role     = (req.query.state && ['tenant','owner'].includes(req.query.state))
                         ? req.query.state
                         : 'tenant';

      if (!email) return done(new Error('No email from Google'), null);

      // Try find by google_id first, then by email
      let result = await query(
        `SELECT id, name, email, role, google_id FROM Users WHERE google_id = @google_id`,
        { google_id: { type: sql.NVarChar(100), value: googleId } }
      );

      let user;
      let isNew = false;

      if (result.recordset.length > 0) {
        // Existing Google user — log in
        user = result.recordset[0];
      } else {
        // Check if email already registered (local account)
        result = await query(
          `SELECT id, name, email, role, google_id FROM Users WHERE email = @email`,
          { email: { type: sql.NVarChar(100), value: email } }
        );

        if (result.recordset.length > 0) {
          // Link Google to existing account
          user = result.recordset[0];
          await query(
            `UPDATE Users SET google_id = @google_id, auth_provider = 'google' WHERE id = @id`,
            {
              google_id: { type: sql.NVarChar(100), value: googleId },
              id        : { type: sql.VarChar(50),   value: user.id },
            }
          );
        } else {
          // Brand new Google user — create account
          isNew = true;
          const id       = 'u_' + uuidv4();
          // Random unusable password hash (Google users never use password login)
          const randHash = await bcrypt.hash(uuidv4(), 10);

          await query(
            `INSERT INTO Users (id, name, email, password_hash, role, google_id, auth_provider)
             VALUES (@id, @name, @email, @hash, @role, @google_id, 'google')`,
            {
              id       : { type: sql.VarChar(50),    value: id },
              name     : { type: sql.NVarChar(100),  value: name },
              email    : { type: sql.NVarChar(100),  value: email },
              hash     : { type: sql.NVarChar(255),  value: randHash },
              role     : { type: sql.NVarChar(20),   value: role },
              google_id: { type: sql.NVarChar(100),  value: googleId },
            }
          );

          user = { id, name, email, role };
          console.log('[GoogleAuth] New user created:', email, '→', role);
        }
      }

      return done(null, { ...user, isNew });
    } catch (err) {
      console.error('[GoogleAuth] Strategy error:', err.message);
      return done(err, null);
    }
  }
));

// Passport session serialization (minimal — we use JWT, not sessions)
passport.serializeUser((user, done)   => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Route Handlers ─────────────────────────────────────────────────────────

/**
 * GET /api/auth/google?role=tenant|owner
 * Starts the OAuth flow. Role is passed via `state` param.
 */
const initiateGoogleAuth = (req, res, next) => {
  const role  = ['tenant', 'owner'].includes(req.query.role) ? req.query.role : 'tenant';
  passport.authenticate('google', {
    scope : ['profile', 'email'],
    state : role,
    prompt: 'select_account',
  })(req, res, next);
};

/**
 * GET /api/auth/google/callback
 * Google redirects here. We issue a JWT and redirect the browser to the frontend.
 */
const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false, failureRedirect: '/?auth=failed' },
    (err, user) => {
      if (err || !user) {
        console.error('[GoogleAuth] Callback error:', err?.message);
        return res.redirect('/?auth=failed');
      }

      const token = makeToken(user);
      // Redirect to frontend — token carried in URL hash (never in query string for security)
      // Frontend reads this and stores in localStorage
      const isNew = user.isNew ? '1' : '0';
      res.redirect(`/?google_token=${token}&google_role=${user.role}&new_user=${isNew}`);
    }
  )(req, res, next);
};

module.exports = { initiateGoogleAuth, googleCallback, passportInit: passport.initialize() };
