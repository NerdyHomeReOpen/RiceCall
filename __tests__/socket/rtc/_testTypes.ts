// RTC 相關的測試類型定義

// RTC Offer 相關類型
export interface RTCOffer {
  type: 'offer';
  sdp: string;
}

export interface RTCOfferRequest {
  to: string;
  offer: RTCOffer;
}

export interface RTCOfferEvent {
  from: string;
  userId: string;
  offer: RTCOffer;
}

// RTC Answer 相關類型
export interface RTCAnswer {
  type: 'answer';
  sdp: string;
}

export interface RTCAnswerRequest {
  to: string;
  answer: RTCAnswer;
}

export interface RTCAnswerEvent {
  from: string;
  userId: string;
  answer: RTCAnswer;
}

// RTC Candidate 相關類型
export interface RTCCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

export interface RTCCandidateRequest {
  to: string;
  candidate: RTCCandidate | null;
}

export interface RTCCandidateEvent {
  from: string;
  userId: string;
  candidate: RTCCandidate | null;
}
