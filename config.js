// Configuration file for your Edge Impulse model
// You'll need to adjust these values based on your specific model

const config = {
    // Audio preprocessing settings - check your Edge Impulse project
    audio: {
        sampleRate: 16000,          // Sample rate used during training
        windowSize: 1024,           // Window size for feature extraction
        hopLength: 512,             // Hop length between windows
        numMFCC: 13,               // Number of MFCC coefficients
        numFeatures: 13,           // Total number of features expected by model
        preEmphasis: 0.97,         // Pre-emphasis filter coefficient
        minFreq: 0,                // Minimum frequency for mel filter bank
        maxFreq: 8000,             // Maximum frequency for mel filter bank
        numMelFilters: 26          // Number of mel filter banks
    },

    // Model inference settings
    model: {
        inputLength: 13,           // Expected input feature length
        threshold: 0.5,            // Classification threshold
        labels: ['healthy', 'parkinsons'] // Adjust based on your model labels
    },

    // File upload settings
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB max file size
        allowedFormats: ['.wav', '.mp3', '.m4a', '.ogg'],
        tempDir: './uploads'
    }
};

module.exports = config;