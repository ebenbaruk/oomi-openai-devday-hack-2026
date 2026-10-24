import SwiftUI

/// The collier on the wrist: a face, one button you hold to talk, a mic light, and a settings sheet.
struct ContentView: View {
    @AppStorage("serverURL") private var serverURL = "http://localhost:3000"
    @AppStorage("accessCode") private var accessCode = ""
    @AppStorage("language") private var language = "en"

    @StateObject private var audio = AudioEngine()
    @State private var face: FaceState = .idle
    @State private var message = "Hold to ask"
    @State private var holding = false
    @State private var busy = false
    @State private var showSettings = false
    @State private var turnTask: Task<Void, Never>?

    private let shell = Color(red: 0.93, green: 0.49, blue: 0.40)
    private let button = Color(red: 0.62, green: 0.78, blue: 0.70)

    var body: some View {
        VStack(spacing: 8) {
            FaceView(state: face).frame(width: 96, height: 96)
            Text(message)
                .font(.system(size: 12, weight: .medium, design: .rounded))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .frame(height: 30)
            ZStack {
                Circle().fill(button).shadow(radius: holding ? 1 : 4)
                Image(systemName: "mic.fill").font(.system(size: 22, weight: .bold)).foregroundStyle(shell.opacity(0.9))
                Circle().stroke(Color.green, lineWidth: 3).opacity(audio.isRecording ? 1 : 0)
            }
            .frame(width: 64, height: 64)
            .scaleEffect(holding ? 0.92 : 1)
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in if !holding { press() } }
                    .onEnded { _ in release() }
            )
            .disabled(accessCode.isEmpty)
            .accessibilityLabel("Hold to talk")
        }
        .padding(.horizontal, 6)
        .background(shell.opacity(0.08))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showSettings = true } label: { Image(systemName: "gearshape") }
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(serverURL: $serverURL, accessCode: $accessCode, language: $language)
        }
        .onAppear { if accessCode.isEmpty { message = "Set the access code in settings" } }
    }

    private func press() {
        guard !accessCode.isEmpty else { return }
        holding = true
        turnTask?.cancel()
        audio.stopPlayback()
        Task {
            guard await audio.requestPermission() else { message = "Microphone not allowed"; holding = false; return }
            do {
                try audio.startRecording()
                face = .listening
                message = "Listening…"
            } catch {
                message = "Microphone unavailable"
                holding = false
            }
        }
    }

    private func release() {
        guard holding else { return }
        holding = false
        guard let file = audio.stopRecording() else { face = .idle; message = "Hold to ask"; return }
        face = .thinking
        message = "Oomi is thinking…"
        busy = true
        turnTask = Task { await runTurn(file: file) }
    }

    private func runTurn(file: URL) async {
        defer { busy = false }
        let client = TurnClient(serverURL: serverURL, accessCode: accessCode, language: language)
        do {
            let result = try await client.send(audioFile: file)
            if Task.isCancelled { return }
            switch result.kind {
            case .ignored:
                face = .idle
                message = "I didn't hear a question"
            case .answer, .fixed:
                message = result.text
                if let wav = result.audio?.base64 {
                    face = .speaking
                    await audio.play(wavBase64: wav)
                }
                if Task.isCancelled { return }
                face = result.face
                try? await Task.sleep(for: .seconds(2))
                if !Task.isCancelled && !holding { face = .idle; message = "Hold to ask" }
            }
        } catch {
            face = .idle
            message = error.localizedDescription
        }
    }
}

struct SettingsView: View {
    @Binding var serverURL: String
    @Binding var accessCode: String
    @Binding var language: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            Section("Server") {
                TextField("https://oomi.vercel.app", text: $serverURL)
                TextField("Access code", text: $accessCode)
            }
            Section("Language") {
                Picker("Language", selection: $language) {
                    Text("English").tag("en")
                    Text("Français").tag("fr")
                }
            }
            Button("Done") { dismiss() }
        }
    }
}

#Preview { ContentView() }
