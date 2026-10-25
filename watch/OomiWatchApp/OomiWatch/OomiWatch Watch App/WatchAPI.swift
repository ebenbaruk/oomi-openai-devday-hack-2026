import Foundation

struct WatchTurn: Decodable {
    let turnId: UUID
    let verdict: String
    let state: String
    let text: String
    let audioBase64: String?
    let audioMimeType: String?
}

enum WatchAPIError: LocalizedError {
    case serverURLRequired
    case pairingCodeRequired
    case server(String)
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .serverURLRequired: "Ajoute l'adresse sécurisée d'Oomi dans les réglages."
        case .pairingCodeRequired: "Ajoute le code à 6 chiffres créé dans le dashboard parent."
        case .server(let message): message
        case .invalidResponse: "Oomi n'a pas pu répondre pour le moment."
        }
    }
}

struct WatchAPI {
    func send(audioURL: URL, serverURL: String, pairingCode: String) async throws -> WatchTurn {
        let code = pairingCode.filter(\.isNumber)
        guard code.range(of: "^[0-9]{6}$", options: .regularExpression) != nil else { throw WatchAPIError.pairingCodeRequired }
        guard var components = URLComponents(string: serverURL.trimmingCharacters(in: .whitespacesAndNewlines)),
              components.scheme == "https", components.host != nil else { throw WatchAPIError.serverURLRequired }
        components.path = ""
        components.query = nil
        components.fragment = nil
        guard let base = components.url else { throw WatchAPIError.serverURLRequired }

        let endpoint = base.appendingPathComponent("api/watch/turn")
        let boundary = "OomiWatch-\(UUID().uuidString)"
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.timeoutInterval = 45
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = try multipartBody(audioURL: audioURL, pairingCode: code, boundary: boundary)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw WatchAPIError.invalidResponse }
        if !(200..<300).contains(http.statusCode) {
            let message = (try? JSONDecoder().decode(ServerError.self, from: data))?.error ?? "Oomi est indisponible."
            throw WatchAPIError.server(message)
        }
        return try JSONDecoder().decode(WatchTurn.self, from: data)
    }

    private func multipartBody(audioURL: URL, pairingCode: String, boundary: String) throws -> Data {
        var body = Data()
        func append(_ value: String) { body.append(value.data(using: .utf8)!) }
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"pairingCode\"\r\n\r\n")
        append("\(pairingCode)\r\n")
        append("--\(boundary)\r\n")
        append("Content-Disposition: form-data; name=\"audio\"; filename=\"watch-turn.m4a\"\r\n")
        append("Content-Type: audio/mp4\r\n\r\n")
        body.append(try Data(contentsOf: audioURL))
        append("\r\n--\(boundary)--\r\n")
        return body
    }
}

private struct ServerError: Decodable { let error: String }
