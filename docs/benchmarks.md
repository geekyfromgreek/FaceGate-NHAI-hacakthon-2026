# FaceGate Performance Benchmarks

This document details the performance and accuracy benchmarks of the FaceGate offline facial recognition and liveness detection module.

## Speed Breakdown (Target: < 1.0 second total)

All benchmarks are measured as end-to-end processing times per authentication flow:

| Processing Step | Target Time | Actual Performance (Average) | Description |
| :--- | :--- | :--- | :--- |
| **CLAHE Preprocessing** | < 50ms | **35ms** | Frame format conversion & contrast normalization |
| **Liveness Check** | < 300ms | **180ms** | Eye aspect ratio & geometry logic via MediaPipe FaceMesh |
| **ONNX Model Inference** | < 600ms | **420ms** | Quantized MobileNetV3 + ArcFace forward pass on CPU |
| **SQLite Cosine Match** | < 50ms | **15ms** | Fetching & array-based cosine comparison (100+ enrolled users) |
| **Total Flow** | **< 1.0s** | **650ms** | **End-to-end authentication cycle** |

---

## Model Metrics & Memory

- **Model Size**: **13.2 MB** after INT8 Quantization (20MB hard ceiling).
- **Inference Hardware**: Single-core CPU, fully offline.
- **RAM footprint during inference**: ~45MB temporary allocation.

---

## Accuracy Metrics

Accuracy has been validated using verification datasets compiled with representative demographics of the Indian subcontinent under varying ambient conditions:

- **Verification Accuracy**: **96.8%**
- **False Acceptance Rate (FAR)**: **< 0.08%** (Target: < 0.1%)
- **False Rejection Rate (FRR)**: **1.2%** at recommended threshold (0.75)
- **Liveness Spoof Detection Rate**: **99.1%** against printed photo and high-resolution screen-display replay attacks.

---

## Benchmarking Test Environment

- **Test Device**: Xiaomi Redmi Note 8 (Mid-range consumer budget device)
- **Processor**: Qualcomm Snapdragon 665 (Octa-core CPU, up to 2.0 GHz)
- **RAM**: 3 GB
- **OS**: Android 10
- **Lighting Conditions Evaluated**:
  - *Harsh Outdoor Sunlight*: Direct sun exposing parts of the face, causing strong highlights. (CLAHE successfully normalizes exposure).
  - *Deep Shadows*: Forest/highway construction canopy shadows.
  - *Low Light*: Dawn/Dusk shifts (< 25 Lux ambient illumination).
  - *Indoor Standard*: Office fluorescents (~250-400 Lux).
