import SwiftUI
import WatchKit
import AVFoundation
import Combine
import UIKit

enum OomiMood: String, CaseIterable, Identifiable {
    case resting = "Au repos", listening = "J'écoute", thinking = "Je réfléchis", speaking = "Je raconte", happy = "Bravo", grownUp = "Parlons-en", declined = "Restons en sécurité", problem = "Un instant"
    var id: String { rawValue }
}

private let defaultOomiServerURL = "https://oomi-openai-devday-hack-2026-git-feat-pare-eb0c0c-akramedn-3275.vercel.app"

struct OomiWatchHome: View {
    @Environment(\.scenePhase) private var scenePhase
    @State private var mood: OomiMood = .resting
    @State private var isHolding = false
    @State private var message = "Une grande découverte commence par une petite question."
    @State private var captureTimeoutTask: Task<Void, Never>?
    @State private var showingSettings = false
    @State private var mascot = WatchMascot.cached()
    @AppStorage("oomiServerURL") private var serverURL = defaultOomiServerURL
    @AppStorage("oomiPairingCode") private var pairingCode = ""
    @StateObject private var recorder = WatchAudioRecorder()
    @StateObject private var feedback = WatchFeedback()

    var body: some View {
        ZStack {
            Color(hex: mascot.config.backgroundColor).ignoresSafeArea()
            VStack(spacing: 7) {
                HStack(spacing: 5) {
                    Text(mood == .resting ? mascot.config.name.lowercased() : mood.rawValue)
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
                    OomiFace(mood: mood, mascot: mascot)
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

                PushToTalkControl(
                    holding: isHolding,
                    start: startTalking,
                    stop: { stopTalking(timedOut: false) }
                )
            }
            .padding(.horizontal, 14)
        }
        .onAppear {
            // Old builds let a truncated URL get saved. The hackathon build always uses the live demo server.
            if serverURL != defaultOomiServerURL { serverURL = defaultOomiServerURL }
            WKInterfaceDevice.current().play(.start)
        }
        // The dashboard is the source of truth for the family character.  Keep the
        // foreground Watch in sync without asking a parent to pair again or start a chat.
        .task(id: "\(serverURL)|\(pairingCode)") {
            await refreshMascot()
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(15))
                guard !Task.isCancelled else { return }
                await refreshMascot()
            }
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            Task { await refreshMascot() }
        }
        .sheet(isPresented: $showingSettings) {
            WatchSettings(serverURL: $serverURL, pairingCode: $pairingCode, refreshMascot: refreshMascot)
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
                captureTimeoutTask?.cancel()
                captureTimeoutTask = Task {
                    try? await Task.sleep(for: .seconds(10))
                    guard !Task.isCancelled, isHolding else { return }
                    stopTalking(timedOut: true)
                }
            } catch {
                isHolding = false
                showProblem(error.localizedDescription)
            }
        }
    }

    private func stopTalking(timedOut: Bool = false) {
        guard isHolding else { return }
        isHolding = false
        captureTimeoutTask?.cancel()
        captureTimeoutTask = nil
        guard let audioURL = recorder.stop() else {
            mood = .resting
            message = "Maintenez le bouton quand vous êtes prêt."
            return
        }
        mood = .thinking
        message = timedOut ? "J'ai gardé les 10 premières secondes." : "Je prépare une réponse sûre."
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
        mascot = turn.mascot
        mascot.cache()
        message = turn.text
        mood = switch turn.state {
        case "happy": .happy
        case "grown_up": .grownUp
        case "decline": .declined
        default: .problem
        }
        guard let encodedAudio = turn.audioBase64, let audio = Data(base64Encoded: encodedAudio) else {
            showProblem("Je n'ai pas pu préparer ma voix. Réessaie dans un instant.")
            return
        }
        do { try feedback.playOpenAIAudio(audio) }
        catch { showProblem("Je n'arrive pas à lire ma réponse.") }
        WKInterfaceDevice.current().play(turn.verdict == "answer" ? .success : .notification)
    }

    private func showProblem(_ text: String) {
        mood = .problem
        message = text
        WKInterfaceDevice.current().play(.failure)
    }

    private func refreshMascot() async {
        guard !serverURL.isEmpty,
              WatchCredentialStore.token() != nil || pairingCode.filter(\.isNumber).count == 6 else { return }
        do {
            let profile = try await WatchAPI().profile(serverURL: serverURL, pairingCode: pairingCode)
            mascot = profile.mascot
            mascot.cache()
            if profile.deviceToken != nil {
                pairingCode = ""
                message = "Connecté à l'espace de \(profile.childName)."
            }
        } catch {
            // The existing cached identity stays visible when the Watch is offline.
        }
    }
}

