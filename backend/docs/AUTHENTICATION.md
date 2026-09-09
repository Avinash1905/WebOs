# WebOS Authentication & Password Security (Module 3)
**Cryptographic Identity, Timing-Safe Verification & Progressive Lockout**

---

## 1. Cryptographic Password Hashing

WebOS mandates the use of memory-hard key derivation functions to withstand ASIC and GPU brute-force attacks:

* **Primary Algorithm**: `scrypt` via Node.js native `crypto.scrypt`.
  - CPU/memory cost parameter ($N$): `16,384` ($2^{14}$).
  - Block size parameter ($r$): `8` (1024 bytes).
  - Parallelization parameter ($p$): `1`.
  - Output Key Length: `64` bytes (512 bits).
  - Salt Length: `32` bytes (256 bits) from cryptographically secure pseudorandom number generator (`crypto.randomBytes`).
* **Fallback Algorithm**: `PBKDF2` with HMAC-SHA512 at `100,000` iterations for legacy compatibility.
* **Storage Format**: Encoded in modular crypt format:
  ```text
  $scrypt$N=16384,r=8,p=1$<salt_hex>$<derived_key_hex>
  ```

### Constant-Time Verification
All password evaluations utilize `crypto.timingSafeEqual` across identical buffer lengths:
```typescript
const isMatch = crypto.timingSafeEqual(storedKeyBuffer, derivedKeyBuffer);
```
To mitigate username enumeration timing attacks, authentication attempts against non-existent users execute dummy key derivations with consistent work factors before failing.

---

## 2. Password Strength & Breached Credential Policy

The `PasswordValidator` enforces NIST SP 800-63B guidelines:
1. **Minimum Length**: 8 characters (maximum 128 characters).
2. **Character Diversity**: Requires at least one uppercase letter, one lowercase letter, one number, and one special character.
3. **Breached Credential Blacklist**: Instantly rejects the top most commonly compromised passwords (`password123`, `admin123`, `qwerty12345`, etc.).
4. **Shannon Entropy**: Calculates character set entropy:
   $$H = L \times \log_2(N)$$
   where $L$ is length and $N$ is pool size. Rejects passwords with entropy scores below 40.

---

## 3. Progressive Account Lockout Engine

To prevent distributed brute-force dictionary attacks:
* **Failure Window**: Tracks failed attempts across a 15-minute sliding window.
* **Threshold**: 5 consecutive failures triggers immediate lockout.
* **Lockout Duration**: Default 15 minutes.
* **Auto-Reset**: A single valid login resets the failed counter to 0 and clears `lockoutUntil`.
* **Lockout Bypass Prevention**: When an account is locked, the authentication service rejects requests immediately with `Account locked` without evaluating password hashes.

---

## 4. High-Entropy Tokens & Database Hashing

Session tokens, password reset tokens, and email verification tokens utilize 256-bit CSPRNG generation:
* **Raw Token**: 32 cryptographically random bytes encoded as URL-safe base64url (`43` characters).
* **Storage Protection**: The raw token is returned **once** to the user. The database stores **only** the SHA-256 hash of the token:
  ```typescript
  const tokenHash = crypto.createHash('sha256').update(rawToken, 'utf8').digest('hex');
  ```
  Even in the event of an unauthorized database dump, tokens cannot be forged or replayed.

---

## 5. Security Audit Logging

All authentication events emit strongly-typed `SecurityEvent` entries:
* `REGISTER_SUCCESS`
* `LOGIN_SUCCESS` / `LOGIN_FAILURE`
* `ACCOUNT_LOCKED` (Severity: `CRITICAL`)
* `LOGOUT`
* `PASSWORD_CHANGE`
* `PASSWORD_RESET_REQUESTED` / `PASSWORD_RESET_COMPLETED`
* `EMAIL_VERIFIED`
