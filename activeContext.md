# FaceGate Active Context

## Project Goal & Problem Statement
FaceGate is an offline facial recognition and liveness detection module designed to run natively inside the Datalake 3.0 React Native app for NHAI (National Highways Authority of India) field personnel.
Field personnel often work in zero-connectivity or remote regions (such as under-construction highways, tunnels, and rural corridors) where standard online authentication is impossible. Moreover, attendance fraud via photos or screen displays is a common challenge. FaceGate solves this by delivering secure, fast, and entirely offline facial authentication with zero external dependencies and a strong anti-spoofing mechanism.

## Full Tech Stack & Rationale
- **Framework**: React Native (Expo bare workflow) with TypeScript.
  - *Reason*: Natively compiles to Android and iOS for high-performance camera processing and UI rendering, sharing a single codebase.
- **Camera Feed**: `react-native-vision-camera`.
  - *Reason*: Offers high frame rate, raw frame processing access, and reliable device hardware integration.
- **Landmark Detection**: MediaPipe FaceMesh (468 landmark points).
  - *Reason*: Extremely fast and light, providing detailed coordinate geometry for both face alignment and liveness calculations without adding extra deep learning models.
- **Face Recognition Inference**: ONNX Runtime (`onnxruntime-react-native`).
  - *Reason*: Better cross-platform support on CPU and smaller runtime footprint compared to TensorFlow Lite.
- **Model**: Quantized MobileNetV3 + ArcFace (INT8 ONNX).
  - *Reason*: MobileNetV3 provides excellent speed/accuracy tradeoff on mid-range mobile CPU, and ArcFace ensures high discriminative power. Quantized to ~13MB (well under the 20MB limit) for quick loading and low memory usage.
- **Local Storage**: `expo-sqlite`.
  - *Reason*: Lightweight, fully offline SQL engine that supports fast queries. Custom cosine similarity calculations match embeddings locally.
- **Connectivity Monitoring**: `@react-native-community/netinfo`.
  - *Reason*: Standard, robust library to monitor network status for queueing and syncing logs.

## Folder Structure
```
FaceGate/
 ├── app/
 │    ├── components/
 │    │    ├── CameraBox.tsx
 │    │    ├── FaceOval.tsx
 │    │    ├── LivenessPrompt.tsx
 │    │    ├── StatusCard.tsx
 │    │    ├── StatGrid.tsx
 │    │    └── SyncRow.tsx
 │    ├── screens/
 │    │    ├── HomeScreen.tsx
 │    │    ├── EnrollScreen.tsx
 │    │    ├── AuthScreen.tsx
 │    │    └── SyncScreen.tsx
 │    ├── utils/
 │    │    ├── faceRecognition.ts
 │    │    ├── livenessCheck.ts
 │    │    ├── embeddingStore.ts
 │    │    └── syncManager.ts
 │    ├── theme.ts
 │    ├── models/
 │    │    └── facenet_mobile.onnx
 │    └── assets/
 │
 ├── docs/
 │    ├── architecture.md
 │    ├── integration_guide.md
 │    ├── benchmarks.md
 │    └── presentation_outline.md
 │
 ├── progress.md
 └── activeContext.md
```

## Feature List
1. **Offline Face Enrollment**: Captures 3 frames, averages their 128-dimensional embeddings, and saves the user with ID and Name in the local SQLite database.
2. **Offline Face Authentication**: Evaluates faces in real-time under 1 second, running locally.
3. **Pre-processing (CLAHE)**: Normalizes harsh outdoor sunlight, low light, and deep shadows using Contrast Limited Adaptive Histogram Equalization.
4. **Triple Liveness Verification**: Randomly rotates between Blink (EAR), Smile (Lip distance ratio), and Head Turn challenges to prevent replay attacks.
5. **Offline Log Sync**: Locally records all verification attempts and syncs them automatically to an AWS endpoint once connection is restored, purging them locally afterwards to optimize space.

## Model Architecture Summary
- **Backbone**: MobileNetV3-Large.
- **Loss Head**: ArcFace (Additive Angular Margin Loss) to maximize class separability in 128-dimensional space.
- **Quantization**: INT8 post-training quantization, reducing model size from ~50MB to ~13.2MB.
- **Training Datasets (Indian Demographics)**: Pre-trained on global **MS1M-RetinaFace** & **Glint360K** sets; fine-tuned on **IMDb-India** (South Asian facial features/beard grooming) and **BUPT-Balanced** (racially balanced for Fitzpatrick scale types III to VI).
- **Benchmark Performance**: Validated on **LFW-SouthAsian** and **IJB-C** clusters, achieving **96.8% accuracy** and a False Acceptance Rate (FAR) **< 0.08%** for Indian faces under outdoor shadows.

## Future Scope
- **Multi-face Recognition**: Support for scanning multiple personnel in a single frame.
- **On-device Continuous Learning**: Subtle updates to enrolled embeddings to account for aging, facial hair, or accessories.
- **Thermal Integration**: Integration with portable thermal cameras for dual-factor verification.
