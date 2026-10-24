import SwiftUI

/// Oomi's eyes. Same eight states as the web simulator (doc/oomi-concepts/04-oomi-expressions.png).
struct FaceView: View {
    let state: FaceState
    @State private var blink = false
    @State private var bounce = false

    private let screen = Color(red: 0.11, green: 0.15, blue: 0.25)
    private let eye = Color(red: 0.98, green: 0.96, blue: 0.90)
    private let pupil = Color(red: 0.11, green: 0.15, blue: 0.25)

    var body: some View {
        ZStack {
            Circle().fill(screen)
            HStack(spacing: 14) {
                eyeView(left: true)
                eyeView(left: false)
            }
            .offset(y: state == .speaking && bounce ? -3 : 0)
            if state == .thinking {
                HStack(spacing: 4) {
                    ForEach(0..<3, id: \.self) { _ in Circle().fill(eye).frame(width: 4, height: 4) }
                }
                .offset(y: 34)
            }
            if state == .sleep {
                Text("zzz").font(.system(size: 11, weight: .semibold, design: .rounded)).foregroundStyle(eye).offset(x: 36, y: -34)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .onAppear { startAnimations() }
        .onChange(of: state) { _, _ in startAnimations() }
        .accessibilityLabel(Text("Oomi is \(state.rawValue)"))
    }

    @ViewBuilder
    private func eyeView(left: Bool) -> some View {
        let open: CGFloat = (state == .sleep || (state == .idle && blink)) ? 0.12 : 1
        switch state {
        case .happy:
            Capsule().fill(eye).frame(width: 26, height: 7).rotationEffect(.degrees(left ? 15 : -15)).offset(y: -4)
        case .grownUp where !left:
            Capsule().fill(eye).frame(width: 24, height: 6).rotationEffect(.degrees(-12))
        case .sleep:
            Capsule().fill(eye).frame(width: 26, height: 6).rotationEffect(.degrees(left ? -10 : 10))
        default:
            ZStack {
                Ellipse().fill(eye).frame(width: state == .listening ? 26 : 22, height: (state == .listening ? 36 : 30) * open)
                if open > 0.5 {
                    Circle().fill(pupil).frame(width: state == .curious && !left ? 10 : 8)
                        .offset(x: state == .thinking ? 4 : 0, y: state == .thinking ? -7 : 2)
                }
            }
            .scaleEffect(state == .curious && !left ? 1.25 : 1)
        }
    }

    private func startAnimations() {
        blink = false
        bounce = false
        if state == .idle {
            withAnimation(.easeInOut(duration: 0.18).repeatForever(autoreverses: true).delay(2.5)) { blink = true }
        }
        if state == .speaking {
            withAnimation(.easeInOut(duration: 0.22).repeatForever(autoreverses: true)) { bounce = true }
        }
    }
}

#Preview {
    VStack { FaceView(state: .listening).frame(width: 120) }
}
