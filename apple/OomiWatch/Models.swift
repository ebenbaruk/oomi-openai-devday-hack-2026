import Foundation

/// Mirror of `faceStates` in src/lib/contracts.ts. Keep the raw values identical to the server.
enum FaceState: String, Codable, CaseIterable {
    case idle, listening, thinking, speaking, happy, curious, grownUp = "grown_up", sleep
}

/// Mirror of `turnRequestSchema` in src/lib/turn.ts.
struct TurnRequest: Encodable {
    struct Audio: Encodable {
        let base64: String
        let mimeType: String
    }
    let audio: Audio
    let language: String
    let deviceId: String
}

/// Mirror of `turnResponseSchema` in src/lib/turn.ts.
struct TurnResponse: Decodable, Equatable {
    struct Audio: Decodable, Equatable {
        let base64: String
        let mimeType: String
    }
    enum Kind: String, Decodable { case answer, fixed, ignored }

    let turnId: String
    let kind: Kind
    let verdict: String?
    let transcript: String
    let text: String
    let audio: Audio?
    let face: FaceState
    let elapsedMs: Int
}

/// Header name shared with the server (TURN_ACCESS_HEADER).
let turnAccessHeader = "x-oomi-access-code"
