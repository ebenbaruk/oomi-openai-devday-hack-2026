import Foundation

/// Sends one recorded question to `POST /api/turn` and returns the approved answer.
struct TurnClient {
    enum ClientError: LocalizedError {
        case badURL, unauthorized, server(Int), decoding

        var errorDescription: String? {
            switch self {
            case .badURL: return "Server address is not valid."
            case .unauthorized: return "Access code refused."
            case .server(let code): return "Server error \(code)."
            case .decoding: return "Unexpected server reply."
            }
        }
    }

    let serverURL: String
    let accessCode: String
    let language: String
    var session: URLSession = .shared

    static func makeRequest(serverURL: String, accessCode: String, body: TurnRequest) throws -> URLRequest {
        guard var components = URLComponents(string: serverURL) else { throw ClientError.badURL }
        components.path = "/api/turn"
        guard let url = components.url else { throw ClientError.badURL }
        var request = URLRequest(url: url, timeoutInterval: 45)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(accessCode, forHTTPHeaderField: turnAccessHeader)
        request.httpBody = try JSONEncoder().encode(body)
        return request
    }

    func send(audioFile: URL, mimeType: String = "audio/mp4") async throws -> TurnResponse {
        let data = try Data(contentsOf: audioFile)
        let body = TurnRequest(
            audio: .init(base64: data.base64EncodedString(), mimeType: mimeType),
            language: language,
            deviceId: "apple-watch"
        )
        let request = try Self.makeRequest(serverURL: serverURL, accessCode: accessCode, body: body)
        let (payload, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw ClientError.decoding }
        if http.statusCode == 401 { throw ClientError.unauthorized }
        guard (200..<300).contains(http.statusCode) else { throw ClientError.server(http.statusCode) }
        do { return try JSONDecoder().decode(TurnResponse.self, from: payload) } catch { throw ClientError.decoding }
    }
}