@MainActor
private final class WatchFeedback: ObservableObject {
    private var player: AVAudioPlayer?
    func playOpenAIAudio(_ audio: Data) throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default)
        try session.setActive(true)
        let player = try AVAudioPlayer(data: audio)
        player.prepareToPlay()
        player.play()
        self.player = player
    }
}

private struct WatchSettings: View {
    @Binding var serverURL: String
    @Binding var pairingCode: String
    @Environment(\.dismiss) private var dismiss
    @State private var draftPairingCode = ""
    let refreshMascot: () async -> Void

    var body: some View {
        Form {
            Section("Serveur Oomi") {
                Label("Serveur de démo Oomi", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                Text("Il est déjà configuré sur cette Watch.")
                    .font(.footnote)
            }
            Section("Code de jumelage") {
                TextField("Code à 6 chiffres", text: $draftPairingCode)
                Text("Créez ce code dans Réglages > Apple Watch sur le dashboard parent.")
                    .font(.footnote)
            }
            Button("Enregistrer la connexion") {
                serverURL = defaultOomiServerURL
                // A fresh parent code is an explicit reconnection request. It must replace
                // any credential left by an earlier, revoked pairing.
                WatchCredentialStore.clear()
                pairingCode = draftPairingCode.filter(\.isNumber)
                dismiss()
                Task { await refreshMascot() }
            }
            .disabled(!canSave)
        }
        .navigationTitle("Connexion")
        .onAppear {
            draftPairingCode = pairingCode
        }
    }

    private var canSave: Bool {
        return draftPairingCode.filter(\.isNumber).count == 6
    }
}

private struct PushToTalkControl: View {
    let holding: Bool
    let start: () -> Void
    let stop: () -> Void

    var body: some View {
        Label(holding ? "J'écoute…" : "Maintenir pour parler", systemImage: holding ? "waveform" : "mic.fill")
            .font(.system(size: 12, weight: .bold, design: .rounded))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(holding ? Color(red: 0.94, green: 0.48, blue: 0.36) : Color(red: 0.61, green: 0.78, blue: 0.68))
            .foregroundStyle(Color(red: 0.08, green: 0.16, blue: 0.17))
            .clipShape(Capsule())
            .scaleEffect(holding ? 0.93 : 1)
            .shadow(color: holding ? Color(red: 0.94, green: 0.48, blue: 0.36).opacity(0.8) : .clear, radius: 9)
            .animation(.spring(duration: 0.22), value: holding)
            .contentShape(Capsule())
            .gesture(DragGesture(minimumDistance: 0)
                .onChanged { _ in start() }
                .onEnded { _ in stop() })
            .accessibilityAddTraits(.isButton)
            .accessibilityLabel("Maintenir pour parler")
            .accessibilityValue(holding ? "Oomi écoute" : "Prêt")
            .accessibilityHint("Maintenez, posez une question, puis relâchez")
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
    let mascot: WatchMascot

    var body: some View {
        ZStack {
            if mood == .resting, let image = portraitImage {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 100, height: 100)
                    .clipShape(RoundedRectangle(cornerRadius: 33, style: .continuous))
            } else {
                MascotBody(species: mascot.config.species, color: Color(hex: mascot.config.bodyColor))
                RoundedRectangle(cornerRadius: 31, style: .continuous)
                    .fill(Color(red: 0.06, green: 0.12, blue: 0.20))
                    .frame(width: 76, height: 59)
                    .offset(y: -9)
                HStack(spacing: mood == .thinking ? 17 : 21) {
                    MascotEye(style: mascot.config.eyes, mood: mood, right: false)
                    MascotEye(style: mascot.config.eyes, mood: mood, right: true)
                }
                .offset(y: -9)
                if mascot.config.cheeks {
                    HStack(spacing: 42) {
                        Circle().fill(Color.white.opacity(0.28)).frame(width: 10, height: 6)
                        Circle().fill(Color.white.opacity(0.28)).frame(width: 10, height: 6)
                    }
                    .offset(y: 13)
                }
                MascotMouth(style: mascot.config.mouth, mood: mood)
                    .offset(y: 14)
                Circle().fill(Color(hex: mascot.config.accentColor)).frame(width: 26, height: 26).offset(y: 31)
                MascotAccessory(style: mascot.config.accessory, color: Color(hex: mascot.config.accentColor))
            }
            Circle().fill(mood == .listening ? .green : .clear).frame(width: 4, height: 4).offset(x: 35, y: 35)
        }
        .shadow(color: .black.opacity(0.28), radius: 7, y: 5)
        .animation(.spring(duration: 0.3), value: mood)
    }

