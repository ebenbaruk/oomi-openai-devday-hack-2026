import SwiftUI
import WatchKit

enum OomiMood: String, CaseIterable, Identifiable {
    case resting = "Au repos", listening = "J'écoute", thinking = "Je réfléchis", speaking = "Je raconte", happy = "Bravo"
    var id: String { rawValue }
}

struct OomiWatchHome: View {
    @State private var mood: OomiMood = .resting
    @State private var isHolding = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 7) {
                Text(mood == .resting ? "oomi" : mood.rawValue)
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.76))

                OomiFace(mood: mood)
                    .frame(width: 104, height: 104)
                    .accessibilityLabel("Oomi est \(mood.rawValue.lowercased())")

                Text(message)
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.white.opacity(0.68))
                    .frame(maxWidth: 145)
                    .lineLimit(2)

                Button(action: {}) {
                    Label(isHolding ? "Parlez…" : "Maintenir pour parler", systemImage: "mic.fill")
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

    private var message: String {
        switch mood {
        case .resting: "Une grande découverte commence par une petite question."
        case .listening: "Je t’écoute."
        case .thinking: "Je prépare une idée sûre."
        case .speaking: "Voici une piste à explorer."
        case .happy: "Bien joué, explorateur !"
        }
    }

    private func startTalking() {
        guard !isHolding else { return }
        isHolding = true; mood = .listening
        WKInterfaceDevice.current().play(.click)
    }

    private func stopTalking() {
        guard isHolding else { return }
        isHolding = false; mood = .thinking
        WKInterfaceDevice.current().play(.directionUp)
        // Next step: record a bounded audio clip, POST it to /api/watch/turn,
        // then move through speaking and happy only after server approval.
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
            .scaleEffect(pressed ? 0.96 : 1)
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

#Preview {
    OomiWatchHome()
}
