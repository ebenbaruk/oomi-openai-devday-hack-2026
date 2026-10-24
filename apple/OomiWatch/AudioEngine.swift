import AVFoundation
import Foundation

/// Records while the button is held (AAC in an .m4a container, mono, 24 kHz) and plays the approved WAV answer.
@MainActor
final class AudioEngine: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published private(set) var isRecording = false
    @Published private(set) var isPlaying = false

    private var recorder: AVAudioRecorder?
    private var player: AVAudioPlayer?
    private var playbackContinuation: CheckedContinuation<Void, Never>?

    private var fileURL: URL {
        FileManager.default.temporaryDirectory.appendingPathComponent("oomi-question.m4a")
    }

    func requestPermission() async -> Bool {
        await withCheckedContinuation { continuation in
            AVAudioApplication.requestRecordPermission { granted in continuation.resume(returning: granted) }
        }
    }

    func startRecording() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .spokenAudio, options: [.allowBluetoothA2DP, .defaultToSpeaker])
        try session.setActive(true)
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 24_000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue,
        ]
        try? FileManager.default.removeItem(at: fileURL)
        let recorder = try AVAudioRecorder(url: fileURL, settings: settings)
        recorder.record()
        self.recorder = recorder
        isRecording = true
    }

    /// Stops the recorder and returns the file, or nil when the capture was too short to be a question.
    func stopRecording(minimumSeconds: Double = 0.3) -> URL? {
        guard let recorder else { return nil }
        let duration = recorder.currentTime
        recorder.stop()
        self.recorder = nil
        isRecording = false
        return duration >= minimumSeconds ? fileURL : nil
    }

    func discardRecording() {
        recorder?.stop()
        recorder = nil
        isRecording = false
        try? FileManager.default.removeItem(at: fileURL)
    }

    /// Plays approved audio and returns when playback ends. Any new press should call `stopPlayback()` first.
    func play(wavBase64: String) async {
        guard let data = Data(base64Encoded: wavBase64), let player = try? AVAudioPlayer(data: data) else { return }
        stopPlayback()
        try? AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
        player.delegate = self
        self.player = player
        isPlaying = true
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
            playbackContinuation = continuation
            if !player.play() { finishPlayback() }
        }
    }

    func stopPlayback() {
        player?.stop()
        finishPlayback()
    }

    private func finishPlayback() {
        player = nil
        isPlaying = false
        playbackContinuation?.resume()
        playbackContinuation = nil
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in self.finishPlayback() }
    }
}