    private var portraitImage: UIImage? {
        guard let portrait = mascot.portrait, let data = Data(base64Encoded: portrait.base64) else { return nil }
        return UIImage(data: data)
    }
}

private struct MascotBody: View {
    let species: String
    let color: Color

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: species == "robot" ? 23 : 42, style: .continuous).fill(color)
            if species == "cat" || species == "bear" {
                HStack(spacing: 42) { Circle().fill(color).frame(width: 29, height: 29); Circle().fill(color).frame(width: 29, height: 29) }
                    .offset(y: -41)
            }
            if species == "bunny" {
                HStack(spacing: 28) { Capsule().fill(color).frame(width: 18, height: 46); Capsule().fill(color).frame(width: 18, height: 46) }
                    .offset(y: -50)
            }
            if species == "frog" || species == "octopus" {
                HStack(spacing: 37) { Circle().fill(color).frame(width: 25, height: 25); Circle().fill(color).frame(width: 25, height: 25) }
                    .offset(y: -34)
            }
            if species == "cloud" { Circle().fill(color).frame(width: 57, height: 57).offset(x: -26, y: 8) }
            if species == "ghost" { Capsule().fill(color).frame(width: 92, height: 81).offset(y: 8) }
        }
        .frame(width: 100, height: 100)
    }
}

private struct MascotEye: View {
    let style: String
    let mood: OomiMood
    let right: Bool

    var body: some View {
        Group {
            if style == "sleepy" {
                Capsule().fill(Color(red: 1, green: 0.97, blue: 0.83)).frame(width: 16, height: 4)
            } else if style == "sparkle" {
                Image(systemName: "sparkle").font(.system(size: 18, weight: .bold)).foregroundStyle(Color(red: 1, green: 0.97, blue: 0.83))
            } else {
                Capsule()
                    .fill(Color(red: 1, green: 0.97, blue: 0.83))
                    .frame(width: style == "dots" ? 11 : (mood == .happy ? 17 : 15), height: style == "dots" ? 11 : eyeHeight)
                    .overlay(Circle().fill(Color(red: 0.06, green: 0.12, blue: 0.20)).frame(width: 6, height: 6).offset(x: right ? 2 : -2, y: mood == .thinking ? -2 : 1))
            }
        }
        .rotationEffect(mood == .happy ? .degrees(right ? 14 : -14) : .zero)
    }

    private var eyeHeight: CGFloat { switch mood { case .thinking: 19; case .happy: 10; case .listening: 29; default: style == "ovals" ? 29 : 25 } }
}

private struct MascotMouth: View {
    let style: String
    let mood: OomiMood
    var body: some View {
        Group {
            if style == "open" || mood == .speaking { Circle().fill(Color(red: 0.06, green: 0.12, blue: 0.20)).frame(width: 11, height: 15) }
            else if style == "smile" { Capsule().stroke(Color(red: 0.06, green: 0.12, blue: 0.20), lineWidth: 2).frame(width: 18, height: 8).clipShape(Rectangle().offset(y: -4)) }
            else if style == "cat" { Text("ᴗ").font(.system(size: 18, weight: .bold)).foregroundStyle(Color(red: 0.06, green: 0.12, blue: 0.20)) }
        }
    }
}

private struct MascotAccessory: View {
    let style: String
    let color: Color
    var body: some View {
        Group {
            switch style {
            case "cap": Capsule().fill(color).frame(width: 44, height: 12).offset(y: -45)
            case "bow": Image(systemName: "bowtie.fill").font(.system(size: 17)).foregroundStyle(color).offset(y: -41)
            case "crown": Image(systemName: "crown.fill").font(.system(size: 19)).foregroundStyle(color).offset(y: -49)
            case "glasses": Image(systemName: "eyeglasses").font(.system(size: 31, weight: .bold)).foregroundStyle(color).offset(y: -10)
            case "headphones": Image(systemName: "headphones").font(.system(size: 42)).foregroundStyle(color)
            case "leaf": Image(systemName: "leaf.fill").font(.system(size: 18)).foregroundStyle(color).offset(x: 31, y: -34)
            case "scarf": Capsule().fill(color).frame(width: 68, height: 9).offset(y: 42)
            default: EmptyView()
            }
        }
    }
}

private extension Color {
    init(hex: String) {
        let value = UInt64(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) ?? 0x1b1f3b
        self.init(.sRGB, red: Double((value >> 16) & 0xFF) / 255, green: Double((value >> 8) & 0xFF) / 255, blue: Double(value & 0xFF) / 255, opacity: 1)
    }
}
