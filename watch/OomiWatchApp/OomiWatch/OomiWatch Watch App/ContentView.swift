import SwiftUI
import WatchKit
import AVFoundation
import Combine

enum OomiMood: String, CaseIterable, Identifiable {
    case resting = "Au repos", listening = "J'écoute", thinking = "Je réfléchis", speaking = "Je raconte", happy = "Bravo", grownUp = "Parlons-en", declined = "Restons en sécurité", problem = "Un instant"
    var id: String { rawValue }
}
struct OomiWatchHome: View {
    @State private var mood: OomiMood = .resting
    @State private var isHolding = false
    @State private var message = "Une grande découverte commence par une petite question."
    @State private var showingSettings = false
    @AppStorage("oomiServerURL") private var serverURL = ""
    @AppStorage("oomiPairingCode") private var pairingCode = ""
    @StateObject private var recorder = WatchAudioRecorder()
    @StateObject private var feedback = WatchFeedback()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 7) {
                HStack(spacing: 5) {
                    Text(mood == .resting ? "oomi" : mood.rawValue)
                    Button { showingSettings = true } label: {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Configurer Oomi")
                }
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundStyle(.white.opacity(0.76))

                ZStack {
                    ListeningHalo(active: isHolding)
                    OomiFace(mood: mood)
                        .frame(width: 104, height: 104)
                }
                .frame(width: 126, height: 112)
                .accessibilityLabel("Oomi est \(mood.rawValue.lowercased())")

                Text(message)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white.opacity(0.68))
                    .frame(maxWidth: 145)
                    .lineLimit(2)

                Button(action: {}) {
                    Label(isHolding ? "J'écoute…" : "Maintenir pour parler", systemImage: isHolding ? "waveform" : "mic.fill")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(PushToTalkStyle(pressed: isHolding))
                .gesture(DragGesture(minimumDistance: 0)
                    .onChanged { _ in startTalking() }
                    .onEnded { _ in stopTalking() })
                .accessibilityHint("Maintenez le bouton, posez une question, puis relâchez")
            }
            .padding(.horizontal, 14)
        }
        .onAppear { WKInterfaceDevice.current().play(.start) }
        .sheet(isPresented: $showingSettings) {
            WatchSettings(serverURL: $serverURL, pairingCode: $pairingCode)
        }
        #if DEBUG
        .safeAreaInset(edge: .bottom) {
            Picker("Aperçu", selection: $mood) {
                ForEach(OomiMood.allCases) { Text($0.rawValue).tag($0) }
            }
            .labelsHidden()
            .pickerStyle(.wheel)
            .frame(height: 28)
            .opacity(0.001)
            .accessibilityLabel("Changer l’expression en aperçu")
        }
        #endif
    }

    private func startTalking() {
        guard !isHolding else { return }
        isHolding = true
        mood = .listening
        message = "Je t'écoute. Relâchez pour envoyer."
        WKInterfaceDevice.current().play(.click)
        Task {
            do {
                try await recorder.start()
                guard isHolding else { recorder.discard(); return }
            } catch {
                isHolding = false
                showProblem(error.localizedDescription)
            }
        }
    }

    private func stopTalking() {
        guard isHolding else { return }
        isHolding = false
        guard let audioURL = recorder.stop() else {
            mood = .resting
            message = "Maintenez le bouton quand vous êtes prêt."
            return
        }
        mood = .thinking
        message = "Je prépare une réponse sûre."
        WKInterfaceDevice.current().play(.directionUp)
        Task {
            do {
                let turn = try await WatchAPI().send(audioURL: audioURL, serverURL: serverURL, pairingCode: pairingCode)
                try? FileManager.default.removeItem(at: audioURL)
                show(turn)
            } catch {
                try? FileManager.default.removeItem(at: audioURL)
                showProblem(error.localizedDescription)
            }
        }
    }

    private func show(_ turn: WatchTurn) {
        message = turn.text
        mood = switch turn.state {
        case "happy": .happy
        case "grown_up": .grownUp
        case "decline": .declined
        default: .problem
        }
        feedback.speak(turn.text, french: true)
        WKInterfaceDevice.current().play(turn.verdict == "answer" ? .success : .notification)
    }

    private func showProblem(_ text: String) {
        mood = .problem
        message = text
        WKInterfaceDevice.current().play(.failure)
    }
}

