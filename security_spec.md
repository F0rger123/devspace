# Security Specification: Spatial Gesture Cloud Sync & Macro Library Sharing

This document specifies the security requirements, data invariants, and attack surface validation for the cloud-sync and macro-sharing sub-systems.

## 1. Data Invariants

### 1.1 Kinetic Configuration Cloud-Sync (`kinetic_configs`)
* **Identity Lock**: A user's gesture configuration document can only exist under `/kinetic_configs/{userId}` where `{userId}` is exactly their authenticated Firebase Auth User ID (`request.auth.uid`). No cross-user access or writing is allowed.
* **Immutability of Owner ID**: The `userId` field inside the document must be immutable once created, matching the document path variable.
* **Type and Size Safeguards**: 
  - `kineticGestures` must be a list of maps. Each item representing a gesture must be limited in count (`kineticGestures.size() <= 40`) to prevent denial-of-wallet resource bloat.
  - Sensitivity settings must be numeric values constrained to valid operational bounds (e.g. `swipeSensitivity` between 15 and 60, `waveSensitivity` between 15 and 60).

### 1.2 Shared Macros & Libraries (`shared_macros`)
* **Creator Binding**: The document creator ID (`creatorId`) must match the authenticated user's ID (`request.auth.uid`). Users cannot share/upload macros masquerading as someone else.
* **Public Accessibility**: Anyone authenticated can read/list public shared macros.
* **Modification Restricted**: Only the creator of the shared macro or library is allowed to update or delete it.
* **Structural Safeguards**: 
  - `id` must be a valid alphanumeric string.
  - `title` must be a string with size bounded between 3 and 100 characters.
  - `description` must be a string with size bounded between 10 and 1000 characters.
  - `gestures` must be a non-empty list of valid gesture maps, with size limited to 20 to prevent extreme document payloads.

---

## 2. The "Dirty Dozen" Payloads

The following attack payloads must be rejected by the security rules with `PERMISSION_DENIED`:

### Collection: `kinetic_configs`

#### Payload 1: Identity Spoofing (Save config under another user's document ID)
* **Target Path**: `/kinetic_configs/victim_user_123`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Data**: `{ userId: "victim_user_123", kineticGestures: [], swipeSensitivity: 32 }`
* **Expected**: `PERMISSION_DENIED`

#### Payload 2: Ghost Key Injection (Attempting to write non-existent/unvalidated fields)
* **Target Path**: `/kinetic_configs/attacker_user_456`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Data**: `{ userId: "attacker_user_456", kineticGestures: [], swipeSensitivity: 32, isSystemPremiumAdmin: true }`
* **Expected**: `PERMISSION_DENIED`

#### Payload 3: Value Poisoning (Injecting absurd sensitivity values)
* **Target Path**: `/kinetic_configs/attacker_user_456`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Data**: `{ userId: "attacker_user_456", kineticGestures: [], swipeSensitivity: 99999, waveSensitivity: -50 }`
* **Expected**: `PERMISSION_DENIED`

#### Payload 4: Unauthenticated Configuration Modification
* **Target Path**: `/kinetic_configs/any_user_abc`
* **Auth context**: `Unauthenticated (null)`
* **Data**: `{ userId: "any_user_abc", kineticGestures: [] }`
* **Expected**: `PERMISSION_DENIED`

---

### Collection: `shared_macros`

#### Payload 5: Creator Spoofing (Uploading a macro library claiming to be created by another user)
* **Target Path**: `/shared_macros/macro_test_999`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Data**: `{ id: "macro_test_999", title: "Awesome Macros", description: "Useful shortcuts", creatorId: "victim_user_123", creatorName: "Victim", gestures: [], likesCount: 0, createdAt: 12345678 }`
* **Expected**: `PERMISSION_DENIED`

#### Payload 6: Malicious String Bloating (Resource Exhaustion / Denial of Wallet)
* **Target Path**: `/shared_macros/macro_test_999`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Data**: `{ id: "macro_test_999", title: "A".repeat(5000), description: "Spam", creatorId: "attacker_user_456", creatorName: "Attacker", gestures: [], likesCount: 0, createdAt: 12345678 }`
* **Expected**: `PERMISSION_DENIED`

#### Payload 7: Unauthorized Macro Library Mutation (Modify someone else's shared library)
* **Target Path**: `/shared_macros/victim_shared_macro_id`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Existing Resource**: `{ creatorId: "victim_user_123", title: "My Cool Macro" }`
* **Data**: `{ id: "victim_shared_macro_id", title: "Hacked Title", description: "Vandalism Description", creatorId: "victim_user_123", gestures: [] }`
* **Expected**: `PERMISSION_DENIED`

#### Payload 8: Unauthorized Macro Library Deletion (Delete someone else's library)
* **Target Path**: `/shared_macros/victim_shared_macro_id`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Existing Resource**: `{ creatorId: "victim_user_123", title: "My Cool Macro" }`
* **Action**: `DELETE`
* **Expected**: `PERMISSION_DENIED`

#### Payload 9: Shadow Field Modification (Directly editing/incrementing likesCount or downloadsCount on shared items to artificially boost rankings)
* **Target Path**: `/shared_macros/my_own_macro_id`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Existing Resource**: `{ id: "my_own_macro_id", creatorId: "attacker_user_456", title: "Cool Macros", likesCount: 5 }`
* **Data**: `{ id: "my_own_macro_id", creatorId: "attacker_user_456", title: "Cool Macros", likesCount: 999999 }`
* **Expected**: `PERMISSION_DENIED` (Counter values can only be incremented or modified via transactional paths, or must be protected/restricted)

#### Payload 10: Unauthenticated Library Retrieval (Accessing libraries when not signed in)
* **Target Path**: `/shared_macros/some_macro_id`
* **Auth context**: `Unauthenticated (null)`
* **Action**: `GET / LIST`
* **Expected**: `PERMISSION_DENIED`

#### Payload 11: Invalid ID Poisoning (Creating library with non-alphanumeric or massive ID)
* **Target Path**: `/shared_macros/INVALID_ID_#$@_EXPLOIT_LONG_CHARACTER_STRING`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Data**: `{ id: "INVALID_ID_#$@_EXPLOIT_LONG_CHARACTER_STRING", title: "Exploit", description: "Testing ID boundaries", creatorId: "attacker_user_456", gestures: [] }`
* **Expected**: `PERMISSION_DENIED`

#### Payload 12: Empty or Massive Macro Chain Injection
* **Target Path**: `/shared_macros/macro_test_999`
* **Auth context**: `uid: "attacker_user_456", email_verified: true`
* **Data**: `{ id: "macro_test_999", title: "Exploit", description: "Too many steps", creatorId: "attacker_user_456", gestures: Array(100).fill({ id: 'gesture', name: 'g' }) }`
* **Expected**: `PERMISSION_DENIED`

---

## 3. Test Runner (Draft Rules Verification spec)

A validation logic block has been incorporated into the Firestore security rules. We will implement these security parameters directly in `/firestore.rules` and assert structural validity.
