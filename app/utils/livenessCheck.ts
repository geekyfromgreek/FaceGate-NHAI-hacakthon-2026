export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type LivenessChallenge = 'BLINK' | 'SMILE' | 'HEAD_TURN';

/**
 * Calculates Euclidean distance between two 3D coordinates.
 */
function distance3D(p1: Point3D, p2: Point3D): number {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
}

/**
 * Blink Detection using Eye Aspect Ratio (EAR)
 * Formula: EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
 * 
 * MediaPipe indices for left eye standard landmarks:
 * p1: 362 (inner corner), p4: 263 (outer corner)
 * p2: 385, p3: 386 (upper eyelid)
 * p6: 380, p5: 374 (lower eyelid)
 * 
 * Returns true if EAR falls below the 0.25 threshold.
 */
export function checkBlink(landmarks: Point3D[]): boolean {
  if (landmarks.length < 468) return false;
  
  // Left eye landmarks
  const p1 = landmarks[362];
  const p2 = landmarks[385];
  const p3 = landmarks[386];
  const p4 = landmarks[263];
  const p5 = landmarks[374];
  const p6 = landmarks[380];
  
  const vertical1 = distance3D(p2, p6);
  const vertical2 = distance3D(p3, p5);
  const horizontal = distance3D(p1, p4);
  
  if (horizontal === 0) return false;
  
  const ear = (vertical1 + vertical2) / (2.0 * horizontal);
  
  // Threshold of 0.25 indicates closed eye/blink
  return ear < 0.25;
}

/**
 * Smile Detection using outer lip corner distance.
 * Left corner: index 61, Right corner: index 291.
 * Normalizes based on face width (distance between outer eye corners: 33 and 263).
 * 
 * Returns true if the ratio exceeds the smile threshold.
 */
export function checkSmile(landmarks: Point3D[]): boolean {
  if (landmarks.length < 468) return false;
  
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];
  
  // Face width points (outer cheekbones/corners)
  const faceLeft = landmarks[234];
  const faceRight = landmarks[454];
  
  const mouthWidth = distance3D(leftCorner, rightCorner);
  const faceWidth = distance3D(faceLeft, faceRight);
  
  if (faceWidth === 0) return false;
  
  const smileRatio = mouthWidth / faceWidth;
  
  // Standard smile ratio threshold (resting is ~0.35, smile is >0.45)
  return smileRatio > 0.45;
}

/**
 * Head Turn Detection using Nose Tip (index 1) relative to face center.
 * Face center is estimated using midpoint of left jaw (index 172) and right jaw (index 397).
 * Face width is distance between index 234 and index 454.
 * 
 * Returns true if nose tip is offset by more than 15% of face width to either side.
 */
export function checkHeadTurn(landmarks: Point3D[]): boolean {
  if (landmarks.length < 468) return false;
  
  const noseTip = landmarks[1];
  const faceLeft = landmarks[234];
  const faceRight = landmarks[454];
  
  const faceCenterX = (faceLeft.x + faceRight.x) / 2;
  const faceWidth = Math.abs(faceRight.x - faceLeft.x);
  
  if (faceWidth === 0) return false;
  
  const noseOffset = Math.abs(noseTip.x - faceCenterX);
  const turnPercentage = noseOffset / faceWidth;
  
  // Threshold: offset exceeds 15% of face width
  return turnPercentage > 0.15;
}

/**
 * Randomly selects one challenge for the active liveness session.
 */
export function getRandomChallenge(): LivenessChallenge {
  const challenges: LivenessChallenge[] = ['BLINK', 'SMILE', 'HEAD_TURN'];
  const randomIndex = Math.floor(Math.random() * challenges.length);
  return challenges[randomIndex];
}
