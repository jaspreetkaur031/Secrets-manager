// src/lib/crypto.js

/**
 * Generates a deterministic SHA-256 hash of a value.
 * Used for comparing secrets across environments without decrypting them.
 */
export async function generateValueHash(plainText) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derives a cryptographic key from a project passphrase.
 */
// async function deriveKey(passphrase, salt) {
//     const encoder = new TextEncoder();
//     const keyMaterial = await crypto.subtle.importKey(
//         "raw",
//         encoder.encode(passphrase),
//         "PBKDF2",
//         false,
//         ["deriveKey"]
//     );

//     return crypto.subtle.deriveKey(
//         {
//             name: "PBKDF2",
//             salt: encoder.encode(salt),
//             iterations: 100000,
//             hash: "SHA-256",
//         },
//         keyMaterial,
//         { name: "AES-GCM", length: 256 },
//         false,
//         ["encrypt", "decrypt"]
//     );
// }

// ***************************Updated*******************************
// src/lib/crypto.js

async function deriveKey(passphrase, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            // FIX: Use the raw salt bytes directly
            salt: salt, 
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts a secret value using AES-GCM.
 */
export async function encryptSecret(plainText, projectPassphrase) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(projectPassphrase, salt);

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(plainText)
    );

    // return `${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;

    return `${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

/**
 * Decrypts a stored secret string.
 */
export async function decryptSecret(encryptedData, projectPassphrase) {
    const [saltStr, ivStr, cipherStr] = encryptedData.split(':');
    const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivStr), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(cipherStr), c => c.charCodeAt(0));

    const key = await deriveKey(projectPassphrase, salt);

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}