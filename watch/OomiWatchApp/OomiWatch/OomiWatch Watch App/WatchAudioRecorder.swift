import AVFoundation

@MainActor
final class WatchAudioRecorder: NSObject, ObservableObject {
    @Published private(set) var isRecording = false
    private var recorder: AVAudioRecorder?
    private var recordingURL: URL?

    func start() async throws {
        guard !isRecording else { return }
        let granted = await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { continuation.resume(returning: $0) }
        }
        guard granted else { throw WatchRecordingError.microphoneUnavailable }

        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.record, mode: .measurement)
        try session.setActive(true)

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("oomi-turn-\(UUID().uuidString).m4a")
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatMPEG4AAC,
            AVSampleRateKey: 16_000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
        ]
        let recorder = try AVAudioRecorder(url: url, settings: settings)
        recorder.prepareToRecord()
        guard recorder.record() else { throw WatchRecordingError.cannotStart }
        self.recorder = recorder
        recordingURL = url
        isRecording = true
    }

    func stop() -> URL? {
        guard isRecording else { return nil }
        recorder?.stop()
        recorder = nil
        isRecording = false
        return recordingURL
    }

    func discard() {
        recorder?.stop()
        recorder = nil
        isRecording = false
        if let recordingURL { try? FileManager.default.removeItem(at: recordingURL) }
        recordingURL = nil
    }
}

enum WatchRecordingError: LocalizedError {
    case microphoneUnavailable
    case cannotStart

    var errorDescription: String? {
        switch self {
        case .microphoneUnavailable: "Oomi a besoin du micro pour écouter."
        case .cannotStart: "Je n'arrive pas à écouter pour le moment."
        }
    }
}
