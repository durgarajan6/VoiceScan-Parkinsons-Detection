const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve files from root directory

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Mock Edge Impulse Classifier (replace with real one when available)
class EdgeImpulseClassifier {
    _initialized = false;

    async init() {
        if (this._initialized === true) return Promise.resolve();
        this._initialized = true;
        console.log('Mock classifier initialized');
        return Promise.resolve();
    }

    getProjectInfo() {
        return {
            owner: "Demo",
            name: "Parkinsons Speech Analysis",
            version: "1.0.0"
        };
    }

    classify(rawData, debug = false) {
        // Mock classification - replace with real Edge Impulse when available
        const healthyScore = Math.random() * 0.4 + 0.3; // 30-70%
        const parkinsonScore = 1 - healthyScore;
        
        return {
            anomaly: parkinsonScore > 0.6,
            results: [
                { label: "healthy", value: healthyScore },
                { label: "parkinson", value: parkinsonScore }
            ]
        };
    }
}

// Initialize classifier
const classifier = new EdgeImpulseClassifier();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/text', (req, res) => {
    const readingText = "The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other. Then the North Wind blew as hard as he could, but the more he blew the more closely did the traveler fold his cloak around him; and at last the North Wind gave up the attempt. Then the Sun shone out warmly, and immediately the traveler took off his cloak. And so the North Wind was obliged to confess that the Sun was the stronger of the two.";
    
    res.json({ text: readingText });
});

// Audio processing functions
async function extractFeaturesFromAudio(audioBuffer) {
    // Mock feature extraction - replace with real audio processing
    // In a real implementation, you'd:
    // 1. Decode audio to PCM
    // 2. Apply windowing
    // 3. Extract MFCC, spectral features, etc.
    // 4. Normalize features
    
    const numFeatures = 128; // Adjust based on your model requirements
    const features = [];
    
    // Generate mock features with some variation based on file size
    const seed = audioBuffer.length % 1000;
    for (let i = 0; i < numFeatures; i++) {
        features.push((Math.sin(seed + i) + Math.random() * 0.5) * 0.5);
    }
    
    return features;
}

function processAudioFile(filePath) {
    return new Promise(async (resolve, reject) => {
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error('Audio file not found');
            }
            
            // Read the audio file
            const audioBuffer = fs.readFileSync(filePath);
            
            // Extract features
            const features = await extractFeaturesFromAudio(audioBuffer);
            
            resolve(features);
        } catch (error) {
            console.error('Audio processing error:', error);
            reject(error);
        }
    });
}

app.post('/api/analyze-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No audio file uploaded' 
            });
        }

        console.log('Processing audio file:', req.file.filename);
        
        // Process the audio file
        const features = await processAudioFile(req.file.path);
        
        // Run classification
        const result = classifier.classify(features);
        
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        // Interpret results for Parkinson's detection
        const interpretation = interpretResults(result);
        
        console.log('Analysis complete:', interpretation);
        
        res.json({
            success: true,
            result: result,
            interpretation: interpretation
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        
        // Clean up file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Failed to analyze audio',
            details: error.message 
        });
    }
});

function interpretResults(result) {
    // Find the Parkinson's classification result
    const parkinsonResult = result.results.find(r => 
        r.label.toLowerCase().includes('parkinson') || 
        r.label.toLowerCase().includes('positive')
    );
    
    const healthyResult = result.results.find(r => 
        r.label.toLowerCase().includes('healthy') || 
        r.label.toLowerCase().includes('negative')
    );
    
    let hasParkinson = false;
    let confidence = 0;
    let message = '';
    
    if (parkinsonResult) {
        hasParkinson = parkinsonResult.value > 0.5;
        confidence = hasParkinson ? parkinsonResult.value : (healthyResult ? healthyResult.value : 1 - parkinsonResult.value);
        
        if (hasParkinson) {
            message = `Analysis detected speech patterns that may indicate Parkinson's disease (${(parkinsonResult.value * 100).toFixed(1)}% confidence). This is a screening tool only - please consult with a healthcare professional for proper medical evaluation and diagnosis.`;
        } else {
            message = `Analysis did not detect significant indicators of Parkinson's disease in the speech patterns (${(confidence * 100).toFixed(1)}% confidence in healthy classification). Remember that this is a screening tool and cannot replace professional medical advice.`;
        }
    } else {
        // Fallback if no clear classification
        hasParkinson = result.anomaly || false;
        confidence = 0.5;
        message = "Analysis completed but results are inconclusive. Please consult with a healthcare professional for proper evaluation.";
    }
    
    return {
        hasParkinson: hasParkinson,
        confidence: confidence,
        message: message
    };
}

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
    console.log('Created uploads directory');
}

// Initialize the classifier and start server
classifier.init().then(() => {
    const project = classifier.getProjectInfo();
    console.log('Classifier initialized:', project.owner + ' / ' + project.name);
    
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Failed to initialize classifier:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
});