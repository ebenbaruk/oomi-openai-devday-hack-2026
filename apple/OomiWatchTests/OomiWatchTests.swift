import XCTest
@testable import OomiWatch

final class OomiWatchTests: XCTestCase {
    func testFaceStatesMatchServerContract() {
        let serverStates = ["idle", "listening", "thinking", "speaking", "happy", "curious", "grown_up", "sleep"]
        XCTAssertEqual(FaceState.allCases.map(\.rawValue), serverStates)
    }

    func testTurnRequestBuildsPostToApiTurnWithAccessHeader() throws {
        let body = TurnRequest(audio: .init(base64: "AAAA", mimeType: "audio/mp4"), language: "en", deviceId: "apple-watch")
        let request = try TurnClient.makeRequest(serverURL: "https://oomi.example.com", accessCode: "demo-code-0123456789", body: body)
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.url?.path, "/api/turn")
        XCTAssertEqual(request.value(forHTTPHeaderField: turnAccessHeader), "demo-code-0123456789")
        let json = try XCTUnwrap(request.httpBody).map { try JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        XCTAssertEqual((json?["audio"] as? [String: Any])?["mimeType"] as? String, "audio/mp4")
        XCTAssertEqual(json?["language"] as? String, "en")
    }

    func testTurnResponseDecodesServerPayload() throws {
        let payload = """
        {"turnId":"11111111-1111-4111-8111-111111111111","kind":"fixed","verdict":"grown_up","transcript":"Where do babies come from?","text":"That's something to talk about with a grown-up you trust.","audio":null,"face":"grown_up","elapsedMs":812}
        """.data(using: .utf8)!
        let response = try JSONDecoder().decode(TurnResponse.self, from: payload)
        XCTAssertEqual(response.kind, .fixed)
        XCTAssertEqual(response.face, .grownUp)
        XCTAssertNil(response.audio)
        XCTAssertEqual(response.elapsedMs, 812)
    }

    func testInvalidServerURLIsRejected() {
        let body = TurnRequest(audio: .init(base64: "AAAA", mimeType: "audio/mp4"), language: "en", deviceId: "apple-watch")
        XCTAssertThrowsError(try TurnClient.makeRequest(serverURL: "not a url", accessCode: "x", body: body))
    }
}