@MainActor
private final class WatchFeedback: ObservableObject {
    private let synthesizer = AVSpeechSynthesizer()
    func speak(_ text: String, french: Bool) {
        synthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: french ? "fr-FR" : "en-US")
        utterance.rate = 0.48
        synthesizer.speak(utterance)
    }
}

private struct WatchSettings: View {
    @Binding var serverURL: String
    @Binding var pairingCode: String
    var body: some View {
        Form {
            TextField("https://oomi.vercel.app", text: $serverURL)
                .textInputAutocapitalization(.never)
            TextField("Code à 6 chiffres", text: $pairingCode)
            Text("L'adresse doit être publique et sécurisée. Le code est créé depuis le dashboard parent.")
                .font(.footnote)
        }
        .navigationTitle("Connexion")
    }
}

private struct PushToTalkStyle: ButtonStyle {
    let pressed: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.vertical, 10)
            .background(pressed ? Color(red: 0.94, green: 0.48, blue: 00.36) : Color(red: 0.61, green: 0.78, blue: 00.68))
            .foregroundStyle(Color(red: 0.08, green: 0.16, blue: 0.17))
            .clipShape(Capsule())
            .scaleEffect(pressed ? 0.93 : (configuration.isPressed ? 0.96 : 1))
            .shadow(color: pressed ? Color(red: 0.94, green: 0.48, blue: 00.36).opacity(0.8) : .clear, radius: 9)
            .animation(.spring(duration: 0.22), value: pressed)
    }
}

private struct ListeningHalo: View {
    let active: Bool
    @State private var pulsing = false

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .stroke(Color(red: 0.60, green: 0.78, blue: 0.68).opacity(0.62 - Double(index) * 0.16), lineWidth: 1.5)
                    .frame(width: 106 + CGFloat(index * 9), height: 106 + CGFloat(index * 9))
                    .scaleEffect(active && pulsing ? 1.12 : 0.84)
                    .opacity(active ? 1 : 0)
            }
        }
        .onAppear { updatePulse() }
        .onChange(of: active) { _, _ in updatePulse() }
    }

    private func updatePulse() {
        guard active else { pulsing = false; return }
        pulsing = false
        withAnimation(.easeInOut(duration: 0.85).repeatForever(autoreverses: true)) {
            pulsing = true
        }
    }
}

struct OomiFace: View {
    let mood: OomiMood
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 42, style: .continuous)
                .fill(Color(red: 0.95, green: 0.48, blue: 00.36))
                .overlay(alignment: .top) { Capsule().fill(Color(red: 0.95, green: 0.48, blue: 00.36)).frame(width: 22, height: 15).offset(y: -7) }
            RoundedRectangle(cornerRadius: 31, style: .continuous)
                .fill(Color(red: 0.06, green: 0.12, blue: 0.20))
                .frame(width: 76, height: 59)
                .offset(y: -9)
            HStack(spacing: mood == .thinking ? 17 : 21) {
                OomiEye(mood: mood, right: false)
                OomiEye(mood: mood, right: true)
            }
            .offset(y: -9)
            Circle().fill(Color(red: 0.60, green: 0.78, blue: 00.68)).frame(width: 26, height: 26).offset(y: 31)
            Circle().fill(mood == .listening ? .green : .clear).frame(width: 4, height: 4).offset(x: 29, y: 31)
        }
        .shadow(color: .black.opacity(0.28), radius: 7, y: 5)
        .animation(.spring(duration: 0.3), value: mood)
    }
}

private struct OomiEye: View {
    let mood: OomiMood; let right: Bool
    var body: some View {
        Capsule()
            .fill(Color(red: 1, green: 0.97, blue: 0.83))
            .frame(width: mood == .happy ? 17 : 15, height: eyeHeight)
            .overlay(Circle().fill(Color(red: 0.06, green: 0.12, blue: 0.20)).frame(width: 6, height: 6).offset(x: right ? 2 : -2, y: mood == .thinking ? -2 : 1))
            .rotationEffect(mood == .happy ? .degrees(right ? 14 : -14) : .zero)
    }
    private var eyeHeight: CGFloat { switch mood { case .thinking: 19; case .happy: 10; case .listening: 29; default: 25 } }
}
